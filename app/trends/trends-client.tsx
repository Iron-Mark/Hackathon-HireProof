'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/layout/site-header'
import { TrendingUp, AlertTriangle, ShieldCheck, Zap, Globe, BarChart3, Clock, Download } from 'lucide-react'
import { buildTrendsViewModel } from '@/lib/trends-view-model.mjs'
import { buildTrendsJsonExport, buildTrendsCsvExport } from '@/lib/report-actions.mjs'

export function TrendsClient() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/intelligence/trends')
      .then(res => res.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }
  const viewModel = buildTrendsViewModel(stats || {})
  const handleExportJson = () => {
    const exportPayload = buildTrendsJsonExport(stats || {})
    const blob = new Blob([exportPayload.content], { type: exportPayload.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportPayload.filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCsv = () => {
    const exportPayload = buildTrendsCsvExport(stats || {})
    const blob = new Blob([exportPayload.content], { type: exportPayload.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportPayload.filename
    link.click()
    URL.revokeObjectURL(url)
  }
  const statIcons: Record<string, { icon: any; color: string }> = {
    reports: { icon: BarChart3, color: 'text-evidence' },
    highRisk: { icon: AlertTriangle, color: 'text-risk-text' },
    caution: { icon: Clock, color: 'text-caution' },
    safe: { icon: ShieldCheck, color: 'text-safe' },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-safe border-t-transparent" />
          <p className="mt-4 text-sm font-black uppercase tracking-widest text-muted">Analyzing job scam patterns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
        <header className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-safe">
              <TrendingUp className="h-4 w-4" />
              Pattern Trends · {viewModel.modeLabel}
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Recruitment Scam <span className="text-safe">Trends.</span></h1>
            <p className="mt-6 max-w-2xl text-lg font-medium text-muted leading-relaxed">
              Recurring risk patterns from job-post checks, saved reports, and live evidence sources.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              aria-label="Export trends JSON"
              className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-background"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              aria-label="Export trends CSV"
              className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-background"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-8 lg:grid-cols-3"
        >
          {/* High-Level Stats */}
          <motion.div variants={itemVariants} className="col-span-full grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {viewModel.statCards.map((stat: any) => {
              const meta = statIcons[stat.id] || statIcons.reports
              const Icon = meta.icon
              return (
              <div key={stat.label} className="rounded-3xl border border-border-soft bg-surface p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className={`rounded-lg bg-background p-2 ${meta.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</div>
                <div className="mt-1 text-2xl font-black">{stat.value}</div>
              </div>
            )})}
          </motion.div>

          {/* Prevailing Vectors */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
            <div className="rounded-[2.5rem] border border-border-soft bg-surface p-10 shadow-sm">
              <h3 className="text-2xl font-black mb-8">Stored Audit Patterns</h3>
              <div className="grid gap-8 lg:grid-cols-3">
                {viewModel.vectorSections.map((section: any) => (
                  <div key={section.title} className="space-y-5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted">{section.title}</h4>
                    {section.items.length === 0 ? (
                      <p className="text-sm font-semibold text-muted">No saved reports yet.</p>
                    ) : section.items.slice(0, 5).map((item: any, i: number) => (
                      <div key={`${section.title}-${item.label}`} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                          <span className="truncate pr-3">{item.label}</span>
                          <span className="text-risk-text">{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-background">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percent}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-risk-bg shadow-[0_0_10px_#f43f5e]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-border-soft bg-surface p-10 shadow-sm">
              <h3 className="text-2xl font-black mb-8">Recent High-Risk Reports</h3>
              <div className="grid gap-4">
                {viewModel.recentHighRisk.length === 0 ? (
                  <p className="text-sm font-semibold text-muted">No high-risk reports saved yet.</p>
                ) : viewModel.recentHighRisk.map((report: any) => (
                  <div key={report.id} className="rounded-2xl border border-border-soft bg-background p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-black">{report.role}</h4>
                        <p className="text-sm font-semibold text-muted">{report.company}</p>
                      </div>
                      <span className="rounded-full bg-risk-bg/10 px-3 py-1 text-xs font-black text-risk-text">{report.riskScore}/100</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-muted">{report.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Live Alerts Sidebar */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="rounded-[2.5rem] border border-evidence-bg bg-surface p-8 text-foreground shadow-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-evidence-bg bg-evidence-bg text-evidence">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black leading-tight">Live Evidence Signals</h3>
              <p className="mt-4 text-sm font-semibold leading-6 text-muted">
                {viewModel.externalSignalCount > 0
                  ? `${viewModel.externalSignalCount} external reputation signals are available from the live evidence layer.`
                  : 'Live evidence is not configured yet, so this page is using saved audit reports only.'}
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border-soft bg-background px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted">
                <Clock className="h-3 w-3" />
                {viewModel.modeLabel}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-border-soft bg-surface p-8">
              <h4 className="text-sm font-black uppercase tracking-widest text-muted mb-6">Verdict Mix</h4>
              <div className="space-y-4">
                {[
                  { label: 'High-risk', value: stats?.verdicts?.['high-risk'] || 0, color: 'text-risk-text' },
                  { label: 'Caution', value: stats?.verdicts?.caution || 0, color: 'text-caution' },
                  { label: 'Safe', value: stats?.verdicts?.safe || 0, color: 'text-safe' },
                ].map((verdict) => (
                  <div key={verdict.label} className="flex items-center justify-between border-b border-border-soft pb-4 last:border-0 last:pb-0">
                    <span className="text-sm font-bold">{verdict.label}</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${verdict.color}`}>{verdict.value} reports</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
