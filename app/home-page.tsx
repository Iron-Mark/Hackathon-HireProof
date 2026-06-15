import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Building2,
  Cpu,
  Download,
  FileText,
  Globe,
  KeyRound,
  MapPin,
  Network,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  Terminal,
  TrendingUp,
  UsersRound,
  Workflow,
  Zap as ZapIcon,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { ImpactTicker } from '@/components/marketing/impact-ticker'
import { SpotTheBot } from '@/components/marketing/spot-the-bot'
import { HomeDemoLink } from './home-demo-link'
import { HomeDemoPanel } from './home-demo-panel'

const flags = [
  'PHP 80,000/week for an internship',
  'No interview or formal application path',
  'Telegram-only contact',
]

const steps = [
  { icon: FileText, title: 'Extract claims', description: 'Pull out role, pay, company, location, contact path, and urgency signals.' },
  { icon: SearchCheck, title: 'Check receipts', description: 'Compare the post against company footprint, reputation, job boards, and local signals.' },
  { icon: ShieldAlert, title: 'Return verdict', description: 'Show Safe, Caution, or High-Risk with a risk score and next steps.' },
]

const evidenceSignals = [
  { icon: Globe, title: 'Company web presence', description: 'Official sites, hiring pages, LinkedIn profiles, and domain details.' },
  { icon: AlertCircle, title: 'Recent reputation', description: 'News, reviews, scam reports, media mentions, and public complaints.' },
  { icon: TrendingUp, title: 'Comparable listings', description: 'Similar legitimate jobs to catch unrealistic pay or role expectations.' },
  { icon: MapPin, title: 'Local footprint', description: 'Maps, directories, registrations, and location consistency.' },
]

const automationSurfaces = [
  { label: 'n8n node', detail: 'Run audit and async audit operations', status: 'source-shipped' },
  { label: 'Make app', detail: 'API key connection and audit modules', status: 'source-shipped' },
  { label: 'LangChain tool', detail: 'Structured tool wrapper and helpers', status: 'source-shipped' },
]

const postHackathonPaths = [
  {
    icon: ShieldAlert,
    title: 'Free demo',
    body: 'Deterministic reports stay available for walkthroughs, screenshots, and quick evaluation without spending live provider budget.',
  },
  {
    icon: KeyRound,
    title: 'BYOK live checks',
    body: 'Serious live evidence runs through owner-provided model and search credentials, so pilots can control cost and data posture.',
  },
  {
    icon: UsersRound,
    title: 'Pilot program',
    body: 'Career communities, schools, recruiters, and job boards can test API keys, webhooks, verified domains, and exportable reports.',
  },
]

export function HomePage() {
  return (
    <div className="flex flex-col">
      <ImpactTicker />
      <SiteHeader />

      <Script
        id="hireproof-faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How does HireProof detect job scams?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'HireProof extracts the job post claims, checks company web presence, reviews reputation signals, compares similar roles, and returns an evidence-backed risk verdict.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can HireProof check AI-generated recruiter scams?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. HireProof looks for suspicious recruitment patterns such as unrealistic pay, vague company details, off-platform contact, and missing hiring evidence.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is HireProof free to use?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, the HireProof demo is free for individual job seekers to verify suspicious opportunities before applying.',
                },
              },
            ],
          }),
        }}
      />

      <section className="relative overflow-hidden pt-6 pb-20 lg:pt-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.14),transparent_30%),linear-gradient(180deg,rgba(52,211,153,0.06),transparent_48%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 right-[4%] z-0 hidden h-200 w-154 origin-bottom-right overflow-hidden rounded-[2.2rem] border border-safe/30 bg-surface/5 opacity-[0.18] shadow-[0_0_110px_rgba(52,211,153,0.28)] saturate-125 rotate-[-7deg] md:block xl:-bottom-44 xl:right-[12%] xl:h-240 xl:w-184.5"
        >
          <Image
            src="/media/job-application-meme.png"
            alt=""
            fill
            preload
            fetchPriority="high"
            sizes="(min-width: 1280px) 738px, (min-width: 768px) 616px, 0px"
            className="object-cover object-[center_12%]"
          />
          <div className="absolute inset-0 bg-linear-to-l from-background/0 via-background/22 to-background/85" />
          <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-400 gap-8 px-6 py-10 md:px-12 lg:px-20 lg:py-14 xl:grid-cols-[minmax(0,1fr)_460px] xl:items-center xl:px-32">
          <div className="mx-auto max-w-4xl text-center xl:mx-0 xl:max-w-2xl xl:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-sm font-bold text-safe">
              <ShieldAlert className="h-4 w-4" />
              Pilot-ready job-scam checks
            </div>

            <h1 className="bg-linear-to-r from-foreground via-safe to-evidence bg-clip-text text-4xl font-black leading-tight text-balance text-transparent dark:from-white dark:via-safe dark:to-evidence sm:text-5xl lg:text-6xl">
              Paste a job post. See if it&apos;s safe, suspicious, or high-risk, with receipts.
            </h1>

            <div className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-muted xl:mx-0 xl:max-w-xl">
              <p>Check a recruiter message, job listing, freelance gig, internship, or scholarship or training offer before you share personal details. HireProof is moving from hackathon proof into pilot-ready job-scam verification for communities that need repeatable evidence.</p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row xl:justify-start">
              <Link href="/audit" className="hireproof-focus hireproof-cta-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold shadow-lg">
                Start investigation <ArrowRight className="h-4 w-4" />
              </Link>
              <HomeDemoLink className="hireproof-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface/85 px-5 py-2.5 font-bold transition-colors hover:bg-background">
                Quick demo
              </HomeDemoLink>
            </div>

            <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-black uppercase tracking-widest text-muted xl:mx-0 xl:justify-start">
              <span className="text-[11px] text-muted/80">Also available</span>
              <Link href="/proof" className="hireproof-focus rounded-md underline-offset-4 hover:text-evidence hover:underline">
                Proof pack
              </Link>
              <Link href="/docs/pilot" className="hireproof-focus rounded-md underline-offset-4 hover:text-safe hover:underline">
                Pilot path
              </Link>
              <Link href="/portfolio" className="hireproof-focus rounded-md underline-offset-4 hover:text-safe hover:underline">
                Case study
              </Link>
            </div>
          </div>

          <HomeDemoPanel />
        </div>
      </section>

      <section className="border-y border-border-soft bg-surface/45">
        <div className="mx-auto grid max-w-400 gap-5 px-6 py-12 md:px-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-20 xl:px-32">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-safe">Common red flags</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Built around job-scam evidence, not generic AI checking.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {flags.map((flag) => (
              <div key={flag} className="rounded-2xl border border-border-soft bg-background p-4 text-sm font-bold text-muted">
                {flag}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-y border-border-soft bg-safe/5">
        <div className="absolute inset-x-0 top-0 h-px bg-safe/35" />
        <div className="mx-auto max-w-400 px-6 py-16 md:px-12 lg:px-20 xl:px-32">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-widest text-safe">Review loop</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Three steps from pasted post to evidence-backed verdict.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-safe-bg text-safe">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-muted">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-400 px-6 md:px-12 lg:px-20 xl:px-32 py-14">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-evidence">Evidence sources</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight">The product checks concrete hiring signals before it asks for trust.</h2>
            </div>
            <Link href="/docs/how-it-works" className="hireproof-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-black hover:bg-background">
              How it works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {evidenceSignals.map((signal) => {
              const Icon = signal.icon
              return (
                <div key={signal.title} className="group relative flex gap-4 overflow-hidden rounded-2xl border border-border-soft bg-background p-5 transition-all hover:border-evidence/50 hover:shadow-lg">
                  <div className="absolute inset-0 bg-linear-to-r from-evidence/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-evidence/10 text-evidence">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="relative">
                    <h3 className="font-black">{signal.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-muted">{signal.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft bg-background">
        <div className="mx-auto grid max-w-400 gap-8 px-6 py-14 md:px-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-20 xl:px-32">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-safe">Post-hackathon paths</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Demo-safe by default, pilot-ready when real credentials are provided.</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-muted">The first screen stays focused on job seekers. Developer integrations stay visible as proof, not as the main story.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/docs/pilot" className="hireproof-focus inline-flex min-h-11 items-center gap-2 rounded-lg border border-safe/30 bg-safe/10 px-4 py-2 text-sm font-black text-safe">
                Pilot program <UsersRound className="h-4 w-4" />
              </Link>
              <Link href="/docs/automations" className="hireproof-focus inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-black">
                Integrations <Workflow className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {postHackathonPaths.map((path) => {
              const Icon = path.icon
              return (
                <div key={path.title} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-safe">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-black">{path.title}</h3>
                  </div>
                  <p className="text-sm font-semibold leading-6 text-muted">{path.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-border-soft bg-background py-24 text-foreground">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-10 text-foreground" aria-hidden="true">
          <div className="h-full w-full bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>
        <div className="relative mx-auto grid max-w-400 gap-8 px-6 md:px-12 lg:grid-cols-[1fr_1.1fr] lg:px-20 xl:px-32">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-evidence/30 bg-evidence/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-evidence">
              <Sparkles className="h-4 w-4" />
              Proof surfaces
            </div>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">Automation is supporting evidence, not the first-screen promise.</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-muted">HireProof keeps the user-facing value simple while preserving integrations for teams that need repeatable checks.</p>
          </div>
          <div className="grid gap-4">
            {automationSurfaces.map((surface) => (
              <div key={surface.label} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{surface.label}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted">{surface.detail}</p>
                  </div>
                  <span className="rounded-full border border-safe/25 bg-safe/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
                    {surface.status}
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5">
              <div className="mb-2 flex items-center gap-2 text-evidence">
                <Terminal className="h-5 w-5" />
                <h3 className="font-black">CLI and API proof</h3>
              </div>
              <p className="text-sm font-semibold leading-6 text-muted">Docs, SDK examples, and packaged downloads remain discoverable after the core job-scam workflow.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft bg-surface py-14">
        <div className="mx-auto max-w-400 px-6 md:px-12 lg:px-20 xl:px-32">
          <div className="mb-6 text-center sm:mb-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-safe">Practice review</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Spot the Bot</h2>
            </div>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-muted">Practice reviewing suspicious posts with quick examples after you learn the evidence flow.</p>
          </div>
          <SpotTheBot />
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border-soft bg-background dark:bg-[#080a0d] py-24">
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <Image
            src="/media/job-application-meme.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover blur-sm"
          />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
          <h2 className="text-4xl font-black tracking-tight text-foreground dark:text-white md:text-5xl lg:text-6xl">
            Check the job before the job checks you.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-muted">
            Start with a free suspicious-post check, then move to live evidence only when you control the credentials and proof budget.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/audit" className="hireproof-focus hireproof-cta-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-bold shadow-lg">
              Start investigation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/api/downloads/hireproof-extension.zip" className="hireproof-focus inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface/90 px-5 py-2.5 font-bold">
              Download extension <Download className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
