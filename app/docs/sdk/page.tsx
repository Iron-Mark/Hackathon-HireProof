import Link from 'next/link'
import { Package, Zap, Wrench, Webhook, ArrowRight, ShieldCheck, Cpu } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata = { 
  title: 'SDK Overview — HireProof Docs',
  description: 'The official TypeScript SDK for the HireProof Job Verification Platform.'
}

export default function SdkPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <div className="mb-2 inline-block rounded-full bg-evidence/10 px-3 py-1 text-[10px] font-black text-evidence uppercase tracking-widest">v1.2.4 — Stable</div>
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">HireProof SDK</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          A high-performance, typed TypeScript client for the HireProof platform. Build secure, agentic job verification into any application.
        </p>
      </section>

      {/* Install */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Package className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Installation</h2>
        </div>
        <CodeBlock title="Terminal" code="npm install hireproof-sdk" />
      </section>

      {/* Concepts */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Zap className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Core Concepts</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Cpu, title: 'Client', desc: 'Typed client with automatic header injection and retry logic.', href: '/docs/sdk-quickstart' },
            { icon: Zap, title: 'Audit Resource', desc: 'Sync and async methods for full investigation reports.', href: '/docs/sdk-quickstart#investigate' },
            { icon: Wrench, title: 'MCP Resource', desc: 'Direct access to the 4 evidence-gathering tools.', href: '/docs/sdk-quickstart#tools' },
            { icon: Webhook, title: 'Webhook Helper', desc: 'Utilities for validating HireProof signatures in callbacks.', href: '/docs/sdk-quickstart#async' },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="group rounded-3xl border border-border-soft bg-surface p-6 shadow-sm transition-all hover:border-evidence hover:shadow-md">
              <item.icon className="mb-4 h-6 w-6 text-evidence" />
              <div className="text-sm font-black group-hover:text-evidence mb-1">{item.title}</div>
              <p className="text-xs font-medium text-muted leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Example */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black">Quick Start</h2>
        <div className="hireproof-card overflow-hidden rounded-3xl border border-border-soft">
          <div className="border-b border-border-soft bg-surface px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">agent.ts</div>
          <CodeBlock 
            language="typescript"
            code={`import HireProof from 'hireproof-sdk'

const client = new HireProof({
  apiKey: process.env.HIREPROOF_API_KEY,
})

const report = await client.audit.investigate({
  text: "Remote intern. PHP 80k/week. No interview.",
})

console.log(report.verdict) // 'high-risk'`} 
          />
        </div>
      </section>

      {/* Next steps */}
      <Link href="/docs/sdk-quickstart" className="group flex items-center justify-between rounded-3xl border border-border-soft bg-surface p-6 shadow-sm transition-all hover:border-evidence hover:shadow-md">
        <div>
          <div className="text-sm font-black group-hover:text-evidence">Full SDK Quickstart →</div>
          <p className="mt-1 text-xs font-medium text-muted">Build your first agent integration in 5 minutes.</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted group-hover:text-evidence" />
      </Link>
    </div>
  )
}
