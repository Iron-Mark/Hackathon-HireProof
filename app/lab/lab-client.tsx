'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  Cpu,
  Fingerprint,
  Layers,
  RefreshCcw,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { showToast } from '@/components/system/toast'
import type { AuditReport, AuditRequest } from '@/lib/schemas'

type LabStepId = 'intake' | 'claims' | 'evidence' | 'risk' | 'report'
type LabStepStatus = 'pending' | 'active' | 'complete' | 'error'

type LabStep = {
  id: LabStepId
  label: string
  status: LabStepStatus
  msg: string
}

type StreamEvent =
  | { type: 'log'; message: string }
  | { type: 'result'; data: AuditReport }
  | { type: 'error'; message: string }

const INITIAL_STEPS: LabStep[] = [
  { id: 'intake', label: 'Intake', status: 'pending', msg: 'Awaiting job post details...' },
  { id: 'claims', label: 'Claim extraction', status: 'pending', msg: 'Role, pay, company, and contact claims will appear here.' },
  { id: 'evidence', label: 'Evidence gathering', status: 'pending', msg: 'Official web, news, comparable jobs, and local signals will stream in.' },
  { id: 'risk', label: 'Risk scoring', status: 'pending', msg: 'Signals will be scored after evidence is collected.' },
  { id: 'report', label: 'Report synthesis', status: 'pending', msg: 'The final AuditReport will render when the stream completes.' },
]

const STEP_ORDER: LabStepId[] = ['intake', 'claims', 'evidence', 'risk', 'report']

function formatElapsed(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function stepForLog(message: string): LabStepId {
  const normalized = message.toLowerCase()

  if (normalized.includes('extract') || normalized.includes('role') || normalized.includes('pay') || normalized.includes('contact')) {
    return 'claims'
  }

  if (
    normalized.includes('orchestrat') ||
    normalized.includes('checking') ||
    normalized.includes('scanning') ||
    normalized.includes('benchmark') ||
    normalized.includes('verifying') ||
    normalized.includes('research') ||
    normalized.includes('footprint') ||
    normalized.includes('news') ||
    normalized.includes('comparable') ||
    normalized.includes('local')
  ) {
    return 'evidence'
  }

  if (normalized.includes('risk') || normalized.includes('score')) {
    return 'risk'
  }

  if (normalized.includes('compil') || normalized.includes('finaliz') || normalized.includes('report') || normalized.includes('historical')) {
    return 'report'
  }

  return 'intake'
}

export function LabClient() {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [steps, setSteps] = useState<LabStep[]>(INITIAL_STEPS)
  const [logs, setLogs] = useState<string[]>([])
  const [report, setReport] = useState<AuditReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [eventCount, setEventCount] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const progress = useMemo(() => {
    if (report) return 100
    const completed = steps.filter((step) => step.status === 'complete').length
    const active = steps.findIndex((step) => step.status === 'active')
    const activeProgress = active >= 0 ? 0.5 : 0
    return Math.min(95, Math.round(((completed + activeProgress) / steps.length) * 100))
  }, [report, steps])

  const activeStep = steps.find((step) => step.status === 'active')

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-80))
  }

  const setStepActive = (stepId: LabStepId, msg: string) => {
    const activeIndex = STEP_ORDER.indexOf(stepId)

    setSteps((prev) =>
      prev.map((step) => {
        const stepIndex = STEP_ORDER.indexOf(step.id)
        return {
          ...step,
          status: stepIndex < activeIndex ? 'complete' : step.id === stepId ? 'active' : 'pending',
          msg: step.id === stepId ? msg : step.msg,
        }
      }),
    )
  }

  const completeAllSteps = () => {
    setSteps((prev) => prev.map((step) => ({ ...step, status: 'complete' })))
  }

  const markActiveStepError = (msg: string) => {
    setSteps((prev) =>
      prev.map((step) => ({
        ...step,
        status: step.status === 'active' ? 'error' : step.status,
        msg: step.status === 'active' ? msg : step.msg,
      })),
    )
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  useEffect(() => {
    if (!isProcessing || !startedAt) return

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt)
    }, 250)

    return () => window.clearInterval(timer)
  }, [isProcessing, startedAt])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const consumeStreamEvent = (parsed: StreamEvent) => {
    setEventCount((count) => count + 1)

    if (parsed.type === 'log') {
      addLog(parsed.message)
      setStepActive(stepForLog(parsed.message), parsed.message)
      return
    }

    if (parsed.type === 'result') {
      setReport(parsed.data)
      completeAllSteps()
      addLog(`Report ready: ${titleCase(parsed.data.verdict)} (${parsed.data.riskScore}/100).`)
      showToast('Investigation complete. AuditReport ready.', 'success')
      return
    }

    if (parsed.type === 'error') {
      setError(parsed.message)
      markActiveStepError(parsed.message)
      addLog(`Error: ${parsed.message}`)
    }
  }

  const runInvestigation = async () => {
    const trimmed = input.trim()
    if (!trimmed) {
      showToast('Paste job post details before running the lab.', 'info')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const start = Date.now()

    setIsProcessing(true)
    setStartedAt(start)
    setElapsedMs(0)
    setSteps(INITIAL_STEPS)
    setLogs([])
    setReport(null)
    setError(null)
    setEventCount(0)
    setStepActive('intake', 'Submitting job post to the audit stream...')
    addLog(`Starting live audit stream.`)

    try {
      const request: AuditRequest = { text: trimmed, mode: 'live' }
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      if (!response.ok) {
        let message = `Audit stream failed with HTTP ${response.status}.`
        try {
          const payload = (await response.json()) as { error?: string; message?: string }
          message = payload.error ?? payload.message ?? message
        } catch {
          // Keep the status-based message when the response is not JSON.
        }
        throw new Error(message)
      }

      if (!response.body) throw new Error('Audit stream did not return a readable body.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          buffer += decoder.decode(value, { stream: !done })
          const chunks = buffer.split('\n\n')
          buffer = chunks.pop() ?? ''

          for (const chunk of chunks) {
            const dataLine = chunk
              .split('\n')
              .find((line) => line.startsWith('data:'))

            if (!dataLine) continue
            const parsed = JSON.parse(dataLine.slice(5).trim()) as StreamEvent
            consumeStreamEvent(parsed)
          }

          if (done) break
        }
      } finally {
        reader.releaseLock()
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        addLog('Scan cancelled.')
        setError('Scan cancelled.')
      } else {
        const message = err instanceof Error ? err.message : 'Audit stream failed.'
        setError(message)
        markActiveStepError(message)
        addLog(`Error: ${message}`)
        showToast(message, 'error')
      }
    } finally {
      setIsProcessing(false)
      setElapsedMs(Date.now() - start)
      abortRef.current = null
    }
  }

  const cancelScan = () => {
    abortRef.current?.abort()
  }

  const resetScan = () => {
    abortRef.current?.abort()
    setIsProcessing(false)
    setSteps(INITIAL_STEPS)
    setLogs([])
    setReport(null)
    setError(null)
    setEventCount(0)
    setStartedAt(null)
    setElapsedMs(0)
  }

  const verdictTone =
    report?.verdict === 'high-risk'
      ? 'border-risk-text/30 bg-risk-bg/10 text-risk-text'
      : report?.verdict === 'caution'
        ? 'border-caution/30 bg-caution/10 text-caution'
        : 'border-safe/30 bg-safe/10 text-safe'

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-safe/30 hireproof-grid">
      <SiteHeader />

      <main className="mx-auto max-w-[1600px] px-6 py-12 md:px-12 lg:px-20 xl:px-32">
        <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-safe/20 bg-safe/10 text-safe shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight lg:text-5xl">Verification Lab</h1>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isProcessing ? 'animate-pulse bg-safe' : 'bg-muted'}`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-safe">Audit Pipeline</span>
                </div>
              </div>
            </div>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
              Run the same audit stream used by HireProof and watch the investigation logs resolve into a structured report.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-border-soft bg-surface p-4 text-center backdrop-blur-md">
              <div className="text-2xl font-black tabular-nums">{progress}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">Progress</div>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface p-4 text-center backdrop-blur-md">
              <div className="text-2xl font-black tabular-nums">{formatElapsed(elapsedMs)}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">Elapsed</div>
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface p-4 text-center backdrop-blur-md">
              <div className="text-2xl font-black tabular-nums">{eventCount}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted">Events</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <section className="hireproof-card relative overflow-hidden rounded-[2.5rem] p-10">
              <div className="bot-scan-line opacity-5" />

              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-safe" />
                  <h2 className="text-xl font-black">Job Post Input</h2>
                </div>

              </div>

              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste a job description, recruiter message, email, or listing details..."
                  className="h-52 w-full rounded-3xl border border-border-soft bg-background/40 p-8 pb-24 font-mono text-sm leading-relaxed text-foreground outline-none transition-all placeholder:text-muted/40 focus:border-safe/50 focus:ring-1 focus:ring-safe/20"
                />
                <div className="absolute bottom-6 right-6 flex gap-3">
                  {isProcessing ? (
                    <button
                      type="button"
                      onClick={cancelScan}
                      className="flex h-14 items-center gap-3 rounded-2xl border border-risk-text/20 bg-risk-bg/10 px-6 text-sm font-black text-risk-text transition-all hover:border-risk-text/40"
                    >
                      <AlertTriangle className="h-5 w-5" />
                      CANCEL
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={runInvestigation}
                    disabled={isProcessing}
                    className={`flex h-14 items-center gap-3 rounded-2xl bg-foreground px-8 text-sm font-black text-background transition-all hover:bg-safe hover:text-background active:scale-95 disabled:opacity-50 ${
                      isProcessing ? 'shadow-[0_0_40px_rgba(16,185,129,0.4)]' : ''
                    }`}
                  >
                    {isProcessing ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                    {isProcessing ? 'STREAMING...' : 'RUN AUDIT'}
                  </button>
                </div>
              </div>
            </section>

            <section className="hireproof-card relative overflow-hidden rounded-[2.5rem] p-10">
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-evidence" />
                  <h2 className="text-xl font-black">Verification Pipeline</h2>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                  {activeStep ? activeStep.label : report ? 'Complete' : 'Ready'}
                </div>
              </div>

              <div className="grid gap-6">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    animate={{
                      opacity: step.status === 'pending' ? 0.42 : 1,
                      x: step.status === 'active' ? 10 : 0,
                    }}
                    className={`relative flex items-center gap-6 rounded-3xl border p-6 transition-all ${
                      step.status === 'error'
                        ? 'border-risk-text/40 bg-risk-bg/10'
                        : step.status === 'active'
                          ? 'border-safe bg-safe/5 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                          : 'border-border-soft bg-surface/50'
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-black ${
                        step.status === 'complete'
                          ? 'bg-safe text-background'
                          : step.status === 'active'
                            ? 'animate-pulse bg-safe text-background'
                            : step.status === 'error'
                              ? 'bg-risk-bg text-risk-text'
                              : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {step.status === 'complete' ? <ShieldCheck className="h-6 w-6" /> : step.status === 'error' ? <AlertTriangle className="h-6 w-6" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-black uppercase tracking-widest">{step.label}</h3>
                        <span
                          className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                            step.status === 'active' ? 'text-safe' : step.status === 'error' ? 'text-risk-text' : 'text-muted/50'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${step.status === 'active' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.msg}
                      </p>
                    </div>
                    {step.status === 'active' ? (
                      <div className="hidden items-center gap-2 md:flex">
                        <div className="h-1 w-24 overflow-hidden rounded-full bg-border-soft">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="h-full bg-safe shadow-[0_0_10px_#10b981]"
                          />
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                ))}
              </div>
            </section>

            {report ? (
              <section className="hireproof-card rounded-[2.5rem] p-10">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${verdictTone}`}>
                      {titleCase(report.verdict)}
                    </div>
                    <h2 className="text-2xl font-black">{report.extractedClaims.company}</h2>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {report.extractedClaims.role} · {report.extractedClaims.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black tabular-nums">{report.riskScore}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted">Risk Score</div>
                  </div>
                </div>

                <p className="mb-6 text-sm font-medium leading-relaxed text-muted-foreground">{report.summary}</p>

                <div className="mb-8 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border-soft bg-surface p-4">
                    <div className="text-xl font-black">{report.evidence.length}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted">Evidence Items</div>
                  </div>
                  <div className="rounded-2xl border border-border-soft bg-surface p-4">
                    <div className="text-xl font-black">{report.redFlags.length}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted">Red Flags</div>
                  </div>
                  <div className="rounded-2xl border border-border-soft bg-surface p-4">
                    <div className="text-xl font-black">{titleCase(report.confidence)}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted">Confidence</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {report.id ? (
                    <Link
                      href={`/audit/${report.id}`}
                      className="inline-flex h-12 items-center gap-3 rounded-2xl bg-foreground px-6 text-sm font-black text-background transition hover:bg-safe"
                    >
                      OPEN REPORT
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={resetScan}
                    className="inline-flex h-12 items-center gap-3 rounded-2xl border border-border-soft px-6 text-sm font-black transition hover:border-safe/40"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    RESET
                  </button>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-8">
            <section className="flex h-[420px] flex-col rounded-[2.5rem] border border-border-soft bg-foreground p-8 shadow-2xl dark:bg-black">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="h-4 w-4 text-background/40 dark:text-white/40" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-background/40 dark:text-white/40">Audit Stream</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-risk-bg" />
                  <div className="h-2 w-2 rounded-full bg-caution" />
                  <div className="h-2 w-2 rounded-full bg-safe" />
                </div>
              </div>

              <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto font-mono text-[10px]">
                {logs.length === 0 ? (
                  <div className="py-20 text-center italic text-background/15 dark:text-white/15">Awaiting audit events...</div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={`${log}-${i}`}
                      className="flex gap-3 border-l border-background/5 pl-3 leading-relaxed text-background/60 dark:border-white/5 dark:text-white/60"
                    >
                      <span className="shrink-0 text-background/20 dark:text-white/20">[{i}]</span>
                      <span className={log.includes('Report ready') ? 'text-safe' : log.includes('Error') ? 'text-risk-text' : ''}>{log}</span>
                    </motion.div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </section>

            <section className="hireproof-card rounded-[2.5rem] p-8">
              <div className="mb-8 flex items-center gap-3">
                <Activity className="h-4 w-4 text-evidence" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Audit Telemetry</h3>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Mode', value: titleCase('live') },
                  { label: 'Events', value: eventCount.toString() },
                  { label: 'Evidence', value: report ? report.evidence.length.toString() : '-' },
                  { label: 'Red flags', value: report ? report.redFlags.length.toString() : '-' },
                  { label: 'Elapsed', value: formatElapsed(elapsedMs) },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between rounded-2xl border border-border-soft bg-surface p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">{stat.label}</span>
                    <span className="text-sm font-black">{stat.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {error ? (
              <section className="rounded-[2rem] border border-risk-text/25 bg-risk-bg/10 p-6 text-risk-text">
                <div className="mb-2 flex items-center gap-2 text-sm font-black">
                  <AlertTriangle className="h-4 w-4" />
                  Stream Error
                </div>
                <p className="text-sm font-medium">{error}</p>
              </section>
            ) : null}

            <section className="grid gap-4">
              <Link className="group flex items-center justify-between rounded-3xl border border-border-soft bg-surface p-6 text-sm font-black transition-all hover:border-safe/30 hover:bg-background" href="/history">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-safe/10 p-2 text-safe">
                    <Clock className="h-4 w-4" />
                  </div>
                  Audit History
                </div>
                <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
              <Link className="group flex items-center justify-between rounded-3xl border border-border-soft bg-surface p-6 text-sm font-black transition-all hover:border-evidence/30 hover:bg-background" href="/trends">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-evidence/10 p-2 text-evidence">
                    <Activity className="h-4 w-4" />
                  </div>
                  Pattern Trends
                </div>
                <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
