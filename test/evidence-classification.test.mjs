import test from 'node:test'
import assert from 'node:assert/strict'
import { loadScoringStack } from './helpers/load-scoring-stack.mjs'
import { FIXED_NOW } from './fixtures/scoring-dataset.mjs'

const BASE_CLAIMS = {
  company: 'Acme Careers',
  role: 'Frontend Developer',
  salary: 'PHP 90,000 per month',
  location: 'Manila',
  contactMethod: 'Email',
  applicationPath: 'Official careers page',
}

function report(stack, evidence, claims = {}) {
  return stack.buildAuditReportV2({
    id: 'classification_probe',
    extractedClaims: { ...BASE_CLAIMS, ...claims },
    evidence,
    now: FIXED_NOW,
  })
}

test('clean-reputation snippet with negated scam words is NOT a reputation risk', async () => {
  const stack = await loadScoringStack()
  const result = report(stack, [
    {
      type: 'Reputation',
      source: 'SerpApi Google News',
      snippet: 'No scam or fraud reports found for Acme Careers; positive employee reviews and a hiring award.',
    },
    { type: 'Official Company Presence', source: 'SerpApi Google Search', url: 'https://acme.com/careers', snippet: 'Trust: official | Acme Careers official website matched.' },
  ])

  const reputationSignal = result.intelligence.signals.find((signal) => signal.id === 'reputation_risk')
  assert.equal(reputationSignal, undefined, 'negated scam words must not fire reputation_risk')
  const reputationItem = result.evidence.find((item) => item.type === 'Reputation')
  assert.notEqual(reputationItem.trustLevel, 'risk', 'clean reputation evidence must not classify as trust-level risk')
  assert.equal(result.verdict, 'safe')
})

test('genuine scam-warning reputation snippet still fires reputation risk', async () => {
  const stack = await loadScoringStack()
  const result = report(stack, [
    {
      type: 'Reputation',
      source: 'SerpApi Google News',
      snippet: 'Risk signal: multiple scam and impersonation warning reports mention Acme Careers recruiters.',
    },
  ])

  assert.ok(result.intelligence.signals.some((signal) => signal.id === 'reputation_risk'))
})

test('comparable-aggregator hosts classify as weak sources, not official', async () => {
  const stack = await loadScoringStack()
  const result = report(stack, [
    {
      type: 'Company Check',
      source: 'Web search',
      url: 'https://ph.talent.com/jobs/frontend-developer-acme',
      snippet: 'Acme Careers careers page listing mirrored on aggregator.',
    },
  ])

  const item = result.evidence[0]
  assert.notEqual(item.sourceQuality, 'official', 'aggregator host must not classify as official')
})

test('risky mismatch snippet naming the official domain still classifies risky', async () => {
  const stack = await loadScoringStack()
  const result = report(stack, [
    {
      type: 'Apply Path Mismatch',
      source: 'Evidence broker domain check',
      url: 'https://acme-hiring.top',
      snippet: 'Risk signal: submitted apply domain acme-hiring.top does not match official company domain acme.com.',
    },
  ])

  const item = result.evidence[0]
  assert.equal(item.sourceQuality, 'risky')
  assert.equal(item.trustLevel, 'risk')
})

test('base engine negative-reputation signal respects negation', async () => {
  const stack = await loadScoringStack()
  const signals = stack.buildAuditSignals(BASE_CLAIMS, [], [], [
    {
      type: 'Reputation',
      source: 'SerpApi Google News',
      snippet: 'No scam, fraud, or warning reports found for Acme Careers.',
    },
  ])
  assert.equal(
    signals.some((signal) => signal.id === 'evidence.negative_reputation'),
    false,
    'negated reputation words must not fire evidence.negative_reputation',
  )

  const firing = stack.buildAuditSignals(BASE_CLAIMS, [], [], [
    {
      type: 'Reputation',
      source: 'SerpApi Google News',
      snippet: 'Recent scam and impersonation reports mention Acme Careers.',
    },
  ])
  assert.equal(firing.some((signal) => signal.id === 'evidence.negative_reputation'), true)
})
