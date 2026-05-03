import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { MessageSquareWarning, ShieldCheck, Webhook } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ChatSDK Community Bots | HireProof Docs',
  description: 'Use HireProof through ChatSDK-backed Slack, Discord, Telegram, and WhatsApp community workflows.',
}

export default function DiscordBotPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">ChatSDK Community Bots</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof routes community checks through the shared ChatSDK adapter surface. Slack has screenshot proof, Telegram has live delivery proof, Discord is credential-ready pending a real event capture, and WhatsApp/Zernio remains credential-gated.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <MessageSquareWarning className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Community Protection</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          When alumni networks, university clubs, or developer groups share jobs, scammers often sneak in. Use the ChatSDK adapter to send the message text into the same HireProof audit path and reply with the verdict.
        </p>

        <div className="hireproof-card space-y-6 rounded-2xl border border-border-soft p-6">
          <h3 className="text-lg font-black">Webhook Adapter Example</h3>
          <p className="text-sm font-medium text-muted">
            Discord events should reach <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">/api/webhooks/discord</code>, where the shared ChatSDK handling prepares the audit request.
          </p>

          <CodeBlock
            language="typescript"
            code={`const response = await fetch('/api/webhooks/discord', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-hireproof-platform': 'discord'
  },
  body: JSON.stringify({
    channelId: 'job-board',
    text: 'Remote frontend intern. PHP 80,000/week. Message us on Telegram.'
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
            <strong className="text-sm font-black uppercase tracking-wider text-safe">Verified Status</strong>
          </div>
          <p className="text-sm font-semibold leading-6 text-muted">
            The proof page separates Slack and Telegram evidence from remaining provider boundaries so judges can see what is live-tested and what still needs captures or credentials.
          </p>
        </div>

        <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <Webhook className="h-5 w-5 text-evidence" />
            <strong className="text-sm font-black uppercase tracking-wider text-evidence">Webhook Surface</strong>
          </div>
          <p className="text-sm font-semibold leading-6 text-evidence-text">
            Use <code className="rounded bg-evidence/20 px-1.5 py-0.5 text-evidence font-bold">/api/webhooks/discord</code> for Discord events and the matching Telegram, Slack, and WhatsApp/Zernio routes for other providers.
          </p>
        </div>
      </section>
    </div>
  )
}
