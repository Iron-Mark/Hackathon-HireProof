/**
 * HireProof SDK — TypeScript client for the HireProof Job Verification API.
 *
 * @example
 * ```ts
 * import HireProof from 'hireproof-sdk'
 *
 * const client = new HireProof({ apiKey: 'your_api_key' })
 * const report = await client.audit.investigate({ text: 'Remote intern...' })
 * console.log(report.verdict) // 'high-risk'
 * ```
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface HireProofConfig {
  /** Your HireProof API key (x-api-key) */
  apiKey: string
  /** Base URL of the HireProof server. Defaults to http://localhost:3000 */
  baseUrl?: string
  /** Request timeout in ms. Defaults to 60000 (60s). */
  timeout?: number
  /** Max retry attempts on transient failures (5xx, network). Defaults to 3. */
  maxRetries?: number
}

export interface AuditRequest {
  /** Job post text to investigate (required, 1-10000 chars) */
  text: string
  /** URL of the job posting */
  url?: string
  /** Geographic location for local signals */
  location?: string
  /** Base64-encoded screenshot (data URI) */
  image?: string
  /** Force "live" or "demo" mode */
  mode?: 'live' | 'demo'
  /** Webhook URL for async processing */
  webhookUrl?: string
}

export interface ExtractedClaims {
  company: string
  role: string
  salary: string
  location: string
  contactMethod: string
  applicationPath: string
}

export interface EvidenceItem {
  source: string
  snippet: string
  url: string
  type: string
}

export interface AlternativeJob {
  title: string
  company: string
  salary: string
  url?: string
}

export interface AuditReport {
  id?: string
  verdict: 'safe' | 'caution' | 'high-risk'
  riskScore: number
  confidence: string
  summary: string
  extractedClaims: ExtractedClaims
  redFlags: string[]
  greenFlags: string[]
  evidence: EvidenceItem[]
  alternatives: AlternativeJob[]
  nextSteps: string[]
  timestamp?: string
  mode?: 'live' | 'demo'
}

export interface AsyncAccepted {
  status: 'processing'
  message: string
}

export interface McpToolResult {
  content: Array<{ type: string; text: string }>
}

export interface McpListResponse {
  status: string
  tools: string[]
}

export class HireProofError extends Error {
  /** HTTP status code (e.g. 401, 429, 500) */
  public readonly status: number
  /** Raw JSON response body */
  public readonly body?: unknown
  /** Unique request ID for tracing */
  public readonly requestId?: string

  constructor(message: string, status: number, body?: unknown, requestId?: string) {
    super(message)
    this.name = 'HireProofError'
    this.status = status
    this.body = body
    this.requestId = requestId
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function generateRequestId(): string {
  return `hp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function validateText(text: unknown): asserts text is string {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('HireProof: `text` is required and must be a non-empty string')
  }
  if (text.length > 10_000) {
    throw new Error('HireProof: `text` must be ≤ 10,000 characters')
  }
}

function validateUrl(url: unknown): void {
  if (url !== undefined && url !== null && url !== '') {
    try {
      new URL(url as string)
    } catch {
      throw new Error(`HireProof: invalid URL "${url}"`)
    }
  }
}

// ─── Resources ───────────────────────────────────────────────────────

class AuditResource {
  constructor(private client: HireProof) {}

  /**
   * Run a synchronous investigation. Blocks until the result is ready.
   * Automatically retries on transient errors (429, 5xx).
   *
   * @example
   * ```ts
   * const report = await client.audit.investigate({
   *   text: 'Remote frontend intern. PHP 80,000/week.',
   *   location: 'Philippines',
   * })
   * ```
   */
  async investigate(request: AuditRequest): Promise<AuditReport> {
    validateText(request.text)
    validateUrl(request.url)
    return this.client._request<AuditReport>('POST', '/api/v1/audit', {
      text: request.text.trim(),
      url: request.url || undefined,
      location: request.location || undefined,
      image: request.image || undefined,
      mode: request.mode || undefined,
    })
  }

  /**
   * Start an async investigation with webhook delivery.
   * Returns immediately with a 202 status. The result will be POSTed
   * to `webhookUrl` when the investigation completes.
   *
   * @example
   * ```ts
   * const accepted = await client.audit.investigateAsync({
   *   text: 'We are hiring...',
   *   webhookUrl: 'https://myagent.com/callback',
   * })
   * console.log(accepted.status) // 'processing'
   * ```
   */
  async investigateAsync(request: AuditRequest & { webhookUrl: string }): Promise<AsyncAccepted> {
    validateText(request.text)
    validateUrl(request.url)
    validateUrl(request.webhookUrl)
    if (!request.webhookUrl) {
      throw new Error('HireProof: `webhookUrl` is required for async investigations')
    }
    return this.client._request<AsyncAccepted>('POST', '/api/v1/audit', {
      text: request.text.trim(),
      url: request.url || undefined,
      location: request.location || undefined,
      image: request.image || undefined,
      mode: request.mode || undefined,
      webhook_url: request.webhookUrl,
    })
  }
}

class McpResource {
  constructor(private client: HireProof) {}

  /**
   * List all available MCP investigation tools.
   */
  async listTools(): Promise<McpListResponse> {
    return this.client._request<McpListResponse>('GET', '/api/mcp')
  }

  /**
   * Call a specific MCP tool with arguments.
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<McpToolResult> {
    if (!name || typeof name !== 'string') {
      throw new Error('HireProof: tool `name` is required')
    }
    return this.client._request<McpToolResult>('POST', '/api/mcp', {
      method: 'tools/call',
      name: name.trim(),
      arguments: args,
    })
  }
}

// ─── Client ──────────────────────────────────────────────────────────

export default class HireProof {
  private apiKey: string
  private baseUrl: string
  private timeout: number
  private maxRetries: number

  /** Investigate job posts */
  public audit: AuditResource
  /** Call individual MCP investigation tools */
  public mcp: McpResource

  constructor(config: HireProofConfig) {
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new Error('HireProof: apiKey is required and must be a non-empty string')
    }
    this.apiKey = config.apiKey
    this.baseUrl = (config.baseUrl || 'http://localhost:3000').replace(/\/+$/, '')
    this.timeout = Math.max(config.timeout || 60_000, 5_000)
    this.maxRetries = Math.max(config.maxRetries ?? 3, 0)

    this.audit = new AuditResource(this)
    this.mcp = new McpResource(this)
  }

  /** @internal — do not call directly */
  async _request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const requestId = generateRequestId()
    let lastError: HireProofError | null = null

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.timeout)

      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'x-request-id': requestId,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })

        // Parse response safely
        let json: unknown
        try {
          const text = await res.text()
          json = text ? JSON.parse(text) : {}
        } catch {
          json = {}
        }

        if (!res.ok) {
          const errBody = json as Record<string, unknown>
          const msg = (errBody?.error as string) || (errBody?.message as string) || `Request failed with status ${res.status}`
          lastError = new HireProofError(msg, res.status, json, requestId)

          // Only retry on transient errors
          if (isRetryableStatus(res.status) && attempt < this.maxRetries) {
            const backoff = Math.min(1000 * Math.pow(2, attempt), 8000)
            await sleep(backoff)
            continue
          }
          throw lastError
        }

        return json as T
      } catch (err) {
        clearTimeout(timer)

        // Handle AbortController timeout
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastError = new HireProofError(
            `Request timed out after ${this.timeout}ms`,
            408,
            undefined,
            requestId,
          )
          if (attempt < this.maxRetries) {
            await sleep(1000 * Math.pow(2, attempt))
            continue
          }
          throw lastError
        }

        // Network / fetch failures
        if (!(err instanceof HireProofError)) {
          lastError = new HireProofError(
            `Network error: ${(err as Error).message || 'Unknown fetch failure'}`,
            0,
            undefined,
            requestId,
          )
          if (attempt < this.maxRetries) {
            await sleep(1000 * Math.pow(2, attempt))
            continue
          }
          throw lastError
        }

        throw err
      } finally {
        clearTimeout(timer)
      }
    }

    throw lastError || new HireProofError('Request failed after all retries', 0, undefined, requestId)
  }
}

// Named exports for convenience
export { HireProof }
