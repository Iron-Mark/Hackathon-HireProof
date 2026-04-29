# HireProof Pitch

## One-Liner

HireProof is a proof-backed AI agent that checks whether a job post looks legitimate before someone applies.

## 15-Second Pitch

Sketchy job post? Paste it into HireProof. It checks live evidence and tells you if the opportunity is **Safe**, **Caution**, or **High-Risk** before you waste time applying.

## 30-Second Pitch

Job scams increasingly look like normal remote-work opportunities. They use high pay, vague roles, off-platform messages, and fake urgency. HireProof gives job seekers a faster way to check before they apply. Paste a post or recruiter message, and the agent investigates company presence, recent news, comparable jobs, and local footprint. The output is a clear verdict, proof links, red flags, and safer alternatives.

## 60-Second Pitch

Everyone has seen a job post that feels a little too good to be true: high pay, vague company details, no interview, and a request to continue on Telegram or Messenger.

The risk is real. The FTC reported that job-scam losses more than tripled from 2020 to 2023 and exceeded $220 million in just the first half of 2024. In the Philippines, the UN has warned about fake job vacancies impersonating official organizations, and the SEC has warned job seekers about scams spreading through messaging apps.

HireProof turns that risk into a simple investigation flow. Paste a job post, recruiter pitch, or URL. The agent extracts the claims, checks company presence, scans news, compares similar roles, checks local footprint, and returns a structured verdict: **Safe**, **Caution**, or **High-Risk**.

This is not another chatbot. It is a job-post investigator with proof, risk scoring, and safer next steps.

## Five-Minute Pitch

### 1. Open With The Pain

Everyone has seen a job post that feels off. The salary is unusually high, the company details are thin, there is no interview, and the next step is "message us on Telegram."

For job seekers, especially students and fresh grads, the hard part is not just finding opportunities. It is knowing which ones are safe enough to trust.

### 2. Make The Problem Concrete

This is not just a minor inconvenience. Job scams are getting more sophisticated and more expensive for victims. The FTC reported job-scam losses above $220 million in the first half of 2024 alone, with task scams becoming a major share of reports. In the Philippines, warnings from the UN and SEC show the same pattern: fake vacancies, messaging-app recruitment, upfront fees, fake urgency, and realistic-looking documents.

### 3. Show The Broken Workflow

Right now, a cautious applicant has to open several tabs: search, company site, maps, news, job boards, and maybe social profiles. Then they still have to make a judgment call.

That workflow is slow, fragmented, and easy to skip.

### 4. Introduce HireProof

HireProof makes job verification one clear flow.

Paste the job post. Click **Investigate**. The agent extracts the key claims, checks live evidence, and produces a structured trust report.

### 5. Run The Demo

Use this sample:

> Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.

Then show the visible investigation timeline:

1. Extract Claims
2. Search Presence
3. Check News
4. Compare Jobs
5. Check Local Footprint
6. Score Risk

### 6. Reveal The Result

The result is **High-Risk**.

The report explains why:

- unrealistic compensation
- off-platform contact
- weak company footprint
- missing credible hiring signals
- no normal application process

Then it shows safer alternatives, so the user is not only warned. They get a better next step.

### 7. Explain The Build

HireProof is built for the v0 + MCPs track.

The interface is generated and polished with v0, deployed on Vercel, and structured as a Next.js app. The agent uses structured outputs so the report is predictable. Runtime MCP tools handle company search, news checks, job comparison, and local presence. SerpApi powers the live Search, News, Jobs, and Local evidence.

### 8. Close

HireProof turns job anxiety into evidence.

Paste a job post. Know if it is legit before you apply.

## Judge-Facing Technical Line

HireProof is a Next.js app deployed on Vercel with a v0-built interface, AI SDK structured outputs, runtime MCP tools over HTTP, and SerpApi-backed evidence retrieval for job verification.

## Community-Facing Line

Too good to be true? Paste it before you apply.

## Sources To Mention If Asked

- FTC job-scam loss and task-scam data
- UN Philippines fake-vacancy warning
- Philippine SEC warning on messaging-app job scams
- FBI cryptocurrency job-scam guidance
