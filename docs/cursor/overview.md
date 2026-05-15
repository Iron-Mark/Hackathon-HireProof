# Cursor integration — overview

HireProof uses Cursor to **compound developer experience and repository quality**. Cursor must **not** become a single point of truth for audit verdicts, public API behavior, or end-user fraud decisions.

## Product truth (never delegate to Cursor)

| Surface | Role |
| --- | --- |
| `/api/audit`, `/api/v1/audit` | Authoritative investigation and scoring pipeline |
| `/api/mcp` | Machine-readable investigation tools for agents |
| `lib/mcp-tools.ts`, scorer, schemas | Verdict engine and evidence contracts |

End users and integrators rely on these paths. Cursor agents may **read** and **propose changes** to them; they must not **replace** them at runtime.

## Cursor layer (dev acceleration only)

| Surface | Role |
| --- | --- |
| `@cursor/sdk` (Phase 2) | Optional developer-portal agent runs (BYOK) |
| `.cursor/skills/`, hooks | Contributor guardrails and MCP-first habits |
| Bugbot + `.cursor/BUGBOT.md` | PR review on security-sensitive paths |
| Cloud QA (Phase 3) | Exploratory UI walkthroughs with artifacts |
| Internal cron routes (Phase 3) | Repo health, docs drift (secured webhooks) |

## Architecture diagram

```mermaid
flowchart TB
  subgraph productTruth [Product truth]
    AuditAPI["/api/audit and /api/v1/audit"]
    MCP["/api/mcp"]
    Verdicts[Safe / Caution / High-Risk engine]
  end

  subgraph cursorLayer [Cursor layer]
    SDK["@cursor/sdk in /developer"]
    Skills["Repo skills + hooks"]
    Bugbot["PR review + BUGBOT.md"]
    CloudQA["Cloud-agent UI walkthroughs"]
    Cron["Internal cron routes"]
  end

  Dev[Developers] --> SDK
  Dev --> Skills
  PRs[Pull requests] --> Bugbot
  Release[Preview releases] --> CloudQA
  Skills --> MCP
  SDK --> Repo[HireProof repo]
  Bugbot --> Repo
  CloudQA --> UI["/audit /docs /developer"]
  AuditAPI --> Verdicts
  MCP --> Verdicts
```

## Two skill scopes

| Path | Audience | Purpose |
| --- | --- | --- |
| `.agents/skills/hireproof/SKILL.md` | Any IDE / agent user | Investigate job posts via MCP or headless API |
| `.cursor/skills/hireproof-architecture/SKILL.md` | Repo contributors | Live-vs-demo honesty, SSRF, secrets, MCP-first edits |

Do not merge these into one file—they serve different users.

## Suggested rollout order

1. **Bugbot** — `.cursor/BUGBOT.md` + GitHub check (no app code)
2. **Repo skills + pretool guard** — `.cursor/skills`, `scripts/cursor-pretool-guard.mjs`, hooks
3. **Docs** — this folder + `/docs/cursor` on the live site
4. **SDK panel** — `@cursor/sdk`, secured routes (sibling / Phase 2)
5. **Cloud QA + cron** — preview-only, metadata-first (Phase 3)

## Fallback discipline

If Cursor is unavailable: static docs, API playground, Playwright, `npm run lint` / `build` / `node --test`, and human review. The product must keep shipping without Cursor.

See also: [sdk.md](./sdk.md), [mcp.md](./mcp.md), [bugbot.md](./bugbot.md), [qa.md](./qa.md).
