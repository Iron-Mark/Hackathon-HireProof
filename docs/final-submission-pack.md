# HireProof Final Submission Pack

Last checked: 2026-05-03

## Submission Basics

### Title

HireProof

### Tagline

Paste a job post. Know if it is legit before you apply.

### One-Liner

HireProof is a proof-backed AI agent that checks suspicious job posts, recruiter messages, and apply links before someone wastes time or shares personal information.

### Short Description

HireProof helps job seekers verify suspicious opportunities before they apply. Paste a job post, recruiter message, screenshot, or apply URL, and the agent investigates company presence, recent news, similar legitimate jobs, local business signals, and visible screenshot text before returning a Safe, Caution, or High-Risk verdict with evidence.

HireProof intentionally starts with employment fraud because job scams combine urgency, financial risk, identity exposure, and fragmented evidence. The current version uses transparent evidence-weighted scoring so users can see why a verdict was reached. The roadmap expands this into adaptive scoring, richer screenshot analysis, and durable workflow investigations with retryable evidence collection.

### Long Description

Job scams often look normal until a few details do not add up: unrealistic pay, no interview process, off-platform messaging, weak company footprint, or pressure to act quickly. Checking those signals manually means opening search, news, maps, job boards, and company pages while still guessing.

HireProof turns that manual investigation into one proof-backed workflow. A user pastes a job post, recruiter pitch, screenshot, or apply URL. The agent extracts the important claims, reads screenshots through OCR, resolves supported public job URLs, checks live evidence, compares the role against legitimate postings, and returns a structured report with a verdict, risk score, red flags, green flags, evidence cards, verified-only safer alternatives, and practical next steps.

The product is built as a Vercel-hosted Next.js app with runtime MCP investigation tools, AI SDK model routing, SerpApi evidence search, ChatSDK surfaces, and a production-accepted Vercel Workflow path for longer-running investigations.

### Competitive Positioning

Use this if judges ask whether the product is too narrow:

> HireProof focuses on employment fraud first because job scams happen in urgent, personal, high-risk moments where users need an actionable verdict, not a generic fraud dashboard. The narrow domain is the wedge, not the ceiling: the same evidence core already runs through the web app, API, MCP tools, ChatSDK agents, and WDK workflow entrypoint.

Use this if judges ask whether the risk model is only heuristic:

> HireProof uses a transparent evidence-weighted safety policy. It does not claim continuous ML today; instead, it shows users which red flags, green flags, and evidence receipts drove the verdict. That explainability is deliberate for safety decisions where users need to understand the reason, not just trust a black-box score.

Use this if judges ask about the WDK roadmap:

> The current WDK proof is a production-accepted workflow run. The next milestone is a durable investigation timeline with intake, evidence checks, scoring, report creation, callback delivery, and retry history.

### Before / After Story

Before HireProof, a job seeker has to manually search the company, recruiter, salary range, contact method, news, job-board footprint, and scam patterns before deciding whether to apply.

After HireProof, the same check becomes one agent workflow: paste the suspicious post, let the agent collect evidence, and get a clear Safe, Caution, or High-Risk report with the reasoning visible.

### Why This Is A Real Agent

HireProof is not a generic chatbot. It performs a multi-step investigation:

- Extracts structured claims from the job post.
- Calls runtime investigation tools for company, news, job-market, and local footprint checks.
- Uses live SerpApi-backed evidence when production credentials are configured.
- Reads uploaded or pasted screenshots with Google Vision OCR first and Tesseract fallback when needed.
- Resolves supported public job URLs and flags conflicts between pasted text, OCR text, and resolved job-page content.
- Scores risk with transparent red-flag and green-flag policy.
- Persists a report that can be opened, shared, exported, or called from API/chat/workflow surfaces.

### Live-Proven Boundary

Safe claim:

> HireProof is production-deployed, API-smoke-tested, Slack-screenshot-proven, Telegram-delivery-proven, and WDK accepted-run proven.

Careful boundary:

> Discord is credential-ready but pending a real event capture. Telegram delivery is live-proven, but the final report-link screenshot should be recaptured after the permalink fix.

## Links

- Demo: `https://hireproof.tech`
- Main flow: `https://hireproof.tech/audit`
- Track proof docs: `https://hireproof.tech/docs/triple-track-coverage`
- Discord install: `https://discord.com/oauth2/authorize?client_id=1500240100804530336&scope=bot%20applications.commands&permissions=0`
- Health check: `https://hireproof.tech/api/health`
- Integration proof: `https://hireproof.tech/api/integrations/proof`

## Track Wording

### v0 + MCPs

Use this wording:

> HireProof is a v0-built AI app that connects to MCP investigation tools to verify suspicious job posts with live evidence.

Proof points:

- Next.js app deployed on Vercel.
- Runtime MCP tools for company presence, news reputation, job comparison, and local business footprint.
- Live evidence via SerpApi when configured.
- Deterministic demo mode for reliable judging.
- Demo fixture mode is clearly labeled and should not be described as live evidence.
- Verified-only safer alternatives appear only when comparable job evidence has a real source.
- Live audit guardrails include queue throttling, cache reuse, and a SerpApi circuit breaker.

### ChatSDK Agents

Use this wording:

> HireProof runs as a ChatSDK Agent for job-seeker communities, using Vercel AI SDK, AI Gateway, and ChatSDK adapters to verify suspicious posts inside chat.

Proof points:

- Slack webhook route exists at `/api/webhooks/slack`.
- ChatSDK packages and Redis state adapter are installed.
- `lib/hireproof-bot.ts` handles mentions and subscribed messages.
- Slack screenshot proof is captured at `docs/demo/Screenshot 2026-04-30 024756.jpg`.
- Telegram has real delivery screenshot/log proof.
- Discord is credential-ready but still pending a real provider-event capture.
- Discord public server install link is available at `https://discord.com/oauth2/authorize?client_id=1500240100804530336&scope=bot%20applications.commands&permissions=0`.
- Discord slash commands are implemented as `/verify job_post:<text-or-link>` and `/help`; supported public job URLs are expanded before auditing. Register them with `npm run discord:commands`.
- Additional provider routes remain backend-gated.

Safe boundary:

- Say "Slack is screenshot-proven and Telegram delivery is screenshot/log-proven."
- Say "Telegram delivery is live-proven; Discord is credential-ready; optional provider adapters are credential-gated."
- Do not say "live-tested on Discord/provider adapters" until `npm run proof:chat-live:strict` passes and screenshots/logs are archived.
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

HireProof investigates those gaps for you. Paste a job post, recruiter pitch, screenshot, or apply URL. The agent extracts the role, company, salary, location, contact method, and apply path, then checks live evidence across search, news, jobs, local business signals, OCR text, and URL content. It returns a clear verdict, a risk score, evidence cards, red flags, green flags, and safer next steps.

This is not another generic chatbot. It is a job-post investigator built with v0, deployed on Vercel, powered by runtime MCP tools, and extended through ChatSDK and Vercel Workflow surfaces.

## Roadmap Positioning

Use this as the credible future direction without weakening the current submission:

- Near-term proof: capture one real Discord message screenshot/log, configure optional provider adapters if that proof stays in scope, and recapture the Telegram report-link screenshot after the permalink fix.
- Durable workflow: add a public investigation timeline that shows intake, evidence checks, scoring, report creation, callback delivery, and retry history for WDK runs.
- Risk model: explore calibrated learning from reviewed cases as roadmap-only work while keeping verdicts explainable through visible red flags, green flags, and evidence receipts.
- Multimodal evidence: current screenshot OCR uses Google Vision first with Tesseract fallback. Specialist image or deepfake forensics providers belong only where independently verified proof adds real evidence.

### 15-Second Vertical Video

Open on a Telegram-style scam pitch: "Remote intern, PHP 80,000/week, no interview." Cut to HireProof running the High-Risk demo, then zoom on the verdict and red flags. End card: "Paste before you apply. Vote HireProof."

### 30-Second Vertical Video

Show the suspicious offer, paste it into HireProof, and let the timeline show claim extraction, evidence checks, and the High-Risk verdict. Keep the narration direct: "Too-good-to-be-true work offers can cost people money and identity documents. HireProof checks the evidence first." End with the live URL and voting reminder.

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
8. Telegram live delivery screenshot and matching webhook log.
9. Integration proof response from `/api/integrations/proof`.
10. Optional: health response from `/api/health`.

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

Demo: https://hireproof.tech

### Community Message

Hey, I built HireProof for Zero to Agent. It checks suspicious job posts with live evidence and gives a clear risk verdict before someone applies. If the demo feels useful, I would appreciate your vote when voting opens.

Demo: https://hireproof.tech

### Localized Voting Copy

Filipino/Tagalog-style:

> May nakita kang job post na parang too good to be true? Paste mo muna sa HireProof bago ka mag-apply. It checks the evidence and shows if it is Safe, Caution, or High-Risk.

Spanish:

> ¿Una oferta parece demasiado buena para ser verdad? Pégalo primero en HireProof antes de postular. Revisa evidencia y te muestra si es segura, dudosa o de alto riesgo.

### Voting-Day Mobilization

1. Share the 15-second vertical clip first, then the live demo link.
2. Post in university, remote-work, career, and local tech groups with the Filipino/Tagalog-style copy where appropriate.
3. Pin the High-Risk result screenshot and the production URL.
4. Reply with the `/proof` page when someone asks whether the platform proof is real.
5. Remind voters near the close of the 24-hour voting window.

### Fallback Demo Wording

For reliability, I am switching to demo mode. Demo fixture mode is clearly labeled and uses the same interface and report shape, but with seeded fixture evidence so the flow is visible even if live APIs are slow during judging.

The important part is the product flow: paste a suspicious post, watch the investigation steps, and get a proof-backed verdict with red flags and safer alternatives.

Live mode uses the same flow with runtime MCP tools connected to SerpApi for search, news, jobs, and local evidence.

## Known Caveats

Use these only if asked:

- ChatSDK: "Slack and Telegram are live-proven. Discord is credential-ready pending a real event capture. optional provider adapters are implemented but credential-gated."
- Workflow: "The production Workflow route accepted a run. We are not claiming a completed long-running workflow transcript unless a completed result is captured."
- Model: "The current scorer is a transparent evidence-weighted safety policy, not a claimed continuous-learning model."
- Multimodal: "HireProof accepts screenshots, but it should not be described as an in-house deepfake detector."
- Screenshot privacy: "The raw screenshot is not stored as a report evidence item. Screenshot-derived reports are excluded from Explore and Trends by default, while direct report links still work."
- Demo fixtures: "Demo mode uses seeded examples for deterministic demos and should not be described as live evidence."
- Browser extension: "The extension has a Chrome Web Store-ready package and listing draft; public listing publication still requires Google review."
- Export: "The current reliable export path includes PNG screenshots, PDF dossiers, safety certificates for Safe listings, and JSON/CSV trend exports."
- Verified badge: "Badge verification requires DNS TXT ownership and public embed tokens. It does not expose API keys."

## Final Submission Stance

Lead with the working web demo. It is the clearest product experience and the fastest way for judges to understand the value.

Then use the platform proof as supporting evidence:

1. v0 + MCPs: core working product.
2. ChatSDK: Slack proof screenshot, Telegram delivery proof, and webhook route.
3. WDK: production-accepted workflow run.

Do not center the pitch on implementation breadth. Center it on the job seeker moment: "Should I trust this job post before I apply?"

