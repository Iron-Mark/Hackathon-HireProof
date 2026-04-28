import fs from 'fs/promises'
import path from 'path'
import { AuditReport } from './schemas'

const dataDir = path.join(process.cwd(), 'data')
const dbFile = path.join(dataDir, 'reports.json')

// Maximum reports to keep in the JSON file (prevent unbounded growth)
const MAX_REPORTS = 500

// Simple write lock to prevent concurrent write corruption
let writeLock: Promise<void> = Promise.resolve()

export async function saveReport(report: AuditReport) {
  // Queue writes to prevent race conditions
  writeLock = writeLock.then(async () => {
    try {
      await fs.mkdir(dataDir, { recursive: true })
      let reports: Record<string, AuditReport> = {}
      try {
        const data = await fs.readFile(dbFile, 'utf-8')
        reports = JSON.parse(data)
        if (typeof reports !== 'object' || reports === null || Array.isArray(reports)) {
          reports = {} // Corrupted file, reset
        }
      } catch {
        // file doesn't exist or is corrupted
      }

      if (!report.id) report.id = `report_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

      // Evict oldest reports if over limit
      const keys = Object.keys(reports)
      if (keys.length >= MAX_REPORTS) {
        const sorted = keys.sort((a, b) => {
          const tA = reports[a]?.timestamp || ''
          const tB = reports[b]?.timestamp || ''
          return tA.localeCompare(tB)
        })
        const toRemove = sorted.slice(0, keys.length - MAX_REPORTS + 1)
        for (const key of toRemove) delete reports[key]
      }

      reports[report.id] = report

      // Atomic write: write to temp file then rename to prevent partial writes
      const tmpFile = dbFile + '.tmp'
      await fs.writeFile(tmpFile, JSON.stringify(reports, null, 2))
      await fs.rename(tmpFile, dbFile)
    } catch (e) {
      console.error('Failed to save report to db:', e)
    }
  })
  await writeLock
}

export async function getReport(id: string): Promise<AuditReport | null> {
  if (!id || typeof id !== 'string') return null
  // Guard against path traversal
  if (id.includes('/') || id.includes('\\') || id.includes('..')) return null

  try {
    const data = await fs.readFile(dbFile, 'utf-8')
    const reports = JSON.parse(data)
    if (typeof reports !== 'object' || reports === null) return null
    return reports[id] || null
  } catch {
    return null
  }
}
