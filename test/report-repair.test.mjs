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

test('repairAuditReportForDisplay recovers LinkedIn title and location from archived evidence', () => {
  const { report, changedFields } = repairAuditReportForDisplay({
    ...baseReport,
    id: 'chat_1777850197131',
    timestamp: '2026-05-04T01:00:00.000Z',
    extractedClaims: {
      company: 'Dexian Asia Pacific',
      role: 'Unspecified Role',
      salary: 'Not specified',
      location: 'Not specified',
      contactMethod: 'LinkedIn',
      applicationPath: 'LinkedIn job page',
      recruiterPhone: '4405077596',
    },
    redFlags: ['No local presence found', 'No supporting evidence found'],
    evidence: [
      {
        source: 'LinkedIn public job page',
        type: 'Job Post Source',
        url: 'https://www.linkedin.com/jobs/view/4405077596/',
        snippet: [
          'Resolved LinkedIn public job page content:',
          'Quality Assurance Automation Engineer',
          'Dexian Asia Pacific',
          'Manila, National Capital Region, Philippines · 1 week ago · 33 applicants',
          'On-site Contract Easy Apply',
          'People you can reach out to Prerana Jogur Malaysia and Singapore Markets Job poster',
        ].join(' '),
      },
    ],
  })

  assert.equal(report.id, 'chat_1777850197131')
  assert.equal(report.timestamp, '2026-05-04T01:00:00.000Z')
  assert.equal(report.extractedClaims.role, 'Quality Assurance Automation Engineer')
  assert.equal(report.extractedClaims.location, 'Manila, National Capital Region, Philippines')
  assert.equal(report.extractedClaims.applicationPath, 'LinkedIn Easy Apply')
  assert.equal(report.extractedClaims.recruiterPhone, undefined)
  assert.deepEqual(report.redFlags, ['No local presence found'])
  assert.match(report.summary, /limited independent evidence/i)
  assert.ok(changedFields.includes('extractedClaims.role'))
  assert.ok(changedFields.includes('extractedClaims.location'))
  assert.ok(changedFields.includes('extractedClaims.recruiterPhone'))
  assert.ok(changedFields.includes('redFlags'))
  assert.ok(changedFields.includes('summary'))
})

test('repairAuditReportForDisplay keeps missing-evidence warnings for generic public job pages', () => {
  const input = {
    ...baseReport,
    id: 'report_generic_public_job_page_repair',
    summary: 'No supporting evidence found from live search. Treat this as unverified.',
    extractedClaims: {
      company: 'Apex Remote Hiring',
      role: 'Remote Payroll Assistant',
      salary: 'PHP 80,000/week',
      location: 'Remote',
      contactMethod: 'Telegram',
      applicationPath: 'https://attacker.example/jobs/payroll-assistant',
    },
    redFlags: ['No supporting evidence found from live search'],
    evidence: [
      {
        source: 'public job page',
        type: 'Job Post Source',
        url: 'https://attacker.example/jobs/payroll-assistant',
        snippet: 'HireProof read public job content from https://attacker.example/jobs/payroll-assistant.',
        sourceQuality: 'public',
        trustLevel: 'low',
      },
    ],
  }

  const { report, changedFields } = repairAuditReportForDisplay(input)

  assert.ok(report.redFlags.some((flag) => /no supporting evidence/i.test(flag)))
  assert.match(report.summary, /No supporting evidence/i)
  assert.ok(!changedFields.includes('redFlags'))
  assert.ok(!changedFields.includes('summary'))
})
test('developer report repair endpoint is authenticated, same-origin guarded, and dry-run capable', async () => {
  const source = await fs.readFile(new URL('../app/api/developer/repair-reports/route.ts', import.meta.url), 'utf8')

  assert.match(source, /getUserFromSessionToken/)
  assert.match(source, /validateMutationOrigin/)
  assert.match(source, /dryRun/)
  assert.match(source, /repairAuditReportForDisplay/)
  assert.match(source, /saveReport/)
})
