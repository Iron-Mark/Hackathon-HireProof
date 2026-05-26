import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { authenticateUser, createUser, makeSessionToken } from '@/lib/auth-store'
import {
  DEMO_ACCOUNT_EMAIL,
  DEMO_ACCOUNT_NAME,
  DEMO_ACCOUNT_PASSWORD,
  DEMO_SESSION_TTL_SECONDS,
} from '@/lib/demo-account'
import { Redis } from '@upstash/redis'

const DEMO_EMAIL = DEMO_ACCOUNT_EMAIL
const DEMO_PASSWORD = DEMO_ACCOUNT_PASSWORD
const DEMO_NAME = DEMO_ACCOUNT_NAME
const DEMO_SESSION_TTL = DEMO_SESSION_TTL_SECONDS
// Rate limit: max 5 logins per IP per hour
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_S = 60 * 60

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  try { return new Redis({ url, token }) } catch { return null }
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis()
  if (!redis) return { allowed: true, remaining: RATE_LIMIT_MAX }

  const key = `hireproof:demo-login:ip:${ip}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW_S)

  const remaining = Math.max(0, RATE_LIMIT_MAX - count)
  return { allowed: count <= RATE_LIMIT_MAX, remaining }
}

function getClientIp(reqHeaders: Headers): string {
  return (
    reqHeaders.get('x-real-ip') ??
    reqHeaders.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}

function assertSameOrigin(request: Request, reqHeaders: Headers) {
  const origin = reqHeaders.get('origin')
  const referer = reqHeaders.get('referer')
  const requestOrigin = new URL(request.url).origin

  if (origin) {
    return new URL(origin).origin === requestOrigin
  }

  if (referer) {
    return new URL(referer).origin === requestOrigin
  }

  return process.env.NODE_ENV !== 'production'
}

/**
 * POST /api/auth/demo-login
 * Idempotently creates the demo judge account (if it doesn't exist) and logs in.
 * Hardening:
 *   - Only active when DEMO_LOGIN_ENABLED=true
 *   - IP rate-limited to 5 uses per hour (via Redis)
 *   - Demo session TTL is 2 hours (not 7 days)
 *   - Demo account cannot issue real API keys (enforced separately in /api/developer/keys)
 */
export async function POST(request: Request) {
  if (process.env.DEMO_LOGIN_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Demo login is not enabled.' }, { status: 403 })
  }

  // --- Rate limiting ---
  const reqHeaders = await headers()
  if (!assertSameOrigin(request, reqHeaders)) {
    return NextResponse.json({ error: 'Cross-origin demo login is not allowed.' }, { status: 403 })
  }

  const ip = getClientIp(reqHeaders)
  const { allowed, remaining } = await checkRateLimit(ip)
  if (!allowed) {
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
      return NextResponse.json({ error: 'Demo login failed.' }, { status: 500 })
    }

    const cookieStore = await cookies()
    cookieStore.set('hireproof_session', makeSessionToken(user.id, DEMO_SESSION_TTL), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DEMO_SESSION_TTL,
    })

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name },
        isDemo: true,
      },
      { headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Demo login failed.' },
      { status: 500 }
    )
  }
}
