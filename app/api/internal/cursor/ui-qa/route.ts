import { NextResponse } from 'next/server'
import { getCursorPublicStatus, startCursorRun } from '@/lib/cursor/client'
import { validateCursorJobSecret } from '@/lib/cursor/internal-auth'
import { buildHireProofQaPrompt } from '@/lib/cursor/qa-prompt'
import { resolveCursorQaBaseUrl } from '@/lib/cursor/qa-target'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp } from '@/lib/request-security'

export const runtime = 'nodejs'

const SYSTEM_OWNER_ID = 'system:cursor-ui-qa'
const CURSOR_JOB_PAYLOAD_LIMIT_BYTES = 32 * 1024
const jobName = 'ui-qa'

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit(`cursor_internal_job:${jobName}:${requestIp(request)}`, { limit: 10, windowMs: 60000 })
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
  }

  const authError = validateCursorJobSecret(request)
  if (authError) return authError

  const parsedJson = await readJsonRequest(request, CURSOR_JOB_PAYLOAD_LIMIT_BYTES, 'Cursor job payload')
  if (!parsedJson.ok) return parsedJson.response

  const status = getCursorPublicStatus()
  if (!status.operational) {
    return NextResponse.json({
      status: 'credential-required',
      message: 'Enable CURSOR_INTEGRATION_ENABLED and configure CURSOR_API_KEY before starting UI QA.',
      integration: status,
    }, { status: 503 })
  }

  const body = parsedJson.value
  let baseUrl: string
  try {
    baseUrl = resolveCursorQaBaseUrl(body.baseUrl, request.url)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Cursor QA target.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const started = await startCursorRun({
    ownerId: SYSTEM_OWNER_ID,
    kind: jobName,
    preset: 'qa-walkthrough',
    prompt: buildHireProofQaPrompt(baseUrl),
    runtime: 'cloud',
  })

  if (!started.ok || !started.run) {
    return NextResponse.json({
      error: started.reason || 'Could not start UI QA run.',
      integration: status,
    }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    baseUrl,
    runId: started.run.cursorRunId || started.run.id,
    agentId: started.run.cursorAgentId,
    recordId: started.run.id,
    integration: status,
  }, { status: 202 })
}
