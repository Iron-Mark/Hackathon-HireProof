# Design — Allow AI Retrieval Crawlers + `/llms.txt` (Spec 2, Slice 3)

- **Date:** 2026-07-11
- **Status:** Approved design, ready for implementation
- **Branch:** `feat/allow-ai-retrieval-crawlers`
- **Scope:** Slice 3 of Spec 2 (SEO / discoverability). Slices 1-2 merged.

## 1. Problem

`robots.ts` and `proxy.ts` block **every** AI user-agent from public pages, lumping training/scraping
crawlers together with live-retrieval/citation crawlers. In 2026 a large share of "is this job/company a
scam?" questions are answered inside ChatGPT Search, Perplexity, and Claude, which fetch and **cite** live
pages with links back. Blocking the retrieval agents closes off the fastest-growing discovery channel for
exactly this use case. The block is enforced by `proxy.ts` (a hard 403), so this is a real behavior change,
not a robots.txt tweak.

## 2. Decision (owner-approved)

Split the crawler list. **This deliberately reverses a previously intentional, test-pinned block** for the
retrieval agents only.

**Allow on public pages** (retrieval/citation — drive cited referral traffic):
`OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-User`, `Claude-SearchBot`.
(Claude's retrieval bots are not currently blocked by name — made explicit here.)

**Keep blocked** (training/scraping):
`GPTBot`, `ClaudeBot`, `anthropic-ai`, `CCBot`, `Bytespider`, `Google-Extended`, `Applebot-Extended`,
`Meta-ExternalAgent`, `FacebookBot`, `Amazonbot`, `YouBot`, `Diffbot`, `cohere-ai`, `omgili`.

Retrieval crawlers remain excluded from sensitive paths (`/api/`, `/admin/`, `/audit/report_`,
`/audit/chat_`, `/history/`, `/settings`, `/pilot/admin`) — same as `*`.

## 3. Changes

### 3.1 `app/robots.ts`
Refactor to named lists. Rules: `{ '*', allow '/', disallow PUBLIC_DISALLOW }`,
`{ AI_RETRIEVAL_CRAWLERS, allow '/', disallow PUBLIC_DISALLOW }`, and
`AI_TRAINING_CRAWLERS.map(ua => ({ userAgent: ua, disallow: '/' }))`. Sitemap/host unchanged.

### 3.2 `proxy.ts`
Remove `/oai-searchbot/i`, `/chatgpt-user/i`, `/perplexitybot/i`, `/perplexity-user/i` from
`BLOCKED_AI_CRAWLER_UA_PATTERNS`. The remaining patterns do **not** match Claude-User/Claude-SearchBot
(`/claudebot/i` requires the literal "claudebot"), so those are already allowed. Add a comment documenting
that retrieval/citation crawlers are intentionally permitted while training/scraping crawlers are blocked.

### 3.3 `app/llms.txt/route.ts` (new)
A static route handler serving `text/plain` guidance (llmstxt.org style): one-line description + key public
links (`/audit`, `/scams`, `/explore`, `/trends`, `/docs`) + honest-scope note. Public info only.
`export const dynamic = 'force-static'`.

### 3.4 Test — `test/runtime-wiring.test.mjs` (the pinning test, ~1211)
- Remove `PerplexityBot` from the must-be-blocked loop (keep `GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`,
  `Google-Extended`, `Applebot-Extended`, `Meta-ExternalAgent`).
- Add: each retrieval crawler appears in `robots.ts` and is **absent** from `proxy.ts`'s block patterns
  (`assert.doesNotMatch(proxy, /oai-searchbot/i)` etc.).
- Keep the remaining structural assertions (disallow `'/'`, sitemap, host, canonical redirect, `noai`,
  `isApiOrIntegrationRoute`, Access Denied).

## 4. Verification (e2e)

Start `next dev` (proxy.ts runs as middleware) and curl public pages with each User-Agent:
- **200 (allowed):** `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `Claude-User`,
  `Claude-SearchBot`.
- **403 (still blocked):** `GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`, `Google-Extended`, `anthropic-ai`.
- `GET /llms.txt` → 200 containing "HireProof" and the key links.
Plus `npm run lint`, `npm run build`, `npm run test:security`.

## 5. Risks & mitigations
- **Aggressive crawling by allowed bots (esp. PerplexityBot):** accepted by the owner; retrieval bots cite
  with links back. Sensitive paths stay disallowed; rate-limit + scanner block unaffected.
- **Regressing the deliberate block:** the split is explicit and named; training/scraping bots stay blocked
  and asserted; only the 6 retrieval agents change.
- **llms.txt reachable only by allowed bots:** blocked training bots still 403 on `/llms.txt` (consistent
  with the block). Acceptable — llms.txt targets the allowed retrieval/agent audience and humans.

## 6. Out of scope
Any change to API/agent-route reachability, the scanner block, or sitemap contents.
