import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUsageSummary, getUserFromSessionToken } from '@/lib/auth-store'
import { getSerpApiResponseCacheStats } from '@/lib/serpapi'
import { getProviderCostGuardSnapshot } from '@/lib/provider-cost-guard'

export async function GET() {
  const cookieStore = await cookies()
  const user = await getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const usage = await getUsageSummary(user.id)
  return NextResponse.json({
    ...usage,
    serpapiCache: getSerpApiResponseCacheStats(),
    providerCostGuards: getProviderCostGuardSnapshot(),
  })
}
