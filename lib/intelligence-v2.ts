import type {
  AuditOperations,
  AuditReport,
  AuditReportV2,
  EvidenceItem,
  ExtractedClaims,
  IntelligenceSignal,
  IntelligenceSummary,
  ScoreTraceItem,
} from '@/lib/schemas'
import { buildVerifiedAlternativeJobs } from '@/lib/alternative-jobs'
import { buildHybridSalaryBenchmark } from '@/lib/salary-benchmarks'
import {
  calculateRiskScore,
  determineVerdict,
  extractGreenFlags,
  extractRedFlags,
  generateSummary,
  getConfidenceLabel,
} from '@/lib/risk-scorer'

type BuildReportV2Input = {
  id: string
  extractedClaims: ExtractedClaims
  evidence: EvidenceItem[]
  enrichmentEvidence?: EvidenceItem[]
  enrichmentRedFlags?: string[]
  credentialMode?: AuditReport['credentialMode']
  ownerId?: string
  apiKeyId?: string
  source?: AuditReport['source']
  chatPlatform?: AuditReport['chatPlatform']
  chatThreadId?: string
  chatChannelId?: string
  publiclyListed?: boolean
  operations?: AuditOperations
}

type NormalizedCompensation = {
  amount: number
  currency: string
  period: 'hour' | 'week' | 'month' | 'year'
  monthlyAmount: number
}

type CompanyProfileMode = NonNullable<IntelligenceSummary['companyProfileMode']>
type RecruiterIdentityStatus = NonNullable<IntelligenceSummary['recruiterIdentity']>['status']

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeText(value: string) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function hostnameFromUrl(url?: string) {
  if (!url) return undefined
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return undefined
  }
}

function rootDomain(host?: string) {
  if (!host) return undefined
  const parts = host.replace(/^www\./, '').split('.').filter(Boolean)
  if (parts.length < 2) return host
  return parts.slice(-2).join('.')
}

function emailDomain(email?: string) {
  const domain = String(email || '').trim().toLowerCase().match(/@([^@\s]+)$/)?.[1]
  return domain?.replace(/^www\./, '')
}

function isFreeEmailDomain(domain?: string) {
  return Boolean(domain && [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'proton.me',
    'protonmail.com',
    'aol.com',
  ].includes(domain))
}

function classifySourceQuality(item: EvidenceItem): NonNullable<EvidenceItem['sourceQuality']> {
  const text = normalizeText(`${item.source} ${item.type} ${item.snippet} ${item.url || ''}`)
  const host = hostnameFromUrl(item.url)

  if (text.includes('risk signal') || text.includes('apply path mismatch')) return 'risky'
  if (
    text.includes('official company presence') ||
    text.includes('knowledge graph') ||
    text.includes('trust official') ||
    text.includes('verified local') ||
    (host && /\b(careers|jobs|about|company)\b/.test(text) && !isWeakHost(host))
  ) return 'official'
  if (
    text.includes('reputable job board') ||
    ['linkedin.com', 'indeed.com', 'glassdoor.com', 'jobstreet.com', 'workdayjobs.com', 'greenhouse.io', 'lever.co', 'smartrecruiters.com']
      .some(domain => host?.includes(domain) || text.includes(domain.replace('.com', '')))
  ) return 'reputable'
  if (text.includes('directory') || text.includes('mirror') || text.includes('scraped') || text.includes('aggregator')) return 'weak'
  return 'public'
}

function isWeakHost(host: string) {
  return /\b(directory|mirror|scrape|jobsora|jooble|simplyhired|careerjet)\b/.test(host)
}

function classifySourceType(item: EvidenceItem): NonNullable<EvidenceItem['sourceType']> {
  const source = normalizeText(`${item.source} ${item.type}`)
  if (source.includes('maps place')) return 'place'
  if (source.includes('maps') || source.includes('local')) return 'maps'
  if (source.includes('news') || source.includes('reputation')) return 'news'
  if (source.includes('jobs') || source.includes('linkedin') || source.includes('indeed') || source.includes('jobstreet')) return 'jobs'
  if (source.includes('enrichment') || source.includes('input conflict') || source.includes('resolved job')) return 'enrichment'
  return 'search'
}

function classifyTrustLevel(item: EvidenceItem): NonNullable<EvidenceItem['trustLevel']> {
  const text = normalizeText(`${item.type} ${item.snippet}`)
  if (text.includes('risk signal') || text.includes('mismatch') || text.includes('scam') || text.includes('fraud')) return 'risk'
  if (text.includes('official company presence') || text.includes('verified local') || text.includes('trust official') || text.includes('verified local')) return 'high'
  if (text.includes('company check') || text.includes('comparable jobs') || text.includes('reputable job board')) return 'medium'
  return 'low'
}

function classifyMatchConfidence(item: EvidenceItem) {
  const text = normalizeText(`${item.type} ${item.snippet}`)
  if (text.includes('official company presence') || text.includes('verified local') || text.includes('place detail matched')) return 0.92
  if (text.includes('company check') || text.includes('comparable jobs') || text.includes('reputable job board')) return 0.72
  if (text.includes('risk signal') || text.includes('mismatch')) return 0.82
  return 0.45
}

function parseFreshnessFromText(value: string): number | undefined {
  const text = String(value || '')
  const relative = text.match(/\b(\d+)\s+(day|week|month|year)s?\s+ago\b/i)
  if (relative) {
    const amount = Number(relative[1])
    const unit = relative[2].toLowerCase()
    if (!Number.isFinite(amount)) return undefined
    if (unit === 'day') return amount
    if (unit === 'week') return amount * 7
    if (unit === 'month') return amount * 30
    if (unit === 'year') return amount * 365
  }

  const explicit = text.match(/\b(?:Date:\s*)?([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2})\b/)
  if (!explicit) return undefined
  const timestamp = Date.parse(explicit[1])
  if (!Number.isFinite(timestamp)) return undefined
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000))
}

function classifyFreshness(item: EvidenceItem): {
  freshness: NonNullable<EvidenceItem['freshness']>
  freshnessDays?: number
} {
  const freshnessDays = parseFreshnessFromText(`${item.snippet} ${item.source}`)
  if (typeof freshnessDays !== 'number') return { freshness: 'unknown' }
  if (freshnessDays <= 30) return { freshness: 'fresh', freshnessDays }
  if (freshnessDays <= 180) return { freshness: 'recent', freshnessDays }
  return { freshness: 'stale', freshnessDays }
}

function attachEvidenceMetadata(evidence: EvidenceItem[]) {
  return evidence.map((item, index) => {
    const freshness = classifyFreshness(item)
    return {
      ...item,
      id: item.id || `ev_${index + 1}`,
      sourceType: item.sourceType || classifySourceType(item),
      sourceQuality: item.sourceQuality || classifySourceQuality(item),
      freshness: item.freshness || freshness.freshness,
      freshnessDays: typeof item.freshnessDays === 'number' ? item.freshnessDays : freshness.freshnessDays,
      trustLevel: item.trustLevel || classifyTrustLevel(item),
      matchConfidence: typeof item.matchConfidence === 'number' ? item.matchConfidence : classifyMatchConfidence(item),
    }
  })
}

function hasTrustedJobPageEvidence(evidence: EvidenceItem[]) {
  return evidence.some(item => {
    const text = normalizeText(`${item.source} ${item.type} ${item.snippet} ${item.url || ''}`)
    return (
      item.sourceQuality === 'reputable' ||
      text.includes('linkedin') ||
      text.includes('indeed') ||
      text.includes('jobstreet') ||
      text.includes('greenhouse') ||
      text.includes('lever') ||
      text.includes('ashby') ||
      text.includes('smartrecruiters') ||
      text.includes('workday') ||
      text.includes('public job page') ||
      text.includes('job post source') ||
      text.includes('resolved job page')
    )
  })
}

export function normalizeCompensation(value: string): NormalizedCompensation | null {
  const text = String(value || '').trim()
  if (!text || /not specified/i.test(text)) return null

  const numberMatch = text.match(/(?:PHP|Php|php|USD|usd|₱|\$)?\s*([\d,.]+)\s*(?:PHP|Php|php|USD|usd|pesos|dollars)?/i)
  if (!numberMatch) return null

  const amount = Number(numberMatch[1].replace(/,/g, ''))
  if (!Number.isFinite(amount) || amount <= 0) return null

  const currency = /(?:USD|usd|\$|dollars)/.test(text) ? 'USD' : 'PHP'
  const lower = text.toLowerCase()
  const period: NormalizedCompensation['period'] = lower.includes('hour')
    ? 'hour'
    : lower.includes('week')
      ? 'week'
      : lower.includes('year') || lower.includes('annum') || lower.includes('annual')
        ? 'year'
        : 'month'

  const monthlyAmount = period === 'hour'
    ? Math.round(amount * 173.2)
    : period === 'week'
      ? Math.round(amount * 4.33)
      : period === 'year'
        ? Math.round(amount / 12)
        : amount

  return { amount, currency, period, monthlyAmount }
}

function compensationFromEvidenceSnippet(snippet: string) {
  const salaryMatch = snippet.match(/Salary:\s*([^|]+)/i)
  return normalizeCompensation(salaryMatch?.[1] || snippet)
}

function median(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (sorted.length === 0) return undefined
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle]
}

function inferSeniority(role: string): NonNullable<IntelligenceSummary['marketBenchmark']['seniority']> {
  const text = normalizeText(role)
  if (/\b(intern|internship|trainee)\b/.test(text)) return 'intern'
  if (/\b(junior|jr|entry|associate)\b/.test(text)) return 'junior'
  if (/\b(senior|sr)\b/.test(text)) return 'senior'
  if (/\b(lead|principal|staff|head|manager)\b/.test(text)) return 'lead'
  if (!text) return 'unknown'
  return 'mid'
}

function inferCompanyProfileMode(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  verifiedLocalEvidence: EvidenceItem[],
): CompanyProfileMode {
  const text = normalizeText([
    extractedClaims.company,
    extractedClaims.role,
    extractedClaims.location,
    extractedClaims.applicationPath,
    ...evidence.map(item => `${item.source} ${item.type} ${item.snippet} ${item.url || ''}`),
  ].join(' '))
  const isRemote = /\b(remote|work from home|wfh|distributed|anywhere)\b/.test(text)
  const isStartup = /\b(startup|seed|pre seed|series a|series b|founder|yc|y combinator|wellfound|angellist|crunchbase|github)\b/.test(text)

  if (isRemote && isStartup) return 'startup_remote'
  if (isRemote) return 'established_remote'
  if (verifiedLocalEvidence.length > 0 || /\b(onsite|on site|office|branch|store|warehouse|local)\b/.test(text)) return 'local_business'
  return 'unknown'
}

function deriveRecruiterIdentity(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  officialHost?: string,
): {
  status: RecruiterIdentityStatus
  recruiterName?: string
  recruiterEmailDomain?: string
  evidenceIds: string[]
} {
  const recruiterName = extractedClaims.recruiterName?.trim() || undefined
  const recruiterEmailDomain = emailDomain(extractedClaims.recruiterEmail)
  const recruiterProfile = extractedClaims.recruiterProfile?.trim()
  const officialRoot = rootDomain(officialHost)
  const recruiterRoot = rootDomain(recruiterEmailDomain)
  const profileEvidence = evidence.filter(item => {
    const text = normalizeText(`${item.source} ${item.type} ${item.snippet} ${item.url || ''}`)
    return text.includes('linkedin') && (text.includes('recruiter') || text.includes('talent') || text.includes('hiring') || text.includes('people'))
  })
  const evidenceIds = profileEvidence.map(item => item.id || '').filter(Boolean)

  if (recruiterEmailDomain && isFreeEmailDomain(recruiterEmailDomain)) {
    return { status: 'risky', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (officialRoot && recruiterRoot && officialRoot === recruiterRoot) {
    return { status: profileEvidence.length > 0 || recruiterProfile ? 'verified' : 'domain-match', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (recruiterEmailDomain && officialRoot && recruiterRoot && officialRoot !== recruiterRoot) {
    return { status: 'risky', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (profileEvidence.length > 0 || recruiterProfile) {
    return { status: 'platform-match', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  if (recruiterName || recruiterEmailDomain || extractedClaims.recruiterPhone) {
    return { status: 'unverified', recruiterName, recruiterEmailDomain, evidenceIds }
  }

  return { status: 'unknown', evidenceIds }
}

function mismatchHostsFromEvidence(item: EvidenceItem) {
  const text = `${item.snippet || ''} ${item.url || ''}`
  const submittedHost = text.match(/\bsubmitted apply domain\s+([a-z0-9.-]+\.[a-z]{2,})\b/i)?.[1]?.toLowerCase()
  const claimedOfficialHost = text.match(/\bofficial company domain\s+([a-z0-9.-]+\.[a-z]{2,})\b/i)?.[1]?.toLowerCase()
  return { submittedHost, claimedOfficialHost }
}

function isTrustedJobBoardHost(host?: string) {
  return Boolean(host && /(?:^|\.)((linkedin|indeed|jobstreet)\.com|greenhouse\.io|lever\.co|ashbyhq\.com|smartrecruiters\.com|workdayjobs\.com|myworkdayjobs\.com)$/i.test(host))
}

function isComparableAggregatorHost(host?: string) {
  return Boolean(host && /(?:^|\.)(talent\.com|trabajo\.org|jobsora\.com|jooble\.org|simplyhired\.com|careerjet\.[a-z.]+)$/i.test(host))
}

function isActionableApplyPathMismatch(item: EvidenceItem, officialHost?: string) {
  const { submittedHost, claimedOfficialHost } = mismatchHostsFromEvidence(item)
  if (isTrustedJobBoardHost(submittedHost) && claimedOfficialHost && rootDomain(submittedHost) !== rootDomain(claimedOfficialHost)) return false
  if (
    claimedOfficialHost &&
    officialHost &&
    rootDomain(claimedOfficialHost) !== rootDomain(officialHost)
  ) return false

  if (isTrustedJobBoardHost(submittedHost) && isComparableAggregatorHost(claimedOfficialHost)) return false

  return true
}

function addSignal(signals: IntelligenceSignal[], signal: IntelligenceSignal) {
  if (!signals.some(existing => existing.id === signal.id)) signals.push(signal)
}

function applyTrace(trace: ScoreTraceItem[], score: number, step: string, delta: number, reason: string) {
  const scoreAfter = clampScore(score + delta)
  trace.push({ step, delta, scoreAfter, reason })
  return scoreAfter
}

function buildNextSteps(verdict: AuditReport['verdict'], company: string) {
  if (verdict === 'high-risk') {
    return [
      'Do not send money, IDs, bank details, or verification codes.',
      'Verify the company through its official website and LinkedIn page.',
      'Use the evidence links above to confirm whether the recruiter and job post match.',
      'Prefer applying through official careers pages or trusted job boards.',
    ]
  }

  if (verdict === 'caution') {
    return [
      `Ask ${company} for the official job post, recruiter identity, and interview process.`,
      'Compare the salary and requirements against the similar roles listed above.',
      'Avoid moving the conversation to unofficial chat apps until verified.',
      'Pause if they ask for fees, purchases, personal IDs, or urgent action.',
    ]
  }

  return [
    'Apply through the official company or job-board channel.',
    'Confirm the recruiter profile and interview schedule before sharing sensitive details.',
    'Keep a copy of the job post and evidence for your records.',
  ]
}

function deriveIntelligence(
  extractedClaims: ExtractedClaims,
  evidence: EvidenceItem[],
  redFlags: string[],
  greenFlags: string[],
  baseScore: number,
): { intelligence: IntelligenceSummary; riskScore: number; operations: AuditOperations } {
  const signals: IntelligenceSignal[] = []
  const scoreTrace: ScoreTraceItem[] = []
  let score = applyTrace(scoreTrace, 25, 'Baseline', 0, 'Every HireProof v2 report starts from a cautious baseline.')

  const byType = (type: string) => evidence.filter(item => item.type === type)
  const officialEvidence = byType('Official Company Presence')
  const localEvidence = evidence.filter(item => item.type === 'Verified Local Presence' || item.type === 'Local Presence')
  const verifiedLocalEvidence = byType('Verified Local Presence')
  const comparableEvidence = byType('Comparable Jobs')
  const officialHost = hostnameFromUrl(officialEvidence.find(item => item.url)?.url)
  const mismatchEvidence = byType('Apply Path Mismatch').filter(item => isActionableApplyPathMismatch(item, officialHost))
  const reputationRiskEvidence = evidence.filter(item => item.type === 'Reputation' && /risk signal|scam|fraud|fake|impersonat|phishing|lawsuit|warning/i.test(item.snippet || ''))
  const staleEvidence = evidence.filter(item => item.freshness === 'stale')
  const weakEvidence = evidence.filter(item => item.sourceQuality === 'weak')
  const companyProfileMode = inferCompanyProfileMode(extractedClaims, evidence, verifiedLocalEvidence)
  const digitalFootprintEvidence = evidence.filter(item =>
    item.sourceQuality === 'official' ||
    item.sourceQuality === 'reputable' ||
    /\b(linkedin|crunchbase|wellfound|angellist|github|y combinator|yc)\b/i.test(`${item.source} ${item.snippet} ${item.url || ''}`)
  )

  if (officialEvidence.length > 0) {
    addSignal(signals, {
      id: 'company_official_match',
      label: 'Official company footprint matched',
      direction: 'trust',
      severity: 'high',
      weight: -14,
      evidenceIds: officialEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'The company appears in official web or knowledge-graph evidence.',
    })
    score = applyTrace(scoreTrace, score, 'Company identity', -14, 'Official company presence lowers impersonation risk.')
  } else if (normalizeText(extractedClaims.company).includes('unknown')) {
    addSignal(signals, {
      id: 'company_unverified',
      label: 'Company identity is not verifiable',
      direction: 'risk',
      severity: 'high',
      weight: 18,
      evidenceIds: [],
      rationale: 'A job opportunity without a verifiable company identity is materially riskier.',
    })
    score = applyTrace(scoreTrace, score, 'Company identity', 18, 'Company name could not be confidently verified.')
  }

  if (companyProfileMode === 'startup_remote' && digitalFootprintEvidence.length >= 2) {
    addSignal(signals, {
      id: 'startup_digital_footprint',
      label: 'Startup digital footprint is consistent',
      direction: 'trust',
      severity: 'medium',
      weight: -8,
      evidenceIds: digitalFootprintEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Remote startups are evaluated on consistent official, founder, product, LinkedIn, and reputable platform evidence rather than requiring a local office footprint.',
    })
    score = applyTrace(scoreTrace, score, 'Company profile mode', -8, 'Startup-remote profile has enough consistent digital footprint evidence.')
  } else if (companyProfileMode === 'established_remote' && digitalFootprintEvidence.length >= 2) {
    addSignal(signals, {
      id: 'remote_digital_footprint',
      label: 'Remote-company digital footprint is consistent',
      direction: 'trust',
      severity: 'medium',
      weight: -6,
      evidenceIds: digitalFootprintEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Remote roles are weighted toward official domain, company profile, reputable job board, and apply-host consistency.',
    })
    score = applyTrace(scoreTrace, score, 'Company profile mode', -6, 'Remote profile has consistent digital footprint evidence.')
  }

  if (verifiedLocalEvidence.length > 0) {
    addSignal(signals, {
      id: 'local_presence_verified',
      label: 'Local business presence verified',
      direction: 'trust',
      severity: 'medium',
      weight: -10,
      evidenceIds: verifiedLocalEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Maps/place evidence includes contact or address details for the claimed company.',
    })
    score = applyTrace(scoreTrace, score, 'Local presence', -10, 'Verified local footprint supports legitimacy.')
  } else if (redFlags.some(flag => /no local/i.test(flag)) && companyProfileMode !== 'startup_remote' && companyProfileMode !== 'established_remote') {
    addSignal(signals, {
      id: 'local_presence_missing',
      label: 'No local footprint found',
      direction: 'risk',
      severity: 'medium',
      weight: 8,
      evidenceIds: [],
      rationale: 'The audit could not find local presence for a company claiming a local hiring footprint.',
    })
    score = applyTrace(scoreTrace, score, 'Local presence', 8, 'No matching local presence was found.')
  } else if (redFlags.some(flag => /no local/i.test(flag))) {
    addSignal(signals, {
      id: 'remote_local_presence_not_required',
      label: 'Local footprint is not required for this remote profile',
      direction: 'neutral',
      severity: 'low',
      weight: 0,
      evidenceIds: digitalFootprintEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Missing Maps or office evidence is not treated as a strong risk for remote/startup roles when the digital footprint is otherwise consistent.',
    })
    score = applyTrace(scoreTrace, score, 'Local presence', 0, 'Remote/startup mode avoids penalizing missing local office evidence.')
  }

  const claimedSalary = normalizeCompensation(extractedClaims.salary)
  const seniority = inferSeniority(extractedClaims.role)
  const liveComparableMonthlyValues = comparableEvidence
    .map(item => compensationFromEvidenceSnippet(item.snippet || '')?.monthlyAmount)
    .filter((value): value is number => typeof value === 'number')
  const benchmark = buildHybridSalaryBenchmark({
    role: extractedClaims.role,
    location: extractedClaims.location,
    seniority,
    liveComparableMonthlyValues,
  })
  const liveComparableMedian = median(liveComparableMonthlyValues)
  const comparableMonthly = liveComparableMedian || benchmark.comparableMonthlyAmount
  const salaryRatio = claimedSalary && comparableMonthly ? Number((claimedSalary.monthlyAmount / comparableMonthly).toFixed(2)) : undefined
  const salaryAnomalous = Boolean(claimedSalary && (
    claimedSalary.period === 'week' ||
    (typeof salaryRatio === 'number' && salaryRatio >= 2.5)
  ))

  if (salaryAnomalous) {
    addSignal(signals, {
      id: 'salary_anomaly',
      label: 'Salary is far outside comparable market signals',
      direction: 'risk',
      severity: 'high',
      weight: 22,
      evidenceIds: comparableEvidence.map(item => item.id || '').filter(Boolean),
      rationale: typeof salaryRatio === 'number'
        ? `The claimed pay is ${salaryRatio}x the comparable monthly benchmark for this role/location.`
        : 'The claimed pay is weekly or far above comparable job listings for the role/location.',
    })
    score = applyTrace(scoreTrace, score, 'Market salary', 22, typeof salaryRatio === 'number'
      ? `Claimed compensation is ${salaryRatio}x comparable listings.`
      : 'Claimed compensation is materially above comparable listings.')
  } else if (comparableEvidence.length > 0) {
    addSignal(signals, {
      id: 'market_comparable_found',
      label: 'Comparable market jobs found',
      direction: 'trust',
      severity: 'low',
      weight: -4,
      evidenceIds: comparableEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Comparable roles exist for checking salary and application path realism.',
    })
    score = applyTrace(scoreTrace, score, 'Market salary', -4, 'Comparable jobs provide market context.')
  }

  if (mismatchEvidence.length > 0) {
    addSignal(signals, {
      id: 'apply_path_mismatch',
      label: 'Apply path does not match official company domain',
      direction: 'risk',
      severity: 'high',
      weight: 18,
      evidenceIds: mismatchEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'The submitted apply link appears inconsistent with the official company or apply options.',
    })
    score = applyTrace(scoreTrace, score, 'Apply path', 18, 'Apply domain mismatch is a strong impersonation signal.')
  } else if (/official|careers|linkedin/i.test(extractedClaims.applicationPath)) {
    addSignal(signals, {
      id: 'apply_path_professional',
      label: 'Application path appears professional',
      direction: 'trust',
      severity: 'low',
      weight: -5,
      evidenceIds: officialEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'The post references an official or trusted application path.',
    })
    score = applyTrace(scoreTrace, score, 'Apply path', -5, 'Professional application path lowers risk.')
  }

  const recruiterIdentity = deriveRecruiterIdentity(extractedClaims, evidence, officialHost)
  if (recruiterIdentity.status === 'verified' || recruiterIdentity.status === 'domain-match') {
    addSignal(signals, {
      id: 'recruiter_domain_match',
      label: 'Recruiter identity matches company domain',
      direction: 'trust',
      severity: 'medium',
      weight: -8,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: 'The recruiter email domain matches the official company domain, which lowers impersonation risk.',
    })
    score = applyTrace(scoreTrace, score, 'Recruiter identity', -8, 'Recruiter domain matches official company domain.')
  } else if (recruiterIdentity.status === 'platform-match') {
    addSignal(signals, {
      id: 'recruiter_platform_match',
      label: 'Recruiter profile has a professional platform signal',
      direction: 'trust',
      severity: 'low',
      weight: -4,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: 'A LinkedIn or professional recruiter profile is present, but domain ownership still needs confirmation.',
    })
    score = applyTrace(scoreTrace, score, 'Recruiter identity', -4, 'Professional recruiter profile provides partial identity support.')
  } else if (recruiterIdentity.status === 'risky') {
    addSignal(signals, {
      id: 'recruiter_identity_mismatch',
      label: 'Recruiter identity does not match the company',
      direction: 'risk',
      severity: 'high',
      weight: 20,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: isFreeEmailDomain(recruiterIdentity.recruiterEmailDomain)
        ? 'The recruiter uses a free email domain instead of the official company domain.'
        : 'The recruiter email domain does not match the official company domain.',
    })
    score = applyTrace(scoreTrace, score, 'Recruiter identity', 20, 'Recruiter identity is inconsistent with official company evidence.')
  }

  if (reputationRiskEvidence.length > 0) {
    addSignal(signals, {
      id: 'reputation_risk',
      label: 'Reputation risk signal found',
      direction: 'risk',
      severity: 'high',
      weight: 16,
      evidenceIds: reputationRiskEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Company-specific news or reputation results include scam, fraud, warning, or impersonation language.',
    })
    score = applyTrace(scoreTrace, score, 'Reputation', 16, 'Company-specific negative reputation evidence increases risk.')
  }

  if (staleEvidence.length > 0) {
    addSignal(signals, {
      id: 'stale_evidence',
      label: 'Some evidence is stale',
      direction: 'neutral',
      severity: 'low',
      weight: 4,
      evidenceIds: staleEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Older search/news evidence is kept visible, but it carries less confidence than fresh or recent sources.',
    })
    score = applyTrace(scoreTrace, score, 'Evidence freshness', 4, 'Stale evidence slightly reduces confidence in the current-state match.')
  }

  if (weakEvidence.length > 0) {
    addSignal(signals, {
      id: 'weak_source_present',
      label: 'Weak source found',
      direction: 'neutral',
      severity: 'low',
      weight: 2,
      evidenceIds: weakEvidence.map(item => item.id || '').filter(Boolean),
      rationale: 'Directory or mirror results are retained for transparency but ranked below official, registry, maps, LinkedIn, and trusted job-board sources.',
    })
    score = applyTrace(scoreTrace, score, 'Source quality', 2, 'Weak mirrored sources have lower evidentiary value.')
  }

  const contactMethod = normalizeText(extractedClaims.contactMethod)
  if (contactMethod.includes('telegram') || contactMethod.includes('whatsapp')) {
    const offPlatformWeight = recruiterIdentity.status === 'verified' || recruiterIdentity.status === 'domain-match' ? 8 : contactMethod.includes('telegram') ? 16 : 12
    addSignal(signals, {
      id: 'off_platform_contact',
      label: 'Off-platform recruiter contact',
      direction: 'risk',
      severity: offPlatformWeight >= 16 ? 'high' : 'medium',
      weight: offPlatformWeight,
      evidenceIds: recruiterIdentity.evidenceIds,
      rationale: offPlatformWeight < 12
        ? 'Off-platform contact is still risky, but verified recruiter/company-domain evidence reduces the severity.'
        : 'Telegram or WhatsApp-only hiring paths commonly bypass official recruiter verification.',
    })
    score = applyTrace(scoreTrace, score, 'Contact method', offPlatformWeight, 'Off-platform contact increases job-scam risk.')
  }

  const finalDelta = Math.max(0, clampScore(baseScore) - score)
  score = applyTrace(scoreTrace, score, 'Policy reconciliation', finalDelta, 'Legacy red/green flags can raise the score, while v2 evidence-specific risk is preserved.')

  const submittedHost = hostnameFromUrl(mismatchEvidence.find(item => item.url)?.url)
  const companyCoverage: IntelligenceSummary['coverage']['company'] = officialEvidence.length > 0 ? 'verified' : byType('Company Check').length > 0 ? 'partial' : 'missing'
  const localCoverage: IntelligenceSummary['coverage']['local'] = verifiedLocalEvidence.length > 0 ? 'verified' : localEvidence.length > 0 ? 'partial' : 'missing'
  const reputationCoverage: IntelligenceSummary['coverage']['reputation'] = reputationRiskEvidence.length > 0 ? 'risk' : byType('Reputation').length > 0 ? 'clear' : 'missing'
  const marketCoverage: IntelligenceSummary['coverage']['market'] = salaryAnomalous ? 'anomalous' : comparableEvidence.length > 0 ? 'normal' : 'missing'
  const applyPathStatus: IntelligenceSummary['applyPath']['status'] = mismatchEvidence.length > 0
    ? 'mismatch'
    : /official|careers/i.test(extractedClaims.applicationPath)
      ? 'official'
      : /linkedin|indeed|jobstreet|greenhouse|lever|ashby|smartrecruiters|workday/i.test(extractedClaims.applicationPath)
        ? 'trusted-board'
        : 'unknown'
  const missingCoverageCount = [companyCoverage, localCoverage, reputationCoverage, marketCoverage, applyPathStatus]
    .filter(status => status === 'missing' || status === 'unknown').length
  const hasNamedCompany = !normalizeText(extractedClaims.company).includes('unknown') && normalizeText(extractedClaims.company).length > 2
  const coverageBackfill: NonNullable<AuditOperations>['coverageBackfill'] = hasNamedCompany && (evidence.length < 3 || missingCoverageCount >= 3)
    ? {
        status: 'degraded',
        message: 'Limited evidence coverage: HireProof identified the job page, but company identity, reputation, local footprint, or market comparables need more receipts before treating the result as fully verified.',
      }
    : undefined

  if (coverageBackfill) {
    addSignal(signals, {
      id: 'limited_evidence_coverage',
      label: 'Evidence coverage is limited',
      direction: 'neutral',
      severity: 'medium',
      weight: 0,
      evidenceIds: evidence.map(item => item.id || '').filter(Boolean).slice(0, 5),
      rationale: 'The report has too few independent receipts to present missing dimensions as verified.',
    })
    scoreTrace.push({
      step: 'Evidence coverage',
      delta: 0,
      scoreAfter: clampScore(score),
      reason: 'Sparse coverage is disclosed to the user and treated as a confidence limitation.',
    })
  }

  return {
    riskScore: clampScore(Math.max(baseScore, score)),
    intelligence: {
      coverage: {
        company: companyCoverage,
        local: localCoverage,
        recruiter: recruiterIdentity.status === 'verified' || recruiterIdentity.status === 'domain-match'
          ? 'verified'
          : recruiterIdentity.status === 'risky'
            ? 'risk'
            : recruiterIdentity.status === 'platform-match' || recruiterIdentity.status === 'unverified'
              ? 'partial'
              : 'missing',
        reputation: reputationCoverage,
        market: marketCoverage,
        applyPath: applyPathStatus,
      },
      companyProfileMode,
      companyIdentity: {
        status: officialEvidence.length > 0 ? 'matched' : byType('Company Check').length > 0 ? 'partial' : 'unverified',
        officialDomain: officialHost,
        evidenceIds: [...officialEvidence, ...byType('Company Check')].map(item => item.id || '').filter(Boolean),
      },
      recruiterIdentity,
      localPresence: {
        status: verifiedLocalEvidence.length > 0 ? 'verified' : localEvidence.length > 0 ? 'partial' : 'missing',
        evidenceIds: localEvidence.map(item => item.id || '').filter(Boolean),
      },
      marketBenchmark: {
        status: salaryAnomalous ? 'anomalous' : comparableEvidence.length > 0 ? 'normal' : 'missing',
        claimedMonthlyAmount: claimedSalary?.monthlyAmount,
        comparableMonthlyAmount: comparableMonthly,
        currency: claimedSalary?.currency || benchmark.currency,
        ratio: salaryRatio,
        seniority,
        country: benchmark.country,
        source: benchmark.source,
        evidenceIds: comparableEvidence.map(item => item.id || '').filter(Boolean),
      },
      applyPath: {
        status: applyPathStatus,
        submittedHost,
        officialHost,
        evidenceIds: mismatchEvidence.map(item => item.id || '').filter(Boolean),
      },
      signals,
      scoreTrace,
    },
    operations: {
      coverageBackfill,
      salaryBenchmark: {
        source: benchmark.source,
        country: benchmark.country,
        currency: benchmark.currency,
        message: benchmark.source === 'serpapi-live-comparables'
          ? 'Salary benchmark used fresh live comparable job evidence.'
          : 'Salary benchmark used a seeded country/role band because live comparables were sparse.',
      },
      falsePositiveControl: {
        profileModeExplanation: companyProfileMode === 'startup_remote'
          ? 'HireProof detected a remote startup profile, so missing local office or Maps evidence did not hurt the score when official and reputable digital footprint evidence was consistent.'
          : companyProfileMode === 'established_remote'
            ? 'HireProof detected an established remote role, so official domain, trusted job-board, and recruiter consistency were weighted above local office evidence.'
            : undefined,
      },
    },
  }
}

export function buildAuditReportV2(input: BuildReportV2Input): AuditReportV2 {
  const evidence = attachEvidenceMetadata([...(input.enrichmentEvidence || []), ...(input.evidence || [])])
  const trustedJobPageEvidence = hasTrustedJobPageEvidence(evidence)
  let redFlags = [
    ...extractRedFlags(input.extractedClaims, evidence),
    ...(input.enrichmentRedFlags || []),
  ]
  if (trustedJobPageEvidence) {
    redFlags = redFlags.filter(flag => !/no supporting evidence/i.test(flag))
  }
  const greenFlags = extractGreenFlags(input.extractedClaims, evidence)
  const preliminaryProfileMode = inferCompanyProfileMode(
    input.extractedClaims,
    evidence,
    evidence.filter(item => item.type === 'Verified Local Presence'),
  )

  if (preliminaryProfileMode === 'startup_remote' || preliminaryProfileMode === 'established_remote') {
    redFlags = redFlags.filter(flag => !/no local/i.test(flag))
  }

  if (normalizeText(input.extractedClaims.company).includes('unknown')) {
    redFlags.push('Company name could not be confidently extracted from the post')
  }

  const baseScore = Math.max(
    calculateRiskScore(input.extractedClaims, redFlags, greenFlags, evidence),
    (input.enrichmentRedFlags || []).length > 0 ? 45 : 0,
  )
  const { intelligence, riskScore, operations } = deriveIntelligence(input.extractedClaims, evidence, redFlags, greenFlags, baseScore)
  const verdict = determineVerdict(riskScore)
  const salaryBenchmarkOperation = operations?.salaryBenchmark
    ? {
        ...operations.salaryBenchmark,
        ...(input.operations?.salaryBenchmark || {}),
      }
    : input.operations?.salaryBenchmark

  return {
    id: input.id,
    version: '2',
    verdict,
    riskScore,
    confidence: getConfidenceLabel(riskScore, evidence.length),
    summary: generateSummary(verdict, riskScore, redFlags),
    extractedClaims: input.extractedClaims,
    redFlags,
    greenFlags,
    evidence,
    alternatives: buildVerifiedAlternativeJobs(evidence),
    nextSteps: buildNextSteps(verdict, input.extractedClaims.company),
    timestamp: new Date().toISOString(),
    mode: 'live',
    credentialMode: input.credentialMode,
    ownerId: input.ownerId,
    apiKeyId: input.apiKeyId,
    source: input.source,
    chatPlatform: input.chatPlatform,
    chatThreadId: input.chatThreadId,
    chatChannelId: input.chatChannelId,
    publiclyListed: input.publiclyListed ?? true,
    intelligence,
    operations: {
      ...(operations || {}),
      ...(input.operations || {}),
      salaryBenchmark: salaryBenchmarkOperation,
      falsePositiveControl: {
        ...(operations?.falsePositiveControl || {}),
        ...(input.operations?.falsePositiveControl || {}),
      },
      liveSearch: input.operations?.liveSearch || operations?.liveSearch,
    },
  }
}
