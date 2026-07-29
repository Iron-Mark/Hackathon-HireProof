# Branch Policy

HireProof uses `main` as the production branch and `dev` as the development/staging branch.

## Required Flow

1. Create feature and fix branches from `dev`.
2. Open pull requests from feature branches into `dev`.
3. Promote releases with a pull request from `dev` into `main`.

Do not open feature branches directly into `main`. The required `branch-flow-guard` check fails `main` pull requests unless the source branch is `dev`.

## Protected Branches

Both `main` and `dev` are protected by GitHub branch protection and the repository ruleset named `Protect production and development branches`.

Required checks:

- `lint-build-cursor-tests`
- `branch-flow-guard`
- `codeql-analyze (javascript-typescript)`
- `CodeQL`

The ruleset also requires pull requests, blocks force pushes, and blocks branch deletion for `main` and `dev`. Both branches use "require branches to be up to date" and include administrators.

## Syncing `dev` After a Promotion

Merging a `dev` -> `main` promotion creates a merge commit on `main` that `dev` does not have, so `dev` is immediately behind. Because `main` requires branches to be up to date, the next promotion is unmergeable until `dev` catches up, and there is no manual escape: `branch-flow-guard` rejects a `main` -> `dev` pull request, the ruleset rejects a direct push to `dev`, and administrator overrides are disabled.

`.github/workflows/sync-main-to-dev.yml` handles this. On every push to `main` it stages production history on `chore/sync-dev-with-main` and opens that branch into `dev`. The head branch is deliberately not named `main`, which is what `branch-flow-guard` rejects. Merge that pull request with a merge commit; squashing or rebasing rewrites production history and leaves `dev` behind again. The workflow is a green no-op when `dev` already contains `main`.

The workflow needs a `SYNC_BACK_TOKEN` repository secret to be fully automatic. Without it the sync pull request is opened with the default `GITHUB_TOKEN`, and GitHub does not fire `pull_request` events for those, so the required checks above never start. Until the secret exists, close and reopen the sync pull request to trigger them; the workflow says so in its job summary and in the pull request body.

## Code Scanning

CodeQL runs on pull requests and pushes for `main` and `dev`. Treat open CodeQL findings as release blockers unless they have been explicitly triaged and dismissed with a reason in GitHub code scanning.
