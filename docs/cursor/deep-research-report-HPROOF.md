# HireProof × Cursor Integration — Deep Research Report

**Status:** Strategic blueprint (Phase 1 config and docs in repo; SDK routes Phase 2)  
**Audience:** HireProof contributors and maintainers  
**Source:** Cursor Deep Research export (cleaned for version control)  
**Last updated:** 2026-05-15

> **Ship Cursor where it compounds developer experience and repo quality—not where it muddies fraud verdicts.**

---

## TypeScript SDK in the developer portal

**Priority:** Highest  
**Effort:** Medium (product implementation Phase 2)

Cursor's official TypeScript SDK (`@cursor/sdk`) lets HireProof expose programmatic agent runs from the existing developer portal. The target shape is a secured `POST /api/developer/cursor/runs` route backed by `lib/cursor`, streaming run logs to the developer UI via SSE—aligned with patterns from `app/api/developer/provider-credentials` (origin validation, rate limits, BYOK).

Gate the panel behind a feature flag (e.g. `NEXT_PUBLIC_CURSOR_AGENTS_ENABLED=false`) until the feature has passed QA. Apply the same mutation-origin, rate-limit, and request-IP controls already used by the provider-credentials route. The safest fallback is simple: if Cursor is unavailable or the key is missing, the UI should degrade to static docs/examples and the existing API playground.

This is the data flow I would implement first.

```mermaid
flowchart LR U[Developer using /developer or /docs] --> R[/api/developer/cursor/runs] R --> A[lib/cursor client via @cursor/sdk] A --> C[Cursor local or cloud agent] C --> G[Iron-Mark/Hackathon-HireProof repo] C --> M[Optional HireProof MCP tools] C --> S[SSE event stream] S --> UI[Developer portal log pane] R --> T[Existing usage and analytics layer]

```

### Cursor code intelligence with MCP, skills, hooks, and subagents

**Priority:** Very high
**Effort:** Low to medium Cursor’s SDK blog is explicit that the agent harness includes codebase indexing, semantic search, instant grep, MCP connectivity over stdio or HTTP, skills from `.cursor/skills/`, hooks, and subagents. That matters because HireProof already exposes an MCP endpoint and a typed MCP tool registry. In plain English: you do not need to make Cursor “smart” about HireProof from scratch; the repo already has a machine-readable tool surface that Cursor agents can use. ([cursor.com](https://cursor.com/blog/typescript-sdk)) This should be the second thing you ship. Add repo-owned skill docs so Cursor agents understand HireProof’s non-negotiables: preserve live-vs-demo honesty, preserve origin validation and webhook signing, never weaken SSRF protections, never log secrets, and keep public-facing explanations evidence-backed. Use subagents for repetitive specialist roles such as `security-reviewer`, `docs-drift-reviewer`, and `qa-walkthrough-runner`. Use hooks to block dangerous operations like writing production secrets, deleting broad paths, or hitting live workflow/webhook endpoints from agent runs. Keep the website-facing deliverable simple: offer downloadable “Cursor setup for HireProof contributors” assets from `/docs`. The clean implementation path is: create a `docs/cursor/` section, add a few focused skills, publish one guard script, and make your Cursor prompts call existing HireProof MCP tools instead of raw text search whenever the task is about company verification, news checks, local-presence investigation, or jobs comparison. That makes agent output more grounded and less hallucination-prone. A practical repo-owned skill file can look like this:

```md
# .cursor/skills/hireproof-architecture/SKILL.md You are working inside HireProof. Core constraints:
- Never remove or weaken live-vs-demo disclosures.
- Preserve origin/referrer validation, rate limits, payload limits, and SSRF protections.
- Never log API keys, session secrets, webhook secrets, or encrypted provider payloads.
- Prefer evidence-backed explanations over vague language in user-facing copy.
- When reviewing investigation logic, inspect: - app/api/audit/route.ts - app/api/v1/audit/route.ts - lib/schemas.ts - lib/mcp-tools.ts When the task involves company validation or recruiter checks:
- Prefer HireProof MCP tools over ad-hoc prompting.
- Keep changes compatible with existing MCP route behavior.

```

A simple Node-based pre-tool guard script can provide a strong last line of defense even before you tune more advanced agent policies. The exact `hooks.json` wiring schema was not available in the parsed docs I could read, but Cursor’s official docs index and security page clearly treat hooks as a first-class secure-agent surface, so the safe move is to keep your logic in a script like the one below and wire it through the documented hooks entry. ([cursor.com](https://cursor.com/llms.txt))

```js
// scripts/cursor-pretool-guard.mjs
import fs from 'node:fs/promises' const input = await fs.readFile(0, 'utf8').catch(() => '')
const blocked = [ /rm\s+-rf\s+\//i, /rm\s+-rf\s+\.\//i, /vercel\s+env/i, /redis-cli/i, /curl\s+.*hireproof\.tech\/api\/workflows/i, /curl\s+.*hireproof\.tech\/api\/webhooks/i,
] if (blocked.some((rule) => rule.test(input))) { console.error('Blocked dangerous agent action. Use preview environments and non-destructive commands only.') process.exit(1)
} process.exit(0)

```

Because HireProof already has an MCP route, the secure default is to keep Cursor on **read/use-tools-first** behavior for investigation and docs tasks. Do not let agents invent their own external browsing logic when your product already has domain tools. And do not let them mutate production infra from hooks-free sessions. If the MCP surface is unavailable, the fallback is just plain repo search and static docs; that is worse, but still safe.

```mermaid
flowchart LR P[Prompt or task] --> AG[Cursor agent] AG --> IDX[Code indexing / semantic search / grep] AG --> MCP[HireProof MCP endpoint] MCP --> TOOLS[lib/mcp-tools.ts] TOOLS --> DATA[Search / investigation data] AG --> SK[Repo skills and subagents] AG --> HK[Pre-tool hook guard] HK --> OUT[Safe edits, summaries, or PR diffs]

```

### Cloud agents and scheduled or event-driven jobs

**Priority:** High
**Effort:** Medium Cursor automations are documented as always-on agents that can run on schedules or in response to triggers like Slack messages, merged GitHub PRs, Linear issues, PagerDuty incidents, or custom webhooks. Cursor also says those automated agents run in cloud sandboxes, use your configured MCPs and models, verify their own output, and have a memory tool that learns from past runs. That is a clean fit for HireProof’s existing workflow route, health endpoint, test suite, docs surface, and chat/webhook mentality. The best operational use cases for HireProof are not generic. Make them concrete. A nightly **repo-health job** should run lint, build, runtime-wiring tests, and docs/env drift checks. A second job should watch merged PRs that touch `app/api/`, `lib/`, or `.env.example`, then open a maintenance PR or post a developer summary when docs/config are now stale. A third job should triage incoming bug reports from Slack/Discord/Telegram support channels once your chat surfaces are live. Cursor’s official automations examples already cover security review, agentic codeowners, incident response, coverage generation, and bug triage, so these recommendations are directly aligned with product direction instead of speculative. For implementation, I would **start with the SDK** inside internal cron/webhook routes rather than jumping straight into vendor-dashboard-only automations. That keeps your logic versioned in the repo and easier to review. Later, once the prompts are stable, you can move selected jobs into Cursor’s native Automations UI. HireProof already has a `WORKFLOW_SECRET` pattern and dynamic routes documented in deployment notes, so it already has the bones for secure scheduled tasks.

```ts
// app/api/internal/cursor/nightly-repo-health/route.ts
import { NextResponse } from 'next/server'
import { Agent } from '@cursor/sdk' export async function GET(request: Request) { const secret = request.headers.get('x-cursor-job-secret') if (secret !== process.env.CURSOR_WEBHOOK_SECRET) { return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) } const agent = await Agent.create({ apiKey: process.env.CURSOR_API_KEY!, model: { id: process.env.CURSOR_MODEL_ID ?? 'composer-2' }, cloud: { repos: [{ url: 'https://github.com/Iron-Mark/Hackathon-HireProof', startingRef: 'main' }], autoCreatePR: true, }, }) const run = await agent.send(`
You are performing HireProof nightly repo health.
Tasks:
1. Run: npm run lint
2. Run: npm run build
3. Run: node --test test/runtime-wiring.test.mjs
4. Compare README.md, DEPLOYMENT.md, .env.example, and docs/automation-integrations.md for stale routes, env vars, or docs drift.
5. If everything passes, summarize findings only.
6. If there is a real issue, create a branch and open a PR with the minimal fix.
Do not change product behavior unless a failing test or stale doc requires it.
`) return NextResponse.json({ ok: true, runId: run.id, agentId: run.agentId, })
}

```

Security here is simple and non-negotiable. Trigger these jobs only from internal cron or secured webhooks. Cap concurrency aggressively. Keep auto-merge off. Make generated PRs land on separate branches. And do not run these on arbitrary repos or user prompts; the repo target should be fixed by config. If the cloud route is down, the fallback is your existing deterministic pipeline: `npm run build`, health checks, runtime tests, and human review.

```mermaid
flowchart LR TRIG[Scheduler or secure webhook] --> JOB[/api/internal/cursor/nightly-repo-health] JOB --> SDK[@cursor/sdk] SDK --> CA[Cursor cloud agent sandbox] CA --> REPO[HireProof repo] CA --> TESTS[lint build node:test docs drift] TESTS --> OUT[Summary or PR branch] OUT --> USAGE[Existing usage/logging]

```

### Bugbot, learned rules, and Autofix

**Priority:** Very high
**Effort:** Low This is the fastest high-ROI integration for the repo itself. Cursor’s Bugbot officially reviews pull requests, runs automatically on PR updates or manually on demand, reads existing PR comments to avoid duplicate feedback, publishes a `Cursor Bugbot` GitHub check, supports project rules through `.cursor/BUGBOT.md`, supports learned rules based on team feedback, and can autofix issues by spawning cloud agents in their own VMs. Cursor also documents that Autofix is out of beta, that higher effort reviews cost more, and that Bugbot-supported MCP tools are available on Team and Enterprise plans. HireProof is exactly the kind of repo that benefits from this. The sensitive parts are obvious and repeated: auth/session handling, BYOK encryption, provider verification, webhook safety, origin validation, rate limiting, SSRF protection, mode honesty, and API/docs consistency. Those are not abstract “quality” problems; they are concrete places where AI review can catch regressions early. Connect the repo to Cursor Bugbot, add root and nested Bugbot rules, require the `Cursor Bugbot` check on main branches, and start Autofix only in **create-new-branch** mode. The right rollout is three steps. First, enable review-only Bugbot and collect findings for a short baseline. Second, add root `.cursor/BUGBOT.md` plus nested files for `app/api/` and `lib/`. Third, enable learned rules and then Autofix-on-new-branch once the false-positive rate is acceptable. Cursor’s own learned-rules writeup is useful here: it learns from downvotes, replies, and human-reviewer comments. That is perfect for turning HireProof team feedback into repo-specific review habits over time.

```md
# .cursor/BUGBOT.md Review priorities for HireProof:

## Security-critical paths
- app/api/audit/**
- app/api/v1/audit/**
- app/api/developer/provider-credentials/**
- lib/auth-store.ts
- lib/provider-verification.ts
- lib/mcp-tools.ts

## Blocking rules
- Flag any new fetch() to user-provided URLs that lacks hostname validation, timeouts, or SSRF controls.
- Flag any change that weakens origin/referrer checks, rate limits, API-key checks, or webhook signature validation.
- Flag any diff that logs secrets, raw provider keys, cookies, encrypted blobs, or internal tokens.
- Flag any change that makes demo mode appear live or makes evidence provenance less explicit to end users.
- Flag backend changes in app/api/** or lib/** if there are no corresponding tests under test/** or equivalent updates.

## Non-blocking rules
- Flag stale docs when route names, env vars, or API examples change.
- Flag UX copy that overstates certainty or fails to describe evidence limitations.

```

The strongest security posture is to require the Bugbot check for merges, but not let Autofix write directly to human-authored PR branches. Keep Autofix on separate branches until you trust it. If you later use MCP with Bugbot, confirm you are on a plan tier that supports it and keep the MCP toolset narrow. If Bugbot is unavailable, the fallback remains deterministic tests plus reviewer discipline.

```mermaid
flowchart LR PR[PR opened or updated] --> BB[Cursor Bugbot] BB --> RULES[.cursor/BUGBOT.md and learned rules] RULES --> REVIEW[Findings on diff] REVIEW --> CHECK[Cursor Bugbot GitHub check] REVIEW --> AF[Optional Autofix cloud agent] AF --> BR[New branch with fix PR] CHECK --> MERGE[Human review and merge decision]

```

### Browser and computer-use QA with artifacts

**Priority:** High
**Effort:** Medium Cursor’s cloud-agent computer-use launch is one of the clearest product-to-product fits for HireProof. Cursor says cloud agents can use their own virtual machines with full development environments, interact with software directly, and produce artifacts including videos, screenshots, and logs. Cursor explicitly describes using cloud agents to test its own docs site by walking through sidebar navigation, search, copy-page, feedback, table of contents, and theme switching. That is almost a one-to-one match for HireProof’s `/audit`, `/developer`, `/docs`, and extension/public-site QA needs. HireProof’s production deployment notes confirm that `/audit`, `/audit/[id]`, `/history`, `/docs`, `/developer`-related surfaces, `/api/audit`, `/api/v1/audit`, `/api/mcp`, chat/webhook endpoints, and Chrome-extension packaging are all part of the live or packaged system. The repo also already includes Playwright as a dev dependency. That means Cursor should be used as **artifact-driven exploratory QA** and **release proof generation**, while Playwright remains the deterministic blocker. Do not invert that relationship. Cursor is excellent for “show me what broke and attach evidence”; Playwright is still better for repeatable pass/fail assertions. A good first feature is a developer-only “Run QA walkthrough” button in `/developer`. It should launch a cloud agent against the current preview or staging URL, ask it to execute a fixed script over `/audit`, `/developer`, and `/docs`, and save only the run metadata plus a human-readable summary. If Cursor’s artifact API fields are not yet stable enough for direct ingestion, link out to the run and keep artifact handling outside the app until the SDK/docs harden further. That is the honest way to do this without inventing unsupported API fields. ([cursor.com](https://cursor.com/blog/agent-computer-use))

```ts
// lib/cursor/qa-prompt.ts
export function buildHireProofQaPrompt(baseUrl: string) { return `
Open ${baseUrl}/audit and verify:
- textarea input renders
- demo buttons render
- submit flow is visible
- results/loading/error states are understandable Open ${baseUrl}/developer and verify:
- provider credentials UI renders
- usage cards and activity lists are visible Open ${baseUrl}/docs and verify:
- API playground renders
- response pane works
- code examples and docs nav are present Record screenshots and logs for any failure.
Do not modify production. Report findings clearly.
`.trim()
}

```

The implementation steps are clear: add a QA prompt builder, add a secure internal route to start the run, store run IDs in the existing usage/product-event layer, and expose the launcher in the developer portal. Then make release management use it for previews and docs changes. If it fails or is unavailable, the fallback is Playwright plus manual screenshot collection.

```mermaid
flowchart LR DEV[Developer clicks QA walkthrough] --> QA[/api/internal/cursor/ui-qa] QA --> AG[Cursor cloud agent VM] AG --> AUDIT[/audit] AG --> DOCS[/docs] AG --> PORTAL[/developer] AG --> ART[Videos / screenshots / logs] ART --> SUM[Summary + run metadata] SUM --> PORTAL2[Developer portal history]

```

### Self-hosted cloud agents and governed development environments

**Priority:** Medium
**Effort:** High Cursor’s self-hosted cloud-agent release and its newer development-environment release are the correct future-facing path for enterprise-safe HireProof execution. Cursor states that self-hosted agents are generally available, keep code and tool execution in your own network, support isolated dedicated machines, allow multi-model use, integrate with plugins, and rely on outbound HTTPS connections from workers rather than inbound ports. Cursor also documents governed development environments with Dockerfile-based configuration, multi-repo support, build secrets, environment version history, rollbacks, scoped egress, scoped secrets, and audit logs. HireProof already ships a Dockerfile, documents Docker self-hosting, and has a health-checked standalone image. That means the repo already has the seed of a Cursor-compatible execution environment. The practical recommendation is to **reuse the existing runtime posture** rather than start from zero: derive a Cursor-specific dev environment from the current Node 20 / Next.js stack, lock it to the HireProof repo, and use it first for internal QA or maintenance jobs before trusting it with private customer repos or multi-repo estate. This becomes strategic when one of two things happens: either HireProof enterprise customers require stricter isolation/privacy guarantees, or HireProof itself splits into more internal services/repos and needs cross-repo agents. Cursor’s development-environment release is explicit that multi-repo environments and environment-level secret/egress control are the way it wants teams to do this. Until then, local or standard cloud agents are sufficient for the public open-source repo. A repo-adapted environment image can stay very close to the current Docker shape:

```Dockerfile
# Dockerfile.cursor-agent
FROM node:20-alpine
WORKDIR /workspace/hireproof COPY package.json package-lock.json* ./
RUN npm ci COPY . . ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1 CMD ["sh", "-lc", "npm run lint && npm run build && node --test test/runtime-wiring.test.mjs"]

```

Security is the whole point here. Use Privacy Mode for cloud-hosted team work where possible; Cursor says team members have it enabled by default, with zero-data-retention arrangements for model providers when enabled. For stricter cases, move to self-hosted agents and scoped environments. Scope secrets per environment, keep egress allowlists tight, and use environment audit logs and rollbacks. The exact self-hosted worker token/pool variable names were not available in the parsed docs I could use, so treat those as deployment-specific items to confirm against Cursor’s live docs during actual rollout.

```mermaid
flowchart LR H[HireProof internal trigger] --> CP[Cursor control plane] CP --> SH[Self-hosted worker in private network] SH --> ENV[Governed dev environment] ENV --> REPO[HireProof repo or multi-repo workspace] ENV --> SECRETS[Scoped secrets and egress rules] ENV --> OUT[Tests, fixes, summaries, PRs] OUT --> H

```

## Documentation, QA, performance, cost, and fallbacks

### Documentation changes HireProof already has a large docs footprint, a developer portal, and a live API playground. But there is no reviewed evidence that it currently has Cursor-specific contributor guidance or downloadable Cursor assets. That is wasted leverage. The README, docs pages, and existing API playground should explicitly teach developers how to use Cursor with HireProof. | File or surface | Recommended change | Why |
|
| --- |
| --- |
| --- |
| `README.md` | Add a **Cursor integration** section with supported surfaces: SDK, MCP, Bugbot, QA walkthroughs, and security guardrails | Makes Cursor part of repo onboarding instead of tribal knowledge |
| `docs/cursor/overview.md` | New page describing architecture boundaries, especially “do not route user-facing fraud decisions through Cursor” | Prevents bad architectural drift |
| `docs/cursor/sdk.md` | New page with developer-portal flow, BYOK setup, and example prompts | Turns the feature into something users can actually start |
| `docs/cursor/mcp.md` | Document how HireProof’s MCP tools help Cursor agents ground investigation tasks | Makes the existing MCP surface earn its keep |
| `docs/cursor/bugbot.md` | Store recommended `.cursor/BUGBOT.md` content and rule philosophy | Keeps code-review rules versioned and auditable |
| `docs/cursor/qa.md` | Release checklist for QA walkthroughs, preview environments, screenshot expectations, and Playwright fallback | Keeps exploratory QA from degenerating into chaos |
| `components/docs/api-playground.tsx` | Add preset examples labeled “Generate Next.js integration with Cursor” and “Run repo docs-drift review” | Converts docs from brochure into workflow |
| `app/developer/developer-client.tsx` | Add a **Cursor Agents** panel and recent-run list | Makes the website itself a control surface | The most important docs artifact is not a long essay. It is a **prompt library**. Add short, reusable prompts for: generate Next.js integration example; audit docs/env drift; review auth/security changes; run UI walkthrough; summarize merged PRs; and produce release notes. Cursor’s automations and cloud-agent products reward crisp instructions, not vague aspirations.

### Testing and QA plan HireProof’s deployment summary says the current tree was locally verified with tests, TypeScript, and production build; the repo also contains a runtime-wiring test file and documents Docker smoke flows. That should remain the non-AI baseline. Cursor layers on top of that; it does not replace it. | Test layer | What to add for Cursor integration | Recommended tool |
|
| --- |
| --- |
| --- |
| Unit | Prompt builders, runtime selector, BYOK cursor-provider normalization, hook guard script | `node:test` or existing unit setup |
| Route contracts | `POST /api/developer/cursor/runs`, internal cron/webhook auth, error handling when Cursor API key is absent | Mocked route tests |
| Security regression | Ensure Cursor routes reuse origin validation, rate limiting, secret redaction, and no arbitrary repo access | Existing server test style plus static assertions |
| UI | Developer portal run launcher, docs examples, empty/error/loading states | React component tests and manual review |
| Deterministic E2E | Keep Playwright as blocker for stable critical paths | Playwright |
| Exploratory E2E | QA walkthrough runs that validate preview or staging and produce artifacts | Cursor cloud agents |
| PR quality | Bugbot required check on critical branches/paths | Cursor Bugbot + GitHub branch protection | The right release order is strict. First, deterministic tests. Second, Bugbot review. Third, optional Cursor QA walkthrough on preview. Fourth, human approval. If any of those AI layers are noisy, they drop back to advisory mode while the deterministic pipeline keeps shipping.

### Performance and cost considerations Cursor’s SDK launch says usage is billed through token-based consumption pricing, Bugbot docs say higher effort levels take longer and use more usage, and Bugbot Autofix is billed through cloud-agent credits at plan rates. That is enough to make the cost strategy obvious even without quoting live price numbers: keep routine tasks cheap and escalated tasks expensive only when justified. ([cursor.com](https://cursor.com/blog/typescript-sdk)) | Surface | Main cost/latency driver | What to do |
|
| --- |
| --- |
| --- |
| SDK local runs | Model inference only, local machine contention | Use for scaffolding, docs generation, safe read-mostly tasks |
| SDK cloud runs | Model spend plus cloud sandbox time | Use for PR generation, heavy repo tasks, and browser-based QA |
| Scheduled jobs | Repeated cloud-agent runtime | Run nightly or on merged-PR triggers, not on every small event |
| Bugbot review | Review effort setting and repo activity | Start on default effort; elevate only sensitive paths if signal is good |
| Bugbot Autofix | Extra cloud-agent work per finding | Enable only on separate branch after baseline review quality is proven |
| Self-hosted agents | Your infra cost plus operational overhead | Save for enterprise or private-network needs, not day-one rollout | A blunt but useful rule: do not let Cursor run on every page view, every end-user audit, or every speculative dev interaction. Gate it behind auth, explicit user action, or controlled schedules. HireProof already has provider-cost awareness and usage reporting paths; extend those, then enforce hard concurrency limits and inactivity timeouts for Cursor jobs.

### Fallback strategies Fallbacks should be boring. That is good. | Feature | Fallback if Cursor is unavailable |
|
| --- |
| --- |
| TypeScript SDK agent panel | Static docs examples and current API playground |
| MCP/skill-assisted agent work | Human workflow plus repo search and docs |
| Scheduled cloud jobs | Existing build/test/health scripts and manual maintainer checks |
| Bugbot | Human code review plus runtime tests |
| Cloud-agent QA | Playwright + manual screenshots |
| Self-hosted agent infra | Local dev + standard cloud agents on non-sensitive work | The key point is discipline: HireProof should never become operationally dependent on Cursor for correctness of fraud verdicts or uptime of its public audit API. Cursor should accelerate developer work and repo hygiene, not become a single point of product truth.

## Environment, config, CI/CD, and alternatives

### Environment variables and config HireProof already documents core environment variables such as search/model keys, Slack credentials, Redis, and workflow secrets, and it already relies on `SESSION_SECRET` and `BYOK_ENCRYPTION_KEY` in its auth system. Cursor should be added to that model plainly and without magic. | Variable or config | Status | Purpose |
|
| --- |
| --- |
| --- |
| `CURSOR_API_KEY` | New, required for platform-managed runs | Server-side Cursor authentication |
| `CURSOR_MODEL_ID` | New, recommended | Keeps model selection configurable instead of hardcoded |
| `CURSOR_RUNTIME_DEFAULT` | New, recommended | App-layer default: `local`, `cloud`, or later `self-hosted` |
| `CURSOR_WEBHOOK_SECRET` | New, required for internal automation routes | Secures internal cron/webhook invocations |
| `CURSOR_MAX_CONCURRENT_RUNS` | New, recommended | Protects spend and resource contention |
| `CURSOR_ALLOWED_REPO_URL` | New, recommended | Pin runs to the HireProof repo by default |
| `SESSION_SECRET` | Existing | Required to protect user sessions for developer portal routes |
| `BYOK_ENCRYPTION_KEY` | Existing | Required if you store user-scoped Cursor keys in the existing encrypted provider vault |
| `APP_BASE_URL` | Existing/recommended | Needed for QA prompts and preview/staging targeting |
| `.cursor/BUGBOT.md` | New repo config | Project review rules for Bugbot |
| `.cursor/skills/*` | New repo config | Repo-owned knowledge and task recipes |
| `.cursor/hooks.json` | New repo config | Hook wiring to guard tool use |
| `docs/cursor/*` | New docs set | Human-facing and agent-facing integration docs | Because I could not inspect any existing `.github/workflows/*` file through the connector, the CI/CD changes below are best read as **additions**, not diffs against a known current workflow.

### CI/CD changes The deployment docs show Vercel build/install defaults and a tested Docker path. The safest CI/CD additions are therefore incremental: add secrets, add one SDK smoke job, add one nightly or post-merge QA job, and require Bugbot. | Pipeline change | Why |
|
| --- |
| --- |
| Add `CURSOR_API_KEY`, `CURSOR_MODEL_ID`, and `CURSOR_WEBHOOK_SECRET` to CI/Vercel secrets | Required for secure server-side execution |
| Add a non-blocking `cursor-sdk-smoke` job on protected branches or nightly | Catches broken SDK wiring without making every PR brittle |
| Add a post-preview “Cursor UI walkthrough” job for `/audit`, `/developer`, and `/docs` | Generates visual QA evidence for releases |
| Require `Cursor Bugbot` status on protected branches | Gives immediate PR-value with low implementation cost |
| Store only run IDs/summaries in app telemetry | Avoids over-collecting raw transcripts/artifacts until the API surface stabilizes |
| Keep deterministic tests first in pipeline order | Prevents AI layers from becoming blockers before they prove signal quality | A simple blocking order works best: lint/build/tests first, Bugbot second, optional agentic QA third, human approval last.

### Cursor compared with alternatives You asked for a comparison matrix, and the honest answer is this: Cursor is not the only serious option here. GitHub Copilot, Claude Code, and OpenAI Codex all have official agent surfaces. But Cursor currently has the strongest **single-stack combination** of programmatic SDK, cloud/self-hosted agents, PR review, learned repo rules, and artifact-producing computer-use flows that map directly onto HireProof’s needs. Cursor wins not because every individual feature is unique, but because the bundle is unusually coherent for this repo and website. ([cursor.com](https://cursor.com/blog/typescript-sdk)) | Capability area | Cursor | GitHub Copilot | Claude Code | OpenAI Codex | Why Cursor is the best fit for HireProof |
|
| --- |
| --- |
| --- |
| --- |
| --- |
| --- |
| Programmatic SDK | Yes, official TypeScript SDK with local/cloud/self-hosted runtimes and run streaming | Yes, official Copilot SDK with auth, BYOK, hooks, MCP, session persistence, streaming events, OpenTelemetry | Anthropic has an Agent SDK site surface, but Claude Code itself is more terminal/app-centered in the reviewed docs | OpenAI docs expose OpenAI SDK + Agents SDK | Cursor’s SDK is explicitly tied to the same Cursor agent runtime/harness that the product uses, which makes productizing it inside `/developer` more direct. ([cursor.com](https://cursor.com/blog/typescript-sdk)) |
| Repo-aware tool augmentation | MCP, skills, hooks, subagents | MCP, hooks, custom agents, skills, plugins | Extensible and tool-aware; reviewed overview shows integrations and extensions | MCP/connectors, skills, shell, tools | HireProof already has `/api/mcp`, so Cursor’s documented MCP + skills package is a clean immediate reuse path. ([cursor.com](https://cursor.com/blog/typescript-sdk)) |
| PR review agent | Bugbot with rules, learned rules, Autofix | Code review exists; broader GitHub-native fit | Reviewed overview references code review & CI/CD, but not the same mature PR-rule stack in the sources I used | Not a dedicated PR-review product in the reviewed docs | HireProof gets immediate value from Bugbot’s repo rules and learned-rules loop. |
| Browser/computer use and artifacts | Strong, with videos/screenshots/logs in cloud VMs | Copilot has cloud agent and remote-control surfaces in docs index | Claude Code overview shows remote control, Chrome extension beta, and computer use preview | OpenAI docs list computer use and code interpreter | Cursor’s documented “test UI and attach artifacts” story maps directly onto HireProof docs/audit/portal QA. |
| Self-hosted/private execution | Yes, official self-hosted cloud agents and governed environments | Copilot docs expose enterprise runners/cloud-agent controls | Not established from the reviewed overview page as strongly as Cursor self-hosted | OpenAI has strong agent infrastructure docs, but not the same reviewed repo-centric self-hosted worker story in these sources | For future enterprise HireProof, Cursor’s self-hosted agent story is unusually aligned. |
| Best use for HireProof | SDK panel, MCP integration, Bugbot, cloud QA, later self-hosted | Viable if HireProof standardizes harder on GitHub-native enterprise workflows | Viable if the team wants terminal-first workflows and Slack/browser control | Viable if HireProof wants a broader OpenAI-centric agent platform | Cursor gives the best combined path with the least architectural contortion. |

## Assumptions and primary sources

### Open questions and limitations I am not going to fake certainty where the sources did not justify it. I could not reliably fetch the live `hireproof.tech` pages through the web tool because the root returned `403 Forbidden`, so website observations in this report are grounded primarily in the selected GitHub repo and the deployment docs rather than direct page capture. I reviewed official Cursor sources for the SDK, cloud agents, automations, Bugbot, self-hosted workers, development environments, docs index, and security/privacy. In those materials, I found strong primary-source evidence for SDK-driven agents, MCP, skills, hooks, subagents, cloud agents, automations, Bugbot, Autofix, learned rules, self-hosted execution, and privacy/security controls. I did **not** find clearly documented primary-source evidence for a standalone public Cursor embeddings API, nor for a distinct public real-time collaborative editing API that should shape HireProof architecture here. That is why those items were not prioritized. ([cursor.com](https://cursor.com/llms.txt)) ([cursor.com](https://cursor.com/blog/typescript-sdk)) The exact schema for files like `.cursor/hooks.json` and `.cursor/mcp.json` was not exposed in the parsed pages I could access, even though those surfaces are clearly documented as product areas. So the report keeps file-name recommendations confident, but keeps schema-level examples conservative and pushes guard logic into scripts/Markdown where possible. ([cursor.com](https://cursor.com/llms.txt)) ([cursor.com](https://cursor.com/en-US/security)) I also did not inspect an existing `.github/workflows/*` file through the connector, so CI/CD changes in this report are additive recommendations, not line-by-line workflow diffs.

### Primary sources used | Primary source set | What it established | Citation |
|
| --- |
| --- |
| --- |
| HireProof README and project map | Current app surfaces, project layout, commands, docs footprint, stack |
|
| HireProof `package.json` | Next.js/React/TypeScript stack, MCP/Playwright/Vercel AI SDK and other dependencies |
|
| HireProof audit, API, MCP, workflow, developer, auth, analytics, env, deployment, Docker, schemas, and tests files | Concrete integration points and current security/ops patterns |
|
| Cursor official docs index | Official surface area: SDK, rules, skills, hooks, MCP, cloud agents, automations, Bugbot, security, CLI, integrations | ([cursor.com](https://cursor.com/llms.txt)) |
| Cursor TypeScript SDK blog | Public-beta SDK, runtimes, run streaming, repo-aware harness, PR creation, pricing posture | ([cursor.com](https://cursor.com/blog/typescript-sdk)) |
| Cursor cloud-agent computer-use blog | VM-based execution, browser/computer interaction, screenshots/videos/logs, UI QA use case, Slack/GitHub access |
|
| Cursor automations blog | Schedule/event/webhook triggers, cloud sandboxes, memory tool, review/coverage/triage examples |
|
| Cursor self-hosted and development-environments blogs | Self-hosted workers, private-network execution, multi-repo setups, Dockerfile environments, secret/egress controls, audit logs |
|
| Cursor Bugbot docs and Bugbot blog posts | PR review, GitHub check, rules, analytics, Autofix, learned rules, MCP support limits, admin API |
|
| Cursor security page | Privacy Mode, least privilege, model blocklists, secure-agent docs, trust posture |
|
| GitHub Copilot official docs | Alternative platform breadth: cloud agents, SDK, BYOK, hooks, MCP, code review, session persistence, OpenTelemetry, integrations |
|
| Anthropic Claude Code official overview | Alternative platform breadth: terminal/IDE/web/desktop surfaces, remote control, computer use, Slack |
|
| OpenAI Codex official docs | Alternative platform breadth: OpenAI SDK, Agents SDK, MCP/connectors, shell, computer use, code interpreter |
| The short version is this: **ship Cursor where it directly compounds HireProof’s developer experience and repo quality, not where it muddies the product’s trust-critical verdict engine**. The first wins are obvious and low-regret: a repo-scoped SDK adapter, MCP/skill packaging, Bugbot rules, and cloud-agent QA. That is the sharp path. Everything else is noise until those four are live.
