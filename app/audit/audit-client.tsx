'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, Play, Zap, Search, TrendingUp, Terminal, ShieldAlert, Network, ArrowRight, Download, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuditForm from '@/components/audit/audit-form'
import ResultScreen from '@/components/audit/result-screen'
import { SiteHeader } from '@/components/layout/site-header'
import { ErrorBoundary } from '@/components/system/error-boundary'
import { AuditSkeleton } from '@/components/audit/audit-skeleton'
import { AuditLiveProgress, type AuditProgressEvent } from '@/components/audit/audit-live-progress'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import { getFixtureByVerdict } from '@/lib/fixtures'
import { buildAuditReportV2 } from '@/lib/intelligence-v2'
import type { AuditReport, AuditRequest } from '@/lib/schemas'
import { showToast } from '@/components/system/toast'

type StreamEvent =
  | AuditProgressEvent
  | { type: 'result'; data: AuditReport }
  | { type: 'error'; message: string }

type DemoVerdict = 'safe' | 'caution' | 'high-risk'
type CostPosture = {
  publicLiveEvidence?: boolean
  byokRequiredForApiLive?: boolean
}

const DEMO_VERDICTS: DemoVerdict[] = ['high-risk', 'caution', 'safe']

function ModeTooltip({
  children,
  content,
  align = 'center',
}: {
  children: React.ReactNode
  content: string
  align?: 'left' | 'center' | 'right'
}) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showWithDelay = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 220)
  }

  const showImmediately = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(true)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  const alignmentClass = align === 'left'
    ? 'left-0'
    : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2'
  const arrowClass = align === 'left'
    ? 'left-6'
    : align === 'right'
      ? 'right-6'
      : 'left-1/2 -translate-x-1/2'

  return (
    <span
      className="relative inline-flex w-full"
      onMouseEnter={showWithDelay}
      onMouseLeave={hide}
      onFocus={showImmediately}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.span
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={`pointer-events-none absolute bottom-[calc(100%+0.65rem)] z-50 w-64 rounded-xl border border-border-soft bg-surface/95 px-4 py-3 text-center text-[10px] font-black uppercase leading-5 tracking-widest text-foreground shadow-2xl ring-1 ring-white/10 backdrop-blur-md ${alignmentClass}`}
            role="tooltip"
          >
            {content}
            <span className={`absolute top-full -mt-1 border-4 border-transparent border-t-border-soft ${arrowClass}`} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

function isDemoVerdict(value: string | null): value is DemoVerdict {
  return Boolean(value && DEMO_VERDICTS.includes(value as DemoVerdict))
}

function buildDemoReport(verdict: DemoVerdict): AuditReport {
  const fixture = getFixtureByVerdict(verdict)
  const report = buildAuditReportV2({
    id: `demo_${verdict}_${Date.now()}`,
    extractedClaims: fixture.extractedClaims,
    evidence: fixture.evidence,
    ownerId: 'demo',
    source: 'demo',
  })

  return {
    ...report,
    ...fixture,
    version: '2',
    intelligence: report.intelligence,
    mode: 'demo',
    credentialMode: 'demo',
    source: 'demo',
    publiclyListed: true,
  }
}

function chooseDemoVerdict(text: string): DemoVerdict {
  const lower = text.toLowerCase()
  if (lower.includes('80000') || lower.includes('telegram') || lower.includes('urgent')) return 'high-risk'
  if (lower.includes('unclear') || lower.includes('caution') || lower.includes('competitive')) return 'caution'
  return 'safe'
}

async function readAuditStream(response: Response, onEvent: (event: StreamEvent) => void, signal?: AbortSignal) {
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
        onEvent(parsed)

        if (parsed.type === 'log') continue
        if (parsed.type === 'result') return parsed.data
        if (parsed.type === 'error') throw new Error(parsed.message)
      }

      if (done) break
      if (signal?.aborted) throw new Error('Audit view stopped by user.')
    }
  } finally {
    reader.releaseLock()
  }

  throw new Error('Audit stream ended without a report.')
}

async function readErrorMessage(response: Response) {
  const fallback = `Audit failed with HTTP ${response.status}.`
  const text = await response.text().catch(() => '')
  if (!text) return fallback

  try {
    const parsed = JSON.parse(text) as { error?: string; message?: string }
    return parsed.error || parsed.message || fallback
  } catch {
    return text.slice(0, 200) || fallback
  }
}

const STOPPED_AUDIT_MESSAGE = 'Stopped waiting for the live audit result. You can retry or switch to demo fixtures.'

function AuditContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addReport } = useAuditHistory()
  
  const [report, setReport] = useState<AuditReport | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamLogs, setStreamLogs] = useState<string[]>([])
  const [streamEvents, setStreamEvents] = useState<AuditProgressEvent[]>([])
  const [liveMode, setLiveMode] = useState(true)
  const [costPosture, setCostPosture] = useState<CostPosture | null>(null)
  const loadedDemoRef = useRef<string | null>(null)
  const activeAuditRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/health')
      .then((res) => res.ok ? res.json() : null)
      .then((json) => {
        if (!cancelled && json?.costPosture) setCostPosture(json.costPosture)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const demo = searchParams.get('demo')
    if (!isDemoVerdict(demo)) return
    if (loadedDemoRef.current === demo) return

    const demoReport = buildDemoReport(demo)
    loadedDemoRef.current = demo
    setLiveMode(false)
    setReport(demoReport)
    setError(null)
    setStreamLogs(['Demo fixture loaded. No live source checks were run.'])
    setStreamEvents([{ type: 'log', message: 'Demo fixture loaded. No live source checks were run.', phase: 'report', status: 'complete', label: 'Demo fixture' }])
    showToast('Demo fixture loaded. Use live evidence mode for fresh source checks.', 'info')
    addReport(demoReport)
  }, [searchParams, addReport])

  const handleAudit = async (request: AuditRequest) => {
    setIsAuditing(true)
    setReport(null)
    setError(null)
    setStreamLogs([])
    setStreamEvents([{ type: 'log', message: 'Opening live evidence stream...', phase: 'intake', status: 'active', label: 'Intake' }])
    const controller = new AbortController()
    activeAuditRef.current = controller

    try {
      if (!liveMode) {
        const demoReport = buildDemoReport(chooseDemoVerdict(request.text))
        setStreamLogs(['Demo fixture loaded. No live source checks were run.'])
        setStreamEvents([{ type: 'log', message: 'Demo fixture loaded. No live source checks were run.', phase: 'report', status: 'complete', label: 'Demo fixture' }])
        showToast('Demo fixture loaded. Use live evidence mode for fresh source checks.', 'info')
        setReport(demoReport)
        addReport(demoReport)
        return
      }

      // Real API Call
      const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...request, mode: liveMode ? 'live' : 'demo' }),
          signal: controller.signal,
        })
        
        if (!res.ok) {
          throw new Error(await readErrorMessage(res))
        }
        
        const finalReport = await readAuditStream(res, (event) => {
          if (event.type === 'log') {
            setStreamLogs((logs) => [...logs, event.message].slice(-8))
            setStreamEvents((events) => [...events, event].slice(-16))
          }
        }, controller.signal)
        setReport(finalReport)
        addReport(finalReport)
    } catch (err: any) {
      if (controller.signal.aborted) {
        setError(STOPPED_AUDIT_MESSAGE)
      } else {
        setError(err.message || 'An unexpected error occurred during job verification.')
      }
    } finally {
      setIsAuditing(false)
      activeAuditRef.current = null
    }
  }

  const handleStopWaiting = () => {
    activeAuditRef.current?.abort()
    setIsAuditing(false)
    setError(STOPPED_AUDIT_MESSAGE)
    showToast('Stopped waiting for the live audit view. No result was saved.', 'info')
  }

  const reset = () => {
    setReport(null)
    setError(null)
    setStreamLogs([])
    setStreamEvents([])
    activeAuditRef.current?.abort()
    router.push('/audit')
  }

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <AnimatePresence mode="wait">
        {!isAuditing && !report && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto max-w-6xl py-8 lg:py-10"
          >
            <div className="mb-6 text-center lg:mb-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-safe">
                <Terminal className="h-4 w-4" />
                Job Verification Portal
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Check a Job <span className="text-safe">Post.</span></h1>
              <p className="mx-auto mt-3 max-w-2xl text-base font-medium text-muted sm:text-lg">
                Paste the job details below.<br />
                Our agents will cross-reference signals in real-time.
              </p>
            </div>

            {costPosture?.publicLiveEvidence === false && (
              <div className="mb-4 flex max-w-3xl items-start gap-3 rounded-2xl border border-evidence/25 bg-evidence/10 px-4 py-3 text-left text-sm font-semibold text-foreground">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-evidence" />
                <p className="leading-6">
                  <span className="font-black">Live evidence is capped.</span> Public audits stay available with deterministic checks after the hackathon; hosted live provider runs are BYOK or API-key gated to protect production costs.
                </p>
              </div>
            )}

            <div className="relative mb-4 grid w-full max-w-[17.25rem] grid-cols-2 overflow-visible rounded-xl border border-safe/25 bg-safe/10 p-1 text-xs font-black shadow-sm shadow-safe/10 lg:mb-5">
              <motion.div
                aria-hidden="true"
                animate={{ x: liveMode ? '0%' : '100%' }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg border border-safe/50 bg-safe shadow-lg shadow-safe/20"
              />
              <ModeTooltip align="left" content="Runs the real audit using configured evidence search, OCR, and model providers.">
                <button
                  type="button"
                  onClick={() => setLiveMode(true)}
                  aria-label="Use live evidence mode. Runs the real audit flow using configured evidence search, OCR, and model providers."
                  className={`relative z-10 min-h-10 w-full rounded-lg px-3 py-2 transition-colors ${liveMode ? 'text-background' : 'text-muted hover:text-safe'}`}
                >
                  <span>Live evidence</span>
                  <HelpCircle className="absolute right-1 top-1 h-3 w-3 opacity-70" aria-hidden="true" />
                </button>
              </ModeTooltip>
              <ModeTooltip align="right" content="Loads prebuilt example reports instantly for demos or credential-offline testing.">
                <button
                  type="button"
                  onClick={() => setLiveMode(false)}
                  aria-label="Use demo fixtures mode. Loads prebuilt example reports instantly for demos when live credentials are unavailable."
                  className={`relative z-10 min-h-10 w-full rounded-lg px-3 py-2 transition-colors ${!liveMode ? 'text-background' : 'text-muted hover:text-safe'}`}
                >
                  <span>Demo fixtures</span>
                  <HelpCircle className="absolute right-1 top-1 h-3 w-3 opacity-70" aria-hidden="true" />
                </button>
              </ModeTooltip>
            </div>
            
            <AuditForm onInvestigate={handleAudit} loading={isAuditing} />

            <div className="mt-8 rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-safe/10 text-safe">
                    <Network className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black">Automating job checks?</h2>
                    <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-muted">
                      Use the same audit contract from n8n, Make, LangChain, curl, or async signed webhooks before an apply agent sends user data.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:min-w-56">
                  <Link href="/docs/automations" className="hireproof-focus hireproof-cta-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black">
                    Automation docs <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="/api/downloads/hireproof-native-integrations.zip" download className="hireproof-focus inline-flex items-center justify-center gap-2 rounded-xl border border-border-soft bg-background px-4 py-2.5 text-sm font-black text-foreground transition-colors hover:bg-surface-elevated">
                    Source pack <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
            
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 rounded-2xl border border-risk-bg/20 bg-risk-bg/5 p-4 text-center text-sm font-bold text-risk-text"
              >
                {error}
              </motion.div>
            )}


          </motion.div>
        )}

        {isAuditing && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuditLiveProgress events={streamEvents} onStopWaiting={handleStopWaiting} />
          </motion.div>
        )}

        {report && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="pb-20"
          >
            <ResultScreen result={report} onBackToAudit={reset} timelineEvents={streamEvents} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AuditClient() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1600px] px-6 md:px-12 lg:px-20 xl:px-32">
        <ErrorBoundary>
          <Suspense fallback={<AuditSkeleton />}>
            <AuditContent />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
