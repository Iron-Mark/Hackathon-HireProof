/**
 * Labeled scoring dataset for HireProof's local scoring engine.
 *
 * Each case: { id, archetype, split, expected, rationale, provenance, input }
 *   - expected  : 'safe' | 'caution' | 'high-risk' (honest human label, NOT current engine output)
 *   - split     : 'train' | 'validation' | 'test' — assigned at the ARCHETYPE level so that
 *                 surface variants of the same scenario never leak across splits.
 *   - input     : arguments for buildAuditReportV2 (claims + evidence + optional flags).
 *
 * Labeling policy:
 *   - safe      : evidence supports a conventional hiring path; no material scam signal.
 *   - caution   : needs verification — sparse/conflicting evidence, disclosed contractor
 *                 variability, single moderate risk signal, or unverifiable identity.
 *   - high-risk : strong scam pattern (off-platform pivot + no interview, impersonation,
 *                 apply-domain mismatch, threat-intel hit, implausible pay for level).
 *   - Genuinely ambiguous scenarios are labeled 'caution' and note the ambiguity.
 *
 * Amount sanity notes used for labels (PH engineering mid ≈ PHP 90k/month benchmark;
 * remote engineering ≈ $8.5k/month): weekly quotes are anomalous for salaried roles;
 * ≥2.5x the comparable band is treated as implausible for the level.
 */

export const FIXED_NOW = Date.parse('2026-07-01T00:00:00.000Z')

// ---------------------------------------------------------------------------
// Evidence builders — mirror the snippet/type grammar the engine classifies on
// (see lib/audit-signals.mjs sourceTier and lib/intelligence-v2.ts classifiers).
// ---------------------------------------------------------------------------

const EV = {
  official: (company, domain) => ({
    type: 'Official Company Presence',
    source: 'SerpApi Google Search',
    url: `https://${domain}/careers`,
    snippet: `Trust: official | ${company} official website and careers footprint matched.`,
  }),
  jobBoard: (company, role, board = 'LinkedIn') => ({
    type: 'Job Post Source',
    source: `${board} public job page`,
    snippet: `Trust: reputable-job-board | ${role} at ${company} | Easy Apply | Standard interview process listed.`,
  }),
  comparable: (company, role, salary, url = 'https://www.linkedin.com/jobs/view/12345') => ({
    type: 'Comparable Jobs',
    source: 'LinkedIn',
    url,
    snippet: `Trust: reputable-job-board | ${role} at ${company} | Salary: ${salary} | Apply: ${url}`,
  }),
  verifiedLocal: (company, address) => ({
    type: 'Verified Local Presence',
    source: 'SerpApi Google Maps',
    snippet: `Trust: verified-local | ${company} | Address: ${address} | Phone listed | Rating: 4.3 from 87 reviews.`,
  }),
  companyCheck: (company, note = 'Public web footprint found.') => ({
    type: 'Company Check',
    source: 'Public web search',
    snippet: `${company}: ${note}`,
  }),
  reputationClear: (company, date = 'Date: June 5, 2026') => ({
    type: 'Reputation',
    source: 'SerpApi Google News',
    snippet: `${company} announces product launch and hiring expansion. ${date}`,
  }),
  reputationRisk: (company) => ({
    type: 'Reputation',
    source: 'SerpApi Google News',
    snippet: `Risk signal: recent scam and impersonation warning reports mention ${company} recruitment messages.`,
  }),
  applyMismatch: (submittedDomain, officialDomain) => ({
    type: 'Apply Path Mismatch',
    source: 'Evidence broker domain check',
    url: `https://${submittedDomain}`,
    snippet: `Risk signal: submitted apply domain ${submittedDomain} does not match official company domain ${officialDomain}.`,
  }),
  inputConflict: (detail) => ({
    type: 'Input Conflict',
    source: 'Resolved public job page',
    snippet: `Submitted text conflicts with the resolved public job page. ${detail}`,
  }),
  threatIntel: (url) => ({
    type: 'Known Threat Check',
    source: 'URLhaus threat intelligence',
    sourceType: 'threat intel',
    trustLevel: 'risk',
    url,
    snippet: 'Risk signal: submitted URL matched known phishing and social-engineering intelligence.',
  }),
  newDomain: (domain) => ({
    type: 'Domain Age',
    source: 'RDAP registry lookup',
    sourceType: 'domain',
    trustLevel: 'risk',
    snippet: `Risk signal: apply domain ${domain} appears newly registered (21 days old).`,
  }),
  establishedDomain: (domain) => ({
    type: 'Domain Age',
    source: 'RDAP registry lookup',
    sourceType: 'domain',
    trustLevel: 'medium',
    snippet: `Domain ${domain} registered 2014; long-standing registration on record.`,
  }),
  recruiterDomainRisk: (domain, officialDomain) => ({
    type: 'Recruiter Domain Check',
    source: 'Evidence broker domain check',
    sourceType: 'domain',
    trustLevel: 'risk',
    snippet: `Risk signal: recruiter contact domain ${domain} does not match official company domain ${officialDomain}.`,
  }),
  recruiterFreeMail: (email) => ({
    type: 'Recruiter Domain Check',
    source: 'Evidence broker domain check',
    snippet: `Risk signal: recruiter uses a free-mail address ${email} instead of a company-controlled domain.`,
  }),
  recruiterDomainMatch: (domain) => ({
    type: 'Recruiter Domain Check',
    source: 'Evidence broker domain check',
    snippet: `Trust signal: recruiter email domain matches official company root ${domain}.`,
  }),
  certRecent: (domain) => ({
    type: 'Certificate Transparency',
    source: 'crt.sh lookup',
    snippet: `Risk signal: very recent new certificate activity for ${domain}.`,
  }),
  registryActive: (company) => ({
    type: 'Company Registry',
    source: 'Company registry lookup',
    snippet: `Registry match: ${company} is an active registered company.`,
  }),
  weakDirectory: (company, role) => ({
    type: 'Job Post Source',
    source: 'Job directory mirror',
    snippet: `Mirrored/scraped directory listing for ${role} at ${company}.`,
  }),
  ocrGoogleVision: (text) => ({
    type: 'Screenshot OCR',
    source: 'Screenshot OCR: Google Vision',
    snippet: text,
  }),
  startupFootprint: (company) => ({
    type: 'Company Check',
    source: 'Public web search',
    url: `https://www.crunchbase.com/organization/${company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    snippet: `Trust: reputable | ${company} Crunchbase profile, GitHub organization, and LinkedIn company page found; seed-stage startup with named founders.`,
  }),
}

// ---------------------------------------------------------------------------
// Case + variant helpers
// ---------------------------------------------------------------------------

const VERDICTS = new Set(['safe', 'caution', 'high-risk'])
const SPLITS = new Set(['train', 'validation', 'test'])

function makeCase(definition) {
  const { id, archetype, split, expected, rationale, provenance, claims, evidence = [], redFlags = [], greenFlags = [], enrichmentRedFlags } = definition
  if (!id || !archetype) throw new Error(`dataset case missing id/archetype: ${JSON.stringify(definition).slice(0, 80)}`)
  if (!VERDICTS.has(expected)) throw new Error(`invalid expected verdict for ${id}: ${expected}`)
  if (!SPLITS.has(split)) throw new Error(`invalid split for ${id}: ${split}`)
  if (!rationale) throw new Error(`missing rationale for ${id}`)
  return {
    id,
    archetype,
    split,
    expected,
    rationale,
    provenance: provenance || 'synthetic',
    input: { extractedClaims: claims, evidence, redFlags, greenFlags, enrichmentRedFlags },
  }
}

/** Label-preserving surface variant: same archetype, same split, same expected verdict. */
function variant(base, { id, note, claims = {}, evidence, redFlags, greenFlags }) {
  return {
    ...base,
    id,
    rationale: `${base.rationale} [variant: ${note}]`,
    input: {
      ...base.input,
      extractedClaims: { ...base.input.extractedClaims, ...claims },
      evidence: evidence ?? base.input.evidence,
      redFlags: redFlags ?? base.input.redFlags,
      greenFlags: greenFlags ?? base.input.greenFlags,
    },
  }
}

const cases = []
function add(definition, variants = []) {
  const base = makeCase(definition)
  cases.push(base)
  for (const v of variants) cases.push(variant(base, v))
}

// ---------------------------------------------------------------------------
// SAFE archetypes
// ---------------------------------------------------------------------------

add({
  id: 'safe.bigtech.official.1',
  archetype: 'safe.bigtech.official',
  split: 'train',
  expected: 'safe',
  provenance: 'audit-calibration-cases.test.mjs (promoted LinkedIn listing)',
  rationale: 'Well-known company, official careers footprint matched, reputable-board apply path, market-rate pay.',
  claims: { company: 'Canva', role: 'Frontend Engineer', salary: '$60 - $85/hour', location: 'Remote', contactMethod: 'LinkedIn', applicationPath: 'LinkedIn Easy Apply' },
  evidence: [EV.jobBoard('Canva', 'Frontend Engineer'), EV.official('Canva', 'canva.com'), EV.comparable('Canva', 'Frontend Engineer', '$70/hour')],
}, [
  { id: 'safe.bigtech.official.2', note: 'different company/role/currency', claims: { company: 'Atlassian', role: 'Backend Engineer', salary: 'AUD 160,000 per year', location: 'Sydney / Remote AU' }, evidence: [EV.jobBoard('Atlassian', 'Backend Engineer'), EV.official('Atlassian', 'atlassian.com'), EV.comparable('Atlassian', 'Backend Engineer', 'AUD 155,000 per year')] },
  { id: 'safe.bigtech.official.3', note: 'PH market wording', claims: { company: 'Canva', role: 'Product Designer', salary: 'PHP 120,000 per month', location: 'Manila (Hybrid)' }, evidence: [EV.jobBoard('Canva', 'Product Designer'), EV.official('Canva', 'canva.com'), EV.comparable('Canva', 'Product Designer', 'PHP 110,000 per month')] },
])

add({
  id: 'safe.easyapply.board.1',
  archetype: 'safe.easyapply.board',
  split: 'train',
  expected: 'safe',
  rationale: 'Reputable job board listing + official company presence + specific location; standard interview implied.',
  claims: { company: 'Shopline Commerce', role: 'Software Engineer', salary: '$45/hour', location: 'Remote United States', contactMethod: 'LinkedIn', applicationPath: 'LinkedIn Easy Apply' },
  evidence: [EV.jobBoard('Shopline Commerce', 'Software Engineer'), EV.official('Shopline Commerce', 'shopline-commerce.com'), EV.reputationClear('Shopline Commerce')],
}, [
  { id: 'safe.easyapply.board.2', note: 'Indeed instead of LinkedIn', claims: { company: 'Brightlane Logistics', role: 'Operations Analyst', salary: '$38/hour', location: 'Austin, Texas' }, evidence: [EV.jobBoard('Brightlane Logistics', 'Operations Analyst', 'Indeed'), EV.official('Brightlane Logistics', 'brightlanelogistics.com'), EV.reputationClear('Brightlane Logistics')] },
  { id: 'safe.easyapply.board.3', note: 'JobStreet PH', claims: { company: 'Nimbus Outsourcing', role: 'Customer Support Representative', salary: 'PHP 28,000 per month', location: 'Cebu City', contactMethod: 'JobStreet', applicationPath: 'JobStreet apply' }, evidence: [EV.jobBoard('Nimbus Outsourcing', 'Customer Support Representative', 'JobStreet'), EV.official('Nimbus Outsourcing', 'nimbusoutsourcing.com')] },
])

add({
  id: 'safe.local.verified.1',
  archetype: 'safe.local.verified',
  split: 'train',
  expected: 'safe',
  rationale: 'Local business with verified Maps presence, official site, market-rate monthly salary, email contact.',
  claims: { company: 'Mendoza Dental Group', role: 'Front Desk Assistant', salary: 'PHP 22,000 per month', location: 'Makati, Metro Manila', contactMethod: 'Email', applicationPath: 'Official careers page' },
  evidence: [EV.official('Mendoza Dental Group', 'mendozadental.ph'), EV.verifiedLocal('Mendoza Dental Group', 'Makati, Metro Manila'), EV.registryActive('Mendoza Dental Group')],
}, [
  { id: 'safe.local.verified.2', note: 'different city + role', claims: { company: 'Harbor Point Cafe', role: 'Shift Supervisor', salary: 'PHP 19,500 per month', location: 'Davao City' }, evidence: [EV.official('Harbor Point Cafe', 'harborpointcafe.ph'), EV.verifiedLocal('Harbor Point Cafe', 'Davao City')] },
])

add({
  id: 'safe.ats.greenhouse.1',
  archetype: 'safe.ats.greenhouse',
  split: 'train',
  expected: 'safe',
  rationale: 'Trusted ATS (Greenhouse) apply path + official domain match + comparables; classic legitimate flow.',
  claims: { company: 'Lumen Analytics', role: 'Data Engineer', salary: '$140,000 per year', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'https://boards.greenhouse.io/lumenanalytics/jobs/512' },
  evidence: [EV.official('Lumen Analytics', 'lumenanalytics.com'), EV.jobBoard('Lumen Analytics', 'Data Engineer', 'Greenhouse'), EV.comparable('Lumen Analytics', 'Data Engineer', '$135,000 per year')],
}, [
  { id: 'safe.ats.greenhouse.2', note: 'Lever ATS', claims: { company: 'Northwind Robotics', role: 'Embedded Engineer', salary: '$150,000 per year', applicationPath: 'https://jobs.lever.co/northwindrobotics/8842' }, evidence: [EV.official('Northwind Robotics', 'northwindrobotics.com'), EV.jobBoard('Northwind Robotics', 'Embedded Engineer', 'Lever'), EV.comparable('Northwind Robotics', 'Embedded Engineer', '$145,000 per year')] },
])

add({
  id: 'safe.startup.remote.1',
  archetype: 'safe.startup.remote',
  split: 'train',
  expected: 'safe',
  provenance: 'intelligence-v2 false-positive control (startup_remote profile mode)',
  rationale: 'Remote seed-stage startup with consistent digital footprint (Crunchbase/GitHub/LinkedIn) and official apply; missing local office must not flag it.',
  claims: { company: 'Driftkit', role: 'Founding Frontend Engineer', salary: '$130,000 per year plus equity', location: 'Remote (Global)', contactMethod: 'Email', applicationPath: 'Official careers page at driftkit.dev' },
  evidence: [EV.official('Driftkit', 'driftkit.dev'), EV.startupFootprint('Driftkit'), EV.jobBoard('Driftkit', 'Founding Frontend Engineer', 'Wellfound')],
  redFlags: ['No local business presence found for the company'],
}, [
  { id: 'safe.startup.remote.2', note: 'YC-branded startup', claims: { company: 'Parcelbeam (YC S25)', role: 'Full Stack Engineer', salary: '$140,000 per year', applicationPath: 'Official careers page at parcelbeam.com' }, evidence: [EV.official('Parcelbeam', 'parcelbeam.com'), EV.startupFootprint('Parcelbeam'), EV.jobBoard('Parcelbeam', 'Full Stack Engineer', 'Wellfound')], redFlags: ['No local business presence found for the company'] },
])

add({
  id: 'safe.gov.registry.1',
  archetype: 'safe.gov.registry',
  split: 'validation',
  expected: 'safe',
  rationale: 'Enterprise with active registry match, official presence, verified local office, annual salary; nothing anomalous.',
  claims: { company: 'Meridian Power Corporation', role: 'Civil Engineer', salary: 'PHP 55,000 per month', location: 'Quezon City', contactMethod: 'Email', applicationPath: 'Official careers page' },
  evidence: [EV.official('Meridian Power Corporation', 'meridianpower.ph'), EV.registryActive('Meridian Power Corporation'), EV.verifiedLocal('Meridian Power Corporation', 'Quezon City')],
}, [
  { id: 'safe.gov.registry.2', note: 'different sector', claims: { company: 'Cordillera Water Services', role: 'Accountant', salary: 'PHP 42,000 per month', location: 'Baguio City' }, evidence: [EV.official('Cordillera Water Services', 'cordillerawater.ph'), EV.registryActive('Cordillera Water Services'), EV.verifiedLocal('Cordillera Water Services', 'Baguio City')] },
])

add({
  id: 'safe.hourly.recruiter-match.1',
  archetype: 'safe.hourly.recruiter-match',
  split: 'train',
  expected: 'safe',
  rationale: 'Hourly market-rate role where recruiter email domain matches the official company root.',
  claims: { company: 'Bluecrest Media', role: 'Video Editor', salary: '$28/hour', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'Official careers page', recruiterName: 'Dana Ellis', recruiterEmail: 'dana.ellis@bluecrestmedia.com' },
  evidence: [EV.official('Bluecrest Media', 'bluecrestmedia.com'), EV.recruiterDomainMatch('bluecrestmedia.com'), EV.comparable('Bluecrest Media', 'Video Editor', '$26/hour')],
}, [
  { id: 'safe.hourly.recruiter-match.2', note: 'different role and rate', claims: { company: 'Bluecrest Media', role: 'Motion Designer', salary: '$34/hour', recruiterName: 'Sam Ortiz', recruiterEmail: 'sam.ortiz@bluecrestmedia.com' }, evidence: [EV.official('Bluecrest Media', 'bluecrestmedia.com'), EV.recruiterDomainMatch('bluecrestmedia.com'), EV.comparable('Bluecrest Media', 'Motion Designer', '$36/hour')] },
])

add({
  id: 'safe.remote.workday.1',
  archetype: 'safe.remote.workday',
  split: 'validation',
  expected: 'safe',
  rationale: 'Established remote employer hiring through Workday with recruiter-domain match; global wording is not a scam signal.',
  claims: { company: 'Helios Software', role: 'Site Reliability Engineer', salary: '$155,000 per year', location: 'Remote (Americas)', contactMethod: 'Email', applicationPath: 'https://helios.wd5.myworkdayjobs.com/careers/job/SRE-2231', recruiterEmail: 'talent@heliossoftware.com' },
  evidence: [EV.official('Helios Software', 'heliossoftware.com'), EV.jobBoard('Helios Software', 'Site Reliability Engineer', 'Workday'), EV.recruiterDomainMatch('heliossoftware.com'), EV.reputationClear('Helios Software')],
  redFlags: ['No local business presence found for the company'],
}, [
  { id: 'safe.remote.workday.2', note: 'EMEA wording', claims: { company: 'Helios Software', role: 'Platform Engineer', location: 'Remote (EMEA)', salary: 'EUR 95,000 per year' }, evidence: [EV.official('Helios Software', 'heliossoftware.com'), EV.jobBoard('Helios Software', 'Platform Engineer', 'Workday'), EV.recruiterDomainMatch('heliossoftware.com')], redFlags: ['No local business presence found for the company'] },
])

add({
  id: 'safe.agency.strong.1',
  archetype: 'safe.agency.strong',
  split: 'train',
  expected: 'safe',
  provenance: 'audit-calibration-cases.test.mjs (staffing agency)',
  rationale: 'Legitimate staffing agency with a public recruiting footprint hiring through a reputable board; agency structure alone is not risk.',
  claims: { company: 'Crossing Hurdles', role: 'Frontend Developer', salary: '$20 - $70/hour', location: 'Philippines Remote', contactMethod: 'LinkedIn', applicationPath: 'LinkedIn Easy Apply' },
  evidence: [EV.jobBoard('Crossing Hurdles', 'Frontend Developer'), EV.companyCheck('Crossing Hurdles', 'Public recruiting agency footprint found.'), EV.official('Crossing Hurdles', 'crossinghurdles.com')],
}, [
  { id: 'safe.agency.strong.2', note: 'US staffing brand', claims: { company: 'TalentBridge Recruiting', role: 'Backend Engineer', salary: '$45/hour', location: 'Remote United States', applicationPath: 'Provided job URL' }, evidence: [EV.jobBoard('TalentBridge Recruiting', 'Backend Engineer'), EV.companyCheck('TalentBridge Recruiting', 'Public recruiting-agency footprint found.'), EV.official('TalentBridge Recruiting', 'talentbridgerecruiting.com')] },
])

add({
  id: 'safe.design.official.1',
  archetype: 'safe.design.official',
  split: 'test',
  expected: 'safe',
  rationale: 'Design role on official careers page with comparables and clear reputation; conventional hiring path.',
  claims: { company: 'Fernwood Studio', role: 'Senior Product Designer', salary: '$120,000 per year', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'Official careers page at fernwood.studio' },
  evidence: [EV.official('Fernwood Studio', 'fernwood.studio'), EV.comparable('Fernwood Studio', 'Senior Product Designer', '$115,000 per year'), EV.reputationClear('Fernwood Studio')],
}, [
  { id: 'safe.design.official.2', note: 'UX role, CAD salary', claims: { company: 'Fernwood Studio', role: 'UX Researcher', salary: 'CAD 105,000 per year', location: 'Remote Canada' }, evidence: [EV.official('Fernwood Studio', 'fernwood.studio'), EV.comparable('Fernwood Studio', 'UX Researcher', 'CAD 100,000 per year'), EV.reputationClear('Fernwood Studio')] },
  { id: 'safe.design.official.3', note: 'brand designer, hourly', claims: { company: 'Fernwood Studio', role: 'Brand Designer', salary: '$55/hour', location: 'Remote' }, evidence: [EV.official('Fernwood Studio', 'fernwood.studio'), EV.comparable('Fernwood Studio', 'Brand Designer', '$52/hour'), EV.reputationClear('Fernwood Studio')] },
])

add({
  id: 'safe.fresh.board.1',
  archetype: 'safe.fresh.board',
  split: 'test',
  expected: 'safe',
  rationale: 'Reputable board listing with fresh dated evidence, official presence, and standard interview path.',
  claims: { company: 'Quartzline Fintech', role: 'QA Engineer', salary: '$95,000 per year', location: 'Chicago, Illinois (Hybrid)', contactMethod: 'LinkedIn', applicationPath: 'LinkedIn Easy Apply' },
  evidence: [EV.jobBoard('Quartzline Fintech', 'QA Engineer'), EV.official('Quartzline Fintech', 'quartzline.com'), EV.reputationClear('Quartzline Fintech', 'Date: June 20, 2026')],
}, [
  { id: 'safe.fresh.board.2', note: 'different role + city', claims: { company: 'Quartzline Fintech', role: 'Compliance Analyst', salary: '$85,000 per year', location: 'New York, New York' }, evidence: [EV.jobBoard('Quartzline Fintech', 'Compliance Analyst'), EV.official('Quartzline Fintech', 'quartzline.com'), EV.reputationClear('Quartzline Fintech', 'Date: June 12, 2026')] },
  { id: 'safe.fresh.board.3', note: 'engineering manager', claims: { company: 'Quartzline Fintech', role: 'Engineering Manager', salary: '$185,000 per year', location: 'Chicago, Illinois' }, evidence: [EV.jobBoard('Quartzline Fintech', 'Engineering Manager'), EV.official('Quartzline Fintech', 'quartzline.com'), EV.reputationClear('Quartzline Fintech', 'Date: June 25, 2026')] },
])

add({
  id: 'safe.bpo.local.1',
  archetype: 'safe.bpo.local',
  split: 'train',
  expected: 'safe',
  rationale: 'PH BPO with official presence, verified local office, JobStreet listing, and market-band salary.',
  claims: { company: 'Stellar Contact Solutions', role: 'Technical Support Representative', salary: 'PHP 26,000 per month', location: 'Taguig, Metro Manila', contactMethod: 'JobStreet', applicationPath: 'JobStreet apply' },
  evidence: [EV.official('Stellar Contact Solutions', 'stellarcontact.ph'), EV.verifiedLocal('Stellar Contact Solutions', 'Taguig, Metro Manila'), EV.jobBoard('Stellar Contact Solutions', 'Technical Support Representative', 'JobStreet')],
}, [
  { id: 'safe.bpo.local.2', note: 'night-shift wording', claims: { company: 'Stellar Contact Solutions', role: 'Customer Care Specialist (Night Shift)', salary: 'PHP 29,000 per month plus allowance' }, evidence: [EV.official('Stellar Contact Solutions', 'stellarcontact.ph'), EV.verifiedLocal('Stellar Contact Solutions', 'Taguig, Metro Manila'), EV.jobBoard('Stellar Contact Solutions', 'Customer Care Specialist', 'JobStreet')] },
])

add({
  id: 'safe.uk.annual.1',
  archetype: 'safe.uk.annual',
  split: 'test',
  expected: 'safe',
  rationale: 'UK employer with official presence, established domain registration, and standard annual salary.',
  claims: { company: 'Ashgrove Systems', role: 'DevOps Engineer', salary: 'GBP 78,000 per year', location: 'London (Hybrid)', contactMethod: 'Email', applicationPath: 'Official careers page at ashgrovesystems.co.uk' },
  evidence: [EV.official('Ashgrove Systems', 'ashgrovesystems.co.uk'), EV.establishedDomain('ashgrovesystems.co.uk'), EV.comparable('Ashgrove Systems', 'DevOps Engineer', 'GBP 75,000 per year')],
}, [
  { id: 'safe.uk.annual.2', note: 'Scotland location', claims: { company: 'Ashgrove Systems', role: 'Cloud Engineer', salary: 'GBP 70,000 per year', location: 'Edinburgh, Scotland' }, evidence: [EV.official('Ashgrove Systems', 'ashgrovesystems.co.uk'), EV.establishedDomain('ashgrovesystems.co.uk'), EV.comparable('Ashgrove Systems', 'Cloud Engineer', 'GBP 68,000 per year')] },
  { id: 'safe.uk.annual.3', note: 'security role', claims: { company: 'Ashgrove Systems', role: 'Security Engineer', salary: 'GBP 85,000 per year', location: 'London' }, evidence: [EV.official('Ashgrove Systems', 'ashgrovesystems.co.uk'), EV.establishedDomain('ashgrovesystems.co.uk'), EV.comparable('Ashgrove Systems', 'Security Engineer', 'GBP 82,000 per year')] },
])

// ---------------------------------------------------------------------------
// CAUTION archetypes
// ---------------------------------------------------------------------------

add({
  id: 'caution.rlhf.contractor.1',
  archetype: 'caution.rlhf.contractor',
  split: 'train',
  expected: 'caution',
  provenance: 'audit-calibration-cases.test.mjs (transparent RLHF contractor)',
  rationale: 'Transparent 1099 contractor with variable hours honestly disclosed — legitimate but must not read as stable employment.',
  claims: { company: 'Outlier AI', role: 'TypeScript Software Engineer for RLHF code review', salary: '$30 - $70/hour', location: 'Remote accepted countries only', contactMethod: 'Official platform application', applicationPath: 'Official platform application with identity verification' },
  evidence: [
    { type: 'Job Post Source', source: 'Official platform job page', snippet: 'Trust: reputable-job-board | TypeScript Software Engineer remote contractor role. 1099 independent contractor. Hours are project-dependent and not guaranteed week to week. Payment weekly via PayPal or Stripe.' },
    { type: 'Contract Transparency', source: 'Resolved job page', snippet: 'Accepted countries only. Not compatible with F-1 OPT, STEM OPT, W-2 employment, guaranteed hours, or employer sponsorship. Unable to provide offer letters or employment verification. Identity verification and valid contractor documentation required.' },
    { type: 'Role Details', source: 'Resolved job page', snippet: 'Help train large language models through RLHF. Compare and rank multiple code snippets, repair AI-generated code, explain code review decisions, and convert feedback into reward signals.' },
  ],
}, [
  { id: 'caution.rlhf.contractor.2', note: 'different platform brand', claims: { company: 'DataAnnotation Collective', role: 'Python Engineer for AI code review', salary: '$25 - $55/hour' }, evidence: [
    { type: 'Job Post Source', source: 'Official platform job page', snippet: 'Trust: reputable-job-board | Python Engineer contractor role. 1099 independent contractor. Hours are project-dependent and not guaranteed. Payment weekly via PayPal.' },
    { type: 'Contract Transparency', source: 'Resolved job page', snippet: 'Accepted countries only. Unable to provide offer letters or employment verification. Identity verification and valid documentation required.' },
    { type: 'Role Details', source: 'Resolved job page', snippet: 'Rank multiple code snippets and repair AI-generated code to build reward signals for large language models.' },
  ] },
])

add({
  id: 'caution.unknown.sparse.1',
  archetype: 'caution.unknown.sparse',
  split: 'train',
  expected: 'caution',
  rationale: 'Company not verifiable and almost no evidence — not proven scam, but cannot be trusted without verification.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Administrative Assistant', salary: 'PHP 25,000 per month', location: 'Remote Philippines', contactMethod: 'Email', applicationPath: 'Reply to post' },
  evidence: [],
}, [
  { id: 'caution.unknown.sparse.2', note: 'US variant', claims: { role: 'Data Entry Clerk', salary: '$22/hour', location: 'Remote United States' } },
])

add({
  id: 'caution.named.sparse.1',
  archetype: 'caution.named.sparse',
  split: 'validation',
  expected: 'caution',
  rationale: 'Named company but only a weak directory mirror as evidence; identity unconfirmed either way.',
  claims: { company: 'Veltrix Marketing', role: 'Social Media Manager', salary: 'PHP 35,000 per month', location: 'Remote Philippines', contactMethod: 'Email', applicationPath: 'Reply with resume' },
  evidence: [EV.weakDirectory('Veltrix Marketing', 'Social Media Manager')],
}, [
  { id: 'caution.named.sparse.2', note: 'different niche', claims: { company: 'Auric Trading House', role: 'Executive Assistant', salary: '$30/hour', location: 'Remote' }, evidence: [EV.weakDirectory('Auric Trading House', 'Executive Assistant')] },
])

add({
  id: 'caution.weekly.normal.1',
  archetype: 'caution.weekly.normal',
  split: 'train',
  expected: 'caution',
  rationale: 'Weekly pay quote for an otherwise normal-looking salaried role — unusual format that warrants verification, not proof of scam.',
  claims: { company: 'Harborline Support Co', role: 'Customer Support Agent', salary: '$700 per week', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'Company application form' },
  evidence: [EV.companyCheck('Harborline Support Co', 'Small public web footprint found.')],
}, [
  { id: 'caution.weekly.normal.2', note: 'PHP weekly amount within market', claims: { company: 'Harborline Support Co', role: 'Chat Support Agent', salary: 'PHP 6,500 per week', location: 'Remote Philippines' }, evidence: [EV.companyCheck('Harborline Support Co', 'Small public web footprint found.')] },
])

add({
  id: 'caution.agency.thin.1',
  archetype: 'caution.agency.thin',
  split: 'train',
  expected: 'caution',
  rationale: 'Recruiting agency for an unnamed client with a thin footprint — plausible but needs client and recruiter verification.',
  claims: { company: 'Pinnacle Staffing Partners', role: 'Backend Engineer for client fintech team', salary: '$50/hour', location: 'Remote United States', contactMethod: 'LinkedIn', applicationPath: 'Provided job URL' },
  evidence: [EV.weakDirectory('Pinnacle Staffing Partners', 'Backend Engineer')],
}, [
  { id: 'caution.agency.thin.2', note: 'different client sector', claims: { company: 'Pinnacle Staffing Partners', role: 'React Developer for client healthcare platform', salary: '$48/hour' }, evidence: [EV.weakDirectory('Pinnacle Staffing Partners', 'React Developer')] },
])

add({
  id: 'caution.freemail.official.1',
  archetype: 'caution.freemail.official',
  split: 'validation',
  expected: 'caution',
  provenance: 'intelligence-v2.test.mjs (free-mail identity remains risky with real footprint)',
  rationale: 'Recruiter uses free-mail while claiming a company with a real official footprint — classic impersonation vector; ambiguous without more signals, so caution.',
  claims: { company: 'Solara Digital', role: 'Marketing Coordinator', salary: '$55,000 per year', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'Email resume to recruiter', recruiterName: 'Chris Png', recruiterEmail: 'solara.digital.hiring@gmail.com' },
  evidence: [EV.official('Solara Digital', 'solaradigital.com'), EV.recruiterFreeMail('solara.digital.hiring@gmail.com')],
}, [
  { id: 'caution.freemail.official.2', note: 'yahoo variant', claims: { company: 'Solara Digital', role: 'Content Writer', salary: '$48,000 per year', recruiterEmail: 'solarahr2026@yahoo.com' }, evidence: [EV.official('Solara Digital', 'solaradigital.com'), EV.recruiterFreeMail('solarahr2026@yahoo.com')] },
])

add({
  id: 'caution.nointerview.official.1',
  archetype: 'caution.nointerview.official',
  split: 'test',
  expected: 'caution',
  rationale: 'Official company footprint exists but the flow claims no interview — unusual enough to require verification even for a real company.',
  claims: { company: 'Grovetech Retail', role: 'Inventory Associate', salary: 'PHP 21,000 per month', location: 'Pasig, Metro Manila', contactMethod: 'Email', applicationPath: 'No interview mentioned, direct onboarding' },
  evidence: [EV.official('Grovetech Retail', 'grovetechretail.ph'), EV.verifiedLocal('Grovetech Retail', 'Pasig, Metro Manila')],
}, [
  { id: 'caution.nointerview.official.2', note: 'US warehouse variant', claims: { company: 'Grovetech Retail', role: 'Warehouse Associate', salary: '$18/hour', location: 'Reno, Nevada' }, evidence: [EV.official('Grovetech Retail', 'grovetechretail.ph')] },
  { id: 'caution.nointerview.official.3', note: 'seasonal wording', claims: { company: 'Grovetech Retail', role: 'Seasonal Stock Clerk', salary: 'PHP 20,000 per month', applicationPath: 'No interview mentioned for seasonal hires' }, evidence: [EV.official('Grovetech Retail', 'grovetechretail.ph'), EV.verifiedLocal('Grovetech Retail', 'Pasig, Metro Manila')] },
])

add({
  id: 'caution.whatsapp.board.1',
  archetype: 'caution.whatsapp.board',
  split: 'train',
  expected: 'caution',
  rationale: 'Reputable-board listing but recruiter pushes to WhatsApp — single moderate off-platform signal against otherwise normal evidence.',
  claims: { company: 'Kite Commerce', role: 'Account Manager', salary: '$65,000 per year', location: 'Remote United States', contactMethod: 'WhatsApp after LinkedIn contact', applicationPath: 'LinkedIn Easy Apply' },
  evidence: [EV.jobBoard('Kite Commerce', 'Account Manager'), EV.official('Kite Commerce', 'kitecommerce.com')],
}, [
  { id: 'caution.whatsapp.board.2', note: 'PH variant', claims: { company: 'Kite Commerce', role: 'Sales Development Representative', salary: 'PHP 40,000 per month', location: 'Remote Philippines', contactMethod: 'WhatsApp' }, evidence: [EV.jobBoard('Kite Commerce', 'Sales Development Representative'), EV.official('Kite Commerce', 'kitecommerce.com')] },
])

add({
  id: 'caution.overmarket.official.1',
  archetype: 'caution.overmarket.official',
  split: 'test',
  expected: 'caution',
  rationale: 'Pay well above comparables but official apply path and footprint — verify before trusting; not a proven scam.',
  claims: { company: 'Vantage Metrics', role: 'Junior Data Analyst', salary: 'PHP 220,000 per month', location: 'Remote Philippines', contactMethod: 'Email', applicationPath: 'Official careers page at vantagemetrics.com' },
  evidence: [EV.official('Vantage Metrics', 'vantagemetrics.com'), EV.comparable('Vantage Metrics', 'Junior Data Analyst', 'PHP 45,000 per month')],
}, [
  { id: 'caution.overmarket.official.2', note: 'USD variant, 3x market', claims: { company: 'Vantage Metrics', role: 'Entry Level QA Tester', salary: '$18,000 per month', location: 'Remote United States' }, evidence: [EV.official('Vantage Metrics', 'vantagemetrics.com'), EV.comparable('Vantage Metrics', 'Entry Level QA Tester', '$5,500 per month')] },
  { id: 'caution.overmarket.official.3', note: 'support role 4x market', claims: { company: 'Vantage Metrics', role: 'Customer Support Associate', salary: 'PHP 160,000 per month', location: 'Manila' }, evidence: [EV.official('Vantage Metrics', 'vantagemetrics.com'), EV.comparable('Vantage Metrics', 'Customer Support Associate', 'PHP 38,000 per month')] },
])

add({
  id: 'caution.stale.evidence.1',
  archetype: 'caution.stale.evidence',
  split: 'train',
  expected: 'caution',
  rationale: 'Only stale (year-old) evidence supports the company; current legitimacy unconfirmed.',
  claims: { company: 'Old Harbor Exports', role: 'Logistics Coordinator', salary: 'PHP 38,000 per month', location: 'Cebu City', contactMethod: 'Email', applicationPath: 'Email application' },
  evidence: [EV.reputationClear('Old Harbor Exports', 'Date: March 3, 2025'), EV.companyCheck('Old Harbor Exports', 'Older references found. Date: February 12, 2025')],
}, [
  { id: 'caution.stale.evidence.2', note: 'two-year-old evidence', claims: { company: 'Old Harbor Exports', role: 'Shipping Clerk', salary: 'PHP 24,000 per month' }, evidence: [EV.reputationClear('Old Harbor Exports', 'Date: May 20, 2024')] },
])

add({
  id: 'caution.contract.project.1',
  archetype: 'caution.contract.project',
  split: 'validation',
  expected: 'caution',
  rationale: 'Project-based contract with hours-vary disclosure through a reputable board; legitimate structure that still needs expectations-setting.',
  claims: { company: 'Nightowl Creative', role: 'Freelance Illustrator (project based)', salary: '$40/hour, hours vary', location: 'Remote', contactMethod: 'LinkedIn', applicationPath: 'LinkedIn Easy Apply' },
  evidence: [EV.jobBoard('Nightowl Creative', 'Freelance Illustrator'), EV.companyCheck('Nightowl Creative', 'Studio portfolio and client list found.')],
}, [
  { id: 'caution.contract.project.2', note: 'contract role wording', claims: { company: 'Nightowl Creative', role: 'Contract Motion Designer', salary: '$45/hour, project dependent' }, evidence: [EV.jobBoard('Nightowl Creative', 'Contract Motion Designer'), EV.companyCheck('Nightowl Creative', 'Studio portfolio and client list found.')] },
])

add({
  id: 'caution.mixed.mirror.1',
  archetype: 'caution.mixed.mirror',
  split: 'train',
  expected: 'caution',
  rationale: 'Official match exists but listing spread via scraped mirrors and flow hints at skipping interviews — mixed integrity signals.',
  claims: { company: 'Trailstone Outfitters', role: 'E-commerce Assistant', salary: '$24/hour', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'Quick start, no interview mentioned' },
  evidence: [EV.official('Trailstone Outfitters', 'trailstoneoutfitters.com'), EV.weakDirectory('Trailstone Outfitters', 'E-commerce Assistant')],
}, [
  { id: 'caution.mixed.mirror.2', note: 'different role', claims: { company: 'Trailstone Outfitters', role: 'Listing Specialist', salary: '$22/hour' }, evidence: [EV.official('Trailstone Outfitters', 'trailstoneoutfitters.com'), EV.weakDirectory('Trailstone Outfitters', 'Listing Specialist')] },
])

add({
  id: 'caution.newdomain.pro.1',
  archetype: 'caution.newdomain.pro',
  split: 'test',
  expected: 'caution',
  rationale: 'Newly registered apply domain on an otherwise professional listing — young companies exist, but domain age needs stronger verification.',
  claims: { company: 'Loomfield Labs', role: 'Machine Learning Engineer', salary: '$150,000 per year', location: 'Remote', contactMethod: 'Email', applicationPath: 'https://loomfieldlabs.ai/careers' },
  evidence: [EV.newDomain('loomfieldlabs.ai'), EV.startupFootprint('Loomfield Labs')],
}, [
  { id: 'caution.newdomain.pro.2', note: 'with recent certificate too', claims: { company: 'Loomfield Labs', role: 'Research Engineer', salary: '$160,000 per year' }, evidence: [EV.newDomain('loomfieldlabs.ai'), EV.certRecent('loomfieldlabs.ai'), EV.startupFootprint('Loomfield Labs')] },
  { id: 'caution.newdomain.pro.3', note: 'design brand variant', claims: { company: 'Aster & Vine', role: 'Graphic Designer', salary: '$70,000 per year', applicationPath: 'https://asterandvine.co/jobs' }, evidence: [EV.newDomain('asterandvine.co'), EV.companyCheck('Aster & Vine', 'Instagram portfolio and small site found.')] },
])

// ---------------------------------------------------------------------------
// HIGH-RISK archetypes
// ---------------------------------------------------------------------------

add({
  id: 'risk.classic.telegram.1',
  archetype: 'risk.classic.telegram',
  split: 'train',
  expected: 'high-risk',
  provenance: 'risk-scorer.test.mjs (obvious scam patterns)',
  rationale: 'The canonical scam bundle: unverifiable company + implausible weekly pay for entry level + Telegram-only + no interview.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Remote Frontend Intern', salary: 'PHP 80,000 per week', location: 'Remote', contactMethod: 'Telegram', applicationPath: 'No interview mentioned' },
  evidence: [],
  redFlags: ['Unrealistically high salary for the role level', 'Telegram-only contact method (bypasses official channels)', 'No interview process mentioned'],
}, [
  { id: 'risk.classic.telegram.2', note: 'data-entry wording', claims: { role: 'Remote Data Entry (Entry Level)', salary: 'PHP 100,000 per week' }, redFlags: ['Unrealistically high salary for the role level', 'Telegram-only contact method (bypasses official channels)', 'No interview process mentioned'] },
  { id: 'risk.classic.telegram.3', note: 'typing-job wording, no legacy flags provided', claims: { role: 'Online Typing Assistant (Entry Level)', salary: 'PHP 80,000 per week' }, redFlags: [] },
])

add({
  id: 'risk.weekly.generic-amount.1',
  archetype: 'risk.weekly.generic-amount',
  split: 'validation',
  expected: 'high-risk',
  rationale: 'Same scam bundle but a weekly amount outside the hardcoded 80k/100k literals — the pattern, not the number, is the scam ($6,000/week entry level + Telegram + no interview).',
  claims: { company: 'Unknown / Not Verifiable', role: 'Entry Level Remote Assistant', salary: '$6,000 per week', location: 'Remote', contactMethod: 'Telegram', applicationPath: 'No interview mentioned' },
  evidence: [],
}, [
  { id: 'risk.weekly.generic-amount.2', note: 'PHP 150k weekly', claims: { role: 'Remote Encoding Intern', salary: 'PHP 150,000 per week' } },
  { id: 'risk.weekly.generic-amount.3', note: 'peso-sign compact format', claims: { role: 'Junior Virtual Assistant', salary: '₱95,000 weekly' } },
])

add({
  id: 'risk.repost.conflict.1',
  archetype: 'risk.repost.conflict',
  split: 'train',
  expected: 'high-risk',
  provenance: 'audit-calibration-cases.test.mjs (copied repost)',
  rationale: 'Copied repost impersonating a famous employer: submitted text conflicts with the resolved job page and pushes off-platform contact.',
  claims: { company: 'Microsoft Corporation', role: 'Frontend Intern', salary: 'PHP 80,000 per week', location: 'Remote Philippines', contactMethod: 'Telegram', applicationPath: 'No interview mentioned' },
  evidence: [
    { type: 'Job Post Source', source: 'LinkedIn public job page', snippet: 'Trust: reputable-job-board | Resolved job page belongs to Crossing Hurdles, not Microsoft Corporation.' },
    EV.inputConflict('Company and role differ from the submitted text.'),
  ],
}, [
  { id: 'risk.repost.conflict.2', note: 'Google impersonation', claims: { company: 'Google LLC', role: 'Remote Data Analyst Intern', salary: '$5,500 per week', contactMethod: 'WhatsApp' }, evidence: [
    { type: 'Job Post Source', source: 'LinkedIn public job page', snippet: 'Trust: reputable-job-board | Resolved job page belongs to a staffing agency, not Google LLC.' },
    EV.inputConflict('Company differs from the submitted text.'),
  ] },
])

add({
  id: 'risk.threat.intel.1',
  archetype: 'risk.threat.intel',
  split: 'test',
  expected: 'high-risk',
  rationale: 'Submitted apply URL matched known phishing intelligence — hard safety floor regardless of other context.',
  claims: { company: 'Arcadia Payments', role: 'Payment Operations Assistant', salary: '$4,200 per month', location: 'Remote', contactMethod: 'Email', applicationPath: 'https://arcadia-payments-hiring.top/apply' },
  evidence: [EV.threatIntel('https://arcadia-payments-hiring.top/apply'), EV.official('Arcadia Payments', 'arcadiapayments.com')],
}, [
  { id: 'risk.threat.intel.2', note: 'different lure brand', claims: { company: 'Northgate Bank', role: 'Remote Onboarding Clerk', salary: '$3,800 per month', applicationPath: 'https://northgate-verify.click/start' }, evidence: [EV.threatIntel('https://northgate-verify.click/start')] },
  { id: 'risk.threat.intel.3', note: 'threat hit even with strong-looking listing', claims: { company: 'Arcadia Payments', role: 'Compliance Assistant', salary: '$4,500 per month', applicationPath: 'https://arcadiapayments-jobs.site/apply' }, evidence: [EV.threatIntel('https://arcadiapayments-jobs.site/apply'), EV.official('Arcadia Payments', 'arcadiapayments.com'), EV.jobBoard('Arcadia Payments', 'Compliance Assistant')] },
])

add({
  id: 'risk.applymismatch.freemail.1',
  archetype: 'risk.applymismatch.freemail',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Apply domain does not match official company domain AND recruiter uses free-mail — layered impersonation signals.',
  claims: { company: 'Beacon Health Group', role: 'Medical Records Clerk', salary: '$25/hour', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'https://beaconhealth-careers.net/apply', recruiterEmail: 'beaconhealth.hr@gmail.com' },
  evidence: [EV.official('Beacon Health Group', 'beaconhealth.org'), EV.applyMismatch('beaconhealth-careers.net', 'beaconhealth.org'), EV.recruiterFreeMail('beaconhealth.hr@gmail.com')],
}, [
  { id: 'risk.applymismatch.freemail.2', note: 'different sector', claims: { company: 'Ironpeak Insurance', role: 'Claims Processor', salary: '$27/hour', applicationPath: 'https://ironpeak-hiring.info/form', recruiterEmail: 'ironpeak.recruiting@outlook.com' }, evidence: [EV.official('Ironpeak Insurance', 'ironpeak.com'), EV.applyMismatch('ironpeak-hiring.info', 'ironpeak.com'), EV.recruiterFreeMail('ironpeak.recruiting@outlook.com')] },
])

add({
  id: 'risk.recruiterdomain.pivot.1',
  archetype: 'risk.recruiterdomain.pivot',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Recruiter domain mismatches the official company and the process pivots to WhatsApp with no interview.',
  claims: { company: 'Summit Freight Lines', role: 'Dispatch Coordinator', salary: '$4,800 per month', location: 'Remote United States', contactMethod: 'WhatsApp', applicationPath: 'No interview mentioned, start this week', recruiterEmail: 'hr@summitfreight-hiring.net' },
  evidence: [EV.official('Summit Freight Lines', 'summitfreight.com'), EV.recruiterDomainRisk('summitfreight-hiring.net', 'summitfreight.com')],
}, [
  { id: 'risk.recruiterdomain.pivot.2', note: 'telegram pivot', claims: { company: 'Summit Freight Lines', role: 'Fleet Assistant', contactMethod: 'Telegram', recruiterEmail: 'jobs@summit-freight.co' }, evidence: [EV.official('Summit Freight Lines', 'summitfreight.com'), EV.recruiterDomainRisk('summit-freight.co', 'summitfreight.com')] },
])

add({
  id: 'risk.lookalike.domain.1',
  archetype: 'risk.lookalike.domain',
  split: 'validation',
  expected: 'high-risk',
  rationale: 'Look-alike apply domain: newly registered, brand-new certificate, mismatching the official root — textbook impersonation infrastructure.',
  claims: { company: 'Veridian Bank', role: 'Customer Verification Specialist', salary: '$4,600 per month', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'https://veridian-bank-careers.com/apply' },
  evidence: [EV.official('Veridian Bank', 'veridianbank.com'), EV.applyMismatch('veridian-bank-careers.com', 'veridianbank.com'), EV.newDomain('veridian-bank-careers.com'), EV.certRecent('veridian-bank-careers.com')],
}, [
  { id: 'risk.lookalike.domain.2', note: 'telco brand', claims: { company: 'Cobalt Telecom', role: 'Billing Support Agent', salary: '$3,900 per month', applicationPath: 'https://cobalt-telecom-jobs.net/start' }, evidence: [EV.official('Cobalt Telecom', 'cobalttelecom.com'), EV.applyMismatch('cobalt-telecom-jobs.net', 'cobalttelecom.com'), EV.newDomain('cobalt-telecom-jobs.net')] },
])

add({
  id: 'risk.reputation.weekly.1',
  archetype: 'risk.reputation.weekly',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Company-specific scam warnings in the news combined with anomalous weekly pay.',
  claims: { company: 'Prime Wealth Logistics', role: 'Package Inspection Agent', salary: '$1,900 per week', location: 'Remote United States', contactMethod: 'Email', applicationPath: 'Online form, start immediately' },
  evidence: [EV.reputationRisk('Prime Wealth Logistics'), EV.weakDirectory('Prime Wealth Logistics', 'Package Inspection Agent')],
}, [
  { id: 'risk.reputation.weekly.2', note: 'reshipping wording', claims: { company: 'Prime Wealth Logistics', role: 'Home Package Handler', salary: '$1,500 per week plus bonuses' }, evidence: [EV.reputationRisk('Prime Wealth Logistics')] },
])

add({
  id: 'risk.whatsapp.nointerview.1',
  archetype: 'risk.whatsapp.nointerview',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Unverifiable company + WhatsApp-only + no interview: the off-platform no-vetting bundle.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Remote Chat Moderator', salary: 'PHP 45,000 per month', location: 'Remote Philippines', contactMethod: 'WhatsApp', applicationPath: 'No interview mentioned' },
  evidence: [],
}, [
  { id: 'risk.whatsapp.nointerview.2', note: 'US survey-taker wording', claims: { role: 'Paid Survey Specialist', salary: '$3,200 per month', location: 'Remote United States' } },
])

add({
  id: 'risk.fee.request.1',
  archetype: 'risk.fee.request',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Upfront fee/equipment payment request from an unverifiable employer — direct financial-loss vector.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Work From Home Encoder', salary: 'PHP 60,000 per month', location: 'Remote Philippines', contactMethod: 'Email', applicationPath: 'Pay training fee to start' },
  evidence: [],
  redFlags: ['Requires upfront payment or training fee before starting', 'Company name not verifiable via web search'],
}, [
  { id: 'risk.fee.request.2', note: 'equipment-deposit wording', claims: { role: 'Remote Logistics Encoder', applicationPath: 'Equipment deposit required before onboarding' }, redFlags: ['Requires equipment deposit payment before onboarding', 'Company name not verifiable via web search'] },
])

add({
  id: 'risk.ocr.screenshot.1',
  archetype: 'risk.ocr.screenshot',
  split: 'train',
  expected: 'high-risk',
  provenance: 'audit-calibration-cases.test.mjs (screenshot-only scam)',
  rationale: 'Screenshot-recovered scam text: weekly implausible pay + Telegram-only + no interview, no verifiable company.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Frontend Intern', salary: 'PHP 80,000 per week', location: 'Remote Philippines', contactMethod: 'Telegram', applicationPath: 'No interview mentioned' },
  evidence: [EV.ocrGoogleVision('Remote frontend intern PHP 80,000 per week no interview recruiter only wants Telegram contact')],
}, [
  { id: 'risk.ocr.screenshot.2', note: 'RLHF-flavored screenshot scam', claims: { role: 'TypeScript Software Engineer RLHF Contractor', salary: '$70/hour' }, evidence: [EV.ocrGoogleVision('RLHF coding contractor role. Contact recruiter only on Telegram. No interview required. Start today.')] },
])

add({
  id: 'risk.impersonation.brand.1',
  archetype: 'risk.impersonation.brand',
  split: 'test',
  expected: 'high-risk',
  rationale: 'Real brand name + wrong apply domain + free-mail recruiter: impersonation triangle even with an official footprint present.',
  claims: { company: 'Deltacore Systems', role: 'Remote IT Support Specialist', salary: '$5,200 per month', location: 'Remote United States', contactMethod: 'Email then WhatsApp', applicationPath: 'https://deltacore-recruitment.org/apply', recruiterName: 'Mark Reyes', recruiterEmail: 'deltacore.talent@gmail.com' },
  evidence: [EV.official('Deltacore Systems', 'deltacore.com'), EV.applyMismatch('deltacore-recruitment.org', 'deltacore.com'), EV.recruiterFreeMail('deltacore.talent@gmail.com')],
}, [
  { id: 'risk.impersonation.brand.2', note: 'airline brand lure', claims: { company: 'Pacifica Airlines', role: 'Remote Reservations Agent', salary: '$4,700 per month', applicationPath: 'https://pacifica-airlines-jobs.com/apply', recruiterEmail: 'pacifica.hiring@outlook.com' }, evidence: [EV.official('Pacifica Airlines', 'pacificaair.com'), EV.applyMismatch('pacifica-airlines-jobs.com', 'pacificaair.com'), EV.recruiterFreeMail('pacifica.hiring@outlook.com')] },
  { id: 'risk.impersonation.brand.3', note: 'with new-domain evidence stacked', claims: { company: 'Deltacore Systems', role: 'Remote Helpdesk Agent', salary: '$4,900 per month' }, evidence: [EV.official('Deltacore Systems', 'deltacore.com'), EV.applyMismatch('deltacore-recruitment.org', 'deltacore.com'), EV.recruiterFreeMail('deltacore.talent@gmail.com'), EV.newDomain('deltacore-recruitment.org')] },
])

add({
  id: 'risk.mule.paypal.1',
  archetype: 'risk.mule.paypal',
  split: 'train',
  expected: 'high-risk',
  rationale: 'No-vetting weekly-PayPal package handling with WhatsApp contact — money/package mule pattern expressed through existing signals.',
  claims: { company: 'Swift Parcel Partners', role: 'Home Based Package Handler', salary: '$1,200 weekly via PayPal', location: 'Remote United States', contactMethod: 'WhatsApp', applicationPath: 'No interview mentioned, start immediately' },
  evidence: [EV.weakDirectory('Swift Parcel Partners', 'Package Handler')],
}, [
  { id: 'risk.mule.paypal.2', note: 'gift-card QA wording', claims: { company: 'Swift Parcel Partners', role: 'Gift Card Quality Checker', salary: '$950 weekly via PayPal' }, evidence: [] },
])

add({
  id: 'risk.noevidence.telegram-fee.1',
  archetype: 'risk.noevidence.telegram-fee',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Telegram contact + registration-fee ask + zero corroborating evidence.',
  claims: { company: 'Global Task Hub', role: 'App Rating Specialist', salary: 'PHP 8,000 per day', location: 'Remote Philippines', contactMethod: 'Telegram', applicationPath: 'Pay registration fee, no interview' },
  evidence: [],
  redFlags: ['Requires registration fee payment before starting'],
}, [
  { id: 'risk.noevidence.telegram-fee.2', note: 'crypto-wallet payout wording', claims: { role: 'Product Review Agent', salary: 'USD 300 per day', applicationPath: 'Pay activation fee via crypto wallet, no interview' }, redFlags: ['Requires activation fee payment before starting'] },
])

// ---------------------------------------------------------------------------
// ADVERSARIAL archetypes: evasion wordings scammers actually use (short-link
// pivots, exam-instead-of-interview phrasing, obfuscated charges, abbreviations)
// plus near-miss traps where naive substring matching would overfire.
// ---------------------------------------------------------------------------

add({
  id: 'risk.evasion.tme.1',
  archetype: 'risk.evasion.tme',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Telegram pivot hidden behind a t.me short link plus a no-interview flow from an unverifiable employer — the link is the platform.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Remote Encoding Assistant', salary: 'PHP 45,000 per month', location: 'Remote Philippines', contactMethod: 'Message HR at t.me/hiringdesk_ph', applicationPath: 'No interview mentioned, message to start' },
  evidence: [],
}, [
  { id: 'risk.evasion.tme.2', note: 'different handle and role', claims: { role: 'Online Product Rater', salary: 'PHP 52,000 per month', contactMethod: 'Chat via t.me/ph_jobs_fasthire' } },
])

add({
  id: 'risk.evasion.wame.1',
  archetype: 'risk.evasion.wame',
  split: 'validation',
  expected: 'high-risk',
  rationale: 'WhatsApp pivot hidden behind a wa.me short link with a no-interview flow and no verifiable employer.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Remote Data Checker', salary: 'PHP 48,000 per month', location: 'Remote Philippines', contactMethod: 'Apply through wa.me/639171234567', applicationPath: 'No interview mentioned' },
  evidence: [],
})

add({
  id: 'risk.evasion.viber.1',
  archetype: 'risk.evasion.viber',
  split: 'train',
  expected: 'high-risk',
  rationale: 'Viber-only recruitment (common in PH scams) with a no-interview flow and unverifiable employer.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Home Based Typist', salary: 'PHP 40,000 per month', location: 'Remote Philippines', contactMethod: 'Viber only', applicationPath: 'No interview mentioned, start today' },
  evidence: [],
}, [
  { id: 'risk.evasion.viber.2', note: 'viber group invite wording', claims: { role: 'Part Time Encoder', contactMethod: 'Join our Viber community to be onboarded' } },
])

add({
  id: 'risk.evasion.noexam.1',
  archetype: 'risk.evasion.noexam',
  split: 'train',
  expected: 'high-risk',
  rationale: '"No exam, direct hire today" is the same no-vetting claim as "no interview", phrased to dodge the keyword.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Warehouse Encoder', salary: 'PHP 42,000 per month', location: 'Remote Philippines', contactMethod: 'Viber only', applicationPath: 'No exam, direct hire today' },
  evidence: [],
}, [
  { id: 'risk.evasion.noexam.2', note: 'walang-interview tagalog wording', claims: { role: 'Online Assistant', contactMethod: 'Message us on Viber', applicationPath: 'Walang interview, start agad' } },
])

add({
  id: 'risk.evasion.weekly-abbrev.1',
  archetype: 'risk.evasion.weekly-abbrev',
  split: 'validation',
  expected: 'high-risk',
  rationale: 'Implausible weekly pay abbreviated as /wk for an entry role with Telegram contact — abbreviation must not dodge the weekly-pay logic.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Entry Level Remote Assistant', salary: '₱85,000/wk', location: 'Remote Philippines', contactMethod: 'Telegram', applicationPath: 'No interview mentioned' },
  evidence: [],
})

add({
  id: 'risk.evasion.fee-obfuscated.1',
  archetype: 'risk.evasion.fee-obfuscated',
  split: 'train',
  expected: 'high-risk',
  rationale: 'The advance-fee ask reworded as an "onboarding charge" — the charge is the scam regardless of the noun.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Remote Account Assistant', salary: 'PHP 55,000 per month', location: 'Remote Philippines', contactMethod: 'Email', applicationPath: 'Small onboarding charge of PHP 500 before account activation' },
  evidence: [],
}, [
  { id: 'risk.evasion.fee-obfuscated.2', note: 'activation-charge wording', claims: { role: 'Data Entry Associate', applicationPath: 'Pay the account activation charge to receive your first task batch' } },
])

add({
  id: 'risk.evasion.combo.1',
  archetype: 'risk.evasion.combo',
  split: 'test',
  expected: 'high-risk',
  rationale: 'Generalization check: short-link pivot + exam-dodge wording + reworded charge, composed — each individually hardened fix must also compose.',
  claims: { company: 'Unknown / Not Verifiable', role: 'Remote Task Specialist', salary: 'PHP 60,000 per month', location: 'Remote Philippines', contactMethod: 'Message coordinator at t.me/taskdesk_hq', applicationPath: 'No exam needed, refundable deposit required to unlock tasks' },
  evidence: [],
}, [
  { id: 'risk.evasion.combo.2', note: 'wa.me + processing charge', claims: { role: 'Parcel Coordination Agent', contactMethod: 'Apply via wa.me/639221230000', applicationPath: 'No exam, pay the processing charge to reserve your slot' } },
])

add({
  id: 'safe.negation.feewarning.1',
  archetype: 'safe.negation.feewarning',
  split: 'train',
  expected: 'safe',
  rationale: 'Negation trap: an official employer explicitly warning "we never ask for any registration fee" must not trip the fee detector.',
  claims: { company: 'Stellar Contact Solutions', role: 'Customer Support Representative', salary: 'PHP 27,000 per month', location: 'Taguig, Metro Manila', contactMethod: 'Email', applicationPath: 'Official careers page — the company never asks for any registration fee; beware of scammers' },
  evidence: [EV.official('Stellar Contact Solutions', 'stellarcontact.ph'), EV.verifiedLocal('Stellar Contact Solutions', 'Taguig, Metro Manila'), EV.jobBoard('Stellar Contact Solutions', 'Customer Support Representative', 'JobStreet')],
}, [
  { id: 'safe.negation.feewarning.2', note: 'no-fees-ever wording', claims: { role: 'Technical Support Representative', applicationPath: 'Apply on the official careers page. We do not charge any application fee or training fee.' } },
])

add({
  id: 'safe.nearmiss.weeklypay.1',
  archetype: 'safe.nearmiss.weeklypay',
  split: 'test',
  expected: 'safe',
  rationale: 'Hourly US role paid weekly via direct deposit — a weekly pay SCHEDULE for an hourly wage is normal and must not read as a weekly salary quote.',
  claims: { company: 'Brightlane Logistics', role: 'Warehouse Associate', salary: '$18/hour, paid weekly via direct deposit', location: 'Austin, Texas', contactMethod: 'Email', applicationPath: 'Official careers page at brightlanelogistics.com' },
  evidence: [EV.official('Brightlane Logistics', 'brightlanelogistics.com'), EV.verifiedLocal('Brightlane Logistics', 'Austin, Texas'), EV.comparable('Brightlane Logistics', 'Warehouse Associate', '$17/hour')],
})

add({
  id: 'caution.viber.local.1',
  archetype: 'caution.viber.local',
  split: 'train',
  expected: 'caution',
  rationale: 'Verified local business recruiting over Viber — plausibly legitimate in the PH market, but the off-platform channel still needs verification before trusting.',
  claims: { company: 'Mendoza Dental Group', role: 'Dental Assistant', salary: 'PHP 21,000 per month', location: 'Makati, Metro Manila', contactMethod: 'Viber', applicationPath: 'Message the clinic to schedule an interview' },
  evidence: [EV.official('Mendoza Dental Group', 'mendozadental.ph'), EV.verifiedLocal('Mendoza Dental Group', 'Makati, Metro Manila')],
})

// ---------------------------------------------------------------------------
// Surface expansions: strictly label-preserving renames (company / role / city /
// currency formatting) of existing archetype bases. Each inherits split and label
// from its base, so no scenario leaks across splits.
// ---------------------------------------------------------------------------

function addVariantOf(baseId, spec) {
  const base = cases.find((item) => item.id === baseId)
  if (!base) throw new Error(`expansion references unknown base case: ${baseId}`)
  cases.push(variant(base, spec))
}

// SAFE expansions
addVariantOf('safe.bigtech.official.1', { id: 'safe.bigtech.official.4', note: 'EU brand rename', claims: { company: 'Spotify', role: 'Backend Engineer', salary: 'EUR 88,000 per year', location: 'Stockholm / Remote EU' }, evidence: [EV.jobBoard('Spotify', 'Backend Engineer'), EV.official('Spotify', 'spotify.com'), EV.comparable('Spotify', 'Backend Engineer', 'EUR 85,000 per year')] })
addVariantOf('safe.easyapply.board.1', { id: 'safe.easyapply.board.4', note: 'Glassdoor source', claims: { company: 'Riverbend Analytics', role: 'BI Developer', salary: '$52/hour', location: 'Denver, Colorado' }, evidence: [EV.jobBoard('Riverbend Analytics', 'BI Developer', 'Glassdoor'), EV.official('Riverbend Analytics', 'riverbendanalytics.com'), EV.reputationClear('Riverbend Analytics')] })
addVariantOf('safe.local.verified.1', { id: 'safe.local.verified.3', note: 'clinic rename', claims: { company: 'Santos Veterinary Clinic', role: 'Veterinary Assistant', salary: 'PHP 24,000 per month', location: 'Pasig, Metro Manila' }, evidence: [EV.official('Santos Veterinary Clinic', 'santosvet.ph'), EV.verifiedLocal('Santos Veterinary Clinic', 'Pasig, Metro Manila'), EV.registryActive('Santos Veterinary Clinic')] })
addVariantOf('safe.local.verified.1', { id: 'safe.local.verified.4', note: 'hardware store rename', claims: { company: 'Golden Hammer Hardware', role: 'Store Cashier', salary: 'PHP 18,500 per month', location: 'Iloilo City' }, evidence: [EV.official('Golden Hammer Hardware', 'goldenhammer.ph'), EV.verifiedLocal('Golden Hammer Hardware', 'Iloilo City')] })
addVariantOf('safe.ats.greenhouse.1', { id: 'safe.ats.greenhouse.3', note: 'Ashby ATS', claims: { company: 'Copperleaf Health', role: 'Backend Engineer', salary: '$145,000 per year', applicationPath: 'https://jobs.ashbyhq.com/copperleafhealth/eng-441' }, evidence: [EV.official('Copperleaf Health', 'copperleafhealth.com'), EV.jobBoard('Copperleaf Health', 'Backend Engineer', 'Ashby'), EV.comparable('Copperleaf Health', 'Backend Engineer', '$140,000 per year')] })
addVariantOf('safe.startup.remote.1', { id: 'safe.startup.remote.3', note: 'devtools startup rename', claims: { company: 'Hexlane', role: 'Developer Advocate', salary: '$125,000 per year', applicationPath: 'Official careers page at hexlane.io' }, evidence: [EV.official('Hexlane', 'hexlane.io'), EV.startupFootprint('Hexlane'), EV.jobBoard('Hexlane', 'Developer Advocate', 'Wellfound')], redFlags: ['No local business presence found for the company'] })
addVariantOf('safe.hourly.recruiter-match.1', { id: 'safe.hourly.recruiter-match.3', note: 'podcast producer rename', claims: { company: 'Bluecrest Media', role: 'Podcast Producer', salary: '$31/hour', recruiterName: 'Ivy Chen', recruiterEmail: 'ivy.chen@bluecrestmedia.com' }, evidence: [EV.official('Bluecrest Media', 'bluecrestmedia.com'), EV.recruiterDomainMatch('bluecrestmedia.com'), EV.comparable('Bluecrest Media', 'Podcast Producer', '$30/hour')] })
addVariantOf('safe.agency.strong.1', { id: 'safe.agency.strong.3', note: 'EU staffing brand', claims: { company: 'Meridian Talent Partners', role: 'Java Developer', salary: 'EUR 60,000 per year', location: 'Remote EU' }, evidence: [EV.jobBoard('Meridian Talent Partners', 'Java Developer'), EV.companyCheck('Meridian Talent Partners', 'Public recruiting agency footprint found.'), EV.official('Meridian Talent Partners', 'meridiantalent.eu')] })
addVariantOf('safe.bpo.local.1', { id: 'safe.bpo.local.3', note: 'HR role rename', claims: { company: 'Stellar Contact Solutions', role: 'HR Coordinator', salary: 'PHP 32,000 per month' }, evidence: [EV.official('Stellar Contact Solutions', 'stellarcontact.ph'), EV.verifiedLocal('Stellar Contact Solutions', 'Taguig, Metro Manila'), EV.jobBoard('Stellar Contact Solutions', 'HR Coordinator', 'JobStreet')] })
addVariantOf('safe.gov.registry.1', { id: 'safe.gov.registry.3', note: 'utilities engineer rename', claims: { company: 'Meridian Power Corporation', role: 'Electrical Engineer', salary: 'PHP 60,000 per month' }, evidence: [EV.official('Meridian Power Corporation', 'meridianpower.ph'), EV.registryActive('Meridian Power Corporation'), EV.verifiedLocal('Meridian Power Corporation', 'Quezon City')] })
addVariantOf('safe.remote.workday.1', { id: 'safe.remote.workday.3', note: 'data role rename', claims: { company: 'Helios Software', role: 'Data Platform Engineer', salary: '$150,000 per year' }, evidence: [EV.official('Helios Software', 'heliossoftware.com'), EV.jobBoard('Helios Software', 'Data Platform Engineer', 'Workday'), EV.recruiterDomainMatch('heliossoftware.com'), EV.reputationClear('Helios Software')], redFlags: ['No local business presence found for the company'] })
addVariantOf('safe.design.official.1', { id: 'safe.design.official.4', note: 'illustration lead rename', claims: { company: 'Fernwood Studio', role: 'Illustration Lead', salary: '$130,000 per year' }, evidence: [EV.official('Fernwood Studio', 'fernwood.studio'), EV.comparable('Fernwood Studio', 'Illustration Lead', '$125,000 per year'), EV.reputationClear('Fernwood Studio')] })
addVariantOf('safe.fresh.board.1', { id: 'safe.fresh.board.4', note: 'product manager rename', claims: { company: 'Quartzline Fintech', role: 'Product Manager', salary: '$140,000 per year' }, evidence: [EV.jobBoard('Quartzline Fintech', 'Product Manager'), EV.official('Quartzline Fintech', 'quartzline.com'), EV.reputationClear('Quartzline Fintech', 'Date: June 18, 2026')] })
addVariantOf('safe.uk.annual.1', { id: 'safe.uk.annual.4', note: 'data scientist rename', claims: { company: 'Ashgrove Systems', role: 'Data Scientist', salary: 'GBP 80,000 per year' }, evidence: [EV.official('Ashgrove Systems', 'ashgrovesystems.co.uk'), EV.establishedDomain('ashgrovesystems.co.uk'), EV.comparable('Ashgrove Systems', 'Data Scientist', 'GBP 77,000 per year')] })

// CAUTION expansions
addVariantOf('caution.rlhf.contractor.1', { id: 'caution.rlhf.contractor.3', note: 'math-tutor AI platform rename', claims: { company: 'Mercor Labs', role: 'Math Specialist for AI training', salary: '$20 - $40/hour' }, evidence: [
  { type: 'Job Post Source', source: 'Official platform job page', snippet: 'Trust: reputable-job-board | Math Specialist contractor role. Independent contractor. Hours are project-dependent and not guaranteed. Payment weekly via Stripe.' },
  { type: 'Contract Transparency', source: 'Resolved job page', snippet: 'Accepted countries only. Unable to provide employment verification or offer letters. Identity verification required.' },
  { type: 'Role Details', source: 'Resolved job page', snippet: 'Evaluate and rank model answers to math problems; explain reasoning to build reward signals for large language models.' },
] })
addVariantOf('caution.unknown.sparse.1', { id: 'caution.unknown.sparse.3', note: 'bookkeeper rename', claims: { role: 'Part Time Bookkeeper', salary: 'PHP 30,000 per month' } })
addVariantOf('caution.unknown.sparse.1', { id: 'caution.unknown.sparse.4', note: 'transcriptionist rename', claims: { role: 'Medical Transcriptionist', salary: '$19/hour', location: 'Remote' } })
addVariantOf('caution.named.sparse.1', { id: 'caution.named.sparse.3', note: 'events agency rename', claims: { company: 'Crestline Events', role: 'Events Coordinator', salary: 'PHP 32,000 per month' }, evidence: [EV.weakDirectory('Crestline Events', 'Events Coordinator')] })
addVariantOf('caution.weekly.normal.1', { id: 'caution.weekly.normal.3', note: 'driver role weekly wage', claims: { company: 'Harborline Support Co', role: 'Delivery Coordinator', salary: '$650 per week', location: 'Phoenix, Arizona' }, evidence: [EV.companyCheck('Harborline Support Co', 'Small public web footprint found.')] })
addVariantOf('caution.agency.thin.1', { id: 'caution.agency.thin.3', note: 'devops contract rename', claims: { company: 'Pinnacle Staffing Partners', role: 'DevOps Engineer for client retail group', salary: '$55/hour' }, evidence: [EV.weakDirectory('Pinnacle Staffing Partners', 'DevOps Engineer')] })
addVariantOf('caution.freemail.official.1', { id: 'caution.freemail.official.3', note: 'proton-mail variant', claims: { company: 'Solara Digital', role: 'SEO Specialist', salary: '$52,000 per year', recruiterEmail: 'solara.recruiting@proton.me' }, evidence: [EV.official('Solara Digital', 'solaradigital.com'), EV.recruiterFreeMail('solara.recruiting@proton.me')] })
addVariantOf('caution.whatsapp.board.1', { id: 'caution.whatsapp.board.3', note: 'UK sales rename', claims: { company: 'Kite Commerce', role: 'Enterprise Sales Executive', salary: 'GBP 55,000 per year', location: 'Remote United Kingdom' }, evidence: [EV.jobBoard('Kite Commerce', 'Enterprise Sales Executive'), EV.official('Kite Commerce', 'kitecommerce.com')] })
addVariantOf('caution.stale.evidence.1', { id: 'caution.stale.evidence.3', note: 'warehouse rename', claims: { company: 'Old Harbor Exports', role: 'Warehouse Checker', salary: 'PHP 22,000 per month' }, evidence: [EV.reputationClear('Old Harbor Exports', 'Date: January 8, 2025'), EV.companyCheck('Old Harbor Exports', 'Older references found. Date: December 2, 2024')] })
addVariantOf('caution.contract.project.1', { id: 'caution.contract.project.3', note: 'copywriter rename', claims: { company: 'Nightowl Creative', role: 'Contract Copywriter', salary: '$38/hour, hours vary' }, evidence: [EV.jobBoard('Nightowl Creative', 'Contract Copywriter'), EV.companyCheck('Nightowl Creative', 'Studio portfolio and client list found.')] })
addVariantOf('caution.mixed.mirror.1', { id: 'caution.mixed.mirror.3', note: 'catalog assistant rename', claims: { company: 'Trailstone Outfitters', role: 'Catalog Assistant', salary: '$23/hour' }, evidence: [EV.official('Trailstone Outfitters', 'trailstoneoutfitters.com'), EV.weakDirectory('Trailstone Outfitters', 'Catalog Assistant')] })
addVariantOf('caution.nointerview.official.1', { id: 'caution.nointerview.official.4', note: 'PH mall kiosk rename', claims: { company: 'Grovetech Retail', role: 'Kiosk Attendant', salary: 'PHP 19,000 per month' }, evidence: [EV.official('Grovetech Retail', 'grovetechretail.ph'), EV.verifiedLocal('Grovetech Retail', 'Pasig, Metro Manila')] })
addVariantOf('caution.overmarket.official.1', { id: 'caution.overmarket.official.4', note: 'encoder 3.5x market', claims: { company: 'Vantage Metrics', role: 'Junior Data Encoder', salary: 'PHP 140,000 per month', location: 'Remote Philippines' }, evidence: [EV.official('Vantage Metrics', 'vantagemetrics.com'), EV.comparable('Vantage Metrics', 'Junior Data Encoder', 'PHP 40,000 per month')] })
addVariantOf('caution.newdomain.pro.1', { id: 'caution.newdomain.pro.4', note: 'fintech brand rename', claims: { company: 'Kestrel Pay', role: 'Backend Engineer', salary: '$145,000 per year', applicationPath: 'https://kestrelpay.io/careers' }, evidence: [EV.newDomain('kestrelpay.io'), EV.startupFootprint('Kestrel Pay')] })

// HIGH-RISK expansions
addVariantOf('risk.classic.telegram.1', { id: 'risk.classic.telegram.4', note: 'crypto-support wording', claims: { role: 'Remote Crypto Support Intern', salary: 'PHP 100,000 per week' }, redFlags: ['Unrealistically high salary for the role level', 'Telegram-only contact method (bypasses official channels)', 'No interview process mentioned'] })
addVariantOf('risk.weekly.generic-amount.1', { id: 'risk.weekly.generic-amount.4', note: 'USD 4,500 weekly variant', claims: { role: 'Entry Level Data Annotator', salary: '$4,500 per week' } })
addVariantOf('risk.repost.conflict.1', { id: 'risk.repost.conflict.3', note: 'Amazon impersonation', claims: { company: 'Amazon Web Services', role: 'Cloud Support Intern', salary: 'PHP 90,000 per week' }, evidence: [
  { type: 'Job Post Source', source: 'LinkedIn public job page', snippet: 'Trust: reputable-job-board | Resolved job page belongs to a local staffing agency, not Amazon Web Services.' },
  EV.inputConflict('Company and salary differ from the submitted text.'),
] })
addVariantOf('risk.applymismatch.freemail.1', { id: 'risk.applymismatch.freemail.3', note: 'hotel brand lure', claims: { company: 'Grandview Hotels', role: 'Remote Booking Agent', salary: '$24/hour', applicationPath: 'https://grandview-hotel-careers.com/apply', recruiterEmail: 'grandview.jobs@gmail.com' }, evidence: [EV.official('Grandview Hotels', 'grandviewhotels.com'), EV.applyMismatch('grandview-hotel-careers.com', 'grandviewhotels.com'), EV.recruiterFreeMail('grandview.jobs@gmail.com')] })
addVariantOf('risk.recruiterdomain.pivot.1', { id: 'risk.recruiterdomain.pivot.3', note: 'oil-and-gas brand', claims: { company: 'Summit Freight Lines', role: 'Logistics Documentation Clerk', salary: '$5,000 per month', recruiterEmail: 'recruit@summitfreightgroup.info' }, evidence: [EV.official('Summit Freight Lines', 'summitfreight.com'), EV.recruiterDomainRisk('summitfreightgroup.info', 'summitfreight.com')] })
addVariantOf('risk.reputation.weekly.1', { id: 'risk.reputation.weekly.3', note: 'mystery-shopper wording', claims: { company: 'Prime Wealth Logistics', role: 'Mystery Shopper', salary: '$1,700 per week' }, evidence: [EV.reputationRisk('Prime Wealth Logistics'), EV.weakDirectory('Prime Wealth Logistics', 'Mystery Shopper')] })
addVariantOf('risk.whatsapp.nointerview.1', { id: 'risk.whatsapp.nointerview.3', note: 'ad-clicker wording', claims: { role: 'Ad Review Agent', salary: 'PHP 52,000 per month' } })
addVariantOf('risk.fee.request.1', { id: 'risk.fee.request.3', note: 'software-license fee wording', claims: { role: 'Remote Claims Encoder', applicationPath: 'Purchase software license to begin work' }, redFlags: ['Requires software license purchase before starting', 'Company name not verifiable via web search'] })
addVariantOf('risk.ocr.screenshot.1', { id: 'risk.ocr.screenshot.3', note: 'viber-adjacent wording still telegram path', claims: { role: 'Encoding Intern', salary: 'PHP 100,000 per week' }, evidence: [EV.ocrGoogleVision('Encoding intern PHP 100,000 per week direct hire no interview message us on Telegram now')] })
addVariantOf('risk.mule.paypal.1', { id: 'risk.mule.paypal.3', note: 'electronics-tester wording', claims: { company: 'Swift Parcel Partners', role: 'Home Electronics Tester', salary: '$1,100 weekly via PayPal' }, evidence: [EV.weakDirectory('Swift Parcel Partners', 'Electronics Tester')] })
addVariantOf('risk.noevidence.telegram-fee.1', { id: 'risk.noevidence.telegram-fee.3', note: 'vip-task tier wording', claims: { role: 'VIP Task Specialist', salary: 'PHP 10,000 per day', applicationPath: 'Unlock VIP tier with deposit, no interview' }, redFlags: ['Requires deposit to unlock paid tasks'] })
addVariantOf('risk.lookalike.domain.1', { id: 'risk.lookalike.domain.3', note: 'insurance brand', claims: { company: 'Veridian Bank', role: 'Fraud Review Assistant', salary: '$4,400 per month', applicationPath: 'https://veridianbank-verify.net/apply' }, evidence: [EV.official('Veridian Bank', 'veridianbank.com'), EV.applyMismatch('veridianbank-verify.net', 'veridianbank.com'), EV.newDomain('veridianbank-verify.net'), EV.certRecent('veridianbank-verify.net')] })
addVariantOf('risk.threat.intel.1', { id: 'risk.threat.intel.4', note: 'courier brand lure', claims: { company: 'Arrow Courier Express', role: 'Delivery Slot Coordinator', salary: '$3,600 per month', applicationPath: 'https://arrow-courier-jobs.top/apply' }, evidence: [EV.threatIntel('https://arrow-courier-jobs.top/apply')] })
addVariantOf('risk.impersonation.brand.1', { id: 'risk.impersonation.brand.4', note: 'pharma brand lure', claims: { company: 'Novaris Pharmaceuticals', role: 'Remote Data Steward', salary: '$5,500 per month', applicationPath: 'https://novaris-talent.org/apply', recruiterEmail: 'novaris.recruit@gmail.com' }, evidence: [EV.official('Novaris Pharmaceuticals', 'novaris.com'), EV.applyMismatch('novaris-talent.org', 'novaris.com'), EV.recruiterFreeMail('novaris.recruit@gmail.com')] })

// ---------------------------------------------------------------------------

const ids = new Set()
for (const item of cases) {
  if (ids.has(item.id)) throw new Error(`duplicate dataset case id: ${item.id}`)
  ids.add(item.id)
}

export const SCORING_DATASET = cases

export function datasetBySplit(split) {
  return SCORING_DATASET.filter((item) => item.split === split)
}
