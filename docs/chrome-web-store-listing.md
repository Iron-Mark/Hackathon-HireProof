# Chrome Web Store Listing Draft

Use this copy when submitting `dist/chrome/hireproof-extension.zip` to the Chrome Web Store.

## Listing

**Name:** HireProof - Job Post Checker

**Short description:** Check suspicious job posts and recruiter messages with HireProof's evidence-backed AI agent.

**Category:** Productivity

**Language:** English

**Website:** https://hireproof-sigma.vercel.app

**Support URL:** https://github.com/Iron-Mark/hackathon-v0-zero_to_agent/issues

## Long Description

HireProof helps job seekers inspect suspicious job posts before they apply. Highlight text, scan a supported job listing page, or paste a recruiter message into the popup. HireProof sends the text to your configured HireProof server and returns a verdict, risk score, summary, and the highest-signal red or green flags.

The extension is built for explicit user-triggered checks. It does not scan every page automatically, sell user data, or collect browsing history in the background. The default server is the hosted HireProof demo, and self-hosted users can point the extension at their own deployment.

## Privacy Practices

- Single purpose: job post and recruiter-message safety checks.
- Data use: selected or extracted page text is sent only when the user starts a scan.
- Storage: server URL and API key are stored locally by the extension.
- No ads: no ad tracking, sale of data, or unrelated analytics.

## Reviewer Notes

1. Open the extension popup.
2. Keep the default API server URL or set a self-hosted HireProof URL.
3. Use `hireproof_agent_demo_key` for demo-mode API checks.
4. Click "Paste & Check" and submit this sample:

```text
Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.
```

Expected result: High Risk verdict with a visible risk score and red flags.

## Screenshot Checklist

- `docs/chrome-web-store-assets/screenshot-01-popup-idle-1280x800.png`
- `docs/chrome-web-store-assets/screenshot-02-popup-result-1280x800.png`
- `docs/chrome-web-store-assets/screenshot-03-supported-job-page-1280x800.png`
- `docs/chrome-web-store-assets/screenshot-04-context-menu-1280x800.png`

Chrome's image guidance allows 1280x800 screenshots or 640x400 when the larger size is not suitable. The repository assets use 1280x800 for sharp listing previews.

## Promotional Image

- `docs/chrome-web-store-assets/promo-small-440x280.png`

## Publication Boundary

This repository creates the ZIP and listing materials. A public listing requires a Chrome Web Store developer account, privacy form completion, screenshot upload, and Google review approval.
