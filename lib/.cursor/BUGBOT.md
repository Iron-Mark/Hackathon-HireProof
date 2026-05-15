# HireProof — Bugbot rules (`lib/`)

Extends repository root `.cursor/BUGBOT.md` for shared server logic.

## Scope

- `lib/mcp-tools.ts` — investigation tools exposed via MCP
- `lib/auth-store.ts`, provider encryption — BYOK and sessions
- Scoring, claim extraction, enrichment — verdict inputs (not Cursor-owned)
- Shared fetch/HTTP helpers — SSRF and timeout policy

## Blocking (library-specific)

- Flag relaxed validation in Zod schemas used by public APIs without migration notes.
- Flag new environment variable reads without `.env.example` documentation.
- Flag decryption or logging paths that could expose provider payloads or `BYOK_ENCRYPTION_KEY` material.
- Flag changes that remove or blur **demo vs live** signaling in data returned to the UI.

## MCP-first contributor note

Agents editing investigation helpers should keep tool contracts stable for `/api/mcp` clients; breaking renames require docs and schema updates.
