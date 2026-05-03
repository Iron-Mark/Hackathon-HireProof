import { Metadata } from 'next'
import Link from 'next/link'
import { Bot, Clock, ExternalLink, MessageSquare, Workflow, Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Triple-Track Coverage | HireProof Docs',
  description: 'How HireProof maps one job-verification agent across v0 + MCPs, ChatSDK Agents, and Vercel Workflow / WDK.',
}

const tracks = [
  {
    title: 'v0 + MCPs',
    status: 'Implemented',
    icon: Wrench,
    body: 'The primary web app already connects to runtime MCP investigation tools for company presence, news reputation, job comparison, and local footprint evidence.',
  },
  {
    title: 'ChatSDK Agents',
    status: 'Slack + Telegram live-tested',
    icon: MessageSquare,
    body: 'The ChatSDK bot wrapper now supports Slack, Discord, Telegram, and WhatsApp via Zernio. Slack has screenshot proof, Telegram has live delivery proof, Discord is credential-ready pending a real event capture, and WhatsApp/Zernio remains credential-gated.',
  },
  {
    title: 'Vercel Workflow / WDK',
    status: 'Accepted run',
    icon: Workflow,
    body: 'The workflow package is installed, the Next plugin is enabled, and the production audit route accepted WDK run wrun_01KQD9H6AND3W7YZBHHKAH2KV5.',
  },
]

export default function TripleTrackCoveragePage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
          <Bot className="h-4 w-4" />
          One agent, three surfaces
        </div>
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Triple-Track Coverage</h1>
        <p className="max-w-3xl text-xl font-medium leading-relaxed text-muted">
          HireProof should be presented as one job-verification agent. The tracks are delivery layers: web app, agent tools, chat communities, and async investigation workflows.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {tracks.map((track) => (
          <article key={track.title} className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-safe">
                <track.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
                {track.status}
              </span>
            </div>
            <h2 className="text-xl font-black">{track.title}</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-muted">{track.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-safe" />
          <h2 className="text-2xl font-black">Demo Order</h2>
        </div>
        <ol className="list-inside list-decimal space-y-2 text-sm font-semibold leading-6 text-muted">
          <li>Start with the working `/audit` flow and show a Safe, Caution, or High-Risk report.</li>
          <li>Show that MCP tools power the evidence checks behind the web app.</li>
          <li>Show the Slack proof screenshot, the Telegram delivery screenshot, then show Discord, Telegram, and WhatsApp/Zernio readiness in `/api/integrations/proof`.</li>
          <li>Use `/api/workflows/audit` to show the WDK workflow handoff and accepted production run ID.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-caution/30 bg-caution/5 p-6">
        <h2 className="text-2xl font-black">Honest Submission Boundary</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-muted">
          Submit under the strongest working demo path. ChatSDK is live-tested in Slack and Telegram with screenshot/log proof, while Discord still needs a real event capture and WhatsApp/Zernio remains credential-gated. WDK has an accepted production run ID; frame it as accepted workflow execution unless a completed workflow result is captured.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/docs/mcp" className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-black text-background hover:bg-safe">
            MCP docs
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link href="/docs/webhooks" className="inline-flex items-center gap-2 rounded-xl border border-border-soft px-4 py-2 text-sm font-black hover:bg-surface">
            Async webhooks
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
