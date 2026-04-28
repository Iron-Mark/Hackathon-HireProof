import Link from 'next/link'
import { Package, Zap, Wrench, Webhook, ArrowRight } from 'lucide-react'

export const metadata = { title: 'SDK Overview — HireProof' }

export default function SdkPage() {
  return (
    <div>
      <div className="mb-2 inline-block rounded-full bg-evidence/10 px-3 py-1 text-xs font-black text-evidence">hireproof-sdk</div>
      <h1 className="mb-4 text-4xl font-black tracking-tight">HireProof SDK</h1>
      <p className="mb-8 text-lg font-semibold leading-8 text-muted">
        A typed TypeScript client for the HireProof Job Verification API. Investigate job posts, call individual MCP tools,
        and receive async webhook results — all with full type safety.
      </p>

      {/* Install */}
      <div className="mb-8 rounded-2xl border border-border-soft bg-surface overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 border-b border-border-soft px-4 py-2.5">
          <div className="h-3 w-3 rounded-full bg-risk-text/40" />
          <div className="h-3 w-3 rounded-full bg-caution/40" />
          <div className="h-3 w-3 rounded-full bg-safe/40" />
          <span className="ml-2 text-xs font-black text-muted">Terminal</span>
        </div>
        <pre className="overflow-x-auto p-5 text-sm leading-7"><code>{`npm install hireproof-sdk`}</code></pre>
      </div>

      {/* Hero code example */}
      <div className="mb-10 rounded-2xl border border-border-soft bg-surface overflow-hidden shadow-sm">
        <div className="border-b border-border-soft px-4 py-2.5 text-xs font-black text-muted">TypeScript</div>
        <pre className="overflow-x-auto p-5 text-sm leading-7"><code>{`import HireProof from 'hireproof-sdk'

const client = new HireProof({
  apiKey: process.env.HIREPROOF_API_KEY,
  baseUrl: 'https://yourapp.vercel.app',
})

const report = await client.audit.investigate({
  text: 'Remote frontend intern. PHP 80,000/week. No interview.',
  location: 'Philippines',
})

console.log(report.verdict)       // 'high-risk'
console.log(report.riskScore)     // 85
console.log(report.redFlags)      // ['Unrealistically high salary...']
console.log(report.nextSteps)     // ['Do not send personal info...']`}</code></pre>
      </div>

      {/* Key concepts grid */}
      <h2 className="mb-5 text-2xl font-black">Core Concepts</h2>
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Package, title: 'Client', desc: 'Initialize with apiKey and baseUrl. All methods are namespaced under resource objects.', href: '/docs/sdk-quickstart' },
          { icon: Zap, title: 'Audit', desc: 'client.audit.investigate() — run a full investigation and get a typed AuditReport.', href: '/docs/sdk-quickstart#investigate' },
          { icon: Wrench, title: 'MCP Tools', desc: 'client.mcp.callTool() — call individual evidence-gathering tools directly.', href: '/docs/sdk-quickstart#tools' },
          { icon: Webhook, title: 'Async Webhooks', desc: 'client.audit.investigateAsync() — fire-and-forget with a webhook callback.', href: '/docs/sdk-quickstart#async' },
        ].map((item) => (
          <Link key={item.title} href={item.href} className="group rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:border-evidence hover:shadow-md">
            <item.icon className="mb-3 h-5 w-5 text-evidence" />
            <div className="text-sm font-black group-hover:text-evidence">{item.title}</div>
            <div className="mt-1 text-xs font-semibold text-muted">{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* API at a glance */}
      <h2 className="mb-5 text-2xl font-black">API at a Glance</h2>
      <div className="mb-10 overflow-hidden rounded-xl border border-border-soft">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border-soft bg-surface">
            <th className="px-4 py-2.5 text-left font-black text-muted">Method</th>
            <th className="px-4 py-2.5 text-left font-black text-muted">Returns</th>
            <th className="px-4 py-2.5 text-left font-black text-muted">Description</th>
          </tr></thead>
          <tbody>
            {[
              ['client.audit.investigate(req)', 'Promise<AuditReport>', 'Full synchronous investigation'],
              ['client.audit.investigateAsync(req)', 'Promise<AsyncAccepted>', 'Async investigation with webhook'],
              ['client.mcp.listTools()', 'Promise<McpListResponse>', 'List available MCP tools'],
              ['client.mcp.callTool(name, args)', 'Promise<McpToolResult>', 'Call a specific MCP tool'],
            ].map(([method, returns, desc]) => (
              <tr key={method} className="border-b border-border-soft last:border-0">
                <td className="px-4 py-2.5 font-mono font-bold text-evidence">{method}</td>
                <td className="px-4 py-2.5 font-mono text-muted">{returns}</td>
                <td className="px-4 py-2.5 text-muted font-semibold">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next steps */}
      <Link href="/docs/sdk-quickstart" className="group flex items-center justify-between rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:border-evidence hover:shadow-md">
        <div>
          <div className="text-sm font-black group-hover:text-evidence">SDK Quickstart →</div>
          <div className="mt-1 text-xs font-semibold text-muted">Build your first agent integration in 5 minutes</div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted group-hover:text-evidence" />
      </Link>
    </div>
  )
}
