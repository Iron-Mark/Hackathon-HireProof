import { cookies } from 'next/headers'
import { getUserFromSessionToken, issueApiKey, listApiKeys } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const DEVELOPER_PAYLOAD_LIMIT_BYTES = 16 * 1024

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

export async function GET() {
  const user = await requireUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  return noStoreJson({ keys: await listApiKeys(user.id) })
}

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await requireUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  // Demo accounts are sandboxed — they cannot create real API keys
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot create API keys.' }, { status: 403 })
  }

  const rateLimit = await checkRateLimit(`developer_keys:${user.id}:${requestIp(request)}`, {
    limit: 10,
    windowMs: 60_000,
  })
  if (!rateLimit.success) {
    return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  const parsedJson = await readJsonRequest(request, DEVELOPER_PAYLOAD_LIMIT_BYTES, 'Developer payload')
  if (!parsedJson.ok) return parsedJson.response

  const body = parsedJson.value
  const { rawKey, record } = await issueApiKey(user.id, String(body.name || 'Production API Key'))
  return noStoreJson({ rawKey, key: record }, { status: 201 })
}
