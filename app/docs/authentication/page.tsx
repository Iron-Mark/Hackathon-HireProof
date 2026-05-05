import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata = { title: 'Authentication — HireProof' }

export default function Page() {
  return (
    <div>
      <h1 className="mb-4 text-4xl font-black tracking-tight">Authentication</h1>
      <p className="mb-10 text-lg font-semibold text-muted leading-8">
        HireProof uses API key authentication for all agent-facing endpoints. The web UI is public and rate-limited by IP.
      </p>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">How it works</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Pass your API key in the <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">x-api-key</code> request header.
          The key is validated server-side against the <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">AGENT_API_KEY</code> environment variable.
        </p>
        <CodeBlock title="Request Header" code={`x-api-key: your_secret_api_key`} />
        <div className="rounded-lg border border-safe/20 bg-safe/5 px-4 py-3 text-xs font-bold text-safe">
          The public demo key <code className="font-mono">hireproof_agent_demo_key</code> is active on the live platform and is safe to use for testing.
        </div>
      </section>

      {/* Endpoint table */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Endpoint Access</h2>
        <div className="max-w-full overflow-x-auto rounded-xl border border-border-soft">
          <table className="min-w-[38rem] w-full text-xs">
            <thead>
              <tr className="border-b border-border-soft bg-surface">
                <th className="px-4 py-3 text-left font-black text-muted">Endpoint</th>
                <th className="px-4 py-3 text-left font-black text-muted">Auth Required</th>
                <th className="px-4 py-3 text-left font-black text-muted">Rate Limit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { path: 'POST /api/audit', auth: 'None — public', limit: '5 req/min per IP', authColor: 'text-safe' },
                { path: 'POST /api/v1/audit', auth: 'x-api-key', limit: '20 req/min per key', authColor: 'text-caution' },
                { path: 'POST /api/mcp', auth: 'x-api-key', limit: '20 req/min per key', authColor: 'text-caution' },
                { path: 'GET /api/mcp', auth: 'x-api-key', limit: '20 req/min per key', authColor: 'text-caution' },
              ].map((row) => (
                <tr key={row.path} className="border-b border-border-soft last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold">{row.path}</td>
                  <td className={`px-4 py-3 font-black ${row.authColor}`}>{row.auth}</td>
                  <td className="px-4 py-3 text-muted">{row.limit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Self-hosted config */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Self-Hosting Configuration</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          If you are running your own deployment, set your own secret key in your environment file:
        </p>
        <CodeBlock title=".env.local" code={`# Required for headless API and MCP authentication
AGENT_API_KEY=my_super_secret_key_here`} />
        <p className="text-xs font-semibold text-muted">
          If this variable is not set, the system defaults to <code className="font-mono bg-surface px-1 rounded">hireproof_agent_demo_key</code> — suitable for local development only.
        </p>
      </section>

      {/* Next */}
      <div className="flex items-center justify-between rounded-2xl border border-border-soft bg-surface p-5">
        <div>
          <div className="text-sm font-black">Next: Rate Limiting</div>
          <p className="text-xs font-semibold text-muted mt-0.5">Understand how requests are throttled to prevent abuse.</p>
        </div>
        <Link href="/docs/rate-limiting" className="flex items-center gap-1.5 text-sm font-black text-safe hover:underline">
          Rate Limiting <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
