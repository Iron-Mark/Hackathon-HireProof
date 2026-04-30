import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getUserFromSessionToken,
  listProviderCredentials,
  revokeProviderCredential,
  saveProviderCredential,
} from '@/lib/auth-store'
import { normalizeProviderInput, verifyProviderCredential } from '@/lib/provider-verification'
import { checkRateLimit } from '@/lib/rate-limit'

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

function parseOrigin(value: string | null) {
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function allowedMutationOrigins(request: Request) {
  const origins = new Set<string>([new URL(request.url).origin])
  const appBaseOrigin = parseOrigin(process.env.APP_BASE_URL || null)
  if (appBaseOrigin) origins.add(appBaseOrigin)
  return origins
}

function validateMutationOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const sourceOrigin = parseOrigin(origin) || parseOrigin(referer)

  if (!sourceOrigin || !allowedMutationOrigins(request).has(sourceOrigin)) {
    return NextResponse.json({ error: 'CSRF validation failed.' }, { status: 403 })
  }

  return null
}

function requestIp(request: Request) {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  return request.headers.get('x-real-ip') || (xForwardedFor ? xForwardedFor.split(',')[0].trim() : '127.0.0.1')
}

async function validateCredentialSaveRateLimit(request: Request, userId: string) {
  const result = await checkRateLimit(`byok_provider_credentials:${userId}:${requestIp(request)}`, {
    limit: 5,
    windowMs: 5 * 60 * 1000,
  })

  if (result.success) return null

  const retryAfter = 'retryAfterMs' in result ? Math.ceil((result as any).retryAfterMs / 1000) : 300
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  return NextResponse.json({
    credentials: await listProviderCredentials(user.id),
  })
}

export async function PATCH(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const rateLimitError = await validateCredentialSaveRateLimit(request, user.id)
  if (rateLimitError) return rateLimitError

  const body = await request.json().catch(() => ({}))
  const provider = normalizeProviderInput(body.provider)
  const key = typeof body.key === 'string' ? body.key : ''
  if (!provider) return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 })
  if (!key.trim()) return NextResponse.json({ error: 'Provider key is required.' }, { status: 400 })

  try {
    const verification = await verifyProviderCredential(provider, key)
    if (!verification.valid) {
      return NextResponse.json({ error: 'Provider key could not be verified.' }, { status: 401 })
    }

    const credential = await saveProviderCredential(user.id, provider, key)
    return NextResponse.json({ credential })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save provider credential.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const provider = normalizeProviderInput(searchParams.get('provider'))
  if (!provider) return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 })

  return NextResponse.json({ revoked: await revokeProviderCredential(user.id, provider) })
}
