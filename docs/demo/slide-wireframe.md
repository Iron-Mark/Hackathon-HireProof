# HireProof Slide Wireframe

Use this as the visual blueprint for turning `slides.md` into a polished presentation. The deck should feel like an investigative product demo, not a startup fundraising deck.

## Design Direction

- Format: 16:9 widescreen
- Mood: serious, clear, investigative, trustworthy
- Palette: off-white or near-black base, charcoal text, muted red for risk, amber for caution, green for safe, blue only for source/evidence accents
- Typography: large plain headlines, compact body text, clear labels
- Visual motif: evidence cards, risk badges, timelines, source chips, report panels
- Avoid: gradient blobs, generic AI illustrations, chat bubbles, dense paragraphs, decorative dashboards

## Slide 1: Title

Purpose: establish the product and promise in one glance.

```text
+----------------------------------------------------------+
| HireProof                                                |
| Paste a job post. Know if it is legit before you apply.  |
|                                                          |
| [small product mock: verdict card + suspicious post]     |
|                                                          |
| Proof-backed AI agent for job-post verification          |
+----------------------------------------------------------+
```

Visual notes:
- Put the product name large, left aligned.
- Add a small mock result card on the right with a **High-Risk** badge.
- Keep the slide calm and premium.

## Slide 2: The Hook

Purpose: make the audience feel the problem immediately.

```text
+----------------------------------------------------------+
| "Remote frontend intern. PHP 80,000/week.                |
|  No interview. Message us on Telegram."                  |
|                                                          |
|        [job post message card]                           |
|                                                          |
| Do you ignore it, trust it, or verify it?                |
+----------------------------------------------------------+
```

Visual notes:
- Center the suspicious job post as a message/card.
- Highlight `PHP 80,000/week`, `No interview`, and `Telegram`.
- Use red underline or small risk chips, not loud warning graphics.

## Slide 3: The Problem

Purpose: show that suspicious posts hide behind normal job-post patterns.

```text
+----------------------------------------------------------+
| Job seekers are asked to trust before they can verify.   |
|                                                          |
| [remote work] [high pay] [vague company]                 |
| [fast hiring] [messaging-app handoff]                    |
|                                                          |
| The risk appears after time or information is already    |
| spent.                                                   |
+----------------------------------------------------------+
```

Visual notes:
- Use five compact risk chips.
- Bottom line should be the emotional consequence.

## Slide 4: Evidence

Purpose: prove this is a real market/user problem.

```text
+----------------------------------------------------------+
| This is a real risk category.                            |
|                                                          |
| +----------------+ +----------------+ +----------------+ |
| | FTC            | | FTC            | | PH / UN / SEC   | |
| | Losses topped  | | Task scams     | | Fake vacancies  | |
| | $220M in H1    | | 38.8% of       | | and messaging   | |
| | 2024           | | H1 reports     | | app scams       | |
| +----------------+ +----------------+ +----------------+ |
|                                                          |
| Sources: FTC, UN Philippines, SEC reporting              |
+----------------------------------------------------------+
```

Visual notes:
- Three metric cards only.
- Keep citations tiny at bottom; full source list goes later.
- Use one accent color per card, but keep the base neutral.

## Slide 5: Manual Workflow

Purpose: show why the current behavior is painful.

```text
+----------------------------------------------------------+
| Verifying one post means opening too many tabs.          |
|                                                          |
| Search -> Company site -> News -> Maps -> Job boards     |
|        -> Recruiter contact -> Still guessing            |
|                                                          |
| [simple tab stack visual]                                |
+----------------------------------------------------------+
```

Visual notes:
- Use a horizontal flow or stacked browser tabs.
- The final node should be "Still guessing" to set up HireProof.

## Slide 6: Target User

Purpose: clarify who benefits first.

```text
+----------------------------------------------------------+
| Built first for applicants with the least room for error |
|                                                          |
| [student] [fresh grad] [junior pro] [career switcher]    |
| [remote applicant]                                      |
|                                                          |
| They want opportunity without getting baited.            |
+----------------------------------------------------------+
```

Visual notes:
- Use simple persona tiles.
- Do not over-explain demographics.

## Slide 7: Solution

Purpose: introduce HireProof as the clean answer.

```text
+----------------------------------------------------------+
| HireProof is a job-post investigator.                    |
|                                                          |
| Paste post -> Investigate -> Verdict with proof          |
|                                                          |
| [Safe] [Caution] [High-Risk]                             |
|                                                          |
| Evidence cards + red flags + safer alternatives          |
+----------------------------------------------------------+
```

Visual notes:
- Make the three verdict states visible.
- Use the phrase "with proof" as the differentiator.

## Slide 8: How It Works

Purpose: make the agentic behavior visible.

```text
+----------------------------------------------------------+
| Visible investigation timeline                           |
|                                                          |
| 1 Extract claims       [done]                            |
| 2 Search presence      [done]                            |
| 3 Check news           [done]                            |
| 4 Compare jobs         [done]                            |
| 5 Check local footprint[done]                            |
| 6 Score risk           [done]                            |
| 7 Recommend safer jobs [done]                            |
+----------------------------------------------------------+
```

Visual notes:
- Use a vertical timeline, not a paragraph.
- Each step should map to a visible product state.

## Slide 9: Demo Moment

Purpose: frame the live demo or screenshot sequence.

```text
+----------------------------------------------------------+
| Demo: suspicious post -> high-risk report                |
|                                                          |
| +--------------------+   +-----------------------------+ |
| | pasted job post    |   | High-Risk                   | |
| | Telegram, no int.  |=> | score: 89/100               | |
| | PHP 80,000/week    |   | 4 red flags, 3 sources      | |
| +--------------------+   +-----------------------------+ |
+----------------------------------------------------------+
```

Visual notes:
- This should look like the actual product.
- Use it as the screenshot target if no live app is ready yet.

## Slide 10: Winning Screen

Purpose: explain why the UI should be a report, not chat.

```text
+----------------------------------------------------------+
| Not chat. A structured trust report.                     |
|                                                          |
| [Verdict] [Risk Score] [Confidence]                      |
|                                                          |
| [Top red flags]        [Evidence cards]                  |
| [Green flags]          [Safer alternatives]              |
|                                                          |
| [Export/share result card]                               |
+----------------------------------------------------------+
```

Visual notes:
- Use a real dashboard/report layout.
- Make the export/share card visually distinct.

## Slide 11: Technical Story

Purpose: satisfy judges after the value is obvious.

```text
+----------------------------------------------------------+
| Technical architecture                                   |
|                                                          |
| v0 UI -> Next.js app -> AI SDK structured output         |
|                 |                                        |
|                 v                                        |
|           Runtime MCP tools                              |
|                 |                                        |
|                 v                                        |
|     SerpApi Search / News / Jobs / Local                 |
|                                                          |
| Deployed on Vercel                                      |
+----------------------------------------------------------+
```

Visual notes:
- Use a simple pipeline diagram.
- Do not show code.
- Emphasize runtime MCP tools, not just v0 generation.

## Slide 12: Why v0 + MCPs

Purpose: explain track fit directly.

```text
+----------------------------------------------------------+
| Why v0 + MCPs                                            |
|                                                          |
| v0: fast polished interface                              |
| MCP: real investigation tools at runtime                 |
| SerpApi: live evidence                                   |
| AI SDK: typed verdict report                             |
| Vercel: public deployed demo                             |
+----------------------------------------------------------+
```

Visual notes:
- Use five stacked rows with icons if available.
- Keep it crisp; this slide is technical positioning.

## Slide 13: MVP Scope

Purpose: show disciplined execution.

```text
+----------------------------------------------------------+
| The smallest complete loop                               |
|                                                          |
| [Landing] -> [Audit] -> [Timeline] -> [Verdict]          |
|          -> [Evidence] -> [Safer jobs] -> [Export]       |
|                                                          |
| Cut: auth, dashboard bloat, uploads, wallets, bots       |
+----------------------------------------------------------+
```

Visual notes:
- Make the build plan look intentionally focused.
- The "Cut" line helps show scope discipline.

## Slide 14: Why This Wins

Purpose: summarize selection logic.

```text
+----------------------------------------------------------+
| Why this can win                                         |
|                                                          |
| Useful in one sentence                                   |
| Demoable in under one minute                             |
| Grounded in a current problem                            |
| Visual enough for community voting                       |
| Credible enough for judges                               |
| Aligned with v0 + MCPs                                   |
+----------------------------------------------------------+
```

Visual notes:
- Use six check rows.
- This is the confidence slide before closing.

## Slide 15: Closing

Purpose: end with the phrase people remember.

```text
+----------------------------------------------------------+
| HireProof turns job anxiety into evidence.               |
|                                                          |
| Paste a job post.                                        |
| Know if it is legit before you apply.                    |
|                                                          |
| [Final product/result screenshot]                        |
+----------------------------------------------------------+
```

Visual notes:
- Big sentence, minimal text.
- End on the product screenshot, not the logo alone.

## Optional Appendix: Sources

Purpose: show credibility if judges ask.

```text
+----------------------------------------------------------+
| Sources                                                  |
|                                                          |
| FTC job-scam data spotlight                              |
| UN Philippines fake-vacancy warning                      |
| BusinessWorld report on SEC job-scam warning             |
| FBI cryptocurrency job-scam guidance                     |
| v0 MCP docs                                              |
| AI SDK MCP and structured-output docs                    |
| SerpApi Jobs and News API docs                           |
+----------------------------------------------------------+
```

Visual notes:
- Keep links available in `research-notes.md`.
- Do not present this unless asked or time allows.

## Asset Checklist

- Product logo or wordmark: `HireProof`
- Suspicious job post sample card
- High-Risk verdict card mock
- Risk score ring or badge
- Evidence cards with source chips
- Investigation timeline component
- Simple architecture diagram
- Final result screenshot or mock

## Build Notes For Slide Tooling

- `slides.md` is the content deck.
- This file is the visual wireframe.
- Keep slide text short; speaker detail belongs in `pitch.md`.
- Use `research-notes.md` for citations and backup facts.
