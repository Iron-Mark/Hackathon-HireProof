import { CodeBlock } from '@/components/ui/code-block'
import { Cpu, Box, Terminal, ShieldCheck, Zap } from 'lucide-react'

export const metadata = { 
  title: 'MCP Server — HireProof Docs',
  description: 'Connect your AI agents directly to HireProof tools via the Model Context Protocol.'
}

export default function McpPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">MCP Server</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof exposes its core investigation tools via the <strong className="text-foreground">Model Context Protocol (MCP)</strong>, allowing external AI agents to gather evidence autonomously.
        </p>
      </section>

      {/* Available Tools */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Box className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Available Tools</h2>
        </div>
        <div className="grid gap-4">
          {[
            { 
              name: 'search_company', 
              desc: 'Searches Google for the company website, LinkedIn page, and overall web presence. Returns evidence items with source URLs.', 
              params: 'company_name (required), role (optional)' 
            },
            { 
              name: 'news_check', 
              desc: 'Searches Google News for scam reports, fraud warnings, and reputation signals about the company.', 
              params: 'company_name (required), keywords (optional array)' 
            },
            { 
              name: 'jobs_compare', 
              desc: 'Searches job boards for comparable roles to benchmark salary and requirements against the market.', 
              params: 'role (required), location (optional), level (optional)' 
            },
            { 
              name: 'local_presence', 
              desc: 'Searches Google Maps for the company\'s physical address, office registration, and local business footprint.', 
              params: 'company_name (required), location (optional)' 
            },
          ].map((tool) => (
            <div key={tool.name} className="rounded-2xl border border-border-soft bg-surface p-6">
              <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-black text-evidence">{tool.name}</code>
                <span className="rounded-full bg-evidence/10 px-2 py-0.5 text-[10px] font-black text-evidence uppercase">Tool</span>
              </div>
              <p className="text-sm font-medium text-muted leading-relaxed mb-3">{tool.desc}</p>
              <div className="rounded-lg bg-background/50 px-3 py-1.5 text-[10px] font-bold text-muted border border-border-soft">
                Parameters: <span className="font-mono text-foreground">{tool.params}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usage */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Terminal className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Protocol Usage</h2>
        </div>
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted leading-relaxed">
            MCP clients (like Cursor or Claude) can list and call these tools using standard JSON-RPC over HTTP.
          </p>
          <CodeBlock title="List all tools" code={`curl https://hireproof.app/api/mcp \\
  -H "x-api-key: hireproof_agent_demo_key"`} />
          <CodeBlock title="Call search_company" code={`curl -X POST https://hireproof.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{
    "method": "tools/call",
    "name": "search_company",
    "arguments": { "company_name": "Accenture" }
  }'`} />
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-safe" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-safe">Enterprise Security</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              The MCP server enforces strict <strong>x-api-key</strong> authentication and rate-limiting. For high-volume agent clusters, we recommend using a dedicated API key with increased tool-calling quotas.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
