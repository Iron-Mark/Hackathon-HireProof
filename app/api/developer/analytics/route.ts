import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getProductAnalyticsSummary, getUserFromSessionToken, isOperatorUser } from '@/lib/auth-store'
import { noStoreJson } from '@/lib/response-security'

export async function GET() {
  const cookieStore = await cookies()
  const user = await getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  if (!isOperatorUser(user)) return NextResponse.json({ error: 'Operator access required.' }, { status: 403 })
  return noStoreJson(await getProductAnalyticsSummary())
}
