# HireProof Next Step Plan

Last checked: 2026-05-04

## Current Action Plan

This section is the active post-submission hardening plan. Older phases below are kept for project history.

### Phase 1: Live Production Verification

Status: complete as of 2026-05-04.

Verified production URL:

- `https://hireproof-sigma.vercel.app`

Routes verified with HTTP `200`:

- `/`
- `/audit`
- `/docs/use-cases`
- `/docs/automations`
- `/docs/cli`
- `/api/health`

Production health result:

- Storage: Redis
- Live search: enabled
- Model provider: AI Gateway plus OpenAI-compatible fallback
- Model shown by health endpoint: `openai/gpt-4o-mini`

Audit proof:

- `POST /api/v1/audit` with `x-api-key: hireproof_agent_demo_key` and `mode: demo` returns a High-Risk report with score `92`.
- `POST /api/audit` with production `Origin` / `Referer` returns SSE result events for live audits.
- Raw live audit POSTs without `Origin` or `Referer` return `403 Insecure Request: Missing Origin/Referer`, which is expected from CSRF/origin hardening.

Latest live evidence-funnel smoke:

- Input: Vercel role with `https://vercel.com/careers` and `recruiting@vercel.com`
- Result: `caution`
- Risk score: `45`
- Evidence count: `11`
- Green flags: `6`
- Red flags: `4`
- Provider statuses:
  - SerpApi: `ok`
  - DNS: `ok`
  - RDAP: `degraded`
  - Certificate Transparency: `degraded`
  - Google Safe Browsing: `not-live` because `GOOGLE_SAFE_BROWSING_API_KEY` is not configured

Phase 1 remaining manual action:

- Add `GOOGLE_SAFE_BROWSING_API_KEY` in Vercel if known-bad phishing/malware checks should be live.
- Keep RDAP and Certificate Transparency degradation visible as non-blocking provider status, not as audit failure.

### Phase 2: Published Package Proof

Status: complete for CLI, SDK, LangChain, and n8n metadata.

Goal:

- Prove the public npm install/use path for the published package surfaces:
  - `@hireproof/cli`
  - `hireproof-sdk`
  - `@hireproof/langchain`
  - `n8n-nodes-hireproof`

Acceptance:

- `npx @hireproof/cli --help` works from outside the repo. Result: passed with `@hireproof/cli@1.0.0`.
- `npx @hireproof/cli audit --mode demo --json` returns parseable JSON without ANSI/TUI output. Result: passed with a High-Risk report, score `92`.
- A fresh temporary project can install and import `@hireproof/langchain`. Result: passed with `@hireproof/langchain@1.0.0`, `@langchain/core`, and `zod`.
- A fresh temporary project can install `n8n-nodes-hireproof` and expose expected n8n package metadata/files. Result: passed with `credentials/HireProofApi.credentials.js` and `nodes/HireProof/HireProof.node.js`.
- A fresh temporary project can install and import `hireproof-sdk`. Result: `hireproof-sdk@1.0.0` exposed CommonJS/named exports but failed native ESM default import even though the README shows `import HireProof from 'hireproof-sdk'`.

SDK follow-up completed and published:

- `hireproof-sdk` is bumped to `1.0.1`.
- Package exports now include an ESM wrapper at `dist/index.mjs`.
- Verified from the published `hireproof-sdk@1.0.1` package:
  - `import HireProof from 'hireproof-sdk'` works.
  - `import { HireProof } from 'hireproof-sdk'` works.
  - `require('hireproof-sdk').HireProof` works.
  - Demo audit against `https://hireproof-sigma.vercel.app` returns High-Risk, score `92`.

Manual actions after Phase 2:

- Review npm package pages for copy/screenshots.
- Continue external n8n community and Make review flows separately.

### Phase 3: Evidence Provider Status UI

Status: complete locally as of 2026-05-04.

What changed:

- Audit result pages now render an `Evidence provider status` panel when `operations.evidenceProviders` is present.
- The panel shows provider labels, status badges, messages, fetch/cache timestamps, retry timing, and rate-limit timing when available.
- Supported visible providers include SerpApi, RDAP, DNS, Safe Browsing, Certificate Transparency, Threat Intel, Company Registry, and urlscan.
- The panel explicitly states that provider misses are operational context, not proof that an opportunity is safe.
- `docs/investigation-engine` now explains the evidence-provider status model and the neutral meaning of missing phishing hits.

Verification:

- `node --test test/runtime-wiring.test.mjs` passed.
- `npm run lint` passed.
- `npm run build` passed.
- Local live audit generated `report_1777857241946` with provider statuses for SerpApi, RDAP, DNS, Safe Browsing, Certificate Transparency, Threat Intel, Company Registry, and urlscan.
- Playwright verified `/audit/report_1777857241946` renders the provider-status panel at `375px` and `1280px` without horizontal overflow.

Remaining manual action:

- Add `GOOGLE_SAFE_BROWSING_API_KEY` in Vercel if Safe Browsing should move from `not-live` to active provider checks in production.

## Current State

The repo is on the deployed HireProof production branch with the evidence funnel, published CLI/SDK packages, native integration packs, and current docs pages implemented.

Verified so far:

- `node --test test/runtime-wiring.test.mjs` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Production smoke on `https://hireproof-sigma.vercel.app` passes for public pages, docs pages, health, demo audit, and live SSE audit with origin headers.
- `docs/remaining-work.md` and `docs/final-live-vs-pending-status.md` are the current truth boundaries for live vs external-proof work.

Current dirty areas:

- None expected before the active Phase 2 package proof pass, except documentation updates created by this action-plan refresh.

## Phase 1: Stabilize The Working Tree

Status: complete as of 2026-04-29.

1. Stop repo-local Next processes for `v0-to-Agent`.
2. Confirm no active process references:
   - `v0-to-Agent\node_modules\next`
   - `v0-to-Agent\.next\dev`
   - `next dev -p 3002`
3. Remove `.next/lock` only after confirming no repo-local Next process remains.
4. Run:
   ```powershell
   node --test test/auth-core.test.mjs test/runtime-wiring.test.mjs
   npm run lint
   npm run build
   ```
5. If build fails, fix only the exact compiler/runtime errors reported by the build.

Acceptance:

- Runtime tests pass.
- TypeScript passes.
- Production build completes.

Result:

- Repo-local Next processes were stopped before the production build retry.
- The build lock issue was resolved by configuring `withWorkflow(nextConfig, { workflows: { lazyDiscovery: true } })`.
- Workflow routes still build under `/.well-known/workflow/v1/*`.

## Phase 2: Review Affected Changes

Review and keep only intentional changes in these areas:

- `lib/ai-model.ts` and `/api/audit`: AI Gateway should be primary when configured, with OpenAI fallback.
- `lib/hireproof-bot.ts` and `/api/webhooks/slack`: ChatSDK Slack path should remain credential-gated, not claimed fully live.
- `lib/workflows/audit-workflow.ts`, `/api/workflows/audit`, and `next.config.js`: WDK route should be implemented but honest about required credentials.
- `app/home-client.tsx`: preserve the redesign unless build, mobile layout, or smoke checks show regressions.
- Docs: use "implemented, credential-gated" for ChatSDK and WDK until real platform events are verified.

Acceptance:

- No docs claim live Slack or live Workflow execution without proof.
- No unrelated work is reverted.
- Dirty files are explainable by feature or documentation purpose.

## Phase 3: Close Product Gaps

Work through the remaining product gaps in this order:

1. BYOK server audit gap:
   - Implement hybrid BYOK.
   - Keep local verification.
   - Add opt-in encrypted server-side key storage.
   - Server audit key precedence: user stored key, env key, demo fallback.

2. Webhook sandbox parity:
   - Add shared webhook signing helper.
   - Use the same signature headers for production and sandbox.
   - Show exact sandbox headers and body preview in the developer portal.

3. Verified badge:
   - Add domain records.
   - Use DNS TXT verification first.
   - Public badge response should verify only approved domains.
   - Embed code must not expose raw API keys.

4. Polish cleanup:
   - Replace Chrome Web Store wording with local install wording.
   - Fix report phishing mailto to use lowercase claim keys.
   - Label trend export accurately as JSON unless PDF is actually implemented.
   - Add local JSON cleanup/retention controls.

Acceptance:

- `docs/remaining-work.md` no longer lists completed work as open.
- User-facing claims match actual verified behavior.

Status: complete as of 2026-04-30.

Result:

- Verified badge now stores account-owned domain records, verifies DNS TXT ownership, and exposes safe public token embeds through `/api/verified-badge/script`.
- `/api/integrations/proof` reports ChatSDK, WDK, and AI Gateway E2E readiness without pretending missing credentials are live.
- Chrome extension docs are limited to local install wording.
- Legal abuse report mailto generation uses lowercase extracted claim keys.
- Trends export is an explicit `Export trends JSON` action.
- Local JSON cleanup is available through `npm run cleanup:local-data`.

## Phase 4: Local Smoke Test

Start or confirm the app on `localhost:3002`.

Smoke these routes:

```powershell
$base='http://localhost:3002'
Invoke-WebRequest -UseBasicParsing "$base/" | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing "$base/audit" | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing "$base/trends" | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing "$base/developer" | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing "$base/api/health" | Select-Object StatusCode,Content
Invoke-WebRequest -UseBasicParsing "$base/api/chat/hireproof" | Select-Object StatusCode,Content
Invoke-WebRequest -UseBasicParsing "$base/api/workflows/audit" | Select-Object StatusCode,Content
```

Acceptance:

- All pages return `200`.
- `/api/health` reports storage, model, and live search honestly.
- ChatSDK and Workflow endpoints return credential-gated status if credentials are absent.

## Phase 5: Checkpoint And Sync

Do not commit or push until explicitly requested.

Commit rule:

- Only commit after the exact phrase `create checkpoint commit`.

After checkpoint commit:

1. Push `main` to GitHub only if explicitly asked.
2. Deploy production Vercel only after push.
3. Verify the deployed URL and canonical app URL.
4. Smoke production:
   - `/`
   - `/audit`
   - `/trends`
   - `/developer`
   - `/docs/triple-track-coverage`
   - `/api/health`

Acceptance:

- GitHub has the checkpoint commit.
- Vercel production deploy is ready.
- Production smoke test passes.
- Final status reports exact URL, commit hash, and any remaining credential-gated items.

## Remaining Decisions

Defaults already chosen:

- BYOK mode: hybrid.
- Badge ownership: DNS TXT.
- Deploy target: production Vercel.
- ChatSDK/WDK language: implemented but credential-gated until live events are verified.
