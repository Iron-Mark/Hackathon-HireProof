import fs from 'fs/promises'
import path from 'path'
import { AuditReport, AuditReportSchema } from './schemas'
import { Redis } from '@upstash/redis'
import { buildPublicReportTrends } from './public-intelligence-reports.mjs'
export { createPublicReportId, isPublicReportId, type PublicReportIdPrefix } from './public-report-id'
import { createPublicReportId } from './public-report-id'

const dataDir = path.join(process.cwd(), 'data')
const dbFile = path.join(dataDir, 'reports.json')
const redisIndexKey = 'hireproof:report-index'

// Maximum reports to include in list-oriented indexes; report permalinks remain retrievable by id.
const MAX_REPORT_INDEX_ENTRIES = 500
// 30 days in seconds for Redis TTL
const REDIS_TTL_SECONDS = 30 * 24 * 60 * 60

// Simple write lock to prevent concurrent write corruption
let writeLock: Promise<void> = Promise.resolve()

let globalRedis: Redis | null = null

function parseRedisIndex(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((id): id is string => typeof id === 'string')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  if (!globalRedis) {
    try {
      globalRedis = new Redis({
        url,
        token,
      })
    } catch {
      return null
    }
  }
  return globalRedis
}

export async function saveReport(report: AuditReport) {
  if (!report.id) report.id = createPublicReportId('report')
  
  // Cryptographically guarantee DB structural integrity before write
  const safeReport = AuditReportSchema.parse(report)

  // 1. Enterprise Distributed Storage (Upstash Redis)
  const redis = getRedis()
  if (redis) {
    try {
      // Save directly to Redis with a 30-day TTL to auto-manage storage
      await redis.set(safeReport.id!, JSON.stringify(safeReport), { ex: REDIS_TTL_SECONDS })
      const index = parseRedisIndex(await redis.get(redisIndexKey))
      const nextIndex = [safeReport.id!, ...index.filter((id) => id !== safeReport.id)].slice(0, MAX_REPORT_INDEX_ENTRIES)
      await redis.set(redisIndexKey, nextIndex)
      return // Successfully saved to Redis, skip local FS
    } catch (e) {
      console.warn("[Database] Upstash save failed, falling back to local FS.", e)
    }
  }

  // 2. Hackathon Local Fallback (Local FS)
  // Queue writes to prevent race conditions
  writeLock = writeLock.then(async () => {
    try {
      await fs.mkdir(dataDir, { recursive: true })
      let reports: Record<string, AuditReport> = Object.create(null)
      try {
        const data = await fs.readFile(dbFile, 'utf-8')
        reports = JSON.parse(data)
        if (typeof reports !== 'object' || reports === null || Array.isArray(reports)) {
          reports = Object.create(null) // Corrupted file, reset
        }
      } catch {
        // file doesn't exist or is corrupted
      }

      reports[safeReport.id!] = safeReport

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

export async function listReports(limit = 100): Promise<AuditReport[]> {
  const redis = getRedis()
  if (redis) {
    try {
      const index = parseRedisIndex(await redis.get(redisIndexKey))
      const reports = await Promise.all(index.slice(0, limit).map((id) => getReport(id)))
      return reports.filter((report): report is AuditReport => Boolean(report))
    } catch (e) {
      console.warn("[Database] Upstash list failed, falling back to local FS.", e)
    }
  }

  try {
    const data = await fs.readFile(dbFile, 'utf-8')
    const reports = JSON.parse(data)
    if (typeof reports !== 'object' || reports === null) return []
    return Object.values(reports)
      .map((report) => AuditReportSchema.safeParse(report))
      .filter((parsed) => parsed.success)
      .map((parsed) => parsed.data)
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, limit)
  } catch {
    return []
  }
}

export async function getReportTrends() {
  return buildPublicReportTrends(await listReports(MAX_REPORT_INDEX_ENTRIES))
}

export async function getReport(id: string): Promise<AuditReport | null> {
  if (!id || typeof id !== 'string') return null
  // Guard against path traversal
  if (id.includes('/') || id.includes('\\') || id.includes('..')) return null

  // 1. Enterprise Distributed Storage (Upstash Redis)
  const redis = getRedis()
  if (redis) {
    try {
      const data = await redis.get(id)
      if (data) {
        // Upstash parses valid JSON automatically, or returns string.
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        return AuditReportSchema.parse(parsed)
      }
      return null
    } catch (e) {
      console.warn("[Database] Upstash fetch failed, falling back to local FS.", e)
    }
  }

  // 2. Hackathon Local Fallback (Local FS)
  try {
    const data = await fs.readFile(dbFile, 'utf-8')
    const reports = JSON.parse(data)
    if (typeof reports !== 'object' || reports === null) return null
    // Ensure we don't return properties from the object prototype
    if (id === '__proto__' || id === 'constructor') return null
    return reports[id] || null
  } catch {
    return null
  }
}
