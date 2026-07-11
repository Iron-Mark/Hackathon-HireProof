import test from 'node:test'
import assert from 'node:assert/strict'
import { recoverObviousClaims, extractClaimsFromText, isOfficialCareersChannel } from '../lib/claim-extraction.mjs'
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

test('recoverObviousClaims does not trust job-board lookalike hosts as application paths', () => {
  const claims = recoverObviousClaims({
    text: 'Senior Data Analyst at Acme Analytics. Easy Apply available.',
    url: 'https://linkedin.com.attacker.test/jobs/view/123',
  }, {
    company: 'Acme Analytics',
    role: 'Senior Data Analyst',
    salary: 'Not specified',
    location: 'Remote',
    contactMethod: 'Email',
    applicationPath: 'Not specified',
  })

  assert.equal(claims.applicationPath, 'Provided job URL')
})

test('recoverObviousClaims parses LinkedIn QA job blocks without treating job ids as recruiter phones', () => {
  const claims = recoverObviousClaims({
    text: [
      'Resolved LinkedIn public job page content:',
      'Quality Assurance Automation Engineer',
      'Dexian Asia Pacific',
      'Manila, National Capital Region, Philippines · 1 week ago · 33 applicants',
      'Promoted by hirer · Actively reviewing applicants',
      'On-site',
      'Contract',
      'Easy Apply',
      'People you can reach out to',
      'Meet the hiring team',
      'Prerana Jogur',
      'Malaysia and Singapore Markets',
      'Job poster',
      'About the company',
      'Dexian Asia Pacific',
      '105,228 followers',
    ].join('\n'),
    url: 'https://www.linkedin.com/jobs/view/4405077596/',
  }, {
    company: 'Dexian Asia Pacific',
    role: 'Unspecified role',
    salary: 'Not specified',
    location: 'Not specified',
    contactMethod: 'LinkedIn',
    applicationPath: 'LinkedIn job page',
    recruiterPhone: '4405077596',
  })

  assert.equal(claims.company, 'Dexian Asia Pacific')
  assert.equal(claims.role, 'Quality Assurance Automation Engineer')
  assert.equal(claims.location, 'Manila, National Capital Region, Philippines')
  assert.equal(claims.applicationPath, 'LinkedIn Easy Apply')
  assert.equal(claims.recruiterName, 'Prerana Jogur')
  assert.equal(claims.recruiterPhone, undefined)
})

test('recoverObviousClaims detects QA and SDET role titles from unstructured text', () => {
  const qaClaims = recoverObviousClaims({
    text: 'We are hiring a QA Automation Engineer for a Manila hybrid contract role.',
    location: 'Philippines',
  }, {
    company: 'Unknown / Not Verifiable',
    role: 'Unspecified role',
    salary: 'Not specified',
    location: 'Philippines',
    contactMethod: 'Not specified',
    applicationPath: 'Not specified',
  })
  const sdetClaims = recoverObviousClaims({
    text: 'Looking for SDET II with Playwright experience. Location: Remote Philippines.',
    location: 'Remote Philippines',
  }, {
    company: 'Unknown / Not Verifiable',
    role: 'Unspecified role',
    salary: 'Not specified',
    location: 'Remote Philippines',
    contactMethod: 'Not specified',
    applicationPath: 'Not specified',
  })

  assert.equal(qaClaims.role, 'QA Automation Engineer')
  assert.equal(sdetClaims.role, 'SDET II')
})

test('recoverObviousClaims only extracts labeled recruiter phones', () => {
  const claims = recoverObviousClaims({
    text: 'LinkedIn job id 4405077596 has 33 applicants. Contact number: +63 917 123 4567.',
    location: 'Philippines',
  }, {
    company: 'Unknown / Not Verifiable',
    role: 'Unspecified role',
    salary: 'Not specified',
    location: 'Philippines',
    contactMethod: 'LinkedIn',
    applicationPath: 'LinkedIn job page',
  })

  assert.equal(claims.recruiterPhone, '+63 917 123 4567')
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

test('enrichJobUrlInput blocks private IPv6 and IPv4-mapped URL literals before fetching', async () => {
  for (const inputUrl of [
    'http://[::1]/private-admin-metadata',
    'http://[fd00::1]/private-admin-metadata',
    'http://[fe80::1]/private-admin-metadata',
    'http://[::ffff:127.0.0.1]/private-admin-metadata',
  ]) {
    let fetched = false
    const enrichment = await enrichJobUrlInput(inputUrl, async () => {
      fetched = true
      return new Response('should not fetch')
    })

    assert.equal(enrichment.status, 'unsupported-url')
    assert.equal(enrichment.source, 'none')
    assert.equal(fetched, false)
  }
})

test('enrichJobUrlInput blocks redirects to private URL targets', async () => {
  const enrichment = await enrichJobUrlInput(
    'https://boards.greenhouse.io/acme/jobs/redirect',
    async () => new Response('', {
      status: 302,
      headers: { location: 'http://127.0.0.1/private-admin-metadata' },
    }),
  )

  assert.equal(enrichment.status, 'failed')
  assert.match(enrichment.reason || '', /Only public job page URLs/)
})

test('enrichJobUrlInput rejects oversized job page responses before enrichment', async () => {
  let cancelled = false
  const enrichment = await enrichJobUrlInput(
    'https://boards.greenhouse.io/acme/jobs/large',
    async () => ({
      ok: true,
      status: 200,
      headers: { get: (name) => name.toLowerCase() === 'content-length' ? '300000' : null },
      body: {
        cancel: async () => {
          cancelled = true
        },
      },
      text: async () => 'x'.repeat(128),
    }),
  )

  assert.equal(enrichment.status, 'failed')
  assert.match(enrichment.reason || '', /too large/)
  assert.equal(cancelled, true)
})

test('enrichJobUrlInput rejects oversized non-streaming job page responses before slicing', async () => {
  const enrichment = await enrichJobUrlInput(
    'https://boards.greenhouse.io/acme/jobs/non-stream-large',
    async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      body: null,
      text: async () => 'x'.repeat(300000),
    }),
  )

  assert.equal(enrichment.status, 'failed')
  assert.match(enrichment.reason || '', /too large/)
})

test('enrichJobUrlInput rejects streaming job pages that continue after the byte cap', async () => {
  const encoder = new TextEncoder()
  const exactLimitChunk = encoder.encode('x'.repeat(256_000))
  const overflowChunk = encoder.encode('extra bytes beyond cap')
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(exactLimitChunk)
      controller.enqueue(overflowChunk)
      controller.close()
    },
  })

  const enrichment = await enrichJobUrlInput(
    'https://boards.greenhouse.io/acme/jobs/stream-overflow',
    async () => new Response(stream),
  )

  assert.equal(enrichment.status, 'failed')
  assert.match(enrichment.reason || '', /too large/)
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

// ---------------------------------------------------------------------------------------
// "Official careers channel" must reflect a real careers PAGE/PORTAL/SITE/URL — never a bare
// "careers@" email local-part or the standalone word "official". Matching those forged an
// unearned apply-path trust signal (a green "recognizable official channel" line) and a score
// discount for any post that merely contained the word.
// ---------------------------------------------------------------------------------------

test('isOfficialCareersChannel accepts genuine careers-page/portal phrasing (incl. plurals)', () => {
  for (const legit of [
    'Apply on our official careers site.',
    'Submit your application through our careers page.',
    'Apply through official careers website.',
    'Apply on our Workday careers portal.',
    'our official company website',
    'Browse all our careers pages for open roles.',    // plural
    'Explore our regional careers sites.',             // plural
    'Our careers hub lists every current vacancy.',    // hub synonym
  ]) {
    assert.ok(isOfficialCareersChannel(legit), `expected official careers channel: "${legit}"`)
  }
})

// Adversarial breakers surfaced by a red-team pass and adjudicated through the real engine. This
// function judges PHRASING, never URL/email parsing — apply URLs go through the `url` field — so
// none of these forge an official-apply-path trust signal.
test('isOfficialCareersChannel rejects careers@ emails, careers-shaped URLs, and "official" collisions', () => {
  for (const notOfficial of [
    // careers@ contact emails (plain and dotted local parts)
    'Our recruiter will contact you from careers@vercel-hr-team.com.',
    'Email your resume to careers.acme.hr@gmail.com - no phone calls.',
    'Send your CV to careers.hr.team@acme-recruit.com',
    'Send your resume to jobs@quickhire-jobs.co and DM us.',
    // careers-shaped URLs / filenames / slugs (handled by the url field, not prose parsing)
    'Full details are in the attached careers.2024.pdf',
    'Reach our recruiter on Telegram: t.me/careers',
    'Submit your application at bit.ly/careers',
    'Register now at acme.com/careers-fair',
    // "careers channel" lure (Telegram/WhatsApp) + "official + unrelated noun" collisions
    'Join our careers channel on Telegram to get hired today.',
    'reach me on Line official',
    'Join our official Telegram account to onboard.',
    'This is an official offer, act now.',
    'Congratulations - your official career offer is attached; pay the $99 kit fee.',
    // newline must not glue a heading "careers" to a following "Page"/"Section" line
    'Explore rewarding careers\nPage 1 of 3',
    'See our current openings in careers\nSection 2: Benefits',
  ]) {
    assert.ok(!isOfficialCareersChannel(notOfficial), `must NOT be an official careers channel: "${notOfficial}"`)
  }
})

test('extractClaimsFromText does not forge an official apply path from a careers@ scam email', () => {
  // The exact exploit: a scam names a careers@ address so the post contains the word "careers".
  const scam = extractClaimsFromText({
    text: 'Join our team at Meridian Global. To confirm your position, a one-time $150 onboarding processing fee applies once you accept the offer. Email your resume to careers@meridian-global-hr.com.',
  })
  assert.notEqual(scam.applicationPath, 'Official careers channel')
  assert.equal(scam.contactMethod, 'Email') // the honest claim: it is an email contact

  // A genuinely official careers-page post still resolves to the official channel (no URL supplied,
  // so extraction must rely on the page/portal phrasing, not a short-circuiting job URL).
  const legit = extractClaimsFromText({
    text: 'Software Engineer at Acme. Apply through our official careers page. Interviews are conducted over two rounds.',
  })
  assert.equal(legit.applicationPath, 'Official careers channel')
})
