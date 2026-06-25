import { getCurrentSessionUser } from '@/lib/auth-session-user'
import {
  listProviderCredentials,
  revokeProviderCredential,
  saveProviderCredential,
} from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { normalizeProviderInput, verifyProviderCredential } from '@/lib/provider-verification'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const PROVIDER_CREDENTIAL_PAYLOAD_LIMIT_BYTES = 32 * 1024

async function validateCredentialSaveRateLimit(request: Request, userId: string) {
  const result = await checkRateLimit(`byok_provider_credentials:${userId}:${requestIp(request)}`, {
    limit: 5,
    windowMs: 5 * 60 * 1000,
  })

  if (result.success) return null

  const retryAfter = 'retryAfterMs' in result ? Math.ceil((result as any).retryAfterMs / 1000) : 300
  return noStoreJson(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

async function validateCredentialRevokeRateLimit(request: Request, userId: string) {
  const result = await checkRateLimit(`byok_provider_credentials_revoke:${userId}:${requestIp(request)}`, {
    limit: 20,
    windowMs: 60 * 1000,
  })

  if (result.success) return null

  const retryAfter = 'retryAfterMs' in result ? Math.ceil((result as any).retryAfterMs / 1000) : 60
  return noStoreJson(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

export async function GET() {
  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })

  return noStoreJson({
    credentials: await listProviderCredentials(user.id),
  })
}

export async function PATCH(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  const rateLimitError = await validateCredentialSaveRateLimit(request, user.id)
  if (rateLimitError) return rateLimitError

  const parsedJson = await readJsonRequest(request, PROVIDER_CREDENTIAL_PAYLOAD_LIMIT_BYTES, 'Provider credential payload')
  if (!parsedJson.ok) return parsedJson.response

  const body = parsedJson.value
  const provider = normalizeProviderInput(body.provider)
  const key = typeof body.key === 'string' ? body.key : ''
  if (!provider) return noStoreJson({ error: 'Unsupported provider.' }, { status: 400 })
  if (!key.trim()) return noStoreJson({ error: 'Provider key is required.' }, { status: 400 })

  try {
    const verification = await verifyProviderCredential(provider, key)
    if (!verification.valid) {
      return noStoreJson({ error: 'Provider key could not be verified.' }, { status: 401 })
    }

    const credential = await saveProviderCredential(user.id, provider, key)
    return noStoreJson({ credential })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save provider credential.'
    return noStoreJson({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  const rateLimitError = await validateCredentialRevokeRateLimit(request, user.id)
  if (rateLimitError) return rateLimitError

  const { searchParams } = new URL(request.url)
  const provider = normalizeProviderInput(searchParams.get('provider'))
  if (!provider) return noStoreJson({ error: 'Unsupported provider.' }, { status: 400 })

  return noStoreJson({ revoked: await revokeProviderCredential(user.id, provider) })
}
