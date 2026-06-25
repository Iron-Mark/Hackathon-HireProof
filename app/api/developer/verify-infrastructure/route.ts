import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { normalizeProviderInput, verifyProviderCredential } from '@/lib/provider-verification'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const VERIFY_INFRASTRUCTURE_PAYLOAD_LIMIT_BYTES = 32 * 1024

export async function POST(req: Request) {
  try {
    const csrfError = validateMutationOrigin(req)
    if (csrfError) return csrfError

    const user = await getCurrentSessionUser()
    if (!user) return noStoreJson({ valid: false, error: 'Authentication required.' }, { status: 401 })

    const rateLimit = await checkRateLimit(`developer_verify_infrastructure:${user.id}:${requestIp(req)}`, {
      limit: 12,
      windowMs: 60_000,
    })
    if (!rateLimit.success) {
      return noStoreJson({ valid: false, error: 'Rate limit exceeded.' }, { status: 429 })
    }

    const parsedJson = await readJsonRequest(req, VERIFY_INFRASTRUCTURE_PAYLOAD_LIMIT_BYTES, 'Verification payload')
    if (!parsedJson.ok) return parsedJson.response

    const { provider, key } = parsedJson.value
    const normalizedProvider = normalizeProviderInput(provider)

    if (!normalizedProvider) {
      return noStoreJson({ valid: false, error: 'Invalid provider' }, { status: 400 })
    }

    if (!key || typeof key !== 'string') {
      return noStoreJson({ valid: false, error: 'No key provided' }, { status: 400 })
    }

    const result = await verifyProviderCredential(normalizedProvider, key)
    return noStoreJson(result, { status: result.valid ? 200 : 401 })
  } catch (error) {
    console.error('[VerifyInfrastructure] Error:', error)
    return noStoreJson({ valid: false, error: 'Internal server error during verification' }, { status: 500 })
  }
}
