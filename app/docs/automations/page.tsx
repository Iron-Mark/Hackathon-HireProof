import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { Activity, AlertTriangle, CheckCircle2, Download, FileCode2, KeyRound, ShieldCheck, Workflow, Webhook, Send, MessageSquareWarning } from 'lucide-react'

export const metadata: Metadata = {
  title: 'n8n & Automations | HireProof Docs',
  description: 'Use HireProof published npm packages, Make source pack, HTTP webhooks, and workflow handoff for agent and automation integrations.',
}

const nativeIntegrations = [
  {
    title: 'n8n community node',
    desc: 'Published npm package with HireProof API credentials and sync or async audit operations.',
    path: 'integrations/n8n-nodes-hireproof',
    href: 'https://www.npmjs.com/package/n8n-nodes-hireproof',
    cta: 'View npm package',
  },
  {
    title: 'Make Custom App',
    desc: 'Custom app source with API-key connection, audit modules, async audit, and health check.',
    path: 'integrations/make-hireproof',
    href: '/api/downloads/hireproof-native-integrations.zip',
    cta: 'Download source pack',
  },
  {
    title: 'LangChain package',
    desc: 'Published npm package exporting a DynamicStructuredTool helper, Zod schema, and typed helpers.',
    path: 'packages/hireproof-langchain',
    href: 'https://www.npmjs.com/package/@hireproof/langchain',
    cta: 'View npm package',
  },
  {
    title: 'HireProof CLI',
    desc: 'Published npm package for rich terminal audits, JSON automation output, and the Shield Sentinel TUI.',
    path: 'packages/hireproof-cli',
    href: 'https://www.npmjs.com/package/@hireproof/cli',
    cta: 'View npm package',
  },
]

const automationDownloads = [
  {
    title: 'n8n workflow',
    desc: 'Importable workflow: incoming webhook, HireProof audit, verdict branch, and JSON response.',
    href: '/api/downloads/hireproof-n8n-workflow.json',
    cta: 'Download JSON',
  },
  {
    title: 'Make HTTP config',
    desc: 'Field-by-field config for Make.com HTTP > Make a request with routing rules.',
    href: '/api/downloads/hireproof-make-http-config.json',
    cta: 'Download config',
  },
  {
    title: 'LangChain tool',
    desc: 'TypeScript DynamicStructuredTool wrapper for agent pipelines.',
    href: '/api/downloads/hireproof-langchain-tool.ts',
    cta: 'Download TS',
  },
  {
    title: 'curl smoke script',
    desc: 'Runnable shell script for API smoke checks and simple automations.',
    href: '/api/downloads/hireproof-automation-curl.sh',
    cta: 'Download script',
  },
]

const automationProof = [
  { label: 'Published packages', value: 'SDK, CLI, LangChain, n8n', tone: 'safe' },
  { label: 'Source pack', value: 'Make Custom App bundle', tone: 'evidence' },
  { label: 'Workflow templates', value: 'n8n, Make HTTP, curl', tone: 'safe' },
  { label: 'Runtime paths', value: 'REST API, webhooks, WDK', tone: 'evidence' },
]

export default function AutomationsPage() {
  return (
    <div className="space-y-12 pb-24">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Automations & Agents</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Ship HireProof into automation flows with published npm packages for <strong className="text-foreground">n8n</strong>, LangChain, the TypeScript SDK, and the CLI, plus a Make Custom App source pack and portable HTTP templates for quick starts. Each integration calls the production headless audit API and routes from the actual <code className="rounded bg-surface px-1.5 py-0.5 text-sm">verdict</code> and <code className="rounded bg-surface px-1.5 py-0.5 text-sm">riskScore</code> fields.
        </p>
      </section>

      <section className="rounded-3xl border border-border-soft bg-surface/70 p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {automationProof.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border-soft bg-background p-4 shadow-sm">
              <div className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${item.tone === 'safe' ? 'bg-safe/10 text-safe' : 'bg-evidence/10 text-evidence'}`}>
                {item.label}
              </div>
              <p className="text-sm font-black leading-5 text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">
          Integration proof: published packages, source-pack boundaries, workflow templates, and runtime endpoints are surfaced without full-page screenshots.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <FileCode2 className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Native Integration Packs</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {nativeIntegrations.map((integration) => (
            <a
              key={integration.path}
              href={integration.href}
              className="group rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:border-safe/50 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safe/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-sm font-black text-foreground">{integration.title}</h3>
                <Download className="h-4 w-4 text-muted transition-colors group-hover:text-safe" />
              </div>
              <p className="mb-3 text-xs font-semibold leading-relaxed text-muted">{integration.desc}</p>
              <code className="mb-4 block rounded-md bg-background px-2 py-1 text-[11px] font-bold text-muted">{integration.path}</code>
              <span className="text-xs font-black uppercase tracking-widest text-safe">{integration.cta}</span>
            </a>
          ))}
        </div>
        <div className="rounded-2xl border border-caution/30 bg-caution/5 p-5">
          <p className="text-sm font-semibold leading-relaxed text-caution-text">
            n8n, LangChain, the TypeScript SDK, and the CLI are published on npm. Make remains a Custom App source pack because Make review happens in Make's builder, not npm. Separate n8n directory/community verification may still require account-backed screenshots after npm publish.
          </p>
        </div>
        <CodeBlock
          title="Published npm packages"
          code={`npm install hireproof-sdk
npm install @hireproof/langchain @langchain/core zod
npm install n8n-nodes-hireproof
npx @hireproof/cli --help`}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Webhook className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Shipped Templates</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          The HTTP templates remain useful when you want a fast import or a portable webhook flow without installing a native app package.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {automationDownloads.map((download) => (
            <a
              key={download.href}
              href={download.href}
              download
              className="group rounded-2xl border border-border-soft bg-surface p-5 shadow-sm transition-all hover:border-safe/50 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-safe/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="text-sm font-black text-foreground">{download.title}</h3>
                <Download className="h-4 w-4 text-muted transition-colors group-hover:text-safe" />
              </div>
              <p className="mb-4 text-xs font-semibold leading-relaxed text-muted">{download.desc}</p>
              <span className="text-xs font-black uppercase tracking-widest text-safe">{download.cta}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: CheckCircle2, title: 'Live today', desc: 'POST /api/v1/audit returns a structured AuditReport for automation clients.' },
          { icon: Webhook, title: 'Async callback', desc: 'Add webhook_url to receive the completed report by signed POST callback.' },
          { icon: Workflow, title: 'Workflow route', desc: 'POST /api/workflows/audit hands work to Vercel Workflow when the workflow secret is configured.' },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
            <item.icon className="mb-3 h-5 w-5 text-safe" />
            <h2 className="mb-1 text-sm font-black">{item.title}</h2>
            <p className="text-xs font-semibold leading-relaxed text-muted">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <AlertTriangle className="h-6 w-6 text-caution" />
          <h2 className="text-2xl font-black">Why Put HireProof Before an Apply Agent?</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Automated job workflows can move faster than human review. A safety checkpoint lets your pipeline inspect the job text first, then continue only when the returned verdict and risk score are acceptable.
        </p>
        <div className="hireproof-card relative overflow-hidden rounded-3xl border border-border-soft p-5 sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-safe/5 blur-3xl" />
          <div className="relative grid gap-4 sm:grid-cols-3">
            {[
              { icon: Activity, title: '1. Trigger', desc: 'A workflow receives a job post, recruiter message, screenshot OCR result, or URL text.' },
              { icon: ShieldCheck, title: '2. Audit API', desc: 'The workflow calls HireProof and receives a Safe, Caution, or High-Risk verdict.' },
              { icon: Workflow, title: '3. Route', desc: 'Safe can continue. Caution or High-Risk can stop the pipeline and alert the user.' },
            ].map((step, index) => (
              <div
                key={step.title}
                className={`relative z-10 rounded-2xl border bg-background/95 p-6 shadow-sm backdrop-blur ${
                  index === 1 ? 'border-safe/40 shadow-safe/5' : 'border-border-soft'
                }`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${index === 1 ? 'bg-safe/10 text-safe' : 'bg-surface text-muted'}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <p className={`mb-2 text-base font-black ${index === 1 ? 'text-safe' : 'text-foreground'}`}>{step.title}</p>
                <p className="text-sm font-medium leading-relaxed text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Workflow className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">n8n Workflow</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Use the native node package when you want credential-managed n8n operations named <code className="rounded bg-surface px-1.5 py-0.5 text-sm">Run audit</code> and <code className="rounded bg-surface px-1.5 py-0.5 text-sm">Run async audit</code>. Import <code className="rounded bg-surface px-1.5 py-0.5 text-sm">hireproof-n8n-workflow.json</code> only when you want the portable HTTP Request quick start.
        </p>

        <div className="my-8 max-w-full overflow-x-auto rounded-3xl border border-border-soft bg-[#fafafa] p-4 shadow-inner dark:bg-[#0d1117] sm:p-6">
          <div className="flex min-w-[680px] items-center justify-center py-6">
            <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <Webhook className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Trigger</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Webhook / Scraper</span>
              </div>
            </div>

            <div className="h-[2px] w-8 bg-border-soft" />

            <div className="flex w-44 items-center gap-3 rounded-xl border border-safe/30 bg-background p-3 shadow-md shadow-safe/5 ring-1 ring-safe/10">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-safe/10 text-safe">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">HireProof</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">HTTP Request</span>
              </div>
            </div>

            <div className="h-[2px] w-8 bg-border-soft" />

            <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Workflow className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Verdict?</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">IF Node</span>
              </div>
            </div>

            <div className="relative flex h-[104px] w-12 flex-col justify-between py-5">
              <div className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 bg-border-soft" />
              <div className="absolute left-4 top-5 h-[calc(100%-40px)] w-[2px] bg-border-soft" />
              <div className="relative flex w-full items-center justify-end">
                <div className="h-[2px] w-8 bg-safe/40" />
                <span className="absolute -top-4 right-1 text-[10px] font-bold text-safe">safe</span>
              </div>
              <div className="relative flex w-full items-center justify-end">
                <div className="h-[2px] w-8 bg-caution/40" />
                <span className="absolute -bottom-4 right-1 text-[10px] font-bold text-caution">caution / risk</span>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Send className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Continue</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Apply Flow</span>
                </div>
              </div>
              <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Alert</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Slack / Email</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hireproof-card space-y-8 rounded-3xl border border-border-soft p-5 sm:p-8">
          <div className="rounded-2xl border border-safe/30 bg-safe/5 p-5">
            <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-safe">Import path</h3>
            <p className="text-sm font-semibold leading-relaxed text-muted">
              Download <a href="/api/downloads/hireproof-n8n-workflow.json" download className="font-black text-safe hover:underline">hireproof-n8n-workflow.json</a>, then use n8n's import-from-file flow. Set <code className="rounded bg-surface px-1.5 py-0.5">HIREPROOF_API_KEY</code> in n8n env for live keys, or leave it unset to use the public demo fixture key.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-safe text-sm text-background dark:text-[#06130d]">1</span>
              HTTP Request Node
            </h3>
            <div className="ml-0 sm:ml-11">
              <ul className="space-y-3 font-medium text-muted">
                <li className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-sm font-bold text-foreground">Method:</span>
                  <code className="rounded-md bg-surface px-2 py-1 text-sm shadow-sm">POST</code>
                </li>
                <li className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-sm font-bold text-foreground">URL:</span>
                  <code className="rounded-md bg-surface px-2 py-1 text-sm shadow-sm">https://hireproof-sigma.vercel.app/api/v1/audit</code>
                </li>
                <li className="flex flex-wrap items-center gap-3">
                  <span className="w-24 text-sm font-bold text-foreground">Header:</span>
                  <span className="text-sm"><code className="rounded-md bg-surface px-1.5 py-0.5">x-api-key</code> with your key or the public demo key for demo fixtures</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-safe text-sm text-background dark:text-[#06130d]">2</span>
              JSON Body
            </h3>
            <div className="ml-0 space-y-4 sm:ml-11">
              <CodeBlock
                title="Demo-safe request"
                language="json"
                code={`{
  "text": "={{ $json.jobDescription }}",
  "location": "={{ $json.jobLocation }}",
  "mode": "demo"
}`}
              />
              <p className="text-sm font-semibold leading-relaxed text-muted">
                Use <code className="rounded bg-surface px-1.5 py-0.5">mode: "demo"</code> for deterministic fixture output. Use <code className="rounded bg-surface px-1.5 py-0.5">mode: "live"</code> only when the account or deployment has live provider credentials.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-safe text-sm text-background dark:text-[#06130d]">3</span>
              IF Node
            </h3>
            <div className="ml-0 space-y-4 sm:ml-11">
              <p className="font-medium text-muted">Route from fields that the API really returns: <code className="rounded bg-surface px-1.5 py-0.5">verdict</code> and <code className="rounded bg-surface px-1.5 py-0.5">riskScore</code>.</p>
              <CodeBlock
                language="javascript"
                code={`// n8n IF condition example
{{$json.verdict}} equals safe

// stricter option
{{$json.riskScore}} lower than 40`}
              />
              <div className="rounded-xl border border-border-soft bg-surface/50 p-4">
                <p className="text-sm font-medium leading-relaxed text-muted">
                  Let the safe path continue to drafting or review. Route caution and high-risk results to a human review step, Slack message, email, or ticket.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <FileCode2 className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Make, LangChain, and curl</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 text-sm font-black">Make.com</h3>
            <p className="mb-4 text-xs font-semibold leading-relaxed text-muted">
              Use the Custom App source for API-key connection, audit modules, async audit, and health checks. Use the HTTP config only for a no-review quick start.
            </p>
            <div className="space-y-2">
              <a href="/api/downloads/hireproof-native-integrations.zip" download className="block text-xs font-black uppercase tracking-widest text-safe hover:underline">Download source pack</a>
              <a href="/api/downloads/hireproof-make-http-config.json" download className="block text-xs font-black uppercase tracking-widest text-muted hover:text-safe hover:underline">Download HTTP config</a>
            </div>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 text-sm font-black">LangChain</h3>
            <p className="mb-4 text-xs font-semibold leading-relaxed text-muted">
              Install <code className="rounded bg-background px-1 py-0.5">@hireproof/langchain</code> from npm for schema validation, result helpers, and DynamicStructuredTool support.
            </p>
            <div className="space-y-2">
              <a href="/api/downloads/hireproof-native-integrations.zip" download className="block text-xs font-black uppercase tracking-widest text-safe hover:underline">Download source pack</a>
              <a href="/api/downloads/hireproof-langchain-tool.ts" download className="block text-xs font-black uppercase tracking-widest text-muted hover:text-safe hover:underline">Download standalone TS</a>
            </div>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <h3 className="mb-2 text-sm font-black">curl</h3>
            <p className="mb-4 text-xs font-semibold leading-relaxed text-muted">
              Use the shell script for smoke checks, cron jobs, or lightweight server automations.
            </p>
            <a href="/api/downloads/hireproof-automation-curl.sh" download className="text-xs font-black uppercase tracking-widest text-safe hover:underline">Download curl script</a>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Webhook className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Async Webhook Delivery</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          Add <code className="rounded bg-surface px-1.5 py-0.5 text-sm">webhook_url</code> when your automation should not wait for the full investigation response. The API immediately returns <code className="rounded bg-surface px-1.5 py-0.5 text-sm">202</code>, runs the audit in the background, and POSTs the completed <code className="rounded bg-surface px-1.5 py-0.5 text-sm">AuditReport</code> to your callback URL. End-to-end runtime depends on mode, configured credentials, AI/search provider latency, and receiver behavior.
        </p>
        <CodeBlock
          title="Async request"
          language="json"
          code={`{
  "text": "={{ $json.jobDescription }}",
  "mode": "demo",
  "webhook_url": "https://your-n8n-instance.com/webhook/hireproof-catch"
}`}
        />
        <CodeBlock
          title="Immediate response"
          language="json"
          code={`{
  "status": "processing",
  "message": "Investigation started. Results will be posted to the webhook URL."
}`}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-evidence" />
              <strong className="text-sm font-black uppercase tracking-wider text-evidence">Signed Callback</strong>
            </div>
            <p className="text-sm font-medium leading-relaxed text-evidence-text">
              The callback includes <code className="rounded bg-evidence/20 px-1.5 py-0.5 font-bold text-evidence">X-HireProof-Signature</code>, <code className="rounded bg-evidence/20 px-1.5 py-0.5 font-bold text-evidence">X-HireProof-Event</code>, and <code className="rounded bg-evidence/20 px-1.5 py-0.5 font-bold text-evidence">User-Agent</code>. Verify the HMAC-SHA256 signature with the same API key used for the request.
            </p>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-safe" />
              <strong className="text-sm font-black uppercase tracking-wider text-foreground">Delivery Rules</strong>
            </div>
            <p className="text-sm font-medium leading-relaxed text-muted">
              Private and local callback destinations are blocked. Delivery uses a 10-second timeout and retries server-side failures up to three total attempts.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Workflow className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Vercel Workflow Handoff</h2>
        </div>
        <p className="font-medium leading-relaxed text-muted">
          HireProof also exposes <code className="rounded bg-surface px-1.5 py-0.5 text-sm">/api/workflows/audit</code> for Vercel Workflow handoff. This is separate from the portable automation API above. Use it when you are deploying with Workflow credentials and want a durable run accepted by WDK.
        </p>
        <CodeBlock
          title="Workflow handoff"
          language="bash"
          code={`curl -X POST https://hireproof-sigma.vercel.app/api/workflows/audit \\
  -H "Content-Type: application/json" \\
  -H "x-workflow-secret: $WORKFLOW_SECRET" \\
  -d '{
    "text": "Suspicious job post text",
    "webhook_url": "https://example.com/hireproof-callback"
  }'`}
        />
        <p className="text-sm font-semibold leading-relaxed text-muted">
          If <code className="rounded bg-surface px-1.5 py-0.5">WORKFLOW_SECRET</code> is not configured, the route returns an honest credential-required response instead of pretending a durable run was started.
        </p>
      </section>
    </div>
  )
}
