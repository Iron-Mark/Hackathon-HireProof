export interface RateLimiterOptions {
  limit: number
  windowMs: number
}

interface RateLimitRecord {
  count: number
  timestamp: number
}

// In-memory store for Hackathon demo purposes.
// For production on Vercel Edge/Serverless, replace with @upstash/ratelimit and Vercel KV.
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

export function checkRateLimit(identifier: string, options: RateLimiterOptions) {
  if (!identifier || typeof identifier !== 'string') {
    return { success: false, remaining: 0 }
  }

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
