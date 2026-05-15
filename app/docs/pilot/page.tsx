import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2, KeyRound, ShieldCheck, UsersRound } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Pilot Program | HireProof Docs',
  description: 'Post-hackathon pilot plan for using HireProof with job-seeker communities, schools, recruiters, and job boards.',
}

const pilotGroups = [
  {
    title: 'Career communities',
    body: 'Use demo reports, chat workflows, and API checks to help members screen suspicious posts before sharing personal data.',
  },
  {
    title: 'Schools and bootcamps',
    body: 'Add a lightweight verification step for internship posts, student job boards, and recruiter messages.',
  },
  {
    title: 'Recruiters and job boards',
    body: 'Use verified domains, signed webhooks, and exportable reports to show hiring paths are legitimate.',
  },
]

const rolloutSteps = [
  'Keep public demo and proof pages live while moving live provider spend to BYOK-first controls.',
  'Run a small pilot with 3-5 communities or teams and capture real suspicious-post workflows.',
  'Measure repeat use, false-positive feedback, export usage, and API/webhook demand before adding billing.',
  'Keep the product focused on job scams unless pilot evidence proves a broader trust category is worth pursuing.',
]

export default function PilotPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-safe">
          <Building2 className="h-4 w-4" />
          Post-hackathon startup path
        </div>
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Pilot Program</h1>
        <p className="max-w-3xl text-xl font-medium leading-relaxed text-muted">
          HireProof remains a focused employment-fraud trust product after Cursor Hackathon. The outcome was shaped by community-vote reach as well as product quality, so the next 90 days should turn the shipped proof into pilot evidence.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/audit?demo=high-risk" className="hireproof-focus hireproof-cta-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black">
            Try the demo <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/developer" className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-border-soft bg-surface px-4 py-2.5 text-sm font-black hover:bg-background">
            Configure API and BYOK
          </Link>
          <Link href="/pilot" className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-lg border border-safe/30 bg-safe/10 px-4 py-2.5 text-sm font-black text-safe hover:bg-background">
            Request a pilot
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'Demo stays public', body: 'Seeded fixtures, proof pages, downloads, packages, and documentation stay available for low-friction evaluation.' },
          { icon: KeyRound, title: 'Live checks go BYOK-first', body: 'Serious live model/search usage should run through owner credentials so cost and provider access stay controlled.' },
          { icon: UsersRound, title: 'Pilots validate demand', body: 'The product should earn its next feature work through real user workflows, not another speculative redesign.' },
        ].map((item) => (
          <article key={item.title} className="rounded-2xl border border-border-soft bg-surface p-6">
            <item.icon className="mb-4 h-6 w-6 text-safe" />
            <h2 className="text-lg font-black">{item.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6">
        <h2 className="text-2xl font-black">Best pilot fit</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {pilotGroups.map((group) => (
            <article key={group.title} className="rounded-xl border border-border-soft bg-background p-5">
              <h3 className="text-sm font-black">{group.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted">{group.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-safe/30 bg-safe/5 p-6">
        <h2 className="text-2xl font-black">90-day operating plan</h2>
        <ol className="mt-5 space-y-3">
          {rolloutSteps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl bg-background/70 p-4 text-sm font-semibold leading-6 text-muted">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-safe text-xs font-black text-background">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-caution/30 bg-caution/5 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-caution" />
          <div>
            <h2 className="text-xl font-black">Positioning boundary</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              Say HireProof was built and shipped for the Cursor Hackathon, remains live as a focused job-post verification product, and is moving into pilot validation. Do not frame the result as a loss, claim a win, claim marketplace approval, promise continuous learning, or broaden into generic fraud coverage without new proof.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
