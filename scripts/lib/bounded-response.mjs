const DEFAULT_SCRIPT_RESPONSE_LIMIT_BYTES = 256 * 1024

function configuredResponseLimit() {
  const value = Number(process.env.HIREPROOF_SCRIPT_RESPONSE_LIMIT_BYTES || DEFAULT_SCRIPT_RESPONSE_LIMIT_BYTES)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SCRIPT_RESPONSE_LIMIT_BYTES
}

export const SCRIPT_RESPONSE_LIMIT_BYTES = configuredResponseLimit()

function byteLimitError(label, maxBytes) {
  return new Error(`${label} exceeded ${maxBytes} bytes.`)
}

function contentLengthFrom(response) {
  const raw = response.headers?.get?.('content-length')
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

export async function readBoundedText(response, {
  label = 'Response body',
  maxBytes = SCRIPT_RESPONSE_LIMIT_BYTES,
} = {}) {
  const contentLength = contentLengthFrom(response)
  if (typeof contentLength === 'number' && contentLength > maxBytes) {
    await response.body?.cancel?.().catch(() => undefined)
    throw byteLimitError(label, maxBytes)
  }

  if (response.body?.getReader) {
    const reader = response.body.getReader()
    const chunks = []
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
          throw byteLimitError(label, maxBytes)
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
    return new TextDecoder().decode(bytes)
  }

  const text = typeof response.text === 'function' ? await response.text() : ''
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw byteLimitError(label, maxBytes)
  }
  return text
}

export async function readBoundedJson(response, options = {}) {
  const text = await readBoundedText(response, options)
  return text ? JSON.parse(text) : null
}
