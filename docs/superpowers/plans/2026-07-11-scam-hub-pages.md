# Curated `/scams` Hub Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship server-rendered, indexable `/scams` and `/scams/[pattern]` hub pages driven by a typed registry of scam archetypes, so organic search for "is X a job scam?" lands on HireProof and converts into an audit.

**Architecture:** A pure-data registry (`lib/scam-patterns.ts`) drives statically prerendered server pages (`app/scams/*`). `lib/seo.ts` gains a JSON-LD builder and registry-derived sitemap entries. No client JS, no user/report data, no external calls.

**Tech Stack:** Next.js 16 App Router (server components, `generateStaticParams`, `generateMetadata`), TypeScript, Tailwind, `node:test`.

## Global Constraints

- **No AI attribution** in commits/PRs.
- **Evergreen editorial content only** — no report-DB data, no aggregate stats, no external calls.
- **Indexable:** each `/scams` route uses `pageMetadata({ …, index: true })` with a canonical; per-report `/audit/[id]` stays `noindex` (unchanged).
- **Honest boundaries:** no fabricated stats or "N reports" social proof; CTA uses the "Check my post" framing from Spec 1.
- **No import cycle:** `lib/scam-patterns.ts` imports nothing from `lib/seo.ts`; seo/sitemap import the registry one-way.
- **8 patterns:** `upfront-fee`, `whatsapp-telegram-task`, `reshipping-money-mule`, `check-overpayment`, `crypto-deposit`, `fake-recruiter`, `data-harvesting`, `equipment-kit`.

---

### Task 1: Scam-pattern registry + integrity tests

**Files:**
- Create: `lib/scam-patterns.ts`
- Test: `test/scam-patterns.test.mjs`

**Interfaces:**
- Produces: `SCAM_PATTERNS: ScamPattern[]`, `getScamPattern(slug): ScamPattern | undefined`, `scamPatternSlugs(): string[]`, and the `ScamPattern`/`ScamFaq` types.

- [ ] **Step 1: Write failing integrity test** (`test/scam-patterns.test.mjs`). Because the registry is a `.ts` module, load it through the repo's existing pattern for testing TS from `node:test` — read `test/helpers/` first; if no loader fits, compile via `tsc` is not available per-test, so instead export a parallel plain check: the test imports the built data by reading the source with a tiny transform is brittle — prefer a `.mjs` sibling. **Decision:** author the registry as `lib/scam-patterns.mjs` (pure data + functions, no types at runtime) plus a `lib/scam-patterns.d.ts` for types, mirroring the repo's `.mjs`+`.d.ts` convention (e.g. `claim-extraction.mjs`/`.d.ts`). Then the test imports the `.mjs` directly:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { SCAM_PATTERNS, getScamPattern, scamPatternSlugs } from '../lib/scam-patterns.mjs'

test('registry has >= 8 patterns with unique kebab-case slugs', () => {
  assert.ok(SCAM_PATTERNS.length >= 8)
  const slugs = SCAM_PATTERNS.map(p => p.slug)
  assert.equal(new Set(slugs).size, slugs.length)
  for (const s of slugs) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/)
})

test('every pattern has complete, non-empty content', () => {
  for (const p of SCAM_PATTERNS) {
    for (const f of ['name','searchTitle','metaDescription','summary']) {
      assert.ok(typeof p[f] === 'string' && p[f].trim().length > 0, `${p.slug}.${f}`)
    }
    assert.ok(p.metaDescription.length <= 160, `${p.slug} metaDescription too long`)
    for (const f of ['howItWorks','redFlags','whatToDo']) {
      assert.ok(Array.isArray(p[f]) && p[f].length > 0, `${p.slug}.${f}`)
    }
    assert.ok(Array.isArray(p.faq) && p.faq.length >= 3, `${p.slug}.faq`)
    for (const qa of p.faq) {
      assert.ok(qa.question?.trim() && qa.answer?.trim(), `${p.slug} faq entry`)
    }
  }
})

test('relatedSlugs resolve and helpers behave', () => {
  const known = new Set(scamPatternSlugs())
  for (const p of SCAM_PATTERNS) {
    for (const r of p.relatedSlugs) assert.ok(known.has(r), `${p.slug} -> ${r}`)
    assert.notEqual(getScamPattern(p.slug), undefined)
  }
  assert.equal(getScamPattern('does-not-exist'), undefined)
  assert.deepEqual([...known].sort(), SCAM_PATTERNS.map(p => p.slug).sort())
})
```

- [ ] **Step 2: Run it — expect FAIL** (module missing). Run: `node --test test/scam-patterns.test.mjs`.

- [ ] **Step 3: Author `lib/scam-patterns.mjs`** — the 8 pattern entries (content generated to the schema below) + accessors. Shape (one worked example shown; all 8 follow it):

```js
// @ts-check
/** @typedef {{ question: string, answer: string }} ScamFaq */
/** @typedef {{ slug:string, name:string, aka:string[], searchTitle:string, metaDescription:string, summary:string, howItWorks:string[], redFlags:string[], whatToDo:string[], faq:ScamFaq[], relatedSlugs:string[] }} ScamPattern */

/** @type {ScamPattern[]} */
export const SCAM_PATTERNS = [
  {
    slug: 'upfront-fee',
    name: 'Upfront-fee job scams',
    aka: ['pay-to-start', 'registration fee scam', 'training fee scam'],
    searchTitle: 'Is this an upfront-fee job scam?',
    metaDescription: 'Legitimate employers never ask you to pay to start. How to spot upfront-fee, registration, and training-fee job scams — and what to do.',
    summary: 'A real job pays you — it never asks you to pay first. Upfront-fee scams demand money for training, equipment, registration, or a starter kit before you can begin.',
    howItWorks: [
      'You are "hired" quickly, often with no real interview.',
      'Before you can start, you are asked to pay for training, a background check, equipment, or a starter kit.',
      'Payment is requested via gift cards, crypto, e-wallet, or bank transfer — methods that are hard to reverse.',
      'After you pay, the "employer" disappears or asks for more.',
    ],
    redFlags: [
      'Any request to pay money to get or keep the job.',
      'Payment demanded in gift cards, crypto, or wire transfer.',
      'Urgency and pressure to pay immediately.',
      'A job offer with no interview or vague responsibilities.',
    ],
    whatToDo: [
      'Do not pay. Legitimate employers never charge you to work.',
      'Stop contact and do not send more money or personal documents.',
      'Verify the company via its official website and a direct phone number you looked up yourself.',
      'Report the post to the platform where you found it.',
    ],
    faq: [
      { question: 'Do real employers ever charge a fee?', answer: 'No. Legitimate employers cover the cost of training, equipment, and background checks. Being asked to pay to start is one of the clearest scam signals.' },
      { question: 'I already paid — what now?', answer: 'Stop all further payments, keep records and screenshots, contact your bank or payment provider about a reversal, and report the scam to the platform and your local authorities.' },
      { question: 'Is a refundable deposit okay?', answer: 'Treat "refundable" deposits for a job with the same suspicion — refunds rarely materialize and the framing is designed to lower your guard.' },
    ],
    relatedSlugs: ['equipment-kit', 'crypto-deposit'],
  },
  // ... 7 more entries with the same shape
]

const BY_SLUG = new Map(SCAM_PATTERNS.map((p) => [p.slug, p]))
/** @param {string} slug */
export function getScamPattern(slug) { return BY_SLUG.get(slug) }
export function scamPatternSlugs() { return SCAM_PATTERNS.map((p) => p.slug) }
```

Also create `lib/scam-patterns.d.ts` exporting the `ScamPattern`/`ScamFaq` types and the three declarations so `.ts` importers get types.

- [ ] **Step 4: Run tests — expect PASS.** Run: `node --test test/scam-patterns.test.mjs`.
- [ ] **Step 5: Typecheck.** Run: `npm run lint`.
- [ ] **Step 6: Commit.**

```bash
git add lib/scam-patterns.mjs lib/scam-patterns.d.ts test/scam-patterns.test.mjs
git commit -m "feat(scams): typed scam-pattern registry with integrity tests"
```

---

### Task 2: SEO — JSON-LD builder + registry-derived sitemap entries

**Files:**
- Modify: `lib/seo.ts` (add `buildScamPatternJsonLd`, `scamSitemapEntries`; extend `PUBLIC_SITEMAP_ENTRIES`)
- Test: `test/scam-seo.test.mjs`

**Interfaces:**
- Consumes: `SCAM_PATTERNS`, `getScamPattern` from `lib/scam-patterns.mjs`; `SITE_URL`, `absoluteUrl`.
- Produces: `buildScamPatternJsonLd(pattern): object`, `scamSitemapEntries(): SitemapEntry[]`.

- [ ] **Step 1: Write failing test** (`test/scam-seo.test.mjs`):

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { SCAM_PATTERNS } from '../lib/scam-patterns.mjs'
import { buildScamPatternJsonLd, scamSitemapEntries } from '../lib/seo.mjs'

test('JSON-LD has Article + FAQPage with matching FAQ count and absolute urls', () => {
  const p = SCAM_PATTERNS[0]
  const ld = buildScamPatternJsonLd(p)
  const graph = ld['@graph']
  const article = graph.find(n => n['@type'] === 'Article')
  const faq = graph.find(n => n['@type'] === 'FAQPage')
  assert.ok(article && faq)
  assert.equal(faq.mainEntity.length, p.faq.length)
  assert.match(article.mainEntityOfPage, /^https:\/\/hireproof\.tech\/scams\//)
})

test('sitemap entries include /scams and every pattern url', () => {
  const paths = scamSitemapEntries().map(e => e.path)
  assert.ok(paths.includes('/scams'))
  for (const p of SCAM_PATTERNS) assert.ok(paths.includes(`/scams/${p.slug}`))
})
```

> Note: `lib/seo.ts` is TypeScript. The test imports `../lib/seo.mjs`. Since seo.ts is TS-only, add the two pure functions in a small **`lib/scam-seo.mjs`** (imports only `scam-patterns.mjs` + a local `SITE_URL` constant) to keep them node-testable, and re-export them from `lib/seo.ts` for app use. Update the test import to `../lib/scam-seo.mjs`. This avoids transpiling `seo.ts` in `node:test`.

- [ ] **Step 2: Run it — expect FAIL.** Run: `node --test test/scam-seo.test.mjs`.

- [ ] **Step 3: Create `lib/scam-seo.mjs`:**

```js
import { SCAM_PATTERNS } from './scam-patterns.mjs'

const SITE_URL = 'https://hireproof.tech'
const abs = (path) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

export function buildScamPatternJsonLd(pattern) {
  const url = abs(`/scams/${pattern.slug}`)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: pattern.searchTitle,
        description: pattern.metaDescription,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'HireProof', url: SITE_URL },
        publisher: { '@type': 'Organization', name: 'HireProof', url: SITE_URL },
        inLanguage: 'en-US',
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: pattern.faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  }
}

export function scamSitemapEntries() {
  return [
    { path: '/scams', changeFrequency: 'monthly', priority: 0.8 },
    ...SCAM_PATTERNS.map((p) => ({ path: `/scams/${p.slug}`, changeFrequency: 'monthly', priority: 0.75 })),
  ]
}
```

- [ ] **Step 4: Wire into `lib/seo.ts`** — re-export for app use and extend the sitemap array:

```ts
export { buildScamPatternJsonLd, scamSitemapEntries } from '@/lib/scam-seo.mjs'
```
and append to `PUBLIC_SITEMAP_ENTRIES` construction (import `scamSitemapEntries` at top of seo.ts and spread its result into the exported array):

```ts
import { scamSitemapEntries } from '@/lib/scam-seo.mjs'
// ...
export const PUBLIC_SITEMAP_ENTRIES: SitemapEntry[] = [
  // ...existing entries...
  ...scamSitemapEntries(),
]
```

- [ ] **Step 5: Run tests — expect PASS.** Run: `node --test test/scam-seo.test.mjs`.
- [ ] **Step 6: Typecheck.** Run: `npm run lint`.
- [ ] **Step 7: Commit.**

```bash
git add lib/scam-seo.mjs lib/seo.ts test/scam-seo.test.mjs
git commit -m "feat(scams): JSON-LD + registry-derived sitemap entries"
```

---

### Task 3: Pattern page `app/scams/[pattern]/page.tsx`

**Files:**
- Create: `app/scams/[pattern]/page.tsx`

**Interfaces:**
- Consumes: `getScamPattern`, `scamPatternSlugs` (`@/lib/scam-patterns.mjs`); `pageMetadata`, `buildScamPatternJsonLd` (`@/lib/seo`); `SiteHeader`.

- [ ] **Step 1: Confirm the params convention** — read `app/audit/[id]/page.tsx` to match how this repo types `generateMetadata`/`generateStaticParams` params (async `Promise<{…}>` vs sync). Use the same.

- [ ] **Step 2: Implement the page** (server component). Structure:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { getScamPattern, scamPatternSlugs } from '@/lib/scam-patterns.mjs'
import { pageMetadata, buildScamPatternJsonLd } from '@/lib/seo'

export function generateStaticParams() {
  return scamPatternSlugs().map((pattern) => ({ pattern }))
}

// Match the exact params typing to app/audit/[id]/page.tsx (async in Next 16).
export async function generateMetadata({ params }: { params: Promise<{ pattern: string }> }): Promise<Metadata> {
  const { pattern } = await params
  const p = getScamPattern(pattern)
  if (!p) return pageMetadata({ path: `/scams/${pattern}`, title: 'Job scam patterns', description: 'Spot and avoid recruitment fraud.', index: false })
  return pageMetadata({ path: `/scams/${p.slug}`, title: p.searchTitle, description: p.metaDescription, index: true })
}

export default async function ScamPatternPage({ params }: { params: Promise<{ pattern: string }> }) {
  const { pattern } = await params
  const p = getScamPattern(pattern)
  if (!p) notFound()
  const jsonLd = buildScamPatternJsonLd(p)
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-3xl px-6 py-12 md:px-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{p.searchTitle}</h1>
        <p className="mt-4 text-lg font-medium text-muted">{p.summary}</p>

        <section className="mt-10">
          <h2 className="text-xl font-black">How this scam works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6">
            {p.howItWorks.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black">Red flags</h2>
          <ul className="mt-3 space-y-2">
            {p.redFlags.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-semibold leading-6">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-risk-bg" /><span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-safe/25 bg-safe/5 p-6">
          <h2 className="text-xl font-black">What to do right now</h2>
          <ul className="mt-3 space-y-2">
            {p.whatToDo.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-semibold leading-6">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-safe" /><span>{s}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black">FAQ</h2>
          <div className="mt-3 space-y-3">
            {p.faq.map((f, i) => (
              <details key={i} className="rounded-xl border border-border-soft bg-surface p-4">
                <summary className="cursor-pointer text-sm font-black">{f.question}</summary>
                <p className="mt-2 text-sm font-medium leading-6 text-muted">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-border-soft bg-surface p-6 text-center shadow-sm">
          <h2 className="text-xl font-black">Not sure about a specific post?</h2>
          <p className="mt-2 text-sm font-semibold text-muted">Paste it into HireProof for an instant, evidence-backed check.</p>
          <Link href="/audit" className="hireproof-cta-primary mt-4 inline-flex rounded-xl px-6 py-3 text-sm font-black shadow-lg">Check my post</Link>
        </section>

        {p.relatedSlugs.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted">Related scam patterns</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.relatedSlugs.map((slug) => {
                const r = getScamPattern(slug)
                return r ? <Link key={slug} href={`/scams/${slug}`} className="rounded-full border border-border-soft bg-surface px-3 py-1 text-xs font-black hover:text-safe">{r.name}</Link> : null
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Build & spot-check.** Run: `npm run build`. Expect `/scams/[pattern]` prerendered for all slugs (look for the routes in the build output). Then grep a built page HTML for the H1 and a `/audit` link.
- [ ] **Step 4: Commit.**

```bash
git add app/scams/[pattern]/page.tsx
git commit -m "feat(scams): server-rendered pattern hub page with JSON-LD"
```

---

### Task 4: Index page `app/scams/page.tsx`

**Files:**
- Create: `app/scams/page.tsx`

- [ ] **Step 1: Implement** (server component, `index:true`):

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SCAM_PATTERNS } from '@/lib/scam-patterns.mjs'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/scams',
  title: 'Job Scam Patterns | Spot & Avoid Recruitment Fraud',
  description: 'Learn the most common job and recruitment scam patterns — how each works, the red flags, and what to do. Then check any suspicious post with HireProof.',
})

export default function ScamsIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 md:px-10">
        <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Job Scam Patterns</h1>
        <p className="mt-4 max-w-2xl text-lg font-medium text-muted">The recurring ways job and recruitment scams work. Learn the red flags, then paste any suspicious post into HireProof for an instant, evidence-backed check.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SCAM_PATTERNS.map((p) => (
            <Link key={p.slug} href={`/scams/${p.slug}`} className="group rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:border-safe/40 hover:shadow-lg">
              <h2 className="text-lg font-black group-hover:text-safe">{p.name}</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-muted">{p.summary}</p>
            </Link>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-border-soft bg-surface p-6 text-center">
          <Link href="/audit" className="hireproof-cta-primary inline-flex rounded-xl px-6 py-3 text-sm font-black shadow-lg">Check a job post</Link>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Build.** Run: `npm run build` → `/scams` prerendered (static).
- [ ] **Step 3: Commit.**

```bash
git add app/scams/page.tsx
git commit -m "feat(scams): /scams index page linking every pattern"
```

---

### Task 5: Full verification

- [ ] **Step 1:** `npm run lint` && `npm run build` (confirm `/scams` + all `/scams/[pattern]` are static `○`).
- [ ] **Step 2:** `node --test test/scam-patterns.test.mjs test/scam-seo.test.mjs`.
- [ ] **Step 3:** `npm run test:security` (no regressions; sitemap/robots wiring still green).
- [ ] **Step 4:** Grep the built output to confirm each `/scams/<slug>` static page exists and one contains its H1, FAQ text, JSON-LD `FAQPage`, and a `/audit` link.
- [ ] **Step 5:** Commit any fixes, then push + open PR against `dev`.

---

## Self-Review

- **Spec coverage:** registry §3.1 → Task 1; JSON-LD + sitemap §3.4 → Task 2; pattern page §3.2 → Task 3; index §3.3 → Task 4; testing §6 → Tasks 1-2 + Task 5; verification §7 → Task 5. All mapped.
- **Placeholder scan:** the 7 remaining pattern entries are *data authored to the shown schema* (generated during Task 1), not logic placeholders; one full worked entry is shown. All code steps are concrete.
- **Type consistency:** `ScamPattern`/`ScamFaq` fields, `getScamPattern`/`scamPatternSlugs`/`SCAM_PATTERNS`, `buildScamPatternJsonLd`/`scamSitemapEntries` names are consistent across tasks. Registry authored as `.mjs`+`.d.ts` (repo convention) so `node:test` imports it directly and app `.ts`/`.tsx` gets types; `.ts`-only SEO helpers moved to `lib/scam-seo.mjs` for the same reason.
- **Decision locked:** `.mjs`+`.d.ts` for the registry and a separate `lib/scam-seo.mjs` for node-testable SEO helpers (re-exported from `seo.ts`) — resolves the "test TS from node:test" tension without a transpile step.
