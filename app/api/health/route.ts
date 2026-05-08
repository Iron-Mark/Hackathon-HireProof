import { NextResponse } from 'next/server'
import { getSerpApiResponseCacheStats, isSerpApiConfigured } from '@/lib/serpapi'
import { getModelProviderStatus, hasHireProofModelProvider } from '@/lib/ai-model'
import { getProviderCostGuardSnapshot } from '@/lib/provider-cost-guard'

export async function GET() {
  const providerCostGuards = getProviderCostGuardSnapshot()

  return NextResponse.json({
    status: 'ok',
    storage: process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'local-json',
    liveSearch: isSerpApiConfigured(),
    serpapiCache: getSerpApiResponseCacheStats(),
    model: hasHireProofModelProvider(),
    modelProvider: getModelProviderStatus(),
    providerCostGuards,
    costPosture: {
      publicLiveEvidence: providerCostGuards.flags.publicLiveAuditEnabled,
      publicOcr: providerCostGuards.flags.publicGoogleVisionOcrEnabled,
      publicTrendSignals: providerCostGuards.flags.publicTrendsExternalSignalsEnabled,
      byokRequiredForApiLive: providerCostGuards.flags.requireByokForLiveApi,
    },
    timestamp: new Date().toISOString(),
  })
}
