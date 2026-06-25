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

The ruleset also requires pull requests, blocks force pushes, and blocks branch deletion for `main` and `dev`.

## Code Scanning

CodeQL runs on pull requests and pushes for `main` and `dev`. Treat open CodeQL findings as release blockers unless they have been explicitly triaged and dismissed with a reason in GitHub code scanning.
