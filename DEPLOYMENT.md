# HireProof - Deployment Summary

Last local verification: April 30, 2026

## Deployment Status

The app has been deployed to production on Vercel. The current local working tree was also verified on April 30, 2026 with tests, TypeScript, and a production build.

### Production URLs

- **Canonical Demo URL**: https://hireproof.tech
- **Project**: iron-marks-projects/hireproof
- **Vercel Project ID**: prj_8pHu5GQQ0EzG49bgCcMm1QdNK9JB

### Latest Local Verification

```
✓ Tests: 18/18 passed
✓ Type Check: Passed
✓ Build: Succeeded
✓ Static routes: 69 generated
  ├ / (Landing page)
  ├ /audit (Audit workspace)
  ├ /audit/[id] (Shareable permalink)
  ├ /history (History page)
  ├ /docs (Documentation portal - 15+ pages)
  ├ /explore (Community showcase)
  ├ /pricing (Plans & pricing)
  ├ /settings (User settings)
  ├ /trends (Investigation trends)
  ├ /api/audit (SSE streaming endpoint - dynamic)
  ├ /api/v1/audit (Headless agent API - dynamic)
  ├ /api/mcp (MCP tools endpoint - dynamic)
  ├ /api/chat/hireproof (ChatSDK status/reply endpoint - dynamic)
  ├ /api/webhooks/slack (Slack webhook endpoint - dynamic)
  ├ /api/workflows/audit (WDK workflow start endpoint - dynamic)
  ├ /api/verified-badge/status (Badge status endpoint - dynamic)
  └ /api/verified-badge/script (Badge embed script - dynamic)
```

### Enterprise Upgrades Applied
- **Global Rate Limiting:** Powered by Upstash Redis when configured.
- **Hybrid Database:** Audit reports are saved to Upstash Redis with TTL when configured, with local JSON fallback for local development.
- **Local Maintenance:** `npm run cleanup:local-data` prunes local JSON reports and usage records.

### What's Live

#### Pages
- **Landing** (`/`) - Product intro with value proposition
- **Audit** (`/audit`) - Main app with form and three demo buttons
- **History** (`/history`) - Investigation records from localStorage
- **API** (`/api/audit`) - Backend endpoint for investigations
- **MCP API** (`/api/mcp`) - Tool definitions for Model Context Protocol

#### Features
✅ Full responsive design (mobile-first)
✅ Tailwind CSS 4.2 with custom semantic colors
✅ Demo mode working (no API keys required)
✅ localStorage persistence for history
✅ TypeScript type safety across all routes
✅ SEO optimized with metadata tags
✅ All icons and styling loading correctly
✅ Trends JSON export
✅ Chrome extension local install and store-ready package path
✅ Credential-gated ChatSDK and WDK endpoints
✅ Docker standalone image, Compose service, healthcheck, and smoke script

### Environment Variables (Optional)

To enable live features, add to Vercel project settings:

```env
SERPAPI_API_KEY=your_serpapi_key
AI_GATEWAY_API_KEY=your_ai_gateway_key
HIREPROOF_MODEL=openai/gpt-4o-mini
MODEL_PROVIDER_KEY=your_openai_compatible_fallback_key
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_SIGNING_SECRET=your_slack_signing_secret
REDIS_URL=your_chat_state_redis_url
WORKFLOW_SECRET=your_workflow_secret
```

### Build Configuration

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

**Next.js**: Version 16.2.4 with Turbopack
**Node.js**: 20.x (default on Vercel)

### How to Access

1. Click the production URL above
2. Try demo examples on `/audit` page
3. View history on `/history` page
4. Call `/api/mcp` for tool definitions

### Current State (Production)

1. **Live API Keys**: SerpApi and model provider keys are required for live investigations
2. **AI Integration**: Vercel AI SDK 6 with AI Gateway preferred and OpenAI-compatible fallback
3. **Live Mode**: Full agent pipeline is available when model and search credentials are configured; demo fallback remains available without keys
4. **Hybrid Storage**: Upstash Redis for global persistence, local fs fallback
5. **Documentation**: Live docs portal at `/docs`
6. **Chrome Extension**: Manifest V3 in `/extension`, local install and store-ready ZIP via `npm run package:extension`
7. **ChatSDK / WDK**: Implemented and credential-gated until real platform credentials are configured

### Packaging & Distribution

#### Docker Self-Hosting

```bash
npm run docker:build
npm run docker:run
npm run docker:smoke
```

The image uses Next.js standalone output, runs on port `3002`, includes a non-root runtime user, and reports container health through `/api/health`.

#### Chrome Web Store Package

```bash
npm run package:extension
```

The generated ZIP is written to `dist/chrome/hireproof-extension.zip`. Store listing copy, privacy disclosure, reviewer notes, and screenshot requirements are documented in `docs/chrome-web-store-listing.md`. Public listing publication still requires the Chrome Web Store developer account workflow and Google review.

### Git Status

- **Branch**: repository-prompt-analysis
- **Recent Commits**: All phase-by-phase builds + TypeScript fix
- **Last Commit**: fix: typescript type error in audit route

---

**Deployed by v0 • April 25, 2026**
