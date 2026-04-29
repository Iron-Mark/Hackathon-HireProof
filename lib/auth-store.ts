import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { resolveTxt } from 'dns/promises'
import { Redis } from '@upstash/redis'
import {
  createApiKey,
  createSessionToken,
  hashApiKey,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from './auth-core.mjs'
import type { ApiKeyRecord } from './auth-core'

export interface UserAccount {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface UsageEvent {
  id: string
  ownerId: string
  apiKeyId: string
  endpoint: string
  status: number
  reportId?: string
  createdAt: string
}

export interface AuthenticatedApiKey {
  ownerId: string
  apiKeyId: string
  key: ApiKeyRecord
  user: PublicUser | null
  isFallback: boolean
}

export interface VerifiedDomainRecord {
  id: string
  ownerId: string
  domain: string
  verificationToken: string
  publicToken: string
  status: 'pending' | 'verified'
  createdAt: string
  verifiedAt: string | null
  lastCheckedAt: string | null
}

const dataDir = path.join(process.cwd(), 'data')
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
const MISSING_USER_DUMMY_PASSWORD_HASH =
  'scrypt:hireproof_dummy_salt_2026:ec273b0a4be18a6e793b8d42789329e674ea569631e1bd642b7a199b6c93090ddffa2e0d9d42b9574d75376771b0b9755d7cdfa2e3a2cfbf4673ade268a57402'

let globalRedis: Redis | null = null
let writeLock: Promise<void> = Promise.resolve()

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  if (!globalRedis) {
    globalRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return globalRedis
}

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.AGENT_API_KEY || 'hireproof_dev_session_secret'
}

async function readJson<T>(name: string, fallback: T): Promise<T> {
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

async function writeJson<T>(name: string, value: T) {
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

function publicUser(user: UserAccount): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  }
}

export async function createUser(email: string, password: string, name?: string) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.')
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')

  const users = await readJson<Record<string, UserAccount>>('users', {})
  const existing = Object.values(users).find((user) => user.email === normalizedEmail)
  if (existing) throw new Error('An account with this email already exists.')

  const now = new Date().toISOString()
  const user: UserAccount = {
    id: `user_${crypto.randomUUID()}`,
    email: normalizedEmail,
    name: (name || normalizedEmail.split('@')[0]).trim().slice(0, 80),
    passwordHash: await hashPassword(password),
    createdAt: now,
  }
  users[user.id] = user
  await writeJson('users', users)
  return publicUser(user)
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const users = await readJson<Record<string, UserAccount>>('users', {})
  const user = Object.values(users).find((item) => item.email === normalizedEmail)
  
  if (!user) {
    // Constant time dummy verification to prevent timing attacks on email discovery
    await verifyPassword(password, MISSING_USER_DUMMY_PASSWORD_HASH)
    return null
  }
  
  if (!(await verifyPassword(password, user.passwordHash))) return null
  return publicUser(user)
}

export async function getUserById(id: string) {
  const users = await readJson<Record<string, UserAccount>>('users', {})
  const user = users[id]
  return user ? publicUser(user) : null
}

export function makeSessionToken(userId: string) {
  return createSessionToken(userId, sessionSecret(), SESSION_TTL_SECONDS)
}

export async function getUserFromSessionToken(token?: string) {
  if (!token || typeof token !== 'string') return null
  const parsed = verifySessionToken(token, sessionSecret())
  if (!parsed?.userId) return null
  
  // Hardened: Check if session has expired or is malformed
  const now = Math.floor(Date.now() / 1000)
  if (parsed.exp && now > parsed.exp) {
    console.warn(`[Auth] Session expired for user: ${parsed.userId}`)
    return null
  }
  
  return getUserById(parsed.userId)
}

export async function listApiKeys(ownerId: string) {
  const keys = await readJson<Record<string, ApiKeyRecord>>('api-keys', {})
  return Object.values(keys)
    .filter((key) => key.ownerId === ownerId && !key.revokedAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function issueApiKey(ownerId: string, name: string) {
  const keys = await readJson<Record<string, ApiKeyRecord>>('api-keys', {})
  const generated = createApiKey(name, ownerId)
  keys[generated.record.id] = generated.record
  await writeJson('api-keys', keys)
  return generated
}

export async function revokeApiKey(ownerId: string, keyId: string) {
  const keys = await readJson<Record<string, ApiKeyRecord>>('api-keys', {})
  const key = keys[keyId]
  if (!key || key.ownerId !== ownerId) return false
  keys[keyId] = { ...key, revokedAt: new Date().toISOString() }
  await writeJson('api-keys', keys)
  return true
}

export async function authenticateApiKey(rawKey: string): Promise<AuthenticatedApiKey | null> {
  const fallbackKey = process.env.AGENT_API_KEY || 'hireproof_agent_demo_key'
  if (rawKey === fallbackKey) {
    return {
      ownerId: 'demo',
      apiKeyId: 'env_demo_key',
      key: {
        id: 'env_demo_key',
        ownerId: 'demo',
        name: 'Environment Demo Key',
        keyHash: hashApiKey(rawKey),
        lastFour: rawKey.slice(-4),
        createdAt: new Date(0).toISOString(),
        lastUsedAt: new Date().toISOString(),
        revokedAt: null,
      },
      user: null,
      isFallback: true,
    }
  }

  const keyHash = hashApiKey(rawKey)
  const keys = await readJson<Record<string, ApiKeyRecord>>('api-keys', {})
  const found = Object.values(keys).find((key) => key.keyHash === keyHash && !key.revokedAt)
  if (!found) return null

  keys[found.id] = { ...found, lastUsedAt: new Date().toISOString() }
  await writeJson('api-keys', keys)
  return {
    ownerId: found.ownerId,
    apiKeyId: found.id,
    key: keys[found.id],
    user: await getUserById(found.ownerId),
    isFallback: false,
  }
}

export async function recordUsage(event: Omit<UsageEvent, 'id' | 'createdAt'>) {
  const usage = await readJson<UsageEvent[]>('usage', [])
  usage.unshift({
    ...event,
    id: `usage_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  })
  await writeJson('usage', usage.slice(0, 2000))
}

export async function getUsageSummary(ownerId: string) {
  const usage = await readJson<UsageEvent[]>('usage', [])
  const mine = usage.filter((event) => event.ownerId === ownerId)
  const successful = mine.filter((event) => event.status >= 200 && event.status < 400).length
  return {
    totalRequests: mine.length,
    successfulRequests: successful,
    failedRequests: mine.length - successful,
    recent: mine.slice(0, 20),
  }
}

export function normalizeDomain(input: string) {
  const raw = input.trim().toLowerCase()
  if (!raw) throw new Error('Domain is required.')

  const hostname = raw.includes('://') ? new URL(raw).hostname : raw.split('/')[0]
  const normalized = hostname.replace(/^www\./, '').replace(/\.$/, '')

  if (
    !/^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(normalized) ||
    normalized.includes('..') ||
    normalized.endsWith('.local')
  ) {
    throw new Error('Enter a valid public domain.')
  }

  return normalized
}

export async function listVerifiedDomains(ownerId: string) {
  const domains = await readJson<Record<string, VerifiedDomainRecord>>('verified-domains', {})
  return Object.values(domains)
    .filter((domain) => domain.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createVerifiedDomain(ownerId: string, domainInput: string) {
  const domain = normalizeDomain(domainInput)
  const domains = await readJson<Record<string, VerifiedDomainRecord>>('verified-domains', {})
  const existing = Object.values(domains).find((record) => record.ownerId === ownerId && record.domain === domain)
  if (existing) return existing

  const now = new Date().toISOString()
  const record: VerifiedDomainRecord = {
    id: `domain_${crypto.randomUUID()}`,
    ownerId,
    domain,
    verificationToken: `hireproof-verify=${crypto.randomBytes(18).toString('hex')}`,
    publicToken: crypto.randomBytes(24).toString('base64url'),
    status: 'pending',
    createdAt: now,
    verifiedAt: null,
    lastCheckedAt: null,
  }

  domains[record.id] = record
  await writeJson('verified-domains', domains)
  return record
}

export async function getVerifiedDomainByToken(domainInput: string, publicToken: string) {
  let domain: string
  try {
    domain = normalizeDomain(domainInput)
  } catch {
    return null
  }

  const domains = await readJson<Record<string, VerifiedDomainRecord>>('verified-domains', {})
  return Object.values(domains).find((record) => record.domain === domain && record.publicToken === publicToken) || null
}

export async function getVerifiedDomainForOwner(ownerId: string, domainInput: string) {
  const domain = normalizeDomain(domainInput)
  const domains = await readJson<Record<string, VerifiedDomainRecord>>('verified-domains', {})
  return Object.values(domains).find((record) => record.ownerId === ownerId && record.domain === domain) || null
}

export async function verifyDomainOwnership(ownerId: string, domainInput: string) {
  const domain = normalizeDomain(domainInput)
  const domains = await readJson<Record<string, VerifiedDomainRecord>>('verified-domains', {})
  const record = Object.values(domains).find((item) => item.ownerId === ownerId && item.domain === domain)
  if (!record) throw new Error('Domain has not been added to this account.')

  const txtRecords = await resolveTxt(domain).catch(() => [])
  const flattened = txtRecords.map((entry) => entry.join(''))
  const verified = flattened.includes(record.verificationToken)
  const now = new Date().toISOString()

  domains[record.id] = {
    ...record,
    status: verified ? 'verified' : record.status,
    verifiedAt: verified ? now : record.verifiedAt,
    lastCheckedAt: now,
  }
  await writeJson('verified-domains', domains)

  return {
    record: domains[record.id],
    verified,
    expectedTxt: record.verificationToken,
    checkedRecords: flattened,
  }
}
