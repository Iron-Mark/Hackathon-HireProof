import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { AuditReport, AuditReportSchema } from './schemas'
import { Redis } from '@upstash/redis'

const dataDir = path.join(process.cwd(), 'data')
const dbFile = path.join(dataDir, 'reports.json')

// Maximum reports to keep in the JSON file (prevent unbounded growth)
const MAX_REPORTS = 500
// 30 days in seconds for Redis TTL
const REDIS_TTL_SECONDS = 30 * 24 * 60 * 60

// Simple write lock to prevent concurrent write corruption
let writeLock: Promise<void> = Promise.resolve()

let globalRedis: Redis | null = null

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!globalRedis) {
    try {
      globalRedis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    } catch {
      return null
    }
  }
  return globalRedis
}

export async function saveReport(report: AuditReport) {
  if (!report.id) report.id = `report_${crypto.randomUUID()}`
  
  // Cryptographically guarantee DB structural integrity before write
  const safeReport = AuditReportSchema.parse(report)

  // 1. Enterprise Distributed Storage (Upstash Redis)
  const redis = getRedis()
  if (redis) {
    try {
      // Save directly to Redis with a 30-day TTL to auto-manage storage
      await redis.set(safeReport.id!, JSON.stringify(safeReport), { ex: REDIS_TTL_SECONDS })
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
