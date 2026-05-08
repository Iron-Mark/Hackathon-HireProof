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
          Use <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">/api/v2/audit</code> when you want the richer intelligence contract with evidence coverage, weighted signals, and score trace.
        </p>
      </section>

      {/* Auth reminder */}
      <div className="mb-10 rounded-lg border border-caution/20 bg-caution/5 px-4 py-3 text-xs font-bold text-caution-text">
        All requests require an <code className="font-mono">x-api-key</code> header.
        The public demo key is <code className="font-mono">hireproof_agent_demo_key</code>.{' '}
        <Link href="/docs/authentication" className="underline">See Authentication →</Link>
      </div>

      <section className="mb-10 rounded-2xl border border-caution/30 bg-caution-bg/20 p-5">
        <h2 className="mb-2 text-lg font-black">Demo vs live mode</h2>
        <p className="text-sm font-semibold leading-6 text-muted">
          Demo requests return labeled fixtures for product walkthroughs and offline testing. They should not be treated as fresh employer, recruiter, review, or job-alternative verification.
          Live mode uses configured model/search credentials and can return operational status when throttling, provider errors, or a SerpApi circuit breaker affects evidence gathering.
        </p>
      </section>

      {/* Sync mode */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Synchronous Mode</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Send a request without <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">webhook_url</code>.
          The server holds the connection open while it investigates (typically 5–15s), then returns the full <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">AuditReport</code> as JSON.
        </p>
        <CodeBlock title="Request" code={`curl -X POST https://hireproof.tech/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{"text": "Remote frontend intern. PHP 80,000/week. Message us on Telegram."}'`} />
        <CodeBlock title="Response (200 OK)" code={`{
  "id": "report_1714300000000",
  "version": "2",
  "verdict": "high-risk",
  "riskScore": 85,
  "confidence": "Very High",
  "summary": "This opportunity has multiple red flags...",
  "intelligence": {
    "coverage": {
      "company": "verified",
      "local": "missing",
      "reputation": "risk",
      "market": "anomalous",
      "applyPath": "mismatch"
    },
    "signals": [
      {
        "id": "salary_anomaly",
        "direction": "risk",
        "weight": 22,
        "evidenceIds": ["ev_3"]
      }
    ],
    "scoreTrace": [
      { "step": "Baseline", "delta": 0, "scoreAfter": 25 },
      { "step": "Market salary", "delta": 22, "scoreAfter": 47 }
    ]
  },
  "redFlags": ["Unrealistically high salary", "Telegram-only contact"],
  "greenFlags": [],
  "evidence": [{ "id": "ev_1", "source": "Google", "trustLevel": "risk", "snippet": "...", "url": "..." }],
  "nextSteps": ["Do not send money, IDs, or bank details"],
  "timestamp": "2026-04-29T00:00:00.000Z"
}`} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Supported Inputs</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          The same audit contract accepts raw text, a public job URL, an uploaded screenshot as a data URL, or any combination of those fields. When a screenshot is included, HireProof extracts readable text through the OCR path and marks the report as not publicly listed by default.
        </p>
        <CodeBlock title="Screenshot + URL request" code={`curl -X POST https://hireproof.tech/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{
    "url": "https://www.linkedin.com/jobs/view/example",
    "image": "data:image/png;base64,...",
    "location": "Philippines"
  }'`} />
      </section>

      {/* Operations */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Caching, Guardrails, and Telemetry</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Live SerpApi evidence is cached by normalized search parameters and by similar audit context: company, role, location, and apply host.
          Configure <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">UPSTASH_REDIS_REST_URL</code> and <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">UPSTASH_REDIS_REST_TOKEN</code> to persist repeated SerpApi responses across cold starts and Vercel instances.
          Runtime cache telemetry is exposed from <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">/api/health</code>, <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">/api/audit</code>, and authenticated developer usage.
          Expensive live audits also use per-user or per-IP queue throttling and a SerpApi circuit breaker so quota spikes and repeated failures become explicit operational states.
        </p>
        <CodeBlock title="Telemetry Shape" code={`{
  "serpapiCache": {
    "memoryEntries": 12,
    "similarityEntries": 3,
    "hits": 18,
    "misses": 7,
    "persistentHits": 4,
    "similarityHits": 2,
    "networkCalls": 7,
    "creditsSaved": 30,
    "failures": 0,
    "circuitTrips": 0
  }
}`} />
      </section>

      {/* Async mode */}
      <section className="mb-10">
        <h2 className="mb-3 text-2xl font-black">Async Mode (Webhooks)</h2>
        <p className="mb-4 text-sm font-semibold text-muted leading-6">
          Include a <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">webhook_url</code> and the server immediately returns <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">202 Accepted</code>.
          The investigation runs in the background. Once complete, the full <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">AuditReport</code> is POSTed to your webhook URL.
        </p>
        <CodeBlock title="Async Request" code={`curl -X POST https://hireproof.tech/api/v1/audit \\
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
