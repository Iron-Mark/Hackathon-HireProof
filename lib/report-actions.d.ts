export function buildLegalAbuseReportMailto(report: {
  extractedClaims?: Record<string, string>
  redFlags?: string[]
}): string

export function buildTrendsJsonExport(stats: unknown, now?: Date): {
  filename: string
  mimeType: 'application/json'
  content: string
}
