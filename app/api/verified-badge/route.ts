import { NextResponse } from 'next/server'
import { authenticateApiKey, getVerifiedDomainByToken, getVerifiedDomainForOwner, normalizeDomain } from '@/lib/auth-store'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp } from '@/lib/request-security'

const VERIFIED_BADGE_PAYLOAD_LIMIT_BYTES = 8 * 1024
const MAX_BADGE_QUERY_DOMAIN_LENGTH = 253
const MAX_BADGE_QUERY_TOKEN_LENGTH = 128

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(request: Request) {
  const parsedJson = await readJsonRequest(request, VERIFIED_BADGE_PAYLOAD_LIMIT_BYTES, 'Verified badge payload')
  if (!parsedJson.ok) return parsedJson.response

  const body = parsedJson.value
  const key = String(body.key || '')
  const domainInput = String(body.domain || '')
  const rateLimit = await checkRateLimit(`verified_badge_check:${requestIp(request)}:${domainInput.slice(0, 120).toLowerCase()}`, {
    limit: 20,
    windowMs: 60000,
  })
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  const auth = key ? await authenticateApiKey(key) : null
  let domain = ''
  try {
    domain = normalizeDomain(domainInput)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid domain.' }, { status: 400 })
  }
  const record = auth ? await getVerifiedDomainForOwner(auth.ownerId, domain) : null

  return NextResponse.json({
    verified: Boolean(auth && record?.status === 'verified'),
    domain,
    account: auth?.user?.name || auth?.ownerId || null,
    status: record?.status || 'not-found',
    expectedTxt: record?.status === 'verified' ? null : record?.verificationToken || null,
    checkedAt: new Date().toISOString(),
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const rawDomain = url.searchParams.get('domain') || ''
  const rawToken = url.searchParams.get('token') || url.searchParams.get('publicToken') || ''
  const domain = rawDomain.length <= MAX_BADGE_QUERY_DOMAIN_LENGTH ? rawDomain.trim() : ''
  const token = rawToken.length <= MAX_BADGE_QUERY_TOKEN_LENGTH ? rawToken.trim() : ''
  const rateLimit = await checkRateLimit(`verified_badge_embed:${requestIp(request)}:${domain.slice(0, 120).toLowerCase()}`, {
    limit: 60,
    windowMs: 60000,
  })

  if (!rateLimit.success) {
    return new Response('Rate limit exceeded. Try again later.', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const record = token ? await getVerifiedDomainByToken(domain, token) : null
  const verified = record?.status === 'verified'

  const label = verified ? 'HireProof Verified' : 'HireProof Unverified'
  const color = verified ? '#0f9f6e' : '#6b7280'
  const safeLabel = escapeHtml(label)
  const safeSublabel = escapeHtml(verified ? record.domain : 'Domain not verified')
  const safeMark = verified ? '&#10003;' : '!'

  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;font-family:Inter,Arial,sans-serif}.badge{box-sizing:border-box;width:200px;height:60px;display:flex;gap:10px;align-items:center;border:1px solid #d7ded9;border-radius:12px;background:#fff;color:#111827;padding:10px}.mark{width:34px;height:34px;border-radius:9px;background:${color};color:#fff;display:grid;place-items:center;font-weight:900}.title{font-size:13px;font-weight:900;line-height:1.1}.sub{font-size:10px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}</style></head><body><div class="badge" role="img" aria-label="${safeLabel}"><div class="mark">${safeMark}</div><div><div class="title">${safeLabel}</div><div class="sub">${safeSublabel}</div></div></div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
  )
}
