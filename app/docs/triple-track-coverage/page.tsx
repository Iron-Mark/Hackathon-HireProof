import { Metadata } from 'next'
import Link from 'next/link'
import { Bot, Clock, ExternalLink, MessageSquare, Target, Workflow, Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Triple-Track Coverage | HireProof Docs',
  description: 'How HireProof maps one job-verification agent across v0 + MCPs, ChatSDK Agents, and Vercel Workflow / WDK.',
}

const tracks = [
  {
    title: 'v0 + MCPs',
    status: 'Implemented',
    icon: Wrench,
    body: 'The primary web app connects to runtime MCP investigation tools and applies a transparent evidence-weighted safety policy.',
  },
  {
    title: 'ChatSDK Agents',
    status: 'Slack + Telegram live-tested',
    icon: MessageSquare,
    body: 'The ChatSDK bot wrapper supports Slack, Discord, and Telegram. Slack has screenshot proof, Telegram has live delivery proof, and Discord is credential-ready pending a real event capture.',
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
          HireProof should be presented as one employment-fraud trust-and-safety agent. Job scams are the focused wedge; the tracks are delivery layers for the same evidence core.
        </p>
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <Target className="h-5 w-5 text-safe" />
          <h2 className="text-2xl font-black">Positioning</h2>
        </div>
        <p className="text-sm font-semibold leading-6 text-muted">
          HireProof focuses on employment fraud first because the job-seeker moment is urgent, personal, and high-risk. It should not be pitched as a generic fraud dashboard or as an in-house deepfake detector. The current strength is evidence-backed employment safety across web, API, MCP, chat, and workflow surfaces.
        </p>
      </section>

      <section className="grid min-w-0 gap-5 md:grid-cols-3">
        {tracks.map((track) => (
          <article key={track.title} className="min-w-0 rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-safe">
                <track.icon className="h-5 w-5" />
              </div>
              <span className="min-w-0 max-w-full break-words rounded-full bg-safe/10 px-3 py-1 text-right text-[10px] font-black uppercase leading-tight tracking-wide text-safe">
                {track.status}
              </span>
            </div>
            <h2 className="text-xl font-black">{track.title}</h2>
            <p className="mt-3 break-words text-sm font-medium leading-6 text-muted">{track.body}</p>
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
          <li>Show the Slack proof screenshot, the Telegram delivery screenshot, then show Discord and Telegram readiness in `/api/integrations/proof`.</li>
          <li>Use `/api/workflows/audit` to show the WDK workflow handoff and accepted production run ID.</li>
        </ol>
      </section>

      <section className="rounded-2xl border border-caution/30 bg-caution/5 p-6">
        <h2 className="text-2xl font-black">Honest Submission Boundary</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-muted">
          Submit under the strongest working demo path. ChatSDK is live-tested in Slack and Telegram with screenshot/log proof, while Discord still needs a real event capture. WDK has an accepted production run ID; frame it as accepted workflow execution unless a completed workflow result is captured. Do not claim continuous learning or adaptive ML as shipped functionality.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/docs/mcp" className="hireproof-cta-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black">
            MCP docs
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link href="/docs/webhooks" className="inline-flex items-center gap-2 rounded-xl border border-border-soft px-4 py-2 text-sm font-black hover:bg-surface">
            Async webhooks
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6">
        <h2 className="text-2xl font-black">Roadmap</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            'Discord live-provider proof.',
            'Durable WDK timeline with checkpoints, retries, callbacks, and completed-result evidence.',
            'Calibrated learning from reviewed cases while keeping visible red-flag evidence.',
            'Richer screenshot/OCR handling plus specialist image forensics providers where useful.',
          ].map((item) => (
            <div key={item} className="rounded-xl border border-border-soft bg-background p-4 text-sm font-semibold leading-6 text-muted">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

