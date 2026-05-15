# HireProof — Bugbot rules (repository root)

Review priorities for pull requests touching HireProof. Nested rules under `app/api/.cursor/BUGBOT.md` and `lib/.cursor/BUGBOT.md` add path-specific checks.

## Security-critical paths

- `app/api/audit/**`
- `app/api/v1/audit/**`
- `app/api/developer/**`
- `app/api/mcp/**`
- `lib/auth-store.ts`
- `lib/provider-verification.ts`
- `lib/mcp-tools.ts`
- `lib/schemas.ts`

## Blocking rules

- Flag any new `fetch()` to user-provided URLs that lacks hostname validation, timeouts, or SSRF controls.
- Flag any change that weakens origin/referrer checks, rate limits, API-key checks, or webhook signature validation.
- Flag any diff that logs secrets, raw provider keys, cookies, encrypted blobs, or internal tokens.
- Flag any change that makes demo mode appear live or makes evidence provenance less explicit to end users.
- Flag backend changes in `app/api/**` or `lib/**` if there are no corresponding updates under `test/**` when behavior changes.

## Non-blocking rules

- Flag stale docs when route names, env vars, or API examples change without README, `DEPLOYMENT.md`, `.env.example`, or `/docs` updates.
- Flag UX copy that overstates certainty or fails to describe evidence limitations.

## Product boundary

- Do not suggest routing end-user fraud **verdicts** through Cursor agents; `/api/audit`, `/api/v1/audit`, and the scorer remain product truth.

## Autofix

- Prefer Autofix on a **new branch** only; do not auto-push to the contributor's PR branch until review quality is proven.
