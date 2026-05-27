import { NextResponse } from 'next/server'

const JSON_ERROR_HEADERS = {
  'Cache-Control': 'no-store',
}

function errorJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Cache-Control', JSON_ERROR_HEADERS['Cache-Control'])
  return NextResponse.json(body, { ...init, headers })
}

function parseOrigin(value: string | null) {
  if (!value) return null

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function parseConfiguredOrigin(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return parseOrigin(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
}

function localDevelopmentRequestOrigin(request: Request) {
  if (process.env.NODE_ENV === 'production') return null

  try {
    const url = new URL(request.url)
    return ['localhost', '127.0.0.1', '::1'].includes(url.hostname) ? url.origin : null
  } catch {
    return null
  }
}

export function allowedMutationOrigins(request: Request) {
  const origins = new Set<string>()
  for (const origin of [
    parseConfiguredOrigin(process.env.APP_BASE_URL),
    parseConfiguredOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    parseConfiguredOrigin(process.env.VERCEL_URL),
    localDevelopmentRequestOrigin(request),
  ]) {
    if (origin) origins.add(origin)
  }
  return origins
}

export function validateMutationOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const sourceOrigin = parseOrigin(origin) || parseOrigin(referer)

  if (!sourceOrigin || !allowedMutationOrigins(request).has(sourceOrigin)) {
    return errorJson({ error: 'CSRF validation failed.' }, { status: 403 })
  }

  return null
}

function trustsProxyClientIpHeaders() {
  return process.env.TRUST_PROXY_CLIENT_IP_HEADERS === 'true'
}

function cleanClientIp(value: string | null) {
  const first = value?.split(',')[0]?.trim()
  if (!first || first.length > 64) return ''
  if (!/^[a-f0-9:.]+$/i.test(first)) return ''
  return first.toLowerCase()
}

export function requestIp(request: Request) {
  if (!trustsProxyClientIpHeaders()) return 'direct-client'

  return cleanClientIp(request.headers.get('x-real-ip')) ||
    cleanClientIp(request.headers.get('x-forwarded-for')) ||
    'direct-client'
}

function formatByteLimit(maxBytes: number) {
  if (maxBytes >= 1024 * 1024 && maxBytes % (1024 * 1024) === 0) {
    return `${maxBytes / (1024 * 1024)}MB`
  }
  if (maxBytes >= 1024 && maxBytes % 1024 === 0) {
    return `${maxBytes / 1024}KB`
  }
  return `${maxBytes} bytes`
}

export function rejectOversizedRequest(request: Request, maxBytes: number, label = 'Payload') {
  const rawContentLength = request.headers.get('content-length')
  const contentLength = Number(rawContentLength || '0')

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return errorJson(
      { error: `${label} too large (max ${formatByteLimit(maxBytes)}).` },
      { status: 413 },
    )
  }

  return null
}

function oversizedRequestResponse(maxBytes: number, label: string) {
  return errorJson(
    { error: `${label} too large (max ${formatByteLimit(maxBytes)}).` },
    { status: 413 },
  )
}

async function readRequestBodyText(request: Request, maxBytes: number, label: string) {
  const headerError = rejectOversizedRequest(request, maxBytes, label)
  if (headerError) return { ok: false as const, response: headerError }

  if (!request.body) {
    try {
      const body = await request.text()
      if (new TextEncoder().encode(body).byteLength > maxBytes) {
        return { ok: false as const, response: oversizedRequestResponse(maxBytes, label) }
      }
      return { ok: true as const, value: body }
    } catch {
      return {
        ok: false as const,
        response: errorJson({ error: 'Invalid request body.' }, { status: 400 }),
      }
    }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined)
        return { ok: false as const, response: oversizedRequestResponse(maxBytes, label) }
      }
      chunks.push(value)
    }

    const body = new TextDecoder().decode(concatChunks(chunks, totalBytes))
    return { ok: true as const, value: body }
  } catch {
    return {
      ok: false as const,
      response: errorJson({ error: 'Invalid request body.' }, { status: 400 }),
    }
  }
}

export async function readJsonRequest(request: Request, maxBytes: number, label = 'Payload') {
  const body = await readRequestBodyText(request, maxBytes, label)
  if (!body.ok) return body
  try {
    return { ok: true as const, value: JSON.parse(body.value || '{}') }
  } catch {
    return {
      ok: false as const,
      response: errorJson({ error: 'Invalid request format.' }, { status: 400 }),
    }
  }
}

export async function readTextRequest(request: Request, maxBytes: number, label = 'Payload') {
  return readRequestBodyText(request, maxBytes, label)
}

export function cloneRequestWithTextBody(request: Request, body: string) {
  return new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body,
  })
}

function concatChunks(chunks: Uint8Array[], totalBytes: number) {
  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}
