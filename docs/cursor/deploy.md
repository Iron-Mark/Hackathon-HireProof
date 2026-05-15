# Cursor integration — deploy and ops

**Status:** Production-ready routes behind feature flags. Cursor accelerates **contributor and ops workflows** only—it does not participate in public audit verdicts.

Use this page when enabling Cursor on **Vercel** (or another Node host). Never commit API keys, webhook secrets, or generated tokens to the repository.

## Prerequisites

- Vercel project linked to this repo (see [DEPLOYMENT.md](../../DEPLOYMENT.md) for project metadata).
- A **Cursor Cloud Agents API key** from the Cursor dashboard (server-side only).
- Cursor Cloud Agent environment reviewed for install/start commands, scoped secrets, and audit visibility (see [cloud-environments.md](./cloud-environments.md)).
- **Redis / Upstash** already configured if you rely on durable run history (same as other developer features).
- `GITHUB_REPO_URL` set to the canonical GitHub remote (required for **cloud** runs when `CURSOR_ALLOWED_REPO_URL` is unset).

## Vercel environment variables

Set these in **Project → Settings → Environment Variables**. Use **Production** only after preview validation; use **Preview** first for UI QA.

| Variable | Required | Environments | Purpose |
| --- | --- | --- | --- |
| `CURSOR_INTEGRATION_ENABLED` | Yes (to turn on) | Production, Preview (optional) | Must be exactly `true` to allow runs. Default off in [`.env.example`](../../.env.example). |
| `CURSOR_API_KEY` | Yes (when enabled) | Production, Preview | Cursor Cloud Agents API key. **Never** expose to the browser or client bundles. |
| `CURSOR_WEBHOOK_SECRET` | Yes (for cron routes) | Production, Preview | Shared secret for `x-cursor-job-secret` on `/api/internal/cursor/*`. |
| `CURSOR_ALLOWED_REPO_URL` | Strongly recommended | Production, Preview | Pins cloud agents to one repo URL. Prevents arbitrary repo targets. |
| `GITHUB_REPO_URL` | Recommended | All | Fallback repo pin when `CURSOR_ALLOWED_REPO_URL` is empty. |
| `CURSOR_MODEL_ID` | No | Production, Preview | Model id (default `composer-2`). |
| `CURSOR_RUNTIME_DEFAULT` | No | Production, Preview | `cloud` or `local` for developer portal runs (default `cloud`). |
| `CURSOR_MAX_CONCURRENT_RUNS` | No | Production, Preview | In-flight cap per deployment (default `2`). |
| `APP_BASE_URL` | Recommended | Production, Preview | Canonical site URL for QA prompts when `baseUrl` is omitted. Use **preview URL** on preview deployments. |

Related (not Cursor-specific but required for cloud QA targeting):

| Variable | Purpose |
| --- | --- |
| `APP_BASE_URL` | Default `baseUrl` for `POST /api/internal/cursor/ui-qa` and developer preset `qa-walkthrough`. |
| `SESSION_SECRET` | Developer portal session auth for `GET`/`POST /api/developer/cursor/runs`. |

CI does **not** need Cursor variables: [`.github/workflows/cursor-integration.yml`](../../.github/workflows/cursor-integration.yml) runs lint, build, and `test/cursor*.test.mjs` without a key.

## Step-by-step: enable integration

### 1. Add secrets in Vercel (Preview first)

1. Open [Vercel](https://vercel.com) → your HireProof project → **Settings** → **Environment Variables**.
2. Add `CURSOR_API_KEY` (value from Cursor dashboard). Scope: **Preview** only for the first pass.
3. Generate `CURSOR_WEBHOOK_SECRET` locally (see below) and add it to Preview (and later Production).
4. Set `CURSOR_ALLOWED_REPO_URL` to your canonical GitHub repo URL (same value as `GITHUB_REPO_URL` in [`.env.example`](../../.env.example)).
5. Set `APP_BASE_URL` on Preview to the deployment’s preview domain (e.g. `https://hireproof-git-<branch>-<team>.vercel.app`), not production user traffic.
6. Leave `CURSOR_INTEGRATION_ENABLED` unset or `false` until step 3.
7. Confirm the Cursor Cloud Agent environment uses safe install/start commands and scoped secrets before starting scheduled runs.

### 2. Generate `CURSOR_WEBHOOK_SECRET`

Run locally (do not paste the output into docs or git):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

PowerShell equivalent:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the single line into Vercel as `CURSOR_WEBHOOK_SECRET`. The same value must be sent by schedulers as header `x-cursor-job-secret` (see [automation.md](./automation.md)).

### 3. Enable the feature flag

1. Set `CURSOR_INTEGRATION_ENABLED=true` on the target environment(s).
2. Redeploy (or trigger a new deployment) so serverless functions pick up env changes.
3. Confirm **Developer portal → Cursor Agents** shows operational status (not “disabled” / “credential-required”).
4. Optional local check: `node scripts/cursor-smoke.mjs` with `.env.local` loaded and dev server on port `3002`.

### 4. Smoke internal routes (Preview)

With dev server or Preview URL running and env configured:

- `GET /api/internal/cursor/nightly-repo-health` + header `x-cursor-job-secret: <your secret>` → expect `202` and a `runId` when operational.
- `POST /api/internal/cursor/ui-qa` with JSON `{ "baseUrl": "https://your-preview.example" }` and the same header → expect `202`.

Without the header: `401`. Without `CURSOR_WEBHOOK_SECRET` on the deployment: `503`. With flag off or missing API key: `503` with `credential-required`.

### 5. Promote to Production

Repeat env setup for **Production**, set `APP_BASE_URL=https://hireproof.tech` (or your canonical domain), then enable `CURSOR_INTEGRATION_ENABLED=true` only when you accept cloud spend on that environment.

## Cursor Bugbot (dashboard)

Bugbot is configured in **Cursor**, not in Vercel env vars. HireProof rules live in [`.cursor/BUGBOT.md`](../../.cursor/BUGBOT.md) and nested paths (see [bugbot.md](./bugbot.md)).

1. Sign in to the [Cursor dashboard](https://cursor.com) with access to this GitHub org/repo.
2. Open **Bugbot** (or **Integrations → GitHub**) and connect the HireProof repository if not already linked.
3. Enable **review on pull requests** for this repo (review-only first).
4. Merge or verify versioned `BUGBOT.md` files are on `main`.
5. After a baseline of PRs, enable **learned rules** and optionally **Autofix on new branch** only if false-positive rate is acceptable (see [bugbot.md](./bugbot.md)).

Bugbot does not run from GitHub Actions in this repo—the workflow only documents the manual check requirement.

## GitHub branch protection

After Bugbot has commented on at least one PR:

1. GitHub → **Settings** → **Branches** → edit rule for `main` (or your default branch).
2. Enable **Require status checks to pass before merging**.
3. Add the **Cursor Bugbot** check (exact name may appear after the first Bugbot run on a PR).
4. Keep existing CI checks (`lint-build-cursor-tests` from [cursor-integration.yml](../../.github/workflows/cursor-integration.yml)) required.

Do not treat Bugbot as a substitute for `npm run lint`, `npm run build`, `node --test`, or Playwright—see [qa.md](./qa.md).

## Operational boundaries

| Do | Do not |
| --- | --- |
| Use Preview `APP_BASE_URL` for UI QA cron | Point UI QA at production for exploratory agents |
| Pin repo with `CURSOR_ALLOWED_REPO_URL` | Allow user-supplied repo URLs in production |
| Store keys only in Vercel / host secrets | Log `CURSOR_API_KEY`, webhook secret, or Bearer tokens |
| Keep Cursor environment secrets scoped and auditable | Reuse broad production secrets across agent environments |
| Cap runs with `CURSOR_MAX_CONCURRENT_RUNS` | Trigger Cursor on every end-user audit |

## Rollback

1. Set `CURSOR_INTEGRATION_ENABLED=false` (or remove it) on affected environments.
2. Redeploy.
3. Disable scheduled jobs calling `/api/internal/cursor/*` (see [automation.md](./automation.md)).
4. Optional: remove Bugbot required check from branch protection without deleting `BUGBOT.md` files.

## Related docs

- [automation.md](./automation.md) — cron, Preview URL workflow, smoke script
- [cloud-environments.md](./cloud-environments.md) — Cloud Agent environment setup
- [overview.md](./overview.md) — architecture boundaries
- [bugbot.md](./bugbot.md) — rule philosophy
- [qa.md](./qa.md) — release checklist
