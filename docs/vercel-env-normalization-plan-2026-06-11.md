# Vercel Environment Normalization Plan

Date: 2026-06-11

Scope: `marksiazon-dev` Vercel projects reviewed from CLI output. This plan uses environment variable names and environment scopes only. It does not copy, print, or require secret values.

References: Vercel Preview variables apply to non-production branch deployments, and environment-variable changes apply only to new deployments. The CLI can safely list variable names and scopes with `vercel env ls`, but adding or updating values still requires a value to be entered intentionally.

## Rules

- Mirror public variables only when the value is non-secret and safe for every Preview deployment. `NEXT_PUBLIC_*` and `PUBLIC_*` values are exposed to browser/client code.
- Do not blindly mirror production URLs into Preview. Use a Preview URL or a staging alias unless the app must intentionally call production.
- Use separate Preview values for anything ending in `KEY`, `TOKEN`, `SECRET`, `PASSWORD`, private webhook credentials, paid-provider credentials, bot credentials, payment config, database/storage credentials, or write-capable service URLs.
- Keep production-only values scoped to Production when Preview does not need that flow, or when Preview branch code should not be able to call production systems.
- After env changes, redeploy the target environment. Existing deployments keep their previous env snapshot.

## Command Pattern

Run commands from the linked project root:

```bash
vercel env ls production --scope marksiazon-dev
vercel env ls preview --scope marksiazon-dev
vercel env add KEY preview --scope marksiazon-dev
```

For secrets, use the dashboard or the interactive CLI prompt. Do not put secret values in shell history.

## hireproof

Observed production-only names missing from Preview:

`AI_GATEWAY_API_KEY`, `APP_BASE_URL`, `CURSOR_ALLOWED_REPO_URL`, `CURSOR_INTEGRATION_ENABLED`, `CURSOR_MAX_CONCURRENT_RUNS`, `CURSOR_MODEL_ID`, `CURSOR_RUNTIME_DEFAULT`, `CURSOR_WEBHOOK_SECRET`, `DISCORD_APPLICATION_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`, `GROQ_API_KEY`, `HIREPROOF_COST_GUARD_GOOGLE_VISION_DAILY_LIMIT`, `HIREPROOF_COST_GUARD_MODEL_DAILY_LIMIT`, `HIREPROOF_COST_GUARD_SAFE_BROWSING_DAILY_LIMIT`, `HIREPROOF_COST_GUARD_SERPAPI_DAILY_LIMIT`, `HIREPROOF_MODEL`, `MODEL_PROVIDER_KEY`, `PUBLIC_GOOGLE_VISION_OCR_ENABLED`, `PUBLIC_LIVE_AUDIT_ENABLED`, `PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED`, `REDIS_URL`, `REQUIRE_BYOK_FOR_LIVE_API`, `SERPAPI_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_REST_URL`, `VERCEL_AI_GATEWAY_API_KEY`, `WORKFLOW_SECRET`.

| Bucket | Variables | Plan |
|---|---|---|
| Public/config to mirror or provide Preview equivalents | `PUBLIC_LIVE_AUDIT_ENABLED`, `PUBLIC_GOOGLE_VISION_OCR_ENABLED`, `PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED`, `HIREPROOF_MODEL`, `REQUIRE_BYOK_FOR_LIVE_API`, `CURSOR_ALLOWED_REPO_URL`, `CURSOR_INTEGRATION_ENABLED`, `CURSOR_MAX_CONCURRENT_RUNS`, `CURSOR_MODEL_ID`, `CURSOR_RUNTIME_DEFAULT`, `HIREPROOF_COST_GUARD_*_DAILY_LIMIT` | Add Preview values with safer defaults: public paid-flow flags `false`, cost limits low or `0`, and model/runtime config only if Preview demos need them. Use a Preview-specific `APP_BASE_URL`, not `https://hireproof.tech`. |
| Secrets needing separate Preview values | `AI_GATEWAY_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY`, `MODEL_PROVIDER_KEY`, `GROQ_API_KEY`, `SERPAPI_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_URL`, `CURSOR_WEBHOOK_SECRET`, `WORKFLOW_SECRET`, `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `DISCORD_APPLICATION_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, `TELEGRAM_BOT_USERNAME` | Use test provider keys, low-quota keys, test Redis, and preview-only webhook/bot credentials. Do not reuse production bot or webhook secrets in Preview. |
| Production-only unless a Preview flow is explicitly required | Production `APP_BASE_URL`, real Slack/Discord/Telegram bot tokens, production provider keys, production Redis/counter stores | Keep scoped to Production if Preview should stay demo-only and cost-controlled. |

Recommended first pass: add only public cost flags and low limits to Preview, keep live AI/search/bot integrations production-only, and add Preview provider secrets only when a specific demo requires them.

## gawainyah-minipay

Observed production-only names missing from Preview:

`AI_MAX_RECEIPT_IMAGE_MB`, `AI_MAX_RECEIPT_TEXT_CHARS`, `AI_PROVIDER`, `ALLOW_LOCAL_E2E_PAYMENT_MOCK`, `CELO_MAINNET_RPC_URL`, `CELO_SEPOLIA_RPC_URL`, `NEXT_PUBLIC_AI_MAX_RECEIPT_IMAGE_MB`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CELO_MAINNET_RPC_URL`, `NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL`, `NEXT_PUBLIC_DEFAULT_CHAIN_ID`, `NEXT_PUBLIC_DEFAULT_PAYMENT_TOKEN`, `NEXT_PUBLIC_ENABLE_IMAGE_ONLY_RECEIPTS`, `NEXT_PUBLIC_MINIPAY_DEEPLINK_HOST`, `NEXT_PUBLIC_PRIVACY_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_URL`, `NEXT_PUBLIC_TASK_PRICE_USD`, `NEXT_PUBLIC_TERMS_URL`, `PAYMENT_AMOUNT_USD`, `PAYMENT_CHAIN_ID`, `PAYMENT_CONFIRMATIONS`, `PAYMENT_TOKEN_ADDRESS`, `PAYMENT_TOKEN_DECIMALS`, `PAYMENT_TOKEN_SYMBOL`, `PAYMENT_VERIFICATION_MODE`, `PRODUCTION_APP_URL`, `PROOF_RECORDING_MODE`, `PROOF_TOOL_ID`, `SUPABASE_PROJECT_REF`, `SUPABASE_URL`.

| Bucket | Variables | Plan |
|---|---|---|
| Public/config to mirror or provide Preview equivalents | `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_URL`, `NEXT_PUBLIC_PRIVACY_URL`, `NEXT_PUBLIC_TERMS_URL`, `NEXT_PUBLIC_MINIPAY_DEEPLINK_HOST`, `NEXT_PUBLIC_AI_MAX_RECEIPT_IMAGE_MB`, `NEXT_PUBLIC_ENABLE_IMAGE_ONLY_RECEIPTS`, `AI_MAX_RECEIPT_IMAGE_MB`, `AI_MAX_RECEIPT_TEXT_CHARS`, `AI_PROVIDER` | Mirror only non-secret display/config values. Set `NEXT_PUBLIC_APP_URL` to the Preview URL. Keep public RPC URLs only if they are keyless or explicitly safe for public browser use. |
| Secrets or write-capable config needing separate Preview values | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `CELO_MAINNET_RPC_URL`, `CELO_SEPOLIA_RPC_URL`, `NEXT_PUBLIC_CELO_MAINNET_RPC_URL`, `NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL`, `PAYMENT_*`, `PROOF_*`, `ALLOW_LOCAL_E2E_PAYMENT_MOCK` | Use a Preview Supabase project, testnet payment config, preview proof tool IDs, and test RPC endpoints. Even public Supabase URLs should point to a Preview project if branch code can write data. |
| Production-only | `PRODUCTION_APP_URL`, mainnet production payment token/settings, production Supabase project, production proof recording mode/tool ID | Keep scoped to Production until a dedicated Preview data/payment lane exists. |

Recommended first pass: create a Preview config using Sepolia/testnet and a Preview Supabase project. Do not point Preview at production payment or proof records.

## gtl-podcast-web

Observed production-only names missing from Preview:

`BREVO_API_KEY`, `BREVO_DOI_REDIRECT_URL`, `BREVO_DOI_TEMPLATE_ID`, `BREVO_NEWSLETTER_LIST_ID`, `CONTACT_FORM_TO_EMAIL`, `NEWSLETTER_PROVIDER`, `NEWSLETTER_PROVIDER_CHECK_SECRET`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `SMTP_HOST`, `SMTP_PASSWORD`, `SMTP_USER`, `TURNSTILE_SECRET_KEY`.

| Bucket | Variables | Plan |
|---|---|---|
| Public/config to mirror or provide Preview equivalents | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Use `https://gtl-podcast-staging.vercel.app` or the current Preview URL for `NEXT_PUBLIC_SITE_URL`. Use test analytics IDs or omit analytics in Preview. Use a Preview Turnstile site key if forms must work. |
| Secrets needing separate Preview values | `BREVO_API_KEY`, `BREVO_DOI_REDIRECT_URL`, `BREVO_DOI_TEMPLATE_ID`, `BREVO_NEWSLETTER_LIST_ID`, `CONTACT_FORM_TO_EMAIL`, `NEWSLETTER_PROVIDER`, `NEWSLETTER_PROVIDER_CHECK_SECRET`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `TURNSTILE_SECRET_KEY` | Use Brevo test list/template/redirect values, test SMTP credentials, a test recipient, and a Preview Turnstile secret. If staging should fail closed, omit these from Preview. |
| Production-only | Production Brevo account/list/template, production SMTP credentials, production Turnstile secret, production GA/GTM IDs if no test property exists | Keep scoped to Production unless staging email/newsletter testing is required. |

Recommended first pass: keep Preview fail-closed for newsletter/contact until a test Brevo/SMTP setup exists. Add only `NEXT_PUBLIC_SITE_URL` and public contact/analytics values when staging needs public smoke tests.

## gtl-portfolio-web

Observed production-only names missing from Preview:

`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`.

| Bucket | Variables | Plan |
|---|---|---|
| Public/config to mirror or provide Preview equivalents | None from the current missing-Preview set | No public values need mirroring from this audit. |
| Secrets needing separate Preview values | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL` | Use a Resend test/sandbox API key, a Preview-safe sender domain, and a personal/test recipient if Preview contact delivery must work. |
| Production-only | Production Resend API key, production sender, production recipient | Keep scoped to Production if Preview should not send mail. The contact API now exposes a direct-email fallback on provider failures, so Preview can remain safer without production mail credentials. |

Recommended first pass: leave Resend production-only and use the production contact verification script against safe invalid/honeypot routes. Add Preview Resend only when contact QA needs real delivery from a Preview URL.

## Execution Order

1. Normalize public Preview URL variables first: `APP_BASE_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_SITE_URL` should never accidentally point Preview traffic at production unless that is intentional.
2. Add low-risk public flags and cost guards with safe Preview defaults.
3. Add separate Preview data stores and payment/testnet config for apps that write state or verify money movement.
4. Add separate Preview mail/newsletter/Turnstile credentials only when forms must be tested in Preview.
5. Keep production bot, webhook, provider, payment, and database secrets production-only until each Preview lane has a real isolated account or key.
6. Redeploy affected Preview or Production deployments after any env change.

## Applied Preview Values

Applied on 2026-06-11 through the Vercel project env API. These were public/config values only; no provider credentials, private mail routing, bot tokens, database URLs, payment values, or Turnstile secrets were copied.

| Project | Preview values applied |
|---|---|
| `hireproof` | `PUBLIC_LIVE_AUDIT_ENABLED=false`, `PUBLIC_GOOGLE_VISION_OCR_ENABLED=false`, `PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED=false`, `HIREPROOF_COST_GUARD_MODEL_DAILY_LIMIT=0`, `HIREPROOF_COST_GUARD_SERPAPI_DAILY_LIMIT=0`, `HIREPROOF_COST_GUARD_GOOGLE_VISION_DAILY_LIMIT=0`, `HIREPROOF_COST_GUARD_SAFE_BROWSING_DAILY_LIMIT=0`, `REQUIRE_BYOK_FOR_LIVE_API=true`, `APP_BASE_URL=https://hireproof-iron-mark-marksiazon-dev.vercel.app`, `HIREPROOF_MODEL=openai/gpt-4o-mini` |
| `gtl-podcast-web` | `NEXT_PUBLIC_SITE_URL=https://gtl-podcast-staging.vercel.app`, `NEXT_PUBLIC_CONTACT_EMAIL=goodtoliveworldwide@gmail.com` |
| `gawainyah-minipay` | `NEXT_PUBLIC_APP_NAME=GawainYah`, `NEXT_PUBLIC_SUPPORT_EMAIL=support@gawainyah.app`, `NEXT_PUBLIC_SUPPORT_URL=/support`, `NEXT_PUBLIC_TERMS_URL=/terms`, `NEXT_PUBLIC_PRIVACY_URL=/privacy`, `NEXT_PUBLIC_MINIPAY_DEEPLINK_HOST=https://link.minipay.xyz`, `NEXT_PUBLIC_TASK_PRICE_USD=0.05`, `NEXT_PUBLIC_AI_MAX_RECEIPT_IMAGE_MB=5`, `NEXT_PUBLIC_ENABLE_IMAGE_ONLY_RECEIPTS=false`, `NEXT_PUBLIC_APP_URL=https://gawainyah-minipay-iron-mark-marksiazon-dev.vercel.app`, `NEXT_PUBLIC_DEFAULT_CHAIN_ID=11142220`, `NEXT_PUBLIC_DEFAULT_PAYMENT_TOKEN=USDC`, `AI_PROVIDER=fallback`, `AI_MAX_RECEIPT_IMAGE_MB=5`, `AI_MAX_RECEIPT_TEXT_CHARS=12000` |
| `gtl-portfolio-web` | None. No public missing-Preview values were identified in this pass. |

Not applied: production analytics IDs, Turnstile site keys without matching Preview secrets, mail/newsletter provider settings, payment/proof settings, Supabase URLs, Redis/Upstash URLs, RPC URLs, bot/webhook credentials, and AI/search provider keys.
