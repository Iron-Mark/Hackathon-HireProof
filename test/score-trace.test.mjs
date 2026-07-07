import test from 'node:test'
import assert from 'node:assert/strict'
import { loadScoringStack } from './helpers/load-scoring-stack.mjs'
import { SCORING_DATASET, FIXED_NOW } from './fixtures/scoring-dataset.mjs'

function buildReport(stack, item) {
  return stack.buildAuditReportV2({
    id: `trace_${item.id}`,
    extractedClaims: item.input.extractedClaims,
    evidence: item.input.evidence,
    enrichmentRedFlags: item.input.enrichmentRedFlags,
    now: FIXED_NOW,
  })
}

test('trace invariant: sum of v2 trace deltas equals the final risk score for every dataset case', async () => {
  const stack = await loadScoringStack()
  for (const item of SCORING_DATASET) {
    const report = buildReport(stack, item)
    const sum = report.intelligence.scoreTrace.reduce((total, step) => total + step.delta, 0)
    assert.ok(
      Math.abs(sum - report.riskScore) < 0.011,
      `${item.id}: trace deltas sum to ${sum} but riskScore is ${report.riskScore}`,
    )
    const last = report.intelligence.scoreTrace.at(-1)
    assert.equal(last.scoreAfter, report.riskScore, `${item.id}: last trace step must land on the final score`)
  }
})

test('trace invariant: base-engine trace deltas sum to the base score for every dataset case', async () => {
  const stack = await loadScoringStack()
  for (const item of SCORING_DATASET) {
    const { score, trace } = stack.traceRiskScore(
      item.input.extractedClaims,
      item.input.enrichmentRedFlags || [],
      [],
      item.input.evidence,
    )
    const sum = trace.reduce((total, step) => total + step.delta, 0)
    assert.ok(Math.abs(sum - score) < 0.011, `${item.id}: base trace sums to ${sum}, score is ${score}`)
  }
})

test('v2 signal steps cite their signal id and evidence ids where applicable', async () => {
  const stack = await loadScoringStack()
  const item = SCORING_DATASET.find((entry) => entry.id === 'risk.impersonation.brand.1')
  const report = buildReport(stack, item)

  const signalIds = new Set(report.intelligence.signals.map((signal) => signal.id))
  const citedSteps = report.intelligence.scoreTrace.filter((step) => step.signalId)
  assert.ok(citedSteps.length >= 3, 'expected several signal-cited trace steps')
  for (const step of citedSteps) {
    assert.ok(signalIds.has(step.signalId), `trace step cites unknown signal ${step.signalId}`)
  }

  const mismatchStep = report.intelligence.scoreTrace.find((step) => step.signalId === 'apply_path_mismatch')
  assert.ok(mismatchStep, 'apply-path mismatch must appear in the trace')
  assert.ok((mismatchStep.evidenceIds || []).length > 0, 'mismatch step must cite its evidence')
})

test('base report exposes the base-engine trace alongside the v2 trace', async () => {
  const stack = await loadScoringStack()
  const item = SCORING_DATASET.find((entry) => entry.id === 'risk.classic.telegram.1')
  const report = buildReport(stack, item)

  assert.ok(Array.isArray(report.intelligence.baseScoreTrace))
  assert.equal(report.intelligence.baseScoreTrace[0].step, 'Baseline')
  const signalSteps = report.intelligence.baseScoreTrace.filter((step) => step.signalId)
  assert.ok(signalSteps.length >= 3, 'base trace should include per-signal steps')
})

test('every v2 signal carries a confidence level', async () => {
  const stack = await loadScoringStack()
  for (const item of SCORING_DATASET.slice(0, 40)) {
    const report = buildReport(stack, item)
    for (const signal of report.intelligence.signals) {
      assert.ok(
        ['low', 'medium', 'high'].includes(signal.confidence),
        `${item.id}: signal ${signal.id} missing confidence`,
      )
    }
  }
})

test('trace snapshot: impersonation high-risk case', async () => {
  const stack = await loadScoringStack()
  const item = SCORING_DATASET.find((entry) => entry.id === 'risk.impersonation.brand.1')
  const report = buildReport(stack, item)

  const outline = Array.from(report.intelligence.scoreTrace, (step) => `${step.step}${step.signalId ? `[${step.signalId}]` : ''}:${step.delta}`)
  assert.deepEqual(outline, [
    'Baseline:25',
    'Company identity[company_official_match]:-14',
    'Apply path[apply_path_mismatch]:18',
    'Recruiter identity[recruiter_identity_mismatch]:20',
    'Contact method[off_platform_contact]:12',
    'Policy reconciliation:0',
    'Impersonation floor:4',
    'Evidence coverage:0',
  ])
  assert.equal(report.riskScore, 65)
  assert.equal(report.verdict, 'high-risk')
})

test('trace snapshot: safe official-surface case', async () => {
  const stack = await loadScoringStack()
  const item = SCORING_DATASET.find((entry) => entry.id === 'safe.bigtech.official.1')
  const report = buildReport(stack, item)

  const outline = Array.from(report.intelligence.scoreTrace, (step) => `${step.step}${step.signalId ? `[${step.signalId}]` : ''}:${step.delta}`)
  // Confidence-scaled: remote_digital_footprint -6 x0.85 -> -5; the source
  // reconciliation step's nominal -7 is clamped at 0 to an effective -6.
  assert.deepEqual(outline, [
    'Baseline:25',
    'Company identity[company_official_match]:-14',
    'Company profile mode[remote_digital_footprint]:-5',
    'Source reconciliation[official_source_role_reconciliation]:-6',
    'Market salary[market_comparable_found]:0',
    'Apply path[apply_path_professional]:0',
    'Policy reconciliation:0',
  ])
  assert.equal(report.verdict, 'safe')
})
