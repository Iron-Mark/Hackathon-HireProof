export function sanitizeAuditPermalinkReport(report) {
  if (!report || typeof report !== 'object') return report

  const {
    chatPlatform,
    chatThreadId,
    chatChannelId,
    ...publicReport
  } = report

  return publicReport
}
