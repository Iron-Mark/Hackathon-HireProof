---
marp: true
title: HireProof
description: Pitch deck for the Cursor Hackathon project
theme: default
paginate: true
---

# HireProof

Paste a job post. Know if it is legit before you apply.

**A proof-backed AI agent for job-post verification.**

---

## The Hook

> Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.

Everyone has seen a post that feels like this.

The question is: **do you ignore it, trust it, or verify it?**

---

## The Problem

Job seekers are asked to trust opportunities before they can verify them.

Suspicious posts often hide behind normal-looking details:

- remote work
- high pay
- vague company identity
- fast hiring
- messaging-app handoff

---

## The Evidence

This is a real risk category.

- FTC: job-scam losses more than tripled from 2020 to 2023.
- FTC: losses topped $220M in the first half of 2024.
- FTC: task scams were estimated at 38.8% of job-scam reports in H1 2024.
- UN Philippines warned about fake job vacancies impersonating UN entities.
- Philippine SEC warned job seekers about scams on Viber, Messenger, and Telegram.

---

## The Manual Workflow Is Broken

To verify one opportunity, a careful applicant has to check:

- search results
- company website
- recent news
- maps or local footprint
- comparable job listings
- recruiter contact method

Most people skip this because it is slow and uncertain.

---

## The User

HireProof starts with people who need fast trust signals:

- students
- fresh graduates
- junior professionals
- career switchers
- remote-work applicants

They want opportunity, but they do not want to get baited.

---

## The Solution

**HireProof is a job-post investigator.**

The user pastes a job post, recruiter message, or URL.

The agent checks live evidence and returns:

- Safe, Caution, or High-Risk verdict
- risk score
- red flags and green flags
- evidence cards
- safer alternatives

---

## How It Works

1. Extract claims
2. Search company presence
3. Check recent news
4. Compare legitimate jobs
5. Check local footprint
6. Score risk
7. Recommend safer alternatives

The product shows these steps as a visible investigation timeline.

---

## Demo Moment

Input:

> Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.

Expected result:

**High-Risk**

Why: unrealistic pay, off-platform contact, weak company footprint, missing credible hiring signals.

---

## The Winning Screen

The result is not a chat transcript.

It is a structured report:

- verdict badge
- risk score
- top red flags
- proof links
- evidence labels
- safer jobs to consider
- export/share card

---

## Technical Story

Planned stack:

- Next.js App Router
- TypeScript
- Tailwind CSS and shadcn/ui
- v0-built interface
- AI SDK structured outputs
- runtime MCP tools over HTTP
- SerpApi Search, News, Jobs, and Local evidence
- Vercel deployment

---

## Why v0 + MCPs

v0 gives the fast, polished interface.

Runtime MCP gives the agent real tools:

- `search_company`
- `news_check`
- `jobs_compare`
- `local_presence`

SerpApi gives live evidence. The AI SDK turns that evidence into a typed report.

---

## MVP Scope

Ship the smallest complete loop:

1. Landing page
2. Audit workspace
3. Demo sample
4. Investigation timeline
5. Verdict report
6. Evidence cards
7. Safer alternatives
8. Export/share result card

No auth. No dashboard bloat. No unrelated features.

---

## Why This Wins

HireProof is:

- useful in one sentence
- demoable in under one minute
- grounded in a current problem
- visual enough for community voting
- credible for judges
- aligned with v0 + MCPs

---

## Closing

HireProof turns job anxiety into evidence.

**Paste a job post. Know if it is legit before you apply.**

---

## Sources

- FTC job-scam data spotlight
- UN Philippines fake-vacancy warning
- BusinessWorld report on Philippine SEC job-scam warning
- FBI cryptocurrency job-scam guidance
- v0 MCP docs
- AI SDK MCP and structured-output docs
- SerpApi Jobs and News API docs
