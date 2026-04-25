import {
  AuditRequestSchema,
  type AlternativeJob,
  type AuditReport,
  type AuditRequest,
  type ExtractedClaims,
} from '@/lib/schemas'
import { DEMO_FIXTURES } from '@/lib/fixtures'
import {
  calculateRiskScore,
  determineVerdict,
  getConfidenceLabel,
  extractRedFlags,
  extractGreenFlags,
  generateSummary,
} from '@/lib/risk-scorer'
import {
  isSerpApiConfigured,
  searchCompanyPresence,
  searchComparableJobs,
  searchLocalPresence,
  searchNewsReputation,
} from '@/lib/serpapi'

/**
 * Audit API Endpoint
 * 
 * Accepts:
 * - text: Job post/message text
 * - url: (optional) Job URL
 * - location: (optional) Location for local signals
 * 
 * Returns:
 * - Complete AuditReport with verdict, score, evidence, flags
 * 
 * TODO: Integrate AI SDK for stronger claim extraction when MODEL_PROVIDER_KEY is configured
 */

export const runtime = 'nodejs'

function extractFirstMatch(text: string, patterns: RegExp[], fallback = 'Unknown') {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    const value = match?.[1]?.trim().replace(/[.。]+$/, '')
    if (value) return value
  }

  return fallback
}

function extractCompanyFromUrl(url?: string) {
  if (!url) return null

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const [name] = hostname.split('.')
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : null
  } catch {
    return null
  }
}

function extractClaims(input: AuditRequest): ExtractedClaims {
  const text = input.text
  const companyFromUrl = extractCompanyFromUrl(input.url || undefined)
  const company = companyFromUrl || extractFirstMatch(text, [
    /(?:company|employer)\s*[:\-]\s*([A-Za-z0-9&.,' -]{2,70})/i,
    /(?:at|from|with)\s+([A-Z][A-Za-z0-9&.,' -]{2,70})(?:\s+(?:is|for|as|hiring|offers|seeks)|[.,\n]|$)/,
  ], 'Unknown / Not Verifiable')

  const rawRole = extractFirstMatch(text, [
    /(?:role|position|job title)\s*[:\-]\s*([A-Za-z /+-]{2,70})/i,
    /(?:hiring|seeking|looking for)\s+(?:a|an)?\s*([A-Za-z /+-]{2,70})(?:\s+(?:at|for|in|with)|[.,\n]|$)/i,
    /\b((?:frontend|front-end|backend|back-end|full stack|software|web|ui\/ux|data|virtual assistant|customer support)[A-Za-z /+-]*(?:engineer|developer|intern|designer|analyst|assistant|specialist|representative)?)\b/i,
  ], 'Unspecified role')
  const role = rawRole.replace(/\s+(?:at|for|with|in)\s+.*$/i, '').trim()

  const salary = extractFirstMatch(text, [
    /((?:PHP|Php|php|USD|usd|₱|\$)\s*[\d,.]+(?:\s*[-–]\s*(?:PHP|Php|php|USD|usd|₱|\$)?\s*[\d,.]+)?(?:\s*(?:\/|per)?\s*(?:week|month|year|hour|annum|annually))?)/i,
    /([\d,.]+\s*(?:PHP|Php|php|USD|usd|pesos|dollars)\s*(?:\/|per)?\s*(?:week|month|year|hour)?)/i,
  ], 'Not specified')

  const lower = text.toLowerCase()
  const contactMethod = lower.includes('telegram')
    ? 'Telegram'
    : lower.includes('whatsapp')
      ? 'WhatsApp'
      : lower.includes('linkedin')
        ? 'LinkedIn'
        : lower.includes('email')
          ? 'Email'
          : 'Not specified'

  const applicationPath = lower.includes('no interview')
    ? 'No interview mentioned'
    : lower.includes('direct message') || lower.includes('dm ')
      ? 'Direct message'
      : input.url
        ? 'Provided job URL'
        : lower.includes('official') || lower.includes('careers')
          ? 'Official careers channel'
          : 'Not specified'

  return {
    company,
    role,
    salary,
    location: input.location || 'Not specified',
    contactMethod,
    applicationPath,
  }
}

function buildAlternativeJobs(evidence: AuditReport['evidence']): AlternativeJob[] {
  return evidence
    .filter(item => item.type === 'Comparable Jobs')
    .slice(0, 3)
    .map(item => {
      const [titleAndCompany, salary] = item.snippet.split(' - ')
      const [title, company] = titleAndCompany.split(' at ')

      return {
        title: title || 'Comparable role',
        company: company || item.source,
        salary,
      }
    })
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

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validated = AuditRequestSchema.parse(body)

    if (isSerpApiConfigured()) {
      const extractedClaims = extractClaims(validated)
      const hasCompany = !extractedClaims.company.toLowerCase().includes('unknown')

      const [companyEvidence, newsEvidence, jobsEvidence, localEvidence] = await Promise.all([
        hasCompany ? searchCompanyPresence(extractedClaims.company, extractedClaims.role) : Promise.resolve([]),
        hasCompany ? searchNewsReputation(extractedClaims.company) : Promise.resolve([]),
        searchComparableJobs(extractedClaims.role, extractedClaims.location),
        hasCompany ? searchLocalPresence(extractedClaims.company, extractedClaims.location) : Promise.resolve([]),
      ])

      const evidence = [
        ...companyEvidence,
        ...newsEvidence,
        ...jobsEvidence,
        ...localEvidence,
      ]

      let redFlags = extractRedFlags(extractedClaims, evidence)
      const greenFlags = extractGreenFlags(extractedClaims, evidence)

      if (!hasCompany) {
        redFlags = [...redFlags, 'Company name could not be confidently extracted from the post']
      }
      if (hasCompany && localEvidence.length === 0) {
        redFlags = [...redFlags, 'No local presence found in search results']
      }
      if (evidence.length === 0) {
        redFlags = [...redFlags, 'No supporting evidence found from live search']
      }

      const riskScore = calculateRiskScore(extractedClaims, redFlags, greenFlags, evidence)
      const verdict = determineVerdict(riskScore)

      const report: AuditReport = {
        id: `report_${Date.now()}`,
        verdict,
        riskScore,
        confidence: getConfidenceLabel(riskScore, evidence.length),
        summary: generateSummary(verdict, riskScore, redFlags),
        extractedClaims,
        redFlags,
        greenFlags,
        evidence,
        alternatives: buildAlternativeJobs(jobsEvidence),
        nextSteps: buildNextSteps(verdict, extractedClaims.company),
        timestamp: new Date().toISOString(),
        mode: 'live',
      }

      return new Response(JSON.stringify(report), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fallback to demo fixtures when live search is not configured.
    const textLower = validated.text.toLowerCase()
    
    let fixture: AuditReport
    if (textLower.includes('80000') || textLower.includes('telegram')) {
      fixture = {
        id: `report_${Date.now()}`,
        ...DEMO_FIXTURES.highRisk,
        timestamp: new Date().toISOString(),
        mode: 'demo',
      }
    } else if (textLower.includes('unclear') || textLower.includes('caution')) {
      fixture = {
        id: `report_${Date.now()}`,
        ...DEMO_FIXTURES.caution,
        timestamp: new Date().toISOString(),
        mode: 'demo',
      }
    } else {
      fixture = {
        id: `report_${Date.now()}`,
        ...DEMO_FIXTURES.safe,
        timestamp: new Date().toISOString(),
        mode: 'demo',
      }
    }

    const report: AuditReport = fixture

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Audit API] Error:', error)
    
    if (error instanceof Error && error.message.includes('Validation')) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to complete audit',
        fallback: true,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Health check
export async function GET() {
  const serpapi = isSerpApiConfigured()

  return new Response(
    JSON.stringify({
      status: 'ok',
      mode: serpapi ? 'live' : 'demo',
      apiKeys: {
        serpapi,
        ai_provider: !!process.env.MODEL_PROVIDER_KEY,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
