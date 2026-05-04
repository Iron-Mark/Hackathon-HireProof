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
| npm packages | Published and package-proofed | `@hireproof/cli`, `@hireproof/langchain`, `hireproof-sdk`, `n8n-nodes-hireproof` |
| HireProof CLI | npm-published, tested, and screenshot-proven | `@hireproof/cli@1.0.0`, `/docs/cli`, `public/cli-tui-screenshot*.png` |
| Native integrations ZIP | Live download | `/downloads/hireproof-native-integrations.zip` |
| Chrome extension ZIP | Live download fallback | `/downloads/hireproof-extension.zip` |
| Docker packaging | Implemented | `Dockerfile`, `docker-compose.yml`, `npm run docker:*` |
| PDF/PNG/CSV exports | Implemented | result screen and trends dashboard |
| Verified-only safer alternatives | Implemented | Alternatives require sourced comparable-job evidence |
| Demo fixture labeling | Implemented | Fixture snackbar, visible result warning, fixture evidence wording |
| Live audit guardrails | Implemented | Queue throttling, SerpApi circuit breaker, cache telemetry |
| Evidence provider status UI | Implemented locally | Audit report panel for SerpApi, RDAP, DNS, Safe Browsing, CT, threat-intel, registry, and urlscan statuses |

## Pending External Proof

| Area | Pending item | Why it is pending |
| --- | --- | --- |
| Chrome Web Store | Public listing approval | Requires developer-dashboard submission and Google review |
| Discord | Real message screenshot and matching webhook log | Credentials/webhook are ready, but live event proof is still needed |
| Additional chat providers | Credentials plus real event proof | Requires provider account credentials and real event capture |
| npm package version bumps | Future package releases after `1.0.0` | Requires version bump and owner publish action |
| n8n community node | Directory/community verification beyond npm package | Requires n8n review after local install screenshots |
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

## Latest Evidence Funnel Smoke

Checked on 2026-05-04 against `https://hireproof-sigma.vercel.app/api/audit` with production `Origin` / `Referer` headers:

- Input claim: Vercel role with `https://vercel.com/careers` and `recruiting@vercel.com`
- Mode: `live`
- Verdict: `caution`
- Risk score: `45`
- Evidence count: `11`
- Green flags: `6`
- Red flags: `4`
- Provider statuses:
  - SerpApi: `ok`
  - DNS: `ok`
  - RDAP: `degraded`
  - Certificate Transparency: `degraded`
  - Google Safe Browsing: `not-live`

This proves the evidence broker status object is returned in live SSE results. It also shows the current production boundary: Safe Browsing is not live until `GOOGLE_SAFE_BROWSING_API_KEY` is configured, and RDAP/Certificate Transparency can degrade without blocking the audit.

## Latest Provider Status UI Smoke

Checked locally on 2026-05-04 after Phase 3:

- Local report: `/audit/report_1777857241946`
- Input: Vercel role with `https://vercel.com/careers` and `recruiting@vercel.com`
- Provider keys present: SerpApi, RDAP, DNS, Safe Browsing, Certificate Transparency, Threat Intel, Company Registry, urlscan
- Browser check: provider-status panel rendered at `375px` and `1280px`
- Overflow check: no horizontal overflow at either viewport

This proves the UI can surface the provider-status object returned by live audit results. Production deployment still requires committing and pushing the Phase 3 UI changes.

## Latest Package Proof

Checked on 2026-05-04 from clean temporary npm projects:

- `npx @hireproof/cli --help`: passed.
- `npx @hireproof/cli audit --mode demo --json`: passed, returned High-Risk, score `92`.
- `@hireproof/langchain@1.0.0` with `@langchain/core`: passed, returned High-Risk and `shouldContinue: false`.
- `n8n-nodes-hireproof@1.0.0`: passed metadata check for credentials and node registration.
- `hireproof-sdk@1.0.0`: published package had a native ESM default-import mismatch.
- `hireproof-sdk@1.0.1`: published and verified from a clean npm install. ESM default import, ESM named import, CommonJS named export, and demo audit all pass.

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

