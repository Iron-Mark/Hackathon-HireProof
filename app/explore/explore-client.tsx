'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Search, Globe, ShieldAlert, Sparkles, TrendingUp, Cpu, Terminal, ArrowRight, BookOpen, Compass } from 'lucide-react'
import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import type { AuditReport } from '@/lib/schemas'

export function ExploreClient() {
  const [reports, setReports] = useState<AuditReport[]>([])
  const [totalReports, setTotalReports] = useState(0)
  const [query, setQuery] = useState('')
  const [verdict, setVerdict] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (verdict !== 'all') params.set('verdict', verdict)
        
        const res = await fetch(`/api/intelligence/reports?${params.toString()}`)
        const data = await res.json()
        setReports(data.reports || [])
        setTotalReports(Number(data.total || 0))
      } catch (e) {
        console.error('Failed to fetch reports')
      } finally {
        setLoading(false)
      }
    }
    
    const debounce = setTimeout(fetchReports, 300)
    return () => clearTimeout(debounce)
  }, [query, verdict])

  const stats = useMemo(() => {
    return {
      total: reports.length,
      highRisk: reports.filter(r => r.verdict === 'high-risk').length,
      safe: reports.filter(r => r.verdict === 'safe').length,
    }
  }, [reports])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      
      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-12 lg:px-20 xl:px-32">
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-evidence/30 bg-evidence/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-evidence">
            <Compass className="h-4 w-4" />
            Job Scam Pattern Explorer
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Audit <span className="text-safe">Database.</span></h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-muted">
            Explore recent HireProof job-post checks. Review the red flags, evidence, and verdict patterns behind suspicious opportunities.
          </p>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Public Explore only shows live, explicitly listed reports. Demo fixtures, screenshots, private audits, and old seeded reports are excluded.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Reports Reviewed', value: stats.total, icon: Search, color: 'text-foreground' },
            { label: 'Scams Identified', value: stats.highRisk, icon: ShieldAlert, color: 'text-risk-text' },
            { label: 'Verified Safe', value: stats.safe, icon: Sparkles, color: 'text-safe' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-border-soft bg-surface p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-lg bg-background p-2 ${stat.color} border border-border-soft`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</div>
              <div className="mt-1 text-2xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company, role, or keywords..."
              className="w-full rounded-2xl border border-border-soft bg-surface py-4 pl-12 pr-6 text-sm font-semibold outline-none focus:border-safe"
            />
          </div>
          <select
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            className="rounded-2xl border border-border-soft bg-surface px-6 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-safe"
          >
            <option value="all">All Verdicts</option>
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="high-risk">High-Risk</option>
          </select>
        </div>

        {/* Results Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-[2.5rem] bg-surface" />
              ))
            ) : reports.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
                  <Search className="h-8 w-8 text-muted opacity-20" />
                </div>
                <h3 className="text-xl font-black">{totalReports === 0 ? 'No public live reports yet' : 'No reports found'}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-muted">
                  {totalReports === 0
                    ? 'HireProof is hiding demo, screenshot, and private audits from this public database until real public reports are available.'
                    : 'Try adjusting your filters or search query.'}
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={report.id}
                  className="group relative overflow-hidden rounded-[2.5rem] border border-border-soft bg-surface p-8 shadow-sm transition-all hover:border-safe/30 hover:shadow-xl"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    report.verdict === 'safe' ? 'bg-safe' : 
                    report.verdict === 'caution' ? 'bg-caution' : 'bg-risk-bg'
                  }`} />
                  
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <div className={`mb-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                        report.verdict === 'safe' ? 'bg-safe/10 text-safe' : 
                        report.verdict === 'caution' ? 'bg-caution/10 text-caution' : 'bg-risk-bg/10 text-risk-text'
                      }`}>
                        {report.verdict}
                      </div>
                      <h3 className="text-xl font-black leading-tight group-hover:text-safe transition-colors line-clamp-2">
                        {report.extractedClaims.role}
                      </h3>
                      <p className="text-sm font-bold text-muted">{report.extractedClaims.company}</p>
                    </div>
                  </div>

                  <div className="mb-8 flex flex-wrap gap-2">
                    {report.redFlags.slice(0, 2).map((flag, i) => (
                      <span key={i} className="rounded-full bg-background px-3 py-1 text-[10px] font-bold text-muted">
                        {flag}
                      </span>
                    ))}
                    {report.redFlags.length > 2 && (
                      <span className="rounded-full bg-background px-3 py-1 text-[10px] font-bold text-muted">
                        +{report.redFlags.length - 2} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border-soft pt-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted">
                      {report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'Recent'}
                    </div>
                    <Link 
                      href={`/audit/${report.id}`}
                      className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-safe transition-colors"
                    >
                      View Dossier
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
