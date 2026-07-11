# Design — Curated `/scams/[pattern]` Hub Pages (Spec 2, Slice 1)

- **Date:** 2026-07-11
- **Author:** Mark Siazon (with Claude Code)
- **Status:** Approved design, ready for implementation plan
- **Branch:** `feat/scam-hub-pages`
- **Scope:** Slice 1 of Spec 2 (SEO / discoverability). Slices 2 (SSR `/explore`+`/trends`) and 3 (AI-crawler access) are deferred.

## 1. Problem

HireProof produces exactly the content searchers want ("is [pattern] a job scam?"), but none of it is
indexable. `/explore` and `/trends` render as empty client shells (data fetched in `useEffect`), per-report
`/audit/[id]` pages are hard-`noindex`, and the sitemap ([lib/seo.ts](../../../lib/seo.ts)
`PUBLIC_SITEMAP_ENTRIES`) is 100% static marketing/docs routes. There are **zero server-rendered pages
targeting searcher intent**, so organic search cannot find HireProof for its core query — the acquisition
loop a scam-checker depends on.

## 2. Goals / Non-goals

**Goals**
- Ship a small set of **server-rendered, indexable** hub pages targeting "is X a job scam?" intent.
- Evergreen editorial content only — no user/report data, no external calls, no privacy/defamation exposure.
- Strong CTA from each page into `/audit`, closing the search → use loop.
- Registry-driven so adding a pattern is one data edit (page, metadata, sitemap, JSON-LD all follow).

**Non-goals (later slices / out of scope)**
- SSR of `/explore` and `/trends` (Slice 2).
- Un-blocking AI retrieval crawlers in `robots.ts` / `proxy.ts` (Slice 3 — a policy reversal needing its
  own decision; `proxy.ts` enforcement + `runtime-wiring` test pin the current block).
- Embedding any report-DB rows or aggregate stats in these pages.
- De-`noindex`ing individual `/audit/[id]` reports (stays `noindex`).

## 3. Architecture

A typed, pure-data registry drives fully static server-rendered pages. No client JS.

```
lib/scam-patterns.ts   (registry: pure data + typed accessors)
        │
        ├── app/scams/page.tsx            (index: lists every pattern)
        ├── app/scams/[pattern]/page.tsx  (generateStaticParams + generateMetadata + render)
        └── lib/seo.ts                    (buildScamPatternJsonLd + registry-derived sitemap entries)
```

### 3.1 Registry — `lib/scam-patterns.ts`

```ts
export type ScamFaq = { question: string; answer: string }
export type ScamPattern = {
  slug: string            // url segment, kebab-case, unique
  name: string            // display name, e.g. "Upfront-fee job scams"
  aka: string[]           // alternate names for on-page context
  searchTitle: string     // <title>, question-style, e.g. "Is this an upfront-fee job scam?"
  metaDescription: string // <=155 chars
  summary: string         // 1-2 sentence plain-language summary
  howItWorks: string[]    // ordered steps
  redFlags: string[]      // concrete signals
  whatToDo: string[]      // imperative safety actions
  faq: ScamFaq[]          // 3-5 Q&A
  relatedSlugs: string[]  // must resolve to other slugs
}

export const SCAM_PATTERNS: ScamPattern[]
export function getScamPattern(slug: string): ScamPattern | undefined
export function scamPatternSlugs(): string[]
```

**Pattern set (8), mapped to the engine's real classifiers where applicable:**
1. `upfront-fee` — pay-to-start / registration/training fees (`UPFRONT_PAYMENT_TERMS`)
2. `whatsapp-telegram-task` — interview-less recruiter pivot to WhatsApp/Telegram tasks (`OFF_PLATFORM`)
3. `reshipping-money-mule` — package-forwarding / payment-processing money-mule (`MONEY_MULE_RE`)
4. `check-overpayment` — fake check / overpayment refund scam
5. `crypto-deposit` — crypto deposit / "buy-to-work" (`CRYPTO_DEPOSIT_RE`, `BUY_TO_WORK_RE`)
6. `fake-recruiter` — impersonated recruiter / cloned job post
7. `data-harvesting` — fake onboarding harvesting IDs/bank details (`CREDENTIAL_HARVEST_TERMS`)
8. `equipment-kit` — pay-to-train / mandatory equipment-kit purchase

### 3.2 Pattern page — `app/scams/[pattern]/page.tsx`

- Server component. `generateStaticParams()` returns `scamPatternSlugs().map(pattern => ({ pattern }))`
  → all pages statically prerendered.
- `generateMetadata({ params })`: unknown slug → `notFound()`; known → `pageMetadata({ path:
  '/scams/'+slug, title: searchTitle, description: metaDescription, index: true })`.
- Renders (reusing `SiteHeader` + existing Tailwind design tokens): question H1 → summary → "How this scam
  works" (ordered) → "Red flags" → "What to do right now" (honest tone from Spec 1) → FAQ as static
  `<details>` (no client JS) → CTA card linking to `/audit` ("Check my post") → related patterns.
- Injects `buildScamPatternJsonLd(pattern)` via a `<script type="application/ld+json">`.

### 3.3 Index page — `app/scams/page.tsx`

- Server component, `pageMetadata({ path: '/scams', title: 'Job Scam Patterns | Spot & Avoid Recruitment
  Fraud', description: …, index: true })`. Lists every pattern as a card linking to its page. Brief intro +
  CTA to `/audit`.

### 3.4 SEO helpers — `lib/seo.ts`

- `buildScamPatternJsonLd(pattern)` → `@graph` with an `Article` (headline = searchTitle, author/publisher
  reuse existing `@id`s, `mainEntityOfPage` = absolute `/scams/slug`) and a `FAQPage` (from `faq`).
- Registry-derived sitemap: export `scamSitemapEntries()` returning `{ path:'/scams', … }` plus one entry
  per slug; spread into `PUBLIC_SITEMAP_ENTRIES` (or `app/sitemap.ts` concatenates). Import must not create
  a cycle — `scam-patterns.ts` has no dependency on `seo.ts`.

## 4. Data flow

Build time: `generateStaticParams` enumerates the registry → Next prerenders `/scams` + each
`/scams/[slug]` to static HTML with metadata + JSON-LD. Request time: static HTML served, zero runtime work.
`app/sitemap.ts` maps `PUBLIC_SITEMAP_ENTRIES` (now including scam routes) → `sitemap.xml`.

## 5. Error handling

- Unknown `/scams/[pattern]` slug → `notFound()` (Next 404). Covered by a test asserting `getScamPattern`
  returns `undefined` for an unknown slug.
- `relatedSlugs` that don't resolve are a registry bug → caught by an integrity test, not a runtime path.

## 6. Testing (`test/scam-patterns.test.mjs` + wiring)

- **Registry integrity:** ≥8 patterns; every `slug` unique and kebab-case; `name/searchTitle/
  metaDescription/summary` non-empty; `metaDescription` ≤ 160 chars; `howItWorks/redFlags/whatToDo` each
  non-empty; `faq` has ≥3 entries each with non-empty `question`/`answer`; every `relatedSlugs` entry
  resolves to an existing slug.
- **Static params:** `scamPatternSlugs()` equals the set of registry slugs (no dupes/omissions).
- **JSON-LD:** `buildScamPatternJsonLd(pattern)` returns an `@graph` containing an `Article` and a
  `FAQPage`; `FAQPage.mainEntity` length equals `faq.length`; URLs are absolute `hireproof.tech/scams/...`.
- **Sitemap:** `PUBLIC_SITEMAP_ENTRIES` (or `sitemap()`) includes `/scams` and every `/scams/<slug>` with
  `index`-able priority; a wiring assertion that scam routes are present.
- **Metadata:** the pattern page's `generateMetadata` yields `robots.index === true` and a canonical of
  `/scams/<slug>` for a known slug.

## 7. Verification gates

```
npm run lint
npm run build            # expect /scams and /scams/[pattern] prerendered (static)
node --test test/scam-patterns.test.mjs
npm run test:security
```
Plus a grep of the built output confirming `/scams/<slug>` static pages exist and a spot-check that a
pattern page's HTML contains its H1 + FAQ + a link to `/audit`.

## 8. Risks & mitigations

- **Thin/low-quality content ranks poorly.** Mitigation: genuinely useful, specific, non-boilerplate copy
  per pattern (real red flags, concrete actions), distinct titles/descriptions, FAQ schema.
- **Duplicate/overlapping patterns dilute relevance.** Mitigation: 8 distinct archetypes, cross-linked via
  `relatedSlugs` rather than merged.
- **Honest-boundary drift.** Mitigation: no fabricated stats or "N reports" social proof; evergreen
  educational content only; CTA uses the honest "Check my post" framing from Spec 1.
- **Sitemap import cycle.** Mitigation: `scam-patterns.ts` depends on nothing in `seo.ts`; seo/sitemap
  import the registry one-way.

## 9. Out of scope

SSR `/explore`+`/trends` (Slice 2), AI-crawler access (Slice 3), report-DB aggregates, `/audit/[id]`
indexing.
