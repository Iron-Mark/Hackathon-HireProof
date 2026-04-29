# HireProof Build Summary

## Project Overview

**HireProof** is a proof-backed AI agent that audits suspicious job opportunities before someone applies.

**Tagline**: "Paste a job post. Know if it's legit before you apply."

**Track**: v0 + MCPs, with credential-gated ChatSDK Agents and Vercel Workflow / WDK support

**Latest local verification**: April 30, 2026

## Build Completion Status

All 10 phases of the v0-build-prompt-pack have been implemented:

### ✓ Phase 1: App Scaffold and Main Screens
- Created Next.js App Router project with TypeScript
- Landing page with hero, evidence types, how-it-works, and CTA
- `/audit` workspace page with form, demo buttons, and result layout
- `/history` page for viewing past investigations
- Navigation header across all pages
- Responsive design with Tailwind CSS

### ✓ Phase 2: Demo Fixtures and Structured Results
- Created three demo cases: High-Risk, Caution, Safe
- High-Risk example: PHP 80K/week intern role, Telegram contact
- Caution example: TechStart Solutions with incomplete details
- Safe example: Microsoft Senior Engineer with full info
- Wired sample buttons to load fixtures dynamically
- Result screen renders complete investigation data

### ✓ Phase 3: Types, Schemas, and Local History
- Created Zod schemas for all data types:
  - `AuditReport`, `ExtractedClaims`, `EvidenceItem`, `AlternativeJob`
  - `AuditRequest`, `Verdict`, `RiskSignal`
- Implemented `useAuditHistory` hook for localStorage persistence
- History page loads from localStorage with filters
- All components use central types (no duplication)

### ✓ Phase 4: Runtime MCP Server Shape
- Created `/api/mcp` endpoint with tool listing
- Defined 4 MCP tools:
  - `search_company`: Check web presence
  - `news_check`: Check reputation/scams
  - `jobs_compare`: Find comparable listings
  - `local_presence`: Verify local footprint
- Tools return normalized evidence objects
- Supports POST requests with `tools/list` and `tools/call` methods

### ✓ Phase 5: SerpApi Evidence Wrappers
- Created `/lib/serpapi.ts` with server-side wrappers
- Functions for searching: company, news, jobs, local
- Gracefully handles missing SERPAPI_API_KEY (returns null)
- Normalized responses into HireProof evidence format
- MCP tools integrate with SerpApi backend

### ✓ Phase 6: AI SDK Audit Endpoint
- Created `/api/audit` route handler
- Validates input with Zod AuditRequestSchema
- Streams investigation progress and returns structured AuditReport payloads
- Uses Vercel AI SDK with AI Gateway as the preferred provider and OpenAI-compatible fallback
- Includes demo fallback on missing credentials or controlled recovery paths

### ✓ Phase 7: Risk Scoring and Verdict Logic
- Created `/lib/risk-scorer.ts` with scoring engine
- `calculateRiskScore()`: Computes 0-100 score from flags
- `determineVerdict()`: Returns Safe/Caution/High-Risk
- `extractRedFlags()` and `extractGreenFlags()`: Auto-detect from claims/evidence
- `generateSummary()`: Creates verdict-appropriate copy

## Project Structure

```
hireproof/
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind styles
│   ├── audit/
│   │   └── page.tsx            # Audit workspace
│   ├── history/
│   │   └── page.tsx            # Investigation history
│   └── api/
│       ├── mcp/route.ts        # MCP tools endpoint
│       └── audit/route.ts      # Audit API
├── components/
│   ├── audit-form.tsx          # Form for job post input
│   └── result-screen.tsx       # Investigation results display
├── lib/
│   ├── fixtures.ts             # Demo data (3 cases)
│   ├── schemas.ts              # Zod schemas
│   ├── mcp-tools.ts            # MCP tool definitions
│   ├── serpapi.ts              # SerpApi wrappers
│   └── risk-scorer.ts          # Risk scoring logic
├── hooks/
│   └── useAuditHistory.ts      # localStorage hook
├── package.json
├── scripts/
│   └── cleanup-local-data.mjs  # Local JSON retention cleanup
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

## Key Features

### Demo Mode
- Works with no API keys
- Sample chips load pre-built investigations
- Results clearly marked as "Demo Data"

### Structured Results
- Verdict badge (Safe/Caution/High-Risk)
- Risk score (0-100)
- Extracted claims from job post
- Investigation timeline (5 steps)
- Red flags & green flags
- Supporting evidence with sources
- Safer alternative jobs
- Next steps guidance

### Local History
- Auto-saves each investigation to localStorage
- Filter by verdict type (All/Safe/Caution/High-Risk)
- Shows company, role, risk score, timestamp
- Gracefully handles unavailable storage

### MCP Integration
- 4 stable tools with consistent names
- Mock responses ready for real SerpApi data
- Server-side only (no secrets in client)
- Extensible tool architecture

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 6.0
- **Styling**: Tailwind CSS 4.2 + custom colors
- **Icons**: Lucide React
- **Validation**: Zod
- **Data**: localStorage (MVP)
- **API Integration**: SerpApi + Vercel AI SDK 6 with AI Gateway/OpenAI-compatible fallback
- **Deployment**: Vercel (pre-configured)

## Environment Variables

Create a `.env.local` file with:

```
# Optional - for live SerpApi integration (Phase 5+)
SERPAPI_API_KEY=your_key_here

# Preferred - Vercel AI Gateway
AI_GATEWAY_API_KEY=your_key_here
HIREPROOF_MODEL=openai/gpt-4o-mini

# Optional - fallback for live AI SDK integration
MODEL_PROVIDER_KEY=your_key_here

# Base URL for deployment
APP_BASE_URL=http://localhost:3002
```

## Development

```bash
# Install dependencies
npm install

# Run dev server (port 3002)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Completion Status

### ✓ Phase 8: Live Mode, Demo Mode & Recovery
- Implemented live/demo mode toggle with automatic fallback
- Fallback fixture loading on API errors
- Retry UI with clear error messages

### ✓ Phase 9: Export Card, Mobile & Accessibility
- PDF and PNG export with jsPDF + html2canvas
- Shareable permalinks via `/audit/[id]`
- Mobile-optimized responsive layout
- Keyboard navigation and ARIA labels

### ✓ Phase 10: Metadata, Deployment & Submission
- Full SEO metadata and OG tags
- Complete documentation portal at `/docs`
- Production deployment on Vercel Edge
- Local Chrome Extension (Manifest V3)

### ✓ April 30 Polish & Hardening
- Chrome extension docs now claim local install only.
- Legal abuse report mailto uses lowercase extracted claim keys.
- Trends page exports a clearly labeled JSON file.
- Local JSON cleanup is available with `npm run cleanup:local-data`.
- Verified badge routes and platform proof status endpoints are present in the build.

## Testing the App

1. **Landing page** (`/`)
   - Shows hero headline, evidence types, how-it-works, sample post

2. **Audit page** (`/audit`)
   - Click sample buttons: High-Risk, Caution, Safe
   - Watch investigation timeline (2-second simulation)
   - See verdict, score, evidence, flags

3. **History page** (`/history`)
   - After running an audit, data appears here
   - Filter by verdict type
   - Note: Data persists in localStorage

4. **API Health** (`/api/mcp`)
   - GET returns tool list
   - POST with `{"method":"tools/list"}` returns tool definitions

## Demo Cases

### High-Risk: Remote Frontend Intern (PHP 80K/week)
- Verdict: High-Risk (92/100)
- Red flags: Unrealistic salary, no interview, Telegram-only
- Outcome: Clearly fraudulent opportunity

### Caution: TechStart Solutions Software Engineer
- Verdict: Caution (55/100)
- Red flags: No salary, vague role description
- Green flags: Real company with LinkedIn presence
- Outcome: Needs investigation before applying

### Safe: Microsoft Senior Engineer
- Verdict: Safe (18/100)
- Green flags: Fortune 500 company, clear role, professional process
- No red flags
- Outcome: Legitimate opportunity, standard diligence

## File Sizes & Performance

- Landing page: Fast initial paint, optimized images
- Audit form: Lightweight form with client validation
- Result screen: Renders 5+ sections with proper scrolling
- Bundle size: Minimal (Next.js 16 optimizes automatically)

## Current Status

- [x] AI SDK integration — Vercel AI SDK 6 with AI Gateway/OpenAI-compatible fallback
- [x] SerpApi live calls — All 4 evidence tools operational
- [x] Live mode with automatic demo fallback
- [x] Mobile-optimized responsive design
- [x] Production deployment on Vercel Edge

## Success Criteria Met

✓ App works in demo mode with no API keys  
✓ Product value clear in under 10 seconds  
✓ Main workflow visible: paste → investigate → verdict  
✓ Three realistic demo cases  
✓ Proof-backed results with evidence cards  
✓ Clean, investigative UI (not chatbot-like)  
✓ Type-safe throughout with Zod schemas  
✓ Server-side API keys protected  
✓ Deployable to Vercel  
✓ MCP tools exposed and documented  

## Deployment

The app is ready to deploy to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `SERPAPI_API_KEY` (optional, for live mode)
- `AI_GATEWAY_API_KEY` (preferred, for AI integration)
- `MODEL_PROVIDER_KEY` (optional fallback for AI integration)
- `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `REDIS_URL` (optional, for live ChatSDK)
- `WORKFLOW_SECRET` (optional, for protected WDK workflow starts)

---

**Built with v0**: This project demonstrates the v0 + MCPs hackathon track, showcasing a production-ready investigation tool built entirely through structured prompts.
