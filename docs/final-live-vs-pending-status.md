# Final Live vs Pending Status

Last checked: 2026-05-04

This is the concise status boundary for submission, demos, and reviewer conversations.

## Live / Repo-Controlled

| Area | Status | Evidence path |
| --- | --- | --- |
| Stable production site | Live | `https://hireproof-sigma.vercel.app` |
| Web audit flow | Implemented | `/audit` and demo scenarios |
| Screenshot OCR audit path | Implemented and production-smoke-proven | Google Vision OCR evidence receipt, Tesseract fallback in repo |
| Screenshot privacy default | Implemented | Screenshot reports are excluded from Explore/Trends by default |
| Public job URL enrichment | Implemented | Supported job URLs are resolved before claim extraction |
| Demo audit API | Live | `POST /api/v1/audit` with `hireproof_agent_demo_key` |
| Live SerpApi audit path | Live and smoke-proven | `POST /api/v1/audit` with `mode=live`, clean Canva extraction, and live evidence |
| MCP investigation tools | Implemented | `/api/mcp` and docs |
| ChatSDK shared bot path | Implemented | `/api/chat/hireproof`, `/api/webhooks/*` |
| Slack proof | Screenshot-proven | `docs/demo/Screenshot 2026-04-30 024756.jpg` |
| Telegram proof | Live delivery proven | `docs/platform-proof-status.md` |
| WDK route | Production accepted-run proven | run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5` |
| Native automation packs | Repo-shipped and validated | `integrations/`, `packages/hireproof-langchain`, `/docs/automations` |
| HireProof CLI | Repo-shipped, tested, and screenshot-proven | `packages/hireproof-cli`, `/docs/cli`, `public/cli-tui-screenshot*.png` |
| Native integrations ZIP | Live download | `/downloads/hireproof-native-integrations.zip` |
| Chrome extension ZIP | Live download fallback | `/downloads/hireproof-extension.zip` |
| Docker packaging | Implemented | `Dockerfile`, `docker-compose.yml`, `npm run docker:*` |
| PDF/PNG/CSV exports | Implemented | result screen and trends dashboard |
| Verified-only safer alternatives | Implemented | Alternatives require sourced comparable-job evidence |
| Demo fixture labeling | Implemented | Fixture snackbar, visible result warning, fixture evidence wording |
| Live audit guardrails | Implemented | Queue throttling, SerpApi circuit breaker, cache telemetry |

## Pending External Proof

| Area | Pending item | Why it is pending |
| --- | --- | --- |
| Chrome Web Store | Public listing approval | Requires developer-dashboard submission and Google review |
| Discord | Real message screenshot and matching webhook log | Credentials/webhook are ready, but live event proof is still needed |
| WhatsApp/Zernio | Credentials plus real event proof | Requires Zernio account credentials and provider event |
| npm package | Publish `@hireproof/langchain` | Requires npm account ownership and publish action |
| npm package | Publish `@hireproof/cli` | Requires npm account ownership and publish action |
| n8n community node | Community listing approval | Requires n8n review after local install screenshots |
| Make Custom App | Make review approval | Requires Make developer account and review flow |
| WDK completed transcript | Completed durable run with callback proof | Current proof is accepted-run only |

## Latest Live SerpApi Smoke

Checked after checkpoint `0b83430`:

- Route: `POST https://hireproof-sigma.vercel.app/api/v1/audit`
- Mode: `live`
- Credential mode: `platform-env`
- Input claim: `Company: Canva. Role: Product Designer.`
- Extracted company: `Canva`
- Extracted role: `Product Designer`
- Verdict: `safe`
- Risk score: `17`
- Evidence count: `6`
- Evidence types: `Company Check`, `Local Presence`, `Reputation`

This proves the live search/model path is production-wired. It does not guarantee every audit will return every possible evidence class; comparable jobs and local/search coverage still depend on provider result availability.

## Latest Screenshot OCR Smoke

Checked after the OCR/privacy checkpoint:

- Route: `POST https://hireproof-sigma.vercel.app/api/audit`
- Input type: generated screenshot data URL
- OCR source: `Screenshot OCR: Google Vision`
- OCR type: `Screenshot OCR`
- Verdict: `high-risk`
- Risk score: `100`
- Public listing flag: `false`

This proves the production screenshot path can extract OCR evidence through Google Vision and that screenshot-derived reports are not publicly listed by default. It does not claim deepfake detection or specialist image forensics.

## Current Trust Controls

- Timeline uses captured stream events for live browser audits; demo fixture mode uses fixture events and does not claim fresh source checks.
- Safer alternatives are verified-only: sourced comparable-job evidence is required before an alternative is shown.
- Demo fixture mode uses seeded fixtures for deterministic demos and offline fallback. It should not be described as live evidence.
- Live SerpApi checks are protected by queue throttling, cache reuse, similarity cache, and a SerpApi circuit breaker.

## Safe Submission Wording

Use:

> HireProof is a production-deployed job-post verification agent with web, API, MCP, ChatSDK, WDK, Chrome extension package, and repo-shipped n8n, Make, and LangChain integration surfaces.

Avoid:

> HireProof is published on the Chrome Web Store, npm, n8n marketplace, and Make marketplace.

Avoid:

> The WDK workflow completed a full durable investigation transcript.

Use instead:

> The WDK route has production accepted-run proof; completed timeline and callback evidence are the next milestone.

Use for demo fixtures:

> Demo mode uses seeded fixtures for deterministic demos and offline fallback. Live evidence mode is separate.

Use for alternatives:

> Safer alternatives appear only when HireProof has sourced comparable-job evidence. If no sourced comparable jobs are available, the section is hidden.

## Final Pre-Submission Smoke

```powershell
$base='https://hireproof-sigma.vercel.app'
Invoke-RestMethod -Uri "$base/api/health"
Invoke-RestMethod -Uri "$base/api/integrations/proof"
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType 'application/json' -Headers @{'x-api-key'='hireproof_agent_demo_key'} -Body (@{text='Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'; mode='demo'} | ConvertTo-Json)
Invoke-WebRequest -UseBasicParsing "$base/downloads/hireproof-native-integrations.zip"
Invoke-WebRequest -UseBasicParsing "$base/downloads/hireproof-extension.zip"
```
