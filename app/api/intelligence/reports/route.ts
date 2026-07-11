import { NextResponse } from 'next/server'
import { listReports } from '@/lib/db'
import { selectPublicReports } from '@/lib/public-intelligence-reports.mjs'
import { checkRateLimit } from '@/lib/rate-limit'
import { requestIp } from '@/lib/request-security'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim().toLowerCase() || ''
  const verdict = searchParams.get('verdict') || 'all'

  const rateLimit = await checkRateLimit(`public_intelligence_reports:${requestIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  })
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  const { reports, total } = selectPublicReports(await listReports(200), { query, verdict, limit: 50 })

  return NextResponse.json({ reports, total })
}
