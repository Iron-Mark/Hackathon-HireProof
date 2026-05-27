import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { startAuditWorkflow } from '@/lib/workflows/audit-workflow'
import { getWorkflowSecretStatus, validateWorkflowSecretHeader } from '@/lib/workflow-secret'
import { readJsonRequest } from '@/lib/request-security'
import { validateWebhookUrl, WebhookUrlValidationError } from '@/lib/webhook-url-security'

export const runtime = 'nodejs'
const WORKFLOW_PAYLOAD_LIMIT_BYTES = 64 * 1024

function workflowCredentialsReady() {
  return getWorkflowSecretStatus().valid
}

function getTrustedInternalBaseUrl() {
  return (process.env.APP_BASE_URL || 'http://127.0.0.1:3002').replace(/\/$/, '')
}

export async function GET() {
  const ready = workflowCredentialsReady()

  return NextResponse.json(
    {
      status: 'Vercel Workflow handoff for durable async job-post investigations.',
      track: 'Vercel Workflow',
      readiness: {
        ready,
        state: ready ? 'ready' : 'credential-gated',
      },
      usage: {
        method: 'POST',
        headers: { 'x-workflow-secret': 'required' },
        body: {
          text: 'Suspicious job post text',
          webhook_url: 'https://example.com/hireproof-callback',
        },
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: Request) {
  const workflowSecretStatus = getWorkflowSecretStatus()

  if (!workflowSecretStatus.valid) {
    return NextResponse.json({
      status: workflowSecretStatus.present ? 'credential-misconfigured' : 'credential-required',
      track: 'Vercel Workflow',
      error: workflowSecretStatus.present
        ? 'Workflow protection must use a private high-entropy value before workflow runs can be accepted.'
        : 'Workflow protection must be configured before workflow runs can be accepted.',
    }, { status: 503 })
  }

  if (!validateWorkflowSecretHeader(request)) {
    return NextResponse.json({ error: 'Invalid workflow secret.' }, { status: 401 })
  }

  const parsedJson = await readJsonRequest(request, WORKFLOW_PAYLOAD_LIMIT_BYTES, 'Workflow payload')
  if (!parsedJson.ok) return parsedJson.response

  const body = parsedJson.value
  const text = typeof body.text === 'string' ? body.text.trim() : ''

  if (!text) {
    return NextResponse.json({ error: 'Missing text for workflow investigation.' }, { status: 400 })
  }

  const baseUrl = getTrustedInternalBaseUrl()
  let callbackUrl: string | null = null
  if (typeof body.webhook_url === 'string' && body.webhook_url.trim()) {
    try {
      callbackUrl = await validateWebhookUrl(body.webhook_url)
    } catch (error) {
      if (error instanceof WebhookUrlValidationError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Invalid webhook URL format.' }, { status: 400 })
    }
  }

  const workflowInput = {
    text,
    baseUrl,
    callbackUrl,
  }

  try {
    const run = await start(startAuditWorkflow, [workflowInput])

    return NextResponse.json({
      status: 'accepted',
      track: 'Vercel Workflow',
      runId: run.runId,
      message: 'Workflow run accepted by WDK.',
      durableWorkflow: {
        sourceEndpoint: '/api/workflows/audit',
        callbackUrl: workflowInput.callbackUrl,
        reportBaseUrl: `${baseUrl.replace(/\/$/, '')}/audit/[id]`,
      },
    }, { status: 202 })
  } catch (error) {
    return NextResponse.json({
      status: 'credential-ready-runner-unavailable',
      track: 'Vercel Workflow',
      error: error instanceof Error ? error.message : 'Unable to start workflow run.',
    }, { status: 503 })
  }
}
