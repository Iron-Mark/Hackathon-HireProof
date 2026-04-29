import { CodeBlock } from '@/components/ui/code-block'
import { Zap, Activity, Cpu, ShieldCheck, ArrowRight } from 'lucide-react'

export const metadata = { 
  title: 'Real-Time Streaming — HireProof Docs',
  description: 'Learn how HireProof streams live AI investigation steps to the browser via Server-Sent Events.'
}

export default function StreamingPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Real-Time Streaming</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Watch the AI agent think and gather evidence in real-time. HireProof utilizes Server-Sent Events (SSE) to provide an interactive, "live" forensic experience.
        </p>
      </section>

      {/* The Protocol */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Activity className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-black">SSE Implementation</h2>
        </div>
        <p className="font-medium text-muted leading-relaxed">
          The primary <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">/api/audit</code> endpoint does not return a static JSON response. Instead, it streams a sequence of events as the autonomous agent completes its steps.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-safe/10 text-safe">
              <Cpu className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm">Thinking Events</h3>
            <p className="text-xs text-muted leading-relaxed mt-1">
              Emitted every time the agent starts a new step or tool call. Provides immediate feedback on what the "investigator" is looking for.
            </p>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-evidence/10 text-evidence">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm">Result Events</h3>
            <p className="text-xs text-muted leading-relaxed mt-1">
              The final payload. Contains the full <strong>AuditReport</strong> object once all evidence has been synthesized and scored.
            </p>
          </div>
        </div>
      </section>

      {/* Code Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black">Consuming the Stream</h2>
        <div className="hireproof-card overflow-hidden rounded-3xl border border-border-soft">
          <div className="border-b border-border-soft bg-surface px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted">Frontend Hook Pattern</div>
          <CodeBlock 
            language="typescript"
            code={`const response = await fetch('/api/audit', { method: 'POST', body })
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const text = decoder.decode(value)
  const lines = text.split('\\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6))
      if (event.type === 'thinking') updateSteps(event.message)
      if (event.type === 'result') showFinalReport(event.data)
    }
  }
}`} 
          />
        </div>
      </section>

      {/* Benefits */}
      <section className="rounded-2xl border border-safe/20 bg-safe/5 p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-safe" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-safe">Low Latency Guarantee</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              By streaming steps as they occur, HireProof reduces <strong>Time to First Byte (TTFB)</strong> and perceived latency. Users see the agent "thinking" within 500ms, even if a full investigation takes 10+ seconds.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
