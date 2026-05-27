import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

const PRIVATE_DIR_MODE = 0o700
const PRIVATE_FILE_MODE = 0o600

function historyHome(options = {}) {
  return options.configHome || process.env.HIREPROOF_CONFIG_HOME || path.join(os.homedir(), '.hireproof')
}

export function reportHistoryPath(options = {}) {
  return path.join(historyHome(options), 'reports.jsonl')
}

function compactList(values, limit = 5) {
  return Array.isArray(values) ? values.slice(0, limit).map(value => sanitizeText(value)) : []
}

function sanitizeText(value) {
  return String(value || '')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted email]')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[redacted url]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted phone]')
    .replace(/\b(passcode|code|otp|pin|token|secret)\s*[:#-]?\s*[A-Za-z0-9_-]{4,}\b/gi, '$1 [redacted code]')
}

function evidenceLabel(item) {
  return sanitizeText(item?.source || item?.type || 'Evidence item')
}

export function toReportSummary(report) {
  return {
    id: report?.id || `report_${randomUUID()}`,
    savedAt: new Date().toISOString(),
    verdict: report?.verdict || 'unknown',
    riskScore: Number(report?.riskScore ?? 0),
    confidence: report?.confidence || 'unknown',
    mode: report?.mode || 'unknown',
    summary: sanitizeText(report?.summary),
    company: sanitizeText(report?.extractedClaims?.company || 'Not specified'),
    role: sanitizeText(report?.extractedClaims?.role || 'Not specified'),
    redFlags: compactList(report?.redFlags, 5),
    greenFlags: compactList(report?.greenFlags, 5),
    nextSteps: compactList(report?.nextSteps, 5),
    evidence: compactList(report?.evidence?.map(evidenceLabel), 3),
  }
}

export async function saveReportSummary(report, options = {}) {
  const file = reportHistoryPath(options)
  const dir = path.dirname(file)
  await mkdir(dir, { recursive: true, mode: PRIVATE_DIR_MODE })
  await chmod(dir, PRIVATE_DIR_MODE)
  const summary = toReportSummary(report)
  await writeFile(file, `${JSON.stringify(summary)}\n`, { flag: 'a', mode: PRIVATE_FILE_MODE })
  await chmod(file, PRIVATE_FILE_MODE)
  return summary
}

export async function readReportSummaries(options = {}) {
  try {
    const raw = await readFile(reportHistoryPath(options), 'utf8')
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => JSON.parse(line))
      .reverse()
  } catch {
    return []
  }
}
