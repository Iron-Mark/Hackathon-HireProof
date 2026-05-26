import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserFromSessionToken, issueApiKey, listApiKeys } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  return NextResponse.json({ keys: await listApiKeys(user.id) })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  // Demo accounts are sandboxed — they cannot create real API keys
  if (isDemoAccountEmail(user.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot create API keys.' }, { status: 403 })
  }
  const body = await request.json().catch(() => ({}))
  const { rawKey, record } = await issueApiKey(user.id, String(body.name || 'Production API Key'))
  return NextResponse.json({ rawKey, key: record }, { status: 201 })
}
