# Prompt — Improve HireProof's Local "Smart Advance" Scoring Algorithm

> **How to use this file:** the entire document below the horizontal rule is a self-contained
> prompt. Paste it to Fable (Claude Fable 5) as the task brief for an agentic coding session run
> from the repo root. It assumes read/write access to the repo and a shell. Nothing here needs to
> run right now — it is instructions for that later session.

---

## 0. Role and mission

You are a senior engineer improving the **local, deterministic scoring engine** at the core of
HireProof — an employment-fraud trust-and-safety tool that returns a `Safe` / `Caution` /
`High-Risk` verdict on a suspicious job post, recruiter message, screenshot, or apply link.

Internally this engine is nicknamed the **"smart advance" algorithm**: the no-LLM, no-network code
that turns extracted claims + gathered evidence into a numeric risk score (0–100) and a verdict. It
is *not* the live SerpApi investigation and it is *not* an LLM. It is pure, testable logic.

**Your mission:** measurably raise its **accuracy** — fewer false positives (legit jobs flagged
risky), fewer false negatives (real scams rated safe/caution), and correctly calibrated verdict
thresholds — while making its reasoning **more explainable** and its signal **weights/confidence**
more principled. You may introduce a small **offline-trained statistical model** to set the weights,
subject to the hard rules in §3 and §7.

Work **measurement-first**: build the way to score accuracy before you change any behavior, capture a
baseline, then improve against it. No change ships without a metric that says it helped and a
regression suite that says it broke nothing.

---

## 1. Context you must respect (product positioning)

HireProof deliberately markets itself as **not** a black-box fraud model, **not** a
continuous-learning system, and **not** an in-house deepfake detector. Its credibility comes from
**visible, explainable evidence and reasoning**. Every design choice you make must preserve that:

- **Explainable over clever.** A user (and a reviewer) must be able to see *why* a verdict happened:
  which signals fired, each signal's contribution to the score, and the evidence behind it.
- **Deterministic at runtime.** Same input → same output, every time, offline.
- **Safety-biased on the risky side.** This tool exists to stop people from losing money and IDs. A
  missed scam (false negative) is worse than an over-cautious flag, but chronic false positives
  destroy trust and train users to ignore warnings. You are optimizing *both* — see §9.

---

## 2. The system under improvement — read these first

**Do not trust this summary blindly; open and read each file before changing it.** The codebase
evolves; verify current reality. Then treat the notes below as a map.

| File | Role |
| --- | --- |
| `lib/audit-signals.mjs` | **Base signal engine.** `buildAuditSignals()` emits weighted signals `{id, category, direction: 'risk'\|'trust', severity, confidence, weight, explanation, evidenceType}` from claims + red/green flags + evidence. `scoreAuditSignals()` computes `25 + Σweight`, then applies hardcoded pattern floors/ceilings, clamps to 0–100. `strongestRiskSignals`/`strongestTrustSignals` rank them. Plain `.mjs` on purpose (see §3). |
| `lib/risk-scorer.ts` | Thin wrapper over the base engine. `calculateRiskScore()`, `determineVerdict()` (the **35 / 65** thresholds), `getConfidenceLabel()`, `extractRedFlags()`, `extractGreenFlags()`, `generateSummary()`. |
| `lib/intelligence-v2.ts` | **Advanced layer.** `buildAuditReportV2()` + `deriveIntelligence()`: classifies evidence (`sourceQuality`, `sourceType`, `trustLevel`, `freshness`, `matchConfidence`), derives company-profile modes (`startup_remote`, `established_remote`, `local_business`), recruiter identity, hybrid salary benchmark, apply-path mismatch, reputation risk, and a step-by-step **`scoreTrace`** with false-positive controls. Consumes the base score via `calculateRiskScore` and reconciles. |
| `lib/salary-benchmarks.ts`, `lib/alternative-jobs.ts` | Support: salary bands and verified alternatives used by the v2 layer. |
| `lib/schemas.ts` | Source of truth for `ExtractedClaims`, `EvidenceItem`, `IntelligenceSignal`, `ScoreTraceItem`, `AuditReportV2`. Read it to get exact shapes. |

**Existing tests (your safety net and starting oracle):**

| Test | What it pins |
| --- | --- |
| `test/audit-calibration-cases.test.mjs` | Hand-written accuracy anchors (staffing agency ≠ high-risk, Telegram+no-interview = high-risk, transparent RLHF contractor = caution, etc.). **This is your seed dataset.** |
| `test/audit-signals.test.mjs` | Base signal/score unit behavior. |
| `test/risk-scorer.test.mjs` | Wrapper + verdict behavior. Note the in-test loader that transpiles `risk-scorer.ts` and neutralizes `export` in `audit-signals.mjs` via regex — respect it (§3). |
| `test/intelligence-v2.test.mjs` | v2 evidence classification + scoring. |

**Downstream consumers** (do not break their contracts): `app/api/audit/route.ts`,
`app/api/v1/audit/route.ts`, and anything importing from `@/lib/risk-scorer` or
`@/lib/intelligence-v2`. Grep for imports before you change a signature.

**Tooling:**
- Run scorer tests: `node --test test/audit-signals.test.mjs test/risk-scorer.test.mjs test/intelligence-v2.test.mjs test/audit-calibration-cases.test.mjs test/salary-benchmarks.test.mjs`
- Full regression gate: `npm run test:security` (bundles all of the above and more).
- Typecheck: `npm run lint` (`tsc --noEmit --project tsconfig.lint.json`).
- Runtime: Node **24.x**, TypeScript **6.x**, ESM. New offline scripts go in `scripts/`.

---

## 3. Hard constraints and invariants (non-negotiable)

1. **No network and no LLM in the runtime scoring path.** No `fetch`, no API calls, no model
   inference over a wire, no reading the filesystem at request time. Scoring stays synchronous and
   pure.
2. **Determinism.** Identical inputs must yield identical scores and verdicts. This is currently
   *violated*: `intelligence-v2.ts` reads `Date.now()` for evidence freshness, so the score drifts
   with wall-clock time. Fix this by making "now" an injectable parameter (default to current time
   in production, fixed in tests). Never let `Math.random()` or ambient time affect a score.
3. **Public API stability.** Keep the exported signatures and return shapes of `calculateRiskScore`,
   `determineVerdict`, `getConfidenceLabel`, `extractRedFlags`, `extractGreenFlags`,
   `generateSummary`, `buildAuditSignals`, `scoreAuditSignals`, `strongestRiskSignals`,
   `strongestTrustSignals`, `buildAuditReportV2`, and `normalizeCompensation`. If a signature must
   change, update **every** call site + `lib/schemas.ts` + all tests in the same change, and call it
   out explicitly.
4. **`lib/audit-signals.mjs` stays plain ESM** with top-level `export function` declarations. The
   test loader (`test/risk-scorer.test.mjs`) string-replaces those exports to load it in a VM. If
   you restructure it, update that loader in the same change or tests will silently load stale code.
5. **Verdict semantics are fixed.** Higher score = more risk. Verdict space is exactly
   `'safe' | 'caution' | 'high-risk'`. You may recalibrate the thresholds (§Phase 4) but not invert
   or rename them.
6. **Hard safety floors survive the model.** Certain signals must *deterministically* force a
   minimum risk regardless of any learned weights — e.g. a URL matching known phishing/malware/threat
   intel (`threat.known_bad_url`), or the classic combo (implausible weekly entry-level pay +
   off-platform contact + no interview). A learned model may never rate these `safe`. Keep these as
   explicit overrides layered **above** the model (§7).
7. **No new runtime dependencies.** Use the standard library. The offline trainer (§7) may use a
   tiny, self-contained implementation you write; do not add an ML package to `dependencies`.
8. **Privacy.** Training data is curated fixtures / synthetic examples, never live user submissions.
   No continuous or online learning. Model weights are static artifacts committed to the repo.

---

## 4. Methodology: measure first, then improve

Follow this loop for every behavioral change:

1. **Red/known state:** add or identify a test/dataset case that expresses the desired behavior.
2. **Baseline:** run the harness (§Phase 1) and record current metrics.
3. **Change:** make the smallest change that could improve the metric.
4. **Re-measure:** rerun the harness + `npm run test:security` + `npm run lint`.
5. **Keep only if it helps** the target metric **and** regresses nothing. Otherwise revert.

Guard against overfitting: split the labeled dataset into **train / validation / test**. Tune and
train only on train+validation; report final numbers on the untouched test split. Never hand-tune a
weight to pass one calibration case at the expense of aggregate accuracy.

---

## 5. Known weaknesses and leads (verify, don't assume)

These are real smells observed in the current code. Investigate each, confirm it still exists, and
fix the ones that move the metrics. Do not treat the list as exhaustive or as mandatory busywork.

1. **Double scoring / double baseline.** `buildAuditReportV2` computes a base score from
   `calculateRiskScore` (baseline 25 + weights + floors), then `deriveIntelligence` *independently*
   re-derives a score from its own baseline 25 with overlapping-but-different weights, then
   reconciles via `finalDelta = clamp(baseScore) - score` (capped at 12 on a "trusted hiring
   surface"). Overlapping signal sets + a capped reconciliation is a calibration hazard and is hard
   to reason about. Consider unifying into one signal model, or making the base-vs-adjustment split
   explicit and fully trace-covered.
2. **Brittle salary detection.** `buildSalarySignals` hardcodes `80 000 | 100 000` weekly literals
   and simple `includes('week')` checks — it misses `$5,000/week`, `₱120k weekly`, ranges, and
   obfuscations, causing false negatives. The v2 layer already does the right thing with
   `normalizeCompensation` + a benchmark ratio; converge on that numeric approach.
3. **Confidence is ignored by the score.** Signals carry a `confidence` field, but
   `scoreAuditSignals` sums only `weight`. Confidence-aware scoring is an explicit goal — a
   low-confidence risk signal should move the score less than a high-confidence one.
4. **Substring matching is fragile.** `normalize` + `hasAny` string `includes` checks are easy to
   evade and easy to trip accidentally. Prefer normalized token sets / bounded regexes, and unit-test
   the matchers against paraphrases and near-misses.
5. **Uncalibrated magic numbers.** The `35 / 65` verdict cutoffs, the `25` baseline, and every
   `Math.max(score, …)` / `Math.min(score, …)` floor and ceiling were hand-picked, never fit to
   data. These are prime targets for the harness (§Phase 4).
6. **Legacy free-text flags double-count.** `buildLegacyFlagSignals` derives weights from substring
   matches of human-readable flag strings (`payment|fee|unrealistic`), which overlap with the
   structured signals and can double-count the same risk. De-duplicate structured vs legacy.
7. **Fragmented confidence model.** `getConfidenceLabel` (report confidence), per-signal
   `confidence`, and evidence `matchConfidence` are three unrelated notions. Unify into one coherent
   confidence story that feeds both the score and the displayed label.
8. **Trace only in v2.** The base engine has no score trace; v2 has `scoreTrace`. For explainability,
   produce **one** unified, ordered trace from baseline → final that names every contributing signal
   and its delta.
9. **Evidence misclassification propagates.** `classifySourceQuality` / `classifyTrustLevel` /
   `classifySourceType` are substring heuristics; a wrong tier silently shifts the score. Add
   targeted tests and tighten.

---

## 6. Phased work plan

Deliver in order. Checkpoint (report status + metrics) after Phase 1 and Phase 3.

### Phase 0 — Baseline and safety net
- Run `npm run test:security` and `npm run lint`; confirm green before touching anything.
- Write a **determinism probe**: score a fixed case twice (and across two injected "now" values) and
  assert identical results. Expect it to reveal the `Date.now()` freshness bug (§3.2); fix that bug
  first so all later metrics are stable.

### Phase 1 — Measurement harness + labeled dataset  *(checkpoint)*
- Build `test/fixtures/scoring-dataset.mjs` (or similar): a labeled corpus of `{ input, expected
  verdict, rationale, provenance, split }`. Seed it from `test/audit-calibration-cases.test.mjs`,
  `test/risk-scorer.test.mjs`, and `lib/fixtures.ts`, then expand to **≥ 120 examples** that cover:
  - all three verdicts, balanced enough to be meaningful;
  - each company-profile mode (startup-remote, established-remote, local business, unknown);
  - the hard tradeoffs already encoded in tests (staffing agency vs impersonation; transparent
    contractor vs Telegram scam; official apply path vs look-alike domain; sparse-evidence caution).
  - Label honestly and record *why*. Mark ambiguous cases as `caution` and note them.
- Build `scripts/score-accuracy.mjs`: runs the current engine over the dataset and prints a
  **confusion matrix**, **per-class precision/recall/F1**, **macro-F1**, and a list of every
  misclassification with its score trace. Make it exit non-zero if macro-F1 drops below a recorded
  baseline (so it can gate CI later).
- Record the **baseline metrics** in the final report (§10). Everything after is measured against it.

### Phase 2 — Reduce false positives and false negatives (behavioral fixes)
Using the harness to confirm each change helps:
- Replace brittle salary literals with numeric `normalizeCompensation` + benchmark-ratio logic
  (lead §5.2). Add anomaly detection that generalizes (e.g. claimed ≥ 2.5× comparable band, or any
  weekly quote for a salaried role).
- De-duplicate legacy vs structured signals (lead §5.6); ensure one underlying risk contributes once.
- Tighten evidence classification and add tests for the misclassification cases the harness surfaces
  (lead §5.9).
- Address the specific false positives HireProof cares about: legitimate **staffing agencies**,
  **remote startups** with a consistent digital footprint, and **transparent contractor / RLHF**
  roles must not tip to high-risk on structure alone. Address the false negatives: look-alike
  domains, recruiter-domain mismatch, off-platform pivots, and copied reposts.

### Phase 3 — Confidence-aware + statistical weighting  *(checkpoint)*
- Make scoring **confidence-aware**: a signal's effective contribution scales with its confidence
  (lead §5.3). Define the math explicitly and trace it.
- Introduce the **offline-trained statistical model** per §7 to *set the weights* the engine uses,
  replacing hand-tuned magic where the data supports it. Keep the hand-tuned weights as the
  documented fallback. Compare model-weighted vs hand-tuned on the validation split and keep whichever
  wins — report both.

### Phase 4 — Threshold calibration
- Treat `35 / 65` (and the baseline / floors / ceilings) as tunable. Fit them on train+validation to
  maximize macro-F1 subject to the safety bias (favor recall on `high-risk`). Document the chosen
  values and the tradeoff curve. Update `determineVerdict` and any dependent tests together.

### Phase 5 — Explainability / unified score trace
- Emit one ordered `ScoreTrace` from baseline to final for **both** layers, each step naming the
  signal id, its (confidence-scaled) delta, the running score, evidence ids, and a plain-English
  reason (lead §5.8). Ensure `strongestRiskSignals` / `strongestTrustSignals` and the report UI can
  render it. Add a snapshot test so the trace stays stable and reviewable.

### Phase 6 — Regression, docs, and report
- `npm run test:security` and `npm run lint` fully green.
- Write `docs/scoring-algorithm.md`: the signal taxonomy, the scoring math, confidence handling, the
  model + how to retrain, the thresholds and why, and the safety floors.
- Produce the final metrics report (§10).

---

## 7. The local statistical model — rules of engagement

A model is *allowed*, but it must stay honest and inspectable:

- **Transparent and linear/monotonic.** Use logistic regression (or equivalently calibrated additive
  weights) over the **named signal features** — one coefficient per signal. This preserves an exact
  per-signal contribution (`contribution_i = coef_i × feature_i`) that drops straight into the score
  trace. No trees, no nets, nothing whose contribution you can't print.
- **Trained offline, shipped static.** Write `scripts/train-risk-weights.mjs`: it reads the labeled
  dataset, fits the model with a **fixed seed** (deterministic, reproducible), and writes coefficients
  to a committed artifact (e.g. `lib/risk-weights.generated.json`). Commit the dataset, the script,
  the artifact, and the metrics together.
- **Runtime is pure arithmetic.** The engine imports the static coefficients and does a dot-product +
  calibration → 0–100 risk. No training, no fs, no network at request time.
- **Guardrails above the model.** Apply the hard safety floors (§3.6) *after* the model output so a
  known-threat or classic-scam pattern can only ever *raise* risk, never be argued down by learned
  weights. Calibrate verdict thresholds on the validation split.
- **Graceful fallback.** If the artifact is missing or malformed, fall back to the current hand-tuned
  weights so runtime never breaks. Cover this path with a test.
- **No leakage.** Train on train+validation only; report on the held-out test split.

If, after measuring, the model does **not** beat well-tuned hand weights on the validation split,
say so and ship the hand-tuned version — the harness, confidence-awareness, calibration, and
explainability still stand on their own.

---

## 8. Deliverables

1. Fixed determinism (injectable time) in `intelligence-v2.ts`.
2. `test/fixtures/scoring-dataset.mjs` — labeled corpus with train/validation/test splits.
3. `scripts/score-accuracy.mjs` — metrics harness (confusion matrix, P/R/F1, macro-F1, misclass dump).
4. Behavioral fixes across `audit-signals.mjs`, `risk-scorer.ts`, `intelligence-v2.ts` (Phases 2–5).
5. Confidence-aware scoring + unified score trace.
6. `scripts/train-risk-weights.mjs` + `lib/risk-weights.generated.json` (if the model ships) with a
   documented fallback.
7. Updated/added tests; `npm run test:security` and `npm run lint` green.
8. `docs/scoring-algorithm.md` and the final metrics report (§10).

---

## 9. Acceptance criteria (quantified)

- **Zero regressions:** `npm run test:security` and `npm run lint` pass; every pre-existing
  calibration and unit test still passes (or is updated with an explicit, justified reason).
- **Measured improvement:** macro-F1 on the held-out test split improves versus the Phase-1 baseline
  by a clear margin (report the exact before/after; target a meaningful, honest gain rather than a
  cherry-picked number). No per-class F1 regresses without written justification.
- **Safety invariant:** no example carrying a hard-safety signal (known-threat URL; implausible
  weekly entry-level pay + off-platform contact + no interview; recruiter free-mail + apply
  mismatch) is ever scored `safe`. Assert this as a test over the dataset.
- **Determinism:** the determinism probe passes — identical inputs (and any injected "now") produce
  identical scores; the score trace is snapshot-stable.
- **False-positive control:** the legitimate-agency, remote-startup, and transparent-contractor cases
  remain **not** high-risk. **False-negative control:** the impersonation / look-alike-domain /
  off-platform cases remain high-risk.
- **Explainability:** every verdict is reproducible from its trace — the sum of traced deltas equals
  the final pre-clamp score, and each step cites its signal (and evidence ids where applicable).
- **Calibration documented:** the chosen thresholds and (if used) model coefficients are explained in
  `docs/scoring-algorithm.md`, retrainable from the committed script.

---

## 10. Reporting format / definition of done

End with a concise report:

- **Baseline vs final** table: confusion matrix + per-class P/R/F1 + macro-F1, on the test split.
- **What changed and why**, per phase, each tied to the metric it moved.
- **Model decision:** shipped statistical model or hand-tuned weights, with the validation-split
  comparison that decided it.
- **Thresholds:** old → new, with the tradeoff rationale.
- **Residual failure modes** the harness still shows, and what a next pass should try.
- **Files touched** and the exact commands to reproduce the metrics.

Do not claim success without pasting the passing `npm run test:security` / `npm run lint` output and
the final harness metrics.

---

## 11. First steps (do these before anything else)

1. Read `lib/audit-signals.mjs`, `lib/risk-scorer.ts`, `lib/intelligence-v2.ts`, `lib/schemas.ts`,
   and the four scorer test files. Grep for importers of the public API.
2. Run `npm run test:security` and `npm run lint`; confirm a green baseline.
3. Reproduce the `Date.now()` determinism bug, then fix it with injectable time (Phase 0).
4. Stand up the dataset + harness and capture the baseline (Phase 1), then **checkpoint** before
   changing scoring behavior.
```
