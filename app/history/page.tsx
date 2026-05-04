'use client'

import { motion } from 'framer-motion'
import { SiteHeader } from '@/components/layout/site-header'
import { History, FileSearch, ArrowRight, ShieldCheck, AlertTriangle, Zap, Calendar, Download } from 'lucide-react'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import Link from 'next/link'

export default function HistoryPage() {
  const { history, isLoaded, clearHistory } = useAuditHistory()
  const highRiskCount = history.filter((report) => report.verdict === 'high-risk').length
  const cautionCount = history.filter((report) => report.verdict === 'caution').length
  const safeCount = history.filter((report) => report.verdict === 'safe').length

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0 },
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3 py-1 text-[10px] font-black uppercase tracking-normal text-muted shadow-sm">
              <History className="h-3.5 w-3.5" />
              Local Report Archive
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Case History</h1>
            <p className="mt-3 max-w-xl text-base font-medium leading-7 text-muted sm:text-lg">
              Access your previous job investigations. All data is stored locally in your browser session.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete all locally stored case files?')) {
                  clearHistory()
                }
              }}
              className="text-left text-xs font-black uppercase tracking-normal text-muted transition-colors hover:text-risk-text md:text-right"
            >
              Purge Local Archive
            </button>
          )}
        </div>

        {!isLoaded ? (
          <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm sm:p-8">
            <div className="mb-4 text-xs font-black uppercase tracking-normal text-muted">Loading local archive</div>
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl border border-border-soft bg-background" />
              ))}
            </div>
          </div>
        ) : history.length === 0 ? (
          <div data-testid="history-empty-state" className="rounded-2xl border border-dashed border-border-soft bg-surface/40 p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-border-soft bg-background text-muted">
              <FileSearch className="h-7 w-7 opacity-50" />
            </div>
            <h2 className="mb-2 text-2xl font-black">Archive is empty</h2>
            <p className="mx-auto mb-6 max-w-md text-sm font-medium leading-6 text-muted sm:text-base">
              You haven't checked any job posts in this session yet.
            </p>
            <Link href="/audit" className="hireproof-cta-primary inline-flex rounded-xl px-6 py-3 text-sm font-black shadow-lg">
              Check a Job Post
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-4" aria-label="Archive summary">
              {[
                { label: 'Total', value: history.length, className: 'text-foreground' },
                { label: 'High-risk', value: highRiskCount, className: 'text-risk-text' },
                { label: 'Caution', value: cautionCount, className: 'text-caution-text' },
                { label: 'Safe', value: safeCount, className: 'text-safe' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border-soft bg-surface p-3 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-normal text-muted">{item.label}</div>
                  <div className={`mt-1 text-2xl font-black ${item.className}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {history.map((report) => (
                <motion.div key={report.id} variants={itemVariants}>
                  <Link
                    href={`/history/${report.id}`}
                    data-testid="history-report-card"
                    className="group flex flex-col gap-4 rounded-2xl border border-border-soft bg-surface p-4 shadow-sm transition-all hover:border-safe/40 hover:bg-background hover:shadow-lg hover:shadow-safe/5 sm:p-5 md:flex-row md:items-center"
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      report.verdict === 'high-risk' ? 'bg-risk-bg text-risk-text' :
                      report.verdict === 'caution' ? 'bg-caution-bg text-caution-text' :
                      'bg-safe-bg text-safe'
                    }`}>
                      {report.verdict === 'high-risk' ? <AlertTriangle className="h-6 w-6" /> :
                       report.verdict === 'caution' ? <Zap className="h-6 w-6" /> :
                       <ShieldCheck className="h-6 w-6" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-normal ${
                          report.verdict === 'high-risk' ? 'bg-risk-bg text-risk-text' :
                          report.verdict === 'caution' ? 'bg-caution-bg text-caution-text' :
                          'bg-safe-bg text-safe'
                        }`}>
                          {report.verdict} Report
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-normal text-muted">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.timestamp || '').toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="truncate text-lg font-black transition-colors group-hover:text-safe sm:text-xl">
                        {report.extractedClaims.role || 'Unknown role'}
                      </h3>
                      <p className="truncate text-sm font-bold text-muted/70">
                        {report.extractedClaims.company || 'Unknown company'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:text-right">
                      <div className="flex flex-col">
                        <span className="mb-1 text-[10px] font-black uppercase tracking-normal text-muted">Risk Score</span>
                        <span className={`text-xl font-black ${
                          report.verdict === 'high-risk' ? 'text-risk-text' :
                          report.verdict === 'caution' ? 'text-caution-text' :
                          'text-safe'
                        }`}>
                          {report.riskScore}<span className="ml-1 text-[10px] opacity-40">/100</span>
                        </span>
                      </div>
                      <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border-soft bg-background px-3 text-xs font-black text-evidence transition-all group-hover:border-safe group-hover:bg-safe group-hover:text-background dark:group-hover:text-[#06130d]">
                        Open report
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        <div className="mt-12 rounded-2xl border border-border-soft bg-surface p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-2 text-xl font-black">Export Full Archive</h2>
              <p className="text-sm font-medium leading-6 text-muted">
                Download all your investigation case files as a single JSON packet for offline review.
              </p>
            </div>
            <div className="flex md:justify-end">
              <button
                disabled={history.length === 0}
                onClick={() => {
                  const data = JSON.stringify(history, null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `hireproof-archive-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="hireproof-focus hireproof-cta-primary flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black shadow-lg disabled:border-safe/30 disabled:bg-safe-bg disabled:text-safe-text disabled:opacity-100 md:w-auto"
              >
                <Download className="h-5 w-5" />
                Download Report Packet
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
