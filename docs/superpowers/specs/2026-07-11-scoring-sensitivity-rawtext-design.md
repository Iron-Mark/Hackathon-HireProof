# Design — Scoring Sensitivity: Feed Raw Post Text to the Payment-Scam Matchers

- **Date:** 2026-07-11
- **Status:** Implemented (measurement-first)
- **Branch:** `feat/scoring-sensitivity-rawtext`

## 1. Problem

The real-text eval harness (added in the prior slice) surfaced false negatives: genuine scams — a gift-card
equipment-kit scam, a fake-check overpayment, and a look-alike-recruiter fee scam — scored **42-49 (caution)**
offline, just under the 65 high-risk cutoff.

## 2. Diagnosis (traces)

The score traces showed the engine detected **nothing** about the actual scam mechanics — only baseline +
"unknown company" + reconciliation. Root cause: `buildProcessSignals` builds its payment context from
**claim fields only** (`applicationPath + salary + role`):

```js
const paymentContextRaw = `${claims.applicationPath} ${claims.salary} ${claims.role}`
```

The engine already has excellent matchers (`BUY_TO_WORK_RE` → "buy … kit/gift cards", `MONEY_MULE_RE` →
"deposit … check … wire", `UPFRONT_PAYMENT_TERMS` → "setup fee", …) **and hard safety floors**
(`buy_to_work` → floor 65, `money_mule` → floor 80, `upfront_payment` + scam co-signal → floor 65). But the
scam phrases live in the **raw post text**, which never reaches those matchers — so they never fire.

## 3. Fix — wiring, not new heuristics

Thread the **optional raw post text** into payment-signal matching so the existing matchers see the prose:
`buildAuditReportV2({ rawText })` → `traceRiskScore/calculateRiskScore(…, rawText)` /
`extractRedFlags/extractGreenFlags(…, rawText)` → `buildAuditSignals(…, rawText)` →
`buildProcessSignals(claims, output, rawText)`, where `rawText` is appended to the payment context only.

- **Backward-compatible:** `rawText` defaults to `''`. The synthetic calibration dataset passes no rawText,
  so its scores are provably unchanged (verified: `score-accuracy.mjs` still 1.0 on all splits).
- **No scoring math changed:** no weights, thresholds, floors, or determinism touched — the well-tested
  matchers and floors simply receive the input they were written for.
- Wired into the real audit routes (`app/api/audit/route.ts`, `app/api/v1/audit/route.ts` with
  `rawText: validated.text`) and the eval harness. Fixture/demo paths pass no rawText (unchanged).

## 4. Measured result

| Metric | Before | After |
|---|---|---|
| Real-text offline accuracy | 83.3% | **95.8%** |
| Real-text macro-F1 | 83.4% | **95.8%** |
| The 3 scams | 42 / 49 / 49 (caution) | **94 / 83 / 75 (high-risk)** |
| Synthetic calibration (score-accuracy) | 1.0 | **1.0 (unchanged)** |
| False positives on legit posts | — | **0** (only remaining miss is a near-empty "apply here" edge case) |

## 5. Testing / gates
```
node scripts/eval-real-text.mjs           # 95.8% macro-F1, run-on 0
node scripts/score-accuracy.mjs           # synthetic 1.0 unchanged (no rawText)
node --test test/real-text-accuracy.test.mjs   # gate + wiring test
npm run test:security                     # 396/396 (adversarial/determinism/calibration all green)
npm run lint && npm run build
```

## 6. Risks & mitigations
- **False positives from broader matching:** measured — no legit real-text case tipped to high-risk; the
  matchers require explicit buy/pay verbs + scam nouns (kit, gift card, deposit-check-wire).
- **Calibration/adversarial regression:** impossible by construction — those suites pass no rawText, so
  behavior is byte-identical (verified 396/396 + synthetic 1.0).
- **Two-engine reconciliation cap:** measured to propagate for these scam cases (base floors reach the final
  verdict); confirmed by the harness flipping all three.

## 7. Out of scope / next
Deeper scoring (confidence model, threshold re-fit), the `careers@…` email false-trust in
`extractApplicationPath`, and expanding the corpus remain future work — the harness is in place to measure
any of them safely.
