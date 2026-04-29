function getClaim(claims, key, fallback = 'Unknown') {
  const value = claims && typeof claims[key] === 'string' ? claims[key].trim() : ''
  return value || fallback
}

export function buildLegalAbuseReportMailto(report) {
  const claims = report?.extractedClaims || {}
  const company = getClaim(claims, 'company')
  const role = getClaim(claims, 'role')
  const redFlags = Array.isArray(report?.redFlags) && report.redFlags.length > 0
    ? report.redFlags.join('\n')
    : 'No red flags listed.'
  const subject = `Phishing Scam Report: ${company}`
  const body = [
    'I am reporting a recruitment scam/phishing attempt.',
    '',
    `Company Claimed: ${company}`,
    `Role: ${role}`,
    '',
    'Red Flags Found:',
    redFlags,
    '',
    'Please investigate and take down the associated domains and accounts.',
  ].join('\n')

  return `mailto:reportphishing@apwg.org,cert@cert.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function buildTrendsJsonExport(stats, now = new Date()) {
  const date = now.toISOString().slice(0, 10)
  return {
    filename: `hireproof-trends-${date}.json`,
    mimeType: 'application/json',
    content: JSON.stringify(stats || {}, null, 2),
  }
}
