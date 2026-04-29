import { Globe, Cpu, Plug, PuzzleIcon } from 'lucide-react'

export const metadata = { title: 'Architecture — HireProof' }

function FlowStep({ step, title, desc, badge }: { step: string; title: string; desc: string; badge?: string }) {
  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-safe text-sm font-black text-background shadow-sm">
          {step}
        </span>
        <div className="mt-1 w-px flex-1 bg-border-soft" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="text-sm font-black">{title}</div>
          {badge && <span className="rounded-full bg-evidence/10 px-2 py-0.5 text-[10px] font-black text-evidence">{badge}</span>}
        </div>
        <p className="text-sm font-semibold text-muted leading-6">{desc}</p>
      </div>
    </div>
  )
}

export default function ArchitecturePage() {
  return (
    <div>
      <h1 className="mb-4 text-4xl font-black tracking-tight">Architecture</h1>
      <p className="mb-10 text-lg font-semibold text-muted leading-8">
        HireProof is a multi-surface, Omni-Modal AI Agent platform. A single secure core powers four distinct access surfaces simultaneously.
      </p>

      {/* Access Surfaces */}
      <section className="mb-12">
        <h2 className="mb-5 text-2xl font-black">Access Surfaces</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Globe, title: 'Web App', desc: 'React 19 + Next.js 16 App Router. Real-time SSE streaming of agent steps directly to the browser.', color: 'border-safe/30 bg-safe/5' },
            { icon: Plug, title: 'Headless REST API', desc: '/api/v1/audit — authenticated JSON endpoint for external AI agents and automations.', color: 'border-evidence/30 bg-evidence/5' },
            { icon: Cpu, title: 'MCP Server', desc: '/api/mcp — exposes 4 investigation tools via the Model Context Protocol for direct agent tool-calling.', color: 'border-caution/30 bg-caution/5' },
            { icon: PuzzleIcon, title: 'Chrome Extension', desc: 'Manifest V3 assets are available for local install and demo testing; no public store listing is claimed yet.', color: 'border-risk-bg bg-risk-bg/20' },
          ].map((s) => (
            <div key={s.title} className={`rounded-2xl border p-5 ${s.color}`}>
              <s.icon className="h-5 w-5 mb-3 opacity-70" />
              <div className="text-sm font-black mb-1">{s.title}</div>
              <p className="text-xs font-semibold text-muted leading-5">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-12">
        <h2 className="mb-5 text-2xl font-black">Tech Stack</h2>
        <div className="overflow-hidden rounded-xl border border-border-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft bg-surface">
                <th className="px-4 py-3 text-left text-xs font-black text-muted uppercase tracking-wider w-40">Layer</th>
                <th className="px-4 py-3 text-left text-xs font-black text-muted uppercase tracking-wider">Technology</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Framework', 'Next.js 16 (App Router) + React 19'],
                ['Language', 'TypeScript 6'],
                ['Styling', 'Tailwind CSS 4 + Custom Design Tokens'],
                ['AI Engine', 'Vercel AI SDK 6 + AI Gateway, with OpenAI-compatible fallback'],
                ['Animation', 'Framer Motion 12'],
                ['Charts', 'Recharts (Radar, Bar)'],
                ['Exports', 'html2canvas PNG capture and JSON trend export'],
                ['Web Intelligence', 'SerpApi (Google, News, Jobs, Maps)'],
                ['Protocol', 'Model Context Protocol (MCP)'],
                ['Database', 'Upstash Serverless Redis (hybrid fallback)'],
                ['Deployment', 'Vercel Edge Network'],
              ].map(([layer, tech]) => (
                <tr key={layer} className="border-b border-border-soft last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-black text-sm">{layer}</td>
                  <td className="px-4 py-3 text-muted font-semibold text-sm">{tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Request Flow */}
      <section className="mb-10">
        <h2 className="mb-6 text-2xl font-black">Request Flow</h2>
        <div className="pl-1">
          <FlowStep
            step="1"
            title="Input Layer"
            badge="Omni-Modal"
            desc="User submits via text, image upload, or voice dictation. Inputs are normalized into a typed AuditRequest object and sent to the backend."
          />
          <FlowStep
            step="2"
            title="Security Proxy"
            badge="Edge"
            desc="proxy.ts intercepts every request. Blocks malicious User-Agents, enforces 16KB header limits, and attaches CSP, CORS, and X-Frame-Options security headers."
          />
          <FlowStep
            step="3"
            title="Claims Extraction"
            badge="AI"
            desc="The AI model uses structured output generation to extract company, role, salary, contact method, and application path from the raw input — including image screenshots."
          />
          <FlowStep
            step="4"
            title="Concurrent Evidence Gathering"
            badge="Agent Loop"
            desc="An autonomous agentic loop calls 4 MCP investigation tools in parallel: company web presence check, news scam search, salary market comparison, and local business footprint."
          />
          <FlowStep
            step="5"
            title="Deterministic Risk Scoring"
            desc="A deterministic scorer assigns weighted penalties for red flags and bonuses for green flags, producing a final 0–100 risk score and one of three verdicts: Safe, Caution, or High-Risk."
          />
          <FlowStep
            step="6"
            title="Output & Persistence"
            badge="Hybrid"
            desc="Results stream to the browser via SSE, or return as JSON for headless clients. Reports are persisted to Upstash Redis (or local disk) and accessible via shareable permalink."
          />
        </div>
      </section>
    </div>
  )
}
