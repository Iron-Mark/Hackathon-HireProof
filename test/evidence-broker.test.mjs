import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'

async function loadEvidenceBrokerModule({ env = {}, serpapi = {}, fetchImpl } = {}) {
  const source = await fs.readFile(new URL('../lib/evidence-broker.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const context = {
    exports: {},
    process: { env },
    console,
    URL,
    URLSearchParams,
    AbortController,
    DOMException,
    Date,
    setTimeout,
    clearTimeout,
    fetch: fetchImpl || (async () => ({ ok: true, json: async () => ({}) })),
    require: (id) => {
      if (id === '@/lib/serpapi') {
        return {
          hasSerpApiKey: (key) => Boolean(key || env.SERPAPI_API_KEY),
          getSerpApiOperationalStatus: () => serpapi.operationalStatus || { status: 'ok', message: 'SerpApi available.' },
          runSmartSerpApiInvestigation: serpapi.runSmartSerpApiInvestigation || (async () => []),
          ensureSerpApiEvidenceCoverage: serpapi.ensureSerpApiEvidenceCoverage || (async (evidence) => evidence),
        }
      }
      if (id === '@/lib/schemas') return {}
      throw new Error(`Unexpected require: ${id}`)
    },
  }
  context.module = { exports: context.exports }

  vm.runInNewContext(compiled, context)
  return context.module.exports
}

const sampleClaims = {
  company: 'Acme Careers',
  role: 'Frontend Developer',
  salary: 'PHP 80,000/week',
  location: 'Manila',
  contactMethod: 'Email',
  applicationPath: 'Apply at https://jobs-acme.example/apply',
  recruiterEmail: 'recruiter@acme-careers.example',
}

test('evidence broker extracts URL, recruiter, and contact domains without duplicates', async () => {
  const { extractEvidenceTargets } = await loadEvidenceBrokerModule()

  const targets = extractEvidenceTargets({
    claims: sampleClaims,
    applicationUrl: 'https://jobs-acme.example/apply',
    text: 'Company site https://acme.example/careers. Contact recruiter@acme-careers.example and https://jobs-acme.example/apply.',
    existingEvidence: [
      {
        source: 'SerpApi Google Search',
        type: 'Official Company Presence',
        snippet: 'Knowledge graph website: https://acme.example',
        url: 'https://acme.example',
      },
    ],
  })

  assert.equal(targets.officialDomain, 'acme.example')
  assert.equal(targets.applyDomain, 'jobs-acme.example')
  assert.equal(targets.recruiterDomain, 'acme-careers.example')
  assert.deepEqual(Array.from(targets.contactDomains).sort(), ['acme-careers.example', 'acme.example', 'jobs-acme.example'].sort())
})

test('evidence broker runs SerpApi plus RDAP and DNS when best evidence is available', async () => {
  const calls = []
  const { runEvidenceBroker } = await loadEvidenceBrokerModule({
    env: { SERPAPI_API_KEY: 'serp_test' },
    serpapi: {
      runSmartSerpApiInvestigation: async () => {
        calls.push('serpapi')
        return [{
          source: 'SerpApi Google Search',
          type: 'Official Company Presence',
          snippet: 'Official company website found.',
          url: 'https://acme.example',
        }]
      },
    },
  })

  const result = await runEvidenceBroker({
    claims: sampleClaims,
    applicationUrl: 'https://jobs-acme.example/apply',
    text: 'Contact recruiter@acme-careers.example',
  }, {
    providers: {
      rdap: async (domain) => {
        calls.push(`rdap:${domain}`)
        return { status: 'ok', evidence: [{ source: 'RDAP', type: 'Domain Age', snippet: `${domain} registered on 2017-01-01.` }] }
      },
      dns: async (domain) => {
        calls.push(`dns:${domain}`)
        return { status: 'ok', evidence: [{ source: 'DNS over HTTPS', type: 'DNS Liveness', snippet: `${domain} has A and MX records.` }] }
      },
    },
  })

  assert.equal(calls[0], 'serpapi')
  assert.ok(calls.some((call) => call.startsWith('rdap:')))
  assert.ok(calls.some((call) => call.startsWith('dns:')))
  assert.ok(result.evidence.some((item) => item.type === 'Official Company Presence'))
  assert.ok(result.evidence.some((item) => item.type === 'Domain Age'))
  assert.ok(result.evidence.some((item) => item.type === 'DNS Liveness'))
  assert.equal(result.operations.evidenceProviders.serpapi.status, 'ok')
  assert.equal(result.operations.liveSearch.status, 'ok')
})

test('evidence broker degrades gracefully when SerpApi is unavailable', async () => {
  const calls = []
  const { runEvidenceBroker } = await loadEvidenceBrokerModule()

  const result = await runEvidenceBroker({
    claims: sampleClaims,
    applicationUrl: 'https://jobs-acme.example/apply',
    text: 'Contact recruiter@acme-careers.example',
  }, {
    providers: {
      rdap: async () => {
        calls.push('rdap')
        return { status: 'ok', evidence: [{ source: 'RDAP', type: 'Domain Age', snippet: 'Domain exists.' }] }
      },
      dns: async () => {
        calls.push('dns')
        return { status: 'ok', evidence: [{ source: 'DNS over HTTPS', type: 'DNS Liveness', snippet: 'DNS resolves.' }] }
      },
      threatIntel: async () => {
        calls.push('threatIntel')
        return { status: 'ok', evidence: [] }
      },
    },
  })

  assert.ok(calls.includes('rdap'))
  assert.ok(calls.includes('dns'))
  assert.equal(calls.at(-1), 'threatIntel')
  assert.equal(result.operations.evidenceProviders.serpapi.status, 'not-live')
  assert.equal(result.operations.liveSearch.status, 'degraded')
  assert.ok(result.evidence.some((item) => item.type === 'Domain Age'))
})

test('evidence broker falls through to DNS and certificates when RDAP is throttled', async () => {
  const { runEvidenceBroker } = await loadEvidenceBrokerModule()

  const result = await runEvidenceBroker({
    claims: sampleClaims,
    applicationUrl: 'https://jobs-acme.example/apply',
  }, {
    providers: {
      rdap: async () => ({ status: 'throttled', message: 'RDAP rate-limited.' }),
      dns: async () => ({ status: 'ok', evidence: [{ source: 'DNS over HTTPS', type: 'DNS Liveness', snippet: 'DNS resolves.' }] }),
      certificateTransparency: async () => ({
        status: 'ok',
        evidence: [{ source: 'crt.sh', type: 'Certificate Transparency', snippet: 'Certificate seen for jobs-acme.example.' }],
      }),
    },
  })

  assert.equal(result.operations.evidenceProviders.rdap.status, 'throttled')
  assert.equal(result.operations.evidenceProviders.dns.status, 'ok')
  assert.ok(result.evidence.some((item) => item.type === 'Certificate Transparency'))
})

test('evidence broker treats missing Safe Browsing as neutral but known-bad hits as risk', async () => {
  const { runEvidenceBroker } = await loadEvidenceBrokerModule()

  const neutral = await runEvidenceBroker({
    claims: sampleClaims,
    applicationUrl: 'https://jobs-acme.example/apply',
  }, {
    providers: {
      safeBrowsing: async () => ({ status: 'not-live', message: 'Safe Browsing is not configured.' }),
      threatIntel: async () => ({ status: 'ok', evidence: [] }),
    },
  })
  assert.equal(neutral.operations.evidenceProviders.safeBrowsing.status, 'not-live')
  assert.equal(neutral.evidence.some((item) => item.type === 'Known Phishing Check'), false)

  const knownBad = await runEvidenceBroker({
    claims: sampleClaims,
    applicationUrl: 'https://jobs-acme.example/apply',
  }, {
    providers: {
      safeBrowsing: async () => ({
        status: 'ok',
        evidence: [{
          source: 'Google Safe Browsing',
          type: 'Known Phishing Check',
          snippet: 'Risk signal: URL matched known phishing or social engineering threat list.',
          url: 'https://jobs-acme.example/apply',
          trustLevel: 'risk',
        }],
      }),
    },
  })

  assert.ok(knownBad.evidence.some((item) => item.type === 'Known Phishing Check' && item.trustLevel === 'risk'))
})

test('audit routes route live evidence through the broker', async () => {
  const uiRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const apiRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')

  for (const source of [uiRoute, apiRoute]) {
    assert.match(source, /runEvidenceBroker/)
    assert.match(source, /evidenceProviders/)
  }
})

test('audit signal scoring understands domain and threat-intel evidence', async () => {
  const { buildAuditSignals } = await import('../lib/audit-signals.mjs')
  const claims = {
    company: 'Acme Careers',
    role: 'Frontend Developer',
    salary: 'PHP 80,000/week',
    location: 'Remote',
    contactMethod: 'Email',
    applicationPath: 'Provided job URL',
  }

  const signals = buildAuditSignals(claims, [], [], [
    {
      source: 'RDAP domain registry',
      type: 'Domain Age',
      snippet: 'Risk signal: jobs-acme.example appears newly registered | registered 2026-05-01',
      sourceType: 'domain',
      trustLevel: 'risk',
    },
    {
      source: 'HireProof domain broker',
      type: 'Recruiter Domain Check',
      snippet: 'Risk signal: recruiter email domain acme-careers.example does not match official company root acme.example.',
      sourceType: 'domain',
      trustLevel: 'risk',
    },
    {
      source: 'Google Safe Browsing',
      type: 'Known Phishing Check',
      snippet: 'Risk signal: URL matched known SOCIAL_ENGINEERING threat list.',
      sourceType: 'threat-intel',
      trustLevel: 'risk',
    },
    {
      source: 'HireProof domain broker',
      type: 'Domain Mismatch',
      snippet: 'Trust signal: submitted apply domain acme.example matches the official company root acme.example.',
      sourceType: 'domain',
      trustLevel: 'medium',
    },
  ])

  const ids = signals.map((signal) => signal.id)
  assert.ok(ids.includes('domain.newly_registered'))
  assert.ok(ids.includes('domain.recruiter_mismatch'))
  assert.ok(ids.includes('threat.known_bad_url'))
  assert.ok(ids.includes('domain.apply_official'))
})
