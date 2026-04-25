import type { EvidenceItem } from '@/lib/schemas'

const SERPAPI_KEY = process.env.SERPAPI_API_KEY
const API_BASE = 'https://serpapi.com'

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
    source: string
    date: string
  }>
  jobs_results?: Array<{
    title: string
    company_name: string
    location: string
    salary?: string
  }>
  local_results?: Array<{
    title: string
    address: string
    rating: number
  }>
}

async function fetchSerpApi(endpoint: string, params: Record<string, any>) {
  if (!SERPAPI_KEY) {
    return null // Return null if API key not configured
  }

  try {
    const queryParams = new URLSearchParams({
      api_key: SERPAPI_KEY,
      ...params,
    })

    const response = await fetch(`${API_BASE}/${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      console.warn(`[SerpApi] ${endpoint} returned status ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`[SerpApi] ${endpoint} error:`, error)
    return null
  }
}

/**
 * Search for company web presence
 */
export async function searchCompanyPresence(
  companyName: string,
  role: string
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []

  try {
    const data = await fetchSerpApi('search', {
      q: `${companyName} company official website linkedin`,
      num: 5,
      gl: 'us',
    })

    if (data?.organic_results) {
      data.organic_results.slice(0, 3).forEach((result: SerpApiSearchResult) => {
        evidence.push({
          source: 'Web Search',
          snippet: result.snippet || result.title,
          url: result.link,
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
export async function searchNewsReputation(companyName: string): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []

  try {
    const data = await fetchSerpApi('news', {
      q: `${companyName} scam fraud review reputation`,
      num: 5,
      gl: 'us',
    })

    if (data?.news_results) {
      data.news_results.slice(0, 3).forEach((result: any) => {
        evidence.push({
          source: result.source || 'News',
          snippet: result.title || '',
          url: result.link,
          type: 'Reputation',
        })
      })
    }
  } catch (error) {
    console.error('[SerpApi] searchNewsReputation error:', error)
  }

  return evidence
}

/**
 * Find comparable job listings
 */
export async function searchComparableJobs(
  role: string,
  location: string
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []

  try {
    const data = await fetchSerpApi('jobs', {
      q: `${role} jobs ${location}`,
      num: 5,
      gl: 'us',
    })

    if (data?.jobs_results) {
      data.jobs_results.slice(0, 3).forEach((result: any) => {
        const salaryInfo = result.salary ? ` - ${result.salary}` : ''
        evidence.push({
          source: 'Job Board',
          snippet: `${result.title} at ${result.company_name}${salaryInfo}`,
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
  location: string
): Promise<EvidenceItem[]> {
  const evidence: EvidenceItem[] = []

  try {
    const data = await fetchSerpApi('search', {
      q: `"${companyName}" business address ${location} maps`,
      type: 'places',
      num: 5,
      gl: 'us',
    })

    if (data?.local_results) {
      data.local_results.slice(0, 2).forEach((result: any) => {
        evidence.push({
          source: 'Local Search',
          snippet: `${result.title} - ${result.address}`,
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
  location: string
): Promise<EvidenceItem[]> {
  const allEvidence: EvidenceItem[] = []

  // Run all searches in parallel
  const [company, news, jobs, local] = await Promise.all([
    searchCompanyPresence(companyName, role),
    searchNewsReputation(companyName),
    searchComparableJobs(role, location),
    searchLocalPresence(companyName, location),
  ])

  allEvidence.push(...company, ...news, ...jobs, ...local)

  return allEvidence
}
