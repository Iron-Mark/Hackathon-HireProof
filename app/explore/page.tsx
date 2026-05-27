import type { Metadata } from 'next'
import { ExploreClient } from './explore-client'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/explore',
  title: 'Audit Database | Explore Recruitment Scam Patterns',
  description: 'Search recent HireProof reports and review job-post risk patterns, red flags, and evidence-backed verdicts.',
})

export default function ExplorePage() {
  return <ExploreClient />
}
