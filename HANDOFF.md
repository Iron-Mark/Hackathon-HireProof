# HireProof Handoff

Updated: 2026-08-04, Asia/Manila

## Resume Here

1. Read `AGENTS.md` and `docs/README.md`.
2. Inspect `git status --short --branch` and refresh remote refs before relying
   on the commit snapshot below.
3. Use `docs/current-audit-behavior.md` for product behavior,
   `docs/scoring-algorithm.md` for deterministic scoring, and
   `docs/branch-policy.md` for branch flow.
4. Use `docs/remaining-work.md` only after checking its date and current repo
   evidence; it contains historical production proof as well as follow-ups.

## Branch Snapshot

Verified locally on 2026-08-04:

- Local branch: `dev` at `1009345`.
- `origin/dev`: `60d6d40`; local `dev` is ahead by one local tooling-ignore
  commit.
- `origin/main`: `6e620be`, the PR #102 synchronization from `dev`.
- No commit or push is implied by this handoff. Preserve the local-ahead commit
  until the owner chooses its destination.

## Product and Plan Status

- Keep the product focused on job and recruiter fraud; do not claim ML,
  continuous learning, or in-house deepfake detection.
- The honest-core audit and deterministic scoring work has shipped. The source
  of truth is current code, `docs/scoring-algorithm.md`, and the regression
  tests; `docs/superpowers/plans/` is historical implementation context.
- External publication, provider credentials, store/review actions, and fresh
  production proof remain account-backed tasks. Do not convert older evidence
  notes into a current production claim without live verification.

## Verification

Start with:

```powershell
npm run lint
npm run test:security
npm run build
```

For release or production claims, follow the scoped proof commands in
`docs/remaining-work.md` and set explicit target URLs; local-default proof is
not production proof.
