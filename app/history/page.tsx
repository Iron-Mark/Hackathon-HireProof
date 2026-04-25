'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertTriangle, Zap, CheckCircle2, ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { useAuditHistory } from '@/hooks/useAuditHistory'

export default function HistoryPage() {
  const [filter, setFilter] = useState<'all' | 'safe' | 'caution' | 'high-risk'>('all')
  const { history, isLoaded } = useAuditHistory()

  const filtered = history.filter(item => filter === 'all' || item.verdict === filter)

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return (
          <div className="flex items-center gap-2 rounded-full bg-safe-bg px-3 py-1 text-sm font-black text-safe-text">
            <CheckCircle2 className="w-4 h-4" />
            Safe
          </div>
        )
      case 'caution':
        return (
          <div className="flex items-center gap-2 rounded-full bg-caution-bg px-3 py-1 text-sm font-black text-caution-text">
            <Zap className="w-4 h-4" />
            Caution
          </div>
        )
      case 'high-risk':
        return (
          <div className="flex items-center gap-2 rounded-full bg-risk-bg px-3 py-1 text-sm font-black text-risk-text">
            <AlertTriangle className="w-4 h-4" />
            High-Risk
          </div>
        )
      default:
        return null
    }
  }

  const filterClasses = (active: boolean, tone: 'default' | 'safe' | 'caution' | 'risk' = 'default') => {
    if (active && tone === 'safe') return 'bg-safe text-white border-safe'
    if (active && tone === 'caution') return 'bg-caution text-white border-caution'
    if (active && tone === 'risk') return 'bg-high-risk text-white border-high-risk'
    if (active) return 'bg-foreground text-white border-foreground'
    return 'bg-surface text-muted border-border hover:bg-background hover:text-foreground'
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="hireproof-grid border-b border-border-soft">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="mb-8">
            <div className="mb-3 inline-flex rounded-full bg-evidence-bg px-3 py-1 text-xs font-black uppercase tracking-normal text-evidence">
              Local reports
            </div>
            <h1 className="text-4xl font-black leading-tight">Investigation history</h1>
            <p className="mt-3 font-semibold text-muted">Past HireProof reports saved locally in this browser.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`hireproof-focus rounded-full border px-4 py-2 text-sm font-black ${filterClasses(filter === 'all')}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('safe')}
              className={`hireproof-focus flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${filterClasses(filter === 'safe', 'safe')}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Safe
            </button>
            <button
              onClick={() => setFilter('caution')}
              className={`hireproof-focus flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${filterClasses(filter === 'caution', 'caution')}`}
            >
              <Zap className="w-4 h-4" />
              Caution
            </button>
            <button
              onClick={() => setFilter('high-risk')}
              className={`hireproof-focus flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${filterClasses(filter === 'high-risk', 'risk')}`}
            >
              <AlertTriangle className="w-4 h-4" />
              High-Risk
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        {!isLoaded ? (
          <div className="rounded-2xl border border-border-soft bg-surface py-16 text-center shadow-sm">
            <p className="font-semibold text-muted">Loading history...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-surface p-4 shadow-sm transition-colors hover:bg-white"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    {getVerdictBadge(item.verdict)}
                    <span className="text-sm font-black text-muted">Risk Score: {item.riskScore}</span>
                  </div>
                  <h3 className="truncate font-black">{item.extractedClaims.role}</h3>
                  <p className="truncate text-sm font-semibold text-muted">{item.extractedClaims.company}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border-soft bg-surface px-6 py-16 text-center shadow-sm">
            <p className="mb-6 font-semibold text-muted">No investigations yet.</p>
            <Link
              href="/audit"
              className="hireproof-focus inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 font-black text-white shadow-lg hover:bg-safe"
            >
              Start investigation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
