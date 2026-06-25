import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { createVerifiedDomain, listVerifiedDomains } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const DEVELOPER_PAYLOAD_LIMIT_BYTES = 16 * 1024

function publicDomain(record: Awaited<ReturnType<typeof createVerifiedDomain>>) {
  return {
    id: record.id,
    domain: record.domain,
    status: record.status,
    verificationToken: record.verificationToken,
    publicToken: record.publicToken,
    createdAt: record.createdAt,
    verifiedAt: record.verifiedAt,
    lastCheckedAt: record.lastCheckedAt,
    badgeUrl: `/api/verified-badge?domain=${encodeURIComponent(record.domain)}&token=${encodeURIComponent(record.publicToken)}`,
    scriptUrl: `/api/verified-badge/script?domain=${encodeURIComponent(record.domain)}&token=${encodeURIComponent(record.publicToken)}`,
  }
}

export async function GET() {
  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  const records = await listVerifiedDomains(user.id)
  return noStoreJson({ domains: records.map(publicDomain) })
}

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  if (isDemoAccountEmail(user.email)) {
    return noStoreJson({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  try {
    const rateLimit = await checkRateLimit(`developer_domains:${user.id}:${requestIp(request)}`, {
      limit: 12,
      windowMs: 60_000,
    })
    if (!rateLimit.success) {
      return noStoreJson({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
    }

    const parsedJson = await readJsonRequest(request, DEVELOPER_PAYLOAD_LIMIT_BYTES, 'Developer payload')
    if (!parsedJson.ok) return parsedJson.response

    const body = parsedJson.value
    const record = await createVerifiedDomain(user.id, String(body.domain || ''))
    return noStoreJson({ domain: publicDomain(record) }, { status: 201 })
  } catch (error) {
    return noStoreJson({ error: error instanceof Error ? error.message : 'Could not add domain.' }, { status: 400 })
  }
}
