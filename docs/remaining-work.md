# HireProof Current Status

Last checked: 2026-04-30

HireProof is demo-ready on the stable production URL:

- Production URL: `https://hireproof-sigma.vercel.app`
- Latest verified production deployment: `https://hireproof-2ka3peb8q-iron-marks-projects.vercel.app`
- Latest checkpoint commit: `0a2698b` (`fix(runtime): stabilize production audit checkpoint`)

## Closed Runtime Work

- `explore` reads from the intelligence reports path used by the API.
- `trends` maps the stored report shape into the UI sections it renders.
- Missing-user auth uses a valid dummy `scrypt` hash path.
- `/lab` streams real `/api/audit` SSE events instead of timed fake telemetry.
- ChatSDK package wiring exists for Slack mentions and subscribed messages.
- WDK package wiring exists for `startAuditWorkflow` through `/api/workflows/audit`.
- BYOK settings are relabelled as local verification only and do not imply hosted audits use browser-stored keys.
- Webhook sandbox payloads use the same `buildHireProofWebhookHeaders` HMAC helper as production webhooks.
- Verified badge flow has account-level domains, DNS TXT ownership checks, public embed tokens, status/script endpoints, and developer portal controls.
- Production audit failures from whitespace-padded Redis env values are fixed by trimming Redis env values before client creation.
- Audit and ChatSDK responses no longer fail solely because report persistence has a transient storage issue.

## Production Proof

- `GET /api/health` returns `status: ok`, Redis storage, live search, model, AI Gateway, and OpenAI-compatible fallback ready.
- `GET /api/integrations/proof` returns `status: ready` for Slack, Workflow, and AI Gateway.
- `POST /api/v1/audit` with the public demo key returns a High-Risk demo report with score `92`.
- `POST /api/audit` SSE returns a result event for the High-Risk demo.
- `POST /api/chat/hireproof` returns a formatted ChatSDK verdict.
- Vercel production 500-log check after the final smoke returned no new logs.

## Honest Boundaries

- Slack proof is represented by the captured screenshot at [`docs/demo/Screenshot 2026-04-30 024756.jpg`](demo/Screenshot%202026-04-30%20024756.jpg). Recent Vercel log searches for the original Slack webhook request returned no matching archived logs, so do not claim endpoint-level Slack logs unless a fresh Slack event is captured.
- WDK proof is an accepted production workflow run, not a completed callback result. Use run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- The Chrome extension is local-install only; no public store listing is claimed.
- Docker remains a future packaging item.

## Final Submission Checklist

Run these immediately before submitting:

```powershell
npm run lint
npm run build

$base='https://hireproof-sigma.vercel.app'
Invoke-RestMethod -Uri "$base/api/health"
Invoke-RestMethod -Uri "$base/api/integrations/proof"
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType 'application/json' -Headers @{'x-api-key'='hireproof_agent_demo_key'} -Body (@{text='Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'; mode='demo'} | ConvertTo-Json)
```
