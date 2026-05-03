import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { repairAuditReportForDisplay } from '../lib/report-repair.mjs'

const baseReport = {
  id: 'chat_1777847068717',
  version: '2',
  verdict: 'safe',
  riskScore: 18,
  confidence: 'High',
  summary: 'Looks generally safe.',
  extractedClaims: {
    company: 'TELUS Digital AI Data Solutions By 2x See Who You Know',
    role: 'At TELUS Digital',
    salary: 'Not specified',
    location: 'Remote',
    contactMethod: 'LinkedIn',
    applicationPath: 'Direct message',
  },
  redFlags: [],
  greenFlags: ['Trusted job board application path'],
  evidence: [
    {
      source: 'LinkedIn',
      type: 'Resolved Job Page',
      url: 'https://www.linkedin.com/jobs/view/4409014711/',
      snippet: 'Resolved LinkedIn public job page content: Online Data Analyst TELUS Digital AI Data Solutions Application Process Easy Apply on LinkedIn',
    },
  ],
  alternatives: [],
  nextSteps: [],
  timestamp: '2026-05-04T00:00:00.000Z',
  mode: 'live',
  source: 'web',
  intelligence: {
    coverage: {
      company: 'partial',
      local: 'missing',
      recruiter: 'missing',
      reputation: 'missing',
      market: 'missing',
      applyPath: 'unknown',
    },
    companyIdentity: {
      status: 'partial',
      evidenceIds: [],
    },
    localPresence: {
      status: 'missing',
      evidenceIds: [],
    },
    marketBenchmark: {
      status: 'missing',
      evidenceIds: [],
    },
    applyPath: {
      status: 'unknown',
      evidenceIds: [],
    },
    signals: [],
    scoreTrace: [],
  },
  operations: {},
}

test('repairAuditReportForDisplay cleans archived LinkedIn UI artifacts without changing report identity', () => {
  const { report, changedFields } = repairAuditReportForDisplay(baseReport)

  assert.equal(report.id, baseReport.id)
  assert.equal(report.extractedClaims.company, 'TELUS Digital AI Data Solutions')
  assert.equal(report.extractedClaims.role, 'Online Data Analyst')
  assert.equal(report.extractedClaims.applicationPath, 'LinkedIn Easy Apply')
  assert.ok(changedFields.includes('extractedClaims.company'))
  assert.ok(changedFields.includes('extractedClaims.role'))
  assert.ok(changedFields.includes('extractedClaims.applicationPath'))
})

test('developer report repair endpoint is authenticated, same-origin guarded, and dry-run capable', async () => {
  const source = await fs.readFile(new URL('../app/api/developer/repair-reports/route.ts', import.meta.url), 'utf8')

  assert.match(source, /getUserFromSessionToken/)
  assert.match(source, /validateMutationOrigin/)
  assert.match(source, /dryRun/)
  assert.match(source, /repairAuditReportForDisplay/)
  assert.match(source, /saveReport/)
})
