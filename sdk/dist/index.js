"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HireProof = exports.HireProofError = void 0;
class HireProofError extends Error {
    constructor(message, status, body, requestId) {
        super(message);
        this.name = 'HireProofError';
        this.status = status;
        this.body = body;
        this.requestId = requestId;
    }
}
exports.HireProofError = HireProofError;
// ─── Helpers ─────────────────────────────────────────────────────────
function generateRequestId() {
    return `hp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function isRetryableStatus(status) {
    return status === 429 || status === 502 || status === 503 || status === 504;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function validateText(text) {
    if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('HireProof: `text` is required and must be a non-empty string');
    }
    if (text.length > 10000) {
        throw new Error('HireProof: `text` must be ≤ 10,000 characters');
    }
}
function validateUrl(url) {
    if (url !== undefined && url !== null && url !== '') {
        try {
            new URL(url);
        }
        catch {
            throw new Error(`HireProof: invalid URL "${url}"`);
        }
    }
}
// ─── Resources ───────────────────────────────────────────────────────
class AuditResource {
    constructor(client) {
        this.client = client;
    }
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
    async investigate(request) {
        validateText(request.text);
        validateUrl(request.url);
        return this.client._request('POST', '/api/v1/audit', {
            text: request.text.trim(),
            url: request.url || undefined,
            location: request.location || undefined,
            image: request.image || undefined,
            mode: request.mode || undefined,
        });
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
    async investigateAsync(request) {
        validateText(request.text);
        validateUrl(request.url);
        validateUrl(request.webhookUrl);
        if (!request.webhookUrl) {
            throw new Error('HireProof: `webhookUrl` is required for async investigations');
        }
        return this.client._request('POST', '/api/v1/audit', {
            text: request.text.trim(),
            url: request.url || undefined,
            location: request.location || undefined,
            image: request.image || undefined,
            mode: request.mode || undefined,
            webhook_url: request.webhookUrl,
        });
    }
}
class McpResource {
    constructor(client) {
        this.client = client;
    }
    /**
     * List all available MCP investigation tools.
     */
    async listTools() {
        return this.client._request('GET', '/api/mcp');
    }
    /**
     * Call a specific MCP tool with arguments.
     */
    async callTool(name, args = {}) {
        if (!name || typeof name !== 'string') {
            throw new Error('HireProof: tool `name` is required');
        }
        return this.client._request('POST', '/api/mcp', {
            method: 'tools/call',
            name: name.trim(),
            arguments: args,
        });
    }
}
// ─── Client ──────────────────────────────────────────────────────────
class HireProof {
    constructor(config) {
        if (!config.apiKey || typeof config.apiKey !== 'string') {
            throw new Error('HireProof: apiKey is required and must be a non-empty string');
        }
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
        this.timeout = Math.max(config.timeout || 60000, 5000);
        this.maxRetries = Math.max(config.maxRetries ?? 3, 0);
        this.audit = new AuditResource(this);
        this.mcp = new McpResource(this);
    }
    /** @internal — do not call directly */
    async _request(method, path, body) {
        const requestId = generateRequestId();
        let lastError = null;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeout);
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
                });
                // Parse response safely
                let json;
                try {
                    const text = await res.text();
                    json = text ? JSON.parse(text) : {};
                }
                catch {
                    json = {};
                }
                if (!res.ok) {
                    const errBody = json;
                    const msg = errBody?.error || errBody?.message || `Request failed with status ${res.status}`;
                    lastError = new HireProofError(msg, res.status, json, requestId);
                    // Only retry on transient errors
                    if (isRetryableStatus(res.status) && attempt < this.maxRetries) {
                        const backoff = Math.min(1000 * Math.pow(2, attempt), 8000);
                        await sleep(backoff);
                        continue;
                    }
                    throw lastError;
                }
                return json;
            }
            catch (err) {
                clearTimeout(timer);
                // Handle AbortController timeout
                if (err instanceof DOMException && err.name === 'AbortError') {
                    lastError = new HireProofError(`Request timed out after ${this.timeout}ms`, 408, undefined, requestId);
                    if (attempt < this.maxRetries) {
                        await sleep(1000 * Math.pow(2, attempt));
                        continue;
                    }
                    throw lastError;
                }
                // Network / fetch failures
                if (!(err instanceof HireProofError)) {
                    lastError = new HireProofError(`Network error: ${err.message || 'Unknown fetch failure'}`, 0, undefined, requestId);
                    if (attempt < this.maxRetries) {
                        await sleep(1000 * Math.pow(2, attempt));
                        continue;
                    }
                    throw lastError;
                }
                throw err;
            }
            finally {
                clearTimeout(timer);
            }
        }
        throw lastError || new HireProofError('Request failed after all retries', 0, undefined, requestId);
    }
}
exports.default = HireProof;
exports.HireProof = HireProof;
//# sourceMappingURL=index.js.map