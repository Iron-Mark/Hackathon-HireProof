# Cursor + HireProof MCP

Cursor agents should **ground investigation tasks** on HireProof’s existing MCP surface instead of inventing ad-hoc browsing or unverified claims.

## Endpoint

- **URL:** `https://hireproof.tech/api/mcp` (or your self-hosted `APP_BASE_URL/api/mcp`)
- **Auth:** `x-api-key` header (demo key for local docs only; use your own key in production)

Public docs: [/docs/mcp](https://hireproof.tech/docs/mcp) · [/docs/skills](https://hireproof.tech/docs/skills)

## Tools (`lib/mcp-tools.ts`)

| Tool | Use when |
| --- | --- |
| `search_company` | Web presence, careers domain, LinkedIn signals |
| `news_check` | Scam reports, fraud news, reputation |
| `jobs_compare` | Salary / role benchmarking |
| `local_presence` | Maps footprint, address plausibility |

In many clients, tools appear namespaced (e.g. `hireproof:search_company`).

## Cursor MCP config (example)

```json
{
  "mcpServers": {
    "hireproof": {
      "url": "https://hireproof.tech/api/mcp",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

Restart the IDE after changing MCP config. Never commit real API keys.

## Contributor workflow

When a task touches **company validation**, **recruiter checks**, or **investigation copy**:

1. Prefer MCP tool calls over raw web search in agent prompts.
2. Keep changes compatible with `app/api/mcp/route.ts` and existing tool schemas.
3. For full audits, headless `POST /api/v1/audit` remains the product API—not a Cursor-only code path.

## Harness features (Cursor product)

Cursor’s agent harness includes indexing, semantic search, grep, **MCP**, skills (`.cursor/skills/`), hooks, and subagents. HireProof already exposes MCP; the repo adds **contributor** skills and hooks separately—see [overview.md](./overview.md).

## Subagent ideas (optional)

| Subagent role | Focus |
| --- | --- |
| `security-reviewer` | `app/api/**`, auth, webhooks, SSRF |
| `docs-drift-reviewer` | README, `.env.example`, `/docs` |
| `qa-walkthrough-runner` | Preview UI checks (advisory; Playwright blocks release) |

## Investigation skill vs architecture skill

| File | For |
| --- | --- |
| `.agents/skills/hireproof/SKILL.md` | End-user job investigation in any IDE |
| `.cursor/skills/hireproof-architecture/SKILL.md` | Editing this repository safely |
