'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Play, Zap, Search, TrendingUp, Terminal, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AuditForm from '@/components/audit-form'
import ResultScreen from '@/components/result-screen'
import { SiteHeader } from '@/components/site-header'
import { ErrorBoundary } from '@/components/error-boundary'
import { AuditSkeleton } from '@/components/audit-skeleton'
import { DEMO_FIXTURES } from '@/lib/fixtures'
import { useAuditHistory } from '@/hooks/useAuditHistory'
import { useLiveMode } from '@/hooks/useLiveMode'
import type { AuditReport, AuditRequest } from '@/lib/schemas'

type DemoScenario = 'high-risk' | 'caution' | 'safe'
type StreamEvent =
  | { type: 'log'; message: string }
  | { type: 'result'; data: AuditReport }
  | { type: 'error'; message: string }

const sampleRequests: Record<DemoScenario, AuditRequest> = {
  'high-risk': {
    text: 'Remote Frontend Intern - PHP 80,000/week. To apply, message our manager on Telegram: @ApexHiringManager. Do not apply through LinkedIn. Instant start, no interview required.',
    location: 'Philippines',
    mode: 'demo'
  },
  'caution': {
    text: 'Junior Data Analyst at Global Insights Group. We are looking for a data analyst. Pay is competitive. Send your CV to hr@globalinsights-hr.com.',
    location: 'Remote',
    mode: 'demo'
  },
  'safe': {
    text: 'Senior Frontend Engineer at Vercel. Join our team at Vercel to help build the best developer experience for the web. Apply via our official careers page at vercel.com/careers.',
    location: 'United States',
    mode: 'demo'
  }
}

function pickDemoFixture(text: string) {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('80,000') || lowerText.includes('80000') || lowerText.includes('telegram')) {
    return DEMO_FIXTURES.highRisk
  }
  if (lowerText.includes('vercel') || lowerText.includes('official careers')) {
    return DEMO_FIXTURES.safe
  }
  return DEMO_FIXTURES.caution
}

async function readAuditStream(response: Response, onEvent: (event: StreamEvent) => void) {
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

function AuditContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addReport } = useAuditHistory()
  const { isLiveMode, setLiveMode } = useLiveMode()
  
  const [report, setReport] = useState<AuditReport | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoTriggered, setDemoTriggered] = useState(false)
  const [streamLogs, setStreamLogs] = useState<string[]>([])

  // Handle demo scenario from query param
  useEffect(() => {
    const demo = searchParams.get('demo') as DemoScenario
    if (demo && sampleRequests[demo] && !demoTriggered && !report && !isAuditing) {
      setDemoTriggered(true)
      handleAudit(sampleRequests[demo])
    }
  }, [searchParams, demoTriggered, report, isAuditing])

  const handleAudit = async (request: AuditRequest) => {
    setIsAuditing(true)
    setReport(null)
    setError(null)
    setStreamLogs([])

    try {
      // In demo mode or if live mode is off, we use mock results after a delay
      if (!isLiveMode || request.mode === 'demo') {
        setStreamLogs([
          'Loading demo fixture...',
          'Mapping sample evidence to the selected scenario...',
          'Preparing deterministic report...',
        ])
        await new Promise(resolve => setTimeout(resolve, 3000))
        const mockResult: AuditReport = JSON.parse(JSON.stringify(pickDemoFixture(request.text || '')))
        
        // Customize the mock result to match input slightly
        const finalReport: AuditReport = {
          ...mockResult,
          id: `report_${Date.now()}`,
          timestamp: new Date().toISOString(),
          mode: 'demo'
        }
        
        setReport(finalReport)
        addReport(finalReport)
      } else {
        // Real API Call
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...request, mode: 'live' })
        })
        
        if (!res.ok) {
          throw new Error(await readErrorMessage(res))
        }
        
        const finalReport = await readAuditStream(res, (event) => {
          if (event.type === 'log') {
            setStreamLogs((logs) => [...logs, event.message].slice(-8))
          }
        })
        setReport(finalReport)
        addReport(finalReport)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during job verification.')
    } finally {
      setIsAuditing(false)
    }
  }

  const reset = () => {
    setReport(null)
    setError(null)
    setDemoTriggered(false)
    setStreamLogs([])
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
            className="mx-auto max-w-4xl py-12 lg:py-20"
          >
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-safe/30 bg-safe/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-safe">
                <Terminal className="h-4 w-4" />
                Job Verification Portal
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Check a Job <span className="text-safe">Post.</span></h1>
              <p className="mt-4 text-lg font-medium text-muted">
                Paste the job details below. Our agents will cross-reference signals in real-time.
              </p>
            </div>
            
            <div className="mb-6 rounded-2xl border border-border-soft bg-surface p-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setLiveMode(false)}
                  disabled={isAuditing}
                  className={`rounded-xl px-4 py-3 text-left transition ${
                    !isLiveMode ? 'bg-foreground text-background' : 'hover:bg-background'
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-widest">Demo fixtures</span>
                  <span className="mt-1 block text-xs font-semibold opacity-75">Fast seeded reports for reliable walkthroughs.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLiveMode(true)}
                  disabled={isAuditing}
                  className={`rounded-xl px-4 py-3 text-left transition ${
                    isLiveMode ? 'bg-safe text-background' : 'hover:bg-background'
                  }`}
                >
                  <span className="block text-xs font-black uppercase tracking-widest">Live evidence</span>
                  <span className="mt-1 block text-xs font-semibold opacity-75">Streams `/api/audit` events from live search and scoring.</span>
                </button>
              </div>
            </div>

            <AuditForm onInvestigate={handleAudit} loading={isAuditing} />
            
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 rounded-2xl border border-risk-bg/20 bg-risk-bg/5 p-4 text-center text-sm font-bold text-risk-text"
              >
                {error}
              </motion.div>
            )}

            {/* Quick Demo Shortcuts */}
            <div className="mt-16 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Test Scenarios</p>
              <div className="flex flex-wrap justify-center gap-4">
                {(['high-risk', 'caution', 'safe'] as DemoScenario[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAudit(sampleRequests[type])}
                    className="flex items-center gap-2 rounded-xl border border-border-soft bg-surface px-4 py-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-background hover:scale-105 active:scale-95"
                  >
                    <div className={`h-2 w-2 rounded-full ${
                      type === 'high-risk' ? 'bg-risk-text' : 
                      type === 'caution' ? 'bg-caution' : 'bg-safe'
                    }`} />
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isAuditing && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuditSkeleton />
            <div className="mx-auto -mt-4 max-w-4xl rounded-2xl border border-border-soft bg-surface p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-safe">
                  {isLiveMode ? 'Live audit stream' : 'Demo audit stream'}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                  {streamLogs.length} events
                </span>
              </div>
              <div className="space-y-2 font-mono text-xs text-muted">
                {streamLogs.length > 0 ? streamLogs.map((log, index) => (
                  <div key={`${log}-${index}`} className="rounded-lg bg-background px-3 py-2">
                    {log}
                  </div>
                )) : (
                  <div className="rounded-lg bg-background px-3 py-2">Submitting audit request...</div>
                )}
              </div>
            </div>
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
            <ResultScreen result={report} onBackToAudit={reset} isDemo={report.mode === 'demo'} />
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
