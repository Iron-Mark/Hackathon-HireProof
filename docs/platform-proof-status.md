# HireProof Platform Proof Status

Last checked: 2026-04-30

## Summary

Option C is closed for production credential/readiness proof, WDK accepted-run proof, and Slack screenshot proof.

- Vercel Production has `WORKFLOW_SECRET`, `HIREPROOF_MODEL`, Redis REST storage, `REDIS_URL`, Slack credentials, AI Gateway credentials, `MODEL_PROVIDER_KEY`, and `SERPAPI_API_KEY` configured.
- Production is served through the stable alias `https://hireproof-sigma.vercel.app`.
- Production `/api/integrations/proof` returns `ready`: Slack credentials are present, Workflow is ready, and AI Gateway is ready.
- Production WDK proof passed: `/api/workflows/audit` accepted a run and returned `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- Production ChatSDK reply proof passed through `/api/chat/hireproof` and returned a formatted HireProof verdict plus report link.
- Local WDK proof passed: `/api/workflows/audit` accepted a run and returned `wrun_01KQD72F2DVABS2KSFKABWAKXR`.
- Local ChatSDK reply proof passed through `/api/chat/hireproof` and returned a formatted HireProof verdict plus report link.
- Local platform readiness passed for Workflow and AI Gateway with the local proof environment.
- Slack screenshot proof is captured at `docs/demo/Screenshot 2026-04-30 024756.jpg`. Archive endpoint logs if judge-level proof beyond the screenshot is needed.

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
- `REDIS_URL`
- `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_API_KEY`

Still useful for full live Option C:

- Archived request logs for the captured Slack event.

## Production Proof Results

Production route checks were run against `https://hireproof-sigma.vercel.app`.

### Readiness

`/api/integrations/proof` returned:

- Overall status: `ready`
- Slack: `ready`
- Workflow: `ready`
- AI Gateway: `ready`

`/api/health` returned:

- Storage: `redis`
- Live search: `true`
- Model: `true`
- AI Gateway: `true`
- OpenAI-compatible fallback: `true`

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

## Local Proof Results

Local route checks were run against `http://localhost:3002`.

### Readiness

`/api/integrations/proof` returned:

- Overall status: `credential-gated`
- Slack: `credential-gated`
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

## Verification Gates

The current working tree passed:

- `node --test test/polish-hardening.test.mjs test/runtime-wiring.test.mjs`
- `npm run lint`
- `npm run build`
- `git diff --check` with only CRLF warnings

## Production Proof Follow-Up

1. Archive Slack/Vercel request logs for the captured Slack mention.
2. Re-run production smoke checks before the final submission:

```powershell
Invoke-RestMethod https://hireproof-sigma.vercel.app/api/integrations/proof
Invoke-RestMethod https://hireproof-sigma.vercel.app/api/chat/hireproof
Invoke-RestMethod https://hireproof-sigma.vercel.app/api/workflows/audit
```

Slack screenshot proof is already captured. Keep the screenshot with the submission materials and add logs only if needed.
