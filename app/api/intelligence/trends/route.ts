import { NextResponse } from 'next/server'
import { getReportTrends } from '@/lib/db'
import { isSerpApiConfigured, searchNewsReputation } from '@/lib/serpapi'
import { checkRateLimit } from '@/lib/rate-limit'
import { checkProviderCostGuard } from '@/lib/provider-cost-guard'
import { requestIp } from '@/lib/request-security'

function externalTrendSignalsEnabled() {
  return process.env.PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED === 'true'
}

export async function GET(request: Request) {
  const trends = await getReportTrends()
  let externalSignals: unknown[] = []
  let externalSignalsStatus = 'not-live'
  const externalSignalsAllowed = externalTrendSignalsEnabled() && isSerpApiConfigured()

  if (externalSignalsAllowed) {
    try {
      const rateLimit = await checkRateLimit(`public_trends:${requestIp(request)}`, {
        limit: 5,
        windowMs: 60000,
      })
      if (!rateLimit.success) {
        externalSignalsStatus = 'rate-limited'
      } else {
        const costGuard = await checkProviderCostGuard('serpapi')
        if (!costGuard.allowed) {
          externalSignalsStatus = costGuard.status.status || 'throttled'
        } else {
          externalSignals = await searchNewsReputation('recruitment scam job fraud')
          externalSignalsStatus = 'ok'
        }
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
    mode: externalSignalsAllowed ? 'hybrid' : 'stored-audits',
  })
}
