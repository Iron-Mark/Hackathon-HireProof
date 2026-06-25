import fs from 'fs/promises'
import path from 'path'
import { Redis } from '@upstash/redis'

const dataDir = path.join(process.cwd(), 'data')
let globalRedis: Redis | null = null
let writeLock: Promise<void> = Promise.resolve()

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

export async function readJson<T>(name: string, fallback: T): Promise<T> {
  const redis = getRedis()
  if (redis) {
    try {
      const value = await redis.get(`hireproof:${name}`)
      if (value) return (typeof value === 'string' ? JSON.parse(value) : value) as T
    } catch {
      // Fall through to local fallback.
    }
  }

  try {
    const raw = await fs.readFile(path.join(dataDir, `${name}.json`), 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJson<T>(name: string, value: T) {
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(`hireproof:${name}`, JSON.stringify(value))
      return
    } catch {
      // Fall through to local fallback.
    }
  }

  writeLock = writeLock.then(async () => {
    await fs.mkdir(dataDir, { recursive: true })
    const file = path.join(dataDir, `${name}.json`)
    const tmp = `${file}.tmp`
    await fs.writeFile(tmp, JSON.stringify(value, null, 2))
    await fs.rename(tmp, file)
  })
  await writeLock
}
