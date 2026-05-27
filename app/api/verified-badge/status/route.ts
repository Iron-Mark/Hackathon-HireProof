import { getVerifiedDomainByToken } from '@/lib/auth-store'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp } from '@/lib/request-security'

const MAX_BADGE_DOMAIN_LENGTH = 253
const MAX_BADGE_TOKEN_LENGTH = 128

export async function GET(request: Request) {
  const url = new URL(request.url)
  const rawDomain = url.searchParams.get('domain') || ''
  const rawToken = url.searchParams.get('token') || ''
  const domain = rawDomain.length <= MAX_BADGE_DOMAIN_LENGTH ? rawDomain.trim() : ''
  const token = rawToken.length <= MAX_BADGE_TOKEN_LENGTH ? rawToken.trim() : ''
  const rateLimit = await checkRateLimit(`verified_badge_status:${requestIp(request)}:${domain.slice(0, 120).toLowerCase()}`, {
    limit: 60,
    windowMs: 60000,
  })

  if (!rateLimit.success) {
    return Response.json({ error: 'Rate limit exceeded. Try again later.' }, {
      status: 429,
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const record = token ? await getVerifiedDomainByToken(domain, token) : null

  return Response.json({
    verified: record?.status === 'verified',
    domain: record?.domain || domain,
    status: record?.status || 'not-found',
    checkedAt: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
