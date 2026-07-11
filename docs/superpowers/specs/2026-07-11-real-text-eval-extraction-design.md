# Design — Real-Text Eval Harness + Extraction Misfire Fix

- **Date:** 2026-07-11
- **Status:** Approved design, ready for implementation
- **Branch:** `feat/real-text-eval-extraction`
- **Relationship:** A measurement-first slice of `docs/prompts/improve-local-smart-advance-algorithm.md`. That
  brief is largely already implemented (determinism, `score-accuracy.mjs`, `scoring-dataset.mjs`, trained
  weights, 35/65 calibration, unified trace). This slice closes the one remaining gap it identifies.

## 1. Problem

Every accuracy number is measured on **synthetic, pre-extracted** inputs: `test/fixtures/scoring-dataset.mjs`
feeds `buildAuditReportV2` structured claims + hand-built evidence, so **claim extraction (raw text → claims)
— the messy real failure surface — is never scored end-to-end.** A concrete symptom in production: pasting a
scam produced `company = "Google Play Gift Cards And Message Us On WhatsApp"`.

Root cause: the raw-text extractor's company pattern is greedy —
`(?:at|from|with)\s+([A-Z][A-Za-z0-9&.,' -]{2,70})…` allows spaces + lowercase, swallowing a run-on clause.
The logic is also **duplicated and untestable**: the route's `extractClaims` ([app/api/audit/route.ts:68-118])
has an inline copy (not exported), and `lib/claim-extraction.mjs` `extractCompany` (:142) has another. Because
the real entry point isn't importable, extraction has no eval harness at all.

## 2. Goals / Non-goals

**Goals**
- Add the missing **real-pasted-text** eval track: raw text → extraction → scoring → verdict, scored against
  honest labels, with extraction-quality checks. Gated in `test:security`.
- Fix the worst extraction misfires (run-on company capture), measured against the harness.
- DRY the duplicated raw-text extraction into one exported, testable function.

**Non-goals (unchanged, protected)**
- No change to scoring math, signal weights, verdict thresholds (35/65), determinism, or the hard safety
  floors. This slice is extraction quality + the missing measurement layer only.
- No LLM/network in the deterministic path; no new runtime deps.
- No change to the exported scoring signatures (§3 invariants of the brief).

## 3. Design

### 3.1 Enabling refactor — one exported raw-text extractor (behavior-preserving first)
Add `export function extractClaimsFromText(input)` to `lib/claim-extraction.mjs`, reproducing the route's
`useModel:false` path **exactly** (company/role/salary/contact/applicationPath extraction with the current
defaults, then `recoverObviousClaims`). Move the two route-local helpers (`extractFirstMatch`,
`extractCompanyFromUrl`) into the module. `app/api/audit/route.ts` `extractClaims`'s `useModel:false` branch
becomes `return extractClaimsFromText(input)`; remove the now-unused inline helpers there.
- **Step 1 preserves behavior** (greedy pattern intact) — verified by the existing
  `test/claim-extraction.test.mjs` + full `test:security` staying green.

### 3.2 Real-text eval harness (measurement)
- `test/fixtures/real-text-cases.mjs` — a hand-labeled corpus of **~24 raw posts**
  `{ id, archetype, text, url?, location?, expected, rationale }`, ~8 per verdict, covering: the scam
  archetypes from `/scams` (upfront-fee, WhatsApp/Telegram task, reshipping, check-overpayment, crypto,
  fake-recruiter, data-harvesting, equipment-kit) **and** the legit cases the engine must not flag (staffing
  agency, remote startup with footprint, transparent contractor, standard ATS post). Honest labels; ambiguous
  → `caution`.
- `scripts/eval-real-text.mjs` — for each case: `claims = extractClaimsFromText({text,url,location})`;
  `report = buildAuditReportV2({ id, extractedClaims: claims, evidence: [], now: FIXED_NOW })` (via
  `loadScoringStack`, mirroring `score-accuracy.mjs`); compares `report.verdict` to `expected`. Reports a
  confusion matrix + macro-F1 **and extraction-quality checks**: company is not a >4-word run-on and not a
  sentence fragment; contactMethod matches obvious signals. Writes `test/fixtures/real-text-baseline.json`;
  `--json` / `--update-baseline` flags like the existing harness.
- `test/real-text-accuracy.test.mjs` — asserts verdict macro-F1 ≥ recorded baseline and **zero** run-on
  company extractions; wired into `test:security`.

### 3.3 Extraction fix (behavioral), measured against 3.2
Replace the greedy company capture with a **bounded proper-noun sequence** — capitalized words (≤4), joined
by a space or a single lowercase connector (`of|the|and|for|&`):
`([A-Z][A-Za-z0-9&.'-]*(?:\s+(?:of\s+|the\s+|and\s+|for\s+|&\s+)?[A-Z][A-Za-z0-9&.'-]*){0,3})`.
Apply it in the **one** unified place used by both `extractClaimsFromText` and `claim-extraction.mjs`
`extractCompany` (so `recoverObviousClaims`'s fallback can't re-introduce the misfire). Fix any other misfire
the baseline surfaces. Verify: `"…with Google Play gift cards and message us on WhatsApp"` → `Unknown / Not
Verifiable`; `"at Vercel."` → `Vercel`; `"at Bank of America is hiring"` → `Bank of America`.

## 4. Measurement-first order
1. Baseline: `npm run test:security` + `lint` green before touching anything.
2. Refactor (3.1), behavior-preserving → suite green (proves no drift).
3. Build harness (3.2) → run → **record baseline** (exposes the misfires).
4. Fix extraction (3.3) → re-run harness (extraction quality up, verdict accuracy stable/up) + suite green.
5. Update the harness baseline to the improved numbers; gate on it.

## 5. Testing / gates
```
node --test test/claim-extraction.test.mjs            # extraction unit (must stay green through 3.1)
node scripts/eval-real-text.mjs                        # real-text metrics + extraction-quality
node --test test/real-text-accuracy.test.mjs           # gate
npm run test:security                                  # full regression (incl. determinism/adversarial/calibration)
npm run lint
```

## 6. Risks & mitigations
- **Extraction change regresses a real company name** (e.g. multi-word lowercase connectors): mitigated by the
  connector allowance + the harness's legit cases + `claim-extraction.test.mjs`.
- **Refactor drift:** step 3.1 is behavior-preserving and gated by the existing suite before any fix.
- **Overfitting the corpus:** labels are honest and archetype-diverse; the fix is a general bound, not a
  per-case hack; scoring math is untouched so verdicts move only via better claims.

## 7. Out of scope
Confidence model, threshold re-calibration, the offline trainer, evidence classification — all already shipped
or explicitly deferred by the brief.
