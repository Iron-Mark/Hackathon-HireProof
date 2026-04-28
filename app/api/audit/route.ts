import { generateObject, generateText, tool, stepCountIs } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import {
  AuditRequestSchema,
  type AlternativeJob,
  type AuditReport,
  type AuditRequest,
  type ExtractedClaims,
  type EvidenceItem,
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
import { checkRateLimit } from '@/lib/rate-limit'
import { saveReport } from '@/lib/db'

export const runtime = 'nodejs'

const openai = createOpenAI({
  apiKey: process.env.MODEL_PROVIDER_KEY || '',
})

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

async function extractClaims(input: AuditRequest): Promise<ExtractedClaims> {
  const text = input.text

  if (!process.env.MODEL_PROVIDER_KEY) {
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

  try {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: z.object({
        company: z.string().describe("The name of the company hiring for the role. Return 'Unknown / Not Verifiable' if missing."),
        role: z.string().describe("The job title. Return 'Unspecified role' if missing."),
        salary: z.string().describe("The salary or compensation. Return 'Not specified' if missing."),
        location: z.string().describe("The job location. Return 'Not specified' if missing."),
        contactMethod: z.string().describe("The contact method mentioned (e.g. Telegram, WhatsApp, Email). Return 'Not specified' if missing."),
        applicationPath: z.string().describe("How to apply or progress (e.g. No interview mentioned, Direct message, Official portal). Return 'Not specified' if missing."),
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `Extract the requested job details from the following opportunity.\n\nText:\n${input.text}\n\nURL Context: ${input.url || 'None'}\nLocation Context: ${input.location || 'None'}` },
            ...(input.image ? [{ type: 'image', image: new URL(input.image) }] : [])
          ]
        }
      ] as any,
    })

    return object as ExtractedClaims
  } catch (err) {
    console.error('[AI SDK Error]', err)
    return {
      company: 'Unknown / Not Verifiable',
      role: 'Unspecified role',
      salary: 'Not specified',
      location: input.location || 'Not specified',
      contactMethod: 'Not specified',
      applicationPath: 'Not specified',
    }
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
  // Rate Limiting (UI Tier: 5 reqs / 1 min per IP)
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
  const rateLimitResult = checkRateLimit(ip, { limit: 5, windowMs: 60000 })
  if (!rateLimitResult.success) {
    const retryAfter = 'retryAfterMs' in rateLimitResult ? Math.ceil((rateLimitResult as any).retryAfterMs / 1000) : 60
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    })
  }

  let validated: AuditRequest
  
  try {
    const body = await request.json()
    validated = AuditRequestSchema.parse(body)
  } catch (error: any) {
    const message = error?.issues
      ? `Validation error: ${error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
      : 'Invalid request format'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  const sendEvent = (type: 'log' | 'result' | 'error', data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`))
  }

  // Process asynchronously
  ;(async () => {
    try {
      sendEvent('log', { message: 'Extracting role, pay, company, and contact claims...' })

      if (validated.mode === 'live' || (isSerpApiConfigured() && validated.mode !== 'demo')) {
        const extractedClaims = await extractClaims(validated)
        const hasCompany = !extractedClaims.company.toLowerCase().includes('unknown')
        let evidence: EvidenceItem[] = []

        if (hasCompany && isSerpApiConfigured() && process.env.MODEL_PROVIDER_KEY) {
          try {
            const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
            sendEvent('log', { message: `Orchestrating agent to investigate ${extractedClaims.company}...` })
            
            const result = await generateText({
              model: openai('gpt-4o-mini'),
              stopWhen: stepCountIs(5),
              experimental_onToolCallStart: async ({ toolCall }: any) => {
                const name = toolCall.toolName
                if (name === 'search_company') sendEvent('log', { message: `Checking official web presence and domain...` })
                if (name === 'news_check') sendEvent('log', { message: `Scanning news and media for scam reports...` })
                if (name === 'jobs_compare') sendEvent('log', { message: `Benchmarking against legitimate comparable roles...` })
                if (name === 'local_presence') sendEvent('log', { message: `Verifying local business registration and maps...` })
              },
              tools: {
                search_company: tool({
                  description: 'Search for company web presence, including official website, LinkedIn profile, domain registration, and business information',
                  parameters: z.object({ company_name: z.string(), role: z.string().optional() }),
                  execute: async (args: { company_name: string; role?: string }) => {
                    const res = await fetch(`${baseUrl}/api/mcp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGENT_API_KEY || 'hireproof_agent_demo_key' },
                      body: JSON.stringify({ method: 'tools/call', name: 'search_company', arguments: args })
                    })
                    return res.json()
                  }
                } as any),
                news_check: tool({
                  description: 'Search for recent news, reputation signals, scam reports, and media mentions about a company or role',
                  parameters: z.object({ company_name: z.string(), keywords: z.array(z.string()).optional() }),
                  execute: async (args: { company_name: string; keywords?: string[] }) => {
                    const res = await fetch(`${baseUrl}/api/mcp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGENT_API_KEY || 'hireproof_agent_demo_key' },
                      body: JSON.stringify({ method: 'tools/call', name: 'news_check', arguments: args })
                    })
                    return res.json()
                  }
                } as any),
                jobs_compare: tool({
                  description: 'Find comparable job listings from legitimate companies to benchmark salary, role, and requirements',
                  parameters: z.object({ role: z.string(), location: z.string().optional(), level: z.string().optional() }),
                  execute: async (args: { role: string; location?: string; level?: string }) => {
                    const res = await fetch(`${baseUrl}/api/mcp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGENT_API_KEY || 'hireproof_agent_demo_key' },
                      body: JSON.stringify({ method: 'tools/call', name: 'jobs_compare', arguments: args })
                    })
                    return res.json()
                  }
                } as any),
                local_presence: tool({
                  description: 'Check for local business footprint, maps, directories, business registration, and location signals',
                  parameters: z.object({ company_name: z.string(), location: z.string().optional() }),
                  execute: async (args: { company_name: string; location?: string }) => {
                    const res = await fetch(`${baseUrl}/api/mcp`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.AGENT_API_KEY || 'hireproof_agent_demo_key' },
                      body: JSON.stringify({ method: 'tools/call', name: 'local_presence', arguments: args })
                    })
                    return res.json()
                  }
                } as any)
              },
              prompt: `You are HireProof Agent, an expert job post investigator. 
  Your goal is to investigate this job post by gathering live evidence using your tools.
  
  Company: ${extractedClaims.company}
  Role: ${extractedClaims.role}
  Location: ${extractedClaims.location}
  
  You MUST call all four of your tools concurrently or sequentially to gather maximum evidence:
  1. search_company
  2. news_check
  3. jobs_compare
  4. local_presence
  
  Once you have called the tools, provide a brief summary of your findings.`,
            })

            sendEvent('log', { message: 'Agent finished research, compiling evidence...' })

            for (const step of result.steps) {
              for (const toolCall of step.toolResults) {
                const output = toolCall.output as any;
                if (output?.result?.evidence) {
                  evidence.push(...output.result.evidence)
                }
              }
            }

          } catch (agentError) {
            console.warn('[AI Agent] Execution loop failed or timed out. Falling back to concurrent direct execution.', agentError)
            sendEvent('log', { message: 'Agent taking too long, switching to fast concurrent search...' })
            
            const [companyEvidence, newsEvidence, jobsEvidence, localEvidence] = await Promise.all([
              searchCompanyPresence(extractedClaims.company, extractedClaims.role),
              searchNewsReputation(extractedClaims.company),
              searchComparableJobs(extractedClaims.role, extractedClaims.location),
              searchLocalPresence(extractedClaims.company, extractedClaims.location),
            ])

            evidence = [
              ...companyEvidence,
              ...newsEvidence,
              ...jobsEvidence,
              ...localEvidence,
            ]
          }
        } else if (isSerpApiConfigured()) {
          sendEvent('log', { message: 'Checking company footprint concurrently...' })
          
          const [companyEvidence, newsEvidence, jobsEvidence, localEvidence] = await Promise.all([
            hasCompany ? searchCompanyPresence(extractedClaims.company, extractedClaims.role) : Promise.resolve([]),
            hasCompany ? searchNewsReputation(extractedClaims.company) : Promise.resolve([]),
            searchComparableJobs(extractedClaims.role, extractedClaims.location),
            hasCompany ? searchLocalPresence(extractedClaims.company, extractedClaims.location) : Promise.resolve([]),
          ])

          evidence = [
            ...companyEvidence,
            ...newsEvidence,
            ...jobsEvidence,
            ...localEvidence,
          ]
        }

        sendEvent('log', { message: 'Calculating deterministic risk score...' })

        let redFlags = extractRedFlags(extractedClaims, evidence)
        const greenFlags = extractGreenFlags(extractedClaims, evidence)

        if (!hasCompany) {
          redFlags = [...redFlags, 'Company name could not be confidently extracted from the post']
        }
        if (hasCompany && evidence.filter(e => e.type === 'Local Presence').length === 0 && isSerpApiConfigured()) {
          redFlags = [...redFlags, 'No local presence found in search results']
        }
        if (evidence.length === 0 && isSerpApiConfigured()) {
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
          alternatives: buildAlternativeJobs(evidence),
          nextSteps: buildNextSteps(verdict, extractedClaims.company),
          timestamp: new Date().toISOString(),
          mode: 'live',
        }

        await saveReport(report)
        sendEvent('result', { data: report })
        return
      }

      // Fallback to demo fixtures
      const textLower = validated.text.toLowerCase()
      sendEvent('log', { message: 'Loading demo scenario...' })
      await new Promise(r => setTimeout(r, 800))
      sendEvent('log', { message: 'Retrieving historical case files...' })
      await new Promise(r => setTimeout(r, 600))
      sendEvent('log', { message: 'Finalizing report...' })
      await new Promise(r => setTimeout(r, 400))
      
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

      await saveReport(fixture)
      sendEvent('result', { data: fixture })
    } catch (error) {
      console.error('[Audit API] Error:', error)
      sendEvent('error', { message: 'Failed to complete audit' })
    } finally {
      writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

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
