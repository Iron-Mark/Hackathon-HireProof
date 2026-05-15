import { NextResponse } from 'next/server'
import { getCursorPublicStatus, startCursorRun } from '@/lib/cursor/client'
import { validateCursorJobSecret } from '@/lib/cursor/internal-auth'
import { buildHireProofQaPrompt } from '@/lib/cursor/qa-prompt'

export const runtime = 'nodejs'

const SYSTEM_OWNER_ID = 'system:cursor-ui-qa'

export async function POST(request: Request) {
  const authError = validateCursorJobSecret(request)
  if (authError) return authError

  const status = getCursorPublicStatus()
  if (!status.operational) {
    return NextResponse.json({
      status: 'credential-required',
      message: 'Enable CURSOR_INTEGRATION_ENABLED and configure CURSOR_API_KEY before starting UI QA.',
      integration: status,
    }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const baseUrl = typeof body.baseUrl === 'string' && body.baseUrl.trim()
    ? body.baseUrl.trim()
    : process.env.APP_BASE_URL || new URL(request.url).origin

  const started = await startCursorRun({
    ownerId: SYSTEM_OWNER_ID,
    kind: 'ui-qa',
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
