import type { EvidenceItem, ExtractedClaims } from '@/lib/schemas'

const SERPAPI_KEY = process.env.SERPAPI_API_KEY
const API_BASE = 'https://serpapi.com/search.json'

interface SerpApiSearchResult {
  title: string
  link: string
  snippet: string
}

interface SerpApiResponse {
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
    related_links?: Array<{ link?: string }>
    job_highlights?: Array<{ title?: string; items?: string[] }>
  }>
  local_results?: Array<{
    title: string
    address: string
    rating: number
  }>
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

async function fetchSerpApi(params: Record<string, any>, serpapiKey?: string): Promise<SerpApiResponse | null> {
  const apiKey = (serpapiKey || SERPAPI_KEY || '').trim()
  if (!apiKey) {
    return null // Return null if API key not configured
  }

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
      return null
    }

    return await response.json()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[SerpApi] search timed out')
    } else {
      console.error('[SerpApi] search error:', error)
    }
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
  serpapiKey?: string
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  const safeCompany = sanitizeQuery(companyName, 100)
  
  if (!safeCompany) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google',
      q: `${safeCompany} company official website linkedin`,
      num: 5,
      gl: 'us',
    }, serpapiKey)

    if (data?.organic_results) {
      data.organic_results.slice(0, 3).forEach((result: SerpApiSearchResult) => {
        evidence.push({
          source: 'Web Search',
          snippet: (result.snippet || result.title || '').slice(0, 1000),
          url: result.link ? result.link.slice(0, 2000) : undefined,
          type: 'Company Check',
        })
      })
    }
  } catch (error) {
    console.error('[SerpApi] searchCompanyPresence error:', error)
  }

  return evidence
}

/**
 * Search for news and reputation signals
 */
export async function searchNewsReputation(companyName: string, serpapiKey?: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []
  const safeCompany = sanitizeQuery(companyName, 100)

  if (!safeCompany) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google_news',
      q: `${safeCompany} scam fraud review reputation`,
      num: 5,
      gl: 'us',
    }, serpapiKey)

    if (data?.news_results) {
      const companySpecificNewsResults = data.news_results.filter(result =>
        isCompanySpecificNewsResult(result, safeCompany)
      )

      companySpecificNewsResults.slice(0, 3).forEach((result) => {
        const source = typeof result.source === 'string'
          ? result.source
          : result.source?.name

        evidence.push({
          source: sanitizeQuery(source || 'News', 100),
          snippet: sanitizeQuery(result.title || '', 1000),
          url: result.link ? result.link.slice(0, 2000) : undefined,
          type: 'Reputation',
        })
      })
    }
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

  const [companyEvidence, newsEvidence, jobsEvidence, localEvidence] = await Promise.all([
    hasCompany && !hasEvidenceType('Company Check')
      ? searchCompanyPresence(claims.company, claims.role, serpapiKey)
      : Promise.resolve([]),
    hasCompany && !hasEvidenceType('Reputation')
      ? searchNewsReputation(claims.company, serpapiKey)
      : Promise.resolve([]),
    !hasEvidenceType('Comparable Jobs')
      ? searchComparableJobs(claims.role, claims.location, serpapiKey)
      : Promise.resolve([]),
    hasCompany && !hasEvidenceType('Local Presence')
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

  if (!safeRole) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google_jobs',
      q: `${safeRole} jobs ${safeLocation}`,
      num: 5,
      gl: 'us',
    }, serpapiKey)

    if (data?.jobs_results) {
      data.jobs_results.slice(0, 3).forEach((result) => {
        const salaryInfo = result.salary ? ` - ${result.salary}` : ''
        evidence.push({
          source: sanitizeQuery(result.via || 'Job Board', 100),
          snippet: sanitizeQuery(`${result.title} at ${result.company_name}${salaryInfo}`, 1000),
          url: result.related_links?.find(link => link.link)?.link?.slice(0, 2000),
          type: 'Comparable Jobs',
        })
      })
    }
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

  if (!safeCompany) return evidence

  try {
    const data = await fetchSerpApi({
      engine: 'google',
      q: `"${safeCompany}" business address ${safeLocation} maps`,
      num: 5,
      gl: 'us',
    }, serpapiKey)

    if (data?.local_results) {
      data.local_results.slice(0, 2).forEach((result: any) => {
        evidence.push({
          source: 'Local Search',
          snippet: sanitizeQuery(`${result.title} - ${result.address}`, 1000),
          type: 'Local Presence',
        })
      })
    } else if (data?.organic_results) {
      data.organic_results.slice(0, 2).forEach((result: SerpApiSearchResult) => {
        evidence.push({
          source: 'Local Search',
          snippet: sanitizeQuery(result.snippet || result.title, 1000),
          url: result.link ? result.link.slice(0, 2000) : undefined,
          type: 'Local Presence',
        })
      })
    }
  } catch (error) {
    console.error('[SerpApi] searchLocalPresence error:', error)
  }

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
