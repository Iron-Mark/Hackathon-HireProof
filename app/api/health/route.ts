import { NextResponse } from 'next/server'
import { getProviderCostGuardSnapshot } from '@/lib/provider-cost-guard'

export async function GET() {
  const providerCostGuards = getProviderCostGuardSnapshot()

  return NextResponse.json({
    status: 'ok',
    readiness: {
      state: 'ready',
      scope: 'public',
    },
    costPosture: {
      publicLiveEvidence: providerCostGuards.flags.publicLiveAuditEnabled,
      publicOcr: providerCostGuards.flags.publicGoogleVisionOcrEnabled,
      publicTrendSignals: providerCostGuards.flags.publicTrendsExternalSignalsEnabled,
      byokRequiredForApiLive: providerCostGuards.flags.requireByokForLiveApi,
    },
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
