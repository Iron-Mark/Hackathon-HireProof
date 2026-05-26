import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authenticateUser, makeSessionToken } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp, validateMutationOrigin } from '@/lib/request-security'

async function validateLoginRateLimit(request: Request, email: string) {
  const normalizedEmail = email.trim().toLowerCase() || 'unknown'
  const result = await checkRateLimit(`auth_login:${requestIp(request)}:${normalizedEmail}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })

  if (result.success) return null

  const retryAfter = 'retryAfterMs' in result ? Math.ceil((result as any).retryAfterMs / 1000) : 900
  return NextResponse.json(
    { error: 'Too many sign-in attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '')
  const rateLimitError = await validateLoginRateLimit(request, email)
  if (rateLimitError) return rateLimitError

  if (isDemoAccountEmail(email)) {
    return NextResponse.json(
      { error: 'Use the gated demo login flow for the shared demo account.' },
      { status: 403 },
    )
  }

  const user = await authenticateUser(email, String(body.password || ''))
  if (!user) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })

  const cookieStore = await cookies()
  cookieStore.set('hireproof_session', makeSessionToken(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return NextResponse.json({ user })
}
