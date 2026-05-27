import { executeMCPTool, MCP_TOOLS } from '@/lib/mcp-tools'
import { checkRateLimit } from '@/lib/rate-limit'
import { authenticateApiKey, getOwnerProviderCredentials, recordUsage } from '@/lib/auth-store'
import { readJsonRequest } from '@/lib/request-security'

/**
 * MCP Route for HireProof
 * Exposes these tools:
 * - search_company: Check web presence
 * - news_check: Check reputation and scams
 * - jobs_compare: Compare with legitimate jobs
 * - local_presence: Verify local footprint
 */

export const runtime = 'nodejs'

const VALID_METHODS = new Set(['tools/call', 'tools/list'])
const MCP_PAYLOAD_LIMIT_BYTES = 100_000
const JSON_RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

function requireByokForLiveApi() {
  return process.env.REQUIRE_BYOK_FOR_LIVE_API === 'true'
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const apiAuth = apiKey ? await authenticateApiKey(apiKey) : null
  
  if (!apiKey || !apiAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized. Invalid or missing x-api-key header.' }), { status: 401, headers: JSON_RESPONSE_HEADERS })
  }

  // Rate limit MCP tool calls (30 reqs / 1 min per key)
  const rateLimitResult = await checkRateLimit(`mcp:api_key:${apiAuth.apiKeyId}`, { limit: 30, windowMs: 60000 })
  if (!rateLimitResult.success) {
    const retryAfter = 'retryAfterMs' in rateLimitResult ? Math.ceil((rateLimitResult as any).retryAfterMs / 1000) : 60
    return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
      status: 429,
      headers: { ...JSON_RESPONSE_HEADERS, 'Retry-After': String(retryAfter) },
    })
  }

  try {
    const parsedJson = await readJsonRequest(request, MCP_PAYLOAD_LIMIT_BYTES, 'MCP payload')
    if (!parsedJson.ok) return parsedJson.response
    const body: any = parsedJson.value

    if (!body.method || typeof body.method !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid `method` field' }), { status: 400, headers: JSON_RESPONSE_HEADERS })
    }

    if (!VALID_METHODS.has(body.method)) {
      return new Response(
        JSON.stringify({ error: `Unknown method: ${body.method}`, valid_methods: [...VALID_METHODS] }),
        { status: 400, headers: JSON_RESPONSE_HEADERS }
      )
    }

    // Handle MCP tool calls
    if (body.method === 'tools/call') {
      const { name, arguments: params } = body

      if (!name || typeof name !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing or invalid `name` field' }), { status: 400, headers: JSON_RESPONSE_HEADERS })
      }

      // Validate tool exists
      const toolDefs = Object.values(MCP_TOOLS)
      if (!toolDefs.some(t => t.name === name)) {
        return new Response(
          JSON.stringify({
            error: `Unknown tool: ${name}`,
            available_tools: Object.values(MCP_TOOLS).map(t => t.name),
          }),
          { status: 400, headers: JSON_RESPONSE_HEADERS }
        )
      }

      // Sanitize params — only allow plain objects
      const safeParams = (params && typeof params === 'object' && !Array.isArray(params)) ? params : {}

      // Execute tool with timeout
      const timeoutMs = 15_000
      const ownerCredentials = apiAuth.isFallback ? {} : await getOwnerProviderCredentials(apiAuth.ownerId)
      if (requireByokForLiveApi() && !ownerCredentials.serpapiKey) {
        return new Response(JSON.stringify({
          error: 'Platform MCP search credentials are disabled after hackathon submission. Add BYOK SerpApi credentials in the developer portal.',
        }), { status: 503, headers: JSON_RESPONSE_HEADERS })
      }
      const result = await Promise.race([
        executeMCPTool(name, safeParams, { serpapiKey: ownerCredentials.serpapiKey }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Tool ${name} timed out after ${timeoutMs}ms`)), timeoutMs)),
      ])
      await recordUsage({ ownerId: apiAuth.ownerId, apiKeyId: apiAuth.apiKeyId, endpoint: `/api/mcp:${name}`, status: 200 })

      return new Response(
        JSON.stringify({ tool: name, result }),
        { status: 200, headers: JSON_RESPONSE_HEADERS }
      )
    }

    // Handle tool listing
    if (body.method === 'tools/list') {
      return new Response(
        JSON.stringify({ tools: Object.values(MCP_TOOLS) }),
        { status: 200, headers: JSON_RESPONSE_HEADERS }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown method' }),
      { status: 400, headers: JSON_RESPONSE_HEADERS }
    )
  } catch (error) {
    console.error('[MCP] Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    // Don't leak stack traces in production
    return new Response(
      JSON.stringify({ error: message.includes('timed out') ? message : 'Internal server error' }),
      { status: 500, headers: JSON_RESPONSE_HEADERS }
    )
  }
}

// Health check & List
export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key')
  const apiAuth = apiKey ? await authenticateApiKey(apiKey) : null
  
  if (!apiKey || !apiAuth) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), { status: 401, headers: JSON_RESPONSE_HEADERS })
  }

  return new Response(
    JSON.stringify({
      status: 'ok',
      tools: Object.keys(MCP_TOOLS),
    }),
    { status: 200, headers: JSON_RESPONSE_HEADERS }
  )
}
