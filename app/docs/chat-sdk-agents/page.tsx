import { Metadata } from 'next'
import { Bot, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ChatSDK Agents | HireProof Docs',
  description: 'How HireProof runs as a multi-platform ChatSDK agent across Slack, Discord, Telegram, and WhatsApp via Zernio.',
}

const platforms = [
  {
    name: 'Slack',
    status: 'Live-tested',
    endpoint: '/api/webhooks/slack',
    credentials: 'SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, REDIS_URL',
  },
  {
    name: 'Discord',
    status: 'Credential-gated',
    endpoint: '/api/webhooks/discord',
    credentials: 'DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY, DISCORD_APPLICATION_ID, REDIS_URL',
  },
  {
    name: 'Telegram',
    status: 'Credential-gated',
    endpoint: '/api/webhooks/telegram',
    credentials: 'TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET_TOKEN, TELEGRAM_BOT_USERNAME, REDIS_URL',
  },
  {
    name: 'WhatsApp',
    status: 'Credential-gated via Zernio',
    endpoint: '/api/webhooks/zernio',
    credentials: 'ZERNIO_API_KEY, ZERNIO_WEBHOOK_SECRET, REDIS_URL',
  },
]

export default function ChatSdkAgentsPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
          <Bot className="h-4 w-4" />
          ChatSDK Agents
        </div>
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Multi-Platform Chat Agents</h1>
        <p className="max-w-3xl text-xl font-medium leading-relaxed text-muted">
          HireProof exposes the same job-scam verification agent inside chat communities, using ChatSDK adapters for Slack, Discord, Telegram, and WhatsApp-backed inboxes through Zernio.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => (
          <article key={platform.name} className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-safe">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black">{platform.name}</h2>
                  <p className="text-xs font-black uppercase tracking-widest text-muted">{platform.status}</p>
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-safe" />
            </div>
            <dl className="space-y-3 text-sm font-medium leading-6 text-muted">
              <div>
                <dt className="font-black text-foreground">Webhook</dt>
                <dd className="break-all">{platform.endpoint}</dd>
              </div>
              <div>
                <dt className="font-black text-foreground">Required credentials</dt>
                <dd>{platform.credentials}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-safe" />
          <h2 className="text-2xl font-black">Runtime Contract</h2>
        </div>
        <ul className="list-inside list-disc space-y-2 text-sm font-semibold leading-6 text-muted">
          <li>All platforms call the same HireProof chat reply path and saved-report permalink flow.</li>
          <li>Missing credentials return credential-gated webhook status instead of breaking the build.</li>
          <li>Slack has screenshot proof; Discord, Telegram, and WhatsApp/Zernio require fresh platform event captures before claiming live proof.</li>
        </ul>
      </section>
    </div>
  )
}
