import type { Metadata } from 'next'
import { ExploreClient } from './explore-client'
import { pageMetadata } from '@/lib/seo'
import { listReports } from '@/lib/db'
import { selectPublicReports } from '@/lib/public-intelligence-reports.mjs'

export const metadata: Metadata = pageMetadata({
  path: '/explore',
  title: 'Audit Database | Explore Recruitment Scam Patterns',
  description: 'Search recent HireProof reports and review job-post risk patterns, red flags, and evidence-backed verdicts.',
})

// Server-render the initial public results so crawlers get real HTML. The live reports DB read is
// uncached, so Next renders this route dynamically per request.
export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const { reports, total } = selectPublicReports(await listReports(200), { limit: 50 })
  return <ExploreClient initialReports={reports} initialTotal={total} />
}
