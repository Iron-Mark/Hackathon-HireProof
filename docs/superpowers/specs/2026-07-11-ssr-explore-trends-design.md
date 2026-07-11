# Design — SSR `/explore` + `/trends` (Spec 2, Slice 2)

- **Date:** 2026-07-11
- **Status:** Approved design, ready for implementation plan
- **Branch:** `feat/ssr-explore-trends`
- **Scope:** Slice 2 of Spec 2 (SEO / discoverability). Slice 1 (`/scams` hub pages) is merged. Slice 3 (AI-crawler access) deferred.

## 1. Problem

`/explore` (the public Audit Database) and `/trends` are marked `index:true` and sit in the sitemap, but
they render as **empty client shells**: [explore-client.tsx](../../../app/explore/explore-client.tsx) and
[trends-client.tsx](../../../app/trends/trends-client.tsx) fetch their data in a `useEffect` after
hydration, so the server HTML a crawler sees is just a heading + skeleton with no report content. The
indexable slots are wasted.

## 2. Goals / Non-goals

**Goals**
- Server-render the initial dataset for both pages so crawlers (and first paint) get real HTML.
- Preserve `/explore` search + verdict-filter interactivity.
- Preserve `/trends` JSON/CSV export.
- **Zero added provider cost:** SSR reads only the local reports DB; no paid SerpApi calls per render.

**Non-goals**
- Live external SerpApi trend signals in SSR (kept as stored-audits only; a possible future enhancement).
- Any change to the `/api/intelligence/*` routes' contracts (still used for filtered re-fetches).
- Redesign of the pages' visuals.

## 3. Architecture — server shell + client island

Each page becomes a server component that fetches initial data from the lib functions directly (no HTTP
round-trip) and passes it as props to the existing client component, which renders it immediately and keeps
its interactivity.

### 3.1 `/explore`
- `app/explore/page.tsx` (server): `selectPublicReports(await listReports(200), { limit: 50 })` →
  `{ reports, total }`. Render `<ExploreClient initialReports={reports} initialTotal={total} />`.
- `lib/public-intelligence-reports.mjs`: add pure `selectPublicReports(rawReports, { query = '', verdict =
  'all', limit = 50 })` that runs `filterPublicIntelligenceReports`, applies the query/verdict filter
  (same haystack as the API), and returns `{ reports: filtered.slice(0, limit).map(sanitizePublicIntelligenceReport), total: filtered.length }`.
  The API route ([app/api/intelligence/reports/route.ts](../../../app/api/intelligence/reports/route.ts))
  is refactored to use this same helper (DRY; keeps its rate-limit + JSON wrapper).
- `ExploreClient` gains `initialReports` / `initialTotal` props: seeds state from them, **skips the initial
  fetch** (a `useRef` first-run guard), and still re-fetches `/api/intelligence/reports` when `query` or
  `verdict` change.

### 3.2 `/trends`
- `app/trends/page.tsx` (server): `const trends = await getReportTrends()`; build `initialStats = { ...trends,
  externalSignals: [], externalSignalsStatus: 'not-live', mode: 'stored-audits' }` (matches the API's
  default, no paid call). Render `<TrendsClient initialStats={initialStats} />`.
- `TrendsClient` gains an `initialStats` prop: renders from it immediately (no loading spinner, no mount
  fetch). JSON/CSV export buttons continue to operate on `initialStats`.

### 3.3 Rendering mode
- Add `export const revalidate = 300` to both pages (ISR: crawlable real HTML, cached 5 min, cheap on the
  DB). If the build instead classifies them as dynamic (`ƒ`) because the DB read is uncached, that is
  equally crawlable and acceptable — confirmed from build output.

## 4. Data flow

```
Crawler / first request → app/explore/page.tsx (server)
  → selectPublicReports(listReports(200), {limit:50}) → {reports,total}   [DB only, no paid calls]
  → <ExploreClient initialReports total/>  → real HTML
  → user types/filters → client re-fetches /api/intelligence/reports?q=&verdict=  (unchanged)

Crawler / first request → app/trends/page.tsx (server)
  → getReportTrends() → initialStats (stored-audits)   [DB only]
  → <TrendsClient initialStats/> → real HTML → export buttons operate on initialStats
```

## 5. Error handling

- If the DB is empty or unavailable, `listReports`/`getReportTrends` return empty structures; the existing
  empty-state UI ("No public live reports yet") renders. No throw path added.

## 6. Testing

- **`selectPublicReports` unit test** (`test/public-intelligence-select.test.mjs`): given a mixed set of raw
  reports, it (a) drops non-public ones via `filterPublicIntelligenceReports`, (b) applies query + verdict
  filters over the company/role/location/summary haystack, (c) returns `total` = full filtered count and
  `reports` = sanitized first `limit`.
- **API parity:** assert the reports route still returns `{ reports, total }` with the same filtering (the
  refactor is behavior-preserving) — a source assertion that the route calls `selectPublicReports`.
- **Wiring:** assert `app/explore/page.tsx` passes `initialReports`/`initialTotal` and `ExploreClient` skips
  the initial fetch when props are present; assert `app/trends/page.tsx` passes `initialStats` and
  `TrendsClient` has no mount fetch. Add these to `runtime-wiring` or a small dedicated test.

## 7. Verification gates

```
npm run lint
npm run build            # /explore and /trends render real content (ISR or dynamic)
node --test test/public-intelligence-select.test.mjs
npm run test:security
```
Plus a grep of the built `/explore` output (or a local server fetch) confirming report content is present in
server HTML rather than only a skeleton.

## 8. Risks & mitigations

- **Behavior drift in the reports API from the refactor.** Mitigation: `selectPublicReports` is a pure
  extraction of the route's existing logic, covered by a unit test; the route keeps its rate-limit/wrapper.
- **Cost regression via trends external signals.** Mitigation: SSR uses stored-audits only; no SerpApi path.
- **Hydration mismatch** (server data vs client initial state). Mitigation: client seeds state directly from
  props; first-render output is identical server and client.

## 9. Out of scope

Live external trend signals in SSR, AI-crawler access (Slice 3), any `/api/intelligence/*` contract change.
