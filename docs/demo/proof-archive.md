# HireProof Demo Proof Archive

Last checked: 2026-04-30

This file keeps the judge-facing proof artifacts in one place. It intentionally avoids secrets, request headers, tokens, and private Slack workspace identifiers.

## Production URL

- Stable demo: `https://hireproof-sigma.vercel.app`
- Production deployments are checked through the stable alias; deployment-specific preview URLs are not durable submission links.

## Readiness Proof

Production `GET /api/integrations/proof` returned:

- Status: `ready`
- ChatSDK Slack: `ready`
- Vercel Workflow / WDK: `ready`
- AI Gateway: `ready`

Production `GET /api/health` returned:

- Status: `ok`
- Storage: `redis`
- Model configured: `true`
- AI Gateway provider: `true`

Production `POST /api/v1/audit` with the public demo key returned:

- Verdict: `high-risk`
- Risk score: `92`
- Mode: `demo`
- Source: `api`

Production `POST /api/audit` returned an SSE result event containing the High-Risk demo report.

## ChatSDK Slack Proof

- Proof type: real Slack mention to `@HireProof`
- Result: HireProof returned a High-Risk verdict with score, top red flags, and checked evidence categories.
- Screenshot: [`Screenshot 2026-04-30 024756.jpg`](Screenshot%202026-04-30%20024756.jpg)
- Public webhook route: `POST /api/webhooks/slack`
- Local formatted-reply route for demos: `POST /api/chat/hireproof`
- Log archive status: recent Vercel searches for `/api/webhooks/slack` and `Slack` returned no matching archived logs for the original screenshot event. Keep the screenshot as the proof artifact unless a fresh Slack mention is captured.

Use this claim in the submission:

> ChatSDK is live-tested in Slack with screenshot proof. A real `@HireProof` mention returned a High-Risk job-scam verdict.

## Multi-Platform ChatSDK Controlled Check

Latest controlled check artifact:

- File: `docs/demo/live-chat-proof-check-latest.json`
- Strict file: `docs/demo/live-chat-proof-check-strict-latest.json`
- Command: `npm run proof:chat-live`
- Checked production base URL: `https://hireproof-sigma.vercel.app`

Result:

- Slack: `ready`
- Discord: `credential-gated`
- Telegram: `credential-gated`
- WhatsApp/Zernio: `credential-gated`
- Production health: `ok`
- Shared ChatSDK reply path: returned `200`, verdict `high-risk`, score `92`
- Shared reply proof report: see the latest `sharedChatReplyPath.reportUrl` value in the JSON artifact.

Missing production provider credentials:

- Discord: `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`, `DISCORD_APPLICATION_ID`
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, `TELEGRAM_BOT_USERNAME`
- WhatsApp/Zernio: `ZERNIO_API_KEY`, `ZERNIO_WEBHOOK_SECRET`

Use this claim until provider credentials and real message screenshots are captured:

> Discord, Telegram, and WhatsApp/Zernio are implemented and production-reachable behind credential gates. The shared ChatSDK reply path is production-verified, but external provider event delivery is still pending live credentials and real message captures.

## Vercel Workflow / WDK Proof

Production `POST /api/workflows/audit` returned:

- HTTP status: `202`
- Status: `accepted`
- Track: `Vercel Workflow`
- Run ID: `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`
- Message: `Workflow run accepted by WDK.`
- Callback URL used for proof: `https://example.com/hireproof-callback`
- Report base URL: `https://hireproof-sigma.vercel.app/audit/[id]`

Vercel logs showed the WDK request:

- Log ID: `bjphw-1777488925775-e90c0f5c6010`
- Deployment ID: `dpl_GbQ2SAk34UZgnKvfr3eK3GVJRXAo`
- Domain: `hireproof-sigma.vercel.app`
- Method/path: `POST /api/workflows/audit`
- Response: `202`
- Environment: `production`

Use this claim in the submission:

> WDK has a production-accepted workflow run. The route started a deployed workflow and returned run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.

Do not claim a completed durable report callback unless a callback result is captured separately.

## Final Demo Order

1. Open `https://hireproof-sigma.vercel.app/audit`.
2. Paste the suspicious remote frontend internship sample.
3. Show the High-Risk report, red flags, and evidence sections.
4. Show the Slack screenshot proof.
5. Mention the WDK accepted run ID and the `/api/workflows/audit` proof route.

## Submission Readiness Checklist

- [ ] Production URL opens: `https://hireproof-sigma.vercel.app`.
- [ ] `GET /api/health` returns `ok`.
- [ ] `GET /api/integrations/proof` returns Slack, Workflow, and AI Gateway as ready.
- [ ] `POST /api/v1/audit` with `hireproof_agent_demo_key` returns the High-Risk sample report.
- [ ] `POST /api/workflows/audit` accepts a run or the archived accepted run is cited.
- [ ] Slack screenshot proof is included: `docs/demo/Screenshot 2026-04-30 024756.jpg`.
- [ ] Chrome extension ZIP/listing assets are available if extension packaging is mentioned.
- [ ] BYOK credential route hardening is verified by `test/byok-credentials.test.mjs`.
- [ ] `npm run proof:chat-live` passes for controlled chat proof.
- [ ] `npm run proof:chat-live:strict` is either passing, or Discord/Telegram/WhatsApp are described only as credential-gated.
- [ ] Final copy avoids claiming live Discord, Telegram, or WhatsApp proof before real platform captures exist.
- [ ] `npm run build` passes before final submission.

## Demo Failure Backup

- If live search is slow, use the seeded High-Risk sample: `Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.`
- If the live audit stream stalls, open a saved `/audit/chat_...` or previous High-Risk report link.
- If Slack cannot be shown live, use the archived Slack screenshot proof.
- If WDK cannot be re-run, cite the production accepted run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- If Discord, Telegram, or WhatsApp credentials are unavailable, use the exact phrase: "implemented and credential-gated, not live-proven yet."

## Claim Language

Use these claims:

- Live-proven: production web audit flow, public API smoke, Slack screenshot proof, and WDK accepted run.
- Build-verified: multi-platform ChatSDK routes, Chrome extension packaging, BYOK route hardening, and export paths.
- Credential-gated: Discord, Telegram, and WhatsApp/Zernio until real provider events are captured.

Avoid these claims until evidence exists:

- "Live on Discord."
- "Live on Telegram."
- "Live on WhatsApp."
- "Workflow completed a long-running investigation callback."

## Final Smoke Commands

```powershell
$base='https://hireproof-sigma.vercel.app'
Invoke-RestMethod -Uri "$base/api/health"
Invoke-RestMethod -Uri "$base/api/integrations/proof"
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType 'application/json' -Headers @{'x-api-key'='hireproof_agent_demo_key'} -Body (@{text='Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'; mode='demo'} | ConvertTo-Json)
```
