# v0 Build Prompt Pack: HireProof

Copy these prompts into v0 in order. The goal is a polished hackathon demo for the **v0 + MCPs** track: **HireProof**, a proof-backed AI agent that audits suspicious job posts before someone applies.

Canonical product name: **HireProof**<br>
Track: **v0 + MCPs**<br>
Core promise: **Paste a job post. Know if it's legit before you apply.**

## How to Use This Pack

- Run one phase at a time.
- After each phase, inspect the app before continuing.
- Keep the app focused on the main demo: paste a suspicious job post, run an investigation, reveal a proof-backed verdict.
- Do not add auth, accounts, document uploads, payments, wallets, Slack/Discord bots, or large dashboards.
- Preserve demo mode so the app works even without API keys.

## Phase 0: Product Plan Only

Use this first if v0 should plan before writing code.

```text
Create a concise implementation plan for a Next.js App Router app called HireProof.

Context:
HireProof is a proof-backed AI agent for suspicious job opportunities. A user pastes a job post, recruiter message, or job URL. The agent extracts claims, researches live evidence, checks company footprint, compares similar openings, and returns a verdict: Safe, Caution, or High-Risk.

Hackathon track:
v0 + MCPs.

Core demo:
Use the sample "Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram." The demo should show an investigation timeline, a High-Risk verdict, evidence cards, safer alternatives, and an export/share result card.

Recommended stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- AI SDK structured outputs
- runtime MCP route inside the app
- AI SDK MCP client over HTTP
- SerpApi for Search, News, Jobs, and Local evidence
- localStorage for MVP history
- Vercel deployment

Return only:
- route map
- component tree
- data model
- agent flow
- MCP tool plan
- SerpApi integration plan
- demo fallback plan
- build order

Do not generate code yet.
```

Inspect/check:
- Product name is HireProof everywhere.
- The app is positioned as an investigator, not a chatbot.
- The route and API plan includes `/audit`, `/history`, `/api/audit`, and `/api/mcp`.

## Phase 1: App Scaffold and Main Screens

```text
Build the first working version of HireProof as a Next.js App Router app.

Product:
HireProof helps job seekers verify suspicious opportunities before applying. Users paste a job post, recruiter message, or job URL. The app returns a structured trust report with a Safe, Caution, or High-Risk verdict.

Required pages:
- `/` landing page
- `/audit` main audit workspace
- `/history` local report history

Landing page:
- Hero headline: "Paste a job post. Know if it's legit before you apply."
- Supporting copy: "HireProof checks company presence, recent news, comparable openings, and local signals before you waste time applying."
- Primary CTA to `/audit`
- A visible sample suspicious job post card
- Short sections for how it works, evidence checked, and demo mode

Audit page:
- Large textarea for pasted job text or recruiter message
- Optional job URL field
- Optional location field defaulting to Philippines
- Sample chips for high-risk, caution, and safer listings
- Primary CTA: Investigate
- Empty, loading, success, and error states
- Result-ready layout with verdict, timeline, evidence, flags, alternatives, and export/share card

History page:
- Simple local report list using mock records for now
- Filters: All, Safe, Caution, High-Risk
- Empty state and action back to `/audit`

Design:
- Serious, clean, investigative, and premium
- Neutral base palette with semantic risk colors
- Strong hierarchy, thin borders, readable cards
- Responsive and accessible
- Avoid chat bubbles, giant sidebars, glassmorphism overload, or generic dashboards

Implementation:
- Use TypeScript, Tailwind, and shadcn/ui
- Use mock data so the demo works immediately
- Add reusable components for verdict badges, risk score, timeline, evidence cards, alternatives, and export card
- Add comments where AI SDK, MCP, SerpApi, and persistence will plug in later
```

Inspect/check:
- `/audit` is clearly the main product screen.
- The first viewport communicates the job-verification use case.
- The app works with mock data before any live API exists.

## Phase 2: Demo Fixtures and Structured Results

```text
Refine HireProof with realistic demo fixtures and a complete structured result screen.

Create three demo cases:
1. High-Risk: remote frontend intern, PHP 80,000/week, no interview, Telegram contact.
2. Caution: ambiguous recruiter pitch with limited company detail but not clearly fraudulent.
3. Safe: legitimate-looking listing with consistent company, role, location, and application flow.

For each demo case, include:
- extracted claims: company, role, salary, location, contact method, application path
- verdict: Safe, Caution, or High-Risk
- numeric risk score from 0 to 100
- confidence label
- plain-language summary
- red flags
- green flags
- evidence cards with source label, snippet, URL, and signal type
- safer alternative jobs
- next steps

Wire the `/audit` page so sample chips load these fixtures and the result layout renders the selected structured report.

Keep the UI polished and presentation-safe. Add a visible "Demo Data" badge when a fixture is shown.
```

Inspect/check:
- High-risk sample consistently looks dramatic and screenshot-ready.
- Safe and caution examples avoid false panic.
- Demo badge is visible but not distracting.

## Phase 3: Types, Schemas, and Local History

```text
Add the core HireProof data layer.

Create central TypeScript types and zod schemas for:
- AuditReport
- ExtractedClaims
- EvidenceItem
- AlternativeJob
- InvestigationStep
- Verdict
- RiskSignal

Wire the UI to consume these central types instead of duplicated local shapes.

Implement localStorage history:
- Persist completed demo/live audit reports and timestamps.
- Hydrate safely in client components.
- Avoid hydration warnings.
- Gracefully handle unavailable storage.
- Store only report data, not raw secrets or API responses.

Update `/history` to read from this local history and support simple verdict filters.
```

Inspect/check:
- Types match what the result UI actually renders.
- Refresh keeps completed reports.
- No API keys, raw provider payloads, or sensitive data are stored client-side.

## Phase 4: Runtime MCP Server Shape

```text
Add a runtime MCP server route for HireProof.

Create a Next.js-compatible MCP route at `/api/mcp` that exposes exactly these tools:
- `search_company`
- `news_check`
- `jobs_compare`
- `local_presence`

For now, each tool should return mocked normalized data matching the HireProof schema.

Tool behavior:
- `search_company`: checks web presence for the claimed company and role.
- `news_check`: checks recent reputation or scam-related news signals.
- `jobs_compare`: compares the listing against similar legitimate jobs.
- `local_presence`: checks location, maps, directory, or business-footprint signals.

Requirements:
- Keep the MCP route server-only.
- Keep tool names stable.
- Return normalized objects, not UI components.
- Add clear comments showing where SerpApi will plug into each tool.
- Do not expose secrets to client components.
```

Inspect/check:
- MCP tool names are exact and stable.
- Mocked MCP responses can drive an AuditReport.
- Client bundles do not import server-only code.

## Phase 5: SerpApi Evidence Wrappers

```text
Replace the mocked internals of the MCP tools with SerpApi-backed server-only wrappers.

Create a server-only helper such as `lib/serpapi.ts` that supports:
- Google Search evidence for company and role presence
- Google News evidence for recent reputation signals
- Google Jobs evidence for comparable legitimate openings
- Google Local or Maps-style evidence for location and business footprint

Environment variable:
- `SERPAPI_API_KEY`

Requirements:
- Never expose `SERPAPI_API_KEY` to the browser.
- Normalize SerpApi responses into HireProof evidence objects.
- Handle timeout, missing key, empty results, and provider errors.
- Preserve the same MCP response shape from Phase 4.
- Add concise fallback responses when live evidence is unavailable.
```

Inspect/check:
- No `NEXT_PUBLIC_SERPAPI_API_KEY` exists.
- Empty or failed SerpApi responses do not crash the app.
- Evidence cards show useful normalized snippets, source labels, URLs, and signal types.

## Phase 6: AI SDK Audit Endpoint

```text
Integrate AI SDK into HireProof with a server-side audit endpoint.

Create `/api/audit` or a server action that:
1. accepts pasted text, optional URL, optional location, and mode
2. extracts structured claims from the input
3. connects to the runtime MCP server over HTTP with the AI SDK MCP client
4. lets the model call these MCP tools:
   - `search_company`
   - `news_check`
   - `jobs_compare`
   - `local_presence`
5. returns a validated structured AuditReport

Use AI SDK structured outputs with the central zod schema.

Environment variable placeholder:
- `MODEL_PROVIDER_KEY`

Requirements:
- Keep model and API key code server-side.
- Validate input before running the agent.
- Validate output before returning it to the client.
- Keep a stable response shape for the UI.
- If the model or MCP call fails, return a graceful error that the UI can recover from.
```

Inspect/check:
- API keys never appear in client files.
- The output validates against the schema.
- The UI can render both demo reports and live reports through the same component path.

## Phase 7: Risk Scoring and Verdict Logic

```text
Add deterministic risk scoring to HireProof.

Create a risk-scoring layer that combines:
- extracted claims
- MCP evidence
- red flag heuristics
- green flag heuristics
- model explanation

Verdict rules:
- Safe: low risk, consistent company presence, normal application path, no urgent off-platform pressure
- Caution: mixed evidence, missing details, unclear recruiter identity, or incomplete company footprint
- High-Risk: unrealistic compensation, no interview, payment request, Telegram/WhatsApp-only contact, impersonation signals, or inconsistent company evidence

Requirements:
- Obvious scam cases should reliably score High-Risk.
- Legitimate examples should avoid false panic.
- Score, verdict, red flags, and explanation must agree.
- Keep heuristics readable and easy to adjust.
```

Inspect/check:
- High-risk demo lands above 75.
- Caution lands in the middle range.
- Safe demo does not show alarming copy.

## Phase 8: Live Mode, Demo Mode, and Recovery

```text
Upgrade the audit flow to support both live mode and demo mode.

Behavior:
- Demo mode works with no API keys.
- Live mode uses `/api/audit`, AI SDK, runtime MCP, and SerpApi.
- If live mode fails because of missing keys, timeout, MCP failure, or SerpApi error, fall back to a matching demo fixture.
- Show a visible "Demo Data" badge and a short notice when fallback data is used.

Add UI controls:
- Try live investigation
- Use demo mode
- Retry

Requirements:
- Never leave the user on a dead error screen.
- Keep fallback honest and labeled.
- Preserve the report layout for both live and demo results.
```

Inspect/check:
- App remains usable with no env vars.
- Fallback is clearly labeled.
- Error copy gives a next action.

## Phase 9: Export Card, Mobile, and Accessibility

```text
Polish HireProof for presentation and screenshots.

Add or refine:
- screenshot-ready export/share result card
- visible verdict, score, top 3 red flags, and safer alternatives indicator
- mobile-first stacking for timeline, evidence, and alternatives
- keyboard navigation
- semantic headings
- associated form labels
- visible focus states
- status announcements for investigation progress
- strong contrast for Safe, Caution, and High-Risk states

Keep visual style serious and trustworthy. Avoid decorative clutter, over-animation, and generic AI chatbot patterns.
```

Inspect/check:
- First mobile viewport still shows the product value.
- Export card can serve as the hackathon cover screenshot.
- Keyboard and screen-reader basics are covered.

## Phase 10: Metadata, Deployment Prep, and Submission Notes

```text
Prepare HireProof for Vercel deployment and hackathon submission.

Add:
- page metadata
- Open Graph title and description
- Twitter/X card copy
- environment variable documentation in comments or README handoff notes
- build-safe server-only imports
- dead-code cleanup

Required env vars:
- `SERPAPI_API_KEY`
- `MODEL_PROVIDER_KEY`
- `APP_BASE_URL`

Submission framing:
- Title: HireProof
- Short description: "A proof-backed AI agent that audits job posts before you apply."
- Technical story: "Built with v0, deployed on Vercel, and powered by runtime MCP tools plus SerpApi evidence."
- Demo script: paste suspicious job post, run investigation, reveal High-Risk verdict, show evidence, show safer alternatives, show export card.

Verify the build is ready for Vercel.
```

Inspect/check:
- Build passes.
- Metadata is consistent with HireProof.
- Submission copy emphasizes v0 + MCPs, SerpApi, and the result screen.

## Recovery Prompts

Use these when v0 drifts, breaks the app, or overbuilds.

### Recover Product Focus

```text
Refocus the app on HireProof's core workflow: paste a suspicious job post, run an investigation, show a Safe/Caution/High-Risk verdict with proof. Remove unrelated dashboards, chat UI, accounts, uploads, payments, and settings. Keep `/audit` as the main product screen.
```

### Recover Design Direction

```text
Make the UI feel serious, investigative, and trustworthy. Reduce decorative gradients, glassmorphism, giant sidebars, and generic AI chatbot elements. Use neutral surfaces, thin borders, semantic risk colors, clear hierarchy, and readable evidence cards.
```

### Recover Technical Architecture

```text
Restore the intended architecture: Next.js App Router, TypeScript, Tailwind, shadcn/ui, `/api/audit` for the audit flow, `/api/mcp` for runtime MCP tools, server-only SerpApi wrappers, AI SDK structured outputs, localStorage history, and demo fallback. Keep API keys server-side only.
```

### Recover Broken Live Mode

```text
Fix live mode without breaking demo mode. If AI SDK, MCP, or SerpApi calls fail, show a clear notice and fall back to labeled demo data. The user should always be able to complete the demo and see a full report.
```

### Recover Data Consistency

```text
Normalize all result rendering through the central AuditReport schema. Ensure demo fixtures, MCP outputs, SerpApi wrappers, AI SDK responses, history records, and result components use compatible field names and optional fields safely.
```

## Final Acceptance Checklist

- `/` explains HireProof in under 10 seconds.
- `/audit` works in demo mode with no API keys.
- `/history` shows local reports.
- The result screen shows verdict, risk score, evidence, flags, alternatives, and next steps.
- Investigation timeline visibly proves multi-step agent work.
- Runtime MCP route exposes `search_company`, `news_check`, `jobs_compare`, and `local_presence`.
- SerpApi calls are server-only and normalized.
- AI SDK returns validated structured output.
- Live mode falls back gracefully to labeled demo data.
- Export/share card is screenshot-ready.
- Vercel deployment uses server-side env vars only.
