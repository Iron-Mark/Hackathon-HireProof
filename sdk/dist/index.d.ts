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
export interface HireProofConfig {
    /** Your HireProof API key (x-api-key) */
    apiKey: string;
    /** Base URL of the HireProof server. Defaults to http://localhost:3000 */
    baseUrl?: string;
    /** Request timeout in ms. Defaults to 60000 (60s). */
    timeout?: number;
    /** Max retry attempts on transient failures (5xx, network). Defaults to 3. */
    maxRetries?: number;
}
export interface AuditRequest {
    /** Job post text to investigate (required, 1-10000 chars) */
    text: string;
    /** URL of the job posting */
    url?: string;
    /** Geographic location for local signals */
    location?: string;
    /** Base64-encoded screenshot (data URI) */
    image?: string;
    /** Force "live" or "demo" mode */
    mode?: 'live' | 'demo';
    /** Webhook URL for async processing */
    webhookUrl?: string;
}
export interface ExtractedClaims {
    company: string;
    role: string;
    salary: string;
    location: string;
    contactMethod: string;
    applicationPath: string;
}
export interface EvidenceItem {
    source: string;
    snippet: string;
    url: string;
    type: string;
}
export interface AlternativeJob {
    title: string;
    company: string;
    salary: string;
    url?: string;
}
export interface AuditReport {
    id?: string;
    verdict: 'safe' | 'caution' | 'high-risk';
    riskScore: number;
    confidence: string;
    summary: string;
    extractedClaims: ExtractedClaims;
    redFlags: string[];
    greenFlags: string[];
    evidence: EvidenceItem[];
    alternatives: AlternativeJob[];
    nextSteps: string[];
    timestamp?: string;
    mode?: 'live' | 'demo';
}
export interface AsyncAccepted {
    status: 'processing';
    message: string;
}
export interface McpToolResult {
    content: Array<{
        type: string;
        text: string;
    }>;
}
export interface McpListResponse {
    status: string;
    tools: string[];
}
export declare class HireProofError extends Error {
    /** HTTP status code (e.g. 401, 429, 500) */
    readonly status: number;
    /** Raw JSON response body */
    readonly body?: unknown;
    /** Unique request ID for tracing */
    readonly requestId?: string;
    constructor(message: string, status: number, body?: unknown, requestId?: string);
}
declare class AuditResource {
    private client;
    constructor(client: HireProof);
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
    investigate(request: AuditRequest): Promise<AuditReport>;
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
    investigateAsync(request: AuditRequest & {
        webhookUrl: string;
    }): Promise<AsyncAccepted>;
}
declare class McpResource {
    private client;
    constructor(client: HireProof);
    /**
     * List all available MCP investigation tools.
     */
    listTools(): Promise<McpListResponse>;
    /**
     * Call a specific MCP tool with arguments.
     */
    callTool(name: string, args?: Record<string, unknown>): Promise<McpToolResult>;
}
export default class HireProof {
    private apiKey;
    private baseUrl;
    private timeout;
    private maxRetries;
    /** Investigate job posts */
    audit: AuditResource;
    /** Call individual MCP investigation tools */
    mcp: McpResource;
    constructor(config: HireProofConfig);
    /** @internal — do not call directly */
    _request<T>(method: string, path: string, body?: unknown): Promise<T>;
}
export { HireProof };
//# sourceMappingURL=index.d.ts.map