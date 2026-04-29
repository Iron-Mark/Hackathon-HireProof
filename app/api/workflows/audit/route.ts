import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { startAuditWorkflow } from '@/lib/workflows/audit-workflow'

export const runtime = 'nodejs'

function workflowCredentialsReady() {
  return Boolean(process.env.WORKFLOW_SECRET)
}

export async function GET() {
  return NextResponse.json({
    status: 'Vercel Workflow handoff for durable async job-post investigations.',
    track: 'Vercel Workflow',
    credentialStatus: {
      workflowSecret: workflowCredentialsReady(),
    },
    usage: {
      method: 'POST',
      headers: { 'x-workflow-secret': 'required when WORKFLOW_SECRET is set' },
      body: {
        text: 'Suspicious job post text',
        webhook_url: 'https://example.com/hireproof-callback',
      },
    },
  })
}

export async function POST(request: Request) {
  if (process.env.WORKFLOW_SECRET && request.headers.get('x-workflow-secret') !== process.env.WORKFLOW_SECRET) {
    return NextResponse.json({ error: 'Invalid workflow secret.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const text = typeof body.text === 'string' ? body.text.trim() : ''

  if (!text) {
    return NextResponse.json({ error: 'Missing text for workflow investigation.' }, { status: 400 })
  }

  const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin
  const workflowInput = {
    text,
    baseUrl,
    callbackUrl: typeof body.webhook_url === 'string' ? body.webhook_url : null,
  }

  if (workflowCredentialsReady()) {
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

  return NextResponse.json({
    status: 'credential-required',
    track: 'Vercel Workflow',
    message: 'Workflow route is implemented with WDK startAuditWorkflow plumbing. Set WORKFLOW_SECRET and deploy with Vercel Workflow before verifying live durable execution.',
    durableWorkflow: {
      intendedRunner: 'Vercel Workflow',
      sourceEndpoint: '/api/workflows/audit',
      existingAsyncFallback: '/api/v1/audit with webhook_url',
      callbackUrl: workflowInput.callbackUrl,
      reportBaseUrl: `${baseUrl.replace(/\/$/, '')}/audit/[id]`,
    },
  }, { status: 202 })
}
