import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimiterOptions {
  limit: number
  windowMs: number
}

interface RateLimitRecord {
  count: number
  timestamp: number
}

// In-memory store fallback for Hackathon demo purposes.
const store = new Map<string, RateLimitRecord>()

// Periodic cleanup to prevent unbounded memory growth
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MAX_STORE_SIZE = 10_000

let lastCleanup = Date.now()

function cleanupStale(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL && store.size < MAX_STORE_SIZE) return
  lastCleanup = now
  for (const [key, record] of store) {
    if (now - record.timestamp > windowMs * 2) {
      store.delete(key)
    }
  }
}

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

export async function checkRateLimit(identifier: string, options: RateLimiterOptions) {
  if (!identifier || typeof identifier !== 'string') {
    return { success: false, remaining: 0 }
  }

  // 1. Enterprise Distributed Protection (Upstash Redis)
  const redis = getRedis()
  if (redis) {
    try {
      const windowSeconds = Math.max(1, Math.floor(options.windowMs / 1000))
      const rl = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${windowSeconds} s` as any),
        ephemeralCache: new Map(),
      })
      
      const res = await rl.limit(identifier)
      if (!res.success) {
        const retryAfterMs = res.reset - Date.now()
        return { success: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) }
      }
      return { success: true, remaining: res.remaining }
    } catch (e) {
      console.warn("[Security] Upstash distributed limit failed, falling back to local memory.", e)
      // Fall through to in-memory to prevent complete denial of service if DB is transiently down
    }
  }

  // 2. Hackathon Local Fallback (In-Memory)

  const now = Date.now()
  cleanupStale(options.windowMs)

  const record = store.get(identifier)

  if (!record) {
    store.set(identifier, { count: 1, timestamp: now })
    return { success: true, remaining: options.limit - 1 }
  }

  // If the window has expired, reset the counter
  if (now - record.timestamp > options.windowMs) {
    store.set(identifier, { count: 1, timestamp: now })
    return { success: true, remaining: options.limit - 1 }
  }

  // If over the limit within the window
  if (record.count >= options.limit) {
    const retryAfterMs = options.windowMs - (now - record.timestamp)
    return { success: false, remaining: 0, retryAfterMs }
  }

  // Increment
  record.count += 1
  return { success: true, remaining: options.limit - record.count }
}
