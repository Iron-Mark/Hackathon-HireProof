import { getUsageSummary } from '@/lib/auth-store'
import { getCurrentSessionUser } from '@/lib/auth-session-user'
import { getSerpApiResponseCacheStats } from '@/lib/serpapi'
import { getProviderCostGuardSnapshot } from '@/lib/provider-cost-guard'
import { noStoreJson } from '@/lib/response-security'

export async function GET() {
  const user = await getCurrentSessionUser()
  if (!user) return noStoreJson({ error: 'Authentication required.' }, { status: 401 })
  const usage = await getUsageSummary(user.id)
  return noStoreJson({
    ...usage,
    serpapiCache: getSerpApiResponseCacheStats(),
    providerCostGuards: getProviderCostGuardSnapshot(),
  })
}
