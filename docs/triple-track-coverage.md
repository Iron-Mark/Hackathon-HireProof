# HireProof Triple-Track Coverage

## Positioning

HireProof should be presented as one product: a proof-backed employment-fraud trust-and-safety agent.

The product starts with job scams because they combine urgency, financial risk, identity exposure, and fragmented evidence. That focus is the wedge, not the ceiling: the same verification core can expand into broader trust-and-safety workflows without pretending the current product is a generic fraud platform.

The tracks are delivery layers for the same agent, not separate product directions:

- Web users paste a suspicious job post and get a verdict.
- Other agents call the same checks through MCP or API.
- Chat communities can ask the same agent to review suspicious posts in Slack, Telegram, Discord, or WhatsApp-backed channels.
- Longer investigations can run asynchronously and notify users when the report is ready.
- Automation builders can install published npm packages for the CLI, SDK, LangChain, and n8n, or adapt the Make source pack and HTTP templates around the same audit API.

## Track Map

### v0 + MCPs

Current strongest implemented track.

- v0-style Next.js app experience.
- Runtime MCP tools for company presence, news reputation, job comparison, and local presence.
- Live evidence via SerpApi when configured.
- Shareable report UI and deterministic demo scenarios.
- Transparent evidence-weighted risk policy with visible red flags, green flags, and evidence receipts.
- **Compliance & Evidence Layer:** Forensic PDF Dossier, Verified Safety Certificates, and CSV/JSON trend exports for taking evidence off-platform.

Submission line:

> HireProof is a v0-built AI app that connects to MCP investigation tools to verify suspicious job posts with live evidence.

### ChatSDK Agents

Implemented and live-tested in Slack and Telegram with screenshot/log evidence.

- `chat`, `@chat-adapter/slack`, and `@chat-adapter/state-redis` are installed.
- `/api/webhooks/slack` handles Slack events through `Chat.webhooks.slack`.
- `lib/hireproof-bot.ts` registers `onNewMention` and `onSubscribedMessage`, subscribes to threads, runs the HireProof verdict formatter, and replies with a report link.
- `/api/chat/hireproof` remains a local test endpoint for demoing the chat-native reply shape without Slack credentials.
- Production Slack proof was captured on April 30, 2026: a real `@HireProof` mention returned a High-Risk verdict with evidence summary.
- Telegram live delivery proof was captured on May 3, 2026 with a real message screenshot and matching Vercel webhook log.
- Proof screenshot: [`docs/demo/Screenshot 2026-04-30 024756.jpg`](demo/Screenshot%202026-04-30%20024756.jpg).
- A user posts or mentions a suspicious job listing, and the HireProof bot replies with verdict, score, evidence bullets, and a report-ready summary.

Submission line:

> HireProof runs as a ChatSDK Agent for job-seeker communities, using Vercel AI SDK, AI Gateway, and ChatSDK adapters to verify suspicious posts inside chat.

### Vercel Workflow / WDK

Implemented and accepted in production.

- `workflow` is installed and enabled through `workflow/next` in `next.config.js`.
- `lib/workflows/audit-workflow.ts` exports `startAuditWorkflow`.
- `/api/workflows/audit` imports `start` from `workflow/api` and starts the workflow when `WORKFLOW_SECRET` is configured.
- Without workflow credentials, the route returns an honest `credential-required` response instead of pretending a live WDK run happened.
- Production WDK proof was captured on April 30, 2026: `/api/workflows/audit` accepted run `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- The existing `/api/v1/audit` webhook behavior is the natural bridge.
- The roadmap version should expose a durable investigation timeline with intake, evidence checks, scoring, report creation, callback delivery, and retry history.

Submission line:

> HireProof uses durable workflows to run longer job-post investigations in the background and notify users when evidence-backed reports are ready.

### Native Automation Integrations

Implemented, source-packaged, and npm-published where npm is the right distribution channel.

- `integrations/n8n-nodes-hireproof` provides the published package `n8n-nodes-hireproof` with `Run audit` and `Run async audit` operations.
- `integrations/make-hireproof` provides Make Custom App source with API-key connection, sync audit, async audit, and health modules.
- `packages/hireproof-langchain` provides the published package `@hireproof/langchain` with `createHireProofAuditTool`, schema validation, and typed result helpers.
- `packages/hireproof-cli` provides the published package `@hireproof/cli` with rich terminal reports, JSON mode, health/config tools, and the Shield Sentinel TUI.
- `sdk` provides the published package `hireproof-sdk` for typed API clients.
- `public/downloads/hireproof-native-integrations.zip` bundles the source packs for download.
- Portable HTTP templates remain available for n8n workflow import, Make HTTP setup, LangChain standalone use, and curl smoke checks.
- npm publication is complete for the CLI, SDK, LangChain package, and n8n node. Make review and any separate n8n directory/community verification still require external account actions.

## Demo Strategy

Lead with the working product:

1. Paste a suspicious job post into `/audit`.
2. Show the agent extracting claims and calling evidence tools.
3. Open the final Safe, Caution, or High-Risk report.
4. Explain that MCP/API, ChatSDK, and WDK are three surfaces for the same verification core.

For the final demo, call ChatSDK "live-tested in Slack and Telegram with screenshot/log proof." Show WDK as a production-accepted workflow run using `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.

## Guardrails

- Do not describe HireProof as a generic security platform.
- Do not claim continuous learning, adaptive ML, or in-house deepfake detection as current functionality.
- Do not claim more than accepted Workflow execution unless a completed workflow result is captured.
- Keep the product sentence centered on job posts, recruiter messages, evidence, and apply-before-you-trust decisions.

## Roadmap

- Near-term: capture Discord live-provider proof, configure WhatsApp/Zernio if the channel remains in scope, and recapture the Telegram full-report-link screenshot.
- WDK: turn the accepted-run proof into a durable investigation timeline with checkpoints, retries, callbacks, and completed-result evidence.
- Model: add calibrated learning from reviewed cases while preserving explainable scoring.
- Multimodal: improve screenshot/OCR evidence and integrate specialist image or deepfake forensics providers only where they add trustworthy signals.
