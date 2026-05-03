import Link from 'next/link'
import { ArrowRight, Package, Zap, Wrench, Webhook, ShieldCheck, Cpu } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata = { 
  title: 'SDK Quickstart — HireProof Docs',
  description: 'Build your first agent integration with HireProof in under 5 minutes.'
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-evidence text-sm font-black text-background">{n}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      <div className="ml-11">{children}</div>
    </section>
  )
}

export default function SdkQuickstartPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">SDK Quickstart</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Integrate HireProof into your agentic workflow in under 5 minutes.
        </p>
      </section>

      {/* Step 1: Install */}
      <Step n={1} title="Install the package">
        <p className="mb-4 text-sm font-medium text-muted">The SDK is published on npm as <a href="https://www.npmjs.com/package/hireproof-sdk" className="font-black text-safe hover:underline">hireproof-sdk</a>.</p>
        <CodeBlock title="Terminal" code="npm install hireproof-sdk" />
      </Step>

      {/* Step 2: Initialize */}
      <Step n={2} title="Initialize the client">
        <p className="mb-4 text-sm font-medium text-muted leading-relaxed">
          Provide your <code className="bg-surface px-1 rounded">apiKey</code>. The client automatically handles auth headers and endpoint routing.
        </p>
        <div className="hireproof-card overflow-hidden rounded-3xl border border-border-soft">
          <CodeBlock 
            language="typescript"
            code={`import HireProof from 'hireproof-sdk'

const client = new HireProof({
  apiKey: process.env.HIREPROOF_API_KEY!,
})`} 
          />
        </div>
      </Step>

      {/* Step 3: Investigate */}
      <Step n={3} title="Run an investigation">
        <p className="mb-4 text-sm font-medium text-muted leading-relaxed">
          The <code className="bg-surface px-1 rounded">investigate()</code> method is synchronous and returns the full report once the agent loop completes.
        </p>
        <div className="hireproof-card overflow-hidden rounded-3xl border border-border-soft">
          <CodeBlock 
            language="typescript"
            code={`const report = await client.audit.investigate({
  text: 'Remote intern. PHP 80k/week. Message us on Telegram.',
})

console.log(report.verdict)   // 'high-risk'
console.log(report.riskScore) // 85`} 
          />
        </div>
      </Step>

      {/* Security */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-safe" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-safe">Type Safety</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              The SDK provides full TypeScript interfaces for the <strong>AuditReport</strong> and <strong>McpToolResult</strong>, ensuring that your agent code is robust and self-documenting.
            </p>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: Wrench, title: 'MCP Tool Guide', desc: 'Call individual evidence tools.', href: '/docs/mcp' },
          { icon: Webhook, title: 'Webhook Async', desc: 'Non-blocking callback patterns.', href: '/docs/webhooks' },
        ].map((item) => (
          <Link key={item.title} href={item.href} className="group rounded-3xl border border-border-soft bg-surface p-6 shadow-sm transition-all hover:border-evidence hover:shadow-md">
            <item.icon className="mb-4 h-6 w-6 text-evidence" />
            <div className="text-sm font-black group-hover:text-evidence mb-1">{item.title}</div>
            <p className="text-xs font-medium text-muted leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
