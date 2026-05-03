# HireProof Evidence Screenshot Checklist

Last checked: 2026-05-04

Use this checklist when collecting proof for the hackathon submission, marketplace review, or public updates. Capture the stable production URL when possible: `https://hireproof-sigma.vercel.app`.

## Core Product Proof

| Screenshot | Route or source | Must show | Status |
| --- | --- | --- | --- |
| Landing hero | `/` | HireProof brand, primary CTA, and production URL | Needed for submission cover |
| Builder integrations band | `/` | `Put HireProof in front of apply agents` and source-pack download CTA | Needed for builder story |
| Audit intake | `/audit` | job input form, live/demo control, automation CTA | Needed for product flow |
| High-Risk result | `/audit?demo=high-risk` or completed audit report | verdict, risk score, red flags, evidence, and export actions | Needed for main demo proof |
| Docs automations | `/docs/automations` | `Native Integration Packs`, n8n, Make, LangChain, and marketplace boundary note | Needed for integration proof |
| Proof page | `/proof` | production proof and honest gated-surface boundaries | Needed for judge-safe claims |

## Download And Package Proof

| Screenshot | Route or file | Must show | Status |
| --- | --- | --- | --- |
| Native integrations ZIP | `/downloads/hireproof-native-integrations.zip` | successful download or browser/network `200` | Repo-shipped, not marketplace-approved |
| Chrome extension ZIP | `/downloads/hireproof-extension.zip` | successful download or browser/network `200` | Store-ready fallback while Chrome review is pending |
| Extension listing assets | `docs/assets-index.md` and `docs/chrome-web-store-assets/` | current screenshots, promo tile, and marquee image | Needed for Chrome submission |
| Integration source folders | repo file tree | `integrations/n8n-nodes-hireproof`, `integrations/make-hireproof`, `packages/hireproof-langchain` | Needed for source proof |

## API And Runtime Proof

| Proof item | Command or route | Pass condition | Status |
| --- | --- | --- | --- |
| Health endpoint | `GET /api/health` | `status: ok` | Production smoke |
| Integration proof endpoint | `GET /api/integrations/proof` | core readiness visible, optional gates separated | Production smoke |
| Demo audit API | `POST /api/v1/audit` with demo key | `verdict: high-risk`, score >= 80 | Production smoke |
| ZIP download | `GET /downloads/hireproof-native-integrations.zip` | HTTP `200`, `application/zip` | Production smoke |
| Mobile overflow | `/`, `/audit`, `/docs/automations` at 375px | no horizontal overflow | Browser proof |

## Chat And Workflow Proof

| Screenshot/log | Source | Must show | Honest status |
| --- | --- | --- | --- |
| Slack message proof | Slack client screenshot | real `@HireProof` reply with verdict | Screenshot-proven; fresh endpoint log is not currently claimed |
| Telegram message proof | Telegram client and Vercel log | real bot reply plus matching webhook log | Live delivery proven; recapture report-link screenshot if needed |
| Discord proof | Discord client and Vercel log | real event and bot response | Still pending live event capture |
| WhatsApp/Zernio proof | Zernio/WhatsApp client and Vercel log | real event and bot response | Credential-gated |
| WDK accepted run | Vercel log or API response | accepted run ID | Accepted-run proof only, not completed workflow transcript |

## File Naming

Use stable names so evidence is easy to review:

```text
docs/demo/evidence-YYYY-MM-DD-01-landing.png
docs/demo/evidence-YYYY-MM-DD-02-audit-result.png
docs/demo/evidence-YYYY-MM-DD-03-automations.png
docs/demo/evidence-YYYY-MM-DD-04-downloads.png
```

Do not rename existing proof screenshots unless updating the docs that link to them.
