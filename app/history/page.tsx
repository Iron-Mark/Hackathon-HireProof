'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AlertTriangle, Zap, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import type { AuditReport } from '@/lib/schemas'

export default function HistoryPage() {
  const [filter, setFilter] = useState<'all' | 'safe' | 'caution' | 'high-risk'>('all')
  const { history, isLoaded } = useAuditHistory()

  const filtered = history.filter(item => filter === 'all' || item.verdict === filter)

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-safe/10 text-safe rounded text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Safe
          </div>
        )
      case 'caution':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-caution/10 text-caution rounded text-sm font-medium">
            <Zap className="w-4 h-4" />
            Caution
          </div>
        )
      case 'high-risk':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-high-risk/10 text-high-risk rounded text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            High-Risk
          </div>
        )
      default:
        return null
    }
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Investigation History</h1>
          <p className="text-muted">All your past investigations saved locally.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-foreground text-background'
                : 'bg-white/50 border hover:bg-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('safe')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'safe'
                ? 'bg-safe text-white'
                : 'bg-white/50 border hover:bg-white text-safe'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Safe
          </button>
          <button
            onClick={() => setFilter('caution')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'caution'
                ? 'bg-caution text-white'
                : 'bg-white/50 border hover:bg-white text-caution'
            }`}
          >
            <Zap className="w-4 h-4" />
            Caution
          </button>
          <button
            onClick={() => setFilter('high-risk')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              filter === 'high-risk'
                ? 'bg-high-risk text-white'
                : 'bg-white/50 border hover:bg-white text-high-risk'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            High-Risk
          </button>
        </div>

        {/* History List */}
        {!isLoaded ? (
          <div className="text-center py-16">
            <p className="text-muted">Loading history...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:bg-white/50 transition-colors flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getVerdictBadge(item.verdict)}
                    <span className="text-sm text-muted">Risk Score: {item.riskScore}</span>
                  </div>
                  <h3 className="font-semibold">{item.extractedClaims.role}</h3>
                  <p className="text-sm text-muted">{item.extractedClaims.company}</p>
                  <p className="text-xs text-muted mt-1">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted mb-6">No investigations yet.</p>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded font-medium hover:opacity-90"
            >
              Start Investigation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
