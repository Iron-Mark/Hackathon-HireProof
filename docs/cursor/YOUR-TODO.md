# Cursor integration — YOUR-TODO

Last updated by agent: 2026-05-15 (branch `feature/cursor-integration`).

## Done by agent

- Staged and committed cursor integration polish: Turbopack `*.LICENSE.txt` rule in `next.config.js`, pretool guard + tests, `.cursor/environment.json` + rules, cloud-environments doc + site page, cursor docs updates (`deploy.md`, `automation.md`, `sdk.md`, `overview.md`, `bugbot.md`).
- Pushed `feature/cursor-integration` to `origin`; PR [#2](https://github.com/Iron-Mark/Hackathon-HireProof/pull/2) includes all commits (see PR comment for SHAs).
- **Verify:** `npm run lint` pass; `node --test test/cursor*.test.mjs` **10/10** pass; `npm run cursor:orchestrate -- --no-codex` pass; full `npm run cursor:orchestrate` pass (Codex deploy checklist phase 3).
- **Build:** `npm run build` — Turbopack compiles; on Windows, delete `.next` if a stale workflow `.map` write fails, then rebuild.
- **Vercel CLI:** `vercel whoami` → `iron-mark`; project linked (`iron-marks-projects/hireproof`). `vercel env ls` — **no `CURSOR_*` variables yet** (existing app secrets only; values **Encrypted** in CLI).
- Example env script: `scripts/vercel-cursor-env-setup.ps1.example` (placeholders + commented `vercel env add` for Preview + Production).
- PR comment posted with commit SHAs, doc links, test summary, and manual `CURSOR_API_KEY` note.

## You must do

1. **Review and merge PR #2** when CI is green — [https://github.com/Iron-Mark/Hackathon-HireProof/pull/2](https://github.com/Iron-Mark/Hackathon-HireProof/pull/2). Do not merge until you approve.
2. **Set Vercel secrets** — Copy `scripts/vercel-cursor-env-setup.ps1.example` → `scripts/vercel-cursor-env-setup.ps1`, fill placeholders, run **Preview first**; or use Dashboard → Environment Variables. Paste `CURSOR_API_KEY` from Cursor Cloud Agents (never commit).
3. **Generate and set** `CURSOR_WEBHOOK_SECRET` (32-byte hex) on Preview + schedulers; see [deploy.md](./deploy.md).
4. **Set** `CURSOR_INTEGRATION_ENABLED=true` only after Preview smoke passes; redeploy.
5. **Enable Cursor Bugbot** in the Cursor dashboard for this repo (rules in `.cursor/BUGBOT.md`).
6. **Schedule cron** for nightly repo health / UI QA per [automation.md](./automation.md) (header `x-cursor-job-secret`).
7. **Smoke** Developer portal → Cursor Agents and optional `node scripts/cursor-smoke.mjs` against Preview.
8. **Optional** — Phase 2 SDK smoke needs local or Preview env: `CURSOR_API_KEY` + `CURSOR_INTEGRATION_ENABLED=true`, then re-run `npm run cursor:orchestrate`.

### Quick secrets (PowerShell, from repo root)

Replace placeholders; run Preview lines first, Production after QA.

```powershell
$k = '<CURSOR_API_KEY>'; $s = '<32_BYTE_HEX>'; $repo = 'https://github.com/Iron-Mark/Hackathon-HireProof'
$k | vercel env add CURSOR_API_KEY preview; $s | vercel env add CURSOR_WEBHOOK_SECRET preview
$repo | vercel env add CURSOR_ALLOWED_REPO_URL preview; 'composer-2' | vercel env add CURSOR_MODEL_ID preview
'cloud' | vercel env add CURSOR_RUNTIME_DEFAULT preview; '2' | vercel env add CURSOR_MAX_CONCURRENT_RUNS preview
# After Preview smoke: repeat for production; then: 'true' | vercel env add CURSOR_INTEGRATION_ENABLED preview
```

## CI note (check PR)

| Check | Status |
| --- | --- |
| `lint-build-cursor-tests` | See PR checks |
| Vercel Preview | See PR |
| Bugbot | Manual — Cursor dashboard |

## Links

- Deploy runbook: [deploy.md](./deploy.md)
- Automation / cron: [automation.md](./automation.md)
- Orchestration phases: [orchestration.md](./orchestration.md)
- Cloud environments: [cloud-environments.md](./cloud-environments.md)
