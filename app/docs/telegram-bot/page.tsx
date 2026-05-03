import { Metadata } from 'next'
import Link from 'next/link'
import { CodeBlock } from '@/components/ui/code-block'
import { ArrowRight, MessageSquareWarning, ShieldCheck, Webhook } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Telegram Bot | HireProof Docs',
  description: 'Use HireProof through the ChatSDK-backed Telegram webhook workflow.',
}

export default function TelegramBotPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Telegram Bot</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof runs inside Telegram through the shared ChatSDK adapter. Telegram has live delivery screenshot and Vercel log proof, and it uses the same saved-report and verdict formatting path as the web app.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="#telegram-webhook"
            className="hireproof-focus inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-evidence px-5 py-3 text-sm font-black text-background shadow-lg shadow-evidence/20 transition hover:-translate-y-0.5 hover:bg-evidence-text sm:w-auto"
          >
            Configure Telegram webhook
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/proof"
            className="hireproof-focus inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface px-5 py-3 text-sm font-black text-foreground transition hover:-translate-y-0.5 hover:bg-surface-elevated sm:w-auto"
          >
            View Telegram proof
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
          <h2 className="text-2xl font-black">Direct Message Checks</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Use the Telegram adapter when job posts or recruiter DMs are already circulating in Telegram. HireProof keeps Telegram-only contact as a risk signal while still allowing users to ask the bot for a safer verdict.
        </p>

        <div id="telegram-webhook" className="hireproof-card scroll-mt-24 space-y-6 rounded-2xl border border-border-soft p-6">
          <h3 className="text-lg font-black">Webhook Adapter Example</h3>
          <p className="text-sm font-medium text-muted">
            Telegram events should reach <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">/api/webhooks/telegram</code>. The webhook secret token protects the route before the ChatSDK reply handler runs.
          </p>

          <CodeBlock
            language="typescript"
            code={`const response = await fetch('/api/webhooks/telegram', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-telegram-bot-api-secret-token': telegramWebhookSecret
  },
  body: JSON.stringify({
    message: {
      chat: { id: 123456 },
      text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'
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
            Telegram is live-tested with screenshot and matching Vercel webhook log proof. Keep the proof page as the source of truth for current captures.
          </p>
        </div>

        <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Webhook className="h-5 w-5 text-evidence" />
            <strong className="text-sm font-black uppercase tracking-wider text-evidence">Webhook Surface</strong>
          </div>
          <p className="text-sm font-semibold leading-6 text-evidence-text">
            Use <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">/api/webhooks/telegram</code> with <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">TELEGRAM_BOT_TOKEN</code>, <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">TELEGRAM_WEBHOOK_SECRET_TOKEN</code>, <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">TELEGRAM_BOT_USERNAME</code>, and <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">REDIS_URL</code>.
          </p>
        </div>
      </section>
    </div>
  )
}
