# HireProof Portfolio Case Study

## Overview

HireProof is a proof-backed job scam verification agent built by Mark Siazon during a solo global hackathon sprint. The project was developed in roughly one week as a production-facing Vercel app, not just a local prototype.

Live app: https://hireproof-sigma.vercel.app

v1.0 release: https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/releases/tag/v1.0

## What It Solves

Job scams often look legitimate until a few details fail: unrealistic pay, no interview, Telegram-only contact, suspicious recruiter email, weak company footprint, or a mismatched apply link.

HireProof gives applicants a clear trust checkpoint before they send resumes, IDs, bank details, verification codes, or personal data.

## What I Built

- A Next.js audit app for pasted job posts, recruiter messages, screenshots, and job URLs.
- A visible evidence report with `Safe`, `Caution`, or `High-Risk` verdicts.
- Runtime evidence checks across search, news, jobs, local footprint, DNS, RDAP, certificate transparency, threat intelligence, Safe Browsing, OCR, and provider status.
- Public demo fixtures for reliable judging and offline review.
- BYOK-aware API, MCP tools, CLI, SDK, LangChain, n8n, Make, Chrome extension package, and release assets.
- Cost-safety controls for running the project live after the hackathon without exposing unlimited provider spend.

## Technical Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Vercel AI SDK and AI Gateway
- SerpApi Google Search, News, Jobs, and Maps evidence
- Google Vision OCR with Tesseract fallback
- Upstash Redis for report storage, rate limits, cache, and cost guards
- Vercel Workflow / WDK route and ChatSDK platform adapters

## Proof Points

- Production app is live on the stable Vercel alias.
- GitHub v1.0 release includes release assets and proof graphics.
- Final proof artifacts are stored in `docs/final-release-proof.md` and `artifacts/final-release-proof/`.
- GitHub Packages publishing workflow completed for package aliases.
- Responsive Playwright checks covered mobile, tablet, landscape, desktop, and wide desktop.
- Runtime verification passed before the final release proof commit.

## Positioning

HireProof stays focused on employment fraud and job scams. It is not positioned as a generic fraud platform, cyber platform, or all-purpose security scanner.

Portfolio line:

> I built HireProof solo for a global hackathon in about one week: a production-deployed, proof-backed AI agent that helps job seekers verify suspicious opportunities before they apply or share sensitive data.

## After-Hackathon Path

- Keep the public app live as a portfolio and judge-review surface.
- Keep provider spend capped with the after-hackathon cost-safety controls.
- Move serious live usage toward BYOK credentials.
- Continue external marketplace publication only where external account review is required.
