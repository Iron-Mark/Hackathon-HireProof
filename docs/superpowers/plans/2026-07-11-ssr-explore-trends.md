# SSR `/explore` + `/trends` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Server-render the initial dataset for `/explore` and `/trends` so crawlers get real HTML, preserving search/filter and export interactivity.

**Architecture:** Each page becomes a server component that reads the local reports DB directly and passes initial data as props to the existing client component (server shell + client island). A shared pure helper `selectPublicReports` de-duplicates the `/explore` filtering between the page and the API route.

**Tech Stack:** Next.js 16 App Router (server components, ISR `revalidate`), React, `node:test`.

## Global Constraints
- **No AI attribution** in commits/PRs.
- **No added provider cost:** SSR reads only the local DB (`listReports`, `getReportTrends`); no SerpApi.
- **No `/api/intelligence/*` contract change** (routes still return the same JSON).
- **Behavior-preserving refactor** of the reports route via the shared helper.

---

### Task 1: Extract `selectPublicReports` + refactor the reports API

**Files:**
- Modify: `lib/public-intelligence-reports.mjs` (add `selectPublicReports`) + `lib/public-intelligence-reports.d.ts` (declare it)
- Modify: `app/api/intelligence/reports/route.ts` (use the helper)
- Test: `test/public-intelligence-select.test.mjs`

- [ ] **Step 1: Write failing test** covering public-filtering, query+verdict filter, total, and sliced/sanitized reports:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { selectPublicReports } from '../lib/public-intelligence-reports.mjs'

const mk = (over) => ({
  id: over.id, verdict: over.verdict, summary: over.summary || '', riskScore: over.riskScore ?? 50,
  mode: over.mode || 'live', source: over.source || 'web', publiclyListed: over.publiclyListed ?? true,
  image: over.image, extractedClaims: { company: over.company || '', role: over.role || '', location: over.location || '' },
  redFlags: [], greenFlags: [], evidence: [], alternatives: [], nextSteps: [], timestamp: over.timestamp || '2026-07-01',
})

test('selectPublicReports filters public, applies query+verdict, returns total and sliced sanitized reports', () => {
  const raw = [
    mk({ id: 'a', verdict: 'high-risk', company: 'Acme', role: 'Courier' }),
    mk({ id: 'b', verdict: 'safe', company: 'Globex', role: 'Engineer' }),
    mk({ id: 'c', verdict: 'high-risk', company: 'Acme Labs', role: 'Analyst' }),
    mk({ id: 'd', verdict: 'high-risk', company: 'Hidden', mode: 'demo' }), // excluded by public filter
  ]
  const all = selectPublicReports(raw, {})
  assert.ok(all.total >= 3)
  assert.ok(!all.reports.some((r) => r.id === 'd'))

  const acme = selectPublicReports(raw, { query: 'acme' })
  assert.equal(acme.total, 2)
  const highrisk = selectPublicReports(raw, { verdict: 'high-risk', query: 'acme' })
  assert.equal(highrisk.total, 2)

  const limited = selectPublicReports(raw, { limit: 1 })
  assert.equal(limited.reports.length, 1)
  assert.ok(limited.total >= limited.reports.length)
})
```

- [ ] **Step 2: Run — expect FAIL** (`node --test test/public-intelligence-select.test.mjs`).

- [ ] **Step 3: Add `selectPublicReports`** to `lib/public-intelligence-reports.mjs` (mirrors the route's current logic):

```js
export function selectPublicReports(rawReports, { query = '', verdict = 'all', limit = 50 } = {}) {
  const q = (query || '').trim().toLowerCase()
  const reports = filterPublicIntelligenceReports(rawReports)
  const filtered = reports.filter((report) => {
    const haystack = [
      report.extractedClaims.company,
      report.extractedClaims.role,
      report.extractedClaims.location,
      report.summary,
    ].join(' ').toLowerCase()
    const queryMatch = !q || haystack.includes(q)
    const verdictMatch = verdict === 'all' || report.verdict === verdict
    return queryMatch && verdictMatch
  })
  return {
    reports: filtered.slice(0, limit).map(sanitizePublicIntelligenceReport),
    total: filtered.length,
  }
}
```
Add to `lib/public-intelligence-reports.d.ts`:
```ts
import type { AuditReport } from './schemas'
export function selectPublicReports(
  rawReports: AuditReport[],
  opts?: { query?: string; verdict?: string; limit?: number }
): { reports: AuditReport[]; total: number }
```

- [ ] **Step 4: Refactor the route** — `app/api/intelligence/reports/route.ts` replaces its inline filter with the helper (keep rate limit + response):

```ts
import { selectPublicReports } from '@/lib/public-intelligence-reports.mjs'
// ...after rate-limit check...
const { reports, total } = selectPublicReports(await listReports(200), { query, verdict, limit: 50 })
return NextResponse.json({ reports, total })
```
Remove now-unused `filterPublicIntelligenceReports` / `sanitizePublicIntelligenceReport` imports from the route if they become unused.

- [ ] **Step 5: Run tests — expect PASS.** `node --test test/public-intelligence-select.test.mjs`.
- [ ] **Step 6: Typecheck.** `npm run lint`.
- [ ] **Step 7: Commit.**
```bash
git add lib/public-intelligence-reports.mjs lib/public-intelligence-reports.d.ts app/api/intelligence/reports/route.ts test/public-intelligence-select.test.mjs
git commit -m "refactor(explore): extract selectPublicReports shared by the API and SSR"
```

---

### Task 2: SSR `/explore`

**Files:**
- Modify: `app/explore/page.tsx` (server data fetch + props)
- Modify: `app/explore/explore-client.tsx` (accept initial props, skip mount fetch)

- [ ] **Step 1: Server page** — `app/explore/page.tsx`:
```tsx
import { listReports } from '@/lib/db'
import { selectPublicReports } from '@/lib/public-intelligence-reports.mjs'
// ...keep existing metadata...
export const revalidate = 300
export default async function ExplorePage() {
  const { reports, total } = selectPublicReports(await listReports(200), { limit: 50 })
  return <ExploreClient initialReports={reports} initialTotal={total} />
}
```

- [ ] **Step 2: Client props + skip mount fetch** — `app/explore/explore-client.tsx`:
  - Signature: `export function ExploreClient({ initialReports = [], initialTotal = 0 }: { initialReports?: AuditReport[]; initialTotal?: number })`.
  - `const [reports, setReports] = useState<AuditReport[]>(initialReports)` and `const [totalReports, setTotalReports] = useState(initialTotal)`; `const [loading, setLoading] = useState(false)`.
  - Add `const firstRun = useRef(true)` and at the top of the fetch `useEffect`: `if (firstRun.current) { firstRun.current = false; return }` so the SSR-provided default list is not immediately refetched; keep the debounced fetch for subsequent `query`/`verdict` changes.

- [ ] **Step 3: Build.** `npm run build`. Confirm `/explore` renders report content server-side (ISR or dynamic).
- [ ] **Step 4: Commit.**
```bash
git add app/explore/page.tsx app/explore/explore-client.tsx
git commit -m "feat(explore): server-render initial Audit Database results for crawlers"
```

---

### Task 3: SSR `/trends`

**Files:**
- Modify: `app/trends/page.tsx`
- Modify: `app/trends/trends-client.tsx`

- [ ] **Step 1: Server page** — `app/trends/page.tsx`:
```tsx
import { getReportTrends } from '@/lib/db'
// ...keep existing metadata...
export const revalidate = 300
export default async function TrendsPage() {
  const trends = await getReportTrends()
  const initialStats = { ...trends, externalSignals: [], externalSignalsStatus: 'not-live', mode: 'stored-audits' }
  return <TrendsClient initialStats={initialStats} />
}
```

- [ ] **Step 2: Client from props** — `app/trends/trends-client.tsx`:
  - Signature: `export function TrendsClient({ initialStats }: { initialStats: any })`.
  - `const [stats] = useState<any>(initialStats)`; delete the `loading` state and its spinner branch, and delete the mount `useEffect` fetch. `viewModel`, export handlers, and JSX are unchanged (they already read `stats`).

- [ ] **Step 3: Build.** `npm run build`. Confirm `/trends` renders stat content server-side.
- [ ] **Step 4: Commit.**
```bash
git add app/trends/page.tsx app/trends/trends-client.tsx
git commit -m "feat(trends): server-render stored-audit trends for crawlers"
```

---

### Task 4: Verification + wiring test

- [ ] **Step 1: Wiring test** (`test/ssr-explore-trends-wiring.test.mjs`): assert `app/explore/page.tsx` calls `selectPublicReports` and passes `initialReports`/`initialTotal`; assert `explore-client.tsx` has a `firstRun` guard and accepts `initialReports`; assert `app/trends/page.tsx` passes `initialStats` and `trends-client.tsx` has no `fetch('/api/intelligence/trends')`. Add both new tests to the `test:security` script in `package.json`.
- [ ] **Step 2:** `npm run lint` && `npm run build`.
- [ ] **Step 3:** `npm run test:security`.
- [ ] **Step 4:** Grep built `/explore` HTML (or local server fetch) to confirm report content is present server-side.
- [ ] **Step 5: Commit** wiring test + package.json.

---

## Self-Review
- **Spec coverage:** helper+API §3.1 → Task 1; `/explore` SSR §3.1 → Task 2; `/trends` SSR §3.2 → Task 3; rendering §3.3 → Tasks 2-3 (`revalidate`); testing §6 → Tasks 1 & 4. All mapped.
- **Placeholder scan:** all code steps concrete.
- **Type consistency:** `selectPublicReports(raw, {query,verdict,limit}) → {reports, total}` identical across the helper, the route, and both pages; `initialReports`/`initialTotal`/`initialStats` prop names consistent between pages and clients.
- **Cost/behavior:** SSR reads DB only; route refactor is a pure extraction under test; trends SSR is stored-audits only.
