import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authenticateUser, createUser, makeSessionToken } from '@/lib/auth-store'
import {
  DEMO_ACCOUNT_EMAIL,
  DEMO_ACCOUNT_NAME,
  DEMO_ACCOUNT_PASSWORD,
  DEMO_SESSION_TTL_SECONDS,
} from '@/lib/demo-account'
import { requestIp, validateMutationOrigin } from '@/lib/request-security'
import { checkRateLimit } from '@/lib/rate-limit'
import { noStoreJson } from '@/lib/response-security'

const DEMO_EMAIL = DEMO_ACCOUNT_EMAIL
const DEMO_PASSWORD = DEMO_ACCOUNT_PASSWORD
const DEMO_NAME = DEMO_ACCOUNT_NAME
const DEMO_SESSION_TTL = DEMO_SESSION_TTL_SECONDS
// Rate limit: max 5 logins per IP per hour
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_S = 60 * 60
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_S * 1000

/**
 * POST /api/auth/demo-login
 * Idempotently creates the demo judge account (if it doesn't exist) and logs in.
 * Hardening:
 *   - Only active when DEMO_LOGIN_ENABLED=true
 *   - IP rate-limited to 5 uses per hour
 *   - Demo session TTL is 2 hours (not 7 days)
 *   - Demo account cannot issue real API keys (enforced separately in /api/developer/keys)
 */
export async function POST(request: Request) {
  if (process.env.DEMO_LOGIN_ENABLED !== 'true') {
    return noStoreJson({ error: 'Demo login is not enabled.' }, { status: 403 })
  }

  const csrfError = validateMutationOrigin(request)
  if (csrfError) return csrfError

  const ip = requestIp(request)
  const rateLimit = await checkRateLimit(`demo_login:${ip}`, { limit: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS })
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many demo login attempts. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(RATE_LIMIT_WINDOW_S),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }
  const remaining = rateLimit.remaining

  try {
    // Try login first (account may already exist)
    let user = await authenticateUser(DEMO_EMAIL, DEMO_PASSWORD, { allowDemoAccount: true })

    // If not found, seed the account then log in
    if (!user) {
      try {
        await createUser(DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME, { allowDemoAccount: true })
      } catch (e) {
        // Ignore "already exists" errors from a race condition
        const msg = e instanceof Error ? e.message : ''
        if (!msg.includes('already exists')) throw e
      }
      user = await authenticateUser(DEMO_EMAIL, DEMO_PASSWORD, { allowDemoAccount: true })
    }

    if (!user) {
      return noStoreJson({ error: 'Demo login failed.' }, { status: 500 })
    }

    const cookieStore = await cookies()
    cookieStore.set('hireproof_session', makeSessionToken(user.id, DEMO_SESSION_TTL), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DEMO_SESSION_TTL,
    })

    return noStoreJson(
      {
        user: { id: user.id, email: user.email, name: user.name },
        isDemo: true,
      },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (error) {
    return noStoreJson(
      { error: error instanceof Error ? error.message : 'Demo login failed.' },
      { status: 500 }
    )
  }
}
