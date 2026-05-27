export type PublicReportIdPrefix = 'report' | 'chat'

export function createPublicReportId(prefix: PublicReportIdPrefix = 'report') {
  return `${prefix}_${globalThis.crypto.randomUUID()}`
}

export function isPublicReportId(id: string): boolean {
  return /^(report|chat)_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
