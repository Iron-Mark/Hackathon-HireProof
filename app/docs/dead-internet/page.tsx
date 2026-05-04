import Link from 'next/link'
import type { Metadata } from 'next'
import { ShieldAlert, Cpu, Bot, UserCheck, AlertTriangle, Zap, BarChart3, Fingerprint, Network, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI-Generated Recruitment Scams | HireProof Docs',
  description: 'A practical HireProof guide to AI-generated recruitment scam patterns, suspicious job posts, recruiter messages, and evidence-first verification.',
}

const scamPatterns = [
  { icon: Bot, label: 'Generated pitch', detail: 'Polished but vague role text, copied phrasing, and urgency pressure.' },
  { icon: UserCheck, label: 'Identity gap', detail: 'Recruiter or company claims do not match official hiring evidence.' },
  { icon: Zap, label: 'Fast trust ask', detail: 'Personal data, payment, or off-platform chat before a normal interview.' },
]

export default function DeadInternetPage() {
  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header Section */}
      <div className="mb-12 border-b border-border-soft pb-12">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-risk-bg text-risk-text shadow-lg">
            <Bot className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-surface border border-border-soft px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted">
              Recruitment Scam Brief
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              AI-Generated Recruitment Scams
            </h1>
          </div>
        </div>
        <p className="text-xl leading-relaxed text-muted font-medium max-w-2xl">
          A practical guide to the automated patterns HireProof checks in suspicious job posts and recruiter messages.
        </p>
      </div>

      <section className="mb-12 rounded-3xl border border-border-soft bg-surface/70 p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {scamPatterns.map((pattern) => (
            <div key={pattern.label} className="rounded-2xl border border-border-soft bg-background p-4 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-risk-bg text-risk-text">
                <pattern.icon className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black">{pattern.label}</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-muted">{pattern.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">
          Pattern brief: AI-generated recruitment scams are summarized as checkable signals instead of a full-page screenshot.
        </p>
      </section>

      <div className="prose prose-slate prose-invert max-w-none space-y-12">
        {/* Executive Summary */}
        <section>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Fingerprint className="h-6 w-6 text-evidence" />
            Executive Summary
          </h2>
          <p className="text-lg leading-relaxed text-muted">
            Generative AI makes it easier to create convincing job posts, recruiter profiles, and outreach messages at scale. HireProof focuses on the practical signals job seekers can verify: company footprint, hiring path, contact channel, role details, pay claims, and supporting evidence.
          </p>
        </section>

        {/* The Crisis Section */}
        <section className="rounded-3xl border border-risk-bg/30 bg-risk-bg/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="h-32 w-32" />
          </div>
          <h2 className="mt-0 flex items-center gap-3 text-2xl font-black text-risk-text">
            <ShieldAlert className="h-6 w-6" />
            The Recruitment Scam Problem
          </h2>
          <div className="grid gap-8 md:grid-cols-3 mt-8">
            <div className="space-y-2">
              <div className="text-4xl font-black text-risk-text">237%</div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Rise in Job Scams</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-risk-text">$893M</div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Reported Fraud Losses</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-risk-text">1 in 4</div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">Suspicious Profiles</p>
            </div>
          </div>
          <p className="mt-8 text-sm font-medium leading-relaxed text-muted/80">
            Attackers can use LLMs to generate professional-looking descriptions and outreach scripts. HireProof reduces the guesswork by checking whether the opportunity has verifiable hiring evidence.
          </p>
        </section>

        {/* Architecture Image */}
        <section className="space-y-4 text-center">
          <div className="overflow-hidden rounded-3xl border border-border-soft bg-surface shadow-2xl">
            <img 
              src="/technical_architecture_fraud_v2.png" 
              alt="Technical architecture of automated recruitment fraud" 
              className="w-full object-cover"
            />
          </div>
          <p className="text-xs font-bold text-muted uppercase tracking-widest">Fig 1.1: Example architecture of automated recruitment fraud</p>
        </section>

        {/* Detection Methodology */}
        <section>
          <h2 className="text-2xl font-black flex items-center gap-3 mb-8">
            <Network className="h-6 w-6 text-safe" />
            Detection Methodology
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border p-6 bg-surface shadow-sm hover:border-evidence transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border-soft">
                <Cpu className="h-6 w-6 text-evidence" />
              </div>
              <h4 className="text-lg font-black">Message Pattern Checks</h4>
              <p className="text-sm text-muted leading-relaxed mt-2">
                HireProof looks for vague responsibilities, urgency pressure, copied phrasing, and suspicious contact instructions.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6 bg-surface shadow-sm hover:border-risk-text transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border-soft">
                <Bot className="h-6 w-6 text-risk-text" />
              </div>
              <h4 className="text-lg font-black">Duplicate Listing Patterns</h4>
              <p className="text-sm text-muted leading-relaxed mt-2">
                Similar listings and repeated contact channels can indicate a copied or mass-posted recruiting scam.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6 bg-surface shadow-sm hover:border-safe transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border-soft">
                <Globe className="h-6 w-6 text-safe" />
              </div>
              <h4 className="text-lg font-black">Company Footprint</h4>
              <p className="text-sm text-muted leading-relaxed mt-2">
                Company sites, hiring pages, social profiles, maps, and directories help confirm whether the claimed employer has a credible footprint.
              </p>
            </div>
            <div className="rounded-2xl border border-border p-6 bg-surface shadow-sm hover:border-caution transition-colors">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border-soft">
                <BarChart3 className="h-6 w-6 text-caution" />
              </div>
              <h4 className="text-lg font-black">Market Anomalies</h4>
              <p className="text-sm text-muted leading-relaxed mt-2">
                Unrealistic compensation claims are flagged by comparing the role against similar legitimate job listings.
              </p>
            </div>
          </div>
        </section>

        {/* Evidence-first verification flow */}
        <section className="border border-safe/25 bg-safe/10 text-foreground rounded-3xl p-10 shadow-2xl shadow-safe/10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
          <h2 className="mt-0 flex items-center gap-3 text-2xl font-black text-foreground relative z-10">
            <UserCheck className="h-6 w-6 text-safe" />
            The Evidence-First Verification Flow
          </h2>
          <p className="text-lg font-medium opacity-80 mt-4 relative z-10">
            HireProof returns a verdict only after checking the opportunity against concrete evidence sources.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 relative z-10">
            <div className="space-y-2">
              <h4 className="font-black text-safe">Claim Extraction</h4>
              <p className="text-sm opacity-70">The agent extracts company, role, pay, location, and contact path before searching.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-safe">Evidence Review</h4>
              <p className="text-sm opacity-70">Each report links risk and safety signals back to visible evidence whenever available.</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <div className="mt-20 rounded-3xl border border-border-soft bg-surface p-12 text-center shadow-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-safe text-background">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black">Check the job before you apply.</h3>
          <p className="text-muted text-lg mt-2 max-w-xl mx-auto font-medium">
            Use HireProof to verify suspicious opportunities with evidence, not guesses.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/audit" className="hireproof-cta-primary w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-black shadow-lg">
              Check a Job Post
            </Link>
            <Link href="/docs/api-reference" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border-soft bg-background px-8 py-4 text-base font-black text-foreground hover:bg-surface transition-all">
              API Reference
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
