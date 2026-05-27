import type { Metadata } from 'next'
import { AuditClient } from './audit-client'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/audit',
  title: 'Job Post Audit | Verify Legitimacy with Receipts',
  description: 'Run an evidence-backed check on any job post. HireProof extracts signals and cross-references them to identify recruitment scams and phishing attempts.',
})

export default function AuditPage() {
  return <AuditClient />
}
