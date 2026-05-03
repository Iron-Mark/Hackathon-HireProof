import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

async function loadIntelligenceModule() {
  const source = await fs.readFile(new URL('../lib/intelligence-v2.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const context = {
    exports: {},
    console,
    require: (id) => {
      if (id === '@/lib/risk-scorer') {
        return {
          determineVerdict: (score) => score < 35 ? 'safe' : score < 65 ? 'caution' : 'high-risk',
          calculateRiskScore: (claims, redFlags, greenFlags, evidence) => {
            let score = 25 + (redFlags.length * 8) - (greenFlags.length * 4)
            if (/telegram/i.test(claims.contactMethod)) score += 18
            if (/80,000|80000/i.test(claims.salary)) score += 20
            if (evidence.some((item) => item.type === 'Apply Path Mismatch')) score += 14
            if (evidence.some((item) => item.type === 'Official Company Presence')) score -= 8
            return Math.max(0, Math.min(100, score))
          },
          extractRedFlags: (claims, evidence) => {
            const flags = []
            if (/telegram/i.test(claims.contactMethod)) flags.push('Telegram-only contact method')
            if (/80,000|80000|week/i.test(claims.salary)) flags.push('Unrealistically high salary')
            if (evidence.some((item) => item.type === 'Apply Path Mismatch')) flags.push('Apply path does not match official company domain')
            return flags
          },
          extractGreenFlags: (claims, evidence) => {
            const flags = []
            if (evidence.some((item) => item.type === 'Official Company Presence')) flags.push('Company official careers page matched')
            if (evidence.some((item) => item.type === 'Verified Local Presence')) flags.push('Verified local business presence')
            return flags
          },
          getConfidenceLabel: (score, count) => count < 2 ? 'Low' : score > 80 || score < 30 ? 'Very High' : score > 70 || score < 45 ? 'High' : 'Medium',
          generateSummary: (verdict, score, redFlags) => `${verdict}:${score}:${redFlags.length}`,
        }
      }
      if (id === '@/lib/salary-benchmarks') {
        return {
          buildHybridSalaryBenchmark: ({ liveComparableMonthlyValues = [], location = '', seniority = 'unknown' }) => ({
            status: liveComparableMonthlyValues.length >= 2 ? 'live' : 'seeded',
            source: liveComparableMonthlyValues.length >= 2 ? 'serpapi-live-comparables' : 'seeded-country-band',
            country: /remote/i.test(location) ? 'REMOTE' : /philippines|manila/i.test(location) ? 'PH' : 'US',
            currency: /remote/i.test(location) ? 'USD' : /philippines|manila/i.test(location) ? 'PHP' : 'USD',
            comparableMonthlyAmount: liveComparableMonthlyValues.length >= 2 ? liveComparableMonthlyValues[1] : 90000,
            seniority,
          }),
        }
      }
      if (id === '@/lib/alternative-jobs') {
        return {
          buildVerifiedAlternativeJobs: (evidence = []) => evidence
            .filter((item) => item.type === 'Comparable Jobs' && /^https?:\/\//i.test(item.url || ''))
            .map((item) => {
              const snippet = String(item.snippet || '')
              const normalized = snippet.replace(/^Trust:\s*[^|]+\|\s*/i, '')
              const [titleAndCompany = '', ...metadataParts] = normalized.split('|')
              const metadata = metadataParts.join('|')
              const [title = 'Comparable role', company = item.source || 'Job Board'] = titleAndCompany.trim().split(' at ')
              return {
                title: title.trim(),
                company: company.trim(),
                salary: metadata.match(/Salary:\s*([^|]+)/i)?.[1]?.trim() || 'Not specified',
                url: item.url,
                source: item.source,
                verifiedSource: snippet.match(/^Trust:\s*([^|]+)\|/i)?.[1]?.trim() || item.source,
              }
            }),
        }
      }
      return {}
    },
    Date,
    URL,
  }
  context.module = { exports: context.exports }

  vm.runInNewContext(compiled, context)
  return context.module.exports
}

test('normalizes compensation to monthly PHP for market reasoning', async () => {
  const { normalizeCompensation } = await loadIntelligenceModule()

  assert.equal(JSON.stringify(normalizeCompensation('PHP 80,000 per week')), JSON.stringify({
    amount: 80000,
    currency: 'PHP',
    period: 'week',
    monthlyAmount: 346400,
  }))

  assert.equal(JSON.stringify(normalizeCompensation('$20/hour')), JSON.stringify({
    amount: 20,
    currency: 'USD',
    period: 'hour',
    monthlyAmount: 3464,
  }))
})

test('builds v2 intelligence with evidence ids, score trace, and market anomaly', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_test',
    extractedClaims: {
      company: 'Acme Careers',
      role: 'Frontend Intern',
      salary: 'PHP 80,000 per week',
      location: 'Manila',
      contactMethod: 'Telegram',
      applicationPath: 'Apply through recruiter chat',
    },
    evidence: [
      {
        source: 'SerpApi Google Search',
        type: 'Official Company Presence',
        url: 'https://acme.com/careers',
        snippet: 'Trust: official | Official company careers page matched.',
      },
      {
        source: 'SerpApi Google Maps',
        type: 'Verified Local Presence',
        url: 'https://acme.com',
        snippet: 'Trust: verified-local | Address: Makati | Phone: +63 2 1234 5678 | Rating: 4.4 from 120 reviews.',
      },
      {
        source: 'LinkedIn',
        type: 'Comparable Jobs',
        url: 'https://linkedin.com/jobs/view/123',
        snippet: 'Trust: reputable-job-board | Frontend Intern at Example Co | Location: Manila | Salary: PHP 20,000 per month',
      },
      {
        source: 'SerpApi Google Jobs',
        type: 'Apply Path Mismatch',
        url: 'https://fake-apply.example.com',
        snippet: 'Risk signal: submitted apply domain fake-apply.example.com does not match official company domain acme.com.',
      },
    ],
    enrichmentEvidence: [],
    enrichmentRedFlags: [],
    ownerId: 'web',
    source: 'web',
  })

  assert.equal(report.version, '2')
  assert.equal(report.evidence[0].id, 'ev_1')
  assert.equal(report.intelligence.companyIdentity.status, 'matched')
  assert.equal(report.intelligence.localPresence.status, 'verified')
  assert.equal(report.intelligence.applyPath.status, 'mismatch')
  assert.equal(report.intelligence.marketBenchmark.status, 'anomalous')
  assert.ok(report.intelligence.signals.some((signal) => signal.id === 'salary_anomaly' && signal.direction === 'risk'))
  assert.ok(report.intelligence.scoreTrace.length >= 5)
  assert.ok(report.riskScore >= 65)
})

test('v2 intelligence ranks source quality, freshness, and salary ratio explanations', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_quality',
    extractedClaims: {
      company: 'Acme Careers',
      role: 'Senior Frontend Developer',
      salary: 'PHP 250,000 per month',
      location: 'Manila',
      contactMethod: 'Email',
      applicationPath: 'Official careers page',
    },
    evidence: [
      {
        source: 'Weak Directory Mirror',
        type: 'Company Check',
        url: 'https://jobs-mirror.example/acme',
        snippet: 'Directory mirror listing for Acme Careers.',
      },
      {
        source: 'SerpApi Google Search',
        type: 'Official Company Presence',
        url: 'https://acme.com/careers',
        snippet: 'Trust: official | Official company careers page matched.',
      },
      {
        source: 'SerpApi Google News',
        type: 'Reputation',
        url: 'https://news.example/acme-2022',
        snippet: 'Reputation signal: Acme Careers expanded hiring | Date: Jan 1, 2022',
      },
      {
        source: 'LinkedIn',
        type: 'Comparable Jobs',
        url: 'https://linkedin.com/jobs/view/123',
        snippet: 'Trust: reputable-job-board | Senior Frontend Developer at Example Co | Location: Manila | Salary: PHP 100,000 per month',
      },
    ],
    ownerId: 'web',
    source: 'web',
  })

  const official = report.evidence.find((item) => item.type === 'Official Company Presence')
  const weak = report.evidence.find((item) => item.source === 'Weak Directory Mirror')
  const news = report.evidence.find((item) => item.type === 'Reputation')

  assert.equal(official?.sourceQuality, 'official')
  assert.equal(weak?.sourceQuality, 'weak')
  assert.equal(news?.freshness, 'stale')
  assert.equal(report.intelligence.marketBenchmark.seniority, 'senior')
  assert.equal(report.intelligence.marketBenchmark.ratio, 2.5)
  assert.ok(report.intelligence.signals.some((signal) => /2\.5x/.test(signal.rationale)))
  assert.ok(report.intelligence.signals.some((signal) => signal.id === 'stale_evidence'))
})

test('v2 safer alternatives only include sourced comparable jobs', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()

  const report = buildAuditReportV2({
    id: 'alt-proof',
    extractedClaims: {
      company: 'Unknown / Not Verifiable',
      role: 'Frontend Developer',
      salary: 'PHP 80,000 per week',
      location: 'Manila, Philippines',
      contactMethod: 'Telegram',
      applicationPath: 'Direct message only',
    },
    evidence: [
      {
        source: 'SerpApi Google Jobs',
        type: 'Comparable Jobs',
        snippet: 'Trust: reputable-job-board | Frontend Developer at Real Careers PH | Location: Manila | Salary: PHP 70,000 per month',
        url: 'https://www.linkedin.com/jobs/view/123',
      },
      {
        source: 'Generic Jobs',
        type: 'Comparable Jobs',
        snippet: 'Trust: job-result | Fake Placeholder at No Source Inc | Location: Manila | Salary: PHP 90,000 per month',
      },
    ],
  })

  assert.equal(report.alternatives.length, 1)
  assert.equal(report.alternatives[0].title, 'Frontend Developer')
  assert.equal(report.alternatives[0].company, 'Real Careers PH')
  assert.equal(report.alternatives[0].salary, 'PHP 70,000 per month')
  assert.equal(report.alternatives[0].url, 'https://www.linkedin.com/jobs/view/123')
  assert.equal(report.alternatives[0].verifiedSource, 'reputable-job-board')
})

test('remote startup mode does not punish missing local footprint when digital evidence is consistent', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_remote_startup',
    extractedClaims: {
      company: 'NovaForge AI',
      role: 'Remote Product Engineer',
      salary: 'USD 8,000 per month',
      location: 'Remote',
      contactMethod: 'Email',
      applicationPath: 'Official careers page',
      recruiterName: 'Maya Santos',
      recruiterEmail: 'maya@novaforge.ai',
    },
    evidence: [
      {
        source: 'SerpApi Google Search',
        type: 'Official Company Presence',
        url: 'https://novaforge.ai/careers',
        snippet: 'Trust: official | Startup careers page for a distributed AI product team.',
      },
      {
        source: 'LinkedIn',
        type: 'Company Check',
        url: 'https://linkedin.com/company/novaforge-ai',
        snippet: 'NovaForge AI startup company profile with founder and hiring posts.',
      },
      {
        source: 'Wellfound',
        type: 'Company Check',
        url: 'https://wellfound.com/company/novaforge-ai',
        snippet: 'Startup profile and remote jobs.',
      },
    ],
    enrichmentRedFlags: ['No local presence found in search results'],
    ownerId: 'web',
    source: 'web',
  })

  assert.equal(report.intelligence.companyProfileMode, 'startup_remote')
  assert.equal(report.intelligence.coverage.recruiter, 'verified')
  assert.equal(report.intelligence.recruiterIdentity.status, 'verified')
  assert.ok(!report.redFlags.some((flag) => /no local/i.test(flag)))
  assert.ok(report.intelligence.signals.some((signal) => signal.id === 'startup_digital_footprint'))
  assert.ok(report.intelligence.signals.some((signal) => signal.id === 'recruiter_domain_match'))
  assert.equal(report.operations?.falsePositiveControl?.profileModeExplanation?.includes('remote startup'), true)
})

test('v2 salary benchmark falls back to seeded country band when live comparables are sparse', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_seeded_salary',
    extractedClaims: {
      company: 'Acme Careers',
      role: 'Senior Frontend Developer',
      salary: 'PHP 260,000 per month',
      location: 'Manila, Philippines',
      contactMethod: 'Email',
      applicationPath: 'Official careers page',
    },
    evidence: [
      {
        source: 'SerpApi Google Search',
        type: 'Official Company Presence',
        url: 'https://acme.com/careers',
        snippet: 'Trust: official | Official company careers page matched.',
      },
    ],
    ownerId: 'web',
    source: 'web',
  })

  assert.equal(report.intelligence.marketBenchmark.source, 'seeded-country-band')
  assert.equal(report.intelligence.marketBenchmark.country, 'PH')
  assert.equal(report.operations?.salaryBenchmark?.source, 'seeded-country-band')
  assert.ok(report.intelligence.signals.some((signal) => signal.id === 'salary_anomaly'))
})

test('v2 intelligence explains sparse evidence coverage instead of looking fully verified', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_sparse_coverage',
    extractedClaims: {
      company: 'TELUS Digital AI Data Solutions',
      role: 'Online Data Analyst',
      salary: 'Not specified',
      location: 'Remote',
      contactMethod: 'LinkedIn',
      applicationPath: 'LinkedIn Easy Apply',
    },
    evidence: [
      {
        source: 'LinkedIn',
        type: 'Resolved Job Page',
        url: 'https://www.linkedin.com/jobs/view/4409014711/',
        snippet: 'Resolved LinkedIn public job page content: Online Data Analyst TELUS Digital AI Data Solutions Application Process Easy Apply on LinkedIn',
      },
    ],
    ownerId: 'web',
    source: 'web',
  })

  assert.equal(report.intelligence.coverage.company, 'missing')
  assert.equal(report.intelligence.applyPath.status, 'trusted-board')
  assert.equal(report.operations?.coverageBackfill?.status, 'degraded')
  assert.match(report.operations?.coverageBackfill?.message || '', /limited evidence/i)
  assert.ok(report.intelligence.signals.some((signal) => signal.id === 'limited_evidence_coverage'))
})

test('v2 intelligence does not claim no supporting evidence when a trusted job page exists', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_trusted_job_page_only',
    extractedClaims: {
      company: 'Dexian Asia Pacific',
      role: 'Quality Assurance Automation Engineer',
      salary: 'Not specified',
      location: 'Manila, National Capital Region, Philippines',
      contactMethod: 'LinkedIn',
      applicationPath: 'LinkedIn Easy Apply',
    },
    evidence: [
      {
        source: 'LinkedIn public job page',
        type: 'Job Post Source',
        url: 'https://www.linkedin.com/jobs/view/4405077596/',
        snippet: 'Resolved LinkedIn public job page content: Quality Assurance Automation Engineer Dexian Asia Pacific Manila, National Capital Region, Philippines Easy Apply',
      },
    ],
    enrichmentRedFlags: ['No supporting evidence found from live search'],
    ownerId: 'web',
    source: 'web',
  })

  assert.ok(report.redFlags.every((flag) => !/no supporting evidence/i.test(flag)))
  assert.match(report.operations?.coverageBackfill?.message || '', /Limited evidence coverage/i)
  assert.doesNotMatch(report.summary, /No supporting evidence/i)
})

test('v2 intelligence ignores stale comparable-host apply mismatch for trusted LinkedIn job pages', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_linkedin_comparable_mismatch',
    extractedClaims: {
      company: 'Dexian Asia Pacific',
      role: 'Quality Assurance Automation Engineer',
      salary: 'Not specified',
      location: 'Manila, National Capital Region, Philippines',
      contactMethod: 'LinkedIn',
      applicationPath: 'LinkedIn job page',
    },
    evidence: [
      {
        source: 'LinkedIn public job page',
        type: 'Job Post Source',
        url: 'https://www.linkedin.com/jobs/view/4405077596/',
        snippet: 'Resolved LinkedIn public job page content: Quality Assurance Automation Engineer Dexian Asia Pacific Manila, National Capital Region, Philippines Easy Apply',
      },
      {
        source: 'SerpApi Google Search',
        type: 'Official Company Presence',
        url: 'https://www.linkedin.com/jobs/view/4405077596/',
        snippet: 'Trust: official | Quality Assurance Automation Engineer - Dexian Asia Pacific.',
      },
      {
        source: 'Talent.com',
        type: 'Comparable Jobs',
        url: 'https://ph.talent.com/view?id=liquidnet-qa',
        snippet: 'Trust: job-result | Senior QA Engineer at Liquidnet | Location: Manila, Metro Manila',
      },
      {
        source: 'SerpApi Google Jobs',
        type: 'Apply Path Mismatch',
        url: 'https://www.linkedin.com/jobs/view/4405077596/',
        snippet: 'Risk signal: submitted apply domain linkedin.com does not match official company domain ph.talent.com.',
      },
    ],
    ownerId: 'web',
    source: 'web',
  })

  assert.equal(report.intelligence.applyPath.status, 'trusted-board')
  assert.ok(report.redFlags.every((flag) => !/apply path/i.test(flag)))
  assert.ok(report.evidence.every((item) => item.type !== 'Apply Path Mismatch'))
  assert.ok(report.intelligence.signals.every((signal) => signal.id !== 'apply_path_mismatch'))
  assert.ok(report.intelligence.scoreTrace.every((item) => item.step !== 'Apply path' || item.delta !== 18))
})

test('remote recruiter free-mail identity remains risky even with a real company footprint', async () => {
  const { buildAuditReportV2 } = await loadIntelligenceModule()
  const report = buildAuditReportV2({
    id: 'report_recruiter_risk',
    extractedClaims: {
      company: 'Acme Careers',
      role: 'Remote Frontend Developer',
      salary: 'PHP 90,000 per month',
      location: 'Remote Philippines',
      contactMethod: 'Telegram',
      applicationPath: 'Direct message',
      recruiterName: 'John Recruiter',
      recruiterEmail: 'acmejobs.hr@gmail.com',
    },
    evidence: [
      {
        source: 'SerpApi Google Search',
        type: 'Official Company Presence',
        url: 'https://acme.com/careers',
        snippet: 'Trust: official | Official company careers page matched.',
      },
      {
        source: 'LinkedIn',
        type: 'Company Check',
        url: 'https://linkedin.com/company/acme',
        snippet: 'Acme company profile and remote jobs.',
      },
    ],
    ownerId: 'web',
    source: 'web',
  })

  assert.equal(report.intelligence.companyProfileMode, 'established_remote')
  assert.equal(report.intelligence.coverage.recruiter, 'risk')
  assert.equal(report.intelligence.recruiterIdentity.recruiterEmailDomain, 'gmail.com')
  assert.ok(report.intelligence.signals.some((signal) => signal.id === 'recruiter_identity_mismatch'))
  assert.ok(report.riskScore >= 40)
})

test('result screen replaces pseudo bot claims with evidence-backed v2 panels', async () => {
  const source = await fs.readFile(new URL('../components/audit/result-screen.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /Bot Probability/)
  assert.doesNotMatch(source, /Linguistic Entropy/)
  assert.match(source, /Evidence Coverage/)
  assert.match(source, /Score Trace/)
  assert.match(source, /Market Salary/)
  assert.match(source, /Profile Mode/)
  assert.match(source, /Recruiter Identity/)
  assert.match(source, /max-w-7xl/)
  assert.match(source, /Analyst coverage matrix/)
  assert.match(source, /lg:grid-cols-\[minmax\(0,1fr\)_360px\]/)
  assert.doesNotMatch(source, /md:w-80/)
  assert.doesNotMatch(source, /bot-scan-line opacity-20/)
})

test('v2 route exists and returns an AuditReportV2 contract', async () => {
  const source = await fs.readFile(new URL('../app/api/v2/audit/route.ts', import.meta.url), 'utf8')

  assert.match(source, /AuditReportV2/)
  assert.match(source, /buildAuditReportV2/)
  assert.match(source, /version/)
})
