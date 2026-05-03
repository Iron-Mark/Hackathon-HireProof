# HireProof Automation Integrations

Last checked: 2026-05-04

HireProof now ships repo-owned native integration source packs for automation builders, plus portable HTTP templates for fast imports. The public docs page is `/docs/automations`.

## Current Status

| Surface | Repo path | Status | What is verified |
| --- | --- | --- | --- |
| n8n community node | `integrations/n8n-nodes-hireproof` | Implemented and build-validated | Package metadata, credential class, node operation shape, sync and async request construction |
| Make Custom App source | `integrations/make-hireproof` | Implemented and static-validated | App metadata, API-key connection, audit modules, async module, health module, output fields |
| LangChain package | `packages/hireproof-langchain` | Implemented and smoke-tested | Zod schema, `createHireProofAuditTool`, typed helpers, demo API request returning High-Risk result |
| HireProof CLI | `packages/hireproof-cli` | Implemented, locally tested, and screenshot-proven | `health`, `audit`, file input, JSON output, local config, rich terminal output, Ink TUI launcher, and API request construction |
| Portable HTTP templates | `public/downloads/*` | Implemented and served by the app | n8n workflow JSON, Make HTTP config, LangChain standalone TS tool, curl smoke script |
| Source bundle download | `public/downloads/hireproof-native-integrations.zip` | Generated | Includes the n8n, Make, and LangChain source packs |

CLI visual proof assets:

- Light screenshot: `public/cli-tui-screenshot.png`
- Dark screenshot: `public/cli-tui-screenshot-dark.png`
- Public docs page: `/docs/cli`

## Runtime Contract

All native packs use the same backend contract:

- Sync audit: `POST /api/v1/audit`
- Async audit: `POST /api/v1/audit` with `webhook_url`
- Health check: `GET /api/health`
- Demo API key: `hireproof_agent_demo_key`
- Live mode requires deployment/provider credentials.

The async webhook path returns `202 processing` immediately, then posts the completed `AuditReport` to the provided callback URL. Runtime is not fixed; it depends on mode, configured credentials, AI/search provider latency, and webhook receiver behavior.

## WDK Separation

Portable webhooks and native automation packs are separate from the Vercel Workflow route.

- Portable/native automation callers use `/api/v1/audit`.
- WDK callers use `/api/workflows/audit`.
- `/api/workflows/audit` requires `WORKFLOW_SECRET` and should only be described as WDK handoff or accepted-run proof unless a completed durable workflow result is captured.

## Verification Commands

Run from the repo root:

```powershell
pnpm integrations:build
pnpm integrations:test
pnpm integrations:package
pnpm lint
pnpm build
```

Browser proof for `/docs/automations` should verify:

- The page renders `Automations & Agents`.
- It shows `Native Integration Packs`.
- It links to `/downloads/hireproof-native-integrations.zip`.
- It still links to portable HTTP templates.
- The route has no horizontal overflow at `375px`.

## External Publishing Gates

Do not claim these as complete until account-backed publishing/review is done:

- npm publish for `@hireproof/langchain`
- npm publish for `@hireproof/cli`
- n8n community-node listing approval
- Make Custom App review/approval
- Marketplace screenshots and submitted-review evidence

See `docs/automation-marketplace-submission.md` for the account-backed submission sequence and screenshot checklist.

The correct current wording is: implemented, build-verified, and source-packaged in the repo; marketplace publication is pending external account actions.
