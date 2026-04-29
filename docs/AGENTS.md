# Contributor & AI Agent Guidelines

## Project Status
**HireProof is fully functional.** The application build pipeline and package manager are active.

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 6
- **Package Manager:** npm

## Project Structure

- `app/` — Next.js App Router (UI & API routes)
- `components/` — React components (Tailwind CSS 4)
- `lib/` — Core logic (AI Agent, Scorer, SerpApi wrappers)
- `extension/` — Chrome Manifest V3 Extension
- `.agents/skills/hireproof/` — Market-standard SKILL.md for AI agents

## Development Commands

- `npm install` — Install dependencies
- `npm run dev` — Start dev server on port 3002
- `npm run build` — Production build
- `npm run lint` — Type checking

## AI Agent Instructions
When working in this repository:
1. **Preserve User Research**: Historical reports in `/docs` are valuable for context.
2. **Standardized Padding**: Use the responsive scale `px-6 md:px-12 lg:px-20 xl:px-32` for main containers.
3. **Max Width**: Containers should use `max-w-[1600px]` for ultra-wide monitor support.
4. **Skill Synchronization**: Ensure `SKILLS.md` (root) and `.agents/skills/hireproof/SKILL.md` stay in sync with the MCP tools in `lib/mcp-tools.ts`.
