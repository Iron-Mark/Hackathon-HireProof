import type { AuditOperations, EvidenceItem, ExtractedClaims, OperationalStatus } from '@/lib/schemas'
import {
  ensureSerpApiEvidenceCoverage,
  getSerpApiOperationalStatus,
  hasSerpApiKey,
  runSmartSerpApiInvestigation,
} from '@/lib/serpapi'

type EvidenceProviderName =
  | 'serpapi'
  | 'rdap'
  | 'dns'
  | 'safeBrowsing'
  | 'certificateTransparency'
  | 'threatIntel'
  | 'companyRegistry'
  | 'urlscan'

type EvidenceProviderStatus = OperationalStatus & {
  provider?: EvidenceProviderName
  fetchedAt?: string
  expiresAt?: string
  rateLimitedUntil?: string
}

type EvidenceProviderResult = EvidenceProviderStatus & {
  evidence?: EvidenceItem[]
}

type EvidenceTargets = {
  officialDomain?: string
  applyDomain?: string
  recruiterDomain?: string
  contactDomains: string[]
  urls: string[]
  companyName?: string
  role?: string
  location?: string
}

type EvidenceBrokerInput = {
  claims: Pick<ExtractedClaims, 'company' | 'role' | 'salary' | 'location' | 'contactMethod' | 'applicationPath'> & Partial<ExtractedClaims>
  applicationUrl?: string
  text?: string
  existingEvidence?: EvidenceItem[]
}

type ProviderContext = {
  targets: EvidenceTargets
  now: number
  timeoutMs: number
}

type EvidenceBrokerProviders = {
  rdap?: (domain: string, context: ProviderContext) => Promise<EvidenceProviderResult>
  dns?: (domain: string, context: ProviderContext) => Promise<EvidenceProviderResult>
  safeBrowsing?: (urls: string[], context: ProviderContext) => Promise<EvidenceProviderResult>
  certificateTransparency?: (domain: string, context: ProviderContext) => Promise<EvidenceProviderResult>
  threatIntel?: (targets: EvidenceTargets, context: ProviderContext) => Promise<EvidenceProviderResult>
  companyRegistry?: (companyName: string, context: ProviderContext) => Promise<EvidenceProviderResult>
  urlscan?: (targets: EvidenceTargets, context: ProviderContext) => Promise<EvidenceProviderResult>
}

type EvidenceBrokerOptions = {
  serpapiKey?: string
  liveSearchAllowed?: boolean
  providers?: EvidenceBrokerProviders
  now?: number
  timeoutMs?: number
  totalBudgetMs?: number
  useCache?: boolean
  externalEvidenceAllowed?: boolean
}

type EvidenceBrokerResult = {
  evidence: EvidenceItem[]
  operations: NonNullable<AuditOperations> & {
    evidenceProviders: Partial<Record<EvidenceProviderName, EvidenceProviderStatus>>
  }
  targets: EvidenceTargets
}

const DEFAULT_PROVIDER_TIMEOUT_MS = Number(process.env.EVIDENCE_PROVIDER_TIMEOUT_MS || 3500)
const DEFAULT_TOTAL_BUDGET_MS = Number(process.env.EVIDENCE_PROVIDER_TOTAL_BUDGET_MS || 9000)
const DEFAULT_CACHE_TTL_MS = Number(process.env.EVIDENCE_CACHE_TTL_MS || 6 * 60 * 60 * 1000)
const MAX_DOMAINS_PER_AUDIT = 6
const TRUSTED_APPLY_ROOTS = new Set([
  'linkedin.com',
  'indeed.com',
  'jobstreet.com',
  'glassdoor.com',
  'greenhouse.io',
  'lever.co',
  'ashbyhq.com',
  'smartrecruiters.com',
  'workdayjobs.com',
  'myworkdayjobs.com',
])
const SHARED_JOB_PLATFORM_ROOTS = new Set([
  ...TRUSTED_APPLY_ROOTS,
  'talent.com',
  'trabajo.org',
  'foundit.com.ph',
])
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
])

const localEvidenceCache = new Map<string, { expiresAt: number; evidence: EvidenceItem[]; statuses: Partial<Record<EvidenceProviderName, EvidenceProviderStatus>> }>()

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeText(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.:%/@_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanHost(value?: string) {
  if (!value) return undefined
  const trimmed = String(value).trim().toLowerCase()
  if (!trimmed) return undefined
  try {
    return new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`).hostname
      .replace(/^www\./, '')
      .replace(/\.$/, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split(':')[0]
      .replace(/\.$/, '') || undefined
  }
}

function rootDomain(host?: string) {
  const cleaned = cleanHost(host)
  if (!cleaned) return undefined
  const parts = cleaned.split('.').filter(Boolean)
  if (parts.length <= 2) return cleaned
  const lastTwo = parts.slice(-2).join('.')
  const lastThree = parts.slice(-3).join('.')
  if (/\b(co|com|net|org|gov|edu)\.[a-z]{2}$/.test(lastTwo) && parts.length >= 3) return lastThree
  return lastTwo
}

function urlFromEvidence(item?: EvidenceItem) {
  if (!item) return undefined
  const text = `${item.url || ''} ${item.snippet || ''}`
  return extractUrls(text)[0]
}

function extractUrls(text?: string) {
  const value = String(text || '')
  const matches = value.match(/\bhttps?:\/\/[^\s<>)"']+/gi) || []
  return Array.from(new Set(matches.map((url) => url.replace(/[),.;]+$/, ''))))
}

function extractEmailDomains(text?: string) {
  const value = String(text || '')
  const matches = value.match(/\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi) || []
  return Array.from(new Set(matches
    .map((email) => email.split('@')[1])
    .map(cleanHost)
    .filter(Boolean) as string[]))
}

function addUnique<T>(items: T[], value: T) {
  if (!value || items.includes(value)) return
  items.push(value)
}

function isKnownCompany(company?: string) {
  const text = normalizeText(company || '')
  return Boolean(text && !text.includes('unknown') && !text.includes('not verifiable'))
}

function isTrustedApplyDomain(domain?: string) {
  const root = rootDomain(domain)
  return Boolean(root && TRUSTED_APPLY_ROOTS.has(root))
}

function evidence(
  source: string,
  type: string,
  snippet: string,
  url?: string,
  extras: Partial<EvidenceItem> = {},
): EvidenceItem {
  return {
    source,
    type,
    snippet: snippet.slice(0, 2000),
    ...(url ? { url } : {}),
    ...extras,
  }
}

function operationStatus(
  provider: EvidenceProviderName,
  status: NonNullable<OperationalStatus['status']>,
  message: string,
  now: number,
  extras: Partial<EvidenceProviderStatus> = {},
): EvidenceProviderStatus {
  return {
    provider,
    status,
    message,
    fetchedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + DEFAULT_CACHE_TTL_MS).toISOString(),
    ...extras,
  }
}

function mergeProviderStatus(
  provider: EvidenceProviderName,
  current: EvidenceProviderStatus | undefined,
  next: EvidenceProviderResult | EvidenceProviderStatus | undefined,
  now: number,
) {
  if (!next) return current
  const base: EvidenceProviderStatus = {
    provider,
    status: next.status || 'ok',
    message: next.message,
    retryAfterSec: next.retryAfterSec,
    fetchedAt: next.fetchedAt || new Date(now).toISOString(),
    expiresAt: next.expiresAt || new Date(now + DEFAULT_CACHE_TTL_MS).toISOString(),
    rateLimitedUntil: next.rateLimitedUntil,
  }
  if (!current) return base
  if (current.status === 'ok' || base.status === 'ok') {
    return {
      ...current,
      ...base,
      status: current.status === 'ok' ? current.status : base.status,
      message: [current.message, base.message].filter(Boolean).join(' '),
    }
  }
  return {
    ...current,
    ...base,
    message: [current.message, base.message].filter(Boolean).join(' '),
  }
}

function makeCacheKey(targets: EvidenceTargets) {
  return [
    normalizeText(targets.companyName || ''),
    normalizeText(targets.role || ''),
    normalizeText(targets.location || ''),
    targets.officialDomain || '',
    targets.applyDomain || '',
    targets.recruiterDomain || '',
    ...targets.contactDomains,
  ].filter(Boolean).join('|').slice(0, 500)
}

function dedupeEvidence(items: EvidenceItem[]) {
  const seen = new Set<string>()
  const output: EvidenceItem[] = []
  for (const item of items) {
    const key = normalizeText(`${item.source}|${item.type}|${item.url || ''}|${item.snippet}`)
    if (seen.has(key)) continue
    seen.add(key)
    output.push(item)
  }
  return output.slice(0, 100)
}

function isLowValueSharedPlatformUrlscanEvidence(item: EvidenceItem, targets: EvidenceTargets) {
  if (item.source !== 'urlscan.io' || item.type !== 'URL Intelligence') return false
  if (item.trustLevel === 'risk') return false
  const domain = rootDomain(targets.applyDomain || targets.officialDomain || targets.contactDomains[0] || cleanHost(item.url))
  return Boolean(domain && SHARED_JOB_PLATFORM_ROOTS.has(domain))
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

async function fetchJson(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS): Promise<any> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    const text = await response.text()
    let body: any = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    return { response, body }
  } finally {
    clearTimeout(timer)
  }
}

async function defaultRdapProvider(domain: string, context: ProviderContext): Promise<EvidenceProviderResult> {
  const host = rootDomain(domain) || domain
  const { response, body } = await fetchJson(`https://rdap.cloud/domain/${encodeURIComponent(host)}`, {}, context.timeoutMs)
  if (response.status === 429) {
    return {
      status: 'throttled',
      retryAfterSec: Number(response.headers.get('retry-after') || 300),
      message: `RDAP was rate-limited for ${host}.`,
    }
  }
  if (!response.ok) return { status: 'degraded', message: `RDAP did not return usable data for ${host}.` }

  const events = Array.isArray(body?.events) ? body.events : []
  const registration = events.find((item: any) => /registration/i.test(item?.eventAction || ''))?.eventDate
  const expiration = events.find((item: any) => /expiration/i.test(item?.eventAction || ''))?.eventDate
  const ageDays = registration ? Math.max(0, Math.floor((context.now - Date.parse(registration)) / 86400000)) : undefined
  const nameservers = Array.isArray(body?.nameservers)
    ? body.nameservers.map((item: any) => item?.ldhName).filter(Boolean).slice(0, 3).join(', ')
    : ''
  const status = Array.isArray(body?.status) ? body.status.join(', ') : ''
  const risk = typeof ageDays === 'number' && ageDays <= 45
  const snippetParts = [
    risk ? `Risk signal: ${host} appears newly registered` : `${host} has RDAP registration evidence`,
    registration ? `registered ${registration.slice(0, 10)}` : '',
    expiration ? `expires ${expiration.slice(0, 10)}` : '',
    nameservers ? `nameservers: ${nameservers}` : '',
    status ? `status: ${status}` : '',
  ].filter(Boolean)

  return {
    status: 'ok',
    evidence: [evidence('RDAP domain registry', 'Domain Age', snippetParts.join(' | '), `https://rdap.cloud/domain/${host}`, {
      sourceType: 'domain',
      trustLevel: risk ? 'risk' : 'medium',
      sourceQuality: risk ? 'risky' : 'public',
      matchConfidence: typeof ageDays === 'number' ? 0.78 : 0.55,
    })],
  }
}

async function fetchDnsRecord(domain: string, type: string, timeoutMs: number) {
  const cloudflare = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`
  try {
    const { response, body } = await fetchJson(cloudflare, { headers: { accept: 'application/dns-json' } }, timeoutMs)
    if (response.ok) return body
  } catch {
    // Fall back to Google DNS below.
  }
  const google = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${encodeURIComponent(type)}`
  const { response, body } = await fetchJson(google, {}, timeoutMs)
  if (!response.ok) return null
  return body
}

async function defaultDnsProvider(domain: string, context: ProviderContext): Promise<EvidenceProviderResult> {
  const host = rootDomain(domain) || domain
  const types = ['A', 'AAAA', 'MX', 'NS', 'CNAME']
  const results = await Promise.all(types.map(async (type) => [type, await fetchDnsRecord(host, type, context.timeoutMs)] as const))
  const present = results
    .filter(([, body]) => Array.isArray(body?.Answer) && body.Answer.length > 0)
    .map(([type, body]) => `${type}:${body.Answer.length}`)
  const hasAddress = present.some((item) => item.startsWith('A:') || item.startsWith('AAAA:'))
  const hasMx = present.some((item) => item.startsWith('MX:'))
  const hasNs = present.some((item) => item.startsWith('NS:'))

  if (present.length === 0) {
    return {
      status: 'degraded',
      evidence: [evidence('DNS over HTTPS', 'DNS Liveness', `Risk signal: ${host} did not return common A, AAAA, MX, NS, or CNAME records.`, undefined, {
        sourceType: 'dns',
        trustLevel: 'risk',
        sourceQuality: 'risky',
      })],
    }
  }

  return {
    status: 'ok',
    evidence: [evidence('DNS over HTTPS', 'DNS Liveness', `${host} DNS records found (${present.join(', ')}). Address records: ${hasAddress ? 'yes' : 'no'}. Mail records: ${hasMx ? 'yes' : 'no'}. Nameservers: ${hasNs ? 'yes' : 'no'}.`, undefined, {
      sourceType: 'dns',
      trustLevel: hasAddress || hasNs ? 'medium' : 'low',
      sourceQuality: 'public',
      matchConfidence: 0.68,
    })],
  }
}

async function defaultSafeBrowsingProvider(urls: string[], context: ProviderContext): Promise<EvidenceProviderResult> {
  const key = process.env.GOOGLE_SAFE_BROWSING_API_KEY?.trim()
  if (!key) return { status: 'not-live', message: 'Google Safe Browsing key is not configured.' }
  const uniqueUrls = Array.from(new Set(urls)).slice(0, 10)
  if (uniqueUrls.length === 0) return { status: 'not-live', message: 'No full URLs available for Safe Browsing.' }

  const { response, body } = await fetchJson(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client: { clientId: 'hireproof', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: uniqueUrls.map((url) => ({ url })),
      },
    }),
  }, context.timeoutMs)

  if (response.status === 429) return { status: 'throttled', message: 'Safe Browsing quota was reached.' }
  if (!response.ok) return { status: 'degraded', message: 'Safe Browsing did not return usable data.' }
  const matches = Array.isArray(body?.matches) ? body.matches : []
  if (matches.length === 0) return { status: 'ok', message: 'Safe Browsing returned no known-bad matches; this is neutral, not proof of safety.' }

  return {
    status: 'ok',
    evidence: matches.slice(0, 5).map((match: any) => evidence(
      'Google Safe Browsing',
      'Known Phishing Check',
      `Risk signal: URL matched ${match.threatType || 'known'} threat list.`,
      match?.threat?.url,
      {
        sourceType: 'threat-intel',
        trustLevel: 'risk',
        sourceQuality: 'risky',
        matchConfidence: 0.96,
      },
    )),
  }
}

async function defaultCertificateTransparencyProvider(domain: string, context: ProviderContext): Promise<EvidenceProviderResult> {
  const host = rootDomain(domain) || domain
  const { response, body } = await fetchJson(`https://crt.sh/?q=%25.${encodeURIComponent(host)}&output=json`, {}, context.timeoutMs)
  if (response.status === 429) return { status: 'throttled', message: `crt.sh was rate-limited for ${host}.` }
  if (!response.ok || !Array.isArray(body)) return { status: 'degraded', message: `Certificate Transparency did not return usable data for ${host}.` }
  const rows = body.slice(0, 50)
  if (rows.length === 0) return { status: 'degraded', message: `No certificate transparency rows found for ${host}.` }
  const timestamps = rows
    .map((row: any) => Date.parse(row?.not_before || row?.entry_timestamp || ''))
    .filter(Number.isFinite)
    .sort((a: number, b: number) => a - b)
  const firstSeen = timestamps[0]
  const newest = timestamps[timestamps.length - 1]
  const newestDays = newest ? Math.max(0, Math.floor((context.now - newest) / 86400000)) : undefined
  const risk = typeof newestDays === 'number' && newestDays <= 14 && rows.length <= 3
  const names = Array.from(new Set(rows.flatMap((row: any) => String(row?.name_value || '').split('\n')).filter(Boolean))).slice(0, 5)

  return {
    status: 'ok',
    evidence: [evidence('crt.sh Certificate Transparency', 'Certificate Transparency', [
      risk ? `Risk signal: very recent certificate activity for ${host}` : `Certificate history found for ${host}`,
      firstSeen ? `first seen ${new Date(firstSeen).toISOString().slice(0, 10)}` : '',
      newest ? `newest ${new Date(newest).toISOString().slice(0, 10)}` : '',
      names.length ? `names: ${names.join(', ')}` : '',
    ].filter(Boolean).join(' | '), `https://crt.sh/?q=${host}`, {
      sourceType: 'certificate',
      trustLevel: risk ? 'risk' : 'medium',
      sourceQuality: risk ? 'risky' : 'public',
      matchConfidence: 0.7,
    })],
  }
}

async function defaultThreatIntelProvider(targets: EvidenceTargets, context: ProviderContext): Promise<EvidenceProviderResult> {
  const evidenceItems: EvidenceItem[] = []
  const domains = targets.contactDomains.slice(0, MAX_DOMAINS_PER_AUDIT)

  for (const domain of domains) {
    try {
      const body = new URLSearchParams({ host: domain })
      const { response, body: result } = await fetchJson('https://urlhaus-api.abuse.ch/v1/host/', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      }, context.timeoutMs)
      if (response.ok && result?.query_status === 'ok') {
        evidenceItems.push(evidence('URLhaus', 'Known Phishing Check', `Risk signal: ${domain} appears in URLhaus malicious URL intelligence.`, undefined, {
          sourceType: 'threat-intel',
          trustLevel: 'risk',
          sourceQuality: 'risky',
          matchConfidence: 0.9,
        }))
      }
    } catch {
      // Continue to other threat sources; individual feed failures should not block audit completion.
    }
  }

  const phishTankKey = process.env.PHISHTANK_API_KEY?.trim()
  if (phishTankKey && targets.urls.length > 0) {
    for (const url of targets.urls.slice(0, 5)) {
      try {
        const { response, body } = await fetchJson('https://checkurl.phishtank.com/checkurl/', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ url, format: 'json', app_key: phishTankKey }),
        }, context.timeoutMs)
        if (response.ok && body?.results?.in_database && body?.results?.verified) {
          evidenceItems.push(evidence('PhishTank', 'Known Phishing Check', 'Risk signal: URL appears in verified PhishTank phishing data.', url, {
            sourceType: 'threat-intel',
            trustLevel: 'risk',
            sourceQuality: 'risky',
            matchConfidence: 0.9,
          }))
        }
      } catch {
        // Best-effort only.
      }
    }
  }

  return {
    status: evidenceItems.length > 0 ? 'ok' : 'ok',
    message: evidenceItems.length > 0 ? 'Threat-intel hits found.' : 'No known-bad threat-intel hits found; this is neutral, not proof of safety.',
    evidence: evidenceItems,
  }
}

async function defaultCompanyRegistryProvider(companyName: string, context: ProviderContext): Promise<EvidenceProviderResult> {
  if (!isKnownCompany(companyName)) return { status: 'not-live', message: 'Company name is not specific enough for registry lookup.' }
  const key = process.env.OPENCORPORATES_API_KEY?.trim()
  if (!key) return { status: 'not-live', message: 'OpenCorporates key is not configured.' }
  const url = new URL('https://api.opencorporates.com/v0.4/companies/search')
  url.searchParams.set('q', companyName)
  url.searchParams.set('api_token', key)
  const { response, body } = await fetchJson(url.toString(), {}, context.timeoutMs)
  if (response.status === 429) return { status: 'throttled', message: 'OpenCorporates quota was reached.' }
  if (!response.ok) return { status: 'degraded', message: 'OpenCorporates did not return usable data.' }
  const companies = Array.isArray(body?.results?.companies) ? body.results.companies : []
  if (companies.length === 0) return { status: 'ok', message: 'No OpenCorporates match found; this is neutral.' }
  const company = companies[0]?.company || {}
  return {
    status: 'ok',
    evidence: [evidence('OpenCorporates', 'Company Registry', `Company registry match: ${company.name || companyName}${company.jurisdiction_code ? ` (${company.jurisdiction_code})` : ''}${company.inactive === false ? ' | active' : ''}.`, company.opencorporates_url, {
      sourceType: 'company-registry',
      trustLevel: company.inactive === false ? 'medium' : 'low',
      sourceQuality: 'public',
      matchConfidence: 0.7,
    })],
  }
}

async function defaultUrlscanProvider(targets: EvidenceTargets, context: ProviderContext): Promise<EvidenceProviderResult> {
  const domain = targets.applyDomain || targets.officialDomain || targets.contactDomains[0]
  if (!domain) return { status: 'not-live', message: 'No domain available for urlscan search.' }
  const url = new URL('https://urlscan.io/api/v1/search/')
  url.searchParams.set('q', `domain:${domain}`)
  const headers: Record<string, string> = {}
  const key = process.env.URLSCAN_API_KEY?.trim()
  if (key) headers['API-Key'] = key
  const { response, body } = await fetchJson(url.toString(), { headers }, context.timeoutMs)
  if (response.status === 429) return { status: 'throttled', message: 'urlscan quota was reached; using cached or other evidence only.' }
  if (!response.ok) return { status: 'degraded', message: 'urlscan search did not return usable data.' }
  const results = Array.isArray(body?.results) ? body.results : []
  if (results.length === 0) return { status: 'ok', message: 'No urlscan search results found; this is neutral.' }
  const item = results[0]
  const page = item?.page || {}
  return {
    status: 'ok',
    evidence: [evidence('urlscan.io', 'URL Intelligence', `Existing urlscan result for ${domain}: ${page.title || 'untitled page'}${page.status ? ` | HTTP ${page.status}` : ''}.`, item?.result || page.url, {
      sourceType: 'threat-intel',
      trustLevel: 'low',
      sourceQuality: 'public',
      matchConfidence: 0.55,
    })],
  }
}

function defaultProviders(): Required<EvidenceBrokerProviders> {
  return {
    rdap: defaultRdapProvider,
    dns: defaultDnsProvider,
    safeBrowsing: defaultSafeBrowsingProvider,
    certificateTransparency: defaultCertificateTransparencyProvider,
    threatIntel: defaultThreatIntelProvider,
    companyRegistry: defaultCompanyRegistryProvider,
    urlscan: defaultUrlscanProvider,
  }
}

export function extractEvidenceTargets(input: EvidenceBrokerInput): EvidenceTargets {
  const urls: string[] = [
    ...(input.applicationUrl ? [input.applicationUrl] : []),
    ...extractUrls(input.text),
    ...extractUrls(input.claims.applicationPath),
    ...(input.existingEvidence || []).map(urlFromEvidence).filter((url): url is string => Boolean(url)),
  ]
  const uniqueUrls = Array.from(new Set(urls))
  const contactDomains: string[] = []

  for (const url of uniqueUrls) {
    const host = cleanHost(url)
    if (host) addUnique(contactDomains, host)
  }
  for (const domain of extractEmailDomains(input.text)) addUnique(contactDomains, domain)
  for (const domain of extractEmailDomains(input.claims.recruiterEmail)) addUnique(contactDomains, domain)
  for (const domain of extractEmailDomains(input.claims.applicationPath)) addUnique(contactDomains, domain)

  const applyDomain = cleanHost(input.applicationUrl || uniqueUrls.find(Boolean))
  const recruiterDomain = cleanHost(input.claims.recruiterEmail?.split('@')[1] || extractEmailDomains(input.text)[0])
  const officialEvidence = (input.existingEvidence || []).find((item) => {
    const text = normalizeText(`${item.source} ${item.type} ${item.snippet}`)
    return text.includes('official company presence') || text.includes('knowledge graph') || text.includes('official company website')
  })
  const officialDomain = cleanHost(officialEvidence?.url || urlFromEvidence(officialEvidence))

  if (applyDomain) addUnique(contactDomains, applyDomain)
  if (recruiterDomain) addUnique(contactDomains, recruiterDomain)
  if (officialDomain) addUnique(contactDomains, officialDomain)

  return {
    officialDomain,
    applyDomain,
    recruiterDomain,
    contactDomains: contactDomains.slice(0, MAX_DOMAINS_PER_AUDIT),
    urls: uniqueUrls.slice(0, 10),
    companyName: input.claims.company,
    role: input.claims.role,
    location: input.claims.location,
  }
}

function buildDomainRelationshipEvidence(targets: EvidenceTargets): EvidenceItem[] {
  const output: EvidenceItem[] = []
  const officialRoot = rootDomain(targets.officialDomain)
  const applyRoot = rootDomain(targets.applyDomain)
  const recruiterRoot = rootDomain(targets.recruiterDomain)

  if (targets.applyDomain && officialRoot && applyRoot && officialRoot !== applyRoot && !isTrustedApplyDomain(targets.applyDomain)) {
    output.push(evidence(
      'HireProof domain broker',
      'Domain Mismatch',
      `Risk signal: submitted apply domain ${targets.applyDomain} does not match official company root ${officialRoot}.`,
      undefined,
      { sourceType: 'domain', trustLevel: 'risk', sourceQuality: 'risky', matchConfidence: 0.86 },
    ))
  } else if (targets.applyDomain && officialRoot && applyRoot === officialRoot) {
    output.push(evidence(
      'HireProof domain broker',
      'Domain Mismatch',
      `Trust signal: submitted apply domain ${targets.applyDomain} matches the official company root ${officialRoot}.`,
      undefined,
      { sourceType: 'domain', trustLevel: 'medium', sourceQuality: 'official', matchConfidence: 0.82 },
    ))
  } else if (targets.applyDomain && isTrustedApplyDomain(targets.applyDomain)) {
    output.push(evidence(
      'HireProof domain broker',
      'Domain Mismatch',
      `Trust signal: submitted apply domain ${targets.applyDomain} is a recognized job board or ATS host.`,
      undefined,
      { sourceType: 'domain', trustLevel: 'medium', sourceQuality: 'reputable', matchConfidence: 0.78 },
    ))
  }

  if (targets.recruiterDomain) {
    if (FREE_EMAIL_DOMAINS.has(targets.recruiterDomain)) {
      output.push(evidence(
        'HireProof domain broker',
        'Recruiter Domain Check',
        `Risk signal: recruiter email uses free-mail domain ${targets.recruiterDomain}, not a company-controlled domain.`,
        undefined,
        { sourceType: 'domain', trustLevel: 'risk', sourceQuality: 'risky', matchConfidence: 0.82 },
      ))
    } else if (officialRoot && recruiterRoot && officialRoot !== recruiterRoot) {
      output.push(evidence(
        'HireProof domain broker',
        'Recruiter Domain Check',
        `Risk signal: recruiter email domain ${targets.recruiterDomain} does not match official company root ${officialRoot}.`,
        undefined,
        { sourceType: 'domain', trustLevel: 'risk', sourceQuality: 'risky', matchConfidence: 0.84 },
      ))
    } else if (officialRoot && recruiterRoot === officialRoot) {
      output.push(evidence(
        'HireProof domain broker',
        'Recruiter Domain Check',
        `Trust signal: recruiter email domain ${targets.recruiterDomain} matches official company root ${officialRoot}.`,
        undefined,
        { sourceType: 'domain', trustLevel: 'medium', sourceQuality: 'official', matchConfidence: 0.8 },
      ))
    }
  }

  return output
}

async function runProvider(
  provider: EvidenceProviderName,
  fn: () => Promise<EvidenceProviderResult>,
  context: ProviderContext,
): Promise<EvidenceProviderResult> {
  try {
    const result = await withTimeout(fn(), context.timeoutMs, provider)
    return {
      provider,
      status: result.status || 'ok',
      message: result.message,
      retryAfterSec: result.retryAfterSec,
      fetchedAt: result.fetchedAt || new Date(context.now).toISOString(),
      expiresAt: result.expiresAt || new Date(context.now + DEFAULT_CACHE_TTL_MS).toISOString(),
      rateLimitedUntil: result.rateLimitedUntil,
      evidence: result.evidence || [],
    }
  } catch (error) {
    return {
      provider,
      status: 'degraded',
      message: error instanceof Error ? error.message : `${provider} failed.`,
      fetchedAt: new Date(context.now).toISOString(),
      expiresAt: new Date(context.now + DEFAULT_CACHE_TTL_MS).toISOString(),
      evidence: [],
    }
  }
}

export async function runEvidenceBroker(
  input: EvidenceBrokerInput,
  options: EvidenceBrokerOptions = {},
): Promise<EvidenceBrokerResult> {
  const now = options.now || Date.now()
  const timeoutMs = clamp(options.timeoutMs || DEFAULT_PROVIDER_TIMEOUT_MS, 500, 10_000)
  const totalBudgetMs = clamp(options.totalBudgetMs || DEFAULT_TOTAL_BUDGET_MS, timeoutMs, 30_000)
  const startedAt = Date.now()
  const providerImpl = { ...defaultProviders(), ...(options.providers || {}) }
  const existingEvidence = input.existingEvidence || []
  const targets = extractEvidenceTargets(input)
  const cacheKey = makeCacheKey(targets)
  const useCache = options.useCache !== false && !options.providers
  const cached = useCache && cacheKey ? localEvidenceCache.get(cacheKey) : undefined
  const statuses: Partial<Record<EvidenceProviderName, EvidenceProviderStatus>> = {}
  const evidenceItems: EvidenceItem[] = [...existingEvidence]
  const context: ProviderContext = { targets, now, timeoutMs }

  if (options.externalEvidenceAllowed === false) {
    return {
      evidence: dedupeEvidence(evidenceItems),
      operations: {
        liveSearch: { status: 'not-live', message: 'Demo or non-live audit; external evidence funnel was not needed.' },
        evidenceProviders: {
          serpapi: operationStatus('serpapi', 'not-live', 'Demo or non-live audit; SerpApi was skipped.', now),
        },
      },
      targets,
    }
  }

  if (cached && cached.expiresAt > now) {
    return {
      evidence: dedupeEvidence([...evidenceItems, ...cached.evidence]),
      operations: {
        liveSearch: { status: 'cache-only', message: 'Fresh evidence broker cache was reused.' },
        evidenceProviders: {
          ...cached.statuses,
          serpapi: cached.statuses.serpapi || operationStatus('serpapi', 'cache-only', 'SerpApi evidence came from the evidence broker cache.', now),
        },
      },
      targets,
    }
  }

  const liveSearchAllowed = options.liveSearchAllowed !== false
  const serpapiStatus = getSerpApiOperationalStatus()
  const serpapiAvailable = liveSearchAllowed && hasSerpApiKey(options.serpapiKey) && serpapiStatus.status !== 'circuit-open'

  if (serpapiAvailable) {
    const serpEvidence = await runSmartSerpApiInvestigation(input.claims, {
      serpapiKey: options.serpapiKey,
      applicationUrl: input.applicationUrl,
    })
    const coveredEvidence = await ensureSerpApiEvidenceCoverage([...evidenceItems, ...serpEvidence], input.claims, options.serpapiKey)
    evidenceItems.length = 0
    evidenceItems.push(...coveredEvidence)
    statuses.serpapi = operationStatus('serpapi', 'ok', 'SerpApi live search completed.', now)
  } else {
    statuses.serpapi = operationStatus(
      'serpapi',
      serpapiStatus.status === 'circuit-open' ? 'circuit-open' : 'not-live',
      serpapiStatus.status === 'circuit-open'
        ? serpapiStatus.message || 'SerpApi circuit breaker is open.'
        : 'SerpApi key is not configured or live search is disabled; domain evidence funnel continued.',
      now,
      serpapiStatus.retryAfterSec ? { retryAfterSec: serpapiStatus.retryAfterSec } : {},
    )
  }

  const enrichedTargets = extractEvidenceTargets({ ...input, existingEvidence: evidenceItems })
  evidenceItems.push(...buildDomainRelationshipEvidence(enrichedTargets))

  const domains = enrichedTargets.contactDomains.slice(0, MAX_DOMAINS_PER_AUDIT)
  for (const domain of domains) {
    if (Date.now() - startedAt > totalBudgetMs) break
    const result = await runProvider('rdap', () => providerImpl.rdap(domain, { ...context, targets: enrichedTargets }), context)
    statuses.rdap = mergeProviderStatus('rdap', statuses.rdap, result, now)
    evidenceItems.push(...(result.evidence || []))
  }

  for (const domain of domains) {
    if (Date.now() - startedAt > totalBudgetMs) break
    const result = await runProvider('dns', () => providerImpl.dns(domain, { ...context, targets: enrichedTargets }), context)
    statuses.dns = mergeProviderStatus('dns', statuses.dns, result, now)
    evidenceItems.push(...(result.evidence || []))
  }

  if (Date.now() - startedAt <= totalBudgetMs) {
    const result = await runProvider('safeBrowsing', () => providerImpl.safeBrowsing(enrichedTargets.urls, { ...context, targets: enrichedTargets }), context)
    statuses.safeBrowsing = mergeProviderStatus('safeBrowsing', statuses.safeBrowsing, result, now)
    evidenceItems.push(...(result.evidence || []))
  }

  for (const domain of domains.map(rootDomain).filter(Boolean) as string[]) {
    if (Date.now() - startedAt > totalBudgetMs) break
    const result = await runProvider('certificateTransparency', () => providerImpl.certificateTransparency(domain, { ...context, targets: enrichedTargets }), context)
    statuses.certificateTransparency = mergeProviderStatus('certificateTransparency', statuses.certificateTransparency, result, now)
    evidenceItems.push(...(result.evidence || []))
  }

  if (Date.now() - startedAt <= totalBudgetMs) {
    const result = await runProvider('threatIntel', () => providerImpl.threatIntel(enrichedTargets, { ...context, targets: enrichedTargets }), context)
    statuses.threatIntel = mergeProviderStatus('threatIntel', statuses.threatIntel, result, now)
    evidenceItems.push(...(result.evidence || []))
  }

  if (Date.now() - startedAt <= totalBudgetMs && isKnownCompany(input.claims.company)) {
    const result = await runProvider('companyRegistry', () => providerImpl.companyRegistry(input.claims.company || '', { ...context, targets: enrichedTargets }), context)
    statuses.companyRegistry = mergeProviderStatus('companyRegistry', statuses.companyRegistry, result, now)
    evidenceItems.push(...(result.evidence || []))
  }

  if (Date.now() - startedAt <= totalBudgetMs) {
    const result = await runProvider('urlscan', () => providerImpl.urlscan(enrichedTargets, { ...context, targets: enrichedTargets }), context)
    statuses.urlscan = mergeProviderStatus('urlscan', statuses.urlscan, result, now)
    evidenceItems.push(...(result.evidence || []).filter(item => !isLowValueSharedPlatformUrlscanEvidence(item, enrichedTargets)))
  }

  if (evidenceItems.length === 0) {
    evidenceItems.push(evidence(
      'HireProof Operations',
      'Evidence Providers Unavailable',
      'Evidence providers unavailable: HireProof completed the audit with deterministic heuristics only.',
      undefined,
      { sourceType: 'manual', trustLevel: 'low', sourceQuality: 'weak' },
    ))
  }

  const finalEvidence = dedupeEvidence(evidenceItems)
  const hasOkProvider = Object.values(statuses).some((status) => status?.status === 'ok')
  const liveSearch: OperationalStatus = statuses.serpapi?.status === 'ok'
    ? { status: 'ok', message: 'Live search and evidence funnel completed.' }
    : hasOkProvider
      ? { status: 'degraded', message: 'SerpApi was unavailable, but the free evidence funnel returned supporting domain or threat-intel evidence.' }
      : { status: 'degraded', message: 'External evidence providers were unavailable; deterministic audit heuristics were used.' }

  if (useCache && cacheKey && finalEvidence.length > existingEvidence.length) {
    localEvidenceCache.set(cacheKey, {
      expiresAt: now + DEFAULT_CACHE_TTL_MS,
      evidence: finalEvidence.slice(existingEvidence.length),
      statuses,
    })
  }

  return {
    evidence: finalEvidence,
    operations: {
      liveSearch,
      evidenceProviders: statuses,
    },
    targets: enrichedTargets,
  }
}
