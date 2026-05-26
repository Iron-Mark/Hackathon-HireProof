import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getUserFromSessionToken,
  listProviderCredentials,
  revokeProviderCredential,
  saveProviderCredential,
} from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'
import { normalizeProviderInput, verifyProviderCredential } from '@/lib/provider-verification'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp, validateMutationOrigin } from '@/lib/request-security'

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
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
  if (isDemoAccountEmail(user.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

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
  if (isDemoAccountEmail(user.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const provider = normalizeProviderInput(searchParams.get('provider'))
  if (!provider) return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 })

  return NextResponse.json({ revoked: await revokeProviderCredential(user.id, provider) })
}
