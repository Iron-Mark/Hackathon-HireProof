# HireProof Local Scoring Algorithm

This document describes the deterministic, no-LLM, no-network scoring engine that turns
extracted claims + gathered evidence into a `Safe` / `Caution` / `High-Risk` verdict —
the algorithm behind every audit report. It is pure, synchronous logic: identical inputs
(including the injectable reference time) always produce identical scores.

## Architecture

Two cooperating layers, reconciled into one score:

```
claims + evidence
   │
   ├─► BASE ENGINE            lib/audit-signals.mjs  (+ lib/risk-scorer.ts wrapper)
   │     buildAuditSignals()  → named, weighted signals
   │     traceAuditSignals()  → baseline 25 + Σ(weight × confidence) + floors/ceilings
   │                            = base score, with a full per-step trace
   │
   └─► INTELLIGENCE V2        lib/intelligence-v2.ts
         evidence classification (source quality/type, trust, freshness)
         derived analyses (company profile mode, recruiter identity,
                           salary benchmark ratio, apply-path trust)
         v2 signals → baseline 25 + Σ weights
         Policy reconciliation: if base score > v2 subtotal, the difference is
         added (capped at +12 on a fully trusted hiring surface) so structured
         base-engine risk is never lost
         Safety floors (see below)
         = final riskScore 0–100
```

`determineVerdict` (lib/risk-scorer.ts): `< 35` → safe, `< 65` → caution, `>= 65` → high-risk.

## Signal taxonomy

Signals are named, directional (`risk` / `trust` / `neutral`), weighted, and carry a
detection confidence. Base-engine families:

| Family | Examples | Weight range |
| --- | --- | --- |
| Contact | `contact.telegram_only` (+20), `contact.whatsapp_only` (+17), `contact.professional_apply_path` (−8) | ±20 |
| Process | `process.no_interview` (+18), `process.upfront_payment` (+26) | +18..26 |
| Salary | `salary.implausible_weekly_entry_role` (+30), `salary.weekly_quote` (+12), `salary.standard_format` (−4) | −4..+30 |
| Entity | `entity.company_unknown` (+14), `entity.input_conflict` (+16), `entity.apply_path_mismatch` (+18) | −5..+20 |
| Source | `source.official_match` (−16), `source.reputable_job_board` (−8), `source.weak_directory` (+6) | −16..+6 |
| Domain | `domain.newly_registered` (+16/18), `domain.recruiter_mismatch` (+18), `domain.recruiter_free_mail` (+12) | −10..+20 |
| Threat | `threat.known_bad_url` (+26/35) | +26..35 |
| Contractor | `contractor.variable_hours_caution` (+12), `contractor.transparent_limitations` (−7) | −7..+12 |

V2 signals cover the same ground plus derived analyses: `company_official_match` (−14),
`company_unverified` (+18), `recruiter_identity_mismatch` (+20), `salary_anomaly` (+22),
`apply_path_mismatch` (+18), `threat_intel_match` (+30), `domain_newly_registered` (+10),
`certificate_very_recent` (+6), `process_no_interview` (+12), `process_upfront_payment`
(+22), profile-mode trust bonuses (−6/−8), and evidence-quality nudges (stale +4, weak +2).

## Confidence-aware scoring

A signal's effective contribution is `weight × confidence multiplier` in BOTH layers:

| Confidence | Multiplier |
| --- | --- |
| high | 1.00 |
| medium | 0.85 |
| low | 0.60 |

Rationale: a low-confidence detection (e.g. fallback OCR, fuzzy text match) should move
the score less than a structured, high-confidence one (e.g. RDAP domain age). Base engine:
`effectiveSignalWeight()` (lib/audit-signals.mjs). V2: every `IntelligenceSignal` carries a
`confidence` field — structured domain/email/maps checks and explicit claims are high;
token-overlap heuristics, seeded benchmarks, and news-language reads are medium;
freshness/source-quality nudges are low. Salary-anomaly confidence is dynamic: high with
live same-currency comparables, medium from seeded bands. The signal keeps its nominal
`weight`; the trace records the scaled (effective) delta.

## Adversarial matching rules

Text matching is hardened against the wordings and evasions scammers actually use. All of
it is deterministic and mirrored in both engine layers (`lib/audit-signals.mjs` and
`lib/intelligence-v2.ts`).

- **Unicode / homoglyph normalization:** `normalize` applies NFKC (folds fullwidth and
  compatibility forms), strips zero-width characters, folds cross-script confusables
  (Cyrillic/Greek → Latin, so `tеlegram` with a Cyrillic *е* becomes `telegram`), and
  strips combining diacritics (so `cuota de inscripción` matches `cuota de inscripcion`).
- **Token-boundary phrases** (`hasTokenPhrase`): matching happens on normalized,
  space-padded token sequences, so `t.me/handle` (→ ` t me `) is detected while the inside
  of "don't message" never is.
- **Clause-boundary-aware negation with demand override** (`hasUnnegatedTerm` +
  `tokenizeWithBoundaries`): a negation only suppresses a risk term inside its own clause
  (scope ends at commas, periods, semicolons, dashes, and contrastive conjunctions), and a
  payment-demand verb (`pay/send/deposit/wire/purchase/buy/…`) in the same clause fires the
  term regardless of negation. So "we never ask for a fee" stays silent, but "beware of
  scams, pay the activation fee" and "we do not overcharge. A refundable deposit is
  required" both fire. Negation tokens are multilingual (English + fr/es/pt/it/id/hi/de).
  **Matchers see RAW claim text** (not the ASCII-normalized view) so clause punctuation
  survives. Acknowledged limit: nested double negation ("it is not the case that we do not
  require a charge") is not parsed.
- **Off-platform channels:** short links are the platform (`t.me`→Telegram, `wa.me`→
  WhatsApp); Viber, Signal, Discord, WeChat, Line, Skype, Kakao, Snapchat, Google Chat,
  Linktree, and SMS-only phone funnels are detected (`contact.off_platform_messaging`).
  `'official'` no longer earns bare-substring trust (the "Line official account" collision),
  and professional-apply-path trust is suppressed whenever an off-platform channel is present.
- **No-vetting synonyms:** no/without/skip interview, no exam/screening/assessment, Taglish
  `walang interview/exam`, and Spanish/Portuguese/French/Bahasa/Hinglish equivalents; CJK
  and Hangul idioms (`无需面试`, `면접 없이`) via a raw-script scan.
- **Fee generalization:** `{training|registration|activation|processing|application|
  membership|placement|onboarding|handling|admin|upfront|setup|account|service} ×
  {fee|charge|cost}` plus deposit/purchase phrasings and the Spanish/Portuguese/French/
  Bahasa/Hinglish + CJK/Hangul fee idioms.
- **New scam-archetype detectors:** money-mule / reshipping / check-overpayment
  (`process.money_mule`, +34), applicant-funded crypto (`process.crypto_deposit`, +32),
  buy-to-work / gift-card (`process.buy_to_work`, +26), and pre-hire credential harvesting
  (`process.credential_harvest`, +30) — each with a hard high-risk floor.
- **Weekly pay:** period parsing prefers explicit `per X` / `X-ly` over incidental words
  (so "$720 per week … logged hours" is weekly, not hourly); `/wk` counts as weekly; an
  hourly rate "paid weekly" is a pay schedule, not a weekly quote.

## Evidence-poisoning resistance

Evidence snippets can contain attacker-planted text (a scammer's own web page saying
"Trust: official"). The strongest trust tiers therefore key on the **broker-assigned
evidence `type`** (`Official Company Presence`, `Verified Local Presence`, `Knowledge
Graph`) or a trusted host — never on snippet substrings. A generic `Company Check` whose
snippet merely *says* "official" classifies as `public`, so it cannot forge trust or disarm
the advance-fee / verification floors. Reputation risk words are matched through the same
negation guard, so "no scam reports found" reads as clean.

## Safety floors and ceilings (guardrails above all weights)

Floors force a minimum score when a scam pattern is present — no amount of trust evidence
can argue them down. Ceilings cap the score when a fully verified hiring surface is present.

Base engine (traceAuditSignals):

| Rule | Score |
| --- | --- |
| Implausible weekly pay + off-platform contact + no interview | ≥ 80 |
| Off-platform contact + no interview | ≥ 65 |
| Apply-path mismatch or input conflict | ≥ 45 |
| Unverifiable company with < 2 pieces of evidence | ≥ 40 |
| Disclosed contractor / variable hours | ≥ 35 |
| Official match + professional apply path, no conflicts | ≤ 30 |
| Reputable job board + professional apply path, no conflicts | ≤ 45 |

Intelligence v2 (after policy reconciliation):

| Rule | Score |
| --- | --- |
| Known threat-intelligence match | ≥ 70 |
| Financial/identity vector: money-mule, applicant-funded crypto, or credential harvesting | ≥ 80 |
| Buy-to-work (materials / gift cards / samples) | ≥ 65 |
| Impersonation stack: apply mismatch + (risky recruiter OR new domain OR fresh certificate) | ≥ 65 |
| Advance fee: upfront fee/deposit, no strong corroboration, not a named-business franchise fee | ≥ 65 |
| Unverifiable company + off-platform channel + no footprint | ≥ 65 |
| Reputation scam pattern: scam-warning news + structural scam signal (incl. weekly pay) | ≥ 65 |
| Apply-path mismatch alone | ≥ 35 |
| Verification floor: ANY open moderate concern (off-platform contact, no interview\*, salary anomaly, new domain, risky recruiter, stale-only evidence, weak-only corroboration, contractor/commission terms, upfront fee) | ≥ 35 (cannot be `safe`) |

\* A no-interview flow is waived as a concern only when broker-verified official evidence
corroborates the employer AND an explicit alternative-vetting signal is present (background
check, aptitude test, orientation, online sign-up) — e.g. gig platforms and open-enrollment
apprenticeships. A named business charging a franchise/reseller *business* fee stays caution
(not high-risk), but an *employee-job* fee (equipment/training/registration deposit) always
floors to high-risk.

The verification floor encodes the product stance: trust evidence can lower a score
*within* the caution band, but a report cannot certify a post as `safe` while a concern
that a careful human would verify is still open.

## Verdict thresholds (calibrated)

`35 / 65` were validated by a 441-point grid sweep over both cutoffs on the
train+validation splits (`node scripts/score-accuracy.mjs --sweep`). The optimal macro-F1
plateau spans safe/caution 25–35 and caution/high-risk 55–65; the shipped `(35, 65)` sits
on the plateau with maximal high-risk recall, at the most lenient corner — the largest
margin against false positives while the floors pin scam patterns at or above the cutoffs.
Thresholds and floors are one coupled system: floors deliberately land *at* 35/65, so
moving a cutoff requires moving its floors in lockstep.

## Salary plausibility

- `normalizeCompensation` parses amount, currency (USD/GBP/EUR/CAD/AUD/PHP), and period,
  normalizing to a monthly amount (hour ×173.2, week ×4.33, year ÷12).
- Comparables: median of same-currency live comparable listings when ≥ 2 exist, otherwise
  a seeded country/role/seniority band (lib/salary-benchmarks.ts).
- **Currency guard:** a ratio is only computed when claim and benchmark currencies match —
  cross-currency division manufactured 5×+ false anomalies before this guard.
- Anomalous when the quote is weekly for a salaried role, or ≥ 2.5× the comparable band.
- The base engine additionally flags weekly quotes generally (+12) and implausible weekly
  amounts (≥ 60,000/week in any currency, or ≥ 3,000/week for junior-level roles) — this
  replaced hardcoded `80000|100000` literals.

## Score trace (explainability)

Every report carries a complete audit of its number:

- `intelligence.scoreTrace` — ordered v2 steps from an explicit `Baseline +25` to the
  final score. Deltas are *effective* (post-clamp), so **the sum of deltas always equals
  the final riskScore exactly**. Signal-bearing steps cite `signalId` and `evidenceIds`.
- `intelligence.baseScoreTrace` — the base engine's own breakdown (baseline, per-signal
  confidence-scaled deltas, binding floors/ceilings, rounding), referenced by the v2
  `Policy reconciliation` step.

Invariants are enforced by test/score-trace.test.mjs across the full labeled dataset.

## Determinism

- No network, no LLM, no filesystem access at scoring time.
- Evidence freshness is classified against an injectable `now` (`buildAuditReportV2`
  input); production defaults to current time, tests pin it. Before this, wall-clock
  `Date.now()` made identical audits drift across days.
- The trainer (below) uses fixed initialization, full-batch gradient descent, and no
  randomness: identical inputs → byte-identical artifacts.

## Measurement harness and dataset

- `test/fixtures/scoring-dataset.mjs` — 208 labeled cases (56 safe / 55 caution / 97
  high-risk) built from hand-labeled archetypes plus label-preserving surface variants,
  plus 58 adversarial cases in `test/fixtures/redteam-cases.mjs` harvested by a
  multi-agent red-team workflow (11 attack dimensions, independently label-audited and
  execution-verified). Splits (train 133 / validation 32 / test 43) are assigned at the
  archetype level so near-duplicate scenarios never leak across splits.
- `node scripts/eval-scenarios.mjs <file.json>` — runs arbitrary `{claims, evidence,
  expected}` scenarios through the real engine, for execution-verifying red-team
  candidates before folding them into the dataset.
- `node scripts/score-accuracy.mjs` — confusion matrix, per-class precision/recall/F1,
  macro-F1 per split, misclassification dump with trace steps. `--json` for machine
  output, `--update-baseline` to record the gate, `--sweep` for threshold calibration.
- `test/scoring-dataset-accuracy.test.mjs` (in `npm run test:security`) gates the
  test-split macro-F1 against `test/fixtures/accuracy-baseline.json` and asserts the
  hard-safety invariant: cases carrying a threat-intel match, upfront-fee ask, apply
  mismatch, or off-platform+no-interview bundle can never be scored `safe`.

Honesty note: the dataset is hand-authored; 100% accuracy on it means the engine encodes
the labeling policy, not that real-world accuracy is 100%. Extend the dataset with real
misclassified audits over time, re-run the harness, and let the gate catch regressions.

## Offline-trained weights

`node scripts/train-risk-weights.mjs` fits the base engine's signal weights with the same
arithmetic the runtime uses (`score = 25 + Σ w·x·confidence`), an ordinal band hinge
matched to the 35/65 cutoffs (safe ≤ 30, caution 40–60, high-risk ≥ 70), an L2 pull
toward the hand-tuned priors, and direction sign constraints (risk ≥ 0, trust ≤ 0) so
every coefficient stays individually explainable. Trains on train+validation only.

Shipping policy: trained weights are wired into production **only if they beat hand-tuned
weights on the validation split**. Current result: both score 100% — a tie — so the
hand-tuned weights remain live and `lib/risk-weights.generated.mjs` ships as the recorded
comparison artifact. The runtime override path (`scoreAuditSignals(signals, evidence,
weightOverrides)`) validates every entry and falls back to the hand-tuned weight for any
missing or malformed value, so a bad artifact can never break scoring
(test/signal-weight-overrides.test.mjs).

To retrain after extending the dataset:

```bash
node scripts/train-risk-weights.mjs   # refits, rewrites lib/risk-weights.generated.mjs,
                                      # prints the hand-tuned vs trained validation comparison
```

## Reproducing the metrics

```bash
node scripts/score-accuracy.mjs             # full accuracy report + baseline gate
node scripts/score-accuracy.mjs --sweep     # threshold calibration sweep
node scripts/train-risk-weights.mjs         # weight training + comparison
npm run test:security                       # full regression incl. dataset/trace/safety gates
npm run lint                                # typecheck
```
