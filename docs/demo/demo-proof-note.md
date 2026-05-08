# HireProof Demo Proof Note

Checked: 2026-05-09 05:13 +08:00

## Live Links

- Live app: https://hireproof.tech
- Demo flow: https://hireproof.tech/audit
- Docs: https://hireproof.tech/docs
- Health check: https://hireproof.tech/api/health

## Verified Smoke

- App home returned `200`.
- Health endpoint returned `200`.
- Audit page returned `200`.
- Docs returned `200`.
- Old app URL redirects:
  - `https://hireproof-sigma.vercel.app` -> `https://hireproof.tech/`
  - `https://hireproof-sigma.vercel.app/audit` -> `https://hireproof.tech/audit`
  - `https://www.hireproof.tech` -> `https://hireproof.tech/`
- Quick public link scan checked 59 internal links and found no dead links.
- GitHub Dependabot API reported `0` open alerts.

## Demo Audit Result

Sample:

```text
Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.
```

Verified API result:

- Verdict: `high-risk`
- Risk score: `92`
- Confidence: `Very High`
- Evidence items: `3`
- Red flags: `7`
- Report ID from latest check: `report_1778274729194`

## Short Speaking Flow

1. Open https://hireproof.tech/audit.
2. Say: "HireProof checks suspicious job posts before someone applies. It focuses on visible evidence, not a black-box yes or no."
3. Paste the sample job message.
4. Say: "This looks attractive because the pay is high and the role is remote, but the hiring path is suspicious."
5. Run the audit.
6. Point out the verdict, score, red flags, and evidence section.
7. Say: "The useful part is the explanation: it flags unrealistic salary, no interview, Telegram-only contact, and weak company verification."
8. Open the docs link if needed: https://hireproof.tech/docs.
9. Close with: "Old demo links still redirect, the owned domain is canonical, and the repo has no open Dependabot alerts."

## Caveat

The demo sample uses deterministic fixture evidence so the presentation stays stable. Live evidence behavior depends on configured provider credentials.
