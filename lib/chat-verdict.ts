import type { AuditReport } from './schemas'

export type ChatVerdict = {
  text: string
  reportUrl: string | null
  status: string
}

function titleCaseVerdict(verdict: AuditReport['verdict']) {
  if (verdict === 'high-risk') return 'High-Risk'
  return verdict.charAt(0).toUpperCase() + verdict.slice(1)
}

function normalizeReportBaseUrl(baseUrl?: string) {
  const normalized = baseUrl?.trim().replace(/\s+/g, '')
  return normalized ? normalized.replace(/\/$/, '') : ''
}

export function formatChatVerdict(report: AuditReport, baseUrl?: string): ChatVerdict {
  const verdict = titleCaseVerdict(report.verdict)
  const redFlags = report.redFlags.slice(0, 3)
  const evidence = report.evidence.slice(0, 2)
  const normalizedBaseUrl = normalizeReportBaseUrl(baseUrl)
  const reportUrl = report.id && normalizedBaseUrl ? `${normalizedBaseUrl}/audit/${report.id}` : null

  const lines = [
    `HireProof verdict: ${verdict} (${report.riskScore}/100)`,
    report.summary,
  ]

  if (redFlags.length > 0) {
    lines.push(`Top red flags: ${redFlags.join('; ')}`)
  }

  if (evidence.length > 0) {
    lines.push(`Evidence checked: ${evidence.map((item) => item.source).join('; ')}`)
  }

  if (reportUrl) {
    lines.push(`Full report: ${reportUrl}`)
  }

  return {
    text: lines.join('\n'),
    reportUrl,
    status: 'ChatSDK Agents verdict formatted.',
  }
}
