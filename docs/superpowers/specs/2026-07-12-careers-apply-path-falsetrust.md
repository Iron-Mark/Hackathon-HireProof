# Fix: `careers@` / bare-`official` apply-path false-trust

**Date:** 2026-07-12
**Branch:** `feat/careers-apply-path-falsetrust`
**Type:** Scoring/extraction correctness + legibility hardening (follow-on to the scoring-sensitivity slice, PR #63)

## Problem

`extractApplicationPath` (and its twin in the `recoverObviousClaims` fast path) mapped **any** post
containing the substring `careers` or `official` to `applicationPath = "Official careers channel"`:

```js
if (lower.includes('official') || lower.includes('careers')) return 'Official careers channel'
```

That claim then earns the `apply_path_professional` trust signal (a green *"The application path uses
a recognizable job board, official channel, or public job URL"* line, weight −8) in **both** scoring
layers — `buildContactSignals` (audit-signals) and `deriveSubmittedApplyPathTrust` (intelligence-v2),
which each key off the `applicationPath` claim.

So a scam that merely names a `careers@scammer.com` email — or drops the word "official" — forged an
unearned trust line and a ~7-point score discount. Reproduced end-to-end: a single-fee scam using a
`careers@` email scored **54 (caution)** vs the honest **61 (caution)**; the report literally vouched
for the scammer's apply path.

## Why it was masked (honest framing)

This is a **legibility + robustness** fix, **not** an accuracy-number mover:

- The real-text corpus's one `careers@` case (`hr-fake-recruiter-lookalike`) was already floored to
  high-risk by the look-alike-domain / setup-fee signal, so macro-F1 is unchanged at **0.9582**.
- Realistic scams are either hard-floored above 65 (buy-to-work / money-mule / gift-card → floor wins)
  or genuinely in the caution band (still caution after the honest +7). A verdict *flip* requires the
  honest score to land in a narrow 65–72 no-floor band, which is contrived — so we did **not**
  manufacture a corpus flip case.

Its genuine value: the dossier stops vouching for a scammer's apply path, the displayed
`applicationPath` becomes honest (`Email`/`Not specified`, not a fabricated `Official careers
channel`), the free ~7-point discount is removed, and the `"official"` → trust collision (e.g.
*"official Telegram account"*, *"Line official"*) is closed.

## Design: judge PHRASING, not URLs/emails

`isOfficialCareersChannel(text)` recognises a genuine official apply channel by **phrasing only**:

- a careers **page / portal / site / website / section / hub** (singular or plural), or
- an **`official <careers|website|company|portal|page|hiring|application|apply>`** phrase.

Deliberately **not** URL/email parsing. Real apply URLs arrive in the `url` field and short-circuit to
`"Provided job URL"` (which grants the apply-path trust via its own path) *before* the careers branch.
Matching careers-shaped tokens in prose only opened an injection surface.

Guards:
- **Same-line separator** `[  ]+` (space or non-breaking space, not `\s+`): a newline or tab
  can't glue an unrelated heading/column (`"careers" \n "Page 1 of 3"`) into a match.
- **Plural `careers`** after `official`: kills the `"official career offer"` lure.
- **`channel` excluded**: a Telegram/WhatsApp "careers channel" is not a careers page.
- **Bare `official` never matches** — it needs a real following noun.

Single fix point: both extraction sites call the shared exported helper. Because both scoring layers
consume the `applicationPath` **claim**, fixing extraction transitively fixes both.

## Adversarial verification (red-team → deterministic adjudication)

A 6-lens red-team panel (evasion-scam, legit-miss, punctuation/spacing, unicode/obfuscation,
url-abuse, redos/pathological) proposed **58 candidate breakers**; each was adjudicated through the
*real* engine (`isOfficialCareersChannel` + full extraction→scoring + ReDoS timing).

- **v1** (a keyword+URL regex) leaked ~20 false-positives: dotted `careers.hr.team@gmail.com` email
  local-parts, `bit.ly/careers` / `t.me/careers`, `/careers-fair` slugs, `careers.2024.pdf`
  filenames, newline-glued headings, `"careers channel"`, singular `"official career"`.
- **v2** (this phrasing-only design): **0** exploitable false-positives; the remaining 23 mismatches
  are all *safe* false-negatives (uncommon legit phrasings — "careers landing page", "careers
  webpage", "official jobs page", hyphenated, and bare-text careers URLs delegated to the `url`
  field — that lose a minor trust bonus but are never mis-flagged). ReDoS: none (≤0.6 ms/classify).

### Accepted limitations (safe by design)
Legit phrasings we deliberately do not chase, because the failure mode is a legit post losing a small
trust bonus (never a scam mis-flag), and chasing every synonym re-introduces brittleness:
`careers landing page`, `careers webpage/homepage`, `careers web site`, `official jobs page`,
`official job/recruitment portal`, hyphenated `careers-portal`, localized `/en/careers` URLs, and
bare-text careers sub-domains/URLs (these belong in the `url` field).

## Tests

- `test/claim-extraction.test.mjs`: helper accepts genuine phrasing incl. plurals + `hub`; rejects
  `careers@` emails (plain + dotted), careers-shaped URLs/filenames/slugs, `"channel"` lure,
  `official`-collisions, and newline-glue — the red-team breakers locked in as regression guards; plus
  an end-to-end `extractClaimsFromText` no-forge assertion.
- `test/real-text-accuracy.test.mjs`: signal-level proof — a `careers@` scam earns **no**
  `apply_path_professional` trust; a genuine careers-page post still does.

## Results

401/401 suite · real-text harness 0.9582 (unchanged) · typecheck clean · 0 adversarial false-positives.
