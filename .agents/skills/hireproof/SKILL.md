---
name: hireproof
description: Investigate suspicious job postings using HireProof's live AI agent tools; use when a user asks you to verify a job listing, check if a company is legitimate, detect recruitment scams, compare salary offers against market rates, or confirm a local business footprint before applying. Also use when the user pastes a job description, recruiter message, WhatsApp screenshot, or offer letter and asks if it is real or safe.
---

# HireProof — Job Investigation Skill

Investigate suspicious job postings end-to-end using live web intelligence. Cross-reference company presence, news reputation, salary benchmarks, and physical footprint. Return a structured verdict (**Safe**, **Caution**, or **High-Risk**) backed by verifiable evidence URLs — never by opinion.

## Quick Start

1. User provides a job post (text, URL, or image).
2. Extract claims: company name, role, salary, location, contact method.
3. Call investigation tools concurrently to gather evidence.
4. Score the findings and present a verdict with receipts.

## Setup

### 0) If MCP tools are not available, connect the server first:

Add to your MCP configuration and restart:

```json
{
  "mcpServers": {
    "hireproof": {
      "url": "https://hireproof-sigma.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "hireproof_agent_demo_key"
      }
    }
  }
}
```

After adding, restart your client. The 4 tools will be available.

**Tool naming:** Most MCP clients (Claude Code, Cursor, Copilot) namespace tools as `server_name:tool_name`. Since the server is named `hireproof`, the tools appear as:

| MCP Tool Name | Direct Protocol Name |
|---|---|
| `hireproof:search_company` | `search_company` |
| `hireproof:news_check` | `news_check` |
| `hireproof:jobs_compare` | `jobs_compare` |
| `hireproof:local_presence` | `local_presence` |

Use whichever format your client supports. Both resolve to the same tool.

### Alternative: REST API (no MCP required)

If your client does not support MCP, use the REST endpoint directly via HTTP:

```
POST https://hireproof-sigma.vercel.app/api/v1/audit
Headers: Content-Type: application/json, x-api-key: hireproof_agent_demo_key
Body: { "text": "<job post text>", "location": "<optional>" }
```

This runs the full pipeline and returns a complete `AuditReport` as JSON.

## Workflow

### 1) Receive and normalize the input

The user may provide:
- **Raw text** — job description, recruiter DM, email body, or chat message
- **URL** — link to a job listing on LinkedIn, Indeed, Jobstreet, etc.
- **Image** — screenshot of a WhatsApp message, Telegram chat, PDF offer letter, or social media post

**Before proceeding, extract these 6 claims from the input:**

| Claim | Example | If missing |
|-------|---------|------------|
| Company name | "Accenture" | Mark as "Unknown / Not stated" — this is itself a red flag |
| Role / title | "Frontend Intern" | Use whatever description is given |
| Salary | "PHP 80,000/week" | Note "Salary not disclosed" |
| Location | "Philippines" | Infer from currency, language, or ask the user |
| Contact method | "Telegram @recruiter" | Note "Not stated" |
| Application path | "No interview, start Monday" | Note how the user is expected to apply |

**Critical rule:** If the user provides only an image, describe what you see and extract claims from the visible text. If you cannot read the image, ask the user to paste the text.

### 2) Choose your investigation strategy

**Option A — Full pipeline via REST (recommended for comprehensive results):**

```bash
curl -X POST https://hireproof-sigma.vercel.app/api/v1/audit \
  -H "Content-Type: application/json" \
  -H "x-api-key: hireproof_agent_demo_key" \
  -d '{"text": "<full job post text>", "location": "<location>"}'
```

This runs all 4 tools concurrently and returns a scored report. Skip to Step 4.

**Option B — Individual MCP tools (when you need granular control):**

Call tools selectively based on what claims are present. Call them concurrently when possible.

| Condition | Tools to call |
|-----------|---------------|
| Company name is known | `search_company` + `news_check` + `local_presence` (all 3) |
| Company name is unknown | `jobs_compare` only (benchmark salary) |
| Salary is stated | `jobs_compare` (always — salary verification is critical) |
| Location is stated | `local_presence` + `jobs_compare` with location |
| All claims present | Call all 4 tools concurrently |

### 3) Call the tools

#### `search_company` — Verify web presence
```json
{
  "method": "tools/call",
  "name": "search_company",
  "arguments": { "company_name": "Accenture", "role": "Frontend Developer" }
}
```
**Returns:** Array of evidence items with `source`, `snippet`, `url`, and `type`.
**Look for:** Official website, LinkedIn company page, Wikipedia entry, Glassdoor profile. Their absence is a strong negative signal.

#### `news_check` — Search for scam reports
```json
{
  "method": "tools/call",
  "name": "news_check",
  "arguments": { "company_name": "TechStart Solutions", "keywords": ["scam", "fraud", "fake"] }
}
```
**Returns:** News articles with titles, snippets, dates, and URLs.
**Look for:** Fraud warnings, BBB complaints, Reddit threads, government agency alerts. Even one confirmed scam report is a critical red flag.

#### `jobs_compare` — Benchmark salary
```json
{
  "method": "tools/call",
  "name": "jobs_compare",
  "arguments": { "role": "Frontend Intern", "location": "Philippines", "level": "Entry Level" }
}
```
**Returns:** Comparable job listings with titles, companies, salaries, and URLs.
**Look for:** Is the offered salary 2x+ above the median for similar roles? If yes, flag as "Unrealistically high salary — possible bait."

#### `local_presence` — Verify physical footprint
```json
{
  "method": "tools/call",
  "name": "local_presence",
  "arguments": { "company_name": "Accenture", "location": "Philippines" }
}
```
**Returns:** Google Maps results with business names, addresses, and ratings.
**Look for:** Verified business listing with reviews. Ghost companies have no map presence.

### 4) Score and classify

Apply these weighted rules to produce a risk assessment:

**Red flags (each adds 10–25 points to risk score):**

| Flag | Weight | Trigger condition |
|------|--------|-------------------|
| No verifiable company web presence | +25 | `search_company` returns 0 relevant results |
| Active scam/fraud reports found | +25 | `news_check` finds confirmed scam articles |
| Salary 2x+ above market median | +20 | `jobs_compare` shows offered salary is an outlier |
| No physical business footprint | +15 | `local_presence` returns 0 results |
| Telegram/WhatsApp/personal email only | +15 | Contact method is not corporate email |
| "No interview" or "start immediately" | +15 | Application path skips standard hiring process |
| Requests money, IDs, or bank details | +20 | Post asks for upfront payment or sensitive docs |
| Vague role description | +10 | No specific responsibilities listed |
| New domain (< 90 days) | +10 | Domain registration is recent |

**Green flags (each subtracts 5–15 points from risk score):**

| Flag | Weight | Trigger condition |
|------|--------|-------------------|
| Company has verified LinkedIn page | -10 | `search_company` finds LinkedIn company profile |
| Official .com/.org domain with history | -10 | Domain is established (1+ years) |
| Company appears on Glassdoor with reviews | -5 | `search_company` finds Glassdoor profile |
| Salary within market range | -10 | `jobs_compare` shows salary is reasonable |
| Physical office verified on Maps | -15 | `local_presence` finds verified listing |
| Standard hiring process described | -5 | Post mentions interviews, assessments |

**Verdict thresholds:**

| Risk Score | Verdict | What to tell the user |
|-----------|---------|----------------------|
| 0–39 | **SAFE** | "This appears to be a legitimate opportunity. Standard due diligence still recommended." |
| 40–69 | **CAUTION** | "This listing has some concerning signals. Proceed carefully and verify independently." |
| 70–100 | **HIGH-RISK** | "This listing has multiple red flags consistent with recruitment fraud. Do not share personal information." |

### 5) Present findings to the user

**Always use this structure:**

```
## Verdict: [SAFE / CAUTION / HIGH-RISK]
**Risk Score:** [X]/100

### Key Findings
- [Most important finding with evidence URL]
- [Second finding with evidence URL]
- ...

### Red Flags Found
1. [Flag description] — [evidence source and URL]
2. ...

### Green Flags Found
1. [Positive signal] — [evidence source and URL]
2. ...

### Salary Comparison
- Offered: [salary from post]
- Market median: [from jobs_compare results]
- Assessment: [Within range / Significantly above / Suspiciously high]

### Recommended Next Steps
1. [Actionable step based on verdict]
2. [Second step]
3. ...
```

**Presentation rules:**
- Never state a verdict without evidence. Every claim must link to a source URL.
- If a tool returned no results, state "No data found" — do not guess or speculate.
- For HIGH-RISK verdicts, always include: "Do not send money, personal identification, or bank details."
- For CAUTION verdicts, suggest specific verification steps the user can take manually.
- For SAFE verdicts, still recommend standard due diligence (research the company, verify the interviewer on LinkedIn).

## Error Handling

| Situation | Action |
|-----------|--------|
| MCP tool returns an error | Report which tool failed, present results from tools that succeeded, note the gap in coverage |
| REST API returns 429 (rate limit) | Tell the user: "Rate limit reached. Try again in 1 minute." |
| REST API returns 401 (auth error) | Verify the `x-api-key` header is present and correct |
| No company name in the input | Skip `search_company`, `news_check`, and `local_presence`. Run `jobs_compare` for salary verification. Flag "Company name not provided" as a red flag. |
| Input is in a non-English language | Extract claims as-is, translate the key fields (company, role, salary) for the tools, note the original language |
| Multiple job posts in one message | Process each separately and present individual verdicts |

## Example Investigations

### Example 1: High-Risk Scam

**Input:** "Remote frontend intern. PHP 80,000/week. No interview needed. Message us on Telegram @quickhire."

**Claims extracted:**
- Company: Unknown / Not stated
- Role: Frontend Intern
- Salary: PHP 80,000/week
- Location: Philippines (inferred from PHP currency)
- Contact: Telegram @quickhire
- Application: No interview

**Tool results:**
1. `search_company` — skipped (no company name)
2. `news_check` — skipped (no company name)
3. `jobs_compare("Frontend Intern", "Philippines", "Entry Level")` — Market range: PHP 15,000–25,000/month
4. `local_presence` — skipped (no company name)

**Scoring:**
- No company name stated: +25
- Salary is 12–20x above market rate: +20
- Telegram-only contact: +15
- No interview: +15
- Vague role description: +10
- Total: 85/100 → **HIGH-RISK**

---

### Example 2: Legitimate Opportunity

**Input:** "Accenture Philippines is hiring a Junior Software Engineer. Competitive salary. Apply via accenture.com/careers. Office in BGC, Taguig."

**Claims extracted:**
- Company: Accenture Philippines
- Role: Junior Software Engineer
- Salary: Not disclosed ("Competitive")
- Location: BGC, Taguig, Philippines
- Contact: Official website
- Application: accenture.com/careers

**Tool results:**
1. `search_company("Accenture Philippines", "Junior Software Engineer")` — Official website, LinkedIn (500k+ followers), Wikipedia, Glassdoor (4.0 rating)
2. `news_check("Accenture Philippines")` — No scam reports. Recent press about expansion in PH.
3. `jobs_compare("Junior Software Engineer", "Philippines")` — Market range: PHP 25,000–45,000/month (salary not disclosed, so no comparison possible)
4. `local_presence("Accenture Philippines", "BGC Taguig")` — Verified office at Net One Center, BGC. Google Maps rating 4.1 with 200+ reviews.

**Scoring:**
- Verified LinkedIn: -10
- Official domain with history: -10
- Glassdoor profile: -5
- Physical office verified: -15
- Standard hiring process: -5
- Total: max(0, -45) = 0/100 → **SAFE**

---

### Example 3: Caution — Ambiguous

**Input:** "DataPro Analytics is hiring remote data entry clerks. $25/hour. No experience needed. Send your resume to hr@datapro-analytics.com"

**Claims extracted:**
- Company: DataPro Analytics
- Role: Data Entry Clerk
- Salary: $25/hour
- Location: Remote (US inferred from USD)
- Contact: hr@datapro-analytics.com
- Application: Email resume

**Tool results:**
1. `search_company("DataPro Analytics")` — Found a basic website (datapro-analytics.com), no LinkedIn, no Glassdoor. Domain registered 4 months ago.
2. `news_check("DataPro Analytics")` — No results (neither positive nor negative)
3. `jobs_compare("Data Entry Clerk", "United States", "Entry Level")` — Market range: $15–20/hour. Offered salary is slightly above average.
4. `local_presence("DataPro Analytics")` — No verified business listing found.

**Scoring:**
- Minimal web presence (no LinkedIn, no Glassdoor): +15
- New domain (< 6 months): +10
- Salary slightly above market: +5
- No physical footprint: +15
- "No experience needed": +10
- Has a corporate email domain (not Gmail): -5
- Has a website: -5
- Total: 45/100 → **CAUTION**
