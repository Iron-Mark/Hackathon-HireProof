'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import AuditForm from '@/components/audit-form'
import ResultScreen from '@/components/result-screen'
import { SiteHeader } from '@/components/site-header'
import { DEMO_FIXTURES } from '@/lib/fixtures'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import type { AuditReport, AuditRequest } from '@/lib/schemas'

const investigationSteps = [
  'Extracting role, pay, company, and contact claims',
  'Checking company presence and hiring footprint',
  'Scanning reputation and scam-pattern signals',
  'Comparing compensation against similar roles',
  'Preparing verdict, evidence, and next steps',
]

const sampleRequests = {
  highRisk: {
    text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
    location: 'Philippines',
  },
  caution: {
    text: 'Software engineer role at TechStart Solutions. Competitive salary, remote or hybrid, apply through online form. Some responsibilities are unclear.',
    location: 'Philippines',
  },
  safe: {
    text: 'Senior Software Engineer at Microsoft. Hybrid role in Seattle with LinkedIn recruiter outreach and official application portal.',
    location: 'United States',
  },
}

export default function AuditPage() {
  const [result, setResult] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addReport } = useAuditHistory()

  const handleInvestigate = async (data: AuditRequest, demoFixture?: AuditReport) => {
    setLoading(true)
    setError(null)
    setIsDemo(!!demoFixture)

    try {
      if (demoFixture) {
        await new Promise((resolve) => setTimeout(resolve, 900))
        const report: AuditReport = {
          id: `report_${Date.now()}`,
          timestamp: new Date().toISOString(),
          mode: 'demo',
          ...demoFixture,
        }
        setResult(report)
        addReport(report)
        return
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Audit request failed')
      }

      const report: AuditReport = await response.json()
      setIsDemo(report.mode !== 'live')
      setResult(report)
      addReport(report)
    } catch (err) {
      console.error('[AuditPage] Investigation failed:', err)
      const fallbackReport: AuditReport = {
        ...(demoFixture || DEMO_FIXTURES.highRisk),
        id: `report_${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode: 'demo' as const,
      }
      setIsDemo(true)
      setError('Live investigation failed, so HireProof loaded the demo report instead.')
      setResult(fallbackReport)
      addReport(fallbackReport)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="bg-background">
        <SiteHeader />
        <ResultScreen result={result} isDemo={isDemo} onBackToAudit={() => setResult(null)} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="hireproof-grid border-b border-border-soft">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-full bg-safe-bg px-3 py-1 text-xs font-black uppercase tracking-normal text-safe-text">
              Evidence intake
            </div>
            <h1 className="text-4xl font-black leading-tight text-balance">Investigate an opportunity</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-muted">
              Paste a job post, recruiter message, or apply URL. HireProof checks the claims and returns a verdict with receipts.
            </p>
          </div>

          <AuditForm onInvestigate={handleInvestigate} loading={loading} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">

        {loading && (
          <div className="mb-6 rounded-2xl border border-border bg-surface p-6 shadow-sm" aria-live="polite">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black">Investigation running</p>
                <p className="text-sm font-semibold text-muted">Checking the same signals a careful applicant would open across several tabs.</p>
              </div>
              <span className="rounded-full bg-evidence-bg px-3 py-1 text-xs font-black text-evidence">Evidence Check</span>
            </div>
            <div className="space-y-3">
              {investigationSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-border-soft bg-background p-3 text-sm font-semibold">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-safe-bg text-xs font-black text-safe-text">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-caution-bg bg-caution-bg p-4 text-sm font-semibold text-caution-text">
            {error}
          </div>
        )}

        <div>
          <p className="mb-4 text-sm font-black text-muted">Or try a sample:</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleInvestigate(sampleRequests.highRisk, DEMO_FIXTURES.highRisk)}
              disabled={loading}
              className="hireproof-focus flex items-center gap-2 rounded-full border border-risk-bg bg-risk-bg px-4 py-2 text-sm font-black text-risk-text hover:bg-white disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4 text-high-risk" />
              High-Risk
            </button>
            <button
              onClick={() => handleInvestigate(sampleRequests.caution, DEMO_FIXTURES.caution)}
              disabled={loading}
              className="hireproof-focus flex items-center gap-2 rounded-full border border-caution-bg bg-caution-bg px-4 py-2 text-sm font-black text-caution-text hover:bg-white disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-caution" />
              Caution
            </button>
            <button
              onClick={() => handleInvestigate(sampleRequests.safe, DEMO_FIXTURES.safe)}
              disabled={loading}
              className="hireproof-focus flex items-center gap-2 rounded-full border border-safe-bg bg-safe-bg px-4 py-2 text-sm font-black text-safe-text hover:bg-white disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-safe" />
              Safe
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border-soft bg-surface p-5 text-sm shadow-sm">
          <p className="font-semibold text-muted">
            <strong>Live Search Ready:</strong> Investigations use SerpApi evidence when configured, with demo examples available for presentation.
          </p>
        </div>
      </div>
    </div>
  )
}
