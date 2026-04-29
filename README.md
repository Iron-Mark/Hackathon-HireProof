# HireProof — AI-Powered Job Post Verification Agent

> Paste a job post. Know if it's legit before you apply.

**Built for the [Vercel "Zero to Agent" Hackathon](https://community.vercel.com/hackathons/zero-to-agent).**
Author: [Mark Siazon](https://www.marksiazon.dev/)

HireProof is a proof-backed AI agent that investigates suspicious job posts with live evidence. It extracts claims, checks company web presence, reviews news and reputation signals, compares similar roles, verifies local business footprint, and returns a structured verdict: **Safe**, **Caution**, or **High-Risk** — with receipts.

## Hackathon Track Coverage

HireProof is one job-verification agent with multiple surfaces:

- **v0 + MCPs** — implemented as the primary web app and runtime MCP investigation tools.
- **ChatSDK Agents** — implemented Slack webhook route and ChatSDK bot wrapper; live proof requires Slack + Redis credentials.
- **Vercel Workflow / WDK** — implemented WDK workflow entrypoint and start route; live durable proof requires deployed Workflow credentials.

See [`docs/triple-track-coverage.md`](docs/triple-track-coverage.md) for the honest track map and demo framing.

## Features

### Core Investigation Engine
- **AI Claims Extraction** — Extracts company, role, salary, contact method from text or screenshots using GPT-4o-mini
- **Autonomous Agentic Loop** — Multi-step tool orchestration via Vercel AI SDK `generateText` with `stopWhen`
- **Deterministic Risk Scoring** — Weighted red/green flag analysis producing a 0-100 risk score
- **4 MCP Investigation Tools** — Company presence, news reputation, job comparison, local presence

### Omni-Modal Input
- **Text** — Paste any job post, recruiter message, or email
- **Image** — Upload screenshots of WhatsApp chats, PDF offer letters, or social media posts
- **Voice** — Dictate job descriptions using browser Speech-to-Text (Chrome/Edge)

### Real-Time Experience
- **Server-Sent Events (SSE)** — Watch the Agent think and call tools in real-time
- **Framer Motion Animations** — Staggered reveal of verdict, flags, and evidence cards
- **Interactive Radar Chart** — 5-axis risk breakdown (Company, Reputation, Salary, Local, Contact)

### Agent-to-Agent (A2A) & Integrations
- **Job-Safety Checkpoint for AI Pipelines** — Plug HireProof into **n8n**, **Make.com**, or **LangChain** workflows so automated job-hunting agents can verify a post before submitting resumes or personal data.
- **Headless REST API** (`/api/v1/audit`) — Authenticated JSON endpoint for external AI agents.
- **TypeScript SDK** — Programmatic Node.js library (`hireproof-sdk`) for deep integrations.
- **MCP Server** (`/api/mcp`) — Model Context Protocol for direct tool access.
- **Async Webhooks** — Fire-and-forget with `webhook_url` for background processing.
- **Verified Badge API** — Domain-scoped badge status and script endpoints for approved career pages.
- **Self-Hostable** — 100% portable Next.js architecture with a **Bring Your Own Key (BYOK)** model.
- **Rate Limiting** — In-memory token bucket (5/min UI, 20/min API).
- **Agent-Friendly DOM** — `data-testid` and `aria-label` on all interactive elements.

## 🚀 Self-Hosting & Portability

HireProof is built to be portable. Whether you use the hosted demo or run it yourself, the core job-verification flow stays the same.

- **Vercel Native**: One-click deployment to Vercel with Edge Function support.
- **BYOK (Bring Your Own Key)**: Use your own OpenAI and SerpApi keys to bypass our managed limits.
- **Hybrid Storage Engine**: The app automatically detects if Upstash Redis is configured. If not, it gracefully degrades to local `localStorage` and local `fs` storage, making it cost $0.00 to run.
- **Zero-Config Docker**: Coming soon.

### Output & Sharing
- **PNG Screenshot Export** — Full result capture via html2canvas from the report screen
- **Trend JSON Export** — Download saved aggregate trend data as JSON
- **Shareable Permalinks** — Every audit is persisted and accessible via `/audit/[id]`
- **Copy Link Button** — One-click permalink sharing

### Infrastructure & Security
- **Hybrid Database Architecture** — Uses Upstash Redis for permanent, globally distributed storage of shareable links, gracefully degrading to local ephemeral `fs` if keys are missing (zero-cost Hackathon mode).
- **Local Data Cleanup** — `npm run cleanup:local-data` prunes local JSON reports and usage records for development installs.
- **L7 DDoS Immunity** — Edge-distributed rate limiter via Upstash prevents "Denial of Wallet" attacks against LLM billing APIs.
- **Security Hardening** — SSRF webhook protection, Prototype Pollution guards, strict CSP headers, and dynamic SEO no-index tags for data privacy.

### UI Polish
- **Dark Mode** — System-aware theme toggle with `next-themes`
- **Chrome Extension Local Install** — Manifest V3 extension assets can be loaded locally from `extension/`; no store listing is claimed yet

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4 + Custom Design Tokens |
| AI SDK | Vercel AI SDK 6 (`ai`, `@ai-sdk/gateway`, `@ai-sdk/openai` fallback) |
| Animation | Framer Motion 12 |
| Charts | Recharts |
| Export | html2canvas PNG capture, JSON trend export |
| Search | SerpApi |
| Database / Cache | Upstash Serverless Redis (Optional) |
| Protocol | Model Context Protocol (MCP) |

## Quick Start

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env.local
# Fill in your keys in .env.local

# Run development server
npm run dev

# Optional: prune local JSON reports and usage records
npm run cleanup:local-data
```

Open [http://localhost:3002](http://localhost:3002) and navigate to `/audit`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AI_GATEWAY_API_KEY` | Preferred for AI model calls | Vercel AI Gateway key |
| `HIREPROOF_MODEL` | Optional | AI Gateway model path, defaults to `openai/gpt-4o-mini` |
| `MODEL_PROVIDER_KEY` | Fallback for live mode | OpenAI-compatible API key |
| `SERPAPI_API_KEY` | For live mode | SerpApi key for web evidence |
| `APP_BASE_URL` | For agent loop | Base URL for internal MCP calls |
| `AGENT_API_KEY` | Optional | API key for headless agent access |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash DB URL for global persistence/rate limits |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Token for global persistence/rate limits |
| `SLACK_BOT_TOKEN` | Optional | Enables live ChatSDK Slack bot replies |
| `SLACK_SIGNING_SECRET` | Optional | Verifies Slack webhook signatures |
| `WORKFLOW_SECRET` | Optional | Enables protected WDK workflow starts |

Demo mode works without any API keys.

## API Reference

### `POST /api/audit` — Frontend SSE Stream
Streams real-time agent progress via Server-Sent Events. Used by the web UI.

### `POST /api/v1/audit` — Headless Agent API
Returns pure JSON. Requires `x-api-key` header. Supports `webhook_url` for async.

```bash
curl -X POST https://hireproof-sigma.vercel.app/api/v1/audit \
  -H "Content-Type: application/json" \
  -H "x-api-key: hireproof_agent_demo_key" \
  -d '{"text": "Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram."}'
```

### `POST /api/mcp` — MCP Tool Server
Execute individual investigation tools. Requires `x-api-key` header.

## Chrome Extension Local Install

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` folder
4. Use the local extension build for demo/testing only until a public store listing is verified

## Demo Mode

Three seeded scenarios work without any API keys:
- **High-Risk** — Telegram-based PHP 80k/week internship scam
- **Caution** — Ambiguous listing with incomplete company signals
- **Safe** — Credible listing with matching company, role, and evidence

## Architecture

```
app/
├── page.tsx                    Landing page
├── audit/page.tsx              Investigation workspace (SSE consumer)
├── audit/[id]/page.tsx         Shareable permalink view
├── history/page.tsx            Local report history
├── api/audit/route.ts          SSE streaming endpoint
├── api/v1/audit/route.ts       Headless agent API (JSON + webhooks)
├── api/mcp/route.ts            MCP tool server
├── api/chat/hireproof/route.ts ChatSDK status/reply endpoint
├── api/webhooks/slack/route.ts Slack webhook adapter
├── api/workflows/audit/route.ts WDK workflow start route
components/
├── audit-form.tsx              Omni-modal input (text + image + voice)
├── result-screen.tsx           Animated verdict display
├── risk-radar-chart.tsx        5-axis Recharts radar
├── voice-input-button.tsx      Web Speech API input
├── theme-toggle.tsx            Dark mode switch
lib/
├── schemas.ts                  Zod schemas and types
├── risk-scorer.ts              Deterministic scoring engine
├── serpapi.ts                  SerpApi wrapper functions
├── rate-limit.ts               Hybrid Upstash/In-memory rate limiter
├── db.ts                       Hybrid Upstash/JSON file persistence
├── generate-pdf.ts             Legacy PDF helpers retained for future dossier work
extension/
├── manifest.json               Chrome Manifest V3
├── popup.html/js/css           Extension popup UI
sdk/
├── index.ts                    TypeScript SDK logic
├── package.json                NPM configuration
docs/
├── [Live Documentation Portal](https://hireproof-sigma.vercel.app/docs)
├── security.md                 Threat model & defenses (Legacy)
```

## License

ISC
