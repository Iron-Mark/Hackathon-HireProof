import { recoverObviousClaims } from './claim-extraction.mjs'

function buildEvidenceText(report) {
  return (report?.evidence || [])
    .map((item) => [item?.source, item?.type, item?.snippet, item?.url].filter(Boolean).join('\n'))
    .filter(Boolean)
    .join('\n\n')
}

function primaryEvidenceUrl(report) {
  return (report?.evidence || []).find((item) => /^https?:\/\//i.test(item?.url || ''))?.url || ''
}

function buildRepairInput(report) {
  return {
    text: buildEvidenceText(report),
    url: primaryEvidenceUrl(report),
    location: report?.extractedClaims?.location,
  }
}

function applyApplyPathStatus(report) {
  const applicationPath = report?.extractedClaims?.applicationPath || ''
  if (!report?.intelligence?.applyPath || !report?.intelligence?.coverage) return

  if (/official|careers/i.test(applicationPath)) {
    report.intelligence.applyPath.status = 'official'
    report.intelligence.coverage.applyPath = 'official'
  } else if (/linkedin|indeed|jobstreet|greenhouse|lever|ashby|smartrecruiters|workday/i.test(applicationPath)) {
    report.intelligence.applyPath.status = 'trusted-board'
    report.intelligence.coverage.applyPath = 'trusted-board'
  }
}

const TRUSTED_JOB_PAGE_PATTERN = /\b(linkedin|indeed|jobstreet|greenhouse|lever|ashby|smartrecruiters|workday|myworkdayjobs)\b/i

function hasTrustedJobPageEvidence(report) {
  return (report?.evidence || []).some((item) => {
    const text = [item?.source, item?.type, item?.snippet, item?.url].filter(Boolean).join(' ')
    return item?.sourceQuality === 'reputable' || TRUSTED_JOB_PAGE_PATTERN.test(text)
  })
}

function repairEvidenceCoverageCopy(report, changedFields) {
  if (!hasTrustedJobPageEvidence(report)) return

  const originalRedFlags = Array.isArray(report.redFlags) ? report.redFlags : []
  const nextRedFlags = originalRedFlags.filter(flag => !/no supporting evidence/i.test(String(flag || '')))
  if (nextRedFlags.length !== originalRedFlags.length) {
    report.redFlags = nextRedFlags
    changedFields.push('redFlags')
  }

  if (/no supporting evidence/i.test(report.summary || '')) {
    report.summary = String(report.summary || '').replace(
      /No supporting evidence(?: found| was found)?(?: from live search)?\.?/gi,
      'Limited independent evidence beyond the trusted job page.',
    )
    changedFields.push('summary')
  } else if (nextRedFlags.length !== originalRedFlags.length && report.summary) {
    report.summary = `${report.summary} Limited independent evidence beyond the trusted job page.`
    changedFields.push('summary')
  }
}

export function repairAuditReportForDisplay(report) {
  const next = structuredClone(report)
  const originalClaims = next?.extractedClaims || {}
  const repairedClaims = recoverObviousClaims(buildRepairInput(next), originalClaims)
  const changedFields = []

  next.extractedClaims = {
    ...repairedClaims,
  }

  for (const key of new Set([...Object.keys(originalClaims), ...Object.keys(next.extractedClaims)])) {
    if (next.extractedClaims[key] !== originalClaims[key]) {
      changedFields.push(`extractedClaims.${key}`)
    }
  }

  applyApplyPathStatus(next)
  repairEvidenceCoverageCopy(next, changedFields)

  return {
    report: next,
    changed: changedFields.length > 0,
    changedFields,
  }
}
