import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createUser, makeSessionToken } from '@/lib/auth-store'
import { setAuthSessionCookie } from '@/lib/auth-session-cookie'
import { checkRateLimit } from '@/lib/rate-limit'
import { readJsonRequest, requestIp, validateMutationOrigin } from '@/lib/request-security'
import { noStoreJson } from '@/lib/response-security'

const AUTH_PAYLOAD_LIMIT_BYTES = 16 * 1024

async function validateRegisterRateLimit(request: Request, email: string) {
  const normalizedEmail = email.trim().toLowerCase() || 'unknown'
  const options = { limit: 5, windowMs: 15 * 60 * 1000 }
  const [emailResult, clientResult] = await Promise.all([
    checkRateLimit(`auth_register:email:${normalizedEmail}`, options),
    checkRateLimit(`auth_register:client:${requestIp(request)}:${normalizedEmail}`, options),
  ])
  const result = emailResult.success ? clientResult : emailResult

  if (result.success) return null

  const retryAfter = 'retryAfterMs' in result ? Math.ceil((result as any).retryAfterMs / 1000) : 900
  return NextResponse.json(
    { error: 'Too many registration attempts. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

export async function POST(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  try {
    const parsedJson = await readJsonRequest(request, AUTH_PAYLOAD_LIMIT_BYTES, 'Auth payload')
    if (!parsedJson.ok) return parsedJson.response

    const body = parsedJson.value
    const email = String(body.email || '')
    const rateLimitError = await validateRegisterRateLimit(request, email)
    if (rateLimitError) return rateLimitError

    const user = await createUser(email, String(body.password || ''), String(body.name || ''))
    const cookieStore = await cookies()
    setAuthSessionCookie(cookieStore, makeSessionToken(user.id))
    return noStoreJson({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed.'
    if (message === 'An account with this email already exists.') {
      return noStoreJson({ error: 'Registration could not be completed.' }, { status: 400 })
    }
    return noStoreJson({ error: message }, { status: 400 })
  }
}
