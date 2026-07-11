# Allow AI Retrieval Crawlers + `/llms.txt` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Allow retrieval/citation AI crawlers (OpenAI, Perplexity, Claude) on public pages while keeping training/scraping crawlers blocked; add `/llms.txt`; verify end-to-end.

**Architecture:** Split the AI-crawler list in `robots.ts` (advisory) and `proxy.ts` (403 enforcement) into retrieval-allowed vs training-blocked, update the pinning test, add a static `/llms.txt`.

## Global Constraints
- **No AI attribution** in commits/PRs.
- Retrieval crawlers stay disallowed on sensitive paths (`/api/`, `/history/`, `/settings`, `/audit/report_`, `/pilot/admin`).
- Training/scraping crawlers stay fully blocked in both files.
- No change to API/agent-route reachability or the scanner block.

---

### Task 1: Split the crawler lists (robots + proxy)
- Modify: `app/robots.ts`, `proxy.ts`
- [ ] Refactor `app/robots.ts` to `AI_RETRIEVAL_CRAWLERS` (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-User, Claude-SearchBot) allowed with `PUBLIC_DISALLOW`, and `AI_TRAINING_CRAWLERS` (GPTBot, ClaudeBot, anthropic-ai, CCBot, Bytespider, Google-Extended, Applebot-Extended, Meta-ExternalAgent, FacebookBot, Amazonbot, YouBot, Diffbot, cohere-ai, omgili) `disallow: '/'`.
- [ ] In `proxy.ts`, remove `/oai-searchbot/i`, `/chatgpt-user/i`, `/perplexitybot/i`, `/perplexity-user/i` from `BLOCKED_AI_CRAWLER_UA_PATTERNS`; add a comment on the retrieval-vs-training split.
- [ ] `npm run lint`.

### Task 2: `/llms.txt`
- Create: `app/llms.txt/route.ts` — `force-static` route handler returning `text/plain` guidance with key public links.
- [ ] `npm run build` (confirm `/llms.txt` builds).

### Task 3: Update the pinning test
- Modify: `test/runtime-wiring.test.mjs` (~1211)
- [ ] Remove `PerplexityBot` from the blocked loop; add assertions that retrieval crawlers are present in robots and **absent** from proxy block patterns; keep the structural assertions.
- [ ] `npm run test:security`.

### Task 4: e2e verification + commit
- [ ] Start `next dev`; curl public pages with each UA: retrieval bots → 200, training bots → 403; `GET /llms.txt` → 200 with "HireProof".
- [ ] Commit; push; PR into `dev`.

## Self-Review
- Spec §3.1 → Task 1 (robots); §3.2 → Task 1 (proxy); §3.3 → Task 2; §3.4 → Task 3; §4 → Task 4. Covered.
- Naming consistent: `AI_RETRIEVAL_CRAWLERS`, `AI_TRAINING_CRAWLERS`, `PUBLIC_DISALLOW`.
