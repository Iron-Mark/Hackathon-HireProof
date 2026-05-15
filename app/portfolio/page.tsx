import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bot, Boxes, CheckCircle2, Code2, ExternalLink, FileText, ShieldCheck, Target, UsersRound } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { ProductEventTracker } from '@/components/analytics/product-event-tracker'

export const metadata: Metadata = {
  title: 'Portfolio Case Study | HireProof',
  description: 'A portfolio case study for HireProof, a production-facing AI agent for checking suspicious job posts with visible evidence.',
}

const proofPoints = [
  'Production app on hireproof.tech with demo and API proof paths.',
  'Evidence-backed Safe, Caution, and High-Risk verdicts with visible reasoning.',
  'API, MCP, CLI, SDK, LangChain, n8n, Make, ChatSDK, WDK, and extension surfaces.',
  'Post-hackathon cost controls and BYOK posture for serious live provider usage.',
]

const productDecisions = [
  {
    icon: Target,
    title: 'Narrow wedge',
    body: 'HireProof stays centered on employment fraud and job scams instead of stretching into a generic fraud platform.',
  },
  {
    icon: FileText,
    title: 'Evidence-first UX',
    body: 'The product returns a verdict, but the interface also shows red flags, green flags, evidence cards, and next steps.',
  },
  {
    icon: Boxes,
    title: 'Portable core',
    body: 'The same verification contract is exposed through product, API, agent, automation, and package surfaces.',
  },
]

const buildTimeline = [
  ['Problem', 'Job seekers needed a quick trust checkpoint before sharing personal data or moving to off-platform chat.'],
  ['Product', 'The core flow became paste, extract claims, check evidence, return verdict, and show receipts.'],
  ['Engineering', 'The app shipped on Next.js with structured audit APIs, live/demo modes, MCP tools, and package-ready integrations.'],
  ['Post-event', 'The result is now positioned as shipped proof moving into pilot validation, not as a negative outcome.'],
]

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <ProductEventTracker eventName="case_study_view" metadata={{ surface: 'portfolio_page' }} />
      <main>
        <section className="border-b border-border-soft bg-surface/35">
          <div className="mx-auto grid max-w-400 gap-10 px-6 py-12 md:px-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1.05fr)] lg:px-20 lg:py-16 xl:px-32">
            <div className="flex flex-col justify-center">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
                <ShieldCheck className="h-4 w-4" />
                Portfolio case study
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                A shipped AI trust product for suspicious job opportunities.
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-muted md:text-lg">
                HireProof was built and shipped by Mark Siazon for Cursor Hackathon as a production-facing
                job-scam verification agent. The final placement depended on community-vote reach as well as
                product quality, but the controllable work is clear: app, API, proof pages, packages, docs, and a
                pilot path.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/audit?demo=high-risk" className="hireproof-focus hireproof-cta-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black">
                  Open demo <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/pilot" className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-safe/30 bg-safe/10 px-4 py-2.5 text-sm font-black text-safe hover:bg-background">
                  Join pilot <UsersRound className="h-4 w-4" />
                </Link>
                <a href="https://github.com/Iron-Mark/hackathon-v0-zero_to_agent" target="_blank" rel="noreferrer" className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-border-soft bg-background px-4 py-2.5 text-sm font-black hover:bg-surface">
                  Source <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border-soft bg-background shadow-2xl shadow-safe/10">
              <img
                src="/social/github-social-preview-1280x640.png"
                alt="HireProof product preview showing a proof-backed job scam verification agent"
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="grid gap-3 border-t border-border-soft p-5 sm:grid-cols-2">
                {proofPoints.map((point) => (
                  <div key={point} className="flex gap-3 rounded-xl border border-border-soft bg-surface p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                    <p className="text-xs font-semibold leading-5 text-muted">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-400 px-6 py-14 md:px-12 lg:px-20 xl:px-32">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-normal text-safe">Product decisions</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">What the build demonstrates</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {productDecisions.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border-soft bg-surface p-6">
                <item.icon className="mb-5 h-6 w-6 text-safe" />
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border-soft bg-surface/45">
          <div className="mx-auto grid max-w-400 gap-8 px-6 py-14 md:px-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-20 xl:px-32">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-safe">Build path</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">From anxious user moment to reusable agent surface.</h2>
              <p className="mt-4 text-sm font-semibold leading-6 text-muted">
                The public story should stay outcome-independent: the project shipped, the proof is visible, and the
                next validation step is whether real communities and teams repeat the workflow.
              </p>
            </div>
            <div className="space-y-3">
              {buildTimeline.map(([label, body], index) => (
                <div key={label} className="grid gap-4 rounded-2xl border border-border-soft bg-background p-4 sm:grid-cols-[7rem_1fr] sm:items-start">
                  <div className="flex min-w-0 items-center gap-3 text-xs font-black uppercase tracking-normal text-safe">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-safe text-sm text-background" aria-hidden="true">{index + 1}</span>
                    <span className="min-w-0 leading-5">{label}</span>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-400 gap-5 px-6 py-14 md:px-12 lg:grid-cols-3 lg:px-20 xl:px-32">
          <Link href="/docs/pilot" className="hireproof-focus rounded-2xl border border-border-soft bg-surface p-6 transition-colors hover:bg-background">
            <UsersRound className="mb-4 h-6 w-6 text-safe" />
            <h2 className="text-lg font-black">Pilot plan</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">The 90-day path for communities, schools, recruiters, and job boards.</p>
          </Link>
          <Link href="/docs/architecture" className="hireproof-focus rounded-2xl border border-border-soft bg-surface p-6 transition-colors hover:bg-background">
            <Code2 className="mb-4 h-6 w-6 text-evidence" />
            <h2 className="text-lg font-black">Architecture</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">The web app, API, MCP, package, and automation surfaces behind the product.</p>
          </Link>
          <Link href="/proof" className="hireproof-focus rounded-2xl border border-border-soft bg-surface p-6 transition-colors hover:bg-background">
            <Bot className="mb-4 h-6 w-6 text-caution" />
            <h2 className="text-lg font-black">Proof pack</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">Live proof, release assets, platform boundaries, and verification evidence.</p>
          </Link>
        </section>
      </main>
    </div>
  )
}
