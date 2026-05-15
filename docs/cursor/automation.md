# Cursor integration — automation and cron

Secured ops routes for **scheduled repo health** and **preview UI QA**. Both require header `x-cursor-job-secret` matching deployment env `CURSOR_WEBHOOK_SECRET`, and an operational integration (`CURSOR_INTEGRATION_ENABLED=true` + `CURSOR_API_KEY`).

Deploy env setup: [deploy.md](./deploy.md).

## Routes

| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/internal/cursor/nightly-repo-health` | — | Start cloud **repo-health** preset (lint/build/docs drift style prompt). |
| `POST` | `/api/internal/cursor/ui-qa` | `{ "baseUrl": "https://…" }` optional | Start **qa-walkthrough** against `/audit`, `/developer`, `/docs` on the given host. |

Successful start: HTTP `202` with `runId` / `recordId`. Misconfigured secret: `401`. Missing `CURSOR_WEBHOOK_SECRET` on server: `503`. Integration off or no API key: `503` with `credential-required`.

Replace `BASE` and `SECRET` in examples below. Never commit `SECRET` to the repo.

## Preview URL workflow

Use this before promoting Cursor cron jobs to production traffic.

1. **Deploy a Preview** from a branch (Vercel Preview deployment).
2. Copy the Preview URL (e.g. `https://hireproof-git-feature-xyz.vercel.app`).
3. In Vercel **Preview** env, set `APP_BASE_URL` to that URL (or pass `baseUrl` explicitly in the UI QA call).
4. Ensure Preview has: `CURSOR_INTEGRATION_ENABLED=true`, `CURSOR_API_KEY`, `CURSOR_WEBHOOK_SECRET`, and repo pin vars.
5. **Trigger UI QA** once manually (curl or PowerShell below) with `"baseUrl": "<preview-url>"`.
6. Review run metadata in **Developer portal → Cursor Agents** (when logged in) or Cursor dashboard run history.
7. When satisfied, attach the same cron to **Production** only if you intend ops jobs on production—prefer keeping UI QA on Preview-only schedules.

Default when `baseUrl` is omitted: server uses `APP_BASE_URL`, then the request origin. For cron, **always pass `baseUrl` explicitly** so Preview jobs do not accidentally target production.

## Linux / macOS cron (curl)

Edit crontab (`crontab -e`). Example times are UTC; adjust to your ops window.

```cron
# Nightly repo health — 02:15 UTC daily
15 2 * * * curl -fsS -X GET \
  -H "x-cursor-job-secret: SECRET" \
  "https://hireproof.tech/api/internal/cursor/nightly-repo-health" \
  >> /var/log/hireproof-cursor-nightly.log 2>&1

# UI QA on latest Preview — Mondays 09:00 UTC (set BASE to current preview URL)
0 9 * * 1 curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -H "x-cursor-job-secret: SECRET" \
  -d '{"baseUrl":"https://hireproof-git-main-yourteam.vercel.app"}' \
  "https://hireproof.tech/api/internal/cursor/ui-qa" \
  >> /var/log/hireproof-cursor-ui-qa.log 2>&1
```

For **Preview-only** scheduling, point both URLs at the Preview deployment host instead of `hireproof.tech`.

Local dev (server on port `3002`):

```bash
export CURSOR_WEBHOOK_SECRET='your-local-secret'
curl -fsS -X GET \
  -H "x-cursor-job-secret: $CURSOR_WEBHOOK_SECRET" \
  "http://127.0.0.1:3002/api/internal/cursor/nightly-repo-health"
```

## Windows Task Scheduler (PowerShell)

Store the secret in the user or machine secret store, or pass via Task Scheduler environment—**not** in a committed script.

**Nightly repo health:**

```powershell
$Base = "https://hireproof.tech"
$Secret = $env:CURSOR_WEBHOOK_SECRET  # set in Task action / system env

Invoke-RestMethod -Method Get `
  -Uri "$Base/api/internal/cursor/nightly-repo-health" `
  -Headers @{ "x-cursor-job-secret" = $Secret }
```

**UI QA (Preview):**

```powershell
$Base = "https://hireproof.tech"
$PreviewUrl = "https://hireproof-git-main-yourteam.vercel.app"
$Secret = $env:CURSOR_WEBHOOK_SECRET

$body = @{ baseUrl = $PreviewUrl } | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "$Base/api/internal/cursor/ui-qa" `
  -ContentType "application/json" `
  -Headers @{ "x-cursor-job-secret" = $Secret } `
  -Body $body
```

Register tasks in **Task Scheduler** → Create Task → Triggers (daily / weekly) → Action: `powershell.exe` with `-File` pointing to a private `.ps1` that sets `$env:CURSOR_WEBHOOK_SECRET` from secure storage.

## Vercel Cron (optional, verify first)

If you use [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs), first verify the current plan/runtime can deliver the required `x-cursor-job-secret` header or can call a small server-side wrapper that adds it. Protect routes only with `x-cursor-job-secret`—do not disable auth by making these routes public without the header.

Example shape (adjust schedule and path; store `CURSOR_WEBHOOK_SECRET` in Vercel env, inject in a small Route Handler or use an external worker that adds the header):

- Schedule: `15 2 * * *` → `GET /api/internal/cursor/nightly-repo-health`
- Schedule: `0 9 * * 1` → `POST /api/internal/cursor/ui-qa` with Preview `baseUrl` in body

If custom headers are unsupported, use an external scheduler (cron, GitHub Actions, Azure Logic Apps) that calls the public HTTPS URL with `x-cursor-job-secret`.

## GitHub Actions (scheduled workflow)

For orgs that prefer CI schedulers, a private workflow can `curl` production or preview. Store `CURSOR_WEBHOOK_SECRET` as a GitHub **repository secret** (not in workflow YAML values).

```yaml
# .github/workflows/cursor-ops-cron.yml (example — not committed by default)
on:
  schedule:
    - cron: '15 2 * * *'
jobs:
  nightly-repo-health:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger nightly repo health
        env:
          CURSOR_WEBHOOK_SECRET: ${{ secrets.CURSOR_WEBHOOK_SECRET }}
        run: |
          curl -fsS -X GET \
            -H "x-cursor-job-secret: ${CURSOR_WEBHOOK_SECRET}" \
            "https://hireproof.tech/api/internal/cursor/nightly-repo-health"
```

Use a separate secret or variable for `PREVIEW_BASE_URL` when scheduling UI QA.

## Local smoke script

[`scripts/cursor-smoke.mjs`](../../scripts/cursor-smoke.mjs) calls internal routes when integration env is fully set; otherwise it exits `0` with a skip message.

```bash
# From repo root, with .env.local loaded in the shell or via your tooling
export CURSOR_INTEGRATION_ENABLED=true
export CURSOR_API_KEY='…'
export CURSOR_WEBHOOK_SECRET='…'
npm run dev   # separate terminal, port 3002

node scripts/cursor-smoke.mjs
```

Optional: `APP_BASE_URL` or `HIREPROOF_CURSOR_SMOKE_BASE_URL` for UI QA target (defaults to `http://127.0.0.1:3002`).

## Cost and safety discipline

- Do not schedule UI QA against production more than needed; prefer Preview + explicit `baseUrl`.
- One nightly repo health per day is usually enough; avoid overlapping triggers.
- Respect `CURSOR_MAX_CONCURRENT_RUNS`—back-to-back cron fires may return `429` / `502` if the cap is hit.
- Rotate `CURSOR_WEBHOOK_SECRET` by updating Vercel env and all schedulers together.

## Related docs

- [deploy.md](./deploy.md) — Vercel variables and enablement
- [cloud-environments.md](./cloud-environments.md) — Cloud Agent environment setup
- [qa.md](./qa.md) — release checklist vs advisory Cursor QA
- [overview.md](./overview.md) — what Cursor must not own
