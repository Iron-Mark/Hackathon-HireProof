# Branch Consolidation - 2026-05-20

This note records the branch cleanup decision for consolidating HireProof back onto `main`.

## Source of Truth

- `main` / `origin/main` remains the release source of truth.
- `origin/main` already contains the merged Cursor integration PR plus the Vercel proxy/SWC runtime hardening.
- Whole-branch merges from the stale side branches were intentionally avoided because they would roll back current `main` deployment fixes.

## Preserved in `main`

- Dependency security fixes:
  - `next` upgraded to `16.2.6`.
  - npm overrides pin fixed transitive versions for `tar`, `sqlite3`, `node-gyp`, `devalue`, `ws`, `brace-expansion`, `@tootallnate/once`, `make-fetch-happen`, `http-proxy-agent`, and `cacache`.
  - `npm audit --audit-level=low` reports zero vulnerabilities locally.
- Branch work from `origin/cursor-hackathon`:
  - Cursor pretool guard stdin hardening from `d268a28`.
  - CLI TUI polish from `f32f4ab`.
  - Local research-agent workflow with Cursor primary and Codex SDK fallback from `c53d867`.
  - `artifacts/research-agent/` ignored by default so local research prompts and reports do not get committed accidentally.
- Branch work from `feature/cursor-integration`:
  - Already merged through PR #2 and preserved on `main`.
- Branch work from `backup/accidental-fe4f81e`:
  - The stale apply-path mismatch filtering logic was already present in current `main` code.
  - The stale branch itself was not merged because it would delete or roll back many current app, docs, Cursor, integration, and proof files.

## Not Merged Directly

- `origin/cursor-hackathon` still contains stale deployment config that removes current Node 20, Vercel middleware includeFiles, and SWC helper hardening.
- `feature/cursor-integration` contains older lockfile/runtime state that would remove the current postbuild middleware trace patch.
- `backup/accidental-fe4f81e` is based on an older repo state and is unsafe to merge as a branch.

## Cleanup Rule

After verification and push, stale branches can be deleted because their useful changes are either:

- already present in `main`,
- superseded by safer `main` changes, or
- preserved in this consolidation checkpoint.
