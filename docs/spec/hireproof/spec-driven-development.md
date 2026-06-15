# HireProof Spec-Driven Development Plan

> Source-backed implementation plan generated from all approved project reference files in `ref/original/` and PDF extracts in `ref/extracted/`.

## Goal
Make the scam-detection product crawlable, fast, canonical, installable, and progressively enhanced without losing the interactive audit/demo value.

## Source Inputs
| Source | Type | Title | Words/Pages | SHA-256 |
| --- | --- | --- | --- | --- |
| PDFs/Web Audits and SEO/HireProof.tech - Performance and SEO Review.pdf | seo-performance-audit | HireProof.tech performance & SEO review Overview | 1453 words, 4 pages | 5ec17a766fb0 |
| PDFs/Web Audits and SEO/HireProof.tech - SEO Performance and Roadmap Audit.pdf | roadmap | HireProof.tech Audit - SEO, Performance & Roadmap | 1529 words, 4 pages | 881a5a1f7df1 |

## Non-Negotiable Rules
- Do not start implementation from this spec without checking `source-coverage.md` and `conflicts-and-gaps.md`.
- Every implemented recommendation must have evidence: command output, browser check, live URL check, screenshot, test, log, or repo diff.
- Do not treat source recommendations as complete until they are mapped to acceptance criteria in the target repo.
- Preserve the current source archive; source docs are references, not files to mutate during product implementation.

## Workstreams
### 1. Product and UX
- Use `product-context.md` to lock the user, problem, positioning, and workflow.
- Implement only the highest-value loop first: Make the scam-detection product crawlable, fast, canonical, installable, and progressively enhanced without losing the interactive audit/demo value.
- Avoid broad additions that conflict with the source risks.

### 2. Execution Roadmap
- Follow `execution-roadmap.md` phase order.
- Each phase must produce verifiable evidence before the next phase expands scope.
- Blocked external proof must be recorded as blocked, not skipped.

### 3. SEO and Performance
- Use `seo-performance.md` as a required workstream before claiming public readiness.

### 4. Documentation and Evidence
- Keep an implementation log in the target repo or project workspace when execution begins.
- Update public docs/runbooks only when behavior, commands, env requirements, public workflow, or deployment flow changes.

## Acceptance Criteria
- All relevant source suggestions in `all-suggestions.md` have one of these statuses in the implementation tracker: implemented, intentionally deferred, blocked, not applicable.
- Product direction and scope conflicts in `conflicts-and-gaps.md` are resolved before code execution.
- Any SEO/performance claims are backed by current measurement, not source assumptions.
- Any external proof requirement has concrete evidence or a clearly named blocker.

## Suggested First Pass
1. Enforce canonical host behavior with permanent redirects and matching metadata.
2. Audit heavy client components such as navigation, scanning demos, labs, and animated sections; move static content back to server-rendered output.
3. Preserve structured data and PWA metadata while testing Open Graph, Twitter, manifest, and crawl behavior.
4. Optimize LCP images/assets and reduce long tasks that hurt INP.
5. Create measurement gates for Core Web Vitals and SEO crawl health before more interactive features are added.
