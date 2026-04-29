# HireProof Remaining Work

Last checked: 2026-04-30

The runtime wiring pass is now in place. The remaining items below are the real follow-through work that is still not finished, plus a few docs/hardening items that should be kept honest in the repo.

## Verified Runtime Wiring

- `explore` now reads from the intelligence reports path used by the API.
- `trends` now maps the stored report shape into the UI sections it renders.
- Missing-user auth now uses a valid dummy `scrypt` hash path.
- `/lab` now streams real `/api/audit` SSE events instead of timed fake telemetry.
- ChatSDK package wiring exists for Slack mentions and subscribed messages.
- WDK package wiring exists for `startAuditWorkflow` through `/api/workflows/audit`.

## P1 - Product Wiring Still Incomplete

- **BYOK settings are verified locally but do not power hosted audits**
  - Closed by relabelled as local verification only in the developer panel.
  - Current UI stores OpenAI/SerpApi keys in `localStorage` and verifies connectivity through `/api/developer/verify-infrastructure`.
  - Current server audits intentionally use server environment keys.
  - Acceptance: the UI no longer implies browser-provided keys power hosted server audits.

- **Webhook sandbox sends production-parity signed payloads**
  - Closed by sharing the same `buildHireProofWebhookHeaders` HMAC helper between `/api/v1/audit` and `/api/developer/webhook-test`.
  - Sandbox response includes exact headers/body preview.
  - Acceptance: receivers can validate sandbox and production signatures with the same header shape.

The April 30 E2E pass closed items 3-4 from the previous list:

- Verified badge now has account-level domain records, DNS TXT ownership checks, public embed tokens, `/api/verified-badge/status`, `/api/verified-badge/script`, and developer portal controls.
- ChatSDK/WDK proof now has `/api/integrations/proof`, which reports credential-aware E2E status for Slack, Workflow, and AI Gateway.
- ChatSDK Slack proof has screenshot evidence in production. A real Slack mention returned a High-Risk HireProof verdict with evidence. Screenshot: [`docs/demo/Screenshot 2026-04-30 024756.jpg`](demo/Screenshot%202026-04-30%20024756.jpg).
- WDK proof is complete in production. `/api/workflows/audit` accepted a deployed workflow run and returned `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.

External proof still pending:

- Archive request logs for the Slack event if a judge asks for endpoint-level proof beyond the screenshot.

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
