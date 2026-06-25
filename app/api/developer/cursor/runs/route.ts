import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { isOperatorUser } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'
import { getCursorPublicStatus, startCursorRun } from '@/lib/cursor/client'
import { resolveDeveloperPresetPrompt } from '@/lib/cursor/presets'
import { resolveCursorQaBaseUrl } from '@/lib/cursor/qa-target'
import { listRunsForOwner } from '@/lib/cursor/run-store'
import type { CursorRunRuntime } from '@/lib/cursor/types'

export const runtime = 'nodejs'
const CURSOR_RUN_PAYLOAD_LIMIT_BYTES = 32 * 1024

async function validateCursorRunRateLimit(request: Request, userId: string) {
  const result = await checkRateLimit(`cursor_runs:${userId}:${requestIp(request)}`, {
    limit: 6,
    windowMs: 10 * 60 * 1000,
  })

  if (result.success) return null

  const retryAfter = 'retryAfterMs' in result ? Math.ceil((result as { retryAfterMs: number }).retryAfterMs / 1000) : 600
  return noStoreJson(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

function parseRuntime(value: unknown): CursorRunRuntime | undefined {
  if (value === 'local' || value === 'cloud') return value
  return undefined
}

export async function GET() {
  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (!isOperatorUser(user)) return noStoreJson({ error: 'Operator access required.' }, { status: 403 })

  return noStoreJson({
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

  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (!isOperatorUser(user)) return noStoreJson({ error: 'Operator access required.' }, { status: 403 })
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot start developer runs.' }, { status: 403 })
  }

  const rateLimitError = await validateCursorRunRateLimit(request, user.id)
  if (rateLimitError) return rateLimitError

  const parsedJson = await readJsonRequest(request, CURSOR_RUN_PAYLOAD_LIMIT_BYTES, 'Cursor run payload')
  if (!parsedJson.ok) return parsedJson.response

  const body = parsedJson.value
  const preset = typeof body.preset === 'string' ? body.preset : 'custom'
  let baseUrl: string
  try {
    baseUrl = resolveCursorQaBaseUrl(body.baseUrl, request.url)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Cursor QA target.'
    return noStoreJson({ error: message }, { status: 400 })
  }

  let prompt: string
  try {
    prompt = resolveDeveloperPresetPrompt(preset, {
      baseUrl,
      customPrompt: typeof body.prompt === 'string' ? body.prompt : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid Cursor run request.'
    return noStoreJson({ error: message }, { status: 400 })
  }

  const started = await startCursorRun({
    ownerId: user.id,
    prompt,
    preset,
    runtime: parseRuntime(body.runtime),
    kind: 'developer',
  })

  if (started.disabled) {
    return noStoreJson({
      status: 'disabled',
      message: started.reason,
      integration: getCursorPublicStatus(),
    }, { status: 503 })
  }

  if (!started.ok || !started.run) {
    return noStoreJson({
      error: started.reason || 'Could not start Cursor run.',
      integration: getCursorPublicStatus(),
    }, { status: started.reason?.includes('concurrent') ? 429 : 502 })
  }

  return noStoreJson({
    status: 'accepted',
    run: started.run,
    integration: getCursorPublicStatus(),
  }, { status: 202 })
}
