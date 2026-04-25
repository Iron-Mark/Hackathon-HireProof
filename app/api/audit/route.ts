import { AuditRequestSchema, type AuditReport } from '@/lib/schemas'
import { DEMO_FIXTURES } from '@/lib/fixtures'
import {
  calculateRiskScore,
  determineVerdict,
  getConfidenceLabel,
  extractRedFlags,
  extractGreenFlags,
  generateSummary,
} from '@/lib/risk-scorer'

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
 * TODO: Integrate AI SDK to extract claims and call MCP tools
 */

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validated = AuditRequestSchema.parse(body)

    // TODO: Phase 6 - AI SDK integration
    // Extract claims from text using Claude/GPT
    // Call MCP tools to gather evidence
    // Compute risk score and verdict

    // For now, return demo fixture based on heuristics
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
  return new Response(
    JSON.stringify({
      status: 'ok',
      mode: 'demo',
      apiKeys: {
        serpapi: !!process.env.SERPAPI_API_KEY,
        ai_provider: !!process.env.MODEL_PROVIDER_KEY,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
