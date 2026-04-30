# HireProof Triple-Track Coverage

## Positioning

HireProof should be presented as one product: a proof-backed job-post verification agent.

The tracks are delivery layers for the same agent, not separate product directions:

- Web users paste a suspicious job post and get a verdict.
- Other agents call the same checks through MCP or API.
- Chat communities can ask the same agent to review suspicious posts in Slack or Discord.
- Longer investigations can run asynchronously and notify users when the report is ready.

## Track Map

### v0 + MCPs

Current strongest implemented track.

- v0-style Next.js app experience.
- Runtime MCP tools for company presence, news reputation, job comparison, and local presence.
- Live evidence via SerpApi when configured.
- Shareable report UI and deterministic demo scenarios.
- **Compliance & Evidence Layer:** Forensic PDF Dossier, Verified Safety Certificates, and CSV/JSON trend exports for taking evidence off-platform.

Submission line:

> HireProof is a v0-built AI app that connects to MCP investigation tools to verify suspicious job posts with live evidence.

### ChatSDK Agents

Implemented and live-tested in Slack with screenshot evidence.

- `chat`, `@chat-adapter/slack`, and `@chat-adapter/state-redis` are installed.
- `/api/webhooks/slack` handles Slack events through `Chat.webhooks.slack`.
- `lib/hireproof-bot.ts` registers `onNewMention` and `onSubscribedMessage`, subscribes to threads, runs the HireProof verdict formatter, and replies with a report link.
- `/api/chat/hireproof` remains a local test endpoint for demoing the chat-native reply shape without Slack credentials.
- Production Slack proof was captured on April 30, 2026: a real `@HireProof` mention returned a High-Risk verdict with evidence summary.
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

Submission line:

> HireProof uses durable workflows to run longer job-post investigations in the background and notify users when evidence-backed reports are ready.

## Demo Strategy

Lead with the working product:

1. Paste a suspicious job post into `/audit`.
2. Show the agent extracting claims and calling evidence tools.
3. Open the final Safe, Caution, or High-Risk report.
4. Explain that MCP/API, ChatSDK, and WDK are three surfaces for the same verification core.

For the final demo, call ChatSDK "live-tested in Slack with screenshot proof." Show WDK as a production-accepted workflow run using `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.

## Guardrails

- Do not describe HireProof as a generic security platform.
- Do not claim more than accepted Workflow execution unless a completed workflow result is captured.
- Keep the product sentence centered on job posts, recruiter messages, evidence, and apply-before-you-trust decisions.
