import { Metadata } from 'next'
import { CodeBlock } from '@/components/ui/code-block'
import { Activity, AlertTriangle, ShieldCheck, Workflow, Webhook, Send, MessageSquareWarning } from 'lucide-react'

export const metadata: Metadata = {
  title: 'n8n & Automations | HireProof Docs',
  description: 'Use HireProof as a security middleware in n8n, Make.com, and LangChain to protect automated job application agents.',
}

export default function AutomationsPage() {
  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Automations & Agents</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Integrate HireProof as a security middleware in <strong className="text-foreground">n8n</strong>, <strong className="text-foreground">Make.com</strong>, and <strong className="text-foreground">LangChain</strong> to protect your automated job application agents from phishing scams.
        </p>
      </section>

      {/* The Problem */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <AlertTriangle className="h-6 w-6 text-caution" />
          <h2 className="text-2xl font-black">The Risk of Automated Job Hunting</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          AI agents that mass-apply to jobs on your behalf are incredibly powerful, but they lack common sense. Without a security filter, an AI agent will gleefully submit your resume, phone number, and home address to a fake job post, exposing you to identity theft.
        </p>
        <div className="hireproof-card relative overflow-hidden rounded-3xl border border-border-soft p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-safe/5 blur-3xl" />
          
          <div className="relative z-10 mb-8">
            <h3 className="mb-2 text-lg font-black tracking-tight text-foreground">The Solution: Security Middleware</h3>
            <p className="font-medium text-muted leading-relaxed max-w-2xl">
              By piping the job description through HireProof's headless API <em>before</em> your agent generates a cover letter, you can halt the pipeline if the job is flagged as a scam.
            </p>
          </div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-4">
            {/* Horizontal Connecting Line (Desktop) */}
            <div className="absolute left-0 top-[50%] hidden h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-border-soft via-safe/30 to-border-soft sm:block" />
            {/* Vertical Connecting Line (Mobile) */}
            <div className="absolute left-[50%] top-0 block h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-border-soft via-safe/30 to-border-soft sm:hidden" />

            {/* Step 1 */}
            <div className="relative z-10 flex w-full flex-col rounded-2xl border border-border-soft bg-background/95 p-6 shadow-sm backdrop-blur transition-transform hover:-translate-y-1 sm:w-1/3">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-muted shadow-inner">
                <Activity className="h-6 w-6" />
              </div>
              <p className="mb-2 text-base font-black">1. Trigger</p>
              <p className="text-sm font-medium leading-relaxed text-muted">Agent scrapes a new job from LinkedIn or Indeed.</p>
            </div>
            
            {/* Step 2 */}
            <div className="relative z-10 flex w-full flex-col rounded-2xl border border-safe/40 bg-background/95 p-6 shadow-lg shadow-safe/5 backdrop-blur transition-transform hover:-translate-y-1 sm:w-1/3">
              <div className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-safe text-background shadow-md">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-safe/10 text-safe shadow-inner">
                <Workflow className="h-6 w-6" />
              </div>
              <p className="mb-2 text-base font-black text-safe">2. HireProof API</p>
              <p className="text-sm font-medium leading-relaxed text-muted">Analyzes the job and returns a structured risk verdict.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex w-full flex-col rounded-2xl border border-border-soft bg-background/95 p-6 shadow-sm backdrop-blur transition-transform hover:-translate-y-1 sm:w-1/3">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-muted shadow-inner">
                <Workflow className="h-6 w-6" />
              </div>
              <p className="mb-2 text-base font-black">3. Condition</p>
              <p className="text-sm font-medium leading-relaxed text-muted">If verdict is "safe", apply. If "high-risk", abort immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* n8n Implementation */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Workflow className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Implementation in n8n</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          You can use the standard <strong>HTTP Request</strong> node in n8n to connect to HireProof. Here is a visual representation of the workflow:
        </p>

        {/* n8n Node Visual Diagram */}
        <div className="my-8 overflow-x-auto rounded-3xl border border-border-soft bg-[#fafafa] p-6 shadow-inner dark:bg-[#0d1117] hide-scrollbar">
          <div className="flex min-w-[700px] items-center justify-center py-6">
            
            {/* Trigger Node */}
            <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <Webhook className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Trigger</span>
                <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">Webhook</span>
              </div>
            </div>

            <div className="h-[2px] w-8 bg-border-soft" />

            {/* HireProof Node */}
            <div className="flex w-44 items-center gap-3 rounded-xl border border-safe/30 bg-background p-3 shadow-md shadow-safe/5 ring-1 ring-safe/10 transition-transform hover:-translate-y-0.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-safe/10 text-safe">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">HireProof</span>
                <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">HTTP Request</span>
              </div>
            </div>

            <div className="h-[2px] w-8 bg-border-soft" />

            {/* IF Node */}
            <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm transition-transform hover:-translate-y-0.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Workflow className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Safe?</span>
                <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">IF Node</span>
              </div>
            </div>

            {/* Branching Lines */}
            <div className="relative flex h-[104px] w-12 flex-col justify-between py-5">
              <div className="absolute left-0 top-1/2 h-[2px] w-4 -translate-y-1/2 bg-border-soft" />
              <div className="absolute left-4 top-5 h-[calc(100%-40px)] w-[2px] bg-border-soft" />
              
              <div className="relative flex w-full items-center justify-end">
                <div className="h-[2px] w-8 bg-safe/40" />
                <span className="absolute -top-4 right-1 text-[10px] font-bold text-safe">true</span>
              </div>
              
              <div className="relative flex w-full items-center justify-end">
                <div className="h-[2px] w-8 bg-caution/40" />
                <span className="absolute -bottom-4 right-1 text-[10px] font-bold text-caution">false</span>
              </div>
            </div>

            {/* Branches */}
            <div className="flex flex-col gap-6">
              {/* True Branch */}
              <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm transition-transform hover:-translate-y-0.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Send className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Apply</span>
                  <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">AI Agent</span>
                </div>
              </div>

              {/* False Branch */}
              <div className="flex w-44 items-center gap-3 rounded-xl border border-border bg-background p-3 shadow-sm transition-transform hover:-translate-y-0.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                  <MessageSquareWarning className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Alert User</span>
                  <span className="text-[10px] font-semibold tracking-wider text-muted uppercase">Slack / Discord</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        <div className="hireproof-card space-y-8 rounded-3xl border border-border-soft p-8">
          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm text-background">1</span>
              HTTP Request Node Configuration
            </h3>
            <div className="ml-11">
              <ul className="space-y-3 font-medium text-muted">
                <li className="flex items-center gap-3">
                  <span className="w-24 text-sm font-bold text-foreground">Method:</span> 
                  <code className="rounded-md bg-surface px-2 py-1 text-sm shadow-sm">POST</code>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-24 text-sm font-bold text-foreground">URL:</span> 
                  <code className="rounded-md bg-surface px-2 py-1 text-sm shadow-sm">https://your-hireproof-url.vercel.app/api/v1/audit</code>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-24 text-sm font-bold text-foreground">Auth:</span> 
                  <span className="text-sm">Header Auth (Name: <code className="rounded-md bg-surface px-1.5 py-0.5">x-api-key</code>)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm text-background">2</span>
              JSON Body
            </h3>
            <div className="ml-11">
              <CodeBlock
                language="json"
                code={`{
  "text": "={{ $json.jobDescription }}",
  "location": "={{ $json.jobLocation }}",
  "mode": "live"
}`}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-lg font-black">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-sm text-background">3</span>
              IF Node (Conditional Routing)
            </h3>
            <div className="ml-11 space-y-4">
              <p className="font-medium text-muted">Add an IF node after the HTTP Request to check the verdict:</p>
              <CodeBlock
                language="javascript"
                code={`// Condition: String matches
Value 1: {{$json.verdict}}
Operation: Equal
Value 2: safe`}
              />
              <div className="rounded-xl border border-border-soft bg-surface/50 p-4">
                <p className="font-medium text-muted text-sm leading-relaxed">
                  Route the <strong className="text-safe">True</strong> path to your resume generation / submission agent. Route the <strong className="text-caution">False</strong> path to a Slack/Discord notification warning you about the scam.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Async Webhooks for Long-Running Agents */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <ShieldCheck className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">Async Webhooks (For Long-Running Agents)</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          If your automation platform has strict timeouts (HireProof takes ~5 seconds, which can sometimes block synchronous pipelines), you can pass a <code className="rounded bg-surface px-1.5 py-0.5 text-sm">webhook_url</code>. HireProof will instantly return a 202 Accepted, process the investigation in the background, and POST the full JSON report back to your Catch Webhook node.
        </p>
        <CodeBlock
          language="json"
          code={`{
  "text": "={{ $json.jobDescription }}",
  "webhook_url": "https://your-n8n-instance.com/webhook/hireproof-catch"
}`}
        />
        <div className="rounded-2xl border border-evidence/30 bg-evidence/5 p-5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-evidence" />
            <strong className="text-sm font-black uppercase tracking-wider text-evidence">Security Note</strong>
          </div>
          <p className="text-sm font-medium leading-relaxed text-evidence-text">
            When using Webhooks, HireProof signs the payload using an HMAC-SHA256 signature in the <code className="rounded bg-evidence/20 px-1.5 py-0.5 font-bold text-evidence">X-HireProof-Signature</code> header. Your automation platform should verify this signature using your API key to ensure the webhook is genuinely from HireProof and not a malicious actor spoofing a "safe" verdict.
          </p>
        </div>
      </section>
    </div>
  )
}
