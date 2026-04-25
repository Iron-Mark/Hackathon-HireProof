import Link from 'next/link'
import { ArrowRight, CheckCircle2, AlertCircle, Globe, TrendingUp, MapPin, ShieldAlert, SearchCheck, FileText, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { BrandMark } from '@/components/brand-mark'

const flags = [
  'PHP 80,000/week for an internship',
  'No interview or formal application path',
  'Telegram-only contact',
]

const steps = [
  {
    icon: FileText,
    title: 'Extract claims',
    description: 'Pull out role, pay, company, location, contact path, and urgency signals.',
  },
  {
    icon: SearchCheck,
    title: 'Check receipts',
    description: 'Compare the post against company footprint, reputation, job boards, and local signals.',
  },
  {
    icon: ShieldAlert,
    title: 'Return verdict',
    description: 'Show Safe, Caution, or High-Risk with a risk score and next steps.',
  },
]

const evidenceSignals = [
  {
    icon: Globe,
    title: 'Company web presence',
    description: 'Official sites, hiring pages, LinkedIn profiles, and domain details.',
  },
  {
    icon: AlertCircle,
    title: 'Recent reputation',
    description: 'News, reviews, scam reports, media mentions, and public complaints.',
  },
  {
    icon: TrendingUp,
    title: 'Comparable listings',
    description: 'Similar legitimate jobs to catch unrealistic pay or role expectations.',
  },
  {
    icon: MapPin,
    title: 'Local footprint',
    description: 'Maps, directories, registrations, and location consistency.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="hireproof-grid border-b border-border-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:py-16">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-3">
              <BrandMark className="h-14 w-14 shrink-0 shadow-lg" />
              <div>
                <p className="text-sm font-black uppercase tracking-normal text-safe">HireProof</p>
                <p className="text-sm font-semibold text-muted">Job-post verification with receipts</p>
              </div>
            </div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-risk-bg bg-risk-bg px-3 py-1 text-sm font-bold text-risk-text">
              <ShieldAlert className="h-4 w-4" />
              Built for suspicious job posts
            </div>
            <h1 className="text-4xl font-black leading-tight text-balance sm:text-5xl">
              Know if a job post is legit before you apply.
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-muted text-balance">
              Paste a recruiter message, job listing, or apply URL. HireProof turns it into a structured trust report with a clear verdict, score, evidence, and safer next steps.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/audit"
                className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-3 font-bold text-white shadow-lg hover:bg-safe"
              >
                Start investigation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/audit"
                className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface/85 px-6 py-3 font-bold hover:bg-white"
              >
                Try the scam sample
              </Link>
            </div>
          </div>

          <div className="hireproof-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-border-soft pb-4">
              <div>
                <p className="text-sm font-black">Investigation report</p>
                <p className="text-xs font-semibold text-muted">Remote Frontend Intern</p>
              </div>
              <span className="rounded-full bg-risk-bg px-3 py-1 text-sm font-black text-risk-text">High-Risk</span>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border-soft bg-background p-4">
                <div className="mb-2 flex items-end justify-between text-sm">
                  <span className="font-semibold text-muted">Risk score</span>
                  <span className="text-3xl font-black text-high-risk">92</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-border-soft">
                  <div className="h-full w-[92%] rounded-full bg-high-risk" />
                </div>
              </div>
              {flags.map((flag) => (
                <div key={flag} className="flex gap-3 rounded-xl border border-risk-bg bg-risk-bg/70 p-3 text-sm font-semibold text-risk-text">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{flag}</span>
                </div>
              ))}
              <div className="rounded-xl border border-safe-bg bg-safe-bg p-4 text-sm text-safe-text">
                <div className="mb-2 flex items-center gap-2 font-black">
                  <CheckCircle2 className="h-4 w-4" />
                  Safer next step
                </div>
                Compare the opportunity against verified job boards before replying.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[360px_1fr]">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-evidence-bg px-3 py-1 text-xs font-black uppercase tracking-normal text-evidence">
              Example input
            </div>
            <h2 className="text-2xl font-black">Suspicious opportunity</h2>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p><strong>Position:</strong> Remote Frontend Intern</p>
              <p><strong>Salary:</strong> PHP 80,000 per week</p>
              <p><strong>Location:</strong> Remote</p>
              <p><strong>Contact:</strong> Message us on Telegram</p>
              <p className="sm:col-span-2"><strong>Requirements:</strong> Basic HTML/CSS knowledge, no interview needed</p>
            </div>
            <Link href="/audit" className="hireproof-focus mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-bold text-white hover:bg-safe">
              Investigate this post <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-normal text-safe">Workflow</p>
              <h2 className="text-2xl font-black">How it works</h2>
            </div>
            <p className="max-w-xl text-sm font-semibold leading-6 text-muted">
              The interface is intentionally report-first: every verdict should feel backed by visible evidence.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-safe-bg text-safe">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mb-2 text-xs font-black uppercase tracking-normal text-muted">Step {index + 1}</div>
                  <h3 className="font-black">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-muted">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-evidence" />
            <h2 className="text-2xl font-black">Evidence signals</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {evidenceSignals.map((signal) => {
              const Icon = signal.icon
              return (
                <div key={signal.title} className="flex gap-4 rounded-2xl border border-border-soft bg-background p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-evidence-bg text-evidence">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black">{signal.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-muted">{signal.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm font-semibold text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>HireProof. Job-post verification with receipts.</p>
          <Link href="/audit" className="hireproof-focus inline-flex items-center gap-2 rounded-lg text-foreground hover:text-safe">
            Try demo mode <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </footer>
    </div>
  )
}
