import { CodeBlock } from '@/components/ui/code-block'
import { ApiPlayground } from '@/components/docs/api-playground'

export const metadata = { title: 'API Reference — HireProof' }

function Endpoint({ method, path, badge, description, children }: {
  method: string; path: string; badge?: string; description: string; children: React.ReactNode
}) {
  const methodColor = method === 'POST' ? 'bg-evidence/10 text-evidence' : 'bg-safe/10 text-safe'
  return (
    <section className="mb-12 scroll-mt-32">
      <div className="mb-4 flex items-center gap-3">
        <span className={`rounded-md px-2.5 py-1 text-xs font-black ${methodColor}`}>{method}</span>
        <code className="text-sm font-black">{path}</code>
        {badge && <span className="rounded-full bg-caution/10 px-2 py-0.5 text-[10px] font-black text-caution">{badge}</span>}
      </div>
      <p className="mb-6 text-sm font-semibold text-muted leading-relaxed">{description}</p>
      {children}
    </section>
  )
}

function ParamTable({ params }: { params: Array<{ name: string; type: string; required: boolean; desc: string }> }) {
  return (
    <div className="mb-4 max-w-full overflow-x-auto rounded-xl border border-border-soft">
      <table className="min-w-[42rem] w-full text-xs">
        <thead><tr className="border-b border-border-soft bg-surface">
          <th className="px-4 py-2.5 text-left font-black text-muted">Parameter</th>
          <th className="px-4 py-2.5 text-left font-black text-muted">Type</th>
          <th className="px-4 py-2.5 text-left font-black text-muted">Required</th>
          <th className="px-4 py-2.5 text-left font-black text-muted">Description</th>
        </tr></thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border-soft last:border-0">
              <td className="px-4 py-2.5 font-mono font-bold">{p.name}</td>
              <td className="px-4 py-2.5 text-muted">{p.type}</td>
              <td className="px-4 py-2.5">{p.required ? <span className="text-risk-text font-black">Yes</span> : <span className="text-muted">No</span>}</td>
              <td className="px-4 py-2.5 text-muted">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ApiReferencePage() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="mb-4 text-4xl font-black tracking-tight">API Reference</h1>
        <p className="text-lg font-semibold leading-8 text-muted">
          Complete reference for HireProof&apos;s REST and MCP endpoints. All authenticated endpoints require an <code className="rounded bg-surface px-1.5 py-0.5 text-sm font-bold">x-api-key</code> header.
        </p>
      </div>

      <div className="mb-16">
        <ApiPlayground />
      </div>

      {/* Base URL */}
      <div className="mb-10 overflow-hidden rounded-xl border border-border-soft bg-surface">
        <div className="border-b border-border-soft px-4 py-3 text-xs font-black text-muted">Base URL</div>
        <div className="px-4 py-3">
          <code className="text-sm font-black">https://yourapp.vercel.app</code>
        </div>
      </div>

      <hr className="border-border-soft mb-10" />

      {/* POST /api/audit */}
      <div id="audit-sse" />
      <Endpoint method="POST" path="/api/audit" badge="SSE Stream" description="Streams real-time investigation progress via Server-Sent Events. Used by the web UI frontend. No authentication required (rate limited by IP).">
        <ParamTable params={[
          { name: 'text', type: 'string', required: true, desc: 'The job post text to investigate' },
          { name: 'url', type: 'string', required: false, desc: 'Job posting URL for context' },
          { name: 'location', type: 'string', required: false, desc: 'Location for local signals' },
          { name: 'image', type: 'string', required: false, desc: 'Base64 data URI of screenshot' },
          { name: 'mode', type: '"live" | "demo"', required: false, desc: 'Force live or demo mode' },
        ]} />
        <CodeBlock title="SSE Event Types" code={`event: thinking
data: {"step":"Extracting claims from job post..."}

event: thinking  
data: {"step":"Searching company web presence..."}

event: result
data: {"verdict":"high-risk","riskScore":85,...}

event: error
data: {"message":"Investigation failed"}`} />
      </Endpoint>

      <hr className="border-border-soft mb-10" />

      {/* POST /api/v1/audit */}
      <div id="audit-headless" />
      <Endpoint method="POST" path="/api/v1/audit" badge="Auth Required" description="Headless JSON endpoint for external AI agents. Returns the complete AuditReport synchronously, or accepts a webhook_url for async processing.">
        <div className="mb-4 rounded-lg bg-caution/10 border border-caution/20 px-4 py-3 text-xs font-bold text-caution-text">
          Requires <code className="font-mono">x-api-key</code> header. Rate limited to 20 requests/minute per key.
        </div>
        <ParamTable params={[
          { name: 'text', type: 'string', required: true, desc: 'The job post text to investigate' },
          { name: 'url', type: 'string', required: false, desc: 'Job posting URL for context' },
          { name: 'location', type: 'string', required: false, desc: 'Location for local signals' },
          { name: 'image', type: 'string', required: false, desc: 'Base64 data URI of screenshot' },
          { name: 'mode', type: '"live" | "demo"', required: false, desc: 'Force live or demo mode' },
          { name: 'webhook_url', type: 'string (URL)', required: false, desc: 'If provided, returns 202 and POSTs result to this URL' },
        ]} />
        <CodeBlock title="Request (Synchronous)" code={`curl -X POST https://yourapp.vercel.app/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{
    "text": "Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram."
  }'`} />
        <CodeBlock title="Request (Async with Webhook)" code={`curl -X POST https://yourapp.vercel.app/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{
    "text": "Join our team as a data analyst...",
    "webhook_url": "https://myagent.example.com/callback"
  }'

# Response: 202 Accepted
# {"status":"processing","message":"Investigation started..."}`} />
        <CodeBlock title="Response (200 OK)" code={`{
  "id": "report_1714300000000",
  "verdict": "high-risk",
  "riskScore": 85,
  "confidence": "Very High",
  "summary": "This opportunity has multiple red flags...",
  "extractedClaims": {
    "company": "Unknown / Not Verifiable",
    "role": "Frontend Intern",
    "salary": "PHP 80,000/week",
    "location": "Philippines",
    "contactMethod": "Telegram",
    "applicationPath": "No interview mentioned"
  },
  "redFlags": ["Unrealistically high salary...", "Telegram-only contact..."],
  "greenFlags": [],
  "evidence": [{"source":"Google","snippet":"...","url":"...","type":"Company Check"}],
  "alternatives": [{"title":"Frontend Dev","company":"Accenture","salary":"PHP 25,000/mo"}],
  "nextSteps": ["Do not send money, IDs, or bank details..."],
  "timestamp": "2026-04-29T03:00:00.000Z",
  "mode": "live"
}`} />
      </Endpoint>

      <hr className="border-border-soft mb-10" />

      {/* MCP endpoints */}
      <div id="mcp-call" />
      <Endpoint method="POST" path="/api/mcp" badge="Auth Required" description="Execute an MCP investigation tool. Used for direct tool-calling by external AI agents.">
        <ParamTable params={[
          { name: 'method', type: '"tools/call" | "tools/list"', required: true, desc: 'MCP method to invoke' },
          { name: 'name', type: 'string', required: false, desc: 'Tool name (required for tools/call)' },
          { name: 'arguments', type: 'object', required: false, desc: 'Tool-specific parameters' },
        ]} />
        <CodeBlock title="Available Tools" code={`search_company   — Check company web presence
  args: { company_name: string, role?: string }

news_check       — Search for scam reports and news
  args: { company_name: string, keywords?: string[] }

jobs_compare     — Find comparable job listings
  args: { role: string, location?: string, level?: string }

local_presence   — Verify local business footprint
  args: { company_name: string, location?: string }`} />
        <CodeBlock title="Example: Call a Tool" code={`curl -X POST https://yourapp.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{
    "method": "tools/call",
    "name": "search_company",
    "arguments": { "company_name": "Accenture", "role": "Frontend Developer" }
  }'`} />
      </Endpoint>

      <div id="mcp-list" />
      <Endpoint method="GET" path="/api/mcp" badge="Auth Required" description="List all available MCP tools and their schemas. Health check endpoint.">
        <CodeBlock title="Response" code={`{
  "status": "ok",
  "tools": ["search_company", "news_check", "jobs_compare", "local_presence"]
}`} />
      </Endpoint>

      <hr className="border-border-soft mb-10" />

      {/* Schemas */}
      <div id="schema-request" />
      <h2 className="mb-4 text-2xl font-black">Schemas</h2>
      <h3 className="mb-3 text-lg font-black">AuditRequest</h3>
      <ParamTable params={[
        { name: 'text', type: 'string', required: true, desc: 'Job post text (min 1 char)' },
        { name: 'url', type: 'string', required: false, desc: 'Valid URL of the job posting' },
        { name: 'location', type: 'string', required: false, desc: 'Geographic location for local signals' },
        { name: 'mode', type: '"live" | "demo"', required: false, desc: 'Force investigation mode' },
        { name: 'image', type: 'string', required: false, desc: 'Base64 data URI (max 5MB)' },
        { name: 'webhook_url', type: 'string', required: false, desc: 'Webhook callback URL (headless API only)' },
      ]} />

      <div id="schema-report" />
      <h3 className="mb-3 mt-8 text-lg font-black">AuditReport</h3>
      <ParamTable params={[
        { name: 'id', type: 'string', required: false, desc: 'Unique report identifier' },
        { name: 'verdict', type: '"safe" | "caution" | "high-risk"', required: true, desc: 'Final verdict' },
        { name: 'riskScore', type: 'number (0-100)', required: true, desc: 'Weighted risk score' },
        { name: 'confidence', type: 'string', required: true, desc: '"Low" | "Medium" | "High" | "Very High"' },
        { name: 'summary', type: 'string', required: true, desc: 'Executive summary of findings' },
        { name: 'extractedClaims', type: 'object', required: true, desc: 'Structured claims from the post' },
        { name: 'redFlags', type: 'string[]', required: true, desc: 'List of risk signals found' },
        { name: 'greenFlags', type: 'string[]', required: true, desc: 'List of positive signals' },
        { name: 'evidence', type: 'EvidenceItem[]', required: true, desc: 'Supporting evidence with URLs' },
        { name: 'alternatives', type: 'AlternativeJob[]', required: true, desc: 'Comparable legitimate jobs' },
        { name: 'nextSteps', type: 'string[]', required: true, desc: 'Recommended actions' },
        { name: 'timestamp', type: 'string', required: false, desc: 'ISO 8601 timestamp' },
        { name: 'mode', type: '"live" | "demo"', required: false, desc: 'Which mode was used' },
      ]} />

      <div id="errors" />
      <h3 className="mb-3 mt-8 text-lg font-black">Error Responses</h3>
      <div className="max-w-full overflow-x-auto rounded-xl border border-border-soft">
        <table className="min-w-[32rem] w-full text-xs">
          <thead><tr className="border-b border-border-soft bg-surface">
            <th className="px-4 py-2.5 text-left font-black text-muted">Status</th>
            <th className="px-4 py-2.5 text-left font-black text-muted">Meaning</th>
          </tr></thead>
          <tbody>
            <tr className="border-b border-border-soft"><td className="px-4 py-2.5 font-mono font-bold">400</td><td className="px-4 py-2.5 text-muted">Invalid request format or unknown MCP method/tool</td></tr>
            <tr className="border-b border-border-soft"><td className="px-4 py-2.5 font-mono font-bold">401</td><td className="px-4 py-2.5 text-muted">Missing or invalid x-api-key header</td></tr>
            <tr className="border-b border-border-soft"><td className="px-4 py-2.5 font-mono font-bold">429</td><td className="px-4 py-2.5 text-muted">Rate limit exceeded</td></tr>
            <tr><td className="px-4 py-2.5 font-mono font-bold">500</td><td className="px-4 py-2.5 text-muted">Internal server error during investigation</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
