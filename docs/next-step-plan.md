# HireProof Next Step Plan

Last checked: 2026-04-29

## Current State

The repo has uncommitted work touching the AI model provider path, ChatSDK Slack integration, Vercel Workflow wiring, homepage, docs, package dependencies, and runtime tests.

Verified so far:

- `node --test test/auth-core.test.mjs test/runtime-wiring.test.mjs` passes.
- `npm run lint` passes.
- `npm run build` passes after enabling Workflow lazy discovery in `next.config.js`.
- Local smoke on `http://localhost:3002` passes for `/api/health`, `/api/audit`, `/api/chat/hireproof`, `/api/workflows/audit`, and `/docs`.
- `docs/remaining-work.md` is the current punch list for product gaps.

Current dirty areas:

- AI Gateway model helper and `/api/audit` changes.
- ChatSDK Slack webhook route and bot wrapper.
- Vercel Workflow route, workflow helper, and `next.config.js` plugin.
- Homepage redesign in `app/home-client.tsx`.
- Docs and env updates for credential-gated ChatSDK/WDK claims.
- `package.json` and `package-lock.json` dependency changes.

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
