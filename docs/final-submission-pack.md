# HireProof Final Submission Pack

Last checked: 2026-04-30

## Submission Basics

### Title

HireProof

### Tagline

Paste a job post. Know if it is legit before you apply.

### One-Liner

HireProof is a proof-backed AI agent that checks suspicious job posts, recruiter messages, and apply links before someone wastes time or shares personal information.

### Short Description

HireProof helps job seekers verify suspicious opportunities before they apply. Paste a job post, recruiter message, or apply URL, and the agent investigates company presence, recent news, similar legitimate jobs, and local business signals before returning a Safe, Caution, or High-Risk verdict with evidence.

### Long Description

Job scams often look normal until a few details do not add up: unrealistic pay, no interview process, off-platform messaging, weak company footprint, or pressure to act quickly. Checking those signals manually means opening search, news, maps, job boards, and company pages while still guessing.

HireProof turns that manual investigation into one proof-backed workflow. A user pastes a job post, recruiter pitch, or apply URL. The agent extracts the important claims, checks live evidence, compares the role against legitimate postings, and returns a structured report with a verdict, risk score, red flags, green flags, evidence cards, safer alternatives, and practical next steps.

The product is built as a Vercel-hosted Next.js app with runtime MCP investigation tools, AI SDK model routing, SerpApi evidence search, a ChatSDK Slack surface, and a production-accepted Vercel Workflow path for longer-running investigations.

## Links

- Demo: `https://hireproof-sigma.vercel.app`
- Main flow: `https://hireproof-sigma.vercel.app/audit`
- Track proof docs: `https://hireproof-sigma.vercel.app/docs/triple-track-coverage`
- Health check: `https://hireproof-sigma.vercel.app/api/health`
- Integration proof: `https://hireproof-sigma.vercel.app/api/integrations/proof`

## Track Wording

### v0 + MCPs

Use this wording:

> HireProof is a v0-built AI app that connects to MCP investigation tools to verify suspicious job posts with live evidence.

Proof points:

- Next.js app deployed on Vercel.
- Runtime MCP tools for company presence, news reputation, job comparison, and local business footprint.
- Live evidence via SerpApi when configured.
- Deterministic demo mode for reliable judging.

### ChatSDK Agents

Use this wording:

> HireProof runs as a ChatSDK Agent for job-seeker communities, using Vercel AI SDK, AI Gateway, and ChatSDK adapters to verify suspicious posts inside chat.

Proof points:

- Slack webhook route exists at `/api/webhooks/slack`.
- ChatSDK packages and Redis state adapter are installed.
- `lib/hireproof-bot.ts` handles mentions and subscribed messages.
- Slack screenshot proof is captured at `docs/demo/Screenshot 2026-04-30 024756.jpg`.

Safe boundary:

- Say "live-tested in Slack with screenshot proof."
- Do not over-explain request logs unless asked.

### Vercel Workflow / WDK

Use this wording:

> HireProof uses durable workflows to run longer job-post investigations in the background and notify users when evidence-backed reports are ready.

Proof points:

- Workflow route exists at `/api/workflows/audit`.
- `workflow/next` is enabled in `next.config.js`.
- Production accepted run: `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.
- `/api/integrations/proof` reports Workflow readiness in production.

Safe boundary:

- Say "production-accepted workflow run."
- Do not claim a completed long-running workflow result unless a completed result is captured.

## Demo Script

### 15 Seconds

Sketchy job post? Paste it into HireProof. It checks live evidence and tells you if the opportunity is Safe, Caution, or High-Risk before you apply.

### 30 Seconds

Everyone has seen a job post that feels too good to be true. HireProof checks it before you apply. Paste the post or recruiter message, and the agent extracts the claims, checks company presence, scans news, compares similar jobs, and returns a proof-backed verdict with red flags and safer alternatives.

### 60 Seconds

Job scams can look normal until you notice the gaps: unrealistic pay, no interview, off-platform messaging, or a company footprint that does not hold up.

HireProof investigates those gaps for you. Paste a job post, recruiter pitch, or apply URL. The agent extracts the role, company, salary, location, and contact method, then checks live evidence across search, news, jobs, and local business signals. It returns a clear verdict, a risk score, evidence cards, red flags, green flags, and safer next steps.

This is not another generic chatbot. It is a job-post investigator built with v0, deployed on Vercel, powered by runtime MCP tools, and extended through ChatSDK and Vercel Workflow surfaces.

### 5-Minute Walkthrough

1. Open with the problem:

   "Everyone has seen a job post that feels off: high pay, vague company details, no interview, and a request to move to Telegram. The hard part is that job seekers often find out too late."

2. Show the sample:

   "Here is a suspicious remote frontend intern post: PHP 80,000 per week, no interview, and Telegram contact."

3. Run the audit:

   "I paste it into HireProof and start the investigation. The agent is not just giving generic advice. It extracts claims, checks company presence, scans recent news, compares similar job listings, looks for local footprint, and scores the risk."

4. Reveal the result:

   "The verdict is High-Risk. The top issues are unrealistic pay, off-platform contact, weak company footprint, and missing credible hiring signals. The report also shows evidence links and safer alternatives."

5. Explain the platform story:

   "The core web app is the strongest demo path. The same verification engine is exposed through MCP tools, a Slack ChatSDK surface, and a Vercel Workflow route for async investigations."

6. Close:

   "HireProof turns job anxiety into evidence. Paste a job post. Know if it is legit before you apply."

## Screenshot And Proof Checklist

Capture or attach these in order:

1. Home page hero: "Built for suspicious job posts."
2. Audit input with suspicious job sample pasted.
3. Investigation progress or evidence cards.
4. High-Risk result with 92/100 score visible.
5. Red flags and safer alternatives visible.
6. `/docs/triple-track-coverage` showing the three surfaces.
7. Slack proof screenshot: `docs/demo/Screenshot 2026-04-30 024756.jpg`.
8. Integration proof response from `/api/integrations/proof`.
9. Optional: health response from `/api/health`.

Recommended cover image:

- Use the result screen, not the landing page.
- Show the suspicious post, High-Risk verdict, risk score, red flags, and evidence cards.
- Suggested overlay text: "High-Risk: Telegram contact, unrealistic pay, weak company footprint."

## Copy Blocks

### Social Post

I built HireProof for Zero to Agent.

Paste a suspicious job post, recruiter message, or apply link, and it checks whether the opportunity looks legit using evidence, not vibes.

It returns a Safe, Caution, or High-Risk verdict with red flags, proof links, and safer next steps.

Built with v0, Vercel, MCP tools, AI SDK, ChatSDK, and Vercel Workflow.

Demo: https://hireproof-sigma.vercel.app

### Community Message

Hey, I built HireProof for Zero to Agent. It checks suspicious job posts with live evidence and gives a clear risk verdict before someone applies. If the demo feels useful, I would appreciate your vote when voting opens.

Demo: https://hireproof-sigma.vercel.app

### Fallback Demo Wording

For reliability, I am switching to demo mode. This uses the same interface and report shape, but with seeded evidence so the full experience is visible even if live APIs are slow during judging.

The important part is the product flow: paste a suspicious post, watch the investigation steps, and get a proof-backed verdict with red flags and safer alternatives.

Live mode uses the same flow with runtime MCP tools connected to SerpApi for search, news, jobs, and local evidence.

## Known Caveats

Use these only if asked:

- Slack: "Slack has screenshot proof through the ChatSDK surface. If deeper proof is needed, we can show the webhook route and integration readiness."
- Workflow: "The production Workflow route accepted a run. We are not claiming a completed long-running workflow transcript unless a completed result is captured."
- Browser extension: "The extension is positioned as local install until a real store listing exists."
- Export: "The current reliable export path is screenshot/JSON-oriented; PDF/CSV is planned where noted."
- Verified badge: "Badge verification requires DNS TXT ownership and public embed tokens. It does not expose API keys."

## Final Submission Stance

Lead with the working web demo. It is the clearest product experience and the fastest way for judges to understand the value.

Then use the platform proof as supporting evidence:

1. v0 + MCPs: core working product.
2. ChatSDK: Slack proof screenshot and webhook route.
3. WDK: production-accepted workflow run.

Do not center the pitch on implementation breadth. Center it on the job seeker moment: "Should I trust this job post before I apply?"
