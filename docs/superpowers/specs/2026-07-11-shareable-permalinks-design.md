# Design — Shareable Report Permalinks (Option B, persist-on-share)

- **Date:** 2026-07-11
- **Status:** Approved design, ready for implementation
- **Branch:** `feat/shareable-report-permalinks`

## 1. Problem

The result-screen Share action ([result-screen.tsx:507-514](../../../components/audit/result-screen.tsx))
copies plain text only (`HireProof verdict … Risk score …/100`) with no URL — so the highest-intent moment
(a user staring at a HIGH-RISK verdict they want to warn others about) drives zero traffic. The infra to fix
it exists: reports carry a public `id`, and `/audit/[id]` already renders a full dossier.

But after Spec 1 the default "Check my post" runs in **demo mode**, and demo reports are **not persisted**
([route.ts:472](../../../app/api/audit/route.ts) `if (!demoMode) persistReportSafely`), so their
`/audit/[id]` 404s. So a permalink feature must decide how demo reports become retrievable.

## 2. Decision (owner-approved): persist-on-share

Default checks stay unstored. When the user explicitly shares/copies a link, that specific report is
persisted **on demand** and a permalink is returned. Only reports the user chooses to share are stored
(30-day TTL, `noindex`, excluded from `/explore`+`/trends`). The server **re-computes its own output** to
persist — it never persists a client-supplied report — which also prevents anyone from minting a
`hireproof.tech/audit/…` link for a fabricated verdict.

## 3. Changes

### 3.1 `lib/schemas.ts`
Add optional `publish?: boolean` to the audit request schema.

### 3.2 `app/api/audit/route.ts`
`if (!demoMode || validated.publish) await persistReportSafely(report)` (line ~472). `publiclyListed` is
unchanged (demo stays `false` → not listed in Explore/Trends). Live reports still always persist. The demo
publish path runs the deterministic engine only (no paid providers), so re-running on share is free.

### 3.3 `components/audit/result-screen.tsx`
- Add prop `onRequestShareLink?: () => Promise<string | null>` to `ResultScreenProps`.
- `handleShare`: resolve `url = onRequestShareLink ? await onRequestShareLink() : (result.id ?
  `${origin}/audit/${result.id}` : null)`; include `url` in the `navigator.share({ title, text, url })`
  payload and the clipboard fallback. If no url, fall back to today's text-only share.
- Add a dedicated **"Copy link"** button next to Share (with copied/loading feedback + toast), shown only
  when a link is obtainable (`onRequestShareLink` present, or `result.id` present on the permalink page).

### 3.4 `app/audit/audit-client.tsx`
- Store the last submitted `AuditRequest` in a ref (set in `handleAudit`).
- Implement `requestShareLink(): Promise<string | null>`:
  - live report with `id` → return `${location.origin}/audit/${report.id}` (already persisted).
  - else if a real submission exists → POST `{ ...lastRequest, mode:'demo', publish:true }` to `/api/audit`,
    read the stream, take `finalReport.id`, return the permalink. Cache by `report.id` so re-clicks are
    instant.
  - else (sample card / no request) → return `null` (result-screen falls back to text-only share).
- Pass `onRequestShareLink={requestShareLink}` to `ResultScreen`; clear the cache on `reset`/new audit.

### 3.5 Permalink page (`app/audit/[id]/page.tsx`)
No change: renders `ResultScreen` without `onRequestShareLink`, so it uses the `result.id` fallback (the
report is already persisted there).

## 4. Testing

- **Schema:** `publish` accepted/optional (unit or source assertion).
- **Route:** source assertion `if (!demoMode || validated.publish)`; `publiclyListed` unchanged.
- **ResultScreen:** `onRequestShareLink` prop; share payload includes a `url`; Copy-link control present.
- **audit-client:** `requestShareLink` posts `publish: true` for demo and returns an `/audit/${id}` URL.
- **e2e:** run `next dev`; (a) POST `/api/audit { text, mode:'demo' }` → its `id` at `/audit/[id]` redirects
  to `/audit` (not persisted); (b) POST `{ text, mode:'demo', publish:true }` → its `id` at `/audit/[id]`
  renders the dossier (persisted). Confirms persist-on-share.
- `npm run lint`, `npm run build`, `npm run test:security`.

## 5. Risks & mitigations

- **Abuse (fabricated permalinks):** server persists only its own re-computed output; client-supplied reports
  are never stored. Permalinks are `noindex`, sanitized, and show the pasted input (same property live
  reports already have).
- **Storage growth / privacy:** only shared reports persist, 30-day TTL, excluded from public listings; the
  audit form already discloses "reports may be saved for history or share links."
- **Share latency (demo re-run):** deterministic + no network → fast; the resolved URL is cached so repeat
  clicks are instant; the button shows a brief loading state.

## 6. Out of scope

Dynamic OG images for shared reports, de-`noindex`ing permalinks, cross-device user history.
