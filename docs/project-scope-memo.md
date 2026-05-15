# HireProof Project Scope Memo

Last updated: 2026-05-05, Asia/Manila

## Current Submission State

HireProof has already been submitted for the hackathon, with roughly 40 minutes left before the deadline at the time this memo was written.

Do not make additional repo, release, or tag changes unless there is an obvious broken issue such as a dead link, failed live page, missing release asset, or incorrect submission-critical metadata.

## Canonical Links

- Live app: https://hireproof.tech
- GitHub repo: https://github.com/Iron-Mark/hackathon-v0-zero_to_agent
- v1.0 release: https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/releases/tag/v1.0
- GitHub Packages tab: https://github.com/Iron-Mark?tab=packages&repo_name=hackathon-v0-zero_to_agent
- Final proof doc: `docs/final-release-proof.md`

## Verified Release State

- `main` is pushed.
- `v1.0` was force-updated to the latest `main` commit after the final proof artifacts were committed.
- The v1.0 release page is public, not draft, not prerelease.
- The release has 11 assets.
- README is marketing-focused and opens with the refreshed GitHub social preview image.
- Final proof artifacts are committed under `artifacts/final-release-proof/`.

## Verified Evidence

Fresh verification before the final proof commit included:

- `npm run lint`
- `node --test test/runtime-wiring.test.mjs`
- `npm run build`
- Live HTTP checks for `/`, `/audit`, `/docs`, `/api/health`, `/api/integrations/proof`, and the v1.0 release page
- Playwright responsive checks across small mobile, mobile, tablet, landscape tablet, desktop, and wide desktop viewports
- Interaction checks for docs mobile menu and audit primary action

## Package Status

GitHub Packages workflow completed successfully:

- https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/actions/runs/25360061938

Published package aliases:

- `@iron-mark/hireproof-sdk`
- `@iron-mark/hireproof-cli`
- `@iron-mark/hireproof-langchain`
- `@iron-mark/n8n-nodes-hireproof`

Direct package listing through the current CLI token was blocked by GitHub API scope:

- API result: HTTP 403
- Required scope: `read:packages`

The user visually checked the Packages page and said it looked good.

## Product Positioning Boundary

Keep HireProof positioned as an employment-fraud and job-scam verification agent.

Do not broaden the story into a generic fraud, cyber, or security platform unless the user explicitly asks after the hackathon submission window.

## Deadline Guidance

Because the submission is already done and the deadline is close, the safest next action is link verification and promotion only.

Avoid:

- New feature work
- Release rewrites
- Force-pushes
- Tag rewrites
- Broad README changes
- Non-critical UI polish

Only change the repo if a submitted link or release-critical asset is actually broken.

## Post-Result Portfolio And Startup Work

The hackathon result is now known. HireProof was not selected, but that outcome does not reduce the build quality: the app shipped live with proof surfaces, API packaging, docs, and cost controls. Because the event included community voting, final placement reflected reach and voting dynamics as well as product merit. Use this as a strong portfolio and startup proof point, not as a negative result.

- Turn the local drafts into a polished portfolio page for Mark Siazon.
- Use outcome-independent wording: built and shipped for Cursor Hackathon, live as a focused job-post verification product, and ready for pilot validation.
- Use `docs/promo-post-drafts.md`, `docs/post-winners-checklist.md`, `docs/portfolio-product-design-case-study.md`, `docs/portfolio-ui-ux-case-study.md`, and `docs/portfolio-dev-case-study.md` as the source pack.
- Do not claim a win, marketplace approval, broad fraud-platform coverage, continuous learning, or completed workflow transcript without new proof.
