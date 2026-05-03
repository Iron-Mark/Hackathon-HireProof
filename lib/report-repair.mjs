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

export function repairAuditReportForDisplay(report) {
  const next = structuredClone(report)
  const originalClaims = next?.extractedClaims || {}
  const repairedClaims = recoverObviousClaims(buildRepairInput(next), originalClaims)
  const changedFields = []

  next.extractedClaims = {
    ...originalClaims,
    ...repairedClaims,
  }

  for (const key of Object.keys(next.extractedClaims)) {
    if (next.extractedClaims[key] !== originalClaims[key]) {
      changedFields.push(`extractedClaims.${key}`)
    }
  }

  applyApplyPathStatus(next)

  return {
    report: next,
    changed: changedFields.length > 0,
    changedFields,
  }
}
