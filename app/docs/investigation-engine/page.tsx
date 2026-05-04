import type { Metadata } from 'next'
import { Cpu, Zap, Search, ShieldCheck, Workflow, Brain, Microscope } from 'lucide-react'
import { CodeBlock } from '@/components/ui/code-block'

export const metadata: Metadata = {
  title: 'AI Investigation Engine — HireProof Docs',
  description: 'How HireProof investigates job posts with claim extraction, OCR, URL enrichment, evidence tools, transparent scoring, and demo/live boundaries.',
}

const pipelineProof = [
  { icon: Search, label: 'Input normalization', detail: 'Text, URLs, screenshots, and recruiter messages become structured claims.' },
  { icon: Microscope, label: 'Evidence tools', detail: 'Company, news, jobs, local footprint, OCR, and apply-path checks run as available.' },
  { icon: ShieldCheck, label: 'Scoring policy', detail: 'A transparent evidence-weighted policy produces Safe, Caution, or High-Risk.' },
  { icon: Workflow, label: 'Report output', detail: 'The UI, API, MCP, chat, and workflow paths receive the same report shape.' },
]

export default function InvestigationEnginePage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">AI Investigation Engine</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof is powered by an autonomous, multi-surface investigation engine for employment fraud. The focused domain is intentional: job seekers need a fast, evidence-backed decision before applying, paying fees, or sharing identity data.
        </p>
      </section>

      <section className="rounded-3xl border border-border-soft bg-surface/70 p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {pipelineProof.map((item, index) => (
            <div key={item.label} className="relative rounded-2xl border border-border-soft bg-background p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-safe/10 text-safe">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">0{index + 1}</span>
              </div>
              <h2 className="text-sm font-black">{item.label}</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-muted">{item.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">
          Engine proof: the pipeline is summarized as product UI instead of a full-page screenshot of this documentation page.
        </p>
      </section>

      {/* The Core Agent */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Brain className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Autonomous Agent Loop</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          The engine utilizes the <strong>Vercel AI SDK</strong> with multi-step tool orchestration. Unlike static scanners, our agent autonomously decides which tools to invoke based on the claims extracted from the job post.
        </p>
        
        <div className="hireproof-card overflow-hidden rounded-3xl border border-border-soft">
          <div className="border-b border-border-soft bg-surface px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Execution logic</div>
          <div className="p-0">
            <CodeBlock 
              language="typescript"
              code={`const result = await generateText({
  model: openai('gpt-4o-mini'),
  system: "You are HireProof Investigator. Use tools to verify claims.",
  maxSteps: 5,
  tools: {
    search_company,   // Web presence & LinkedIn
    news_check,       // Scam reports & press
    jobs_compare,     // Market rate benchmarking
    local_presence,   // Maps & office registration
  },
  prompt: \`Investigate: \${extractedClaims.text}\`,
})`} 
            />
          </div>
        </div>
      </section>

      {/* Investigation Pipeline */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Workflow className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">The Investigation Pipeline</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-safe/10 text-safe">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-black">1. Extraction</h3>
            <p className="text-xs font-medium text-muted leading-relaxed">
              The engine uses Vision or NLP to extract claims (Salary, Role, Contact Method) into a typed object.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-evidence/10 text-evidence">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="font-black">2. Evidence</h3>
            <p className="text-xs font-medium text-muted leading-relaxed">
              The agent calls MCP tools in parallel to verify each claim against live web data and news archives.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-caution/10 text-caution">
              <Microscope className="h-5 w-5" />
            </div>
            <h3 className="font-black">3. Evidence Analysis</h3>
            <p className="text-xs font-medium text-muted leading-relaxed">
          Verdicts are generated by weighing the collected evidence against transparent red-flag and green-flag policy.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Microscope className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Input Normalization</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: 'Text, URL, and screenshot intake',
              body: 'The browser form accepts pasted text, job URLs, uploaded screenshots, pasted screenshots, and voice dictation. Desktop users land directly in the main paste box so text or screenshots can be pasted immediately.',
            },
            {
              title: 'Screenshot OCR path',
              body: 'Screenshots are read with Google Vision OCR first. If that provider is unavailable or returns too little text, HireProof falls back to Tesseract OCR after image preprocessing for contrast, grayscale, sharpening, and OCR-friendly sizing.',
            },
            {
              title: 'Job URL enrichment',
              body: 'Public job URLs are resolved before claim extraction where possible. LinkedIn and other supported job pages are converted into readable job text and evidence receipts.',
            },
            {
              title: 'Conflict detection',
              body: 'If pasted text, OCR text, and resolved URL content disagree, the report treats that as evidence rather than blindly trusting the safest-looking source.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border-soft bg-surface p-5">
              <h3 className="text-sm font-black">{item.title}</h3>
              <p className="mt-2 text-xs font-semibold leading-5 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Resilience */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-safe" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Fail-Safe Resilience</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              If a specific AI model or tool is unavailable, the engine automatically pivots to fallback checks. We prioritize a <strong>transparent evidence-weighted policy</strong> over raw LLM output so verdicts stay explainable and consistent.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-evidence/30 bg-evidence/5 p-6">
        <div className="flex items-start gap-4">
          <Search className="mt-1 h-5 w-5 text-evidence" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-evidence">Evidence provider status</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Live reports can show the status of SerpApi, RDAP, DNS, Safe Browsing, certificate transparency, threat-intel, company-registry, and urlscan checks. Status values such as <strong>ok</strong>, <strong>cache-only</strong>, <strong>degraded</strong>, and <strong>not-live</strong> explain provider coverage without blocking the audit. A missing phishing hit is neutral; it is not treated as proof that a job is safe.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-evidence/30 bg-evidence/5 p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-evidence" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-evidence">Screenshot report privacy</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              The raw screenshot is not stored as a report evidence item. Screenshot-derived reports can still be opened from their direct report link, but they are excluded from Explore and Trends by default. Public report UI shows a short display-safe OCR preview instead of dumping full screenshot text.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <Workflow className="mt-1 h-5 w-5 text-safe" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest">Durable workflow roadmap</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Browser audits now show a visible report timeline that uses the stream events captured during the audit. WDK proof remains accepted-run proof until completed callback and retry evidence are captured.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-caution/30 bg-caution-bg/20 p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-caution-text" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-caution-text">Demo and live boundaries</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              Demo fixture reports are explicitly labeled and do not claim live source checks. In live mode, the timeline uses the stream events emitted by the audit route, safer alternatives require sourced comparable-job evidence, and operational notes explain throttling or provider circuit breaker states.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
