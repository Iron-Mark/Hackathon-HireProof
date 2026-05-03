import { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/ui/code-block'
import { ArrowRight, MessageSquareWarning, ShieldCheck, Webhook } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Slack Bot | HireProof Docs',
  description: 'Use HireProof through the ChatSDK-backed Slack webhook workflow.',
}

export default function SlackBotPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Slack Bot</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof runs inside Slack through the shared ChatSDK adapter. Slack has screenshot proof, calls the same audit core as the web app, and replies with a verdict summary plus saved-report link when storage is available.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="#slack-webhook"
            className="hireproof-focus inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-evidence px-5 py-3 text-sm font-black text-background shadow-lg shadow-evidence/20 transition hover:-translate-y-0.5 hover:bg-evidence-text sm:w-auto"
          >
            Configure Slack webhook
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/proof"
            className="hireproof-focus inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface px-5 py-3 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-surface-elevated sm:w-auto"
          >
            View Slack proof
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/chat-sdk-agents"
            className="hireproof-focus inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-background px-5 py-3 text-sm font-black text-muted transition hover:-translate-y-0.5 hover:text-foreground sm:w-auto"
          >
            All ChatSDK agents
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <MessageSquareWarning className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Community Protection</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Use the Slack adapter when job-seeker channels, alumni groups, or recruiting communities need a fast check before members click suspicious apply links.
        </p>

        <div id="slack-webhook" className="hireproof-card scroll-mt-24 space-y-6 rounded-2xl border border-border-soft p-6">
          <h3 className="text-lg font-black">Webhook Adapter Example</h3>
          <p className="text-sm font-medium text-muted">
            Slack events should reach <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">/api/webhooks/slack</code>. The request is verified with the Slack signing secret before HireProof prepares the audit reply.
          </p>

          <CodeBlock
            language="typescript"
            code={`const response = await fetch('/api/webhooks/slack', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-slack-signature': slackSignature,
    'x-slack-request-timestamp': slackTimestamp
  },
  body: JSON.stringify({
    event: {
      type: 'app_mention',
      channel: 'job-board',
      text: 'Remote frontend intern. PHP 80,000/week. Message us on Telegram.'
    }
  })
});

const result = await response.json();`}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-safe/25 bg-safe/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-safe" />
            <strong className="text-sm font-black uppercase tracking-wider text-safe">Proof Status</strong>
          </div>
          <p className="text-sm font-semibold leading-6 text-muted">
            Slack is live-tested with screenshot proof. Fresh endpoint-level Slack log proof should be captured again before claiming a new production event.
          </p>
        </div>

        <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Webhook className="h-5 w-5 text-evidence" />
            <strong className="text-sm font-black uppercase tracking-wider text-evidence">Webhook Surface</strong>
          </div>
          <p className="text-sm font-semibold leading-6 text-evidence-text">
            Use <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">/api/webhooks/slack</code> with <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">SLACK_BOT_TOKEN</code>, <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">SLACK_SIGNING_SECRET</code>, and <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">REDIS_URL</code>.
          </p>
        </div>
      </section>
    </div>
  )
}
