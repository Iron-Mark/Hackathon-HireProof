# HireProof Current Status

Last checked: 2026-05-04

HireProof is core production-ready on the stable production URL:

- Production URL: `https://hireproof.tech`
- Production deployments are verified through the stable alias; deployment-specific preview URLs are intentionally not treated as durable submission links.
- GitHub `main` is the source of truth for the latest submission commit.

## Closed Runtime Work

- `explore` reads from the intelligence reports path used by the API.
- `trends` maps the stored report shape into the UI sections it renders.
- Screenshot OCR is implemented with Google Vision first, Tesseract fallback, image preprocessing, OCR evidence receipts, and report UI treatment.
- Screenshot-derived reports are marked not publicly listed by default, so Explore and Trends exclude them while direct report links still work.
- Public job URL enrichment runs before claim extraction and can flag conflicts between pasted text, OCR text, and resolved job-page content.
- The audit form focuses the main paste box on desktop so users can paste text or screenshots immediately.
- The Live evidence and Demo fixtures tabs include custom explanatory tooltips.
- Demo fixture reports are visibly labeled, show a snackbar warning, use fixture timeline events, and do not present fake source links as live proof.
- Verified-only safer alternatives are enforced: alternatives require sourced comparable-job evidence and demo placeholders are hidden.
- Live audit queue throttling and the SerpApi circuit breaker protect expensive evidence checks from spam, error spikes, and quota spikes.
- Missing-user auth uses a valid dummy `scrypt` hash path.
- `/lab` streams real `/api/audit` SSE events instead of timed fake telemetry.
- ChatSDK package wiring exists for Slack mentions and subscribed messages.
- WDK package wiring exists for `startAuditWorkflow` through `/api/workflows/audit`.
- BYOK settings are relabelled as local verification only and do not imply hosted audits use browser-stored keys.
- Webhook sandbox payloads use the same `buildHireProofWebhookHeaders` HMAC helper as production webhooks.
- Native automation integration source packs now exist for n8n, Make, and LangChain, with portable HTTP templates and a downloadable source bundle documented at `/docs/automations`.
- Verified badge flow has account-level domains, DNS TXT ownership checks, public embed tokens, status/script endpoints, and developer portal controls.
- Production audit failures from whitespace-padded Redis env values are fixed by trimming Redis env values before client creation.
- Audit and ChatSDK responses no longer fail solely because report persistence has a transient storage issue.
- **Forensic PDF Engine**: Wired `generatePdfDossier` and `generateCertificate` to the `ResultScreen` UI. Investigators can now download full dossiers and safety certificates.
- **CSV Data Export**: Implemented `buildTrendsCsvExport` and added a dedicated CSV download button to the Trends dashboard.
- **Docker Orchestration**: Validated the `Dockerfile` and `docker-compose.yml` (ports 3002:3002) as production-ready.
- **Automation Integrations**: `pnpm integrations:build`, `pnpm integrations:test`, and `pnpm integrations:package` validate native package metadata, Make source JSON, LangChain tool helpers, demo API smoke, and the generated source bundle.

## Production Proof

- `GET /api/health` returns `status: ok`, Redis storage, live search, model, AI Gateway, and OpenAI-compatible fallback ready.
- `POST /api/v1/audit` with `mode=live` now smoke-proves the SerpApi/model path on production with clean Canva claim extraction and six live evidence items.
- `GET /api/integrations/proof` returns `status: ready` / `coreStatus: ready` when Slack, Workflow, and AI Gateway are ready. Discord and Telegram now report `ready`; Optional provider adapters remain credential-gated until enabled.
- `POST /api/v1/audit` with the public demo key returns a High-Risk demo report with score `92`.
- `POST /api/audit` SSE returns a result event for the High-Risk demo.
- `POST /api/chat/hireproof` returns a formatted ChatSDK verdict.
- Vercel production 500-log check after the final smoke returned no new logs.

## Honest Boundaries

- Demo fixtures are intentional seeded examples for deterministic demos and offline fallback. Do not describe demo-mode evidence as live evidence.
- Timeline uses captured stream events for live browser audits and fixture events for demo reports; avoid describing demo timelines as proof that live checks ran.
- Verified-only safer alternatives mean the app may show no alternatives when sourced comparable jobs are unavailable.
- SerpApi circuit breaker and cache telemetry are operational safeguards, not evidence that every provider returned complete coverage.
- Screenshot reports use OCR text for analysis, but raw screenshots are not stored as report evidence items.
- Slack proof is represented by the captured screenshot at [`docs/demo/Screenshot 2026-04-30 024756.jpg`](demo/Screenshot%202026-04-30%20024756.jpg). Recent Vercel log searches for the original Slack webhook request returned no matching archived logs, so do not claim endpoint-level Slack logs unless a fresh Slack event is captured.
- WDK proof is an accepted production workflow run, not a completed callback result. Use run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- Discord and Telegram are optional provider expansions that are now production credential-ready with registered webhooks, but live provider proof still requires real messages, screenshots, and matching logs.
- Additional provider adapters remain future-ready behind backend credential gates.
- The Chrome extension has a store-ready package workflow, privacy disclosure, and listing draft. No public Chrome Web Store listing is claimed until Google review publishes one.
- **Dockerized Packaging**: Fully implemented for production standalone deployment, with Compose orchestration, healthcheck, and local smoke script.
- npm packages are published for the CLI, LangChain tool, TypeScript SDK, and n8n node. Make review and any separate n8n directory/community verification still require external account actions.

## Final Submission Checklist

Run these immediately before submitting:

```powershell
npm run lint
npm run build
pnpm integrations:build
pnpm integrations:test
pnpm integrations:package

$base='https://hireproof.tech'
Invoke-RestMethod -Uri "$base/api/health"
Invoke-RestMethod -Uri "$base/api/integrations/proof"
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType 'application/json' -Headers @{'x-api-key'='hireproof_agent_demo_key'} -Body (@{text='Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'; mode='demo'} | ConvertTo-Json)
```

