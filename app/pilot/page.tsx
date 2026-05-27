import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { ProductEventTracker } from '@/components/analytics/product-event-tracker'
import { PilotIntakeClient } from './pilot-intake-client'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/pilot',
  title: 'Pilot Intake | HireProof',
  description: 'Request a small HireProof pilot for job-seeker communities, schools, recruiters, job boards, or developer integrations.',
})

export default function PilotPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <ProductEventTracker eventName="pilot_open" metadata={{ surface: 'pilot_page' }} />
      <main className="mx-auto max-w-400 px-6 py-12 md:px-12 lg:px-20 lg:py-16 xl:px-32">
        <PilotIntakeClient />
        <section className="mt-10 rounded-2xl border border-border-soft bg-surface p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">Need the pilot plan first?</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-muted">Review the 90-day validation plan, proof boundaries, and cost-safe live-provider posture.</p>
            </div>
            <Link href="/docs/pilot" className="hireproof-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-safe/30 bg-safe/10 px-4 py-2.5 text-sm font-black text-safe hover:bg-background">
              View pilot plan <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pilot/admin" className="hireproof-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-soft bg-background px-4 py-2.5 text-sm font-black hover:bg-surface">
              Admin/export
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
