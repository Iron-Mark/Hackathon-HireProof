import { Webhook, Zap, ArrowRight, ShieldCheck, Terminal, Workflow } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata = { 
  title: 'Webhooks — HireProof Docs',
  description: 'Integrate HireProof asynchronously into your agentic pipelines using webhooks.'
}

export default function WebhooksPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Webhooks</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          For non-blocking AI pipelines, HireProof supports asynchronous investigation delivery via webhooks.
        </p>
      </section>

      {/* Lifecycle */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Workflow className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Lifecycle</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { step: '1', title: 'Request', desc: 'Post to /api/v1/audit with webhook_url' },
            { step: '2', title: 'Accepted', desc: 'Server returns 202 Accepted instantly' },
            { step: '3', title: 'Agent Loop', desc: 'Autonomous investigation runs in background' },
            { step: '4', title: 'Delivery', desc: 'AuditReport is POSTed to your endpoint' },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-evidence text-[10px] font-black text-background mb-3">{item.step}</span>
              <div className="text-xs font-black mb-1">{item.title}</div>
              <p className="text-[10px] font-medium text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Payload */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Terminal className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Webhook Payload</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          Your endpoint will receive a <code className="font-mono text-xs bg-surface px-1 rounded">POST</code> request with <code className="font-mono text-xs bg-surface px-1 rounded">Content-Type: application/json</code>.
        </p>
        <div className="hireproof-card overflow-hidden rounded-3xl border border-border-soft">
          <div className="border-b border-border-soft bg-surface px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Example callback</div>
          <CodeBlock 
            language="json"
            code={`{
  "id": "audit_12345",
  "verdict": "high-risk",
  "riskScore": 85,
  "summary": "This job post contains several red flags...",
  "redFlags": [...],
  "timestamp": "2026-04-29T00:00:00Z"
}`} 
          />
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-evidence/30 bg-evidence/5 p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-evidence" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-evidence">Signature Validation</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              We recommend validating that requests originate from HireProof by checking the <strong>X-HireProof-Signature</strong> header. This prevents unauthorized entities from spoofing audit results.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
