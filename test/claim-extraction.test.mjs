import test from 'node:test'
import assert from 'node:assert/strict'
import { recoverObviousClaims } from '../lib/claim-extraction.mjs'
import {
  buildEnrichmentEvidence,
  buildEnrichmentRedFlags,
  enrichAuditRequestInput,
  enrichJobUrlInput,
} from '../lib/job-url-enrichment.mjs'

const scamInput = {
  text: 'Remote frontend intern at Apex Hiring. PHP 80,000/week. No interview required. Apply by Telegram only.',
  location: 'Philippines',
}

test('recoverObviousClaims fills scam-critical fields missed by AI extraction', () => {
  const claims = recoverObviousClaims(scamInput, {
    company: 'Unknown / Not Verifiable',
    role: 'Unspecified role',
    salary: 'Not specified',
    location: 'Philippines',
    contactMethod: 'Not specified',
    applicationPath: 'Not specified',
  })

  assert.equal(claims.company, 'Apex Hiring')
  assert.equal(claims.role, 'Frontend Intern')
  assert.equal(claims.salary, 'PHP 80,000/week')
  assert.equal(claims.location, 'Philippines')
  assert.equal(claims.contactMethod, 'Telegram')
  assert.equal(claims.applicationPath, 'No interview mentioned')
})

test('recoverObviousClaims preserves credible extracted values', () => {
  const claims = recoverObviousClaims(scamInput, {
    company: 'Known Company',
    role: 'Security Analyst',
    salary: 'PHP 90,000/month',
    location: 'Manila',
    contactMethod: 'Email',
    applicationPath: 'Official careers channel',
  })

  assert.equal(claims.company, 'Known Company')
  assert.equal(claims.role, 'Security Analyst')
  assert.equal(claims.salary, 'PHP 90,000/month')
  assert.equal(claims.location, 'Manila')
  assert.equal(claims.contactMethod, 'Email')
  assert.equal(claims.applicationPath, 'Official careers channel')
})

test('recoverObviousClaims stops explicit company extraction at the next field label', () => {
  const claims = recoverObviousClaims({
    text: 'Company: Canva. Role: Product Designer. Salary: $120,000/year. Location: Sydney. Apply through official careers website.',
    url: 'https://www.canva.com/careers/',
    location: 'Sydney, Australia',
  }, {
    company: 'Unknown / Not Verifiable',
    role: 'Product Designer',
    salary: '$120,000/year',
    location: 'Sydney, Australia',
    contactMethod: 'Not specified',
    applicationPath: 'Official careers channel',
  })

  assert.equal(claims.company, 'Canva')
  assert.equal(claims.role, 'Product Designer')
})

test('recoverObviousClaims extracts recruiter identity fields from pasted posts', () => {
  const claims = recoverObviousClaims({
    text: 'Company: NovaForge AI. Role: Remote Product Engineer. Contact: Maya Santos. Email maya@novaforge.ai or view https://linkedin.com/in/maya-santos. Phone +63 917 123 4567.',
    location: 'Remote',
  }, {
    company: 'NovaForge AI',
    role: 'Remote Product Engineer',
    salary: 'Not specified',
    location: 'Remote',
    contactMethod: 'Not specified',
    applicationPath: 'Not specified',
  })

  assert.equal(claims.recruiterName, 'Maya Santos')
  assert.equal(claims.recruiterEmail, 'maya@novaforge.ai')
  assert.equal(claims.recruiterProfile, 'https://linkedin.com/in/maya-santos')
  assert.equal(claims.recruiterPhone, '+63 917 123 4567')
})

test('recoverObviousClaims strips LinkedIn UI text from company and role claims', () => {
  const claims = recoverObviousClaims({
    text: [
      'Resolved LinkedIn public job page content:',
      'Online Data Analyst',
      'TELUS Digital AI Data Solutions',
      'Application Process Easy Apply on LinkedIn',
    ].join('\n'),
    url: 'https://www.linkedin.com/jobs/view/4409014711/',
  }, {
    company: 'TELUS Digital AI Data Solutions By 2x See Who You Know',
    role: 'At TELUS Digital',
    salary: 'Not specified',
    location: 'Not specified',
    contactMethod: 'LinkedIn',
    applicationPath: 'Direct message',
  })

  assert.equal(claims.company, 'TELUS Digital AI Data Solutions')
  assert.equal(claims.role, 'Online Data Analyst')
})

test('recoverObviousClaims upgrades LinkedIn apply paths when resolved page evidence is stronger than pasted chat text', () => {
  const claims = recoverObviousClaims({
    text: [
      'Resolved LinkedIn public job page content:',
      'Online Data Analyst',
      'TELUS Digital AI Data Solutions',
      'Application Process Easy Apply on LinkedIn',
      'Applicants continue through LinkedIn and normal screening steps.',
    ].join('\n'),
    url: 'https://www.linkedin.com/jobs/view/4409014711/',
  }, {
    company: 'TELUS Digital AI Data Solutions 35,000 followers Promoted',
    role: 'At TELUS Digital',
    salary: 'Not specified',
    location: 'Remote',
    contactMethod: 'LinkedIn',
    applicationPath: 'Direct message',
  })

  assert.equal(claims.company, 'TELUS Digital AI Data Solutions')
  assert.equal(claims.role, 'Online Data Analyst')
  assert.equal(claims.applicationPath, 'LinkedIn Easy Apply')
})

test('recoverObviousClaims strips common job-board chrome from company names', () => {
  const claims = recoverObviousClaims({
    text: 'Senior Data Analyst at Acme Analytics. Apply through official careers.',
    url: 'https://boards.greenhouse.io/acme/jobs/123',
  }, {
    company: 'Acme Analytics 12,341 followers Actively hiring',
    role: 'Senior Data Analyst',
    salary: 'Not specified',
    location: 'Remote',
    contactMethod: 'Email',
    applicationPath: 'Not specified',
  })

  assert.equal(claims.company, 'Acme Analytics')
  assert.equal(claims.applicationPath, 'Greenhouse job page')
})

test('enrichJobUrlInput expands LinkedIn collection URLs through the guest job endpoint', async () => {
  let requestedUrl = ''
  const enrichment = await enrichJobUrlInput(
    'https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4406287170',
    async (url) => {
      requestedUrl = String(url)
      return new Response(`
        <html>
          <body>
            <h1>Frontend Developer | $70/hr Remote</h1>
            <a>Crossing Hurdles</a>
            <section>Compensation: $20 - $70/hour</section>
            <section>Application Process Easy Apply on LinkedIn</section>
            <section>Remote contract role in the Philippines for frontend development using JavaScript, TypeScript, and modern UI frameworks.</section>
            <section>Responsibilities include building interfaces, collaborating with designers, and participating in resume evaluation and interviews.</section>
          </body>
        </html>
      `)
    },
  )

  assert.equal(requestedUrl, 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4406287170')
  assert.equal(enrichment.status, 'enriched')
  assert.equal(enrichment.source, 'linkedin-guest-job')
  assert.match(enrichment.enrichedText, /Crossing Hurdles/)
  assert.match(enrichment.enrichedText, /Frontend Developer/)
  assert.match(enrichment.enrichedText, /Application Process Easy Apply/)
})

test('enrichJobUrlInput fails safe for unsupported URL-only inputs', async () => {
  const enrichment = await enrichJobUrlInput('http://localhost/job/123')

  assert.equal(enrichment.status, 'unsupported-url')
  assert.equal(enrichment.source, 'none')
  assert.match(enrichment.reason || '', /supported public job pages/)
})

test('enrichJobUrlInput extracts public ATS and generic job page content', async () => {
  const enrichment = await enrichJobUrlInput(
    'https://boards.greenhouse.io/acme/jobs/123',
    async () => new Response(`
      <html>
        <head>
          <meta name="description" content="Frontend Engineer at Acme Remote contract role" />
          <script type="application/ld+json">
            {"@type":"JobPosting","title":"Frontend Engineer","hiringOrganization":{"name":"Acme"},"jobLocation":"Remote"}
          </script>
        </head>
        <body>
          <h1>Frontend Engineer</h1>
          <p>Acme is hiring a remote frontend engineer. Compensation is $50 - $70 per hour.</p>
          <p>Apply through Greenhouse after a recruiter screen and technical interview.</p>
        </body>
      </html>
    `),
  )

  assert.equal(enrichment.status, 'enriched')
  assert.equal(enrichment.source, 'greenhouse')
  assert.match(enrichment.enrichedText, /Frontend Engineer/)
  assert.match(enrichment.enrichedText, /Greenhouse/)
  assert.match(enrichment.enrichedText, /Compensation is \$50 - \$70 per hour/)
})

test('enrichAuditRequestInput prefers resolved job page evidence when pasted text conflicts with URL content', async () => {
  const { request, enrichment } = await enrichAuditRequestInput(
    {
      text: 'Microsoft Corporation is hiring a Senior Software Engineer for $250,000 per year through LinkedIn Recruiter.',
      url: 'https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4406287170',
      mode: 'live',
    },
    async () => new Response(`
      <html>
        <body>
          <h1>Frontend Developer | $70/hr Remote</h1>
          <a>Crossing Hurdles</a>
          <section>Compensation: $20 - $70/hour</section>
          <section>Application Process Easy Apply on LinkedIn with resume evaluation and interview stage.</section>
          <section>Remote contract role in the Philippines for frontend development using JavaScript and TypeScript.</section>
          <section>Applicants work with product teams, designers, and backend engineers across a normal contract process.</section>
        </body>
      </html>
    `),
  )

  assert.equal(enrichment.status, 'enriched')
  assert.equal(enrichment.sourcePriority, 'resolved-url')
  assert.match(request.text, /Resolved LinkedIn public job page content/)
  assert.match(request.text, /Crossing Hurdles/)
  assert.match(request.text, /Microsoft Corporation/)
  assert.ok(enrichment.conflicts.some((conflict) => conflict.field === 'company'))

  const evidence = buildEnrichmentEvidence(enrichment)
  const redFlags = buildEnrichmentRedFlags(enrichment)
  assert.ok(evidence.some((item) => item.type === 'Input Conflict'))
  assert.ok(redFlags.some((flag) => flag.includes('company')))
})
