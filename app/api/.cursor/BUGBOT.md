# HireProof — Bugbot rules (`app/api/`)

Extends repository root `.cursor/BUGBOT.md` for API routes.

## Scope

All route handlers under `app/api/**`, especially:

- `audit`, `v1/audit` — investigation pipeline and SSE
- `mcp` — tool registry and invocation
- `developer/**` — API keys, provider credentials, webhooks
- `workflows/**`, `webhooks/**` — async and signed delivery
- `internal/**` — must never be callable without shared secrets

## Blocking (API-specific)

- Flag missing or weakened `x-api-key`, session, or origin checks on mutating routes.
- Flag new outbound requests to user-controlled hosts without SSRF guardrails used elsewhere in the repo.
- Flag changes to audit response shape without `lib/schemas.ts` and consumer updates.
- Flag workflow or webhook triggers callable without `WORKFLOW_SECRET` / equivalent when that pattern exists on sibling routes.

## Tests

- Route behavior changes should include or update tests under `test/**` (runtime wiring, route contracts, or documented manual proof in PR description for doc-only routes).
