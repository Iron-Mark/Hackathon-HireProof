import type { Metadata } from 'next'
import { AuditClient } from './audit-client'
import { SiteHeader } from '@/components/layout/site-header'
import { pageMetadata } from '@/lib/seo'
import { DEMO_REPORTS } from '@/lib/demo-reports'

export const metadata: Metadata = pageMetadata({
  path: '/audit',
  title: 'Job Post Audit | Verify Legitimacy with Receipts',
  description: 'Run an evidence-backed check on any job post. HireProof extracts signals and cross-references them to identify recruitment scams and phishing attempts.',
})

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32">
        <AuditClient demoReports={DEMO_REPORTS} />
      </main>
    </div>
  )
}
