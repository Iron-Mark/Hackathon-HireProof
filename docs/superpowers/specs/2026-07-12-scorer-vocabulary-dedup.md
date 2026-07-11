# De-duplicate the scorer vocabulary + matcher primitives

**Date:** 2026-07-12
**Branch:** `feat/scorer-vocabulary-dedup`
**Type:** Behavior-preserving refactor (drift-elimination)

## Problem

`lib/audit-signals.mjs` and `lib/intelligence-v2.ts` — the two layers of the deterministic scoring
engine — each kept a **private, byte-identical copy** of the same scam-detection vocabulary and text
normalization/matcher primitives. Both files carried explicit "Kept in sync with …" comments.

This duplication was an active hazard, not cosmetic:
- Every accuracy commit had to edit the same constant in two files and hope they stayed aligned.
- The `careers@` apply-path false-trust (fixed 2026-07-12) existed in *two* scoring layers for exactly
  this reason; the `rawText` scoring-sensitivity fix (#63) had to thread the same change through
  parallel copies.

Verified before refactoring: all 8 major vocabulary lists (60-term `UPFRONT_PAYMENT_TERMS`, etc.) and
all 4 off-platform lists were **term-for-term identical**; the normalization/matcher stack
(`normalize`/`normalizeText`, `hasUnnegatedTerm`, `tokenizeWithBoundaries`, confusable/leet/diacritic
folding, negation+coercion tokens) was **identical logic** (the only textual difference: `normalize`
carried one redundant no-op `.replace(/\s+/g, ' ')` that `normalizeText` lacked).

## Design

New module **`lib/scam-vocabulary.mjs`** (+ `lib/scam-vocabulary.d.ts`) — the single source of truth,
following the repo's `.mjs`+`.d.ts` convention so both the plain-ESM `.mjs` consumer and the `.ts`
consumer can import it. It holds, as pure functions/constants with no I/O:

- **Normalization/matching primitives:** `foldConfusables`, `leetFold`, `stripDiacritics`,
  `rawFolded`, `collapseSpacedLetters`, `tokenizeWithBoundaries`, `normalize`, `hasAny`,
  `hasTokenPhrase`, `hasRawPhrase`, `hasUnnegatedTerm`, plus `CONFUSABLE_MAP`, `EMOJI_RE`, `LEET_MAP`,
  `DOUBLE_NEG_AFFIRMER_RE`, `NEGATION_TOKENS`, `COERCION_TOKENS`.
- **Off-platform channel vocabulary:** `OFF_PLATFORM_UNAMBIGUOUS/AMBIGUOUS/PIVOT_VERBS/RAW_TERMS`.
- **Scam vocabulary + regex fallbacks:** the 11 `*_TERMS`/`*_RAW_TERMS` lists and
  `BUY_TO_WORK_RE`/`CRYPTO_DEPOSIT_RE`/`MONEY_MULE_RE`.

Both consumers now `import` exactly what they reference. `intelligence-v2.ts` aliases
`normalize as normalizeText` on import, so its 28 call sites are untouched.

**Left local** (correctly not shared): `isSmsOnlyFunnel` (different signatures in the two files),
`hasAmbiguousChannelPivot`, `GENERIC_COMPANY_TERMS`, and intel-v2-only vocab (`BUSINESS_PURCHASE_TERMS`,
`REPUTATION_RISK_TERMS`).

Canonical implementations were taken verbatim from `audit-signals.mjs` (plain JS), so that file is
provably unchanged; the tests prove `intelligence-v2.ts` is unchanged despite adopting them.

## Test-harness changes

The scoring stack is loaded in tests by transpiling each layer in a VM and hand-wiring its `require`s.
Those loaders learned the new module: `test/helpers/load-scoring-stack.mjs`, `test/risk-scorer.test.mjs`,
and `test/intelligence-v2.test.mjs` now load `scam-vocabulary.mjs` and map it as a require target for
`audit-signals.mjs` (`./scam-vocabulary.mjs`) and `intelligence-v2.ts` (`@/lib/scam-vocabulary.mjs`).
`audit-signals.mjs` is now transpiled (ESM→CJS) rather than string-patched, since it has an import.

## Proof of no behavior change

- **401/401** `test:security` suite green — including the calibration determinism and adversarial-matcher
  suites, which assert exact scores.
- Real-text harness **0.9582** — unchanged to 4 dp.
- Typecheck clean; **`next build` succeeds** (webpack resolves the new module from both consumers).

## Result

−477 lines across the two scorer files (`audit-signals.mjs` −280, `intelligence-v2.ts` −215),
consolidated into one 250-line module. A scam-vocabulary edit is now a one-file change.
