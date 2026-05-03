# HireProof Demo Proof Archive

Last checked: 2026-05-03

This file keeps the judge-facing proof artifacts in one place. It intentionally avoids secrets, request headers, tokens, and private Slack workspace identifiers.

## Current Proof Status

| Capability | Current status | Evidence | Do not claim yet |
| --- | --- | --- | --- |
| Web audit demo | Live-proven | Production `/api/v1/audit` demo mode returns High-Risk score `92`. | N/A |
| Web audit live mode | Live-proven | Production `/api/v1/audit` live mode returns a credential-backed High-Risk report. | N/A |
| Slack ChatSDK | Live-proven | Real Slack mention screenshot plus production Slack route readiness. | Fresh Slack logs unless a new mention is captured. |
| Vercel Workflow / WDK | Accepted-run proven | Production workflow route returned accepted run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`. | Completed durable callback report. |
| Discord ChatSDK | Credential-ready | Production credentials and webhook readiness pass; shared reply path passes. | Live Discord bot delivery until screenshots/logs are captured. |
| Telegram ChatSDK | Live delivery proven | Real Telegram message screenshot plus matching production webhook log. | Report-link screenshot until the platform reply base-URL fallback is re-tested live. |
| WhatsApp/Zernio ChatSDK | Credential-gated | Route exists and controlled shared reply path passes; Zernio credentials are missing. | Live WhatsApp delivery. |

Use this one-line status in public/demo materials:

> HireProof is production-verified for the web audit flow, Slack proof, and Telegram live delivery proof. Discord real message proof and WhatsApp/Zernio credential setup are still pending.

## Production URL

- Stable demo: `https://hireproof-sigma.vercel.app`
- Latest verified production deployment: `https://hireproof-bdvxyu0k1-iron-marks-projects.vercel.app`
- Latest verified deployment ID: `dpl_HSd4UqgThX6kPQxbDjYAfLjfkyHi`
- Production demos should use the stable alias; deployment-specific URLs are kept only as proof evidence.

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
- Credential mode: `demo`
- Source: `api`

Production `POST /api/v1/audit` with platform live credentials returned:

- Verdict: `high-risk`
- Risk score: `100`
- Mode: `live`
- Credential mode: `platform-env`
- Live extraction returned company text from the submitted sample and completed with a High-Risk verdict.

Production `POST /api/audit` returns an SSE result event containing the High-Risk report.

## ChatSDK Slack Proof

- Proof type: real Slack mention to `@HireProof`
- Result: HireProof returned a High-Risk verdict with score, top red flags, and checked evidence categories.
- Screenshot: [`Screenshot 2026-04-30 024756.jpg`](Screenshot%202026-04-30%20024756.jpg)
- Public webhook route: `POST /api/webhooks/slack`
- Local formatted-reply route for demos: `POST /api/chat/hireproof`
- Log archive status: recent Vercel searches for `/api/webhooks/slack` and `Slack` returned no matching archived logs for the original screenshot event. Keep the screenshot as the proof artifact unless a fresh Slack mention is captured.

Use this claim in the submission:

> ChatSDK is live-tested in Slack with screenshot proof. A real `@HireProof` mention returned a High-Risk job-scam verdict.

## ChatSDK Telegram Proof

- Proof type: real Telegram message to `@HireProof_Bot`
- Test time: `2026-05-03 12:04:35 +08:00`
- Result: HireProof returned a High-Risk fake-check job scam verdict with score `92/100`.
- Screenshot: [`telegram-live-proof-2026-05-03-1204.jpg`](telegram-live-proof-2026-05-03-1204.jpg)
- Public webhook route: `POST /api/webhooks/telegram`
- Vercel log ID: `2hsl6-1777781075271-b6a2a1aed71e`
- Deployment ID: `dpl_6TjhCCdSocm1raRNas7vhJEXCVSy`
- Domain: `hireproof-sigma.vercel.app`
- Response: `200`
- Log evidence: production request reached `/api/webhooks/telegram`, initialized the Telegram adapter for `HireProof_Bot`, and returned HTTP `200`.
- Report link status: the captured Telegram reply did not include the `/audit/chat_...` link because the platform webhook path needed a base-URL fallback. The fallback is now patched; capture one more Telegram screenshot after deployment to close the report-link proof item.

Use this claim in the submission after the report-link retest is captured:

> Telegram is live-tested with screenshot and Vercel webhook log proof. A real `@HireProof_Bot` message returned a High-Risk fake-check job-scam verdict and a saved report link.

## Multi-Platform ChatSDK Controlled Check

Latest controlled check artifact:

- File: `docs/demo/live-chat-proof-check-latest.json`
- Strict file: `docs/demo/live-chat-proof-check-strict-latest.json`
- Command: `npm run proof:chat-live`
- Checked production base URL: `https://hireproof-sigma.vercel.app`

Result:

- Core status: `ready` when Slack, Workflow, and AI Gateway are ready.
- Optional platform status: `credential-gated` because WhatsApp/Zernio provider credentials are still missing.
- Slack: `ready`
- Discord: `ready`
- Telegram: `ready`
- WhatsApp/Zernio: `credential-gated`
- Production health: `ok`
- Shared ChatSDK reply path: returned `200`, verdict `high-risk`
- Shared reply proof report: see the latest `sharedChatReplyPath.reportUrl` value in the JSON artifact.

Missing production provider credentials:

- WhatsApp/Zernio: `ZERNIO_API_KEY`, `ZERNIO_WEBHOOK_SECRET`

Use this claim until Discord real message screenshots are captured, Telegram report-link proof is re-tested, and WhatsApp/Zernio credentials are added:

> Telegram live delivery is screenshot/log-proven. Discord is production credential-ready and webhook-configured, but still needs real message screenshots and matching logs. WhatsApp/Zernio remains credential-gated.

Strict live platform proof status:

- Command: `npm run proof:chat-live:strict`
- Latest result: not passing yet because WhatsApp/Zernio remains credential-gated, Discord real event evidence is still pending, and Telegram still needs a report-link retest screenshot.
- Honest status: Telegram live delivery is proven by screenshot/log; Discord is credential-ready; WhatsApp/Zernio is credential-gated.

## Live Platform Proof Runbook

Run this for Discord and Telegram now; run the WhatsApp/Zernio steps only after Zernio credentials are added to production.

1. Deploy the latest `main` build to production.
2. Confirm `https://hireproof-sigma.vercel.app/api/health` returns `ok`.
3. Confirm the Discord app credentials in Vercel production env.
4. Send one real Discord message or interaction to the bot.
5. Capture the Discord client screenshot and the matching production webhook log.
6. Confirm the Telegram bot credentials in Vercel production env.
7. Send one real Telegram message to the bot.
8. Capture the Telegram client screenshot and the matching production webhook log.
9. Add the WhatsApp/Zernio credentials in Vercel production env.
10. Send one real WhatsApp/Zernio event.
11. Capture the WhatsApp/Zernio client screenshot and the matching production webhook log.
12. Run `npm run proof:chat-live`.
13. Run `npm run proof:chat-live:strict` after all three providers have credentials and event proof.
14. Update this archive with the new screenshots, log IDs, deployment ID, and strict proof result.

Pass criteria:

- Each provider has `ready` status in `docs/demo/live-chat-proof-check-latest.json`.
- `npm run proof:chat-live:strict` exits `0`.
- Each provider has one screenshot and one matching webhook log entry.
- Public copy no longer says credential-gated for any provider that has passed real event proof.

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

- [x] Production URL opens: `https://hireproof-sigma.vercel.app`.
- [x] `GET /api/health` returns `ok`.
- [x] `POST /api/v1/audit` with `hireproof_agent_demo_key` returns the High-Risk sample report.
- [x] Production live-mode `/api/v1/audit` returns a credential-backed High-Risk report.
- [x] `POST /api/workflows/audit` accepts a run or the archived accepted run is cited.
- [x] Slack screenshot proof is included: `docs/demo/Screenshot 2026-04-30 024756.jpg`.
- [x] BYOK credential route hardening is verified by `test/byok-credentials.test.mjs`.
- [x] `npm run proof:chat-live` passes for controlled chat proof.
- [x] `npm run build` passes before final submission.
- [ ] Chrome extension ZIP/listing assets are available if extension packaging is mentioned.
- [ ] Real Discord message/event is sent and captured with webhook logs/screenshots.
- [x] Real Telegram message/event is sent and captured with webhook logs/screenshots.
- [ ] Real WhatsApp/Zernio message/event is sent and captured with webhook logs/screenshots.
- [ ] `npm run proof:chat-live:strict` passes after Discord/Telegram/WhatsApp credentials and live event proof exist.
- [ ] Final copy avoids claiming live Discord or WhatsApp proof before real platform captures exist, and avoids claiming Telegram report-link proof until the follow-up screenshot includes the link.

## Demo Failure Backup

- If live search is slow, use the seeded High-Risk sample: `Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.`
- If the live audit stream stalls, open a saved `/audit/chat_...` or previous High-Risk report link.
- If Slack cannot be shown live, use the archived Slack screenshot proof.
- If WDK cannot be re-run, cite the production accepted run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- If Discord screenshots/logs are unavailable, use the exact phrase: "credential-ready, not live-proven yet."
- If Telegram report-link proof is unavailable, use the exact phrase: "live delivery proven, report link retest pending."
- If WhatsApp credentials are unavailable, use the exact phrase: "implemented and credential-gated, not live-proven yet."

## Claim Language

Use these claims:

- Live-proven: production web audit flow, public API smoke, Slack screenshot proof, Telegram delivery proof, and WDK accepted run.
- Build-verified: multi-platform ChatSDK routes, Chrome extension packaging, BYOK route hardening, and export paths.
- Credential-ready: Discord until a real provider event is captured.
- Credential-gated: WhatsApp/Zernio until Zernio credentials and real provider events are captured.

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
