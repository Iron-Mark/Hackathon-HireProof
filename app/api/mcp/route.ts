import { executeMCPTool, MCP_TOOLS } from '@/lib/mcp-tools'

/**
 * MCP Route for HireProof
 * Exposes these tools:
 * - search_company: Check web presence
 * - news_check: Check reputation and scams
 * - jobs_compare: Compare with legitimate jobs
 * - local_presence: Verify local footprint
 *
 * TODO: Replace mock responses with real SerpApi calls in Phase 5
 */

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Handle MCP tool calls
    if (body.method === 'tools/call') {
      const { name, arguments: params } = body

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

      // Execute tool
      const result = await executeMCPTool(name, params)

      return new Response(
        JSON.stringify({
          tool: name,
          result,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle tool listing
    if (body.method === 'tools/list') {
      return new Response(
        JSON.stringify({
          tools: Object.values(MCP_TOOLS),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Unknown method' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[MCP] Error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
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
      tools: Object.keys(MCP_TOOLS),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}
