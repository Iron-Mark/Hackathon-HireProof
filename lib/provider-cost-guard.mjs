import { Redis } from '@upstash/redis'

const DEFAULT_DAILY_LIMITS = {
  model: 50,
  serpapi: 100,
  googleVision: 50,
  safeBrowsing: 500,
}

const ENV_LIMITS = {
  model: 'HIREPROOF_COST_GUARD_MODEL_DAILY_LIMIT',
  serpapi: 'HIREPROOF_COST_GUARD_SERPAPI_DAILY_LIMIT',
  googleVision: 'HIREPROOF_COST_GUARD_GOOGLE_VISION_DAILY_LIMIT',
  safeBrowsing: 'HIREPROOF_COST_GUARD_SAFE_BROWSING_DAILY_LIMIT',
}

const localCounters = new Map()
let globalRedis = null

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  if (!globalRedis) {
    try {
      globalRedis = new Redis({ url, token })
    } catch {
      return null
    }
  }
  return globalRedis
}

function dailyLimit(provider) {
  const value = Number(process.env[ENV_LIMITS[provider]] || DEFAULT_DAILY_LIMITS[provider])
  if (!Number.isFinite(value)) return DEFAULT_DAILY_LIMITS[provider]
  return Math.floor(value)
}

function dayKey(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

function secondsUntilNextUtcDay(now = new Date()) {
  const next = new Date(now)
  next.setUTCHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((next.getTime() - now.getTime()) / 1000))
}

function keyFor(provider) {
  return `hireproof:provider-cost:${provider}:${dayKey()}`
}

function message(provider, limit) {
  return `Daily ${provider} platform provider limit reached (${limit}/day). Use BYOK credentials or try again after the daily reset.`
}

export async function checkProviderCostGuard(provider) {
  const limit = dailyLimit(provider)
  const retryAfterSec = secondsUntilNextUtcDay()

  if (limit < 0) {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      status: { status: 'ok', message: `Daily ${provider} platform provider guard is unlimited.` },
    }
  }

  if (limit === 0) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
      status: { status: 'throttled', retryAfterSec, message: message(provider, limit) },
    }
  }

  const key = keyFor(provider)
  const redis = getRedis()

  if (redis) {
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, retryAfterSec)
      if (count > limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSec,
          status: { status: 'throttled', retryAfterSec, message: message(provider, limit) },
        }
      }
      return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        status: { status: 'ok', message: `Daily ${provider} platform provider guard passed.` },
      }
    } catch {
      // Fall through to local counters.
    }
  }

  const count = (localCounters.get(key) || 0) + 1
  localCounters.set(key, count)

  if (count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
      status: { status: 'throttled', retryAfterSec, message: message(provider, limit) },
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
    status: { status: 'ok', message: `Daily ${provider} platform provider guard passed.` },
  }
}

export function getProviderCostGuardSnapshot() {
  return {
    limits: {
      model: dailyLimit('model'),
      serpapi: dailyLimit('serpapi'),
      googleVision: dailyLimit('googleVision'),
      safeBrowsing: dailyLimit('safeBrowsing'),
    },
    flags: {
      publicLiveAuditEnabled: process.env.PUBLIC_LIVE_AUDIT_ENABLED !== 'false',
      publicGoogleVisionOcrEnabled: process.env.PUBLIC_GOOGLE_VISION_OCR_ENABLED !== 'false',
      publicTrendsExternalSignalsEnabled: process.env.PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED !== 'false',
      requireByokForLiveApi: process.env.REQUIRE_BYOK_FOR_LIVE_API === 'true',
    },
    resetAt: new Date(Date.now() + secondsUntilNextUtcDay() * 1000).toISOString(),
  }
}

export function clearProviderCostGuardsForTests() {
  localCounters.clear()
}
