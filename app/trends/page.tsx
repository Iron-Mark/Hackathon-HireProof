import type { Metadata } from 'next'
import { TrendsClient } from './trends-client'
import { pageMetadata } from '@/lib/seo'
import { getReportTrends } from '@/lib/db'

export const metadata: Metadata = pageMetadata({
  path: '/trends',
  title: 'Recruitment Scam Trends | HireProof',
  description: 'Review recurring recruitment scam patterns found in job-post checks and saved HireProof reports.',
})

// Server-render the stored-audit trends so crawlers get real HTML. The live reports DB read is
// uncached, so Next renders this route dynamically per request. External SerpApi signals are
// intentionally omitted here to keep server renders cost-free.
export const dynamic = 'force-dynamic'

export default async function TrendsPage() {
  const trends = await getReportTrends()
  const initialStats = { ...trends, externalSignals: [], externalSignalsStatus: 'not-live', mode: 'stored-audits' }
  return <TrendsClient initialStats={initialStats} />
}
