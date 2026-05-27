import { cookies } from 'next/headers'
import { getUsageSummary, getUserFromSessionToken } from '@/lib/auth-store'
import { getSerpApiResponseCacheStats } from '@/lib/serpapi'
import { getProviderCostGuardSnapshot } from '@/lib/provider-cost-guard'
import { noStoreJson } from '@/lib/response-security'

export async function GET() {
  const cookieStore = await cookies()
  const user = await getUserFromSessionToken(cookieStore.get('hireproof_session')?.value)
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  const usage = await getUsageSummary(user.id)
  return noStoreJson({
    ...usage,
    serpapiCache: getSerpApiResponseCacheStats(),
    providerCostGuards: getProviderCostGuardSnapshot(),
  })
}
