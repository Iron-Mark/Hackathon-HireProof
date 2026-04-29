# HireProof Remaining Work

Last checked: 2026-04-29

The runtime wiring pass is now in place. The remaining items below are the real follow-through work that is still not finished, plus a few docs/hardening items that should be kept honest in the repo.

## Verified Runtime Wiring

- `explore` now reads from the intelligence reports path used by the API.
- `trends` now maps the stored report shape into the UI sections it renders.
- Missing-user auth now uses a valid dummy `scrypt` hash path.
- `/lab` now streams real `/api/audit` SSE events instead of timed fake telemetry.
- ChatSDK package wiring exists for Slack mentions and subscribed messages.
- WDK package wiring exists for `startAuditWorkflow` through `/api/workflows/audit`.

## P1 - Product Wiring Still Incomplete

- **BYOK settings are verified but not used by server-side live audits**
  - Current UI: developer portal stores OpenAI/SerpApi keys in `localStorage` and can verify them through `/api/developer/verify-infrastructure`.
  - Current server: `/api/audit`, `/api/v1/audit`, and MCP tools still read provider keys from server env vars.
  - Fix: either persist per-user infrastructure keys securely server-side or relabel the current BYOK panel as local verification only.
  - Acceptance: a user-provided key can actually power that user account's live audits, or the UI stops implying that it does.

- **Webhook sandbox sends mock payloads**
  - Current route: `app/api/developer/webhook-test/route.ts` sends a test payload only.
  - Missing: signature parity with production audit webhooks and a real event preview based on the user's latest audit.
  - Fix: sign sandbox payloads with the same scheme as `/api/v1/audit` webhook delivery and show the exact headers/body in the UI.
  - Acceptance: webhook receivers can validate sandbox and production webhook signatures the same way.

The April 30 E2E pass closed items 3-4 from the previous list:

- Verified badge now has account-level domain records, DNS TXT ownership checks, public embed tokens, `/api/verified-badge/status`, `/api/verified-badge/script`, and developer portal controls.
- ChatSDK/WDK proof now has `/api/integrations/proof`, which reports credential-aware E2E status for Slack, Workflow, and AI Gateway.

External proof still requires real credentials and events:

- Slack: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `REDIS_URL`, and a real Slack event to `/api/webhooks/slack`.
- WDK: `WORKFLOW_SECRET` and a deployed Vercel Workflow run through `/api/workflows/audit`.
- AI Gateway: `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_API_KEY`.

## P2 - Polish, Docs, and Hardening

The April 30 polish pass closed the previously open P2 cleanup items:

- Chrome extension docs now only claim local install from `/extension` until a real store listing exists.
- The legal abuse mailto helper reads lowercase schema keys such as `company` and `role`.
- The trends page now exports a clearly labeled JSON file instead of implying PDF output.
- Local JSON maintenance now has a `npm run cleanup:local-data` command that prunes reports and usage records.

## Verification Checklist

Before closing this punch list, run:

```powershell
node --test test/auth-core.test.mjs
node --test test/runtime-wiring.test.mjs
node --test test/polish-hardening.test.mjs
npm run lint
npm run build
```

Then smoke test:

```powershell
$base='http://localhost:3002'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType 'application/json' -Body (@{email='smoke@example.test'; password='Password123!'; name='Smoke'} | ConvertTo-Json) -WebSession $session
$key = Invoke-RestMethod -Uri "$base/api/developer/keys" -Method Post -ContentType 'application/json' -Body (@{name='Smoke Key'} | ConvertTo-Json) -WebSession $session
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType 'application/json' -Headers @{'x-api-key'=$key.rawKey} -Body (@{text='Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.'; mode='demo'} | ConvertTo-Json)
Invoke-RestMethod -Uri "$base/api/intelligence/reports" -Method Get
Invoke-RestMethod -Uri "$base/api/intelligence/trends" -Method Get
Invoke-RestMethod -Uri "$base/api/integrations/proof" -Method Get
```
