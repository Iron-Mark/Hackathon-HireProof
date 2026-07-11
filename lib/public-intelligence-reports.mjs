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

function rawClaim(report, key) {
  return String(report?.extractedClaims?.[key] || '').trim()
}

function isNoisyValue(value) {
  const text = String(value || '').trim()
  const lower = text.toLowerCase()
  if (!text) return true
  if (['unknown', 'not specified', 'n/a', 'none', 'unknown / not verifiable'].includes(lower)) return true
  if (text.length > 120) return true
  if ((lower.match(/read more/g) || []).length > 0) return true
  if (/https?:\/\//i.test(text)) return true
  return false
}

function normalizeContactMethod(value) {
  const text = String(value || '').trim()
  const lower = text.toLowerCase()
  if (isNoisyValue(text)) return 'Unspecified'
  if (/\btelegram|whatsapp|viber|signal|messenger\b/.test(lower)) return 'Off-platform chat'
  if (/\blinkedin\b/.test(lower)) return 'LinkedIn'
  if (/\bemail|e-mail|mail\b/.test(lower)) return 'Email'
  if (/\bofficial|careers?|ashby|greenhouse|lever|workday|smartrecruiters|ats\b/.test(lower)) return 'Official/ATS'
  return text.length > 36 ? 'Unspecified' : text
}

function normalizeRole(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (isNoisyValue(text)) return 'Unclear role'
  const cleaned = text
    .replace(/\s+at\s+[A-Z][A-Za-z0-9&.,' -]{2,80}$/i, '')
    .replace(/\s+\|\s*(PH|US|UK|CA|AU)$/i, ' $1')
    .trim()
  if (!cleaned || cleaned.length > 80) return 'Unclear role'
  return cleaned
}

function normalizeLocation(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  const lower = text.toLowerCase()
  if (isNoisyValue(text)) return 'Unclear'
  if (/\bhybrid\b/.test(lower) && /\b(remote|wfh|work from home)\b/.test(lower)) return 'Hybrid/Remote'
  if (/\bremote|wfh|work from home\b/.test(lower)) return 'Remote'
  if (/\b(quezon city|makati|manila|ncr|national capital region|metro manila)\b/.test(lower)) return 'Metro Manila, Philippines'
  if (/\b(philippines|philippine| ph)\b/.test(lower)) return 'Philippines'
  return text.length > 70 ? 'Unclear' : text
}

function trendReady(report) {
  const role = normalizeRole(rawClaim(report, 'role'))
  const location = normalizeLocation(rawClaim(report, 'location'))
  const contactMethod = normalizeContactMethod(rawClaim(report, 'contactMethod'))
  const usableFields = [role !== 'Unclear role', location !== 'Unclear', contactMethod !== 'Unspecified']
    .filter(Boolean).length
  return usableFields >= 2
}

function uniqueStrings(items) {
  const seen = new Set()
  const unique = []
  for (const item of Array.isArray(items) ? items : []) {
    const value = String(item || '').trim()
    const key = normalized(value)
    if (!value || seen.has(key)) continue
    seen.add(key)
    unique.push(value)
  }
  return unique
}

function hasConcreteScamPattern(report) {
  const text = normalized([
    report?.summary,
    ...(Array.isArray(report?.redFlags) ? report.redFlags : []),
    rawClaim(report, 'salary'),
    rawClaim(report, 'contactMethod'),
    rawClaim(report, 'applicationPath'),
  ].join(' '))
  return /\b(telegram|whatsapp|no interview|verification code|gift card|fee|payment|bank|id photo|passport|unrealistic|salary|phishing|scam|fraud)\b/.test(text)
}

export function sanitizePublicIntelligenceReport(report) {
  const redFlags = uniqueStrings(report?.redFlags)
  const role = normalizeRole(rawClaim(report, 'role'))
  const company = isNoisyValue(rawClaim(report, 'company')) ? 'Unresolved company' : rawClaim(report, 'company')
  const unresolved = company === 'Unresolved company' && role === 'Unclear role'
  const summary = unresolved && !hasConcreteScamPattern(report)
    ? 'Unresolved submission: HireProof could not extract enough company or role detail to make this useful as a public trend example.'
    : redFlags.length > 0
      ? `Strongest signals: ${redFlags.slice(0, 3).join('; ')}.`
      : String(report?.summary || 'Report reviewed.').replace(/\s+/g, ' ').trim()

  return {
    id: report?.id,
    version: report?.version,
    verdict: report?.verdict,
    riskScore: report?.riskScore,
    confidence: report?.confidence,
    summary,
    extractedClaims: {
      company,
      role,
      location: normalizeLocation(rawClaim(report, 'location')),
      contactMethod: normalizeContactMethod(rawClaim(report, 'contactMethod')),
    },
    redFlags,
    timestamp: report?.timestamp,
  }
}

/**
 * Filter raw reports to the public set, apply a query + verdict filter (same haystack as
 * /api/intelligence/reports), and return the sanitized first `limit` plus the full filtered count.
 * Shared by the reports API route and the server-rendered /explore page.
 * @param {import('./schemas').AuditReport[]} rawReports
 * @param {{ query?: string, verdict?: string, limit?: number }} [opts]
 * @returns {{ reports: import('./schemas').AuditReport[], total: number }}
 */
export function selectPublicReports(rawReports, { query = '', verdict = 'all', limit = 50 } = {}) {
  const q = (query || '').trim().toLowerCase()
  const reports = filterPublicIntelligenceReports(rawReports || [])
  const filtered = reports.filter((report) => {
    const haystack = [
      report.extractedClaims.company,
      report.extractedClaims.role,
      report.extractedClaims.location,
      report.summary,
    ]
      .join(' ')
      .toLowerCase()
    const queryMatch = !q || haystack.includes(q)
    const verdictMatch = verdict === 'all' || report.verdict === verdict
    return queryMatch && verdictMatch
  })
  return {
    reports: filtered.slice(0, limit).map(sanitizePublicIntelligenceReport),
    total: filtered.length,
  }
}

function buildSampleQuality(totalReports, trendReadyReports, verdicts, mode) {
  const safe = Number(verdicts.safe || 0)
  const caution = Number(verdicts.caution || 0)
  const highRisk = Number(verdicts['high-risk'] || 0)
  const skewed = totalReports > 0 && (safe === 0 || caution / totalReports >= 0.7 || highRisk / totalReports >= 0.7)

  if (totalReports < 25 || trendReadyReports < 15 || skewed) {
    return {
      sampleQuality: 'limited',
      sampleWarning: `Limited trend sample: ${totalReports} public reports are available, with ${trendReadyReports} clean enough for pattern analysis. Treat the verdict mix as a public sample, not a platform-wide trend.`,
    }
  }

  if (totalReports < 100 || trendReadyReports < 60 || mode !== 'hybrid') {
    return {
      sampleQuality: 'developing',
      sampleWarning: 'Developing trend sample: public report volume is growing, but live evidence coverage and clean bucket counts still affect interpretation.',
    }
  }

  return {
    sampleQuality: 'strong',
    sampleWarning: undefined,
  }
}

export function buildPublicReportTrends(reports) {
  const publicReports = uniquePublicTrendReports(reports)
  const verdicts = { safe: 0, caution: 0, 'high-risk': 0 }
  const locations = {}
  const roles = {}
  const contactMethods = {}
  let trendReadyReports = 0
  let normalizedBucketCount = 0
  let unclearBucketCount = 0

  for (const report of publicReports) {
    if (Object.prototype.hasOwnProperty.call(verdicts, report.verdict)) {
      verdicts[report.verdict] += 1
    }
    if (trendReady(report)) trendReadyReports += 1

    const location = normalizeLocation(rawClaim(report, 'location'))
    const role = normalizeRole(rawClaim(report, 'role'))
    const contactMethod = normalizeContactMethod(rawClaim(report, 'contactMethod'))
    ;[location, role, contactMethod].forEach((label) => {
      if (/^unclear|unspecified/i.test(label)) unclearBucketCount += 1
      else normalizedBucketCount += 1
    })
    increment(locations, location)
    increment(roles, role)
    increment(contactMethods, contactMethod)
  }
  const quality = buildSampleQuality(publicReports.length, trendReadyReports, verdicts, 'stored-audits')

  return {
    totalReports: publicReports.length,
    trendReadyReports,
    ...quality,
    bucketQuality: {
      normalized: normalizedBucketCount,
      unclear: unclearBucketCount,
    },
    verdicts,
    topLocations: topEntries(locations),
    topRoles: topEntries(roles),
    topContactMethods: topEntries(contactMethods),
    recentReports: publicReports.slice(0, 10).map(sanitizePublicIntelligenceReport),
  }
}
