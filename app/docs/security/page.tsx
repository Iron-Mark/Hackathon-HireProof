import { Metadata } from 'next'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  EyeOff,
  FileWarning,
  Globe,
  KeyRound,
  Lock,
  Network,
  Server,
  Shield,
  UserCheck,
  Webhook,
  Zap,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security Whitepaper | HireProof Docs',
  description: 'Implementation-aligned HireProof security whitepaper covering data flow, controls, BYOK storage, webhooks, rate limits, and operational responsibilities.',
}

const principles = [
  'Treat pasted job posts, screenshots, recruiter messages, URLs, and callback destinations as untrusted input.',
  'Prefer explicit demo mode or explicit credential errors over silently returning fake live-evidence claims.',
  'Keep provider secrets server-side, encrypted at rest, owner-scoped, and redacted in every browser response.',
  'Design for graceful degradation: report persistence failures should not crash the audit response, and Redis outages fall back to local controls during demos.',
]

const dataFlow = [
  {
    title: '1. User or agent input',
    body: 'The web UI posts to /api/audit. API consumers use /api/v1/audit with an API key. Both paths parse requests through the shared AuditRequest schema, including text, optional URL, location, image data, mode, and optional webhook_url.',
  },
  {
    title: '2. Credential resolution',
    body: 'Authenticated developer accounts may save OpenAI and SerpApi credentials in the Hosted BYOK Vault. Audits use owner-byok credentials when present; otherwise they use platform environment credentials when configured.',
  },
  {
    title: '3. Investigation runtime',
    body: 'Live audits run claim extraction, evidence search, local presence checks, comparable job checks, and risk scoring. Demo mode returns fixtures and is labeled as demo in the report credential metadata.',
  },
  {
    title: '4. Report delivery and storage',
    body: 'Reports can render immediately in the UI, be stored in browser history, be persisted server-side, or be delivered asynchronously to a signed webhook callback. Redis-backed persistence uses a 30-day TTL; local fallback caps stored reports at 500.',
  },
]

const controls = [
  {
    icon: KeyRound,
    title: 'Authentication and key handling',
    items: [
      'Headless /api/v1/audit and /api/mcp requests require API-key authentication.',
      'API keys are hashed for lookup and raw key material is only shown once at creation.',
      'Developer session cookies gate Hosted BYOK Vault reads, saves, and revokes.',
      'Public status, proof, chat, workflow, and webhook metadata routes expose coarse readiness only; per-secret presence, provider cache telemetry, and guard internals remain behind authenticated developer usage.',
      'Cursor automation routes require high-entropy job secrets or developer sessions, cap request bodies, and compare internal job secrets in constant time.',
      'The report schema records credentialMode as owner-byok, platform-env, or demo for auditability.',
    ],
  },
  {
    icon: Lock,
    title: 'Hosted BYOK Vault',
    items: [
      'Provider secrets are verified before save, encrypted with AES-256-GCM, and stored with only redacted metadata returned to the browser.',
      'Production hosted credential storage requires a private high-entropy BYOK_ENCRYPTION_KEY; placeholders and short shared values are rejected.',
      'Old browser-local provider keys are cleared by the Developer Portal flow instead of continuing to rely on localStorage secrets.',
      'Credential mutation routes enforce authenticated ownership before returning or deleting records.',
    ],
  },
  {
    icon: UserCheck,
    title: 'CSRF and request origin controls',
    items: [
      'The public UI audit route uses exact Origin/Referer validation against the current app origin and APP_BASE_URL, rejecting substring-lookalike hosts.',
      'Hosted BYOK PATCH and DELETE operations use exact allowed origins from the request URL and APP_BASE_URL.',
      'Credential save attempts are separately rate-limited by user and source IP.',
      'JSON mutation routes reject oversized request bodies before parsing; public and agent-facing routes count streamed body bytes so missing or chunked Content-Length headers cannot bypass the cap.',
      'Mutation failures return browser-safe errors rather than provider-specific secret validation details.',
    ],
  },
  {
    icon: Zap,
    title: 'Rate limiting and cost protection',
    items: [
      'The web audit route is limited to 5 requests per minute per IP.',
      'The headless audit route is limited to 20 requests per minute per API key.',
      'The MCP route is limited to 30 tool calls per minute per API key.',
      'Upstash Redis provides distributed limits when configured; otherwise an in-memory fallback keeps local demos usable.',
    ],
  },
  {
    icon: Webhook,
    title: 'Webhook and SSRF defenses',
    items: [
      'Async webhook_url delivery only accepts valid URLs and rejects localhost, .local, .internal, loopback, link-local, and RFC 1918 private ranges.',
      'The server performs DNS lookup before dispatch, blocks any resolved private or local network address, and does not follow receiver redirects.',
      'Developer webhook sandbox tests use the same destination validation and add per-user rate limiting.',
      'Slack, Discord, Telegram, and WhatsApp/Zernio webhook endpoints reject oversized payloads before adapter dispatch; Discord interaction signatures also require a fresh timestamp.',
      'Callback payloads are signed with HMAC-SHA256 in X-HireProof-Signature and include X-HireProof-Event.',
      'Webhook delivery uses a 10 second timeout and retries server-side failures with exponential backoff, while 4xx receiver errors stop retries.',
    ],
  },
  {
    icon: Server,
    title: 'Outbound provider response bounds',
    items: [
      'SerpApi network responses are bounded before JSON parsing so an upstream provider response cannot force unbounded buffering.',
      'Invalid provider credential checks cancel response bodies instead of reading arbitrary error payloads into memory.',
      'Evidence-provider fetches use timeouts and response-size budgets before parsing third-party JSON.',
      'Operator smoke and proof scripts use bounded response readers before parsing configurable live endpoint responses.',
      'Public job URL enrichment validates every redirect target and caps fetched HTML before extraction.',
      'Public trend pages use stored audits by default; SerpApi-backed external trend signals require explicit opt-in and are rate-limited per source IP.',
    ],
  },
  {
    icon: Database,
    title: 'Data minimization and retention',
    items: [
      'The UI warns users not to paste passwords, IDs, bank details, or verification codes.',
      'Browser history is stored locally through SafeStorage and capped at 50 reports per browser profile.',
      'Server persistence validates reports through AuditReportSchema before write.',
      'Verified badge embeds use scoped public tokens, escape rendered HTML, rate-limit public checks, and bound reflected script/status query parameters.',
      'Redis report storage expires after 30 days; local filesystem fallback caps public listing indexes without deleting existing permalinks.',
    ],
  },
]

const headers = [
  ['X-Frame-Options', 'DENY', 'Reduces clickjacking risk.'],
  ['X-Content-Type-Options', 'nosniff', 'Prevents MIME sniffing.'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload', 'Requires HTTPS after first secure visit.'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin', 'Limits cross-origin referrer leakage.'],
  ['Cross-Origin-Opener-Policy', 'same-origin', 'Separates browsing contexts.'],
  ['Permissions-Policy', 'camera=(), microphone=(self), geolocation=()', 'Restricts browser feature access.'],
  ['Content-Security-Policy', "default-src 'self'; object-src 'none'; frame-ancestors 'none'", 'Baseline CSP; inline/eval allowances remain for current Next.js runtime compatibility.'],
]

const boundaries = [
  {
    title: 'What HireProof protects',
    items: [
      'Abuse of expensive audit, MCP, and model-backed routes through rate limiting.',
      'Private network probing through webhook callback URLs.',
      'Provider key exposure through browser storage or unredacted credential APIs.',
      'Cross-site credential mutation against the Hosted BYOK Vault.',
      'Unlabeled demo or credential-free live reports.',
    ],
  },
  {
    title: 'What remains customer or operator responsibility',
    items: [
      'Provision strong APP_BASE_URL, SESSION_SECRET, AGENT_API_KEY, BYOK_ENCRYPTION_KEY, Redis, and provider credentials in production. Secret values must be private, generated, at least 32 characters, and not copied placeholders.',
      'Set HIREPROOF_ADMIN_EMAILS or narrower operator allowlists before using pilot-admin, analytics export, or cross-owner repair surfaces.',
      'Keep Vercel, Redis, model providers, and search providers configured with least-privilege access and billing alerts.',
      'Avoid collecting unnecessary personal data in job posts or screenshots.',
      'Validate incoming HireProof webhook signatures before trusting callback payloads.',
      'Rotate API keys and provider credentials if a device, repository secret, or integration endpoint is compromised.',
    ],
  },
]

const limitations = [
  'Webhook SSRF protection resolves and checks the destination host before fetch, but it is not a full outbound proxy that pins the resolved IP through the entire TCP connection.',
  'The configured CSP still allows unsafe-inline and unsafe-eval for current framework/runtime compatibility; removing those allowances is a future hardening target.',
  'Local filesystem report storage is a demo/self-hosting fallback, not a replacement for managed encrypted storage, access logs, and backup controls.',
  'HireProof can flag suspicious job content, but it is not a background check service and should not be presented as a definitive identity-verification authority.',
]

export default function SecurityPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-safe">
          <Shield className="h-4 w-4" />
          Security posture
        </div>
        <div className="max-w-4xl space-y-4">
          <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Security Whitepaper</h1>
          <p className="text-xl font-medium leading-relaxed text-muted">
            HireProof verifies suspicious job posts, recruiter messages, screenshots, and callback workflows. This whitepaper documents the implemented controls, trust boundaries, retention model, and known hardening gaps for the current product.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['UI audit limit', '5/min/IP'],
            ['API audit limit', '20/min/key'],
            ['MCP limit', '30/min/key'],
            ['Redis report TTL', '30 days'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border-soft bg-surface p-4">
              <div className="text-2xl font-black text-safe">{value}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <CheckCircle2 className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Security Principles</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {principles.map((principle) => (
            <div key={principle} className="rounded-2xl border border-border-soft bg-surface p-5 text-sm font-semibold leading-6 text-muted">
              {principle}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Network className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">System Data Flow</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {dataFlow.map((step) => (
            <div key={step.title} className="rounded-2xl border border-border-soft bg-surface p-5">
              <h3 className="text-sm font-black">{step.title}</h3>
              <p className="mt-3 text-xs font-semibold leading-5 text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Lock className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Implemented Controls</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {controls.map(({ icon: Icon, title, items }) => (
            <div key={title} className="rounded-2xl border border-border-soft bg-surface p-6">
              <h3 className="mb-4 flex items-center gap-2 font-black">
                <Icon className="h-4 w-4 text-safe" />
                {title}
              </h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-safe" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Server className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">HTTP and Browser Hardening</h2>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface">
          <div className="grid grid-cols-[minmax(10rem,0.8fr)_minmax(11rem,1fr)_minmax(0,1.2fr)] border-b border-border-soft bg-background/60 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted">
            <span>Header</span>
            <span>Configured value</span>
            <span>Purpose</span>
          </div>
          {headers.map(([name, value, purpose]) => (
            <div key={name} className="grid grid-cols-1 gap-2 border-b border-border-soft px-4 py-4 text-sm last:border-b-0 md:grid-cols-[minmax(10rem,0.8fr)_minmax(11rem,1fr)_minmax(0,1.2fr)]">
              <code className="font-mono text-xs font-black text-foreground">{name}</code>
              <code className="break-words font-mono text-xs font-semibold text-muted">{value}</code>
              <p className="font-medium leading-6 text-muted">{purpose}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Globe className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Trust Boundaries</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {boundaries.map((group) => (
            <div key={group.title} className="rounded-2xl border border-border-soft bg-surface p-6">
              <h3 className="mb-4 font-black">{group.title}</h3>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-medium leading-6 text-muted">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <AlertTriangle className="h-6 w-6 text-caution" />
          <h2 className="text-2xl font-black">Known Limitations and Hardening Roadmap</h2>
        </div>
        <div className="rounded-2xl border border-caution-bg bg-caution-bg/25 p-6">
          <ul className="space-y-3">
            {limitations.map((item) => (
              <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-caution-text">
                <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <EyeOff className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Privacy Notes</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['No sensitive documents', 'Users should not paste IDs, passwords, bank details, verification codes, or private employee records into an audit.'],
            ['Report contents are user supplied', 'Reports may contain job-post text, screenshots, URLs, extracted claims, risk flags, and evidence snippets.'],
            ['Deletion paths', 'Browser history can be cleared locally. Server-side report lifecycle follows the configured Redis TTL or local fallback retention cap.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-border-soft bg-surface p-5">
              <h3 className="text-sm font-black">{title}</h3>
              <p className="mt-3 text-xs font-semibold leading-5 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-8 text-center space-y-4">
        <h2 className="text-2xl font-black">Responsible Disclosure</h2>
        <p className="mx-auto max-w-2xl font-medium text-muted">
          Found a vulnerability? Share reproduction steps, affected route, expected impact, and any proof-of-concept payload through the project maintainer channel. Do not include real job-seeker personal data in reports.
        </p>
      </section>
    </div>
  )
}
