import { NextResponse } from 'next/server'
import { getCursorPublicStatus, startCursorRun } from '@/lib/cursor/client'
import { validateCursorJobSecret } from '@/lib/cursor/internal-auth'
import { CURSOR_DEVELOPER_PRESETS } from '@/lib/cursor/presets'

export const runtime = 'nodejs'

const SYSTEM_OWNER_ID = 'system:cursor-nightly'

export async function GET(request: Request) {
  const authError = validateCursorJobSecret(request)
  if (authError) return authError

  const status = getCursorPublicStatus()
  if (!status.operational) {
    return NextResponse.json({
      status: 'credential-required',
      message: 'Enable CURSOR_INTEGRATION_ENABLED and configure CURSOR_API_KEY before scheduling nightly repo health.',
      integration: status,
    }, { status: 503 })
  }

  const started = await startCursorRun({
    ownerId: SYSTEM_OWNER_ID,
    kind: 'nightly-repo-health',
    preset: 'repo-health',
    prompt: CURSOR_DEVELOPER_PRESETS['repo-health'].buildPrompt(),
    runtime: 'cloud',
  })

  if (!started.ok || !started.run) {
    return NextResponse.json({
      error: started.reason || 'Could not start nightly repo health run.',
      integration: status,
    }, { status: 502 })
  }

  return NextResponse.json({
    ok: true,
    runId: started.run.cursorRunId || started.run.id,
    agentId: started.run.cursorAgentId,
    recordId: started.run.id,
    integration: status,
  }, { status: 202 })
}
