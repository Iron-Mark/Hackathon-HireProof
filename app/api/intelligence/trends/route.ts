import { NextResponse } from 'next/server'
import { getReportTrends } from '@/lib/db'
import { isSerpApiConfigured, searchNewsReputation } from '@/lib/serpapi'
import { checkProviderCostGuard } from '@/lib/provider-cost-guard'

function externalTrendSignalsEnabled() {
  return process.env.PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED !== 'false'
}

export async function GET() {
  const trends = await getReportTrends()
  let externalSignals: unknown[] = []
  let externalSignalsStatus = 'not-live'

  if (externalTrendSignalsEnabled() && isSerpApiConfigured()) {
    try {
      const costGuard = await checkProviderCostGuard('serpapi')
      if (costGuard.allowed) {
        externalSignals = await searchNewsReputation('recruitment scam job fraud')
        externalSignalsStatus = 'ok'
      } else {
        externalSignalsStatus = costGuard.status.status || 'throttled'
      }
    } catch {
      externalSignals = []
      externalSignalsStatus = 'degraded'
    }
  }

  return NextResponse.json({
    ...trends,
    externalSignals,
    externalSignalsStatus,
    mode: externalTrendSignalsEnabled() && isSerpApiConfigured() ? 'hybrid' : 'stored-audits',
  })
}
