import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { verifyDomainOwnership } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const DEVELOPER_PAYLOAD_LIMIT_BYTES = 16 * 1024

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  try {
    const rateLimit = await checkRateLimit(`developer_domain_verify:${user.id}:${requestIp(request)}`, {
      limit: 10,
      windowMs: 60_000,
    })
    if (!rateLimit.success) {
      return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    const parsedJson = await readJsonRequest(request, DEVELOPER_PAYLOAD_LIMIT_BYTES, 'Developer payload')
    if (!parsedJson.ok) return parsedJson.response

    const body = parsedJson.value
    const result = await verifyDomainOwnership(user.id, String(body.domain || ''))
    return noStoreJson(result)
  } catch (error) {
    return noStoreJson({ error: error instanceof Error ? error.message : 'Could not verify domain.' }, { status: 400 })
  }
}
