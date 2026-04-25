'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import AuditForm from '@/components/audit-form'
import ResultScreen from '@/components/result-screen'
import { DEMO_FIXTURES, getAllFixtures } from '@/lib/fixtures'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import type { AuditReport } from '@/lib/schemas'

export default function AuditPage() {
  const [result, setResult] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const { addReport } = useAuditHistory()

  const handleInvestigate = async (data: any, demoFixture?: any) => {
    setLoading(true)
    setIsDemo(!!demoFixture)
    // Simulate investigation delay
    setTimeout(() => {
      const report = {
        ...(demoFixture || DEMO_FIXTURES.highRisk),
        mode: 'demo' as const,
      }
      setResult(report)
      addReport(report)
      setLoading(false)
    }, 2000)
  }

  if (result) {
    return (
      <div>
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="font-bold text-2xl">HireProof</div>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-muted">Home</Link>
              <Link href="/audit" className="hover:text-muted">Audit</Link>
              <Link href="/history" className="hover:text-muted">History</Link>
            </nav>
          </div>
        </header>
        <ResultScreen result={result} isDemo={isDemo} onBackToAudit={() => setResult(null)} />
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="font-bold text-2xl">HireProof</div>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-muted">Home</Link>
            <Link href="/audit" className="hover:text-muted">Audit</Link>
            <Link href="/history" className="hover:text-muted">History</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Investigate an Opportunity</h1>
          <p className="text-muted">Paste a job post, recruiter message, or apply URL below. We&apos;ll check if it&apos;s legit.</p>
        </div>

        <AuditForm onInvestigate={handleInvestigate} loading={loading} />

        {/* Sample Chips */}
        <div className="mt-12">
          <p className="text-sm text-muted mb-4 font-semibold">Or try a sample:</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleInvestigate({}, DEMO_FIXTURES.highRisk)}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-white/50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4 text-high-risk" />
              High-Risk Example
            </button>
            <button
              onClick={() => handleInvestigate({}, DEMO_FIXTURES.caution)}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-white/50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-caution" />
              Caution Example
            </button>
            <button
              onClick={() => handleInvestigate({}, DEMO_FIXTURES.safe)}
              disabled={loading}
              className="px-4 py-2 border rounded hover:bg-white/50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-safe" />
              Safe Example
            </button>
          </div>
        </div>

        {/* Demo Mode Info */}
        <div className="mt-16 p-6 bg-white/50 rounded-lg border text-sm">
          <p className="text-muted mb-2">
            <strong>Demo Mode:</strong> Investigations use sample data. Connect live APIs (SerpApi, AI SDK) to verify real opportunities.
          </p>
        </div>
      </div>
    </div>
  )
}
