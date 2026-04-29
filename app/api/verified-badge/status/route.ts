import { getVerifiedDomainByToken } from '@/lib/auth-store'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const domain = url.searchParams.get('domain') || ''
  const token = url.searchParams.get('token') || ''
  const record = token ? await getVerifiedDomainByToken(domain, token) : null

  return Response.json({
    verified: record?.status === 'verified',
    domain: record?.domain || domain,
    status: record?.status || 'not-found',
    checkedAt: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
