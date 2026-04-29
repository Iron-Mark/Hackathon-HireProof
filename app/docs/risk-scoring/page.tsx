import { BarChart3, AlertTriangle, ShieldCheck, Scale, Info } from 'lucide-react'

export const metadata = { 
  title: 'Risk Scoring — HireProof Docs',
  description: 'Deep dive into the deterministic, weighted risk scoring system used by HireProof.'
}

export default function RiskScoringPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Risk Scoring</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof uses a deterministic, weighted scoring system to ensure that every verdict is explainable, repeatable, and accurate.
        </p>
      </section>

      {/* Logic */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Scale className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">The Weighted System</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          Risk calculations start at a baseline of <strong>25</strong>. We then apply weighted penalties (Red Flags) and bonuses (Green Flags) based on the evidence gathered by the AI agent.
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Red Flags */}
          <div className="rounded-2xl border border-risk-bg/30 bg-risk-bg/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-risk-text uppercase tracking-widest">
              <AlertTriangle className="h-4 w-4" />
              Risk Penalties
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Unrealistic Pay', weight: '+25', desc: 'Salary far above market outlier' },
                { label: 'Payment Requested', weight: '+25', desc: 'Mention of "training fees" or "kits"' },
                { label: 'Telegram/WhatsApp', weight: '+18', desc: 'Anonymous chat-only contact' },
                { label: 'Zero Footprint', weight: '+15', desc: 'No verifiable business registration' },
              ].map((flag) => (
                <div key={flag.label} className="flex items-center justify-between border-b border-risk-bg/10 pb-2 last:border-0">
                  <div>
                    <div className="text-xs font-bold text-foreground">{flag.label}</div>
                    <div className="text-[10px] text-muted">{flag.desc}</div>
                  </div>
                  <span className="text-sm font-black text-risk-text">{flag.weight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Green Flags */}
          <div className="rounded-2xl border border-safe/30 bg-safe/5 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black text-safe uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" />
              Safety Bonuses
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Verified Domain', weight: '-18', desc: 'Matches official company site' },
                { label: 'LinkedIn Footprint', weight: '-15', desc: 'Active, high-authority profile' },
                { label: 'Market Standard', weight: '-12', desc: 'Pay matches local economic data' },
                { label: 'Physical Office', weight: '-10', desc: 'Verifiable on Google Maps' },
              ].map((flag) => (
                <div key={flag.label} className="flex items-center justify-between border-b border-safe/10 pb-2 last:border-0">
                  <div>
                    <div className="text-xs font-bold text-foreground">{flag.label}</div>
                    <div className="text-[10px] text-muted">{flag.desc}</div>
                  </div>
                  <span className="text-sm font-black text-safe">{flag.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verdicts */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <BarChart3 className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Verdict Thresholds</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-safe-bg bg-safe-bg/30 p-5 text-center">
            <div className="text-2xl font-black text-safe">0 - 34</div>
            <div className="mt-1 text-xs font-black uppercase text-safe-text tracking-widest">Safe ✅</div>
          </div>
          <div className="rounded-2xl border border-caution-bg bg-caution-bg/30 p-5 text-center">
            <div className="text-2xl font-black text-caution">35 - 64</div>
            <div className="mt-1 text-xs font-black uppercase text-caution-text tracking-widest">Caution ⚠️</div>
          </div>
          <div className="rounded-2xl border border-risk-bg bg-risk-bg/30 p-5 text-center">
            <div className="text-2xl font-black text-high-risk">65 - 100</div>
            <div className="mt-1 text-xs font-black uppercase text-risk-text tracking-widest">High-Risk 🔴</div>
          </div>
        </div>
      </section>

      {/* Explainability */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <Info className="mt-1 h-5 w-5 text-muted" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Explainable AI</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Every point added or subtracted is linked to a specific piece of evidence in the Audit Report. This "Human-Readable Reasoning" is what makes HireProof more than just a blacklist—it is a forensic tool.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
