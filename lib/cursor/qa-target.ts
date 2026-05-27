function splitEnvList(value?: string) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function originFrom(value?: string | null) {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function configuredOriginFrom(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return originFrom(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
}

function isLocalDevelopmentOrigin(url: URL) {
  if (process.env.NODE_ENV === 'production') return false
  return ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
}

const DEFAULT_PRODUCTION_BASE_URL = 'https://hireproof.tech'

function defaultQaBaseUrl(requestUrl: string) {
  const configured = configuredOriginFrom(process.env.APP_BASE_URL) ||
    configuredOriginFrom(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    configuredOriginFrom(process.env.VERCEL_URL)
  if (configured) return configured

  try {
    const requestOrigin = new URL(requestUrl)
    if (isLocalDevelopmentOrigin(requestOrigin)) return requestOrigin.origin
  } catch {
    // Ignore malformed request URLs and use the production fallback.
  }

  return DEFAULT_PRODUCTION_BASE_URL
}

export function resolveCursorQaBaseUrl(input: unknown, requestUrl: string) {
  const fallback = defaultQaBaseUrl(requestUrl)
  const raw = typeof input === 'string' && input.trim() ? input.trim() : fallback
  let parsed: URL

  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Cursor QA target must be a valid absolute URL.')
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Cursor QA target must use http or https.')
  }

  if (parsed.username || parsed.password) {
    throw new Error('Cursor QA target must not include credentials.')
  }

  const allowedOrigins = new Set<string>()
  const requestOrigin = originFrom(requestUrl)
  for (const origin of [
    DEFAULT_PRODUCTION_BASE_URL,
    configuredOriginFrom(process.env.APP_BASE_URL),
    configuredOriginFrom(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    configuredOriginFrom(process.env.VERCEL_URL),
  ]) {
    if (origin) allowedOrigins.add(origin)
  }
  if (requestOrigin) {
    const parsedRequestOrigin = new URL(requestOrigin)
    if (isLocalDevelopmentOrigin(parsedRequestOrigin)) allowedOrigins.add(requestOrigin)
  }

  for (const item of [
    ...splitEnvList(process.env.HIREPROOF_CURSOR_QA_ALLOWED_ORIGINS),
    ...splitEnvList(process.env.CURSOR_QA_ALLOWED_ORIGINS),
  ]) {
    const origin = originFrom(item)
    if (origin) allowedOrigins.add(origin)
  }

  if (!allowedOrigins.has(parsed.origin) && !isLocalDevelopmentOrigin(parsed)) {
    throw new Error('Cursor QA target origin is not allowed.')
  }

  return parsed.origin
}
