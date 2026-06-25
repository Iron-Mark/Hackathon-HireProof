import crypto from 'crypto'
import { resolveTxt } from 'dns/promises'
import {
  createApiKey,
  createSessionToken,
  hashApiKey,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from './auth-core.mjs'
import type { ApiKeyRecord } from './auth-core'
import { AUTH_SESSION_TTL_SECONDS } from './auth-session-cookie'
import { decryptSecret, encryptSecret, redactSecret } from './byok-crypto.mjs'
import { isDemoAccountEmail } from './demo-account'
import { readJson, writeJson } from './json-record-store'

interface EncryptedSecretPayload {
  algorithm: 'aes-256-gcm'
  iv: string
  ciphertext: string
  tag: string
}

export interface UserAccount {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

interface DemoAccountOptions {
  allowDemoAccount?: boolean
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

export interface PilotRequestRecord {
  id: string
  name: string
  email: string
  organization: string
  pilotType: string
  workflow: string
  sourcePath: string
  status: 'new' | 'contacted' | 'closed'
  createdAt: string
}

export interface ProductEventRecord {
  id: string
  eventName: string
  path: string
  metadata: Record<string, string>
  createdAt: string
}

export type PilotRequestStatus = PilotRequestRecord['status']

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

export type ProviderCredentialKind = 'openai' | 'serpapi'

export interface ProviderCredentialRecord {
  id: string
  ownerId: string
  provider: ProviderCredentialKind
  encryptedSecret: EncryptedSecretPayload
  lastFour: string
  createdAt: string
  updatedAt: string
  verifiedAt: string | null
  revokedAt: string | null
}

export interface RedactedProviderCredential {
  provider: ProviderCredentialKind
  lastFour: string
  createdAt: string
  updatedAt: string
  verifiedAt: string | null
}

export interface OwnerProviderCredentials {
  modelProviderKey?: string
  serpapiKey?: string
}

const SECRET_MIN_LENGTH = 32
const SECRET_MIN_DISTINCT_CHARS = 8
const MISSING_USER_DUMMY_PASSWORD_HASH =
  'scrypt:hireproof_dummy_salt_2026:ec273b0a4be18a6e793b8d42789329e674ea569631e1bd642b7a199b6c93090ddffa2e0d9d42b9574d75376771b0b9755d7cdfa2e3a2cfbf4673ade268a57402'
const PUBLIC_PLACEHOLDER_SECRETS = new Set([
  'paste_private_agent_api_key_here',
  'paste_generated_agent_api_key_here',
  'paste_generated_private_hex_key_here',
  '<paste generated 32-byte hex>',
  'paste_generated_session_secret_here',
  'paste_generated_byok_encryption_key_here',
  'generated-random-hex',
  'replace_with_private_random_key',
  'my_super_secret_key_here',
  'your_api_key',
  'your_secret_api_key',
  'changeme',
  'change-me',
  'secret',
  'password',
  'hireproof_dev_session_secret',
  'hireproof_dev_byok_encryption_secret',
])

function isWeakSharedSecret(value: string) {
  const secret = value.trim()
  if (!secret) return true
  if (PUBLIC_PLACEHOLDER_SECRETS.has(secret.toLowerCase())) return true
  if (secret.length < SECRET_MIN_LENGTH) return true
  return new Set(secret).size < SECRET_MIN_DISTINCT_CHARS
}

function requireStrongSharedSecret(value: string, name: string) {
  if (isWeakSharedSecret(value)) {
    throw new Error(`${name} must be a private high-entropy value of at least ${SECRET_MIN_LENGTH} characters.`)
  }
  return value
}

function timingSafeStringEqual(left: string, right: string) {
  const leftDigest = crypto.createHash('sha256').update(left).digest()
  const rightDigest = crypto.createHash('sha256').update(right).digest()
  return crypto.timingSafeEqual(leftDigest, rightDigest)
}

function sessionSecret() {
  const configured = process.env.SESSION_SECRET?.trim()
  if (configured) return requireStrongSharedSecret(configured, 'SESSION_SECRET')
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is required for session authentication.')
  return process.env.AGENT_API_KEY || 'hireproof_dev_session_secret'
}

function byokEncryptionSecret() {
  const configured = process.env.BYOK_ENCRYPTION_KEY?.trim()
  if (configured) return requireStrongSharedSecret(configured, 'BYOK_ENCRYPTION_KEY')
  if (process.env.NODE_ENV === 'production') throw new Error('BYOK_ENCRYPTION_KEY is required for hosted credential storage.')
  const fallback = process.env.SESSION_SECRET?.trim() || process.env.AGENT_API_KEY?.trim()
  if (fallback && !isWeakSharedSecret(fallback)) return fallback
  return 'hireproof_dev_byok_encryption_secret'
}

function normalizeProvider(provider: string): ProviderCredentialKind {
  if (provider === 'openai' || provider === 'serpapi') return provider
  if (provider === 'serp') return 'serpapi'
  throw new Error('Unsupported provider.')
}

function redactProviderCredential(record: ProviderCredentialRecord): RedactedProviderCredential {
  return {
    provider: record.provider,
    lastFour: record.lastFour,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    verifiedAt: record.verifiedAt,
  }
}

function publicUser(user: UserAccount): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  }
}

export async function createUser(email: string, password: string, name?: string, options: DemoAccountOptions = {}) {
  const normalizedEmail = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.')
  if (isDemoAccountEmail(normalizedEmail) && !options.allowDemoAccount) throw new Error('The shared demo account is reserved.')
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

export async function authenticateUser(email: string, password: string, options: DemoAccountOptions = {}) {
  const normalizedEmail = email.trim().toLowerCase()
  const users = await readJson<Record<string, UserAccount>>('users', {})
  const user = Object.values(users).find((item) => item.email === normalizedEmail)
  
  if (!user) {
    // Constant time dummy verification to prevent timing attacks on email discovery
    await verifyPassword(password, MISSING_USER_DUMMY_PASSWORD_HASH)
    return null
  }
  
  if (!(await verifyPassword(password, user.passwordHash))) return null
  if (isDemoAccountEmail(normalizedEmail) && !options.allowDemoAccount) return null
  return publicUser(user)
}

function configuredOperatorEmails() {
  return new Set(
    [
      process.env.HIREPROOF_ADMIN_EMAILS,
      process.env.HIREPROOF_ANALYTICS_OPERATOR_EMAILS,
      process.env.HIREPROOF_PILOT_ADMIN_EMAILS,
      process.env.HIREPROOF_REPAIR_OPERATOR_EMAILS,
      process.env.HIREPROOF_CURSOR_OPERATOR_EMAILS,
    ]
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => value.split(','))
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isOperatorUser(user?: Pick<PublicUser, 'email'> | null) {
  const email = String(user?.email || '').trim().toLowerCase()
  return Boolean(email && configuredOperatorEmails().has(email))
}

export async function getUserById(id: string) {
  const users = await readJson<Record<string, UserAccount>>('users', {})
  const user = users[id]
  return user ? publicUser(user) : null
}

export function makeSessionToken(userId: string, ttlSeconds = AUTH_SESSION_TTL_SECONDS) {
  return createSessionToken(userId, sessionSecret(), ttlSeconds)
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

export const PUBLIC_DEMO_API_KEY = 'hireproof_agent_demo_key'

export function isPublicDemoApiKey(rawKey?: string | null) {
  return rawKey === PUBLIC_DEMO_API_KEY
}

function getFallbackApiKey() {
  const configuredKey = process.env.AGENT_API_KEY?.trim()
  if (configuredKey && configuredKey !== PUBLIC_DEMO_API_KEY && !isWeakSharedSecret(configuredKey)) return configuredKey
  return null
}

function storedApiKeyHashMatches(key: ApiKeyRecord, keyHash: string) {
  return key.keyHash.length === keyHash.length && timingSafeStringEqual(key.keyHash, keyHash)
}

export async function authenticateApiKey(rawKey: string): Promise<AuthenticatedApiKey | null> {
  const fallbackKey = getFallbackApiKey()
  if (fallbackKey && timingSafeStringEqual(rawKey, fallbackKey)) {
    return {
      ownerId: 'env',
      apiKeyId: 'env_api_key',
      key: {
        id: 'env_api_key',
        ownerId: 'env',
        name: 'Environment API Key',
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
  const found = Object.values(keys).find((key) => storedApiKeyHashMatches(key, keyHash) && !key.revokedAt)
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

function cleanText(value: unknown, maxLength: number) {
  return String(value || '')
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function cleanLongText(value: unknown, maxLength: number) {
  return String(value || '')
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, maxLength)
}

function isValidEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)
}

export async function createPilotRequest(input: {
  name: unknown
  email: unknown
  organization?: unknown
  pilotType?: unknown
  workflow: unknown
  sourcePath?: unknown
}) {
  const name = cleanText(input.name, 120)
  const email = cleanText(input.email, 160).toLowerCase()
  const organization = cleanText(input.organization, 160)
  const pilotType = cleanText(input.pilotType || 'General pilot', 80)
  const workflow = cleanLongText(input.workflow, 2000)
  const sourcePath = cleanText(input.sourcePath || '/pilot', 200)

  if (!name) throw new Error('Name is required.')
  if (!isValidEmail(email)) throw new Error('Enter a valid email address.')
  if (!workflow || workflow.length < 20) throw new Error('Describe the workflow to validate.')

  const requests = await readJson<PilotRequestRecord[]>('pilot-requests', [])
  const now = new Date().toISOString()
  const record: PilotRequestRecord = {
    id: `pilot_${crypto.randomUUID()}`,
    name,
    email,
    organization,
    pilotType,
    workflow,
    sourcePath,
    status: 'new',
    createdAt: now,
  }
  requests.unshift(record)
  await writeJson('pilot-requests', requests.slice(0, 1000))
  return record
}

export async function listPilotRequests() {
  return readJson<PilotRequestRecord[]>('pilot-requests', [])
}

export async function updatePilotRequestStatus(id: unknown, status: unknown) {
  const requestId = cleanText(id, 120)
  const nextStatus = cleanText(status, 40) as PilotRequestStatus
  if (!requestId) throw new Error('Pilot request id is required.')
  if (!['new', 'contacted', 'closed'].includes(nextStatus)) throw new Error('Unsupported pilot request status.')

  const requests = await readJson<PilotRequestRecord[]>('pilot-requests', [])
  const index = requests.findIndex((request) => request.id === requestId)
  if (index === -1) throw new Error('Pilot request was not found.')

  requests[index] = { ...requests[index], status: nextStatus }
  await writeJson('pilot-requests', requests)
  return requests[index]
}

function csvCell(value: unknown) {
  const text = String(value ?? '')
  const safeText = /^[\s\u0000-\u001f\u007f]*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

export function buildPilotRequestsCsv(requests: PilotRequestRecord[]) {
  const header = ['createdAt', 'name', 'email', 'organization', 'pilotType', 'workflow', 'sourcePath', 'status']
  const rows = requests.map((request) => [
    request.createdAt,
    request.name,
    request.email,
    request.organization,
    request.pilotType,
    request.workflow,
    request.sourcePath,
    request.status,
  ])

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

export function buildProductEventsCsv(events: ProductEventRecord[]) {
  const header = ['createdAt', 'eventName', 'path', 'metadata']
  const rows = events.map((event) => [
    event.createdAt,
    event.eventName,
    event.path,
    JSON.stringify(event.metadata),
  ])

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
}

export async function recordProductEvent(input: {
  eventName: unknown
  path?: unknown
  metadata?: unknown
}) {
  const eventName = cleanText(input.eventName, 80)
    .toLowerCase()
    .replace(/[^a-z0-9_:-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  if (!eventName) throw new Error('Event name is required.')

  const metadataInput = input.metadata && typeof input.metadata === 'object' ? input.metadata as Record<string, unknown> : {}
  const metadata: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadataInput).slice(0, 12)) {
    const cleanKey = cleanText(key, 40).replace(/[^a-zA-Z0-9_:-]+/g, '_')
    if (!cleanKey) continue
    metadata[cleanKey] = cleanText(value, 160)
  }

  const events = await readJson<ProductEventRecord[]>('product-events', [])
  const record: ProductEventRecord = {
    id: `event_${crypto.randomUUID()}`,
    eventName,
    path: cleanText(input.path || '/', 200),
    metadata,
    createdAt: new Date().toISOString(),
  }
  events.unshift(record)
  await writeJson('product-events', events.slice(0, 5000))
  return record
}

export async function getProductAnalyticsSummary() {
  const events = await readJson<ProductEventRecord[]>('product-events', [])
  const byEvent: Record<string, number> = {}
  const byPath: Record<string, number> = {}

  for (const event of events) {
    byEvent[event.eventName] = (byEvent[event.eventName] || 0) + 1
    byPath[event.path] = (byPath[event.path] || 0) + 1
  }

  return {
    totalEvents: events.length,
    byEvent,
    byPath,
    recent: events.slice(0, 30),
  }
}

export async function listProductEvents() {
  return readJson<ProductEventRecord[]>('product-events', [])
}

export async function listProviderCredentials(ownerId: string) {
  const credentials = await readJson<Record<string, ProviderCredentialRecord>>('provider-credentials', {})
  return Object.values(credentials)
    .filter((credential) => credential.ownerId === ownerId && !credential.revokedAt)
    .sort((a, b) => a.provider.localeCompare(b.provider))
    .map(redactProviderCredential)
}

export async function saveProviderCredential(ownerId: string, providerInput: string, secret: string) {
  const provider = normalizeProvider(providerInput)
  const value = secret.trim()
  if (!value) throw new Error('Provider key is required.')
  if (value.length > 4000) throw new Error('Provider key is too long.')

  const credentials = await readJson<Record<string, ProviderCredentialRecord>>('provider-credentials', {})
  const existing = Object.values(credentials).find(
    (credential) => credential.ownerId === ownerId && credential.provider === provider && !credential.revokedAt
  )
  const now = new Date().toISOString()
  const encryptedSecret = encryptSecret(value, byokEncryptionSecret()) as EncryptedSecretPayload
  const record: ProviderCredentialRecord = {
    id: existing?.id || `provider_${crypto.randomUUID()}`,
    ownerId,
    provider,
    encryptedSecret,
    lastFour: redactSecret(value).lastFour,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    verifiedAt: now,
    revokedAt: null,
  }

  credentials[record.id] = record
  await writeJson('provider-credentials', credentials)
  return redactProviderCredential(record)
}

export async function revokeProviderCredential(ownerId: string, providerInput: string) {
  const provider = normalizeProvider(providerInput)
  const credentials = await readJson<Record<string, ProviderCredentialRecord>>('provider-credentials', {})
  const existing = Object.values(credentials).find(
    (credential) => credential.ownerId === ownerId && credential.provider === provider && !credential.revokedAt
  )
  if (!existing) return false
  credentials[existing.id] = { ...existing, revokedAt: new Date().toISOString() }
  await writeJson('provider-credentials', credentials)
  return true
}

export async function getOwnerProviderCredentials(ownerId: string): Promise<OwnerProviderCredentials> {
  const credentials = await readJson<Record<string, ProviderCredentialRecord>>('provider-credentials', {})
  const active = Object.values(credentials).filter((credential) => credential.ownerId === ownerId && !credential.revokedAt)
  const result: OwnerProviderCredentials = {}

  for (const credential of active) {
    try {
      const secret = decryptSecret(credential.encryptedSecret, byokEncryptionSecret())
      if (credential.provider === 'openai') result.modelProviderKey = secret
      if (credential.provider === 'serpapi') result.serpapiKey = secret
    } catch (error) {
      console.warn(`[BYOK] Could not decrypt ${credential.provider} credential for owner ${ownerId}.`)
    }
  }

  return result
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
  return Object.values(domains).find((record) => record.domain === domain && timingSafeStringEqual(record.publicToken, publicToken)) || null
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
