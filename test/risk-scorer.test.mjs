import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

async function loadRiskScorer() {
  const auditSignalsSource = await fs.readFile(new URL('../lib/audit-signals.mjs', import.meta.url), 'utf8')
  const auditSignalsCompiled = auditSignalsSource
    .replace(/^export function /gm, 'function ')
    + '\nmodule.exports = { buildAuditSignals, scoreAuditSignals, traceAuditSignals, strongestRiskSignals, strongestTrustSignals, effectiveSignalWeight }\n'
  const auditSignalsContext = { exports: {}, module: { exports: {} }, console }
  vm.runInNewContext(auditSignalsCompiled, auditSignalsContext)

  const source = await fs.readFile(new URL('../lib/risk-scorer.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const context = {
    exports: {},
    require: (id) => {
      if (id === '@/lib/audit-signals.mjs') return auditSignalsContext.module.exports
      return {}
    },
  }

  vm.runInNewContext(compiled, context)
  return context.exports
}

test('green verification signals lower risk instead of increasing it', async () => {
  const { calculateRiskScore, determineVerdict } = await loadRiskScorer()

  const neutral = calculateRiskScore(
    {
      company: 'Apex Careers',
      role: 'Frontend Intern',
      salary: 'PHP 20,000 per month',
      location: 'Manila',
      contactMethod: 'Email',
      applicationPath: 'Official careers page',
    },
    [],
    [],
    [],
  )

  const verified = calculateRiskScore(
    {
      company: 'Apex Careers',
      role: 'Frontend Intern',
      salary: 'PHP 20,000 per month',
      location: 'Manila',
      contactMethod: 'Email',
      applicationPath: 'Official careers page',
    },
    [],
    [
      'Company web presence verified',
      'Professional application through official channels',
      'Salary formatted as standard market rate',
      'Specific location provided',
    ],
    [
      { type: 'Company Check', source: 'Search', snippet: 'Official careers page found.' },
      { type: 'Local Presence', source: 'Maps', snippet: 'Registered local office found.' },
    ],
  )

  assert.ok(verified < neutral, `expected verified score ${verified} to be lower than neutral score ${neutral}`)
  assert.equal(determineVerdict(verified), 'safe')
})

test('obvious scam patterns stay high risk even with one generic positive signal', async () => {
  const { calculateRiskScore, determineVerdict } = await loadRiskScorer()
  const score = calculateRiskScore(
    {
      company: 'Unknown / Not Verifiable',
      role: 'Remote Frontend Intern',
      salary: 'PHP 80,000 per week',
      location: 'Remote',
      contactMethod: 'Telegram',
      applicationPath: 'No interview mentioned',
    },
    [
      'Unrealistically high salary for the role level',
      'Salary quoted per week instead of annual (suspicious)',
      'Telegram-only contact method (bypasses official channels)',
      'Company name not verifiable via web search',
      'No interview process mentioned',
    ],
    ['Specific location provided'],
    [],
  )

  assert.ok(score >= 80, `expected scam-pattern score to remain high, got ${score}`)
  assert.equal(determineVerdict(score), 'high-risk')
})

test('trusted SerpApi evidence lowers risk more than generic snippets', async () => {
  const { calculateRiskScore, determineVerdict } = await loadRiskScorer()

  const score = calculateRiskScore(
    {
      company: 'Acme Careers',
      role: 'Frontend Developer',
      salary: 'PHP 20,000 per month',
      location: 'Manila',
      contactMethod: 'Email',
      applicationPath: 'Official careers page',
    },
    [],
    ['Company official careers page matched', 'Verified local business presence', 'Market-comparable jobs found'],
    [
      {
        type: 'Official Company Presence',
        source: 'SerpApi Google Search',
        url: 'https://acme.com/careers',
        snippet: 'Trust: official | Official company careers page matched.',
      },
      {
        type: 'Verified Local Presence',
        source: 'SerpApi Google Maps',
        url: 'https://acme.com',
        snippet: 'Trust: verified-local | Address: Makati, Metro Manila | Phone: +63 2 1234 5678 | Rating: 4.4 from 120 reviews.',
      },
      {
        type: 'Comparable Jobs',
        source: 'LinkedIn',
        url: 'https://linkedin.com/jobs/view/123',
        snippet: 'Trust: reputable-job-board | Frontend Developer at Acme Careers | Apply: https://acme.com/careers',
      },
    ],
  )

  assert.ok(score < 20, `expected trusted evidence to strongly lower risk, got ${score}`)
  assert.equal(determineVerdict(score), 'safe')
})

test('SerpApi scam and apply mismatch evidence can move an audit to high risk', async () => {
  const { calculateRiskScore, determineVerdict } = await loadRiskScorer()

  const score = calculateRiskScore(
    {
      company: 'Acme Careers',
      role: 'Frontend Developer',
      salary: 'PHP 80,000 per week',
      location: 'Remote',
      contactMethod: 'Telegram',
      applicationPath: 'Apply through telegram recruiter',
    },
    ['Unrealistically high salary for the role level', 'Telegram-only contact method'],
    [],
    [
      {
        type: 'Reputation',
        source: 'SerpApi Google News',
        url: 'https://news.example.com/acme-careers-scam',
        snippet: 'Risk signal: recent scam and impersonation reports mention Acme Careers.',
      },
      {
        type: 'Apply Path Mismatch',
        source: 'SerpApi Google Jobs',
        url: 'https://fake-apply.example.com',
        snippet: 'Risk signal: apply link does not match official company domain acme.com.',
      },
    ],
  )

  assert.ok(score >= 80, `expected SerpApi risk evidence to produce high risk, got ${score}`)
  assert.equal(determineVerdict(score), 'high-risk')
})
