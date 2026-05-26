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

export function buildTrendsCsvExport(stats, now = new Date()) {
  const date = now.toISOString().slice(0, 10)
  const rows = [['Category', 'Label', 'Count']]

  rows.push(['SampleQuality', stats?.sampleQuality || 'unknown', stats?.trendReadyReports ?? ''])
  if (stats?.sampleWarning) rows.push(['SampleWarning', stats.sampleWarning, ''])
  if (stats?.bucketQuality) {
    rows.push(['BucketQuality', 'normalized', stats.bucketQuality.normalized ?? 0])
    rows.push(['BucketQuality', 'unclear', stats.bucketQuality.unclear ?? 0])
  }
  if (stats?.topLocations) {
    stats.topLocations.forEach(item => rows.push(['Location', item.label, item.count]))
  }
  if (stats?.topRoles) {
    stats.topRoles.forEach(item => rows.push(['Role', item.label, item.count]))
  }
  if (stats?.topContactMethods) {
    stats.topContactMethods.forEach(item => rows.push(['ContactMethod', item.label, item.count]))
  }
  if (stats?.verdicts) {
    Object.entries(stats.verdicts).forEach(([label, count]) => rows.push(['Verdict', label, count]))
  }

  return {
    filename: `hireproof-trends-${date}.csv`,
    mimeType: 'text/csv',
    content: buildCsv(rows),
  }
}

function neutralizeCsvFormula(value) {
  const text = String(value ?? '')
  return /^[\s\u0000-\u001f\u007f]*[=+\-@]/.test(text) ? `'${text}` : text
}

function csvCell(value) {
  return `"${neutralizeCsvFormula(value).replace(/"/g, '""')}"`
}

function buildCsv(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\n')
}

export function buildReportCsvExport(report, now = new Date()) {
  const date = now.toISOString().slice(0, 10)
  const verdict = String(report?.verdict || 'report').toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  const rows = [['Section', 'Field', 'Value']]
  const claims = report?.extractedClaims && typeof report.extractedClaims === 'object' ? report.extractedClaims : {}

  rows.push(['Verdict', 'Verdict', report?.verdict || 'unknown'])
  rows.push(['Verdict', 'Risk Score', report?.riskScore ?? ''])
  rows.push(['Verdict', 'Confidence', report?.confidence || ''])
  rows.push(['Summary', 'Summary', report?.summary || ''])

  Object.entries(claims).forEach(([key, value]) => {
    rows.push(['Claim', key, value])
  })

  ;(Array.isArray(report?.redFlags) ? report.redFlags : []).forEach((flag, index) => {
    rows.push(['Red Flag', index + 1, flag])
  })

  ;(Array.isArray(report?.greenFlags) ? report.greenFlags : []).forEach((flag, index) => {
    rows.push(['Green Flag', index + 1, flag])
  })

  ;(Array.isArray(report?.evidence) ? report.evidence : []).forEach((item) => {
    const meta = [
      item?.id ? `id=${item.id}` : '',
      item?.trustLevel ? `trust=${item.trustLevel}` : '',
      typeof item?.matchConfidence === 'number' ? `match=${Math.round(item.matchConfidence * 100)}%` : '',
    ].filter(Boolean).join(' ')
    const detail = [item?.type ? `${item.type}:` : '', meta, item?.snippet || '', item?.url || ''].filter(Boolean).join(' ')
    rows.push(['Evidence', item?.source || 'Unknown source', detail])
  })

  ;(Array.isArray(report?.intelligence?.signals) ? report.intelligence.signals : []).forEach((signal) => {
    rows.push([
      'V2 Signal',
      signal?.label || signal?.id || 'Signal',
      `${signal?.direction || 'neutral'} ${signal?.weight ?? 0}: ${signal?.rationale || ''}`,
    ])
  })

  ;(Array.isArray(report?.intelligence?.scoreTrace) ? report.intelligence.scoreTrace : []).forEach((trace) => {
    rows.push([
      'Score Trace',
      trace?.step || 'Step',
      `${trace?.delta > 0 ? '+' : ''}${trace?.delta ?? 0} -> ${trace?.scoreAfter ?? ''}. ${trace?.reason || ''}`,
    ])
  })

  ;(Array.isArray(report?.nextSteps) ? report.nextSteps : []).forEach((step, index) => {
    rows.push(['Next Step', index + 1, step])
  })

  return {
    filename: `hireproof-report-${verdict}-${date}.csv`,
    mimeType: 'text/csv',
    content: buildCsv(rows),
  }
}
