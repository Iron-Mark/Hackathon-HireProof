'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Play, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuditForm from '@/components/audit-form'
import ResultScreen from '@/components/result-screen'
import { SiteHeader } from '@/components/site-header'
import { ErrorBoundary } from '@/components/error-boundary'
import { DEMO_FIXTURES } from '@/lib/fixtures'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import { useLiveMode } from '@/hooks/useLiveMode'
import type { AuditReport, AuditRequest } from '@/lib/schemas'

type DemoScenario = 'high-risk' | 'caution' | 'safe'

const sampleRequests = {
  'high-risk': {
    text: 'Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.',
    location: 'Philippines',
  },
  caution: {
    text: 'Software engineer role at TechStart Solutions. Competitive salary, remote or hybrid, apply through online form. Some responsibilities are unclear.',
    location: 'Philippines',
  },
  safe: {
    text: 'Senior Software Engineer at Microsoft. Hybrid role in Seattle with LinkedIn recruiter outreach and official application portal.',
    location: 'United States',
  },
}

const demoFixtures: Record<DemoScenario, AuditReport> = {
  'high-risk': DEMO_FIXTURES.highRisk,
  caution: DEMO_FIXTURES.caution,
  safe: DEMO_FIXTURES.safe,
}

export default function AuditPage() {
  const [result, setResult] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRequest, setLastRequest] = useState<AuditRequest | null>(null)
  const [agentLogs, setAgentLogs] = useState<string[]>([])
  
  const startedFromUrl = useRef(false)
  const { addReport } = useAuditHistory()
  const { isLiveMode } = useLiveMode()

  const handleInvestigate = async (data: AuditRequest, demoFixture?: AuditReport) => {
    setLoading(true)
    setError(null)
    setAgentLogs([])
    setIsDemo(!!demoFixture)

    try {
      if (demoFixture) {
        setAgentLogs(['Loading demo scenario...', 'Retrieving historical case files...', 'Finalizing report...'])
        await new Promise((resolve) => setTimeout(resolve, 900))
        const report: AuditReport = {
          id: `report_${Date.now()}`,
          timestamp: new Date().toISOString(),
          mode: 'demo',
          ...demoFixture,
        }
        setResult(report)
        addReport(report)
        return
      }

      if (!demoFixture) {
        setLastRequest(data)
      }

      const isLiveRequest = isLiveMode && !demoFixture

      const controller = new AbortController()

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, mode: isLiveRequest ? 'live' : 'demo' }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error((errBody as any)?.error || `Audit request failed (${response.status})`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                let parsed: any
                try {
                  parsed = JSON.parse(line.slice(6))
                } catch {
                  console.warn('[SSE] Malformed event, skipping:', line.slice(0, 80))
                  continue
                }
                if (parsed.type === 'log') {
                  setAgentLogs(prev => [...prev, parsed.message])
                } else if (parsed.type === 'result') {
                  const report = parsed.data as AuditReport
                  setIsDemo(report.mode !== 'live')
                  setResult(report)
                  addReport(report)
                  window.history.pushState(null, '', '/audit/' + report.id)
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.message)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }
    } catch (err) {
      console.error('[AuditPage] Investigation failed:', err)
      const fallbackReport: AuditReport = {
        ...(demoFixture || DEMO_FIXTURES.highRisk),
        id: `report_${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode: 'demo' as const,
      }
      setIsDemo(true)
      setError('Live investigation failed, so HireProof loaded the demo report instead.')
      setResult(fallbackReport)
      addReport(fallbackReport)
    } finally {
      setLoading(false)
    }
  }

  const runQuickDemo = (scenario: DemoScenario = 'high-risk') => {
    void handleInvestigate(sampleRequests[scenario], demoFixtures[scenario])
  }

  useEffect(() => {
    if (startedFromUrl.current || typeof window === 'undefined') return

    const demo = new URLSearchParams(window.location.search).get('demo')
    if (demo === 'high-risk' || demo === 'caution' || demo === 'safe') {
      startedFromUrl.current = true
      runQuickDemo(demo)
      window.history.replaceState(null, '', '/audit')
    }
  }, [])

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-background"
      >
        <SiteHeader />
        <ErrorBoundary fallbackMessage="Failed to render the investigation report. Please try a new investigation.">
          <ResultScreen result={result} isDemo={isDemo} onBackToAudit={() => setResult(null)} />
        </ErrorBoundary>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="hireproof-grid border-b border-border-soft">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="mb-3 inline-flex rounded-full bg-safe-bg px-3 py-1 text-xs font-black uppercase tracking-normal text-safe-text">
              Evidence intake
            </div>
            <h1 className="text-4xl font-black leading-tight text-balance">Investigate an opportunity</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-muted">
              Paste a job post, recruiter message, or apply URL. HireProof checks the claims and returns a verdict with receipts.
            </p>
            <button
              type="button"
              data-testid="quick-demo-main"
              aria-label="Run Quick Demo"
              onClick={() => runQuickDemo('high-risk')}
              disabled={loading}
              className="hireproof-focus mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 font-black text-white shadow-lg hover:bg-safe disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              Run quick demo
            </button>
          </motion.div>

          <AuditForm onInvestigate={handleInvestigate} loading={loading} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-10">
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden space-y-4" 
              aria-live="polite"
            >
              {/* Agent status bar */}
              <div className="rounded-2xl border border-border bg-surface shadow-sm p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black">Investigation running</p>
                    <p className="text-sm font-semibold text-muted">Agent is orchestrating tools to gather live evidence.</p>
                  </div>
                  <span className="rounded-full bg-evidence-bg px-3 py-1 text-xs font-black text-evidence animate-pulse">Agent Active</span>
                </div>
                <div className="space-y-3">
                  {agentLogs.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-background p-3 text-sm font-semibold opacity-70">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-border-soft text-xs font-black animate-pulse">...</span>
                      <span>Initializing agent...</span>
                    </div>
                  ) : (
                    agentLogs.map((step, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={index} 
                        className="flex items-center gap-3 rounded-xl border border-border-soft bg-background p-3 text-sm font-semibold"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-safe-bg text-xs font-black text-safe-text">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Skeleton cards */}
              <div className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-border-soft" />
                  <div className="flex-1 space-y-3">
                    <div className="h-7 w-48 rounded-lg bg-border-soft" />
                    <div className="h-4 w-full rounded bg-border-soft" />
                    <div className="h-4 w-3/4 rounded bg-border-soft" />
                    <div className="mt-4 h-3 w-56 rounded-full bg-border-soft" />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-border-soft bg-surface p-4 shadow-sm animate-pulse">
                    <div className="mb-2 h-3 w-20 rounded bg-border-soft" />
                    <div className="h-5 w-32 rounded bg-border-soft" />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border-soft bg-surface p-5 shadow-sm animate-pulse">
                <div className="mb-3 h-5 w-32 rounded bg-border-soft" />
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-border-soft" />
                  <div className="h-3 w-5/6 rounded bg-border-soft" />
                  <div className="h-3 w-4/6 rounded bg-border-soft" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mb-6 rounded-xl border border-caution-bg bg-caution-bg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm font-semibold text-caution-text">
              {error}
            </div>
            {lastRequest && (
              <button
                onClick={() => handleInvestigate(lastRequest)}
                className="hireproof-focus whitespace-nowrap rounded-lg bg-surface px-4 py-2 text-sm font-black text-foreground shadow-sm hover:bg-white"
              >
                Retry Investigation
              </button>
            )}
          </div>
        )}

        <div>
          <p className="mb-4 text-sm font-black text-muted">Or try a sample:</p>
          <div className="flex flex-wrap gap-3">
            <button
              data-testid="demo-high-risk-btn"
              onClick={() => runQuickDemo('high-risk')}
              disabled={loading}
              className="hireproof-focus flex items-center gap-2 rounded-full border border-risk-bg bg-risk-bg px-4 py-2 text-sm font-black text-risk-text hover:bg-white disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4 text-high-risk" />
              High-Risk
            </button>
            <button
              data-testid="demo-caution-btn"
              onClick={() => runQuickDemo('caution')}
              disabled={loading}
              className="hireproof-focus flex items-center gap-2 rounded-full border border-caution-bg bg-caution-bg px-4 py-2 text-sm font-black text-caution-text hover:bg-white disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-caution" />
              Caution
            </button>
            <button
              data-testid="demo-safe-btn"
              onClick={() => runQuickDemo('safe')}
              disabled={loading}
              className="hireproof-focus flex items-center gap-2 rounded-full border border-safe-bg bg-safe-bg px-4 py-2 text-sm font-black text-safe-text hover:bg-white disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-safe" />
              Safe
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border-soft bg-surface p-5 text-sm shadow-sm">
          <p className="font-semibold text-muted">
            <strong>Live Search Ready:</strong> Investigations use real AI extraction and SerpApi evidence when configured, with demo examples available for presentation.
          </p>
        </div>
      </div>
    </div>
  )
}
