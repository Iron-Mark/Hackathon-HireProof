# HireProof Current Status

Last checked: 2026-06-15

HireProof is core production-ready on the stable production URL:

- Production URL: `https://hireproof.tech`
- Production deployments are verified through the stable alias; deployment-specific preview URLs are intentionally not treated as durable submission links.
- GitHub `main` is the source of truth for the latest submitted commit. This local checkout currently has June 15 pro-research proof/docs changes ahead of that published baseline until they are checkpointed, pushed, deployed, and live-verified.

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
- Workflow's transitive `esbuild` dependency is pinned through an override to `0.28.1`; the local security audit now reports zero vulnerabilities.
- **Forensic PDF Engine**: Wired `generatePdfDossier` and `generateCertificate` to the `ResultScreen` UI. Investigators can now download full dossiers and safety certificates.
- **CSV Data Export**: Implemented `buildTrendsCsvExport` and added a dedicated CSV download button to the Trends dashboard.
- **Docker Orchestration**: Validated the `Dockerfile` and `docker-compose.yml` (ports 3002:3002) as production-ready.
- **Automation Integrations**: `npm run integrations:build`, `npm run integrations:test`, and `npm run integrations:package` validate native package metadata, Make source JSON, LangChain tool helpers, demo API smoke, and the generated source bundle.
- **Pro-research SEO/Web Vitals intake**: the HireProof pro-research archive is mirrored under `docs/spec/hireproof`; homepage static content is split back into server-rendered output with small client islands for the demo panel/link tracking; `/audit` and `/lab` render route chrome from server pages; `proof:crawl-social` and `proof:web-vitals` provide repeatable local proof gates.

## Production Proof

- `GET /api/health` returns `status: ok`, public readiness, and public cost-posture flags only. Detailed provider readiness stays in authenticated developer surfaces.
- `POST /api/v1/audit` with `mode=live` now smoke-proves the SerpApi/model path on production with clean Canva claim extraction and six live evidence items.
- `GET /api/integrations/proof` returns `status: ready` / `coreStatus: ready` when Slack, Workflow, and AI Gateway are ready. Discord and Telegram now report `ready`; Optional provider adapters remain credential-gated until enabled.
- `POST /api/v1/audit` with a configured API key and `mode=demo` returns a High-Risk demo report with score `92`.
- `POST /api/audit` SSE returns a result event for the High-Risk demo.
- `POST /api/chat/hireproof` returns a formatted ChatSDK verdict.
- Vercel production 500-log check after the final smoke returned no new logs.
- Local June 15 pro-research proof passed against a production build on `http://127.0.0.1:3029`: `proof:crawl-social` verified robots, sitemap, canonical sitemap URLs, private-route exclusion, and social tags; `proof:web-vitals` verified `/`, `/audit`, `/demo/linkedin`, `/docs`, and `/lab` with `200` status, CLS `0`, LCP under `2500ms`, long-task total under `300ms`, and long-task max under `200ms`.
- Local June 15 dependency/security proof passed: `npm run audit:security` reports `found 0 vulnerabilities` after the `esbuild@0.28.1` override, `npm run test:security` passed `337` tests, and `npm run lint`, focused hardening tests, and `npm run build` still pass.

## Honest Boundaries

- Demo fixtures are intentional seeded examples for deterministic demos and offline fallback. Do not describe demo-mode evidence as live evidence.
- Timeline uses captured stream events for live browser audits and fixture events for demo reports; avoid describing demo timelines as proof that live checks ran.
- Verified-only safer alternatives mean the app may show no alternatives when sourced comparable jobs are unavailable.
- SerpApi circuit breaker and cache telemetry are operational safeguards, not evidence that every provider returned complete coverage.
- Screenshot reports use OCR text for analysis, but raw screenshots are not stored as report evidence items.
- Slack proof is represented by the captured screenshot at [`docs/demo/Screenshot 2026-04-30 024756.jpg`](demo/Screenshot%202026-04-30%20024756.jpg). Recent Vercel log searches for the original Slack webhook request returned no matching archived logs, so do not claim endpoint-level Slack logs unless a fresh Slack event is captured.
- WDK proof is an accepted production workflow run, not a completed callback result. Use run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- Discord and Telegram are optional provider expansions that are now production credential-ready with registered webhooks. Discord still needs a real message screenshot and matching logs before live delivery can be claimed. Telegram delivery is already screenshot/log-proven, but the report-link screenshot should be re-captured after the base-URL fallback fix.
- Additional provider adapters remain future-ready behind backend credential gates.
- The Chrome extension has a store-ready package workflow, privacy disclosure, and listing draft. No public Chrome Web Store listing is claimed until Google review publishes one.
- **Dockerized Packaging**: Fully implemented for production standalone deployment, with Compose orchestration, healthcheck, and local smoke script.
- npm packages are published for the CLI, LangChain tool, TypeScript SDK, and n8n node. Make review and any separate n8n directory/community verification still require external account actions.
- The June 15 pro-research SEO/Web Vitals and security-audit work is local proof only until the dirty working tree is checkpointed, pushed, deployed, and rechecked on `https://hireproof.tech`.

## Final Submission Checklist

Run these immediately before submitting:

```powershell
npm run lint
npm run audit:security
npm run test:security
npm run build
npm run integrations:build
npm run integrations:test
npm run integrations:package
npm run proof:crawl-social
$env:HIREPROOF_PROOF_BASE_URL='http://127.0.0.1:3029'
npm run proof:web-vitals

$base='https://hireproof.tech'
$env:HIREPROOF_PROOF_BASE_URL=$base
npm run proof:web-vitals
Invoke-RestMethod -Uri "$base/api/health"
Invoke-RestMethod -Uri "$base/api/integrations/proof"
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType 'application/json' -Headers @{'x-api-key'=$env:HIREPROOF_API_KEY} -Body (@{text='Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'; mode='demo'} | ConvertTo-Json)
```

Do not treat bare `npm run proof:web-vitals` as production proof; the script defaults to a
local base URL unless `HIREPROOF_PROOF_BASE_URL` is set.

