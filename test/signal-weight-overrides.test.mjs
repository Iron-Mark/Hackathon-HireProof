import test from 'node:test'
import assert from 'node:assert/strict'
import { loadScoringStack } from './helpers/load-scoring-stack.mjs'

const CLAIMS = {
  company: 'Unknown / Not Verifiable',
  role: 'Remote Assistant',
  salary: 'PHP 25,000 per month',
  location: 'Remote',
  contactMethod: 'Telegram',
  applicationPath: 'Reply to post',
}

test('confidence multiplier scales signal contributions', async () => {
  const { effectiveSignalWeight } = await loadScoringStack()

  assert.equal(effectiveSignalWeight({ id: 'x', weight: 20, confidence: 'high' }), 20)
  assert.equal(effectiveSignalWeight({ id: 'x', weight: 20, confidence: 'medium' }), 17)
  assert.equal(effectiveSignalWeight({ id: 'x', weight: 20, confidence: 'low' }), 12)
  // Unknown confidence falls back to the medium multiplier.
  assert.equal(effectiveSignalWeight({ id: 'x', weight: 20 }), 17)
})

test('valid weight overrides are applied; invalid entries fall back to hand-tuned weights', async () => {
  const { effectiveSignalWeight } = await loadScoringStack()
  const signal = { id: 'contact.telegram_only', weight: 20, confidence: 'high' }

  assert.equal(effectiveSignalWeight(signal, { 'contact.telegram_only': 30 }), 30)
  // Malformed override values are ignored — the runtime never breaks on a bad artifact.
  assert.equal(effectiveSignalWeight(signal, { 'contact.telegram_only': Number.NaN }), 20)
  assert.equal(effectiveSignalWeight(signal, { 'contact.telegram_only': 'oops' }), 20)
  assert.equal(effectiveSignalWeight(signal, {}), 20)
  assert.equal(effectiveSignalWeight(signal, undefined), 20)
})

test('scoreAuditSignals accepts an override map without changing floors', async () => {
  const { buildAuditSignals, scoreAuditSignals } = await loadScoringStack()
  const signals = buildAuditSignals(CLAIMS, [], [], [])

  const handTuned = scoreAuditSignals(signals, [])
  const boosted = scoreAuditSignals(signals, [], { 'contact.telegram_only': 40 })
  assert.ok(boosted > handTuned, `override should raise the score (${boosted} vs ${handTuned})`)

  // A malformed artifact (wrong shapes everywhere) reproduces the hand-tuned score exactly.
  const malformed = scoreAuditSignals(signals, [], { anything: 'broken', other: null })
  assert.equal(malformed, handTuned)
})

test('trained-weights artifact exists, is well-formed, and records the shipping comparison', async () => {
  const artifact = await import('../lib/risk-weights.generated.mjs')
  assert.equal(typeof artifact.TRAINED_SIGNAL_WEIGHTS, 'object')
  assert.ok(Object.keys(artifact.TRAINED_SIGNAL_WEIGHTS).length > 0)
  for (const [id, weight] of Object.entries(artifact.TRAINED_SIGNAL_WEIGHTS)) {
    assert.equal(typeof weight, 'number', `trained weight for ${id} must be a number`)
    assert.ok(Number.isFinite(weight), `trained weight for ${id} must be finite`)
  }
  assert.equal(typeof artifact.TRAINING_METADATA.validationAccuracy.handTuned, 'number')
  assert.equal(typeof artifact.TRAINING_METADATA.validationAccuracy.trained, 'number')
})
