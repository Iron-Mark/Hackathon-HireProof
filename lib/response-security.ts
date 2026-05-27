import { NextResponse } from 'next/server'

export const INTERNAL_TOOL_RESPONSE_LIMIT_BYTES = 256 * 1024

export function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Cache-Control', 'no-store')
  return NextResponse.json(body, { ...init, headers })
}

export async function readBoundedInternalToolJson(response: Response, maxBytes = INTERNAL_TOOL_RESPONSE_LIMIT_BYTES): Promise<unknown> {
  const contentLength = Number(response.headers?.get?.('content-length') || '0')
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    await response.body?.cancel().catch(() => undefined)
    throw new Error(`Internal tool response exceeded ${maxBytes} bytes.`)
  }

  if (!response.body?.getReader) {
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error(`Internal tool response exceeded ${maxBytes} bytes.`)
    }
    return text ? JSON.parse(text) : {}
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value)
      received += chunk.byteLength
      if (received > maxBytes) {
        await reader.cancel().catch(() => undefined)
        throw new Error(`Internal tool response exceeded ${maxBytes} bytes.`)
      }
      chunks.push(chunk)
    }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  const text = new TextDecoder().decode(bytes)
  return text ? JSON.parse(text) : {}
}
