# Design — Honest, Legible Core Audit

- **Date:** 2026-07-10
- **Author:** Mark Siazon (with Claude Code)
- **Status:** Approved design, ready for implementation plan
- **Branch:** `feat/honest-core-audit`
- **Scope:** Spec 1 of 2. Spec 2 (organic discoverability / SEO) is deferred.

## 1. Problem

The public `/audit` page — HireProof's primary conversion surface — does **not** analyze the
user's pasted text by default. It returns a canned fixture instead.

Verified against source:

- [`app/audit/audit-client.tsx:243`](../../../app/audit/audit-client.tsx) — `const [liveMode, setLiveMode] = useState(false)` makes **Demo fixtures the default** mode.
- [`app/audit/audit-client.tsx:288-296`](../../../app/audit/audit-client.tsx) — when not in live mode, a real submission is short-circuited into `buildDemoReport(chooseDemoVerdict(request.text))` and **returns without ever calling `/api/audit`**.
- [`app/audit/audit-client.tsx:147-152`](../../../app/audit/audit-client.tsx) — `chooseDemoVerdict` only keyword-matches six substrings (`80000`, `telegram`, `urgent` → high-risk; `unclear`, `caution`, `competitive` → caution; **everything else → safe**).
- [`lib/fixtures.ts:116-122`](../../../lib/fixtures.ts) — the "safe" fixture hard-codes **"Microsoft Corporation / Seattle, WA / $200k."**

Consequences:

1. **Honesty failure** (the project's stated #1 value): a user who pastes a real post gets a report about Microsoft — evidence they can see is fabricated.
2. **Safety failure:** any real scam lacking those six keywords is labeled **Safe**, the worst possible false negative for an anti-fraud tool.
3. **Activation failure:** the tool visibly "didn't read my post," destroying first-use trust.
4. **Wasted investment:** ~100 recent commits of scoring-accuracy hardening never run on the default surface.

Two secondary problems ride along on the same code:

- **Ruleset leak (security):** [`app/audit/audit-client.tsx:16`](../../../app/audit/audit-client.tsx) statically imports `buildAuditReportV2` from the ~1,700-line `lib/intelligence-v2.ts` **into the client bundle**, solely to build client-side fixtures. This ships the full detection ruleset (every scam regex, weight, threshold) to anyone who opens devtools — the exact rules recent work hardens.
- **Buried answer (comprehension):** [`components/audit/result-screen.tsx`](../../../components/audit/result-screen.tsx) never renders the generated `result.summary`; the actionable next-step block sits 11th of 12 sections, after score-trace, coverage matrix, and provider tables.

## 2. Goals / Non-goals

**Goals**

- The default `/audit` submission analyzes the user's **real pasted text**, honestly and at **zero paid-provider cost**.
- Stop shipping the scoring ruleset to the browser bundle.
- The result screen leads with a plain-language answer and a concrete next action; full evidence stays visible below.
- Cost posture is provably unchanged: default is free/deterministic; live provider runs stay opt-in and gated.

**Non-goals (later specs)**

- Shareable report permalinks (option B).
- SEO / discoverability — server-rendered `/explore`, `/scams/[pattern]` hubs (option D → Spec 2).
- Real-text end-to-end evaluation harness; consumer accounts / cross-device history.

## 3. Cost-safety invariant (verified)

The server already implements a zero-spend deterministic path for `mode:'demo'`
([`app/api/audit/route.ts`](../../../app/api/audit/route.ts)):

- `demoMode = validated.mode === 'demo'` (299)
- `modelAllowed = publicLiveEnabled && !demoMode && …` (300) → **no LLM spend**
- `liveSearchAllowed: liveSearchAllowed && !demoMode` (435) → **no live search**
- `externalEvidenceAllowed: !demoMode` (436) → **no external/paid evidence providers**
- `if (!demoMode)` persist (472) → demo reports are not publicly persisted

Claim extraction runs regex-only (`useModel:false`) on the real text, and `buildAuditReportV2`
scores it deterministically. [`app/lab/lab-client.tsx:214`](../../../app/lab/lab-client.tsx) already
POSTs `{ text, mode:'demo' }` to this path in production, proving it is fast and safe.

## 4. Design

### A1 — Default submission analyzes real text

`handleAudit` in `audit-client.tsx` currently early-returns a client fixture when `!liveMode`
(288-296). The existing live path immediately below (298-317) already POSTs to `/api/audit` and
streams the report, and the request body already resolves `mode: liveMode ? 'live' : 'demo'` (302).

**Change:** remove the `!liveMode` fixture short-circuit and the `chooseDemoVerdict` keyword path
from real submissions, so **all** submissions flow through the streaming `/api/audit` fetch. Demo
mode therefore streams a real deterministic analysis of the pasted text.

- `chooseDemoVerdict` and the real-submission use of `buildDemoReport` are deleted.
- Streaming logs/labels for the default path change from "Demo fixture loaded" to honest wording
  (e.g. "Running an instant, offline check of your post…").
- Error/abort handling is unchanged (reuses the existing `try/catch/finally`).

### A2 — Mode UX relabel (keep opt-in live)

- **Default action:** "Check my post" → the free deterministic real-text analysis.
- **Secondary, opt-in:** "Live evidence (advanced)" → unchanged behavior; paid providers stay
  BYOK / API-key gated and cost-capped.
- The three sample cards (`QUICK_DEMOS`) become a quiet **"Try an example"** row, still clearly
  labeled as samples, positioned below the paste box.
- **Honest result labeling:** the deterministic result reads as an instant/offline check — not a
  "demo fixture." The existing **Evidence Provider Status** panel continues to disclose which live
  checks did **not** run, so "we didn't contact SerpApi/RDAP" stays visible, not hidden.
- Copy for the cost snackbar / capped banner is reconciled with the new framing (it already says
  "Public audits stay available with deterministic checks").

### A3 — Close the browser ruleset leak

- Remove the static `buildAuditReportV2` import from `audit-client.tsx` (16).
- The sample-card and `?demo=` reports are sourced from the **server**, not built in the browser:
  precompute the three demo `AuditReport`s into a generated JSON artifact (matching the repo's
  existing `*.generated` convention, e.g. `lib/demo-reports.generated.json` produced by a script),
  which the client imports as data. No engine code enters the client bundle.
- Result: `lib/intelligence-v2.ts`, `lib/risk-scorer.ts`, and `lib/audit-signals.mjs` no longer
  ship to devtools, and the `/audit` client bundle shrinks.
- Optionally add `import 'server-only'` to `lib/intelligence-v2.ts` to prevent regressions
  (only if it does not break existing server/test importers — verify during implementation).

### C1 — Lead with the answer

- Render `result.summary` (generated at [`lib/risk-scorer.ts`](../../../lib/risk-scorer.ts)
  `generateSummary`, consumed by `buildAuditReportV2`, but never displayed) directly under the
  verdict hero.
- Add a **"What to do right now"** block: 2–3 imperative lines derived from `nextSteps`
  (e.g. "Don't send money or IDs, and don't move to Telegram. Verify the role on the company's
  official careers page.").

### C2 — Reorder (move lower, stay visible)

New section order in `result-screen.tsx`:

1. Verdict hero (score + badge)
2. Plain-language summary (`result.summary`)
3. "What to do right now" (from `nextSteps`)
4. Red / green flags
5. **"How we checked"** — score trace, evidence-coverage matrix, provider status, investigation
   timeline, extracted info, evidence receipts, alternatives
6. Feedback

Nothing is collapsed or removed; the analyst detail is relocated below the answer.

## 5. Data flow

```
User pastes text → AuditForm submit
  → handleAudit(request)
     → POST /api/audit { text, mode: liveMode ? 'live' : 'demo' }   (same-origin; Origin/Referer present)
        → server: extract claims (regex, no model) on REAL text
        → runEvidenceBroker(externalEvidenceAllowed = !demoMode)
        → buildAuditReportV2(...) deterministic scoring
        → SSE stream: log events + final `result` (real AuditReport)
     → client renders ResultScreen(report)   // summary + next-steps first, evidence below
```

Sample cards / `?demo=`: client loads a **precomputed** server-generated demo report (data only).

## 6. Error handling

- Reuses the current `readAuditStream` + `try/catch/finally`; network/stream failures surface the
  existing error UI; abort keeps the "stopped" message.
- Deterministic extraction failure on pasted text degrades to the existing error state (no fixture
  fallback that would re-introduce fabricated data).

## 7. Testing

- **Rewrite** [`test/public-audit-live-default-safety.test.mjs`](../../../test/public-audit-live-default-safety.test.mjs):
  preserve its true intent (no paid-provider spend on the default public path) by asserting the
  default submit uses `mode:'demo'` and the demo server path performs no model/live-search/external
  evidence work — instead of asserting the old client fixture short-circuit.
- **New regression test:** a default (non-live) submission's rendered/returned `extractedClaims`
  reflect the pasted text, not a fixture (guards the "Microsoft" bug closed).
- Keep `scoring-determinism`, `adversarial-matchers`, `scoring-dataset-accuracy` green (no engine
  changes intended).
- **Manual / e2e smoke:** paste a keyword-less real scam → must **not** return "Safe"; paste a
  legit post → reasonable verdict; confirm sample cards still render; confirm the `/audit` client
  bundle no longer contains engine internals (grep built chunk for a known ruleset token).

## 8. Verification gates

```
npm run lint
npm run build
node --test test/public-audit-live-default-safety.test.mjs
npm run test:security
```

Plus a real browser run of `/audit`: paste a scam and a legit post, confirm the report reflects the
input, the summary + next-steps lead, and the evidence sections render below.

## 9. Risks & mitigations

- **Perceived slowness:** default path now makes a network round-trip vs. an instant fixture.
  Mitigation: deterministic path makes no external calls; `/lab` already proves it is fast.
- **Cost regression:** none by construction — default is `mode:'demo'` (§3). Live stays gated.
- **Bundle-extraction breakage:** moving demo reports server-side must keep the three sample cards
  and `?demo=` working. Mitigation: precomputed report JSON has the same shape the client already
  renders; covered by smoke test.
- **Honest-boundary regression:** the result must still disclose that live checks didn't run.
  Mitigation: keep the Evidence Provider Status panel; label the result as an offline/instant check.

## 10. Out of scope

Shareable permalinks (B), SEO hubs (D → Spec 2), real-text eval harness, consumer accounts.
