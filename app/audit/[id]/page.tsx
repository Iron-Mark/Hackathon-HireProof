import { getReport } from '@/lib/db'
import ResultScreen from '@/components/audit/result-screen'
import { SiteHeader } from '@/components/layout/site-header'
import { redirect } from 'next/navigation'
import { ErrorBoundary } from '@/components/system/error-boundary'
import type { Metadata } from 'next'
import { repairAuditReportForDisplay } from '@/lib/report-repair.mjs'

export const runtime = 'nodejs'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const report = await getReport(id)
  const verdict = report?.verdict?.toUpperCase() || 'UNKNOWN'
  const risk = report?.riskScore || 0

  const isScam = verdict === 'HIGH-RISK'
  const title = isScam 
    ? `🚨 SCAM DETECTED: Risk Score ${risk}/100` 
    : `HireProof Report: ${verdict} (${risk}/100)`

  return {
    title,
    description: report?.summary || 'Archived job investigation report from HireProof.',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
    openGraph: {
      title,
      description: `Risk Score: ${risk}/100. ${report?.summary?.substring(0, 100)}...`,
      type: 'article',
    },
  }
}

export default async function AuditPermalinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Input validation: ensure ID only contains valid characters to guard against path traversal or injections
  const safeId = typeof id === 'string' ? id.trim() : ''
  if (!safeId || !/^(report|chat)_[a-zA-Z0-9_-]+$/.test(safeId) || safeId.length > 100) {
    redirect('/audit')
  }

  const report = await getReport(safeId)

  if (!report) {
    redirect('/audit')
  }

  const repaired = repairAuditReportForDisplay(report).report

  return (
    <div className="bg-background min-h-screen">
      <SiteHeader />
      <div className="mt-6 mb-2 mx-auto max-w-4xl px-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/10 px-2.5 py-1 text-xs font-semibold text-muted">
          Archived Report • {new Date(repaired.timestamp || Date.now()).toLocaleDateString()}
        </span>
      </div>
      <ErrorBoundary fallbackMessage="Failed to render the archived report.">
        <ResultScreen 
          result={repaired} 
        />
      </ErrorBoundary>
    </div>
  )
}
