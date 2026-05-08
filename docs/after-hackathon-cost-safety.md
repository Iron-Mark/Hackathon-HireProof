# After-Hackathon Cost Safety

Last updated: 2026-05-05, Asia/Manila

Use this runbook when keeping HireProof production live after the hackathon. The goal is to keep the portfolio/demo site online without letting public traffic spend unlimited provider budget.

## Recommended Production Mode

Set these environment variables in Vercel after judging if you want the safest public posture:

```env
PUBLIC_LIVE_AUDIT_ENABLED=false
PUBLIC_GOOGLE_VISION_OCR_ENABLED=false
PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED=false
REQUIRE_BYOK_FOR_LIVE_API=true
HIREPROOF_COST_GUARD_MODEL_DAILY_LIMIT=50
HIREPROOF_COST_GUARD_SERPAPI_DAILY_LIMIT=100
HIREPROOF_COST_GUARD_GOOGLE_VISION_DAILY_LIMIT=50
HIREPROOF_COST_GUARD_SAFE_BROWSING_DAILY_LIMIT=500
```

This keeps the site, docs, README links, demo fixtures, deterministic audit logic, packages, and proof assets available while limiting platform-paid live provider usage.

## Provider Cost Surfaces

- Model calls use `AI_GATEWAY_API_KEY`, `VERCEL_AI_GATEWAY_API_KEY`, or `MODEL_PROVIDER_KEY`.
- SerpApi calls use `SERPAPI_API_KEY` for Google Search, News, Jobs, and Maps evidence.
- Google Vision OCR uses `GOOGLE_CLOUD_VISION_API_KEY`; remove the legacy `GOOGLE_VISION_API_KEY` alias in production to avoid duplicate key confusion.
- Google Safe Browsing uses `GOOGLE_SAFE_BROWSING_API_KEY`.
- DNS over HTTPS can use Google DNS without an API key and is not a direct billable key path in this app.

## Account-Side Controls

- Google Cloud: set billing budgets and alerts for the project.
- Google Cloud: set request quota caps on Cloud Vision.
- Google Cloud: restrict API keys by API, so the Vision key cannot call unrelated Google APIs.
- SerpApi: set monthly quota or plan limits in the SerpApi dashboard.
- Vercel: enable Spend Management and set a low production pause threshold.
- Upstash: keep `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` configured so rate limits and daily provider counters work across serverless instances.

## App-Side Controls

- Public `/api/audit` respects `PUBLIC_LIVE_AUDIT_ENABLED=false` and falls back to deterministic extraction instead of platform-paid model/search work.
- Screenshot OCR respects `PUBLIC_GOOGLE_VISION_OCR_ENABLED=false` and falls back to Tesseract.
- Public trends respects `PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED=false` and avoids SerpApi trend refreshes.
- API live audits can require owner BYOK credentials with `REQUIRE_BYOK_FOR_LIVE_API=true`.
- Daily platform provider counters throttle model, SerpApi, Google Vision, and Google Safe Browsing calls.

## Emergency Shutoff

If cost spikes appear:

1. Remove or disable `SERPAPI_API_KEY`.
2. Set `PUBLIC_LIVE_AUDIT_ENABLED=false`.
3. Set `PUBLIC_GOOGLE_VISION_OCR_ENABLED=false`.
4. Set `PUBLIC_TRENDS_EXTERNAL_SIGNALS_ENABLED=false`.
5. Set `REQUIRE_BYOK_FOR_LIVE_API=true`.
6. Lower all `HIREPROOF_COST_GUARD_*_DAILY_LIMIT` values to `0`.
7. Redeploy or restart the Vercel deployment if env propagation is delayed.

## Notes

- Budget alerts are not hard caps. Use provider quotas and app guards for hard limits.
- People cloning the repo do not spend your provider budget unless they use your hosted app or your keys.
- BYOK users should pay their own provider costs through their saved model/search credentials.
