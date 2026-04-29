import { Metadata } from 'next'
import { VerifiedBadge } from '@/components/verified-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { ShieldCheck, Info } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Verified Business Badge | HireProof Docs',
  description: 'Learn how to embed the HireProof Verified Secure badge on your career page.',
}

export default function VerifiedBadgePage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Verified Business Badge</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Rewarding the good guys. Display your commitment to job seeker safety by embedding our live verification seal.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-safe" />
          Live Demo
        </h2>
        <div className="rounded-3xl border border-border-soft bg-surface p-12 flex justify-center">
          <VerifiedBadge company="HireProof" />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-black">How to Embed</h2>
        <p className="font-medium text-muted">
          Legitimate companies with a <strong>HireProof Pro</strong> subscription can embed the seal using a single line of code. Our server validates your domain and signing key in real-time.
        </p>
        
        <CodeBlock 
          title="Embed Script"
          language="html"
          code={`<script 
  src="https://hireproof.com/js/badge.js" 
  data-key="hp_live_your_key" 
  data-company="Acme Corp"
></script>`}
        />
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <Info className="mt-1 h-5 w-5 text-muted" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Why it matters</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Recruitment fraud costs legitimate companies millions in brand reputation damage. The HireProof Seal proves that your hiring process is official and audited, building instant trust with top talent.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
