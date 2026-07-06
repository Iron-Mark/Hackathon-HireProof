import test from 'node:test'
import assert from 'node:assert/strict'
import { loadScoringStack } from './helpers/load-scoring-stack.mjs'

const FIXED_NOW = Date.parse('2026-07-01T00:00:00.000Z')

const CLAIMS = {
  company: 'Acme Careers',
  role: 'Frontend Developer',
  salary: 'PHP 90,000 per month',
  location: 'Manila',
  contactMethod: 'Email',
  applicationPath: 'Official careers page',
}

// Evidence with an explicit date so freshness classification depends on "now".
const DATED_EVIDENCE = [
  {
    type: 'Official Company Presence',
    source: 'SerpApi Google Search',
    url: 'https://acme.com/careers',
    snippet: 'Trust: official | Official company careers page matched. Date: June 15, 2026',
  },
  {
    type: 'Reputation',
    source: 'SerpApi Google News',
    url: 'https://news.example.com/acme',
    snippet: 'Acme Careers expands Manila office. Date: January 10, 2026',
  },
]

function buildReport(stack, now) {
  return stack.buildAuditReportV2({
    id: 'report_determinism_probe',
    extractedClaims: CLAIMS,
    evidence: DATED_EVIDENCE,
    now,
  })
}

test('identical inputs and identical injected now produce identical reports', async () => {
  const stack = await loadScoringStack()
  const first = buildReport(stack, FIXED_NOW)
  const second = buildReport(stack, FIXED_NOW)

  assert.equal(first.riskScore, second.riskScore)
  assert.equal(first.verdict, second.verdict)
  assert.equal(first.confidence, second.confidence)
  assert.equal(first.timestamp, second.timestamp)
  assert.deepEqual(first.intelligence.scoreTrace, second.intelligence.scoreTrace)
  assert.deepEqual(
    first.evidence.map((item) => [item.freshness, item.freshnessDays]),
    second.evidence.map((item) => [item.freshness, item.freshnessDays]),
  )
})

test('injected now controls freshness classification instead of wall-clock time', async () => {
  const stack = await loadScoringStack()

  // 16 days after the June 15 evidence date -> fresh.
  const nearReport = buildReport(stack, FIXED_NOW)
  const nearOfficial = nearReport.evidence.find((item) => item.type === 'Official Company Presence')
  assert.equal(nearOfficial.freshness, 'fresh')

  // Two years later the same evidence is stale, and the stale-evidence signal fires.
  const farReport = buildReport(stack, Date.parse('2028-07-01T00:00:00.000Z'))
  const farOfficial = farReport.evidence.find((item) => item.type === 'Official Company Presence')
  assert.equal(farOfficial.freshness, 'stale')
  assert.ok(farReport.intelligence.scoreTrace.some((step) => step.step === 'Evidence freshness'))

  // The probe exists because freshness feeds the score: pinning `now` pins the score.
  assert.equal(nearReport.timestamp, new Date(FIXED_NOW).toISOString())
})

test('report timestamp derives from injected now', async () => {
  const stack = await loadScoringStack()
  const report = buildReport(stack, FIXED_NOW)
  assert.equal(report.timestamp, '2026-07-01T00:00:00.000Z')
})
