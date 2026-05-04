function normalized(value) {
  return String(value || '').trim().toLowerCase()
}

const LEGACY_DEMO_VALUES = new Set([
  'demo',
  'env_demo_key',
  'hireproof_agent_demo_key',
])

function claim(report, key) {
  return normalized(report?.extractedClaims?.[key])
}

function evidenceText(report) {
  return Array.isArray(report?.evidence)
    ? report.evidence
        .map((item) => `${item?.source || ''} ${item?.snippet || ''} ${item?.type || ''}`)
        .join(' ')
        .toLowerCase()
    : ''
}

function isLegacyDemoFixtureSignature(report) {
  const company = claim(report, 'company')
  const role = claim(report, 'role')
  const salary = claim(report, 'salary')
  const contactMethod = claim(report, 'contactMethod')
  const applicationPath = claim(report, 'applicationPath')
  const summary = normalized(report?.summary)
  const evidence = evidenceText(report)

  if (company.includes('unknown / not verifiable') && role === 'frontend intern') return true
  if (salary.includes('php 80,000 per week')) return true
  if (contactMethod === 'telegram' && applicationPath.includes('direct message only')) return true
  if (summary.includes('unrealistic salary') && summary.includes('telegram-only contact')) return true
  if (evidence.includes('average intern salary for southeast asia is $500-$1,500/month')) return true
  if (evidence.includes('telegram recruitment scams commonly promise high pay')) return true
  if (evidence.includes('sample market signal:')) return true
  if (evidence.includes('sample company check:')) return true

  return false
}

export function isDemoFixtureReport(report) {
  if (!report || typeof report !== 'object') return true
  if (normalized(report.id).startsWith('demo_')) return true
  if (normalized(report.mode) === 'demo') return true
  if (normalized(report.credentialMode) === 'demo') return true
  if (normalized(report.source) === 'demo') return true
  if (LEGACY_DEMO_VALUES.has(normalized(report.ownerId))) return true
  if (LEGACY_DEMO_VALUES.has(normalized(report.apiKeyId))) return true
  if (isLegacyDemoFixtureSignature(report)) return true

  return Array.isArray(report.evidence)
    ? report.evidence.some((item) => normalized(item?.source).startsWith('demo fixture:'))
    : false
}

export function isPublicIntelligenceReport(report) {
  return Boolean(report)
    && report.publiclyListed === true
    && report.version === '2'
    && Boolean(report.intelligence)
    && !isDemoFixtureReport(report)
}

export function filterPublicIntelligenceReports(reports) {
  return Array.isArray(reports) ? reports.filter(isPublicIntelligenceReport) : []
}

function publicTrendSignature(report) {
  return [
    normalized(report?.verdict),
    claim(report, 'company'),
    claim(report, 'role'),
    claim(report, 'salary'),
    claim(report, 'location'),
    claim(report, 'contactMethod'),
    claim(report, 'applicationPath'),
  ].join('|')
}

export function uniquePublicTrendReports(reports) {
  const seen = new Set()
  const unique = []

  for (const report of filterPublicIntelligenceReports(reports)) {
    const signature = publicTrendSignature(report)
    if (seen.has(signature)) continue
    seen.add(signature)
    unique.push(report)
  }

  return unique
}

function increment(bucket, label) {
  const key = String(label || 'Unknown').trim() || 'Unknown'
  bucket[key] = (bucket[key] || 0) + 1
}

function topEntries(items) {
  return Object.entries(items)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }))
}

export function buildPublicReportTrends(reports) {
  const publicReports = uniquePublicTrendReports(reports)
  const verdicts = { safe: 0, caution: 0, 'high-risk': 0 }
  const locations = {}
  const roles = {}
  const contactMethods = {}

  for (const report of publicReports) {
    if (Object.prototype.hasOwnProperty.call(verdicts, report.verdict)) {
      verdicts[report.verdict] += 1
    }
    increment(locations, report.extractedClaims?.location)
    increment(roles, report.extractedClaims?.role)
    increment(contactMethods, report.extractedClaims?.contactMethod)
  }

  return {
    totalReports: publicReports.length,
    verdicts,
    topLocations: topEntries(locations),
    topRoles: topEntries(roles),
    topContactMethods: topEntries(contactMethods),
    recentReports: publicReports.slice(0, 10),
  }
}
