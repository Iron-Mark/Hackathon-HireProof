import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createVerifiedDomain, getUserFromSessionToken, listVerifiedDomains } from '@/lib/auth-store'

async function requireUser() {
  const cookieStore = await cookies()
  return getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
}

function publicDomain(record: Awaited<ReturnType<typeof createVerifiedDomain>>) {
  return {
    id: record.id,
    domain: record.domain,
    status: record.status,
    verificationToken: record.verificationToken,
    publicToken: record.publicToken,
    createdAt: record.createdAt,
    verifiedAt: record.verifiedAt,
    lastCheckedAt: record.lastCheckedAt,
    badgeUrl: `/api/verified-badge?domain=${encodeURIComponent(record.domain)}&token=${encodeURIComponent(record.publicToken)}`,
    scriptUrl: `/api/verified-badge/script?domain=${encodeURIComponent(record.domain)}&token=${encodeURIComponent(record.publicToken)}`,
  }
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const records = await listVerifiedDomains(user.id)
  return NextResponse.json({ domains: records.map(publicDomain) })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const record = await createVerifiedDomain(user.id, String(body.domain || ''))
    return NextResponse.json({ domain: publicDomain(record) }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not add domain.' }, { status: 400 })
  }
}
