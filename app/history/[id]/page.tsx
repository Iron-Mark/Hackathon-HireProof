'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileSearch } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import ResultScreen from '@/components/audit/result-screen'
import { useAuditHistory } from '@/hooks/useAuditHistory'

export default function LocalHistoryReportPage() {
  const params = useParams<{ id: string }>()
  const { history, isLoaded } = useAuditHistory()
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id
  const report = history.find((item) => item.id === reportId)

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl border border-border-soft bg-surface p-6 text-sm font-semibold text-muted">
            Loading archived report...
          </div>
        </main>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-2xl border border-border-soft bg-surface p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border-soft bg-background text-muted">
              <FileSearch className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black">Archived report not found</h1>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-muted">
              This local report may have been cleared from this browser.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/history" className="hireproof-focus inline-flex items-center justify-center rounded-xl border border-border-soft bg-background px-4 py-3 text-sm font-black text-evidence hover:bg-evidence-bg">
                Back to History
              </Link>
              <Link href="/audit" className="hireproof-focus inline-flex items-center justify-center rounded-xl bg-safe px-4 py-3 text-sm font-black text-background hover:bg-safe-text">
                Check a Job Post
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto mb-2 mt-6 flex max-w-4xl items-center justify-between px-4">
        <Link href="/history" className="hireproof-focus inline-flex items-center gap-2 rounded-lg text-sm font-black text-muted hover:text-safe">
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1 text-xs font-semibold text-muted">
          Local Archive - {new Date(report.timestamp || Date.now()).toLocaleDateString()}
        </span>
      </div>
      <ResultScreen result={report} />
    </div>
  )
}
