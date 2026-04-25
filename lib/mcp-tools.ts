import type { EvidenceItem } from '@/lib/schemas'
import {
  searchCompanyPresence,
  searchNewsReputation,
  searchComparableJobs,
  searchLocalPresence,
} from '@/lib/serpapi'

// MCP Tool definitions
export const MCP_TOOLS = {
  search_company: {
    name: 'search_company',
    description: 'Search for company web presence, including official website, LinkedIn profile, domain registration, and business information',
    inputSchema: {
      type: 'object' as const,
      properties: {
        company_name: { type: 'string', description: 'Name of the company to search' },
        role: { type: 'string', description: 'Job role to verify against company' },
      },
      required: ['company_name'],
    },
  },
  news_check: {
    name: 'news_check',
    description: 'Search for recent news, reputation signals, scam reports, and media mentions about a company or role',
    inputSchema: {
      type: 'object' as const,
      properties: {
        company_name: { type: 'string', description: 'Company name or keyword to search in news' },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Additional keywords like "scam", "fraud", "review"',
        },
      },
      required: ['company_name'],
    },
  },
  jobs_compare: {
    name: 'jobs_compare',
    description: 'Find comparable job listings from legitimate companies to benchmark salary, role, and requirements',
    inputSchema: {
      type: 'object' as const,
      properties: {
        role: { type: 'string', description: 'Job role to compare' },
        location: { type: 'string', description: 'Location for salary benchmarking' },
        level: { type: 'string', description: 'Career level (intern, junior, senior, etc.)' },
      },
      required: ['role'],
    },
  },
  local_presence: {
    name: 'local_presence',
    description: 'Check for local business footprint, maps, directories, business registration, and location signals',
    inputSchema: {
      type: 'object' as const,
      properties: {
        company_name: { type: 'string', description: 'Company name' },
        location: { type: 'string', description: 'City or region to verify local presence' },
      },
      required: ['company_name'],
    },
  },
}

// Execute MCP tools with SerpApi backend
export async function executeMCPTool(
  toolName: string,
  params: Record<string, any>
): Promise<{
  evidence: EvidenceItem[]
  summary: string
  risk_indicators: string[]
}> {
  try {
    switch (toolName) {
      case 'search_company': {
        const companyName = params.company_name || ''
        const role = params.role || ''
        const evidence = await searchCompanyPresence(companyName, role)
        return {
          evidence,
          summary: evidence.length > 0
            ? `Found web presence for ${companyName}`
            : `Unable to verify company web presence for ${companyName}`,
          risk_indicators: evidence.length === 0 ? ['company_not_found'] : [],
        }
      }

      case 'news_check': {
        const companyName = params.company_name || ''
        const evidence = await searchNewsReputation(companyName)
        
        // Check for negative keywords in results
        const negativeKeywords = ['scam', 'fraud', 'lawsuit', 'bankruptcy']
        const hasNegativeSignals = evidence.some(e =>
          negativeKeywords.some(kw => e.snippet?.toLowerCase().includes(kw))
        )

        return {
          evidence,
          summary: hasNegativeSignals
            ? `Found concerning news reports about ${companyName}`
            : `No major reputation issues found for ${companyName}`,
          risk_indicators: hasNegativeSignals ? ['negative_news'] : [],
        }
      }

      case 'jobs_compare': {
        const role = params.role || ''
        const location = params.location || 'United States'
        const evidence = await searchComparableJobs(role, location)
        return {
          evidence,
          summary: evidence.length > 0
            ? `Found ${evidence.length} comparable job listings for benchmarking`
            : `Unable to find comparable jobs for ${role}`,
          risk_indicators: [],
        }
      }

      case 'local_presence': {
        const companyName = params.company_name || ''
        const location = params.location || ''
        const evidence = await searchLocalPresence(companyName, location)
        return {
          evidence,
          summary: evidence.length > 0
            ? `Verified local business presence in ${location}`
            : `Unable to verify local presence for ${companyName}`,
          risk_indicators: evidence.length === 0 ? ['no_local_presence'] : [],
        }
      }

      default:
        return {
          evidence: [],
          summary: `Unknown tool: ${toolName}`,
          risk_indicators: [],
        }
    }
  } catch (error) {
    console.error(`[MCP] Error executing ${toolName}:`, error)
    return {
      evidence: [],
      summary: `Error executing ${toolName}`,
      risk_indicators: [],
    }
  }
}
