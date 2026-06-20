# HireProof Platform Proof Status

Last checked: 2026-06-20

## Summary

Option C is closed for core production credential/readiness proof, WDK accepted-run proof, Slack screenshot proof, production audit API smoke proof, Discord/Telegram production credential readiness, and the controlled Discord/Telegram ChatSDK proof gates.

Final submission status:

- Ready to claim: production web audit flow, API smoke proof, Slack ChatSDK screenshot proof, AI Gateway readiness, WDK accepted-run proof, and Discord/Telegram credential plus webhook readiness.
- Ready to describe as implemented: Discord, Telegram, and optional provider adapter ChatSDK routes and webhook routes.
- Not ready to claim as complete for strict live platform proof: WhatsApp/Zernio until the provider credentials and real proof evidence are available.
- Next blocker: complete WhatsApp/Zernio live proof or record an explicit approved deferral.

- Vercel Production has `WORKFLOW_SECRET`, `HIREPROOF_MODEL`, Redis REST storage, `REDIS_URL`, Slack credentials, Discord credentials, Telegram credentials, AI Gateway credentials, `MODEL_PROVIDER_KEY`, and `SERPAPI_API_KEY` configured.
- Production is served through the stable alias `https://hireproof.tech`.
- Production `/api/integrations/proof` reports core readiness separately from optional platform proof: `status` / `coreStatus` are `ready` when Slack, Workflow, and AI Gateway are ready, while `optionalStatus` tracks Discord, Telegram, and WhatsApp/Zernio.
- Production WDK proof passed: `/api/workflows/audit` accepted a run and returned `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- Production ChatSDK reply proof passed through `/api/chat/hireproof` and returned a formatted HireProof verdict plus report link.
- Multi-platform ChatSDK wiring now includes Discord, Telegram, and WhatsApp/Zernio behind their own readiness gates. The latest strict proof snapshot shows Discord and Telegram ready; WhatsApp/Zernio remains credential-gated.
- Live proof runbook for the pending platforms is documented in `docs/live-chat-platform-proof-plan.md`.
- Controlled proof checker is available as `npm run proof:chat-live`; the latest snapshot is `docs/demo/live-chat-proof-check-latest.json`.
- SEO/social crawl proof is available as `npm run proof:crawl-social`.
- Local Web Vitals route proof is available as `npm run proof:web-vitals`.
- June 15 local security proof passed after overriding Workflow's transitive `esbuild` dependency to `0.28.1`; `npm run audit:security` reports `found 0 vulnerabilities`, and `npm run test:security` passed `337` tests.
- Local WDK proof passed: `/api/workflows/audit` accepted a run and returned `wrun_01KQD72F2DVABS2KSFKABWAKXR`.
- Local ChatSDK reply proof passed through `/api/chat/hireproof` and returned a formatted HireProof verdict plus report link.
- Local platform readiness passed for Workflow and AI Gateway with the local proof environment.
- Slack screenshot proof is captured at `docs/demo/Screenshot 2026-04-30 024756.jpg`. Archive endpoint logs if judge-level proof beyond the screenshot is needed.
- Production audit API smoke passed after the Redis env hardening fix: `POST /api/v1/audit` returned a High-Risk demo report with score `92`.
- **Forensic Export Proof**: Verified that `generatePdfDossier` and `buildTrendsCsvExport` are wired to the production UI, allowing for multi-format evidence persistence.
- Vercel 500-log check after the final smoke returned no new logs.
- June 15 local pro-research proof passed on `http://127.0.0.1:3029`: crawl/social proof passed and Web Vitals proof passed for `/`, `/audit`, `/demo/linkedin`, `/docs`, and `/lab`.

## Submission Positioning Boundary

Use the proof above to support the current product, not to overclaim future capability.

- Narrow-domain framing: HireProof is an employment-fraud trust-and-safety agent. Job scams are the focused wedge because users need fast, evidence-backed decisions before they apply or share personal data.
- Risk-model framing: the current scorer is a transparent evidence-weighted safety policy. Do not claim continuous learning, adaptive ML, or in-house deepfake detection as shipped functionality.
- WDK framing: claim a production-accepted workflow run only. The next milestone is a durable investigation timeline with intake, evidence checks, scoring, report creation, callback delivery, and retry history.
- Near-term proof roadmap: complete WhatsApp/Zernio live proof if it remains in scope, or record an explicit approved deferral. Capture extra Discord/Telegram screenshots only if reviewers ask for manual screenshots beyond the controlled proof artifacts.

## Vercel Environment State

Configured in Production:

- `WORKFLOW_SECRET`
- `HIREPROOF_MODEL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `MODEL_PROVIDER_KEY`
- `SERPAPI_API_KEY`
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_PUBLIC_KEY`
- `DISCORD_APPLICATION_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `REDIS_URL`
- `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_API_KEY`

Still useful for full live Option C:

- A fresh Slack event log capture if judges require endpoint-level proof beyond the existing screenshot. Recent Vercel log searches did not return the original Slack webhook request.
- WhatsApp/Zernio event capture after configuring `ZERNIO_API_KEY` and `ZERNIO_WEBHOOK_SECRET` in production.
- Extra Discord/Telegram event screenshots only if reviewers require manual screenshots beyond the controlled proof artifacts.

## Production Proof Results

Production route checks were run against `https://hireproof.tech`.

### Readiness

`/api/integrations/proof` returned:

- Overall/core status: `ready`
- Optional platform status tracks public chat proof for Discord, Telegram, and WhatsApp/Zernio.
- Slack: `ready`
- Discord: `ready`
- Telegram: `ready`
- WhatsApp/Zernio: credential-gated unless `ZERNIO_API_KEY`, `ZERNIO_WEBHOOK_SECRET`, and `REDIS_URL` are configured.
- Workflow: `ready`
- AI Gateway: `ready`

`/api/health` returned:

- Storage: `redis`
- Live search: `true`
- Model: `true`
- AI Gateway: `true`
- OpenAI-compatible fallback: `true`

### Audit API

`POST /api/v1/audit` with a configured API key and `mode=demo` returned:

- Verdict: `high-risk`
- Risk score: `92`
- Mode: `demo`
- Source: `api`

`POST /api/audit` returned an SSE result event containing the High-Risk demo report.

### WDK

`POST /api/workflows/audit` with the production workflow secret returned:

- Status: `accepted`
- Track: `Vercel Workflow`
- Run ID: `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`
- Message: `Workflow run accepted by WDK.`
- Callback URL: `https://example.com/hireproof-callback`

### ChatSDK

`POST /api/chat/hireproof` returned:

- Status: `ChatSDK Agents verdict formatted.`
- Platform: `local`
- A formatted verdict reply
- A production report URL under `/audit/chat_...`

This proves the shared ChatSDK reply path in production. Slack workspace proof is represented by the screenshot in `docs/demo/Screenshot 2026-04-30 024756.jpg`.

The latest controlled strict-live proof shows Discord and Telegram ready through the shared ChatSDK reply path. WhatsApp/Zernio shares the reply formatter and persistence path but remains credential-gated, so strict live proof still fails until that platform is proven or explicitly deferred.

## Local Proof Results

Local route checks were run against `http://localhost:3002`.

### Readiness

`/api/integrations/proof` returned:

- Overall status: `credential-gated`
- Slack: `credential-gated`
- Discord: `credential-gated`
- Telegram: `credential-gated`
- optional provider adapters: `backend-gated`
- Workflow: `ready`
- AI Gateway: `ready`

### WDK

`POST /api/workflows/audit` with a local-only workflow secret returned:

- Status: `accepted`
- Track: `Vercel Workflow`
- Run ID: `wrun_01KQD72F2DVABS2KSFKABWAKXR`
- Message: `Workflow run accepted by WDK.`
- Callback URL: `https://example.com/hireproof-callback`

### ChatSDK

`POST /api/chat/hireproof` returned:

- Status: `ChatSDK Agents verdict formatted.`
- Platform: `local`
- A formatted verdict reply
- A local report URL under `/audit/chat_...`

This proves the shared ChatSDK reply path, but not a real Slack event.

Local `/api/chat/hireproof` can exercise shared reply paths, but those local checks are not real platform events.

## Verification Gates

The current working tree passed:

- `npm run audit:security`
- `npm run test:security`
- `node --test test/download-hardening.test.mjs test/polish-hardening.test.mjs`
- `npm run lint`
- `npm run build`
- `npm run proof:crawl-social -- --url http://127.0.0.1:3029`
- `HIREPROOF_PROOF_BASE_URL=http://127.0.0.1:3029 npm run proof:web-vitals`
- `git diff --check` with only CRLF warnings

June 15 proof artifacts, refreshed after the checkpoint-manifest pre-check and cursor guard watchdog stabilization:

- `artifacts/seo-crawl-preview/hireproof-crawl-social-2026-06-15T06-18-30-825Z.json`
- `artifacts/web-vitals/hireproof-web-vitals-2026-06-15T06-18-56-383Z.json`

These are local production-build proof artifacts. Production proof still requires checkpoint,
push, deploy, and live rerun on `https://hireproof.tech`.

Current-production baseline proof also passed on 2026-06-15: `/api/health` returned `status: ok`
with `readiness.state: ready`, and `npm run proof:crawl-social -- --url https://hireproof.tech`
passed with artifact `artifacts/seo-crawl-preview/hireproof-crawl-social-2026-06-15T08-01-26-809Z.json`.
This live crawl proves the currently deployed production baseline, not the uncheckpointed dirty stack.

## Production Proof Follow-Up

1. Capture a fresh Slack/Vercel request log only if endpoint-level Slack proof is required beyond the screenshot.
2. For WhatsApp/Zernio live proof, follow `docs/live-chat-platform-proof-plan.md`.
3. Re-run production smoke checks before the final submission:

```powershell
Invoke-RestMethod https://hireproof.tech/api/integrations/proof
Invoke-RestMethod https://hireproof.tech/api/chat/hireproof
Invoke-RestMethod https://hireproof.tech/api/workflows/audit
```

Slack screenshot proof is already captured. Keep the screenshot with the submission materials and add logs only if needed.

Use `npm run proof:chat-live` for the controlled ChatSDK proof check. `npm run proof:chat-live:strict` currently fails only until WhatsApp/Zernio has credentials, provider webhooks, and real event proof, or until that requirement is explicitly deferred.

