# HireProof Product Design Case Study

## Project

HireProof is a proof-backed job scam verification agent built solo by Mark Siazon for the Vercel Zero to Agent global hackathon in about one week.

Live demo: https://hireproof.tech

## Product Thesis

Job seekers do not need a generic warning article when a suspicious opportunity appears. They need a fast trust checkpoint before they apply, send money, share identity documents, or move to an off-platform chat.

HireProof turns that moment into a structured product flow:

1. Paste the job post, recruiter message, screenshot, or apply link.
2. Extract the important claims.
3. Check visible evidence.
4. Return a Safe, Caution, or High-Risk verdict.
5. Show the reasoning and next steps.

## Target User

Primary user:

- A job seeker who sees a suspicious role and wants to know whether it is worth trusting.

Secondary users:

- Career communities where members ask if a job post is real.
- Recruiters, moderators, and mentors who want a repeatable review flow.
- Builders who want a headless job-scam verification API or agent tool.

## Problem Framing

Job scams are hard because each signal is small by itself:

- The pay is unusually high.
- The interview process is vague or missing.
- The recruiter pushes Telegram, WhatsApp, or email-only communication.
- The company footprint is weak.
- The apply link does not match the brand.
- The post asks for personal information too early.

The product challenge was to make these signals understandable without overwhelming the user.

## Product Principles

- Evidence before advice: show why the verdict happened.
- Narrow domain, stronger trust: focus on employment fraud instead of claiming generic fraud coverage.
- Clear uncertainty: distinguish live evidence, demo fixtures, missing providers, and credential-gated checks.
- Fast first answer: make the top verdict obvious, then let the user inspect details.
- Portable core: expose the same verification logic across web, API, MCP, chat, workflow, CLI, SDK, and extension surfaces.

## Key Product Decisions

### Focus On Job Scams First

The original wedge is intentionally narrow. Employment fraud combines financial risk, identity risk, emotional pressure, and fragmented evidence. That makes it a strong first use case for an evidence-backed agent.

### Verdicts Stay Human-Readable

The verdict language uses Safe, Caution, and High-Risk because job seekers need a decision quickly. The score supports the verdict, but the product does not make the score the only message.

### Evidence Is Part Of The Interface

The product avoids a black-box chatbot answer. Red flags, green flags, evidence cards, safer alternatives, and next steps are visible so users can judge the output.

### Demo Mode Is Honest

Demo fixtures make judging reliable, but the UI labels them as seeded demo evidence. This protects the product story from overstating live-provider behavior.

### Cost Safety Is A Product Requirement

After the hackathon, public usage can create model, search, OCR, and Safe Browsing costs. The product design includes BYOK and provider guardrails because a live portfolio project should not expose unlimited spend.

## Surface Strategy

HireProof is one product core with multiple delivery surfaces:

| Surface | Product reason |
| --- | --- |
| Web app | Fastest way for a job seeker or judge to understand the value. |
| API | Lets other agents and tools request structured verdicts. |
| MCP | Makes the investigation tools usable from agent clients. |
| ChatSDK | Brings checks into communities where suspicious posts are discussed. |
| WDK | Supports longer background investigations and callback delivery. |
| CLI / SDK / n8n / LangChain | Makes the verification core reusable by builders and automation users. |
| Chrome extension | Moves the check closer to where job posts are found. |

## Product Design Tradeoffs

| Tradeoff | Decision |
| --- | --- |
| Broad fraud platform vs employment fraud | Chose employment fraud for clarity and proof. |
| Chatbot answer vs evidence report | Chose evidence report for trust and reviewability. |
| Live-only demo vs deterministic fixture | Chose both, with visible labels and boundaries. |
| More features vs clearer submission story | Prioritized proof-backed audit, three-track coverage, and package readiness. |
| Public live usage vs cost exposure | Added guardrails and BYOK posture for post-hackathon life. |

## Outcome

HireProof shipped as a production-facing portfolio project, not just a prototype:

- Live Vercel app.
- v1.0 GitHub release.
- Public README and docs.
- Three-track hackathon coverage.
- CLI, SDK, n8n, LangChain, MCP, API, ChatSDK, WDK, and extension surfaces.
- Cost-safety plan for keeping the app online after the event.

## Portfolio Summary

I designed HireProof around a real trust problem: suspicious job opportunities that look legitimate until the evidence fails. The product turns scattered manual checks into one proof-backed decision flow, with transparent reasoning and practical next steps.

