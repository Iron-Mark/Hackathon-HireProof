import { executeMCPTool, MCP_TOOLS } from '@/lib/mcp-tools'
import { checkRateLimit } from '@/lib/rate-limit'
import { timingSafeEqual } from 'crypto'

/**
 * MCP Route for HireProof
 * Exposes these tools:
 * - search_company: Check web presence
 * - news_check: Check reputation and scams
 * - jobs_compare: Compare with legitimate jobs
 * - local_presence: Verify local footprint
 */

export const runtime = 'nodejs'

function secureCompare(a: string, b: string) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

const VALID_METHODS = new Set(['tools/call', 'tools/list'])

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.AGENT_API_KEY || 'hireproof_agent_demo_key'
  
  if (!apiKey || !secureCompare(apiKey, expectedKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or missing x-api-key header.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // Rate limit MCP tool calls (30 reqs / 1 min per key)
  const rateLimitResult = await checkRateLimit(`mcp_${apiKey}`, { limit: 30, windowMs: 60000 })
  if (!rateLimitResult.success) {
    const retryAfter = 'retryAfterMs' in rateLimitResult ? Math.ceil((rateLimitResult as any).retryAfterMs / 1000) : 60
    return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
    })
  }

  try {
    // Guard against oversized payloads
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 100_000) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413, headers: { 'Content-Type': 'application/json' } })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    if (!body.method || typeof body.method !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid `method` field' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    if (!VALID_METHODS.has(body.method)) {
      return new Response(
        JSON.stringify({ error: `Unknown method: ${body.method}`, valid_methods: [...VALID_METHODS] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle MCP tool calls
    if (body.method === 'tools/call') {
      const { name, arguments: params } = body

      if (!name || typeof name !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing or invalid `name` field' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }

      // Validate tool exists
      const toolDefs = Object.values(MCP_TOOLS)
      if (!toolDefs.some(t => t.name === name)) {
        return new Response(
          JSON.stringify({
            error: `Unknown tool: ${name}`,
            available_tools: Object.values(MCP_TOOLS).map(t => t.name),
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Sanitize params — only allow plain objects
      const safeParams = (params && typeof params === 'object' && !Array.isArray(params)) ? params : {}

      // Execute tool with timeout
      const timeoutMs = 15_000
      const result = await Promise.race([
        executeMCPTool(name, safeParams),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Tool ${name} timed out after ${timeoutMs}ms`)), timeoutMs)),
      ])

      return new Response(
        JSON.stringify({ tool: name, result }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle tool listing
    if (body.method === 'tools/list') {
      return new Response(
        JSON.stringify({ tools: Object.values(MCP_TOOLS) }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown method' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MCP] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    // Don't leak stack traces in production
    return new Response(
      JSON.stringify({ error: message.includes('timed out') ? message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Health check & List
export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.AGENT_API_KEY || 'hireproof_agent_demo_key'
  
  if (!apiKey || !secureCompare(apiKey, expectedKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      tools: Object.keys(MCP_TOOLS),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
