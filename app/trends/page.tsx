import type { Metadata } from 'next'
import { TrendsClient } from './trends-client'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/trends',
  title: 'Recruitment Scam Trends | HireProof',
  description: 'Review recurring recruitment scam patterns found in job-post checks and saved HireProof reports.',
})

export default function TrendsPage() {
  return <TrendsClient />
}
