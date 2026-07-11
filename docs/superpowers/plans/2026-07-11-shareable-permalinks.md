# Shareable Report Permalinks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Give the Share action a real `hireproof.tech/audit/[id]` permalink via persist-on-share: default checks stay unstored; sharing a demo report re-runs the free deterministic audit with `publish:true` to persist it.

**Architecture:** `publish` flag on the audit request → route persists demo reports on demand → `ResultScreen` gets an `onRequestShareLink` callback from `audit-client` (live = instant, demo = silent re-run), with a `result.id` fallback on the permalink page.

## Global Constraints
- **No AI attribution** in commits/PRs.
- Server persists only its own re-computed output (never client-supplied reports).
- Demo reports stay `publiclyListed: false` (excluded from Explore/Trends); permalinks stay `noindex`.

---

### Task 1: `publish` flag → persist-on-demand
- Modify: `lib/schemas.ts` (add `publish?: boolean` to the audit request schema), `app/api/audit/route.ts` (`if (!demoMode || validated.publish)`).
- Test: `test/publish-on-share.test.mjs` — source assertions that the schema has `publish` and the route persists when `validated.publish`; `publiclyListed` unchanged.
- [ ] Add flag, change persist condition, lint, commit.

### Task 2: ResultScreen share + Copy-link
- Modify: `components/audit/result-screen.tsx` — add `onRequestShareLink?: () => Promise<string | null>` prop; resolve a URL in `handleShare` and include it in the `navigator.share`/clipboard payload; add a "Copy link" button (loading/copied feedback + toast), shown when a link is obtainable.
- [ ] Implement, lint, commit.

### Task 3: audit-client wiring
- Modify: `app/audit/audit-client.tsx` — `lastRequestRef` set in `handleAudit`; `requestShareLink()` (live → instant `/audit/${id}`; demo → POST `{...lastRequest, mode:'demo', publish:true}`, read stream, return `/audit/${finalReport.id}`; cache by report id; sample/no-request → null); pass `onRequestShareLink`; clear cache on reset.
- [ ] Implement, lint, build, commit.

### Task 4: e2e + suite
- [ ] Add tests to `test:security` (package.json).
- [ ] `npm run lint` && `npm run build` && `npm run test:security`.
- [ ] e2e: dev server — demo POST id → `/audit/[id]` redirects (unpersisted); demo+publish POST id → `/audit/[id]` renders dossier (persisted).
- [ ] Commit, push, PR into `dev`.

## Self-Review
- Spec §3.1-3.2 → Task 1; §3.3 → Task 2; §3.4 → Task 3; §3.5 → no-op (fallback); §4 → Tasks 1 & 4.
- Names consistent: `publish`, `onRequestShareLink`, `requestShareLink`, `lastRequestRef`.
