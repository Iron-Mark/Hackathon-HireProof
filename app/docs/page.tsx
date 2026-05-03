import Link from 'next/link'
import { Zap, Code2, Webhook, ArrowRight, Download, Cpu, ShieldCheck, SearchCheck, Package } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata = { title: 'Documentation — HireProof' }

const quickLinks = [
  { icon: SearchCheck, title: 'How It Works', desc: 'Live vs demo behavior, evidence flow, trust controls, and guardrails', href: '/docs/how-it-works', color: 'hover:border-safe' },
  { icon: Zap, title: 'Quickstart', desc: 'Get running locally in under 2 minutes', href: '/docs/quickstart', color: 'hover:border-safe' },
  { icon: Code2, title: 'API Reference', desc: 'Full endpoint docs, params, and schemas', href: '/docs/api-reference', color: 'hover:border-evidence' },
  { icon: Package, title: 'CLI & npm Packages', desc: 'Published CLI, SDK, LangChain tool, and n8n node packages', href: '/docs/automations', color: 'hover:border-safe' },
  { icon: Cpu, title: 'Agent Skills', desc: 'Download MCP skills for your AI CLI', href: '/docs/skills', color: 'hover:border-caution' },
  { icon: Webhook, title: 'Webhooks', desc: 'Async investigations with callbacks', href: '/docs/webhooks', color: 'hover:border-safe' },
  { icon: Download, title: 'Chrome Extension', desc: 'Download the ZIP while Web Store review is pending', href: '/docs/chrome-extension', color: 'hover:border-evidence' },
  { icon: ShieldCheck, title: 'Competitive Roadmap', desc: 'Judge-safe positioning, boundaries, and next milestones', href: '/docs/competitive-roadmap', color: 'hover:border-evidence' },
]

const platforms = [
  { title: 'Web App', desc: 'Use the investigation UI at /audit — paste, upload, or speak your job post.' },
  { title: 'REST API', desc: 'Hit /api/v1/audit directly from any script, workflow, or AI agent.' },
  { title: 'MCP Server', desc: 'Connect at /api/mcp to call individual tools from Claude, Cursor, or Codex.' },
  { title: 'Local extension package', desc: 'Download /downloads/hireproof-extension.zip while the Chrome Web Store listing is still pending review.' },
  { title: 'TypeScript SDK', desc: 'npm install hireproof-sdk — typed client for Node.js agents.' },
  { title: 'CLI and LangChain packages', desc: 'npx @hireproof/cli and npm install @hireproof/langchain — published npm packages for terminal and agent workflows.' },
  { title: 'AI CLI Skill', desc: 'Drop SKILL.md into .agents/skills/hireproof/ and any CLI agent can use it.' },
]

const HERO_CURL = `curl -X POST https://hireproof-sigma.vercel.app/api/v1/audit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hireproof_agent_demo_key" \\
  -d '{
    "text": "Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.",
    "location": "Philippines"
  }'`

export default function DocsOverview() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <div className="mb-3 inline-block rounded-full border border-safe/30 bg-safe/10 px-3 py-1 text-xs font-black text-safe">v1.0 — Open Platform</div>
        <h1 className="mb-4 text-4xl font-black tracking-tight">HireProof Documentation</h1>
        <p className="text-lg font-semibold leading-8 text-muted">
          An employment-fraud trust-and-safety agent for verifying job posts and detecting recruitment fraud.
          Paste a listing, upload a screenshot, or call the API — HireProof investigates with live web evidence and returns a verdict with receipts.
        </p>
      </div>

      {/* Hero code block */}
      <div className="mb-10">
        <CodeBlock title="Try it now — curl" code={HERO_CURL} />
        <p className="mt-2 text-xs font-semibold text-muted">
          The demo API key is public. No sign-up needed.{' '}
          <Link href="/docs/authentication" className="text-safe hover:underline font-black">Learn about authentication →</Link>
        </p>
      </div>

      {/* Quick nav */}
      <h2 className="mb-5 text-2xl font-black">Where to start</h2>
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:shadow-md ${link.color}`}
          >
            <link.icon className="mb-3 h-5 w-5 text-safe" />
            <div className="flex items-center justify-between">
              <div className="text-sm font-black group-hover:text-foreground">{link.title}</div>
              <ArrowRight className="h-4 w-4 text-muted opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
            </div>
            <div className="mt-1 text-xs font-semibold text-muted">{link.desc}</div>
          </Link>
        ))}
      </div>

      {/* How it works */}
      <h2 className="mb-5 text-2xl font-black">How It Works</h2>
      <div className="mb-12 rounded-2xl border border-border-soft bg-safe/5 p-6">
        <ol className="space-y-4 text-sm font-semibold text-muted">
          {[
            'User submits a job post via text, URL, screenshot upload, pasted screenshot, or voice dictation',
            'Screenshot text is extracted with Google Vision OCR first, then Tesseract fallback if needed',
            'HireProof resolves public job URLs and compares them against pasted or OCR-derived text',
            'AI extracts structured claims: company, role, salary, location, contact method, and apply path',
            'Live evidence mode can call search, jobs, news, maps, OCR, and enrichment tools',
            'A transparent evidence-weighted risk policy produces a 0-100 score, verdict, evidence receipts, and next steps',
            'Verified-only alternatives appear only when comparable job evidence has a source',
            'Demo fixture mode is labeled and does not claim fresh source checks',
            'Results stream to the browser, or return as JSON for headless clients',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-safe text-xs font-black text-background">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Access surfaces */}
      <h2 className="mb-5 text-2xl font-black">Access Surfaces</h2>
      <p className="mb-5 text-sm font-semibold text-muted">HireProof is designed to be used from anywhere. Choose the surface that fits your workflow:</p>
      <div className="mb-12 grid gap-3 sm:grid-cols-2">
        {platforms.map((p) => (
          <div key={p.title} className="rounded-xl border border-border-soft bg-surface p-4">
            <div className="text-sm font-black mb-1">{p.title}</div>
            <div className="text-xs font-semibold text-muted">{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Download skill CTA */}
      <div className="flex items-center justify-between rounded-2xl border border-border-soft bg-surface p-5">
        <div>
          <div className="text-sm font-black mb-0.5">Want to add HireProof to your AI CLI?</div>
          <p className="text-xs font-semibold text-muted">Download the SKILL.md and drop it in your .agents/skills folder.</p>
        </div>
        <Link href="/docs/skills" className="flex shrink-0 items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-black text-background hover:opacity-80 transition-opacity">
          <Download className="h-4 w-4" />
          Get Skills
        </Link>
      </div>
    </div>
  )
}
