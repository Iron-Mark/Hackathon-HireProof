# HireProof Post-Hackathon Proof Assets

Last updated: 2026-05-10, Asia/Manila

## Local Proof Folder

Fresh proof artifacts are stored at:

`artifacts/post-hackathon-e2e/`

## Screenshots

| File | Purpose |
| --- | --- |
| `desktop-home.png` | Desktop homepage with pilot and case-study CTAs. |
| `desktop-audit-demo-high-risk.png` | Desktop High-Risk demo report. |
| `desktop-portfolio.png` | Desktop portfolio case-study page. |
| `desktop-pilot.png` | Desktop pilot-intake page. |
| `desktop-docs-pilot.png` | Desktop 90-day pilot docs page. |
| `mobile-home.png` | Mobile homepage verification. |
| `mobile-audit-demo-high-risk.png` | Mobile High-Risk demo report. |
| `mobile-portfolio.png` | Mobile portfolio case-study page. |
| `mobile-pilot.png` | Mobile pilot-intake page. |
| `mobile-docs-pilot.png` | Mobile 90-day pilot docs page. |
| `playwright-results.json` | Desktop/mobile URL, text, and horizontal-overflow check results. |

## Packaged Zip

The proof set can be shared from:

The packaged proof set should be published as a release artifact or to object
storage instead of being committed to Git.

## Use Order

1. Lead with `desktop-portfolio.png` or `desktop-home.png`.
2. Use `desktop-audit-demo-high-risk.png` to show the product value quickly.
3. Use `mobile-home.png` or `mobile-portfolio.png` to prove responsive polish.
4. Keep `playwright-results.json` as technical verification evidence.

## Follow-Up Tracking Surfaces

- Pilot request intake: `https://hireproof.tech/pilot`
- Authenticated pilot lead export: `https://hireproof.tech/pilot/admin`
- Stored request API: `POST /api/pilot/requests`
- CSV export API: `GET /api/pilot/requests/export`
- Product event API: `POST /api/analytics/events`
