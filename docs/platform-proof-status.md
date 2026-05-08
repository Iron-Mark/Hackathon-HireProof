# HireProof Platform Proof Status

Last checked: 2026-05-03

## Summary

Option C is closed for core production credential/readiness proof, WDK accepted-run proof, Slack screenshot proof, production audit API smoke proof, Discord/Telegram production credential readiness, and Telegram live delivery proof.

Final submission status:

- Ready to claim: production web audit flow, API smoke proof, Slack ChatSDK screenshot proof, Telegram ChatSDK delivery proof, AI Gateway readiness, WDK accepted-run proof, and Discord/Telegram credential plus webhook readiness.
- Ready to describe as implemented: Discord, Telegram, and optional provider adapter ChatSDK routes and webhook routes.
- Not ready to claim as live-proven: Discord and optional provider adapter message delivery until real screenshots/logs are captured. Telegram delivery is proven, but the report-link screenshot should be re-captured after the base-URL fallback fix.
- Next blocker: send one real Discord message and re-test Telegram for the report-link screenshot.

- Vercel Production has `WORKFLOW_SECRET`, `HIREPROOF_MODEL`, Redis REST storage, `REDIS_URL`, Slack credentials, Discord credentials, Telegram credentials, AI Gateway credentials, `MODEL_PROVIDER_KEY`, and `SERPAPI_API_KEY` configured.
- Production is served through the stable alias `https://hireproof.tech`.
- Production `/api/integrations/proof` reports core readiness separately from optional platform proof: `status` / `coreStatus` are `ready` when Slack, Workflow, and AI Gateway are ready, while `optionalStatus` tracks Discord and Telegram.
- Production WDK proof passed: `/api/workflows/audit` accepted a run and returned `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- Production ChatSDK reply proof passed through `/api/chat/hireproof` and returned a formatted HireProof verdict plus report link.
- Multi-platform ChatSDK wiring now includes Discord, Telegram, and optional provider adapters behind their own readiness gates. Telegram live delivery is screenshot/log-proven; Discord is production credential-ready; optional provider adapters remain backend-gated.
- Live proof runbook for the pending platforms is documented in `docs/live-chat-platform-proof-plan.md`.
- Controlled proof checker is available as `npm run proof:chat-live`; the latest snapshot is `docs/demo/live-chat-proof-check-latest.json`.
- Local WDK proof passed: `/api/workflows/audit` accepted a run and returned `wrun_01KQD72F2DVABS2KSFKABWAKXR`.
- Local ChatSDK reply proof passed through `/api/chat/hireproof` and returned a formatted HireProof verdict plus report link.
- Local platform readiness passed for Workflow and AI Gateway with the local proof environment.
- Slack screenshot proof is captured at `docs/demo/Screenshot 2026-04-30 024756.jpg`. Archive endpoint logs if judge-level proof beyond the screenshot is needed.
- Production audit API smoke passed after the Redis env hardening fix: `POST /api/v1/audit` returned a High-Risk demo report with score `92`.
- **Forensic Export Proof**: Verified that `generatePdfDossier` and `buildTrendsCsvExport` are wired to the production UI, allowing for multi-format evidence persistence.
- Vercel 500-log check after the final smoke returned no new logs.

## Submission Positioning Boundary

Use the proof above to support the current product, not to overclaim future capability.

- Narrow-domain framing: HireProof is an employment-fraud trust-and-safety agent. Job scams are the focused wedge because users need fast, evidence-backed decisions before they apply or share personal data.
- Risk-model framing: the current scorer is a transparent evidence-weighted safety policy. Do not claim continuous learning, adaptive ML, or in-house deepfake detection as shipped functionality.
- WDK framing: claim a production-accepted workflow run only. The next milestone is a durable investigation timeline with intake, evidence checks, scoring, report creation, callback delivery, and retry history.
- Near-term proof roadmap: capture Discord live-provider proof, configure optional provider adapters if that proof remains in scope, and re-capture the Telegram report-link screenshot after the permalink fix.

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
- Live Discord event capture now that credentials and webhooks are ready.
- Telegram report-link screenshot after the platform reply base-URL fallback fix.
- optional provider adapter event captures after configuring `ZERNIO_API_KEY` and `ZERNIO_WEBHOOK_SECRET` in production.

## Production Proof Results

Production route checks were run against `https://hireproof.tech`.

### Readiness

`/api/integrations/proof` returned:

- Overall/core status: `ready`
- Optional platform status tracks public chat proof for Discord and Telegram.
- Slack: `ready`
- Discord: `ready`
- Telegram: `ready`
- Optional provider adapters: credential-gated unless `ZERNIO_API_KEY`, `ZERNIO_WEBHOOK_SECRET`, and `REDIS_URL` are configured.
- Workflow: `ready`
- AI Gateway: `ready`

`/api/health` returned:

- Storage: `redis`
- Live search: `true`
- Model: `true`
- AI Gateway: `true`
- OpenAI-compatible fallback: `true`

### Audit API

`POST /api/v1/audit` with the public demo key returned:

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

Telegram live delivery is proven by a real message screenshot and matching Vercel webhook log. Discord is credential-ready in production with a registered webhook, but live platform proof is still pending a real message screenshot and matching log. Optional provider adapters share the same reply formatter and persistence path but remain credential-gated.

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

- `node --test test/polish-hardening.test.mjs test/runtime-wiring.test.mjs`
- `npm run lint`
- `npm run build`
- `git diff --check` with only CRLF warnings

## Production Proof Follow-Up

1. Capture a fresh Slack/Vercel request log only if endpoint-level Slack proof is required beyond the screenshot.
2. For Discord, Telegram, and optional provider adapter live proof, follow `docs/live-chat-platform-proof-plan.md`.
3. Re-run production smoke checks before the final submission:

```powershell
Invoke-RestMethod https://hireproof.tech/api/integrations/proof
Invoke-RestMethod https://hireproof.tech/api/chat/hireproof
Invoke-RestMethod https://hireproof.tech/api/workflows/audit
```

Slack screenshot proof is already captured. Keep the screenshot with the submission materials and add logs only if needed.

Use `npm run proof:chat-live` for the controlled ChatSDK proof check. Use `npm run proof:chat-live:strict` only after Discord, Telegram, and optional provider adapters all have credentials, provider webhooks, and real event proof.

