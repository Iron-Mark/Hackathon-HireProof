# HireProof

HireProof is a proof-backed AI agent for checking suspicious job posts before someone applies. A user pastes a job post, recruiter message, or job URL, and the app investigates the opportunity with visible evidence before returning a verdict: **Safe**, **Caution**, or **High-Risk**.

> Paste a job post. Know if it's legit before you apply.

## Idea

HireProof turns a sketchy job opportunity into a structured trust report. It extracts claims, checks company presence, reviews news and reputation signals, compares similar roles, checks local footprint, and returns red flags, green flags, evidence links, safer alternatives, and next steps.

## Why It Matters

Students, fresh grads, and job seekers often verify opportunities manually across search tabs, social pages, job boards, and company listings. HireProof compresses that anxiety into one clear investigation flow with sources, not vague AI advice.

## Planned Stack

- Next.js App Router
- TypeScript
- Tailwind CSS and shadcn/ui
- AI SDK structured outputs
- Runtime MCP route inside the app
- AI SDK MCP client over HTTP
- SerpApi for Search, News, Jobs, and Local evidence
- localStorage for MVP history
- Vercel deployment

## Architecture Overview

Planned app structure:

```text
app/page.tsx                  Landing page
app/audit/page.tsx            Main investigation workspace
app/history/page.tsx          Local report history
app/api/audit/route.ts        Server-side audit endpoint
app/api/mcp/route.ts          Runtime MCP tools
lib/agent/hireproof-agent.ts  Agent orchestration
lib/serpapi.ts                Server-only SerpApi wrappers
lib/schema/audit.ts           Audit report schema and types
lib/demo/*.json               Reliable demo fixtures
```

The first build should work with mock/demo data, then add SerpApi-backed MCP tools and AI SDK structured report generation.

## Local Setup

This repository is currently in planning/docs state. After the Next.js app is scaffolded, use the planned setup below:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`, then test the core flow at `/audit`.

## Environment Variables

Create `.env.local` when live mode is implemented:

```bash
SERPAPI_API_KEY=your_serpapi_key
MODEL_PROVIDER_KEY=your_model_provider_key
APP_BASE_URL=http://localhost:3000
```

Do not expose `SERPAPI_API_KEY` or model keys in client components.

## Key Commands

Planned commands once the app exists:

```bash
pnpm dev       # run local development server
pnpm build     # verify production build
pnpm lint      # run lint checks
pnpm test      # run tests when added
```

## Demo Mode

Demo mode should work without API keys and include three seeded examples:

- High-risk: "Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram."
- Caution: ambiguous listing with incomplete company signals.
- Safe: credible listing with matching company, role, and footprint evidence.

If live API calls fail, the app should fall back to demo data and show a visible "Demo Data" badge.

## 5-Minute Demo Script

1. Open HireProof on Vercel and state the problem: job seekers verify suspicious jobs across too many tabs.
2. Paste the high-risk remote internship sample or choose it from demo mode.
3. Click **Investigate** and show the timeline: extract claims, search presence, check news, compare jobs, check local footprint, score risk.
4. Reveal the **High-Risk** result with score, confidence, red flags, and evidence cards.
5. Show safer alternative jobs and the share/export result card.
6. Close with: "HireProof turns job anxiety into evidence."

## Docs

- [Final presentation plan](docs/final-presentation-plan.md)
- [v0 build prompt spec](docs/v0-build-prompt-spec.md)
- [Submission package](docs/submission-package.md)
- [Docs index](docs/README.md)
