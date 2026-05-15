# Cursor Cloud Agent Environments

**Status:** Readiness guide. Use this before relying on Cursor Cloud Agents for repo health, UI QA, or automated PR work.

Cursor Cloud Agents run in isolated development environments. Current Cursor docs and changelog language emphasize environment configuration, environment versioning, scoped secrets, audit logs, and multi-repo support. HireProof should treat those controls as operational setup, not app runtime behavior.

## HireProof Baseline

| Area | Recommendation |
| --- | --- |
| Install command | `npm ci` |
| Dev server terminal | `npm run dev` on port `3002` |
| Verification commands | `npm run lint`, `npm run build`, `node --test test/cursor*.test.mjs` |
| Repo scope | Single repo by default: `CURSOR_ALLOWED_REPO_URL` |
| Secrets | Store in Cursor/Vercel dashboards only; never commit local values |
| Network | Prefer Preview URLs for UI QA; avoid production cron unless explicitly approved |

## Environment-As-Code Stance

HireProof commits a minimal [`.cursor/environment.json`](../../.cursor/environment.json). Keep it reviewable. Do not copy the whole repo into a Dockerfile; Cursor checks out the workspace. The environment file should only describe install/start behavior and safe terminals.

Committed shape:

```json
{
  "install": "npm ci",
  "terminals": [
    {
      "name": "HireProof Next.js dev server",
      "command": "npm run dev"
    }
  ]
}
```

## Governance Checklist

- Confirm environment secrets are scoped to the specific Cursor environment.
- Confirm only required repos are attached; use multi-repo only when a task needs it.
- Confirm environment version history/audit log is visible to the team owner.
- Keep rollback permissions limited to admins when available.
- Record which environment version was used when accepting Cloud Agent work.
- Require normal repo gates after Cloud Agent output: lint, build, targeted tests, and human review.

## Related

- [deploy.md](./deploy.md) - Vercel and server env setup
- [automation.md](./automation.md) - scheduled Cloud Agent route triggers
- [qa.md](./qa.md) - release checks and Cloud Agent QA boundaries
