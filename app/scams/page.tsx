import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SCAM_PATTERNS } from '@/lib/scam-patterns.mjs'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/scams',
  title: 'Job Scam Patterns | Spot & Avoid Recruitment Fraud',
  description:
    'Learn the most common job and recruitment scam patterns — how each works, the red flags, and what to do. Then check any suspicious post with HireProof.',
})

export default function ScamsIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Job Scam Patterns</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-muted">
          The recurring ways job and recruitment scams work. Learn the red flags for each, then paste any
          suspicious post into HireProof for an instant, evidence-backed check.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SCAM_PATTERNS.map((pattern) => (
            <Link
              key={pattern.slug}
              href={`/scams/${pattern.slug}`}
              className="group rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:border-safe/40 hover:shadow-lg"
            >
              <h2 className="text-lg font-black transition-colors group-hover:text-safe">{pattern.name}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-muted">{pattern.summary}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border-soft bg-surface p-6 text-center shadow-sm">
          <h2 className="text-xl font-black">Got a specific post to check?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-muted">
            HireProof reads the post and returns a Safe, Caution, or High-Risk verdict with the evidence behind it.
          </p>
          <Link
            href="/audit"
            className="hireproof-cta-primary mt-4 inline-flex rounded-xl px-6 py-3 text-sm font-black shadow-lg"
          >
            Check a job post
          </Link>
        </div>
      </main>
    </div>
  )
}
