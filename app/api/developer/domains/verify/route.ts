import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserFromSessionToken, verifyDomainOwnership } from '@/lib/auth-store'
import { isDemoAccountEmail } from '@/lib/demo-account'

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (isDemoAccountEmail(user.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify developer resources.' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const result = await verifyDomainOwnership(user.id, String(body.domain || ''))
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not verify domain.' }, { status: 400 })
  }
}
