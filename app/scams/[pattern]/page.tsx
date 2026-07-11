import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { getScamPattern, scamPatternSlugs } from '@/lib/scam-patterns.mjs'
import { pageMetadata, buildScamPatternJsonLd } from '@/lib/seo'

export function generateStaticParams() {
  return scamPatternSlugs().map((pattern) => ({ pattern }))
}

export async function generateMetadata({ params }: { params: Promise<{ pattern: string }> }): Promise<Metadata> {
  const { pattern } = await params
  const found = getScamPattern(pattern)
  if (!found) {
    return pageMetadata({
      path: `/scams/${pattern}`,
      title: 'Job scam patterns',
      description: 'Learn how common job and recruitment scams work, and check any suspicious post with HireProof.',
      index: false,
    })
  }
  return pageMetadata({
    path: `/scams/${found.slug}`,
    title: found.searchTitle,
    description: found.metaDescription,
    index: true,
  })
}

export default async function ScamPatternPage({ params }: { params: Promise<{ pattern: string }> }) {
  const { pattern } = await params
  const found = getScamPattern(pattern)
  if (!found) notFound()

  const jsonLd = buildScamPatternJsonLd(found)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-3xl px-6 py-12 md:px-10">
        <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted">
          <Link href="/scams" className="hover:text-safe">Scam patterns</Link>
          <span className="mx-1.5 opacity-40">/</span>
          <span>{found.name}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{found.searchTitle}</h1>
        <p className="mt-4 text-lg font-medium leading-relaxed text-muted">{found.summary}</p>
        {found.aka.length > 0 && (
          <p className="mt-2 text-sm font-semibold text-muted">Also called: {found.aka.join(', ')}.</p>
        )}

        <section className="mt-10">
          <h2 className="text-xl font-black">How this scam works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6">
            {found.howItWorks.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black">Red flags to watch for</h2>
          <ul className="mt-3 space-y-2">
            {found.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-semibold leading-6">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-risk-bg" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-safe/25 bg-safe/5 p-6">
          <h2 className="text-xl font-black">What to do right now</h2>
          <ul className="mt-3 space-y-2">
            {found.whatToDo.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-semibold leading-6">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-safe" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black">Frequently asked questions</h2>
          <div className="mt-3 space-y-3">
            {found.faq.map((item, i) => (
              <details key={i} className="rounded-xl border border-border-soft bg-surface p-4">
                <summary className="cursor-pointer text-sm font-black">{item.question}</summary>
                <p className="mt-2 text-sm font-medium leading-6 text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border-soft bg-surface p-6 text-center shadow-sm">
          <h2 className="text-xl font-black">Not sure about a specific post?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-muted">
            Paste the job post, recruiter message, or apply link into HireProof for an instant, evidence-backed check.
          </p>
          <Link
            href="/audit"
            className="hireproof-cta-primary mt-4 inline-flex rounded-xl px-6 py-3 text-sm font-black shadow-lg"
          >
            Check my post
          </Link>
        </section>

        {found.relatedSlugs.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">Related scam patterns</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {found.relatedSlugs.map((slug) => {
                const related = getScamPattern(slug)
                if (!related) return null
                return (
                  <Link
                    key={slug}
                    href={`/scams/${slug}`}
                    className="rounded-full border border-border-soft bg-surface px-3 py-1 text-xs font-black transition-colors hover:text-safe"
                  >
                    {related.name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
