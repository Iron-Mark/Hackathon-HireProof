# HireProof Credentials Setup

Last checked: 2026-04-30

This file explains where to get the optional credentials for the ChatSDK, WDK, Redis, and AI Gateway paths.

## Are They Free?

Short answer: mostly yes for a hackathon demo, with limits.

| Credential | Source | Free? | Notes |
|---|---|---|---|
| `SLACK_BOT_TOKEN` | Slack app dashboard | Yes, if your Slack workspace allows apps | Slack free workspaces can install custom/third-party apps, but app limits apply. |
| `SLACK_SIGNING_SECRET` | Slack app dashboard | Yes | Comes with the Slack app. |
| `DISCORD_BOT_TOKEN` / `DISCORD_PUBLIC_KEY` / `DISCORD_APPLICATION_ID` | Discord Developer Portal | Yes | Enables the official ChatSDK Discord adapter. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_WEBHOOK_SECRET_TOKEN` / `TELEGRAM_BOT_USERNAME` | Telegram BotFather and webhook setup | Yes | Enables the official ChatSDK Telegram adapter in webhook mode. |
| `ZERNIO_API_KEY` / `ZERNIO_WEBHOOK_SECRET` | Zernio account | Depends on Zernio plan | Enables WhatsApp-backed messages through Zernio's ChatSDK adapter. |
| `REDIS_URL` | Upstash Redis or another Redis host | Yes on Upstash free tier | Upstash free tier is enough for demo ChatSDK thread state. |
| `WORKFLOW_SECRET` | You generate it | Yes | This is our app-level protection secret, not a paid vendor credential. |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway | Free monthly credits, then paid usage | Vercel lists a free monthly AI Gateway credit tier. |
| `VERCEL_AI_GATEWAY_API_KEY` | Vercel AI Gateway | Same as above | This repo accepts either key name. |

## 1. Slack Credentials

Use these for the ChatSDK Slack webhook.

### Create the Slack app

1. Go to <https://api.slack.com/apps>.
2. Click **Create New App**.
3. Choose **From scratch**.
4. App name: `HireProof`.
5. Pick the Slack workspace where you want to test the bot.

### Add bot scopes

1. Open the Slack app.
2. Go to **OAuth & Permissions**.
3. Under **Bot Token Scopes**, add the scopes your bot needs.
4. Start with:
   - `app_mentions:read`
   - `chat:write`
   - `channels:history`
   - `groups:history`
   - `im:history`
   - `mpim:history`
5. Click **Install to Workspace** or **Reinstall to Workspace** after changing scopes.

### Copy the bot token

1. Stay on **OAuth & Permissions**.
2. Copy **Bot User OAuth Token**.
3. Save it as:

```env
SLACK_BOT_TOKEN=xoxb-your-token
```

### Copy the signing secret

1. Go to **Basic Information**.
2. Find **App Credentials**.
3. Copy **Signing Secret**.
4. Save it as:

```env
SLACK_SIGNING_SECRET=your-signing-secret
```

### Configure Slack events

After the app is deployed, set the request URL:

```text
https://YOUR_DEPLOYED_DOMAIN/api/webhooks/slack
```

Then subscribe to bot events:

```text
app_mention
message.im
```

For local testing, use a tunnel such as ngrok:

```powershell
ngrok http 3002
```

Then use:

```text
https://YOUR_NGROK_DOMAIN/api/webhooks/slack
```

## 2. Redis URL

Use Redis for ChatSDK persistent thread state. Slack, Discord, Telegram, and WhatsApp/Zernio all require `REDIS_URL` before their live webhook routes are marked ready.

## Multi-Platform ChatSDK Credentials

Slack remains the proven platform path. Discord and Telegram use first-party ChatSDK adapters. WhatsApp is routed through Zernio's ChatSDK adapter, so it requires a connected Zernio WhatsApp inbox instead of direct Meta Cloud API credentials in this app.

Webhook endpoints after deploy:

```text
https://YOUR_DEPLOYED_DOMAIN/api/webhooks/slack
https://YOUR_DEPLOYED_DOMAIN/api/webhooks/discord
https://YOUR_DEPLOYED_DOMAIN/api/webhooks/telegram
https://YOUR_DEPLOYED_DOMAIN/api/webhooks/zernio
```

Environment variables:

```env
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_PUBLIC_KEY=
DISCORD_APPLICATION_ID=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET_TOKEN=
TELEGRAM_BOT_USERNAME=
ZERNIO_API_KEY=
ZERNIO_WEBHOOK_SECRET=
ZERNIO_BOT_NAME=HireProof
REDIS_URL=
```

### Upstash free Redis

1. Go to <https://upstash.com/>.
2. Create an account or sign in.
3. Create a new Redis database.
4. Choose the free plan if available.
5. Open the database details.
6. Copy the Redis connection URL, not just the REST URL.
7. Save it as:

```env
REDIS_URL=redis://default:password@host:port
```

This repo also uses Upstash REST variables elsewhere, but ChatSDK currently expects `REDIS_URL` for its Redis state adapter.

## 3. Workflow Secret

`WORKFLOW_SECRET` is not purchased from Vercel. Generate it yourself.

Run:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output as:

```env
WORKFLOW_SECRET=generated-random-hex
```

This protects `/api/workflows/audit` when you want to start workflow runs from external callers.

Vercel Workflow itself is enabled by the `workflow` package, the `workflow/next` plugin, and the `"use workflow"` directive in the workflow function. On Vercel, Workflow provisions the durable runtime automatically.

## 4. AI Gateway Key

Use this for Vercel AI Gateway model routing.

1. Go to the Vercel dashboard.
2. Open **AI Gateway**.
3. Create or copy an API key.
4. Save it as:

```env
AI_GATEWAY_API_KEY=gw_your_key
HIREPROOF_MODEL=openai/gpt-4o-mini
```

This repo also accepts:

```env
VERCEL_AI_GATEWAY_API_KEY=gw_your_key
```

Prefer `AI_GATEWAY_API_KEY` because Vercel’s AI Gateway provider looks for that by default.

## 5. Add Variables To Vercel

In Vercel:

1. Open your project.
2. Go to **Settings**.
3. Go to **Environment Variables**.
4. Add:

```env
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
REDIS_URL=
WORKFLOW_SECRET=
AI_GATEWAY_API_KEY=
HIREPROOF_MODEL=openai/gpt-4o-mini
```

5. Apply to **Production**, **Preview**, and **Development** if needed.
6. Redeploy after adding the values. Environment changes do not affect old deployments.

## 6. Add Variables Locally

Create or update `.env.local`:

```env
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-signing-secret
REDIS_URL=redis://default:password@host:port
WORKFLOW_SECRET=generated-random-hex
AI_GATEWAY_API_KEY=gw_your_key
HIREPROOF_MODEL=openai/gpt-4o-mini
APP_BASE_URL=http://localhost:3002
```

Restart the dev server after changing `.env.local`.

## 7. Verify Setup

Run the app:

```powershell
npm run dev
```

Check readiness:

```powershell
Invoke-RestMethod http://localhost:3002/api/integrations/proof
```

Expected result:

- `slack.state` becomes `ready` when `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, and `REDIS_URL` are present.
- `workflow.state` becomes `ready` when `WORKFLOW_SECRET` is present.
- `gateway.state` becomes `ready` when `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_API_KEY` is present.

Local route checks:

```powershell
Invoke-RestMethod http://localhost:3002/api/chat/hireproof
Invoke-RestMethod http://localhost:3002/api/webhooks/slack
Invoke-RestMethod http://localhost:3002/api/workflows/audit
```

## 8. Recommended Hackathon Setup

For the lowest-cost demo:

1. Use a free Slack workspace.
2. Use one free Upstash Redis database.
3. Use Vercel AI Gateway free monthly credits.
4. Generate `WORKFLOW_SECRET` yourself.
5. Keep rate limits and demo mode enabled.

Do not enable paid auto-top-up unless you intentionally want paid usage.
