import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata = { title: 'Headless Agent API — HireProof' }

export default function Page() {
  return (
    <div>
      <h1 className="mb-4 text-4xl font-black tracking-tight">Headless Agent API</h1>
      <p className="mb-10 text-lg font-semibold text-muted leading-8">
        A dedicated REST endpoint for external AI agents, CLI tools, and automated pipelines. Returns a complete investigation report as JSON — no streaming required.
      </p>

      {/* Why */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Why a separate endpoint?</h2>
        <p className="text-sm font-semibold text-muted leading-6">
          The main <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">/api/audit</code> endpoint streams Server-Sent Events for the browser UI.
          External agents need a simpler <strong>request → JSON response</strong> flow.
          The headless API at <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">/api/v1/audit</code> provides exactly that, plus optional webhook support for async processing.
        </p>
      </section>

      {/* Auth reminder */}
      <div className="mb-10 rounded-lg border border-caution/20 bg-caution/5 px-4 py-3 text-xs font-bold text-caution-text">
        All requests require an <code className="font-mono">x-api-key</code> header.
        The public demo key is <code className="font-mono">hireproof_agent_demo_key</code>.{' '}
        <Link href="/docs/authentication" className="underline">See Authentication →</Link>
      </div>

      {/* Sync mode */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Synchronous Mode</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Send a request without <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">webhook_url</code>.
          The server holds the connection open while it investigates (typically 5–15s), then returns the full <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">AuditReport</code> as JSON.
        </p>
        <CodeBlock title="Request" code={`curl -X POST https://hireproof-sigma.vercel.app/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{"text": "Remote frontend intern. PHP 80,000/week. Message us on Telegram."}'`} />
        <CodeBlock title="Response (200 OK)" code={`{
  "id": "report_1714300000000",
  "verdict": "high-risk",
  "riskScore": 85,
  "confidence": "Very High",
  "summary": "This opportunity has multiple red flags...",
  "redFlags": ["Unrealistically high salary", "Telegram-only contact"],
  "greenFlags": [],
  "evidence": [{ "source": "Google", "snippet": "...", "url": "..." }],
  "nextSteps": ["Do not send money, IDs, or bank details"],
  "timestamp": "2026-04-29T00:00:00.000Z"
}`} />
      </section>

      {/* Async mode */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Async Mode (Webhooks)</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Include a <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">webhook_url</code> and the server immediately returns <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">202 Accepted</code>.
          The investigation runs in the background. Once complete, the full <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">AuditReport</code> is POSTed to your webhook URL.
        </p>
        <CodeBlock title="Async Request" code={`curl -X POST https://hireproof-sigma.vercel.app/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{
    "text": "We are hiring data analysts...",
    "webhook_url": "https://myagent.example.com/callback"
  }'`} />
        <CodeBlock title="Immediate Response (202 Accepted)" code={`{ "status": "processing", "message": "Investigation started. Result will be sent to your webhook." }`} />
      </section>

      {/* Next */}
      <div className="flex items-center justify-between rounded-2xl border border-border-soft bg-surface p-5">
        <div>
          <div className="text-sm font-black">Next: Webhooks</div>
          <p className="text-xs font-semibold text-muted mt-0.5">Learn how to receive and validate async investigation results.</p>
        </div>
        <Link href="/docs/webhooks" className="flex items-center gap-1.5 text-sm font-black text-safe hover:underline">
          Webhooks <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
