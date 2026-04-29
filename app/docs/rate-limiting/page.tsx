import { ShieldAlert, Zap, Globe, Lock, Info, Terminal, Activity } from 'lucide-react'

export const metadata = { 
  title: 'Rate Limiting — HireProof Docs',
  description: 'Understand the multi-tier rate limiting architecture that protects HireProof from abuse.'
}

export default function RateLimitingPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Rate Limiting</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof utilizes a multi-tier rate limiting strategy to ensure platform stability and protect against "Denial of Wallet" attacks.
        </p>
      </section>

      {/* Tiers */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Activity className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Limiting Tiers</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-safe/10 px-3 py-1 text-[10px] font-black text-safe uppercase tracking-widest">Public UI</span>
              <code className="text-[10px] text-muted">/api/audit</code>
            </div>
            <div className="text-2xl font-black mb-1">5 req/min</div>
            <p className="text-xs font-medium text-muted leading-relaxed">
              Keyed by client IP address. Designed for individual job seekers verifying occasional listings.
            </p>
          </div>
          <div className="rounded-3xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-evidence/10 px-3 py-1 text-[10px] font-black text-evidence uppercase tracking-widest">Agent API</span>
              <code className="text-[10px] text-muted">/api/v1/audit</code>
            </div>
            <div className="text-2xl font-black mb-1">20 req/min</div>
            <p className="text-xs font-medium text-muted leading-relaxed">
              Keyed by API Key. Designed for automated pipelines, HR agents, and security middleware.
            </p>
          </div>
        </div>
      </section>

      {/* Edge Implementation */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Globe className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Edge Enforcement</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          Rate limits are enforced at the <strong>Vercel Edge</strong> using a sliding window algorithm. This prevents malicious traffic from even reaching our compute layer, minimizing latency and cost.
        </p>
        <div className="rounded-2xl border border-caution/20 bg-caution/5 p-6">
          <div className="flex items-start gap-4">
            <ShieldAlert className="mt-1 h-5 w-5 text-caution" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest text-caution">Exceeding Limits</p>
              <p className="text-xs font-medium text-muted leading-relaxed">
                When a limit is reached, the server returns a <strong>429 Too Many Requests</strong> status. For production integrations, we recommend implementing <strong>Exponential Backoff</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Self Hosting */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <Lock className="mt-1 h-5 w-5 text-muted" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Self-Hosting Note</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Self-hosted instances default to in-memory limiting. For distributed deployments, configure the <code className="font-mono text-xs bg-background px-1 rounded">UPSTASH_REDIS_REST_URL</code> to enable global, synchronized rate limiting.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
