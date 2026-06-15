# HireProof Pro-Research Intake Summary

Verified on `2026-06-15` from the archived pro-research source pack, current repo source, targeted repo tests, and live proof against `https://hireproof.tech`.

## Status Table

| Area | Status | Evidence | Follow-up |
| --- | --- | --- | --- |
| Source archive | implemented | This archive exists at `docs/spec/hireproof` with `ref/original` and `ref/extracted` preserved. | Keep this folder as the source-backed archive. |
| Target repo confirmation | implemented | Root `AGENTS.md` defines HireProof as a job-post, recruiter-message, and job-URL scam verification product. | Do not broaden into generic AI/fraud checking. |
| Source coverage | implemented | `source-coverage.md` lists both approved PDF sources and their extracted Markdown. | Product deep audit and execution-plan Markdown remain missing source-type gaps. |
| Canonical host policy | implemented | `proxy.ts` redirects `www.hireproof.tech` and `hireproof-sigma.vercel.app` to `https://hireproof.tech` with `308`. | Recheck live redirect after deploy or DNS changes. |
| Canonical metadata | implemented | `lib/seo.ts` sets `SITE_URL = 'https://hireproof.tech'`; page metadata uses shared canonical helpers. | Keep generated URLs aligned to the apex host. |
| Structured data and PWA metadata | implemented | `lib/seo.ts` contains Organization, Person, WebSite, and SoftwareApplication JSON-LD; `public/manifest.json` is covered by `test/seo-metadata.test.mjs`. | Preserve these when simplifying layout/client code. |
| Public metadata, robots, sitemap | implemented | `test/seo-metadata.test.mjs` covers sitemap entries, robots disallow rules, manifest metadata, and top-level page metadata. | Add route-specific checks when new public routes ship. |
| Client component and JS cost audit | implemented | Homepage static content moved from the deleted `app/home-client.tsx` client root into server-rendered `app/home-page.tsx`; the animated hero proof card and demo click tracking now live in small client islands. `/audit` and `/lab` route shells now render `SiteHeader` outside their interactive client bodies. | Remaining full-client surfaces are intentionally interactive demo/lab/audit bodies; split deeper only if future bundle traces justify it. |
| LCP and INP optimization | implemented | `components/brand/brand-mark.tsx` now uses `next/image`; the homepage decorative meme image uses `Image` with `preload`, `fetchPriority="high"`, and `sizes`. `npm run proof:web-vitals` records route-level LCP element attribution. Latest live report pointer: `artifacts/web-vitals/hireproof-web-vitals-latest.json`. | Use the LCP element field in future route proof to avoid optimizing non-LCP assets. |
| Web Vitals measurement gate | implemented | `npm run proof:web-vitals` records mobile LCP, LCP element, CLS, and long-task budgets across `/`, `/audit`, `/demo/linkedin`, `/docs`, and `/lab`; it writes both timestamped history and `artifacts/web-vitals/hireproof-web-vitals-latest.json`. | Use this as the repeatable lab gate; field P75 data remains separate. |
| Crawl and social preview proof | implemented | `npm run proof:crawl-social` verifies `robots.txt`, `sitemap.xml`, canonical sitemap URLs, private-route exclusion, and homepage Open Graph/Twitter tags. Latest live report pointer: `artifacts/seo-crawl-preview/hireproof-crawl-social-latest.json`. | Live social platforms can cache cards, so rerun after deploy or major metadata changes. |
| Product positioning | implemented | Root `AGENTS.md` requires the product story to stay centered on employment fraud and job scams. | Keep free job-post audit path visible and crawlable. |

## Source Recommendation Status Map

| Source theme | Status | Evidence or reason |
| --- | --- | --- |
| Canonical apex host with permanent `www` redirect | implemented | `proxy.ts` redirects `www.hireproof.tech` and the old Vercel host to `https://hireproof.tech` with `308`; covered by `test/proxy-canonical-redirect.test.mjs`. |
| Shared canonical URLs, Open Graph, Twitter, title, and description metadata | implemented | `lib/seo.ts`, `app/layout.tsx`, and top-level page metadata are covered by `test/seo-metadata.test.mjs`. |
| Robots and sitemap coverage for public/private routes | implemented | `app/robots.ts`, `app/sitemap.ts`, and `PUBLIC_SITEMAP_ENTRIES` are covered by `test/seo-metadata.test.mjs`. |
| Preserve PWA manifest metadata | implemented | `public/manifest.json` is covered by `test/seo-metadata.test.mjs`. |
| Preserve structured data for organization, person, website, and software app | implemented | `buildSiteJsonLd()` in `lib/seo.ts` is covered by the root metadata tests. |
| Keep HireProof focused on job-scam verification | implemented | Root `AGENTS.md`, homepage hero copy, `/audit`, and docs describe job posts, recruiter messages, job URLs, screenshots, and employment fraud. |
| Keep free audit/demo path visible | implemented | Homepage primary CTA links to `/audit`; secondary CTA links to `/audit?demo=high-risk`; sitemap includes `/audit`. |
| Keep developer integrations as proof, not the first-screen story | implemented | Homepage first screen leads with job-scam investigation; automation and developer integration sections appear after the pilot/product sections. |
| Audit large client components | implemented | Intake identified the old homepage client root, shared header/footer/docs surfaces, demo/linkedin, lab, and audit result UI as the main client/animation-heavy surfaces. |
| Move static content back to server output where possible | implemented | `/` is now server-rendered through `app/home-page.tsx`, with only `app/home-demo-panel.tsx`, `app/home-demo-link.tsx`, ticker, quiz, and navigation controls left as client islands. `/audit` and `/lab` render route chrome from their server pages. |
| Reduce JavaScript cost before adding demos | implemented | Removed the full-page homepage client root, isolated the animated demo panel, and kept route proof green after the split. Build output shows `/` as static prerendered content. |
| Identify and optimize the real LCP element | implemented | `scripts/check-web-vitals.mjs` now records the LCP element per route and refreshes `artifacts/web-vitals/hireproof-web-vitals-latest.json`; latest live proof identifies text LCP on `/`, `/audit`, `/docs`, and `/lab`, and `H1` on `/demo/linkedin`. |
| Check INP risk from scanning flows, animation, and client tasks | implemented | `npm run proof:web-vitals` now includes `/audit`, `/demo/linkedin`, and `/lab`, recording long-task totals and max long-task duration as lab risk indicators. |
| Add Lighthouse/PageSpeed/field Web Vitals measurement gate | implemented | Added `scripts/check-web-vitals.mjs` and package script `proof:web-vitals`; latest live report passed all measured routes and refreshed `artifacts/web-vitals/hireproof-web-vitals-latest.json`. |
| Track crawl and social preview behavior after changes | implemented | `scripts/verify-crawl-social-preview.mjs` records robots, sitemap, canonical URL, private-route exclusion, Open Graph, and Twitter card proof to `artifacts/seo-crawl-preview`. |

## Active Follow-Up Slice

1. Stage the code, scripts, docs, and selected proof artifacts intentionally before checkpointing; do not include every timestamped proof artifact unless the checkpoint needs the full local run history.
2. Rerun `npm run proof:web-vitals` and `npm run proof:crawl-social` after each deploy or major metadata/image change.
3. Keep field P75 Web Vitals separate from local lab proof until Search Console, CrUX, Vercel Speed Insights, or RUM export is available.
4. Split deeper client islands only when future bundle traces or field INP data show a real regression.

## Blocked Or Deferred

- Live Search Console submission and field P75 Core Web Vitals require external account or traffic evidence.
- The archive has no dedicated product deep audit or execution-plan source document, so deeper product roadmap claims should stay conservative.
