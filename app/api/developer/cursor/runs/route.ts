import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserFromSessionToken } from '@/lib/auth-store'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp, validateMutationOrigin } from '@/lib/request-security'
import { getCursorPublicStatus, startCursorRun } from '@/lib/cursor/client'
import { resolveDeveloperPresetPrompt } from '@/lib/cursor/presets'
import { listRunsForOwner } from '@/lib/cursor/run-store'
import type { CursorRunRuntime } from '@/lib/cursor/types'

export const runtime = 'nodejs'

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

async function validateCursorRunRateLimit(request: Request, userId: string) {
  const result = await checkRateLimit(`cursor_runs:${userId}:${requestIp(request)}`, {
    limit: 6,
    windowMs: 10 * 60 * 1000,
  })

  if (result.success) return null

  const retryAfter = 'retryAfterMs' in result ? Math.ceil((result as { retryAfterMs: number }).retryAfterMs / 1000) : 600
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

function parseRuntime(value: unknown): CursorRunRuntime | undefined {
  if (value === 'local' || value === 'cloud') return value
  return undefined
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  return NextResponse.json({
    status: getCursorPublicStatus(),
    runs: await listRunsForOwner(user.id),
    presets: Object.entries({
      'docs-drift': 'Docs drift review',
      'repo-health': 'Repo health check',
      'qa-walkthrough': 'UI QA walkthrough',
    }).map(([id, label]) => ({ id, label })),
  })
}

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const rateLimitError = await validateCursorRunRateLimit(request, user.id)
  if (rateLimitError) return rateLimitError

  const body = await request.json().catch(() => ({}))
  const preset = typeof body.preset === 'string' ? body.preset : 'custom'
  const baseUrl = typeof body.baseUrl === 'string' && body.baseUrl.trim()
    ? body.baseUrl.trim()
    : process.env.APP_BASE_URL || new URL(request.url).origin

  let prompt: string
  try {
    prompt = resolveDeveloperPresetPrompt(preset, {
      baseUrl,
      customPrompt: typeof body.prompt === 'string' ? body.prompt : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Cursor run request.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const started = await startCursorRun({
    ownerId: user.id,
    prompt,
    preset,
    runtime: parseRuntime(body.runtime),
    kind: 'developer',
  })

  if (started.disabled) {
    return NextResponse.json({
      status: 'disabled',
      message: started.reason,
      integration: getCursorPublicStatus(),
    }, { status: 503 })
  }

  if (!started.ok || !started.run) {
    return NextResponse.json({
      error: started.reason || 'Could not start Cursor run.',
      integration: getCursorPublicStatus(),
    }, { status: started.reason?.includes('concurrent') ? 429 : 502 })
  }

  return NextResponse.json({
    status: 'accepted',
    run: started.run,
    integration: getCursorPublicStatus(),
  }, { status: 202 })
}
