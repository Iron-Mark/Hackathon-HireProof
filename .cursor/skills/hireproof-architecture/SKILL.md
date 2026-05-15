---
name: hireproof-architecture
description: >-
  Contribute safely to the HireProof repository. Use when editing app/api, lib,
  docs, or security-sensitive UI—not when investigating end-user job posts
  (use .agents/skills/hireproof instead).
---

# HireProof — repository architecture skill

You are working **inside the HireProof codebase** (Next.js App Router, TypeScript, MCP, audit APIs).

This skill is **not** the job-investigation skill. For verifying job listings with live tools, use `.agents/skills/hireproof/SKILL.md`.

## Non-negotiable constraints

- Never remove or weaken **live vs demo** disclosures in UI or API responses.
- Preserve **origin/referrer validation**, rate limits, payload limits, and **SSRF** protections on outbound fetches.
- Never log API keys, `SESSION_SECRET`, webhook secrets, `WORKFLOW_SECRET`, or decrypted provider payloads.
- Prefer **evidence-backed** user-facing copy; avoid certainty language the scorer cannot support.
- **Cursor does not own verdicts** — do not route product fraud decisions through Cursor; use `/api/audit`, `/api/v1/audit`, and `lib/mcp-tools.ts`.

## Where to look

| Area | Files |
| --- | --- |
| Browser audit + SSE | `app/api/audit/route.ts` |
| Headless audit | `app/api/v1/audit/route.ts` |
| MCP tools | `app/api/mcp/route.ts`, `lib/mcp-tools.ts` |
| Schemas | `lib/schemas.ts` |
| Developer BYOK | `app/api/developer/provider-credentials`, `lib/auth-store.ts` |
| Contributor docs | `docs/cursor/`, `docs/AGENTS.md` |

## Investigation-related edits

When the task involves company validation, recruiter checks, or tool behavior:

- Prefer **HireProof MCP tools** (or headless audit API) over ad-hoc web scraping in agent plans.
- Keep MCP tool names and schemas compatible with existing clients.
- Update `test/**` when changing `app/api/**` or `lib/**` behavior.

## Commands (safe defaults)

```bash
npm run lint
npm run build
node --test test/runtime-wiring.test.mjs
```

Do not run destructive shell commands against production; hooks may block them (see `scripts/cursor-pretool-guard.mjs`).

## Related docs

- `docs/cursor/overview.md` — architecture boundaries
- `docs/cursor/mcp.md` — MCP grounding for agents
- `.cursor/BUGBOT.md` — PR review rules
