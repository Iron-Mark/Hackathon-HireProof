import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { loadScoringStack } from './helpers/load-scoring-stack.mjs'
import { SCORING_DATASET, FIXED_NOW } from './fixtures/scoring-dataset.mjs'

async function scoreDataset() {
  const stack = await loadScoringStack()
  return SCORING_DATASET.map((item) => {
    const report = stack.buildAuditReportV2({
      id: `dataset_${item.id}`,
      extractedClaims: item.input.extractedClaims,
      evidence: item.input.evidence,
      enrichmentRedFlags: item.input.enrichmentRedFlags,
      now: FIXED_NOW,
    })
    return { item, report }
  })
}

test('dataset sanity: size, splits, and class coverage', () => {
  assert.ok(SCORING_DATASET.length >= 120, `expected >= 120 labeled cases, got ${SCORING_DATASET.length}`)
  for (const split of ['train', 'validation', 'test']) {
    for (const verdict of ['safe', 'caution', 'high-risk']) {
      const count = SCORING_DATASET.filter((item) => item.split === split && item.expected === verdict).length
      assert.ok(count >= 2, `split ${split} needs >= 2 '${verdict}' cases, got ${count}`)
    }
  }
})

test('test-split macro-F1 stays at or above the recorded baseline', async () => {
  const baseline = JSON.parse(await fs.readFile(new URL('./fixtures/accuracy-baseline.json', import.meta.url), 'utf8'))
  const scored = await scoreDataset()
  const testCases = scored.filter(({ item }) => item.split === 'test')

  const verdicts = ['safe', 'caution', 'high-risk']
  let f1Sum = 0
  for (const cls of verdicts) {
    const tp = testCases.filter(({ item, report }) => item.expected === cls && report.verdict === cls).length
    const fp = testCases.filter(({ item, report }) => item.expected !== cls && report.verdict === cls).length
    const fn = testCases.filter(({ item, report }) => item.expected === cls && report.verdict !== cls).length
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp)
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn)
    f1Sum += precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall)
  }
  const macroF1 = f1Sum / verdicts.length

  assert.ok(
    macroF1 >= baseline.splits.test.macroF1 - 0.001,
    `test-split macro-F1 ${macroF1.toFixed(4)} regressed below baseline ${baseline.splits.test.macroF1}`,
  )
})

test('safety invariant: hard-safety scenarios are never scored safe', async () => {
  const scored = await scoreDataset()

  for (const { item, report } of scored) {
    const evidence = item.input.evidence || []
    const claims = item.input.extractedClaims
    const text = (value) => String(value || '').toLowerCase()

    const hasThreatIntel = evidence.some((entry) =>
      text(entry.sourceType) === 'threat intel' || /known threat|known phishing|urlhaus|phishtank/i.test(`${entry.type} ${entry.source}`))
    const hasFeeAsk = /fee|deposit|purchase software|software license|starter kit/i.test(claims.applicationPath || '')
    const hasApplyMismatch = evidence.some((entry) => /apply path mismatch|domain mismatch/i.test(entry.type || ''))
    const offPlatformNoInterview = /telegram|whatsapp/i.test(claims.contactMethod || '') &&
      /no interview/i.test(claims.applicationPath || '')

    if (hasThreatIntel || hasFeeAsk || hasApplyMismatch || offPlatformNoInterview) {
      assert.notEqual(
        report.verdict,
        'safe',
        `${item.id} carries a hard-safety signal but scored safe (${report.riskScore})`,
      )
    }
  }
})

test('determinism across the whole dataset: two runs agree exactly', async () => {
  const first = await scoreDataset()
  const second = await scoreDataset()
  for (let index = 0; index < first.length; index += 1) {
    assert.equal(first[index].report.riskScore, second[index].report.riskScore, first[index].item.id)
    assert.equal(first[index].report.verdict, second[index].report.verdict, first[index].item.id)
  }
})
