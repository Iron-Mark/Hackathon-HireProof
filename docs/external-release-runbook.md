# HireProof External Release Runbook

Last checked: 2026-05-04

This is the owner-side checklist for work that cannot be completed purely from the repository. Use it when returning to Chrome Web Store review, chat platform proof, marketplace publishing, or durable Workflow proof.

Repo-controlled work can prepare packages, routes, docs, and tests. The items below require external dashboards, account ownership, provider credentials, real platform events, or marketplace review.

## Current Truth

Use this status language until each external proof gate is completed:

| Area | Current safe status | External completion gate |
| --- | --- | --- |
| Chrome extension | ZIP package and public download fallback are prepared | Chrome Web Store submission and Google approval |
| Discord bot | Implemented, credential-ready, webhook-configured | Real Discord event, bot reply screenshot, and Vercel webhook log |
| Telegram bot | Live delivery proven | Fresh screenshot with final report link after latest deployment |
| WhatsApp/Zernio | Implemented and credential-gated | Zernio credentials, real WhatsApp/Zernio event, reply screenshot, and webhook log |
| WDK workflow | Production accepted-run proven | Completed durable run transcript plus callback proof |
| LangChain package | Source package implemented and smoke-tested | npm package published from owner account |
| n8n node | Source package implemented and build-validated | n8n community node submission and approval |
| Make app | Source pack implemented and static-validated | Make custom app submission and review approval |

## Before Any External Submission

Run these from the repo root and keep the output/screenshots if useful:

```powershell
npm run lint
npm run build
npm run package:extension
npm run integrations:build
npm run integrations:test
npm run integrations:package
```

Production smoke:

```powershell
$base = "https://hireproof-sigma.vercel.app"
Invoke-RestMethod -Uri "$base/api/health"
Invoke-RestMethod -Uri "$base/api/integrations/proof"
Invoke-RestMethod -Uri "$base/api/v1/audit" -Method Post -ContentType "application/json" -Headers @{"x-api-key"="hireproof_agent_demo_key"} -Body (@{
  text = "Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram."
  mode = "demo"
} | ConvertTo-Json)
Invoke-WebRequest -UseBasicParsing "$base/downloads/hireproof-extension.zip"
Invoke-WebRequest -UseBasicParsing "$base/downloads/hireproof-native-integrations.zip"
```

Store screenshots and logs in `docs/demo/` or a future `docs/evidence/` folder. Update `docs/demo/proof-archive.md`, `docs/platform-proof-status.md`, and `docs/final-live-vs-pending-status.md` only after evidence exists.

## Phase 1: Chrome Web Store

Reference docs:

- `docs/chrome-web-store-listing.md`
- `docs/assets-index.md`
- `docs/evidence-screenshot-checklist.md`

Prepared repo artifacts:

- Extension source: `extension/`
- Packaged ZIP: `public/downloads/hireproof-extension.zip`
- Store listing draft: `docs/chrome-web-store-listing.md`
- Current store assets: `docs/assets-index.md` and `docs/chrome-web-store-assets/`

Owner steps:

1. Run `npm run package:extension`.
2. Open the Chrome Web Store Developer Dashboard.
3. Create a new item or update the existing HireProof draft.
4. Upload `public/downloads/hireproof-extension.zip`.
5. Fill the listing using `docs/chrome-web-store-listing.md`.
6. Upload required screenshots and promo assets listed in `docs/assets-index.md`.
7. Complete privacy, permissions, and data-use disclosure forms honestly:
   - user-triggered checks only
   - no background browsing-history sale
   - text is sent to the configured HireProof server for audit
   - no claim of legal, financial, or employment advice
8. Submit for Google review.
9. Capture:
   - dashboard submission screenshot
   - review status screenshot
   - final public listing URL after approval

Safe wording before approval:

> Chrome extension ZIP is available as a manual-install fallback while Chrome Web Store review is pending.

Do not claim:

> Published on the Chrome Web Store.

## Phase 2: Chat Platform Proof

Reference docs:

- `docs/live-chat-platform-proof-plan.md`
- `docs/platform-proof-status.md`
- `docs/evidence-screenshot-checklist.md`

Run the controlled proof check first:

```powershell
npm run proof:chat-live
```

### Discord

Required production variables:

```text
DISCORD_BOT_TOKEN
DISCORD_PUBLIC_KEY
DISCORD_APPLICATION_ID
REDIS_URL
APP_BASE_URL=https://hireproof-sigma.vercel.app
```

Owner steps:

1. Open Discord Developer Portal.
2. Confirm interaction endpoint:

```text
https://hireproof-sigma.vercel.app/api/webhooks/discord
```

3. Register or refresh commands if needed:

```powershell
npm run discord:commands
```

4. Add the bot to a test server.
5. Send:

```text
/verify job_post: Remote frontend intern, PHP 80,000 per week, recruiter only wants Telegram contact and says no interview is needed.
```

6. Confirm HireProof replies with a verdict and `/audit/chat_...` link.
7. Capture:
   - Discord command screenshot
   - bot reply screenshot
   - opened report link screenshot
   - matching Vercel function log

### Telegram

Required production variables:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET_TOKEN
TELEGRAM_BOT_USERNAME
REDIS_URL
APP_BASE_URL=https://hireproof-sigma.vercel.app
```

Owner steps:

1. Confirm bot identity in BotFather.
2. Re-register webhook if needed:

```powershell
$token = "<TELEGRAM_BOT_TOKEN>"
$secret = "<TELEGRAM_WEBHOOK_SECRET_TOKEN>"
$url = "https://hireproof-sigma.vercel.app/api/webhooks/telegram"
Invoke-WebRequest -Method Post -Uri "https://api.telegram.org/bot$token/setWebhook" -Body @{ url = $url; secret_token = $secret }
```

3. Send:

```text
Please check this offer: frontend intern, PHP 80,000 weekly, no interview, recruiter wants me to move to Telegram only.
```

4. Confirm HireProof replies with a verdict and `/audit/chat_...` link.
5. Capture Telegram chat screenshot, opened report screenshot, and Vercel webhook log.

### WhatsApp/Zernio

Required production variables:

```text
ZERNIO_API_KEY
ZERNIO_WEBHOOK_SECRET
ZERNIO_BOT_NAME=HireProof
REDIS_URL
APP_BASE_URL=https://hireproof-sigma.vercel.app
```

Owner steps:

1. Open the Zernio workspace.
2. Create or select the HireProof bot/integration.
3. Add the API key and webhook secret to Vercel production.
4. Register webhook:

```text
https://hireproof-sigma.vercel.app/api/webhooks/zernio
```

5. Redeploy after setting env vars.
6. Confirm `/api/integrations/proof` reports WhatsApp/Zernio as ready.
7. Send a real WhatsApp/Zernio message.
8. Capture message screenshot, reply screenshot, opened report screenshot, and Vercel webhook log.

## Phase 3: WDK Completed Workflow Proof

Reference docs:

- `docs/platform-proof-status.md`
- `docs/final-live-vs-pending-status.md`

Current safe claim:

> WDK route has production accepted-run proof.

Completion gate:

- accepted run ID
- completed durable workflow timeline
- callback delivery proof
- retry/error behavior visible if applicable

Owner steps:

1. Confirm production `WORKFLOW_SECRET`.
2. Prepare a public callback receiver you control.
3. Start a workflow run against:

```text
https://hireproof-sigma.vercel.app/api/workflows/audit
```

4. Confirm the run is accepted.
5. Wait for completion.
6. Capture:
   - accepted run response
   - completed run timeline
   - callback payload
   - saved report URL
   - Vercel logs

Only after this should docs say completed durable WDK proof exists.

## Phase 4: Automation Marketplace Publishing

Reference docs:

- `docs/automation-integrations.md`
- `docs/automation-marketplace-submission.md`

### LangChain npm Package

Owner steps:

```powershell
node packages\hireproof-langchain\test-smoke.mjs
npm pack --workspace @hireproof/langchain --dry-run
npm pack --workspace @hireproof/langchain
npm login
npm publish --workspace @hireproof/langchain --access public
```

Capture:

- npm package page URL
- publish command output
- install/import smoke screenshot or terminal output

### n8n Community Node

Owner steps:

```powershell
pnpm integrations:build
node integrations\n8n-nodes-hireproof\test\request.test.mjs
npm pack .\integrations\n8n-nodes-hireproof --dry-run
npm pack .\integrations\n8n-nodes-hireproof
```

Then:

1. Install the package into local n8n.
2. Add `HireProof API` credentials.
3. Run `HireProof > Run audit`.
4. Run `HireProof > Run async audit`.
5. Capture node search, credential, execution, and callback screenshots.
6. Submit to n8n review.

### Make Custom App

Owner steps:

1. Open Make Custom Apps.
2. Recreate/import from `integrations/make-hireproof`.
3. Configure `x-api-key` connection.
4. Add modules:
   - `Audit job post`
   - `Audit job post async`
   - `Get API health`
5. Run module tests with the demo API key.
6. Capture app, connection, module, test output, async response, and health screenshots.
7. Submit to Make review.

## Final Evidence Update

After any external gate is completed:

1. Save screenshots/logs under `docs/demo/` or `docs/evidence/`.
2. Update `docs/demo/proof-archive.md`.
3. Update the relevant status docs:
   - `docs/final-live-vs-pending-status.md`
   - `docs/remaining-work.md`
   - `docs/platform-proof-status.md`
   - `docs/automation-integrations.md`
4. Update public app copy only if the completed proof changes a public claim.
5. Run:

```powershell
npm run lint
npm run build
```

## Claim Guardrails

Safe until evidence exists:

- implemented
- build-verified
- source-packaged
- credential-ready
- manual-install fallback
- accepted-run proof

Avoid until evidence exists:

- published
- approved
- marketplace-live
- live-proven
- completed workflow transcript
- available on Chrome Web Store
