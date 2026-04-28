import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'SDK Quickstart — HireProof' }

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-evidence text-sm font-black text-white">{n}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Code({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface overflow-hidden shadow-sm">
      <div className="border-b border-border-soft px-4 py-2 text-xs font-black text-muted">{title}</div>
      <pre className="overflow-x-auto p-4 text-xs leading-6"><code>{code}</code></pre>
    </div>
  )
}

export default function SdkQuickstartPage() {
  return (
    <div>
      <h1 className="mb-4 text-4xl font-black tracking-tight">SDK Quickstart</h1>
      <p className="mb-10 text-lg font-semibold leading-8 text-muted">
        Build your first agent integration with HireProof in 5 minutes. This guide walks you through
        installation, running an investigation, calling individual tools, and handling async webhooks.
      </p>

      {/* Step 1: Install */}
      <Step n={1} title="Install the SDK">
        <Code title="Terminal" code="npm install hireproof-sdk" />
      </Step>

      {/* Step 2: Initialize */}
      <Step n={2} title="Create a client">
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Initialize the client with your API key and the base URL of your HireProof deployment.
        </p>
        <Code title="agent.ts" code={`import HireProof from 'hireproof-sdk'

const client = new HireProof({
  apiKey: process.env.HIREPROOF_API_KEY!,
  baseUrl: 'https://yourapp.vercel.app',  // or http://localhost:3000
  timeout: 60000,  // optional, defaults to 60s
})`} />
      </Step>

      {/* Step 3: Investigate */}
      <div id="investigate" />
      <Step n={3} title="Run your first investigation">
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Pass a suspicious job post to <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">client.audit.investigate()</code>.
          The SDK sends it to the Headless API, which runs the full agent loop and returns a typed <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">AuditReport</code>.
        </p>
        <Code title="agent.ts" code={`const report = await client.audit.investigate({
  text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
  location: 'Philippines',
})

console.log(report.verdict)           // 'high-risk'
console.log(report.riskScore)         // 85
console.log(report.confidence)        // 'Very High'
console.log(report.extractedClaims)   // { company: '...', role: '...', salary: '...', ... }
console.log(report.redFlags)          // ['Unrealistically high salary...', 'Telegram-only...']
console.log(report.evidence)          // [{ source: 'Google', snippet: '...', url: '...' }, ...]
console.log(report.alternatives)      // [{ title: '...', company: '...', salary: '...' }, ...]
console.log(report.nextSteps)         // ['Do not send personal information...']`} />
        <div className="mt-4 rounded-lg border border-safe/20 bg-safe/5 px-4 py-3 text-xs font-bold text-safe">
          💡 The SDK uses the Headless API (<code>/api/v1/audit</code>), not the SSE endpoint. Authentication is handled automatically.
        </div>
      </Step>

      {/* Step 4: MCP Tools */}
      <div id="tools" />
      <Step n={4} title="Call individual MCP tools">
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Instead of running a full investigation, you can call individual evidence-gathering tools directly.
          This is useful when your agent already knows what to look up.
        </p>
        <Code title="agent.ts — List available tools" code={`const tools = await client.mcp.listTools()
console.log(tools.tools)
// ['search_company', 'news_check', 'jobs_compare', 'local_presence']`} />
        <div className="mt-4" />
        <Code title="agent.ts — Call a tool" code={`// Search for company web presence
const companyResult = await client.mcp.callTool('search_company', {
  company_name: 'Accenture',
  role: 'Frontend Developer',
})
console.log(companyResult.content[0].text)

// Check for scam reports
const newsResult = await client.mcp.callTool('news_check', {
  company_name: 'TechStart Solutions',
  keywords: ['scam', 'fraud'],
})

// Find comparable job listings
const jobsResult = await client.mcp.callTool('jobs_compare', {
  role: 'Frontend Intern',
  location: 'Philippines',
  level: 'Entry Level',
})

// Verify local business presence
const localResult = await client.mcp.callTool('local_presence', {
  company_name: 'Accenture',
  location: 'Philippines',
})`} />
      </Step>

      {/* Step 5: Async */}
      <div id="async" />
      <Step n={5} title="Async investigation with webhooks">
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          For non-blocking workflows, use <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">investigateAsync()</code>.
          The server returns immediately with <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">202 Accepted</code>,
          and POSTs the full <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">AuditReport</code> to your webhook when done.
        </p>
        <Code title="agent.ts" code={`const accepted = await client.audit.investigateAsync({
  text: 'We are hiring data analysts. No experience needed...',
  location: 'United States',
  webhookUrl: 'https://myagent.example.com/hireproof-callback',
})

console.log(accepted.status)   // 'processing'
console.log(accepted.message)  // 'Investigation started...'

// Your webhook endpoint will receive the full AuditReport
// as a POST request when the investigation completes.`} />
      </Step>

      {/* Step 6: Error handling */}
      <Step n={6} title="Handle errors">
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          The SDK throws a typed <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">HireProofError</code> for all API errors,
          giving you the HTTP status code and response body.
        </p>
        <Code title="agent.ts" code={`import HireProof, { HireProofError } from 'hireproof-sdk'

try {
  const report = await client.audit.investigate({ text: '...' })
} catch (err) {
  if (err instanceof HireProofError) {
    console.error(\`API error \${err.status}: \${err.message}\`)
    // err.status → 401 (bad key), 429 (rate limit), 500 (server error)
    // err.body   → raw JSON response
  }
}`} />
      </Step>

      {/* Where to go next */}
      <h2 className="mb-5 text-2xl font-black">Where to go next</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: 'API Reference', desc: 'Full endpoint docs, parameter tables, and schemas', href: '/docs/api-reference' },
          { title: 'MCP Server', desc: 'Deep dive into the 4 investigation tools', href: '/docs/mcp' },
          { title: 'Webhooks', desc: 'Async patterns and callback payloads', href: '/docs/webhooks' },
          { title: 'Rate Limiting', desc: 'Understand limits for agent vs UI traffic', href: '/docs/rate-limiting' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="group flex items-center justify-between rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:border-evidence hover:shadow-md">
            <div>
              <div className="text-sm font-black group-hover:text-evidence">{item.title}</div>
              <div className="mt-1 text-xs font-semibold text-muted">{item.desc}</div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted group-hover:text-evidence" />
          </Link>
        ))}
      </div>
    </div>
  )
}
