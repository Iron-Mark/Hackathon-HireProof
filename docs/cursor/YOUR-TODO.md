# Cursor integration — YOUR-TODO

Last updated: 2026-05-15 (`feature/cursor-integration`).

## Done by agent

- [x] Cursor integration code, docs, Bugbot rules, orchestrator, pretool guard
- [x] `scripts/setup-cursor-secrets.ps1` — interactive Vercel env (Preview + Production)
- [x] `.cursor/skills/security-reviewer/SKILL.md` — points at BUGBOT rules
- [x] API playground Cursor preset copy buttons (`components/docs/api-playground.tsx`)
- [x] CI: merged `package.json` overrides + `package-lock.json` sync for `npm ci` (npm 10.8.2)

PR: [#2](https://github.com/Iron-Mark/Hackathon-HireProof/pull/2)

## You must do (manual)

- [ ] **Merge PR #2** when `lint-build-cursor-tests` is green — [PR #2](https://github.com/Iron-Mark/Hackathon-HireProof/pull/2)
- [ ] **Set secrets** — from repo root: `.\scripts\setup-cursor-secrets.ps1`
- [ ] **Enable Bugbot** — [Cursor dashboard](https://cursor.com/dashboard) → your repo → enable Bugbot (rules: `.cursor/BUGBOT.md`)
- [ ] **Branch protection** — GitHub → Settings → Branches → require `lint-build-cursor-tests` (and Bugbot when enabled)
- [ ] **Redeploy Preview** after env changes; smoke Developer portal → Cursor Agents
- [ ] **Optional:** schedule cron per [automation.md](./automation.md) (`x-cursor-job-secret`)

## Quick start (secrets)

```powershell
cd "C:\Codes Local\Hackathons (Workspace)\HireProof"
.\scripts\setup-cursor-secrets.ps1
```

Dry-run (no `vercel env add`):

```powershell
.\scripts\setup-cursor-secrets.ps1 -DryRun
```

Get **CURSOR_API_KEY**: [Cursor dashboard](https://cursor.com/dashboard) → Cloud Agents → API keys (server-side only; never commit).

## Links

| Topic | Doc |
| --- | --- |
| Deploy / env vars | [deploy.md](./deploy.md) |
| Cron / automation | [automation.md](./automation.md) |
| Orchestration phases | [orchestration.md](./orchestration.md) |
| Cloud environments | [cloud-environments.md](./cloud-environments.md) |
| Bugbot rollout | [bugbot.md](./bugbot.md) |

## CI

| Check | Notes |
| --- | --- |
| `lint-build-cursor-tests` | `npm ci`, lint, build, `node --experimental-strip-types --test test/cursor*.test.mjs` |
| Vercel Preview | Deploy on PR |
| Cursor Bugbot | Manual — dashboard only |
