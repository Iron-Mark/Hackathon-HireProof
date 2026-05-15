# HireProof Submission Package

## Title

**HireProof**

## Tagline

Paste a job post. Know if it is legit before you apply.

## Short Description

A proof-backed AI agent that audits suspicious job posts before you apply.

## Long Description

HireProof helps job seekers verify whether an opportunity looks legitimate, risky, or suspicious. Users paste a job post, recruiter message, or job URL, and the agent extracts the key claims, checks web presence, scans recent news, compares similar legitimate openings, and looks for local business signals.

The result is a structured risk report with a clear Safe, Caution, or High-Risk verdict, a risk score, evidence cards, red flags, green flags, and safer alternatives. Instead of giving vague career advice, HireProof shows proof: what it checked, what it found, and what the user should do next.

HireProof can be presented across the hackathon tracks as one employment-fraud trust-and-safety agent with multiple surfaces: a v0-built web app, runtime MCP tools for evidence gathering, live-tested ChatSDK Slack and Telegram delivery for job communities, and a production-accepted WDK workflow path for longer-running investigations.

HireProof intentionally starts with employment fraud because job scams combine urgency, financial risk, identity exposure, and fragmented evidence. The focused domain is the wedge, not the ceiling: the same evidence core already runs through web, API, MCP, ChatSDK, workflow, and automation integration surfaces.

## Tags

AI agent, MCP, v0, Vercel, SerpApi, job safety, job scams, verification, trust and safety, career tools

## Track Coverage

HireProof can cover all three hackathon tracks as one job-verification agent:

- **v0 + MCPs**: implemented web app plus runtime MCP evidence tools.
- **ChatSDK Agents**: live-tested Slack and Telegram delivery using deployed webhooks; Slack proof screenshot at `docs/demo/Screenshot 2026-04-30 024756.jpg`.
- **Vercel Workflow / WDK**: production-accepted workflow run through `/api/workflows/audit`; run ID `wrun_01KQD9H6AND3W7YZBHHKAH2KV5`.

For submission, lead with the strongest working web flow, then show ChatSDK screenshot/log proof and the production WDK run ID as supporting platform coverage.

## Competitive Roadmap

- Near-term proof: capture Discord live-provider proof, configure optional provider adapters if it remains in scope, and recapture the Telegram report-link screenshot.
- Durable workflow: add a WDK investigation timeline with intake, evidence checks, scoring, report creation, callback delivery, and retry history.
- Integration publishing: submit the repo-shipped n8n community node, Make Custom App source, and LangChain package to their external marketplaces after account-backed review steps are complete.
- Risk model: explore calibrated learning from reviewed cases as roadmap-only work while preserving explainable red flags, green flags, and evidence receipts.
- Multimodal evidence: improve screenshot/OCR handling and integrate specialist image or deepfake forensics providers only where independently verified proof adds trustworthy evidence.

Safe boundary: the current scorer is a transparent evidence-weighted safety policy, not a claimed continuous-learning model. The current WDK proof is an accepted production run, not a completed long-running transcript.

## Cover Image Direction

Use the result screen, not the landing page. The cover should show:

- A pasted suspicious job pitch on the left.
- A visible investigation timeline in the center.
- A large **High-Risk** verdict and risk score on the right.
- Three red flags with short labels.
- Evidence cards with source labels.
- A small "safer alternatives found" strip.

Suggested visual text: **"High-Risk: Telegram contact, unrealistic pay, weak company footprint."**

## 15-Second Script

Sketchy job post? Paste it into HireProof. It investigates live evidence and tells you if the opportunity is Safe, Caution, or High-Risk before you waste time applying.

## 30-Second Script

Everyone has seen a job post that feels a little too good to be true. HireProof checks it before you apply. Paste the post or recruiter message, and the agent extracts the claims, searches company presence, checks news, compares similar jobs, and returns a proof-backed verdict with red flags and safer alternatives.

## 60-Second Script

Job scams can look normal until you notice the gaps. The problem is that checking those gaps manually means opening search, news, maps, and job sites while still guessing.

HireProof does that investigation for you. Paste a job post, recruiter pitch, or URL. The agent extracts the role, company, salary, location, and contact method, then checks live evidence through Search, News, Jobs, and Local signals. It returns a clear verdict, a risk score, evidence cards, red flags, green flags, and safer jobs to consider.

This is not another chatbot. It is a job-post investigator built with v0, deployed on Vercel, and powered by runtime MCP tools plus SerpApi.

## 5-Minute Presentation Script

Start with the problem:

"Everyone has seen a job post that feels off: high pay, vague company details, no interview, and a request to message someone on Telegram. The hard part is that job seekers often find out too late."

Show the sample:

"Here is a suspicious remote frontend intern post: PHP 80,000 per week, no interview, and Telegram contact."

Run the demo:

"I paste it into HireProof and click Investigate. The agent is not just responding with advice. It is extracting claims, checking company presence, checking recent news, comparing similar job listings, looking for local footprint, and then scoring the risk."

Reveal the result:

"The verdict is High-Risk. The top issues are unrealistic pay, off-platform contact, weak company footprint, and missing credible hiring signals. The report also shows evidence links and safer alternatives."

Explain the technical story after the result:

"The interface was built with v0 and runs as a Next.js app on Vercel. The audit flow uses structured output so the result is predictable. The app includes runtime MCP tools for company search, news checks, job comparison, and local presence. Those tools call SerpApi so the agent can use live evidence instead of a static prompt."

Close:

"HireProof turns job anxiety into evidence. Paste a job post. Know if it is legit before you apply."

## Social Post Copy

### X / LinkedIn

I built **HireProof** for Cursor Hackathon.

Paste a job post, recruiter message, or suspicious listing, and it investigates whether the opportunity looks legit using live evidence, not vibes.

It returns a Safe, Caution, or High-Risk verdict with red flags, proof links, and safer alternatives.

Built with v0, Vercel, MCP, AI SDK, and SerpApi, with Forensic PDF Dossier exports, live-tested ChatSDK Slack/Telegram proof, a production-accepted Vercel Workflow run, and repo-shipped n8n, Make, and LangChain integration packs.

### Short Video Caption

I built an AI agent that checks sketchy job posts before you apply. Paste the listing, watch it investigate, and get a risk score with proof.

### Group Chat / Community Copy

Hey, I built HireProof for Cursor Hackathon. It checks suspicious job posts with live evidence and gives a clear risk verdict before someone applies. If the demo feels useful, I would appreciate your vote when voting opens.

## Voting-Day Plan

1. Pin the demo link and one result screenshot.
2. Share the 15-second clip first, then the full demo link.
3. Lead with the pain: "Would this save someone from a sketchy job post?"
4. Ask for votes only after showing the result.
5. Reply quickly to technical questions about v0, MCP, SerpApi, Vercel, ChatSDK, and WDK proof.
6. Keep the app no-auth and demo-ready during the full voting window.
7. Use the same sample flow for every live walkthrough.

## Demo Checklist

- Vercel deployment opens without login.
- `/audit` loads on desktop and mobile.
- Demo sample is prefilled or one click away.
- Investigate button shows visible step progress.
- High-Risk result appears reliably.
- Verdict, score, red flags, and evidence are visible in one screenshot.
- Safer alternatives section is populated.
- Export/share card features PDF Dossier, Safety Certificate, and CSV/JSON downloads.
- Demo mode badge appears when fixtures are used.
- Environment variables are set for live mode.
- Fallback demo still works without API keys.

## Fallback Demo Wording

"For reliability, I am switching to demo mode. This uses the same interface and the same structured report shape, but with seeded evidence so the full experience is visible even if live APIs are slow during the presentation."

"The important part is the product flow: paste a suspicious job post, watch the investigation steps, and get a proof-backed verdict with red flags and safer alternatives."

"Live mode uses the same flow with runtime MCP tools connected to SerpApi for Search, News, Jobs, and Local evidence."

