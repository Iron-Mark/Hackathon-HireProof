import type { EvidenceItem, ExtractedClaims, OperationalStatus } from '@/lib/schemas'
import { Redis } from '@upstash/redis'

const SERPAPI_KEY = process.env.SERPAPI_API_KEY
const API_BASE = 'https://serpapi.com/search.json'
const SERPAPI_CACHE_TTL_MS = Number(process.env.SERPAPI_CACHE_TTL_MS || 6 * 60 * 60 * 1000)
const SERPAPI_CACHE_MAX_ENTRIES = Number(process.env.SERPAPI_CACHE_MAX_ENTRIES || 200)
const SERPAPI_CIRCUIT_FAILURE_LIMIT = Number(process.env.SERPAPI_CIRCUIT_FAILURE_LIMIT || 5)
const SERPAPI_CIRCUIT_FAILURE_WINDOW_MS = Number(process.env.SERPAPI_CIRCUIT_FAILURE_WINDOW_MS || 2 * 60 * 1000)
const SERPAPI_CIRCUIT_COOLDOWN_MS = Number(process.env.SERPAPI_CIRCUIT_COOLDOWN_MS || 5 * 60 * 1000)
const SERPAPI_CIRCUIT_NETWORK_CALL_LIMIT_10M = Number(process.env.SERPAPI_CIRCUIT_NETWORK_CALL_LIMIT_10M || 80)

interface SerpApiSearchResult {
  title: string
  link: string
  snippet: string
  displayed_link?: string
  source?: string
  sitelinks?: {
    inline?: Array<{ title?: string; link?: string }>
    expanded?: Array<{ title?: string; link?: string }>
  }
}

interface SerpApiResponse {
  knowledge_graph?: {
    title?: string
    website?: string
    description?: string
    type?: string
  }
  organic_results?: SerpApiSearchResult[]
  news_results?: Array<{
    title: string
    link: string
    source?: string | { name?: string }
    date?: string
  }>
  jobs_results?: Array<{
    title: string
    company_name: string
    location: string
    salary?: string
    via?: string
    description?: string
    detected_extensions?: Record<string, string>
    apply_options?: Array<{ title?: string; link?: string }>
    related_links?: Array<{ link?: string }>
    job_highlights?: Array<{ title?: string; items?: string[] }>
  }>
  local_results?: Array<{
    title: string
    address?: string
    phone?: string
    website?: string
    rating?: number
    reviews?: number
    type?: string
    types?: string[]
    open_state?: string
    hours?: string
    gps_coordinates?: { latitude?: number; longitude?: number }
    place_id_search?: string
  }>
  place_results?: {
    title?: string
    address?: string
    phone?: string
    website?: string
    rating?: number
    reviews?: number
    type?: string
    hours?: string
    gps_coordinates?: { latitude?: number; longitude?: number }
  }
}

type SearchLocale = {
  gl: string
  hl: string
  google_domain: string
  location?: string
}

type SmartEvidenceInput = {
  claims: Pick<ExtractedClaims, 'company' | 'role' | 'salary' | 'location'>
  web?: SerpApiResponse | null
  news?: SerpApiResponse | null
  jobs?: SerpApiResponse | null
  maps?: SerpApiResponse | null
  applicationUrl?: string
}

type SerpApiCacheEntry = {
  expiresAt: number
  value: SerpApiResponse
}

type SmartInvestigationCacheEntry = {
  expiresAt: number
  value: EvidenceItem[]
}

const serpApiResponseCache = new Map<string, SerpApiCacheEntry>()
const smartInvestigationCache = new Map<string, SmartInvestigationCacheEntry>()
const serpApiCacheTelemetry = {
  hits: 0,
  misses: 0,
  persistentHits: 0,
  persistentWrites: 0,
  similarityHits: 0,
  similarityMisses: 0,
  networkCalls: 0,
  creditsSaved: 0,
  failures: 0,
  circuitTrips: 0,
}

const serpApiFailureTimestamps: number[] = []
const serpApiNetworkCallTimestamps: number[] = []
let circuitOpenUntil = 0

let globalRedis: Redis | null = null

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  if (!globalRedis) {
    try {
      globalRedis = new Redis({ url, token })
    } catch {
      return null
    }
  }
  return globalRedis
}

export function isSerpApiConfigured() {
  return Boolean(SERPAPI_KEY)
}

export function hasSerpApiKey(serpapiKey?: string) {
  return Boolean((serpapiKey || SERPAPI_KEY || '').trim())
}

// Truncate inputs to prevent massive queries that could break the URL limit or abuse the API
function sanitizeQuery(query: string, maxLength: number = 200): string {
  if (!query) return ''
  return String(query).trim().slice(0, maxLength)
}

function normalizeSearchText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cloneSerpApiResponse(value: SerpApiResponse): SerpApiResponse {
  return JSON.parse(JSON.stringify(value))
}

function normalizeCacheValue(value: unknown) {
  if (typeof value !== 'string') return String(value ?? '')
  return normalizeSearchText(value)
}

function buildSerpApiCacheKey(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([key]) => key !== 'api_key')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${normalizeCacheValue(value)}`)
    .join('&')
}

function persistentCacheKey(key: string) {
  const safeKey = encodeURIComponent(key)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 180)
  return `hireproof:serpapi-cache:${safeKey}`
}

function persistentSmartInvestigationCacheKey(key: string) {
  const safeKey = encodeURIComponent(key)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 180)
  return `hireproof:serpapi-smart-cache:${safeKey}`
}

async function readPersistentSerpApiCache(key: string): Promise<SerpApiResponse | null> {
  const redis = getRedis()
  if (!redis || SERPAPI_CACHE_TTL_MS <= 0) return null
  try {
    const value = await redis.get(persistentCacheKey(key))
    if (!value) return null
    serpApiCacheTelemetry.persistentHits += 1
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return cloneSerpApiResponse(parsed as SerpApiResponse)
  } catch {
    return null
  }
}

async function readPersistentSmartInvestigationCache(key: string): Promise<EvidenceItem[] | null> {
  const redis = getRedis()
  if (!redis || SERPAPI_CACHE_TTL_MS <= 0) return null
  try {
    const value = await redis.get(persistentSmartInvestigationCacheKey(key))
    if (!value) return null
    serpApiCacheTelemetry.persistentHits += 1
    serpApiCacheTelemetry.similarityHits += 1
    serpApiCacheTelemetry.creditsSaved += 6
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return JSON.parse(JSON.stringify(parsed)) as EvidenceItem[]
  } catch {
    return null
  }
}

async function writePersistentSmartInvestigationCache(key: string, value: EvidenceItem[]) {
  const redis = getRedis()
  if (!redis || SERPAPI_CACHE_TTL_MS <= 0) return
  try {
    await redis.set(persistentSmartInvestigationCacheKey(key), JSON.stringify(value), {
      ex: Math.max(1, Math.floor(SERPAPI_CACHE_TTL_MS / 1000)),
    })
    serpApiCacheTelemetry.persistentWrites += 1
  } catch {
    // Persistent cache failures should never block audits.
  }
}

async function writePersistentSerpApiCache(key: string, value: SerpApiResponse) {
  const redis = getRedis()
  if (!redis || SERPAPI_CACHE_TTL_MS <= 0) return
  try {
    await redis.set(persistentCacheKey(key), JSON.stringify(value), {
      ex: Math.max(1, Math.floor(SERPAPI_CACHE_TTL_MS / 1000)),
    })
    serpApiCacheTelemetry.persistentWrites += 1
  } catch {
    // Persistent cache failures should never block audits.
  }
}

function buildSerpApiUrlCacheKey(url: string) {
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('api_key')
    const entries = Array.from(parsed.searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${normalizeCacheValue(value)}`)
      .join('&')
    return `${parsed.origin}${parsed.pathname}?${entries}`
  } catch {
    return normalizeCacheValue(url)
  }
}

function readSerpApiCache(key: string): SerpApiResponse | null {
  const entry = serpApiResponseCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    serpApiResponseCache.delete(key)
    return null
  }
  serpApiCacheTelemetry.hits += 1
  serpApiCacheTelemetry.creditsSaved += 1
  return cloneSerpApiResponse(entry.value)
}

function writeSerpApiCache(key: string, value: SerpApiResponse) {
  if (SERPAPI_CACHE_TTL_MS <= 0 || SERPAPI_CACHE_MAX_ENTRIES <= 0) return
  if (serpApiResponseCache.size >= SERPAPI_CACHE_MAX_ENTRIES) {
    const oldestKey = serpApiResponseCache.keys().next().value
    if (oldestKey) serpApiResponseCache.delete(oldestKey)
  }
  serpApiResponseCache.set(key, {
    expiresAt: Date.now() + SERPAPI_CACHE_TTL_MS,
    value: cloneSerpApiResponse(value),
  })
}

export function clearSerpApiResponseCache() {
  serpApiResponseCache.clear()
  smartInvestigationCache.clear()
  serpApiCacheTelemetry.hits = 0
  serpApiCacheTelemetry.misses = 0
  serpApiCacheTelemetry.persistentHits = 0
  serpApiCacheTelemetry.persistentWrites = 0
  serpApiCacheTelemetry.similarityHits = 0
  serpApiCacheTelemetry.similarityMisses = 0
  serpApiCacheTelemetry.networkCalls = 0
  serpApiCacheTelemetry.creditsSaved = 0
  serpApiCacheTelemetry.failures = 0
  serpApiCacheTelemetry.circuitTrips = 0
  serpApiFailureTimestamps.length = 0
  serpApiNetworkCallTimestamps.length = 0
  circuitOpenUntil = 0
}

export function getSerpApiResponseCacheStats() {
  return {
    memoryEntries: serpApiResponseCache.size,
    similarityEntries: smartInvestigationCache.size,
    ttlMs: SERPAPI_CACHE_TTL_MS,
    maxEntries: SERPAPI_CACHE_MAX_ENTRIES,
    circuitOpenUntil,
    ...serpApiCacheTelemetry,
  }
}

function pruneRecent(values: number[], windowMs: number) {
  const cutoff = Date.now() - windowMs
  while (values.length > 0 && values[0] < cutoff) values.shift()
}

function openSerpApiCircuit() {
  circuitOpenUntil = Math.max(circuitOpenUntil, Date.now() + SERPAPI_CIRCUIT_COOLDOWN_MS)
  serpApiCacheTelemetry.circuitTrips += 1
}

export function recordSerpApiFailure() {
  serpApiCacheTelemetry.failures += 1
  serpApiFailureTimestamps.push(Date.now())
  pruneRecent(serpApiFailureTimestamps, SERPAPI_CIRCUIT_FAILURE_WINDOW_MS)
  if (serpApiFailureTimestamps.length >= SERPAPI_CIRCUIT_FAILURE_LIMIT) {
    openSerpApiCircuit()
  }
}

function recordSerpApiNetworkCall() {
  serpApiCacheTelemetry.networkCalls += 1
  serpApiNetworkCallTimestamps.push(Date.now())
  pruneRecent(serpApiNetworkCallTimestamps, 10 * 60 * 1000)
  if (serpApiNetworkCallTimestamps.length >= SERPAPI_CIRCUIT_NETWORK_CALL_LIMIT_10M) {
    openSerpApiCircuit()
  }
}

export function getSerpApiOperationalStatus(): OperationalStatus {
  if (Date.now() < circuitOpenUntil) {
    return {
      status: 'circuit-open',
      retryAfterSec: Math.ceil((circuitOpenUntil - Date.now()) / 1000),
      message: 'Live search protection is active because SerpApi recently returned errors or quota usage spiked. HireProof is using cached and deterministic evidence until the cooldown ends.',
    }
  }
  return { status: 'ok', message: 'Live SerpApi search is available.' }
}

function normalizeCompanyForSimilarity(company: string) {
  return companyTokens(company).slice(0, 3).join(' ')
}

function normalizeRoleForSimilarity(role: string) {
  const normalized = normalizeSearchText(role)
  return normalized
    .replace(/\b(internship|intern|junior|jr|senior|sr|lead|principal|staff|remote|hybrid|onsite)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLocationForSimilarity(location: string) {
  const normalized = normalizeSearchText(location)
  if (/\b(ph|philippines|manila|makati|taguig|pasig|quezon)\b/.test(normalized)) return 'metro manila philippines'
  if (/\bremote\b/.test(normalized)) return 'remote'
  return normalized.split(' ').slice(0, 4).join(' ')
}

function buildSmartInvestigationSimilarityKey(
  claims: Pick<ExtractedClaims, 'company' | 'role' | 'location'>,
  applicationUrl?: string
) {
  const applyRoot = hostnameFromUrl(applicationUrl).split('.').slice(-2).join('.')
  return [
    normalizeCompanyForSimilarity(claims.company),
    normalizeRoleForSimilarity(claims.role),
    normalizeLocationForSimilarity(claims.location),
    applyRoot,
  ].join('|')
}

function readSmartInvestigationCache(key: string): EvidenceItem[] | null {
  const entry = smartInvestigationCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    smartInvestigationCache.delete(key)
    return null
  }
  serpApiCacheTelemetry.similarityHits += 1
  serpApiCacheTelemetry.creditsSaved += 6
  return JSON.parse(JSON.stringify(entry.value))
}

function writeSmartInvestigationCache(key: string, value: EvidenceItem[]) {
  if (SERPAPI_CACHE_TTL_MS <= 0 || SERPAPI_CACHE_MAX_ENTRIES <= 0) return
  if (smartInvestigationCache.size >= SERPAPI_CACHE_MAX_ENTRIES) {
    const oldestKey = smartInvestigationCache.keys().next().value
    if (oldestKey) smartInvestigationCache.delete(oldestKey)
  }
  smartInvestigationCache.set(key, {
    expiresAt: Date.now() + SERPAPI_CACHE_TTL_MS,
    value: JSON.parse(JSON.stringify(value)),
  })
}

function companyTokens(companyName: string): string[] {
  const genericTokens = new Set([
    'the',
    'and',
    'company',
    'corp',
    'corporation',
    'inc',
    'llc',
    'ltd',
    'limited',
    'co',
    'group',
  ])

  return normalizeSearchText(companyName)
    .split(' ')
    .filter(token => token.length >= 3 && !genericTokens.has(token))
}

function isCompanySpecificNewsResult(
  result: NonNullable<SerpApiResponse['news_results']>[number],
  companyName: string
): boolean {
  const source = typeof result.source === 'string'
    ? result.source
    : result.source?.name
  const haystack = normalizeSearchText(`${result.title || ''} ${result.link || ''} ${source || ''}`)
  const tokens = companyTokens(companyName)

  return tokens.length > 0 && tokens.some(token => haystack.includes(token))
}

function isKnownCompany(companyName: string): boolean {
  const normalized = normalizeSearchText(companyName)
  return Boolean(normalized) && !normalized.includes('unknown') && !normalized.includes('not verifiable')
}

function evidenceKey(item: EvidenceItem) {
  return [
    item.type || '',
    item.source || '',
    item.snippet || '',
    item.url || '',
  ].join('|')
}

export function resolveSerpApiLocale(location?: string): SearchLocale {
  const normalized = normalizeSearchText(location || '')
  if (/\b(ph|philippines|manila|makati|cebu|davao|quezon|taguig|pasig)\b/.test(normalized)) {
    return {
      gl: 'ph',
      hl: 'en',
      google_domain: 'google.com.ph',
      location: 'Manila, Metro Manila, Philippines',
    }
  }

  if (/\b(uk|united kingdom|london|england|scotland)\b/.test(normalized)) {
    return { gl: 'uk', hl: 'en', google_domain: 'google.co.uk', location: 'London, England, United Kingdom' }
  }

  if (/\b(canada|toronto|vancouver|montreal)\b/.test(normalized)) {
    return { gl: 'ca', hl: 'en', google_domain: 'google.ca', location: 'Toronto, Ontario, Canada' }
  }

  return { gl: 'us', hl: 'en', google_domain: 'google.com', location: location || 'Austin, Texas, United States' }
}

function hostnameFromUrl(url?: string) {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function hasCompanyToken(value: string, companyName: string) {
  const haystack = normalizeSearchText(value)
  const tokens = companyTokens(companyName)
  return tokens.length > 0 && tokens.some(token => haystack.includes(token))
}

function evidence(source: string, type: string, snippet: string, url?: string): EvidenceItem {
  return {
    source: sanitizeQuery(source, 500),
    type: sanitizeQuery(type, 100),
    snippet: sanitizeQuery(snippet, 2000),
    url: url ? url.slice(0, 2000) : undefined,
  }
}

function isOfficialCompanyResult(result: SerpApiSearchResult, companyName: string) {
  const haystack = `${result.title || ''} ${result.displayed_link || ''} ${result.link || ''} ${result.snippet || ''}`
  const lower = haystack.toLowerCase()
  return hasCompanyToken(haystack, companyName) && /\b(official|careers?|jobs?|about|company)\b/.test(lower)
}

function isReputableJobBoard(url?: string, source?: string) {
  const host = hostnameFromUrl(url)
  const label = normalizeSearchText(source || '')
  return [
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'jobstreet.com',
    'workdayjobs.com',
    'greenhouse.io',
    'lever.co',
    'smartrecruiters.com',
  ].some(domain => host.includes(domain) || label.includes(domain.replace('.com', '')))
}

function rootDomainFromHost(host: string) {
  const parts = host.replace(/^www\./i, '').split('.').filter(Boolean)
  if (parts.length < 2) return host
  return parts.slice(-2).join('.')
}

function isTrustedSubmittedApplyHost(host: string) {
  return [
    'linkedin.com',
    'indeed.com',
    'jobstreet.com',
    'greenhouse.io',
    'lever.co',
    'ashbyhq.com',
    'smartrecruiters.com',
    'workdayjobs.com',
    'myworkdayjobs.com',
  ].some(domain => host.includes(domain))
}

function compareApplyHost(
  applicationUrl: string | undefined,
  officialHost: string,
  applyLinks: string[],
  options: { allowTrustedJobBoard?: boolean } = {},
) {
  const submittedHost = hostnameFromUrl(applicationUrl)
  if (!submittedHost || !officialHost) return null
  if (options.allowTrustedJobBoard && isTrustedSubmittedApplyHost(submittedHost)) return null
  const officialRoot = rootDomainFromHost(officialHost)
  const submittedMatchesOfficial = submittedHost.includes(officialRoot)
  const applyMatchesOfficial = applyLinks.some(link => hostnameFromUrl(link).includes(officialRoot))
  if (!submittedMatchesOfficial && applyMatchesOfficial) {
    return `Risk signal: submitted apply domain ${submittedHost} does not match official company domain ${officialHost}.`
  }
  return null
}

export function buildEvidenceFromSerpApiResults(input: SmartEvidenceInput): EvidenceItem[] {
  const output: EvidenceItem[] = []
  const { claims } = input
  const company = claims.company || ''
  const officialWebsite = input.web?.knowledge_graph?.website
  const officialHost = hostnameFromUrl(officialWebsite)

  if (input.web?.knowledge_graph?.title && hasCompanyToken(input.web.knowledge_graph.title, company)) {
    output.push(evidence(
      'SerpApi Google Knowledge Graph',
      'Official Company Presence',
      `Trust: official | Knowledge Graph matched ${input.web.knowledge_graph.title}. ${input.web.knowledge_graph.description || ''}`,
      officialWebsite,
    ))
  }

  for (const result of input.web?.organic_results?.slice(0, 5) || []) {
    const official = isOfficialCompanyResult(result, company)
    const source = official ? 'SerpApi Google Search' : sanitizeQuery(result.source || result.displayed_link || 'Web Search', 100)
    output.push(evidence(
      source,
      official ? 'Official Company Presence' : 'Company Check',
      `${official ? 'Trust: official' : 'Trust: web'} | ${result.title || 'Search result'} | ${result.snippet || ''}`,
      result.link,
    ))
  }

  for (const result of input.news?.news_results?.slice(0, 5) || []) {
    if (!isCompanySpecificNewsResult(result, company)) continue
    const source = typeof result.source === 'string' ? result.source : result.source?.name
    const negative = /\b(scam|fraud|fake|impersonat|phishing|lawsuit|warning|charged|arrest|complaint)\b/i.test(`${result.title} ${source}`)
    output.push(evidence(
      source || 'SerpApi Google News',
      'Reputation',
      `${negative ? 'Risk signal:' : 'Reputation signal:'} ${result.title || ''}${result.date ? ` | Date: ${result.date}` : ''}`,
      result.link,
    ))
  }

  for (const job of input.jobs?.jobs_results?.slice(0, 5) || []) {
    const applyLinks = [
      ...(job.apply_options || []).map(option => option.link || ''),
      ...(job.related_links || []).map(link => link.link || ''),
    ].filter(Boolean)
    const bestLink = applyLinks[0]
    const schedule = job.detected_extensions?.schedule_type ? ` | Schedule: ${job.detected_extensions.schedule_type}` : ''
    const salary = job.salary ? ` | Salary: ${job.salary}` : ''
    const boardTrust = isReputableJobBoard(bestLink, job.via) ? 'reputable-job-board' : 'job-result'

    output.push(evidence(
      sanitizeQuery(job.via || 'SerpApi Google Jobs', 100),
      'Comparable Jobs',
      `Trust: ${boardTrust} | ${job.title} at ${job.company_name} | Location: ${job.location}${salary}${schedule}`,
      bestLink,
    ))

    const targetCompanyJob = hasCompanyToken(job.company_name || '', company)
    const mismatch = targetCompanyJob
      ? compareApplyHost(input.applicationUrl, officialHost, applyLinks, { allowTrustedJobBoard: true })
      : null
    if (mismatch) {
      output.push(evidence('SerpApi Google Jobs', 'Apply Path Mismatch', mismatch, input.applicationUrl))
    }
  }

  const localResults = input.maps?.local_results?.slice(0, 3) || []
  for (const local of localResults) {
    if (!hasCompanyToken(local.title || '', company)) continue
    const hasContact = Boolean(local.address || local.phone || local.website)
    output.push(evidence(
      'SerpApi Google Maps',
      hasContact ? 'Verified Local Presence' : 'Local Presence',
      `Trust: ${hasContact ? 'verified-local' : 'local'} | ${local.title}${local.address ? ` | Address: ${local.address}` : ''}${local.phone ? ` | Phone: ${local.phone}` : ''}${local.rating ? ` | Rating: ${local.rating}` : ''}${local.reviews ? ` from ${local.reviews} reviews` : ''}`,
      local.website,
    ))
  }

  if (input.maps?.place_results?.title && hasCompanyToken(input.maps.place_results.title, company)) {
    const place = input.maps.place_results
    output.push(evidence(
      'SerpApi Google Maps Place',
      'Verified Local Presence',
      `Trust: verified-local | Place detail matched ${place.title}${place.address ? ` | Address: ${place.address}` : ''}${place.phone ? ` | Phone: ${place.phone}` : ''}${place.rating ? ` | Rating: ${place.rating}` : ''}`,
      place.website,
    ))
  }

  const seen = new Set<string>()
  return output.filter(item => {
    const key = evidenceKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchSerpApi(params: Record<string, any>, serpapiKey?: string): Promise<SerpApiResponse | null> {
  const apiKey = (serpapiKey || SERPAPI_KEY || '').trim()
  if (!apiKey) {
    return null // Return null if API key not configured
  }
  if (Date.now() < circuitOpenUntil) {
    return null
  }

  const cacheKey = buildSerpApiCacheKey(params)
  const cached = readSerpApiCache(cacheKey)
  if (cached) return cached
  const persistentCached = await readPersistentSerpApiCache(cacheKey)
  if (persistentCached) {
    serpApiCacheTelemetry.hits += 1
    serpApiCacheTelemetry.creditsSaved += 1
    writeSerpApiCache(cacheKey, persistentCached)
    return persistentCached
  }
  serpApiCacheTelemetry.misses += 1

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout to prevent hanging

  try {
    const queryParams = new URLSearchParams({
      api_key: apiKey,
      ...params,
    })

    const response = await fetch(`${API_BASE}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      console.warn(`[SerpApi] search returned status ${response.status}`)
      recordSerpApiFailure()
      return null
    }

    recordSerpApiNetworkCall()
    const data = await response.json()
    writeSerpApiCache(cacheKey, data)
    await writePersistentSerpApiCache(cacheKey, data)
    return data
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[SerpApi] search timed out')
    } else {
      console.error('[SerpApi] search error:', error)
    }
    recordSerpApiFailure()
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchSerpApiUrl(url: string, serpapiKey?: string): Promise<SerpApiResponse | null> {
  const apiKey = (serpapiKey || SERPAPI_KEY || '').trim()
  if (!apiKey || !url) return null
  if (Date.now() < circuitOpenUntil) return null

  const cacheKey = buildSerpApiUrlCacheKey(url)
  const cached = readSerpApiCache(cacheKey)
  if (cached) return cached
  const persistentCached = await readPersistentSerpApiCache(cacheKey)
  if (persistentCached) {
    serpApiCacheTelemetry.hits += 1
    serpApiCacheTelemetry.creditsSaved += 1
    writeSerpApiCache(cacheKey, persistentCached)
    return persistentCached
  }
  serpApiCacheTelemetry.misses += 1

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  try {
    const parsed = new URL(url)
    parsed.searchParams.set('api_key', apiKey)
    const response = await fetch(parsed.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      console.warn(`[SerpApi] linked search returned status ${response.status}`)
      recordSerpApiFailure()
      return null
    }

    recordSerpApiNetworkCall()
    const data = await response.json()
    writeSerpApiCache(cacheKey, data)
    await writePersistentSerpApiCache(cacheKey, data)
    return data
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[SerpApi] linked search timed out')
    } else {
      console.error('[SerpApi] linked search error:', error)
    }
    recordSerpApiFailure()
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Search for company web presence
 */
export async function searchCompanyPresence(
  companyName: string,
  role: string,
  serpapiKey?: string,
  location?: string
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  const safeCompany = sanitizeQuery(companyName, 100)
  const locale = resolveSerpApiLocale(location)
  
  if (!safeCompany) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google',
      q: `${safeCompany} ${role ? sanitizeQuery(role, 80) : ''} official careers linkedin company`,
      num: 5,
      ...locale,
    }, serpapiKey)

    evidence.push(...buildEvidenceFromSerpApiResults({
      claims: { company: companyName, role, salary: '', location: location || '' },
      web: data,
    }).filter(item => item.type === 'Company Check' || item.type === 'Official Company Presence'))
  } catch (error) {
    console.error('[SerpApi] searchCompanyPresence error:', error)
  }

  return evidence
}

/**
 * Search for news and reputation signals
 */
export async function searchNewsReputation(companyName: string, serpapiKey?: string, location?: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  const safeCompany = sanitizeQuery(companyName, 100)
  const locale = resolveSerpApiLocale(location)

  if (!safeCompany) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google_news',
      q: `"${safeCompany}" scam fraud impersonation lawsuit warning review reputation`,
      num: 5,
      ...locale,
    }, serpapiKey)

    evidence.push(...buildEvidenceFromSerpApiResults({
      claims: { company: companyName, role: '', salary: '', location: location || '' },
      news: data,
    }).filter(item => item.type === 'Reputation'))
  } catch (error) {
    console.error('[SerpApi] searchNewsReputation error:', error)
  }

  return evidence
}

export async function ensureSerpApiEvidenceCoverage(
  evidence: EvidenceItem[],
  claims: Pick<ExtractedClaims, 'company' | 'role' | 'location'>,
  serpapiKey?: string
): Promise<EvidenceItem[]> {
  if (!hasSerpApiKey(serpapiKey)) return Array.isArray(evidence) ? evidence : []

  const existingEvidence = Array.isArray(evidence) ? evidence : []
  const hasCompany = isKnownCompany(claims.company)
  const hasEvidenceType = (type: string) => existingEvidence.some(item => item?.type === type)
  const hasCompanyEvidence = hasEvidenceType('Company Check') || hasEvidenceType('Official Company Presence')
  const hasLocalEvidence = hasEvidenceType('Local Presence') || hasEvidenceType('Verified Local Presence')

  const [companyEvidence, newsEvidence, jobsEvidence, localEvidence] = await Promise.all([
    hasCompany && !hasCompanyEvidence
      ? searchCompanyPresence(claims.company, claims.role, serpapiKey, claims.location)
      : Promise.resolve([]),
    hasCompany && !hasEvidenceType('Reputation')
      ? searchNewsReputation(claims.company, serpapiKey, claims.location)
      : Promise.resolve([]),
    !hasEvidenceType('Comparable Jobs')
      ? searchComparableJobs(claims.role, claims.location, serpapiKey)
      : Promise.resolve([]),
    hasCompany && !hasLocalEvidence
      ? searchLocalPresence(claims.company, claims.location, serpapiKey)
      : Promise.resolve([]),
  ])

  const seen = new Set<string>()
  return [
    ...existingEvidence,
    ...companyEvidence,
    ...newsEvidence,
    ...jobsEvidence,
    ...localEvidence,
  ].filter(item => {
    const key = evidenceKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Find comparable job listings
 */
export async function searchComparableJobs(
  role: string,
  location: string,
  serpapiKey?: string
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  const safeRole = sanitizeQuery(role, 100)
  const safeLocation = sanitizeQuery(location, 100)
  const locale = resolveSerpApiLocale(location)

  if (!safeRole) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google_jobs',
      q: `${safeRole} jobs ${safeLocation}`,
      num: 5,
      ...locale,
    }, serpapiKey)

    evidence.push(...buildEvidenceFromSerpApiResults({
      claims: { company: '', role, salary: '', location },
      jobs: data,
    }).filter(item => item.type === 'Comparable Jobs' || item.type === 'Apply Path Mismatch'))
  } catch (error) {
    console.error('[SerpApi] searchComparableJobs error:', error)
  }

  return evidence
}

/**
 * Check local business presence
 */
export async function searchLocalPresence(
  companyName: string,
  location: string,
  serpapiKey?: string
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  const safeCompany = sanitizeQuery(companyName, 100)
  const safeLocation = sanitizeQuery(location, 100)
  const locale = resolveSerpApiLocale(location)

  if (!safeCompany) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google_maps',
      type: 'search',
      q: `${safeCompany} ${safeLocation}`,
      num: 5,
      ...locale,
    }, serpapiKey)

    evidence.push(...buildEvidenceFromSerpApiResults({
      claims: { company: companyName, role: '', salary: '', location },
      maps: data,
    }).filter(item => item.type === 'Local Presence' || item.type === 'Verified Local Presence'))
  } catch (error) {
    console.error('[SerpApi] searchLocalPresence error:', error)
  }

  return evidence
}

export async function runSmartSerpApiInvestigation(
  claims: Pick<ExtractedClaims, 'company' | 'role' | 'salary' | 'location'>,
  options: { serpapiKey?: string; applicationUrl?: string } = {}
): Promise<EvidenceItem[]> {
  if (!hasSerpApiKey(options.serpapiKey)) return []

  const similarityKey = buildSmartInvestigationSimilarityKey(claims, options.applicationUrl)
  const cachedEvidence = readSmartInvestigationCache(similarityKey)
  if (cachedEvidence) return cachedEvidence
  const persistentCachedEvidence = await readPersistentSmartInvestigationCache(similarityKey)
  if (persistentCachedEvidence) {
    writeSmartInvestigationCache(similarityKey, persistentCachedEvidence)
    return persistentCachedEvidence
  }
  serpApiCacheTelemetry.similarityMisses += 1

  const hasCompany = isKnownCompany(claims.company)
  const locale = resolveSerpApiLocale(claims.location)
  const safeCompany = sanitizeQuery(claims.company, 100)
  const safeRole = sanitizeQuery(claims.role, 100)
  const safeLocation = sanitizeQuery(claims.location, 100)
  const applyHost = hostnameFromUrl(options.applicationUrl)

  const [web, applyWeb, news, jobs, companyJobs, maps] = await Promise.all([
    hasCompany ? fetchSerpApi({
      engine: 'google',
      q: `${safeCompany} ${safeRole} official careers linkedin company`,
      num: 5,
      ...locale,
    }, options.serpapiKey) : Promise.resolve(null),
    hasCompany && applyHost ? fetchSerpApi({
      engine: 'google',
      q: `${safeCompany} ${applyHost} apply careers official`,
      num: 5,
      ...locale,
    }, options.serpapiKey) : Promise.resolve(null),
    hasCompany ? fetchSerpApi({
      engine: 'google_news',
      q: `"${safeCompany}" scam fraud impersonation lawsuit warning review reputation`,
      num: 5,
      ...locale,
    }, options.serpapiKey) : Promise.resolve(null),
    fetchSerpApi({
      engine: 'google_jobs',
      q: `${safeRole} jobs ${safeLocation}`,
      num: 5,
      ...locale,
    }, options.serpapiKey),
    hasCompany ? fetchSerpApi({
      engine: 'google_jobs',
      q: `${safeCompany} ${safeRole} jobs ${safeLocation}`,
      num: 5,
      ...locale,
    }, options.serpapiKey) : Promise.resolve(null),
    hasCompany ? fetchSerpApi({
      engine: 'google_maps',
      type: 'search',
      q: `${safeCompany} ${safeLocation}`,
      num: 5,
      ...locale,
    }, options.serpapiKey) : Promise.resolve(null),
  ])

  const firstMatchingPlace = maps?.local_results?.find(local => hasCompanyToken(local.title || '', claims.company))
  const place = firstMatchingPlace?.place_id_search
    ? await fetchSerpApiUrl(firstMatchingPlace.place_id_search, options.serpapiKey)
    : null

  const evidence = buildEvidenceFromSerpApiResults({
    claims,
    web: web || applyWeb
      ? {
          ...(web || {}),
          organic_results: [
            ...(web?.organic_results || []),
            ...(applyWeb?.organic_results || []),
          ],
        }
      : null,
    news,
    jobs: jobs || companyJobs
      ? {
          ...(jobs || {}),
          jobs_results: [
            ...(jobs?.jobs_results || []),
            ...(companyJobs?.jobs_results || []),
          ],
        }
      : null,
    maps: place?.place_results ? { ...(maps || {}), place_results: place.place_results } : maps,
    applicationUrl: options.applicationUrl,
  })

  writeSmartInvestigationCache(similarityKey, evidence)
  await writePersistentSmartInvestigationCache(similarityKey, evidence)
  return evidence
}

/**
 * Normalize all evidence into HireProof format
 * Called by MCP tools to get evidence for audit
 */
export async function gatherAllEvidence(
  companyName: string,
  role: string,
  location: string,
  serpapiKey?: string
): Promise<EvidenceItem[]> {
  const allEvidence: EvidenceItem[] = []

  // Run all searches in parallel
  const [company, news, jobs, local] = await Promise.all([
    searchCompanyPresence(companyName, role, serpapiKey),
    searchNewsReputation(companyName, serpapiKey),
    searchComparableJobs(role, location, serpapiKey),
    searchLocalPresence(companyName, location, serpapiKey),
  ])

  allEvidence.push(...company, ...news, ...jobs, ...local)

  return allEvidence
}
