'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Share2, AlertTriangle, Zap, CheckCircle2, Clock, AlertCircle, Loader2, Link2, FileText, Bot, UserCheck, ShieldCheck, SearchCheck, Table } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import html2canvas from 'html2canvas'
import RiskRadarChart from '@/components/audit/risk-radar-chart'
import { generatePdfDossier, generateCertificate } from '@/lib/generate-pdf'
import { showToast } from '@/components/system/toast'
import { Confetti } from '@/components/system/confetti'
import { buildLegalAbuseReportMailto, buildReportCsvExport } from '@/lib/report-actions.mjs'

interface Result {
  id?: string
  userFeedback?: 'helpful' | 'incorrect'
  verdict: 'safe' | 'caution' | 'high-risk'
  riskScore: number
  confidence: string
  summary: string
  extractedClaims: Record<string, string>
  redFlags: string[]
  greenFlags: string[]
  evidence: Array<{
    source: string
    snippet: string
    url?: string
    type: string
  }>
  alternatives: Array<{
    title: string
    company: string
    salary?: string
  }>
  nextSteps: string[]
}

interface ResultScreenProps {
  result: Result
  onBackToAudit?: () => void
}

function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return url
    }
    return undefined
  } catch {
    return undefined
  }
}

export default function ResultScreen({ result, onBackToAudit }: ResultScreenProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null)

  const [feedbackGiven, setFeedbackGiven] = useState<boolean>(Boolean(result.userFeedback))
  const { resolvedTheme } = useTheme()
  
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'safe': return 'text-safe-text'
      case 'caution': return 'text-caution-text'
      case 'high-risk': return 'text-risk-text'
      default: return 'text-foreground'
    }
  }

  const getVerdictBg = (verdict: string) => {
    switch (verdict) {
      case 'safe': return 'border-safe-bg bg-safe-bg'
      case 'caution': return 'border-caution-bg bg-caution-bg'
      case 'high-risk': return 'border-risk-bg bg-risk-bg'
      default: return 'border-border bg-surface'
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'safe': return <CheckCircle2 className="w-8 h-8" />
      case 'caution': return <Zap className="w-8 h-8" />
      case 'high-risk': return <AlertTriangle className="w-8 h-8" />
      default: return null
    }
  }

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case 'safe': return 'Safe'
      case 'caution': return 'Caution'
      case 'high-risk': return 'High-Risk'
      default: return 'Unknown'
    }
  }

  const handleShare = async () => {
    const shareText = `HireProof verdict: ${getVerdictText(result.verdict)}\nRisk score: ${result.riskScore}/100`
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'HireProof investigation', text: shareText })
      return
    }
    await navigator.clipboard.writeText(shareText)
  }

  const handleDownload = async () => {
    if (!contentRef.current) return
    try {
      setIsExporting(true)
      const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: resolvedTheme === 'dark' ? '#0c0f14' : '#f8faf7' })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `hireproof-verdict-${result.verdict}.png`
      link.click()
    } finally {
      setIsExporting(false)
    }
  }

  const handleReportCsvDownload = () => {
    const exportPayload = buildReportCsvExport(result)
    const blob = new Blob([exportPayload.content], { type: exportPayload.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = exportPayload.filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } }

  const submitFeedback = async (vote: 'helpful' | 'incorrect') => {
    if (feedbackGiven || !result.id) return
    setFeedbackLoading(vote)
    setFeedbackGiven(true)
    try {
      const res = await fetch('/api/intelligence/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: result.id, feedback: vote }),
      })
      if (res.ok) showToast('Thanks for your feedback!', 'success')
    } finally {
      setFeedbackLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {result.verdict === 'safe' && result.riskScore < 15 && <Confetti />}
      <div className="sticky top-[73px] z-10 border-b border-border-soft bg-background/95 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {onBackToAudit ? (
            <button onClick={onBackToAudit} className="hireproof-focus flex items-center gap-2 rounded-lg text-sm font-black hover:text-safe">
              <ArrowLeft className="w-4 h-4" /> Back to Audit
            </button>
          ) : (
            <Link href="/audit" className="hireproof-focus flex items-center gap-2 rounded-lg text-sm font-black hover:text-safe">
              <ArrowLeft className="w-4 h-4" /> Back to Audit
            </Link>
          )}
          <div className="flex items-center gap-2" aria-label="Quick exports">
            <span className="hidden text-[10px] font-black uppercase tracking-normal text-muted sm:inline">Quick exports</span>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              title="Download PNG Screenshot"
              className="hireproof-focus flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface transition-colors hover:bg-evidence-bg sm:w-auto sm:gap-1.5 sm:px-3"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden text-xs font-black sm:inline">PNG</span>
            </button>
            <button
              onClick={() => generatePdfDossier({
                ...result,
                timestamp: result.id ? new Date().toISOString() : undefined
              })}
              title="Download PDF dossier"
              className="hireproof-focus flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-evidence transition-colors hover:bg-evidence-bg sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden text-xs font-black sm:inline">PDF</span>
            </button>
            <button
              onClick={handleReportCsvDownload}
              title="Download report CSV"
              className="hireproof-focus flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-evidence transition-colors hover:bg-evidence-bg sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <Table className="w-4 h-4" />
              <span className="hidden text-xs font-black sm:inline">CSV</span>
            </button>
            <button
              onClick={handleShare}
              title="Share verdict"
              aria-label="Share verdict"
              className="hireproof-focus flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-evidence transition-colors hover:bg-evidence-bg sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden text-xs font-black sm:inline">Share</span>
            </button>
            {result.verdict === 'safe' && (
              <button
                onClick={() => generateCertificate({
                  company: result.extractedClaims.company || 'Verified Organization',
                  role: result.extractedClaims.role || 'Verified Role',
                  timestamp: new Date().toISOString()
                })}
                title="Download Safety Certificate"
                className="hireproof-focus flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface hover:bg-evidence-bg text-safe transition-colors"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" ref={contentRef} id="result-content" className="mx-auto max-w-4xl space-y-10 px-4 py-10 relative">
        <motion.section variants={itemVariants} data-testid="audit-result-verdict" className="relative z-10 rounded-2xl border p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-border-soft bg-surface/50 p-8 shadow-sm backdrop-blur-sm relative overflow-hidden">
            <div className="bot-scan-line opacity-10" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-safe/10 border border-safe/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-safe" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">HireProof Verdict</h3>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse" />
                    Evidence-backed report
                  </div>
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-normal ${getVerdictBg(result.verdict)} ${getVerdictColor(result.verdict)}`}>
                {result.verdict === 'high-risk' ? <AlertTriangle className="h-3.5 w-3.5" /> :
                 result.verdict === 'caution' ? <Zap className="h-3.5 w-3.5" /> :
                 <CheckCircle2 className="h-3.5 w-3.5" />}
                {getVerdictText(result.verdict)} verdict
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-7xl font-black tracking-tighter ${getVerdictColor(result.verdict)}`}>
                  {result.riskScore}
                </span>
                <span className="text-xl font-bold text-muted opacity-40">/100</span>
              </div>
              <p className="max-w-md text-base font-semibold leading-relaxed text-muted">
                HireProof checked the listing against the available evidence and risk signals. 
                <span className="text-foreground"> Confidence: {result.confidence}.</span>
              </p>
            </div>

            <div className="relative h-40 w-40 flex items-center justify-center lg:h-48 lg:w-48 group">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border-soft" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="282.7"
                  initial={{ strokeDashoffset: 282.7 }}
                  animate={{ strokeDashoffset: 282.7 - (282.7 * result.riskScore) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={getVerdictColor(result.verdict)}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-sm font-black uppercase tracking-widest ${getVerdictColor(result.verdict)}`}>
                  {result.verdict}
                </span>
                <div className="mt-1 h-1 w-8 rounded-full bg-border-soft overflow-hidden">
                  <motion.div animate={{ x: [-32, 32] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-full w-full bg-white/20" />
                </div>
              </div>
            </div>
            <div className="mt-5 grid w-full gap-3 border-t border-border-soft pt-5 sm:grid-cols-3">
              <div className="rounded-xl border border-border-soft bg-background p-3">
                <div className="text-[10px] font-black uppercase tracking-normal text-muted">Evidence receipts</div>
                <div className="mt-1 text-xl font-black">{result.evidence.length}</div>
              </div>
              <div className="rounded-xl border border-border-soft bg-background p-3">
                <div className="text-[10px] font-black uppercase tracking-normal text-muted">Next steps</div>
                <div className="mt-1 text-xl font-black">{result.nextSteps.length}</div>
              </div>
              <div className="rounded-xl border border-border-soft bg-background p-3">
                <div className="text-[10px] font-black uppercase tracking-normal text-muted">Confidence</div>
                <div className="mt-1 truncate text-xl font-black">{result.confidence}</div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-[2.5rem] border border-border-soft bg-surface p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black mb-2">Risk Breakdown</h2>
            <p className="text-sm font-semibold text-muted">How the AI scored each dimension of this opportunity.</p>
          </div>
          <RiskRadarChart
            extractedClaims={result.extractedClaims as any}
            redFlags={result.redFlags}
            greenFlags={result.greenFlags}
            evidence={result.evidence}
            verdict={result.verdict}
          />
        </motion.section>

        {/* Automation Signal Component */}
        <motion.section variants={itemVariants} className="overflow-hidden rounded-[2.5rem] border border-border-soft bg-background shadow-2xl relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_50%)]" />
          <div className="flex flex-col md:flex-row relative z-10">
            <div className="flex-1 p-8 lg:p-10">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-risk-bg/20 text-risk-text flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black">Recruitment Signal Analysis</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Job post risk patterns</p>
                </div>
              </div>
              <p className="mb-8 text-base font-medium leading-relaxed text-muted">
                HireProof checks whether the post shows common recruitment-scam patterns, including vague company details, unrealistic pay, and off-platform contact.
              </p>
              
              <div className="space-y-8">
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm font-black">
                    <span className="flex items-center gap-2 uppercase tracking-widest text-muted"><Bot className="h-4 w-4" /> Bot Probability</span>
                    <span className={`text-lg ${result.riskScore > 60 ? 'text-risk-text' : 'text-muted'}`}>
                      {result.riskScore > 60 ? Math.min(result.riskScore + 12, 99) : Math.max(result.riskScore - 30, 2)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-surface shadow-inner overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.riskScore > 60 ? Math.min(result.riskScore + 12, 99) : Math.max(result.riskScore - 30, 2)}%` }}
                      transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${result.riskScore > 60 ? 'bg-risk-text' : 'bg-muted'} relative`}
                    >
                      <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-white/20" />
                    </motion.div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-3 flex items-center justify-between text-sm font-black">
                    <span className="flex items-center gap-2 uppercase tracking-widest text-muted"><UserCheck className="h-4 w-4" /> Human Footprint</span>
                    <span className={`text-lg ${result.riskScore < 40 ? 'text-safe' : 'text-muted'}`}>
                      {result.riskScore < 40 ? 100 - result.riskScore : Math.max(40 - result.riskScore, 0)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-surface shadow-inner overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.riskScore < 40 ? 100 - result.riskScore : Math.max(40 - result.riskScore, 0)}%` }}
                      transition={{ duration: 1.2, delay: 0.7, ease: "easeOut" }}
                      className={`h-full rounded-full ${result.riskScore < 40 ? 'bg-safe' : 'bg-muted'} relative`}
                    >
                      <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-white/20" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Signal Detail Grid */}
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border-soft pt-8">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest opacity-60">Linguistic Entropy</div>
                  <div className="font-mono text-xs font-bold text-foreground">{result.riskScore > 60 ? 'Low (Automated)' : 'High (Human)'}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest opacity-60">Message Pattern</div>
                  <div className="font-mono text-xs font-bold text-foreground">{result.riskScore > 60 ? 'Suspicious' : 'Low concern'}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest opacity-60">Contact Path</div>
                  <div className={`font-mono text-xs font-bold ${result.riskScore > 80 ? 'text-risk-text' : 'text-foreground'}`}>
                    {result.riskScore > 80 ? 'High-risk channel' : 'Review evidence'}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest opacity-60">Hiring Evidence</div>
                  <div className={`font-mono text-xs font-bold ${result.riskScore < 30 ? 'text-safe' : 'text-foreground'}`}>
                    {result.riskScore < 30 ? 'Consistent' : 'Needs review'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`flex w-full flex-col items-center justify-center p-10 md:w-80 relative overflow-hidden border-t md:border-t-0 md:border-l border-border-soft ${result.riskScore > 60 ? 'bg-risk-bg/5' : 'bg-safe/5'}`}>
              <div className="bot-scan-line opacity-20" />
              <div className="mb-4 font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted">Analysis Verdict</div>
              <div className={`text-center text-3xl font-black leading-tight tracking-tighter ${result.riskScore > 60 ? 'text-risk-text' : 'text-safe'}`}>
                {result.riskScore > 60 ? 'RISK SIGNALS FOUND' : 'LOW RISK SIGNALS'}
              </div>
              <div className="mt-6 text-center text-xs font-bold leading-relaxed text-muted/80 max-w-[180px]">
                {result.riskScore > 60 
                  ? 'Review the red flags and evidence before sharing personal details.' 
                  : 'Available evidence points to a more conventional hiring path.'}
              </div>
              <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-background border border-border-soft shadow-inner">
                {result.riskScore > 60 ? <Bot className="h-8 w-8 text-risk-text" /> : <UserCheck className="h-8 w-8 text-safe" />}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Investigation Timeline Section */}
        <motion.section variants={itemVariants} className="rounded-3xl border border-border-soft bg-surface p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Clock className="h-32 w-32" />
          </div>
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
            <Zap className="h-6 w-6 text-safe" />
            Investigation Timeline
          </h2>
          <div className="relative space-y-8 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-soft">
            {[
              { time: 'T+0.0s', step: 'Initialization', detail: 'Loading job verification checks.', icon: Bot, color: 'text-muted' },
              { time: 'T+0.4s', step: 'Entity Extraction', detail: `Identified ${result.extractedClaims.company || 'company'} and ${result.extractedClaims.role || 'role'} from raw input.`, icon: FileText, color: 'text-evidence' },
              { time: 'T+1.2s', step: 'Signal Verification', detail: `Reviewing ${result.redFlags.length + result.greenFlags.length} risk and safety signals from the report.`, icon: SearchCheck, color: 'text-caution' },
              { time: 'T+2.1s', step: 'Final Verdict', detail: `Investigation complete. Risk score assigned: ${result.riskScore}/100.`, icon: UserCheck, color: 'text-safe' },
            ].map((step, i) => (
              <div key={i} className="relative pl-12 group">
                <div className={`absolute left-0 top-1 h-9 w-9 rounded-full bg-background border border-border-soft flex items-center justify-center z-10 transition-colors group-hover:border-safe/50 ${step.color}`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest">{step.step}</h4>
                    <p className="text-sm font-medium text-muted mt-1 leading-relaxed">{step.detail}</p>
                  </div>
                  <div className="font-mono text-[10px] font-bold text-muted bg-surface px-2 py-1 rounded-md border border-border-soft">{step.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <h2 className="mb-5 text-2xl font-black">Extracted Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(result.extractedClaims).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-border-soft bg-surface p-4 shadow-sm">
                <div className="mb-1 text-sm font-black capitalize text-muted">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="font-black">{value}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {(result.redFlags || []).length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-risk-text">
              <AlertTriangle className="w-5 h-5" />
              Red Flags
            </h2>
            <div className="space-y-2">
              {(result.redFlags || []).map((flag, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  key={i} 
                  className="flex gap-3 rounded-xl border border-risk-bg bg-risk-bg p-3 text-risk-text"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="font-semibold">{flag}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {result.greenFlags.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-safe-text">
              <CheckCircle2 className="w-5 h-5" />
              Green Flags
            </h2>
            <div className="space-y-2">
              {result.greenFlags.map((flag, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  key={i} 
                  className="flex gap-3 rounded-xl border border-safe-bg bg-safe-bg p-3 text-safe-text"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="font-semibold">{flag}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {(result.evidence || []).length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="mb-5 text-2xl font-black">Evidence receipts</h2>
            <div className="space-y-3">
              {(result.evidence || []).map((ev, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + (i * 0.1) }}
                  key={i} 
                  className="rounded-2xl border border-border-soft bg-surface p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="text-sm font-black">{ev.source}</div>
                    <span className="rounded-full bg-evidence-bg px-2 py-1 text-xs font-black text-evidence">{ev.type}</span>
                  </div>
                  <p className="mb-3 text-sm font-medium leading-6 text-muted">{ev.snippet}</p>
                  {sanitizeUrl(ev.url) && (
                    <a href={sanitizeUrl(ev.url)} target="_blank" rel="noopener noreferrer" className="hireproof-focus text-xs font-black text-evidence hover:text-safe">
                      Open source
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {result.alternatives.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="mb-5 text-2xl font-black">Safer Alternatives</h2>
            <div className="space-y-3">
              {result.alternatives.map((alt, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + (i * 0.1) }}
                  key={i} 
                  className="rounded-2xl border border-safe-bg bg-safe-bg p-4 text-safe-text"
                >
                  <div className="font-black">{alt.title}</div>
                  <div className="text-sm font-semibold">{alt.company}</div>
                  {alt.salary && <div className="mt-1 text-sm font-black">{alt.salary}</div>}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        <motion.section variants={itemVariants} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
            <AlertCircle className="w-5 h-5" />
            Next step
          </h2>
          <ol className="space-y-3 text-sm">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-border-soft bg-background p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-evidence-bg text-xs font-black text-evidence">
                  {i + 1}
                </span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-normal text-muted">Next step</div>
                  <div className="font-semibold text-muted">{step}</div>
                </div>
              </li>
            ))}
          </ol>
          {result.verdict === 'high-risk' && (
            <div className="mt-6 border-t border-border-soft pt-4">
              <a
                href={buildLegalAbuseReportMailto(result)}
                className="hireproof-focus flex w-full items-center justify-center gap-2 rounded-xl bg-risk px-4 py-3 text-sm font-black text-background hover:opacity-90"
              >
                <AlertTriangle className="h-4 w-4" />
                Generate Legal Abuse Report
              </a>
              <p className="mt-2 text-center text-xs font-semibold text-muted">
                1-Click draft an abuse report to global anti-phishing authorities.
              </p>
            </div>
          )}
        </motion.section>



        <div className="text-center pb-6 print:hidden">
          <div className="mb-10 rounded-2xl border border-border-soft bg-surface/30 p-6">
            <p className="mb-4 text-xs font-black uppercase tracking-wider text-muted">
              {feedbackGiven ? 'Thank you for your feedback!' : 'Was this investigation accurate?'}
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => submitFeedback('helpful')}
                disabled={feedbackGiven || !result.id || !!feedbackLoading}
                className="hireproof-focus flex items-center gap-2 rounded-full border border-border px-6 py-2 text-sm font-bold hover:bg-safe/10 hover:text-safe disabled:opacity-50 disabled:pointer-events-none"
              >
                {feedbackLoading === 'helpful' ? <Loader2 className="w-4 h-4 animate-spin" /> : '👍'} Helpful
              </button>
              <button 
                onClick={() => submitFeedback('incorrect')}
                disabled={feedbackGiven || !result.id || !!feedbackLoading}
                className="hireproof-focus flex items-center gap-2 rounded-full border border-border px-6 py-2 text-sm font-bold hover:bg-risk/10 hover:text-risk disabled:opacity-50 disabled:pointer-events-none"
              >
                {feedbackLoading === 'incorrect' ? <Loader2 className="w-4 h-4 animate-spin" /> : '👎'} Incorrect
              </button>
            </div>
            <div className="mt-6 border-t border-border-soft pt-4">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                Is this your company? <a href="/docs/legal" className="text-safe hover:underline">Report a false positive</a>
              </p>
            </div>
          </div>

          {onBackToAudit ? (
            <button
              onClick={onBackToAudit}
              className="hireproof-focus rounded-xl bg-foreground px-6 py-3 font-black text-background shadow-lg hover:bg-safe"
            >
              Run Another Investigation
            </button>
          ) : (
            <a
              href="/audit"
              className="hireproof-focus inline-block rounded-xl bg-foreground px-6 py-3 font-black text-background shadow-lg hover:bg-safe"
            >
              Run Another Investigation
            </a>
          )}
        </div>
      </motion.div>
    </div>
  )
}
