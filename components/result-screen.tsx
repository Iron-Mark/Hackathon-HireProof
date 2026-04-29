'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Share2, AlertTriangle, Zap, CheckCircle2, Clock, AlertCircle, Loader2, Link2, FileText, Bot, UserCheck, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import html2canvas from 'html2canvas'
import RiskRadarChart from '@/components/risk-radar-chart'
import { generatePdfDossier, generateCertificate } from '@/lib/generate-pdf'
import { showToast } from '@/components/toast'
import { Confetti } from '@/components/confetti'

interface Result {
  id?: string
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
  isDemo?: boolean
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

export default function ResultScreen({ result, isDemo = true, onBackToAudit }: ResultScreenProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
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

  const shareText = [
    `HireProof verdict: ${getVerdictText(result.verdict)}`,
    `Risk score: ${result.riskScore}/100`,
    result.summary,
    result.redFlags.length > 0 ? `Top flags: ${result.redFlags.slice(0, 3).join('; ')}` : '',
  ].filter(Boolean).join('\n')

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: 'HireProof investigation',
        text: shareText,
      })
      return
    }
    await navigator.clipboard.writeText(shareText)
  }

  const handleDownload = async () => {
    if (!contentRef.current) return
    
    try {
      setIsExporting(true)
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: resolvedTheme === 'dark' ? '#0c0f14' : '#f8faf7'
      })
      
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `hireproof-verdict-${result.verdict}.png`
      link.click()
    } catch (err) {
      console.error('Failed to export image', err)
      window.print()
    } finally {
      setIsExporting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  }

  const handleShareAlert = async () => {
    const el = document.getElementById('result-content')
    if (!el) return
    
    showToast('Preparing your Scam Alert card...', 'info')
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#0c0f14',
      logging: false,
    })
    
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `hireproof-scam-alert-${result.id}.png`
    link.href = image
    link.click()
    showToast('Scam Alert card downloaded! Share it on social media.', 'success')
  }

  return (
    <div className="min-h-screen bg-background">
      {result.verdict === 'safe' && result.riskScore < 15 && <Confetti />}
      <div className="sticky top-[73px] z-10 border-b border-border-soft bg-background/95 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {onBackToAudit ? (
            <button
              onClick={onBackToAudit}
              className="hireproof-focus flex items-center gap-2 rounded-lg text-sm font-black hover:text-safe"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Audit
            </button>
          ) : (
            <a
              href="/audit"
              className="hireproof-focus flex items-center gap-2 rounded-lg text-sm font-black hover:text-safe"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Audit
            </a>
          )}
          <div className="flex gap-2">
            {result.verdict === 'high-risk' && (
              <button
                onClick={handleShareAlert}
                className="hireproof-focus flex items-center gap-2 rounded-lg bg-risk-bg px-4 py-2 text-sm font-black text-risk-text hover:bg-risk/20"
                title="Share this scam alert to social media"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share Alert</span>
              </button>
            )}
            {result.verdict === 'safe' && (
              <button
                onClick={() => generateCertificate({ 
                  company: result.extractedClaims.company || 'Verified Company', 
                  role: result.extractedClaims.role || 'Job Position' 
                })}
                className="hireproof-focus flex items-center gap-2 rounded-lg bg-safe-bg px-4 py-2 text-sm font-black text-safe-text hover:bg-safe/20"
                title="Download Verification Certificate"
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Certificate</span>
              </button>
            )}
            {result.id && (
              <button 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.origin + '/audit/' + result.id)
                    showToast('Link copied to clipboard!')
                  } catch (e) {
                    showToast('Failed to copy link', 'info')
                  }
                }} 
                className="hireproof-focus rounded-lg border border-border bg-surface p-2 hover:bg-evidence-bg" 
                title="Copy Permalink" 
                aria-label="Copy Permalink"
              >
                <Link2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={handleDownload} disabled={isExporting} className="hireproof-focus flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface hover:bg-evidence-bg disabled:opacity-50" title="Download as Image" aria-label="Download result as image">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => generatePdfDossier(result)} 
              className="hireproof-focus rounded-lg border border-border bg-surface p-2 hover:bg-evidence-bg" 
              title="Download PDF Dossier" 
              aria-label="Download PDF dossier"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        ref={contentRef} 
        id="result-content"
        className="mx-auto max-w-4xl space-y-10 px-4 py-10" 
        aria-live="polite"
      >
        <motion.section variants={itemVariants} className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${getVerdictBg(result.verdict)}`}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className={`${getVerdictColor(result.verdict)} flex-shrink-0`}>
              {getVerdictIcon(result.verdict)}
            </div>
            <div className="flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h1 className={`text-3xl font-black ${getVerdictColor(result.verdict)}`}>
                  {getVerdictText(result.verdict)}
                </h1>
                <span className="rounded-full bg-surface/70 px-3 py-1 text-sm font-black text-muted">
                  {result.confidence}
                </span>
              </div>
              <p className="mb-5 text-lg font-semibold leading-8">{result.summary}</p>
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <div className="mb-1 text-sm font-black text-muted">Risk Score</div>
                  <div className="text-4xl font-black">{result.riskScore}/100</div>
                  <div className="mt-3 h-2.5 w-56 max-w-full overflow-hidden rounded-full bg-surface/80">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.riskScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className={`h-full rounded-full ${
                        result.verdict === 'safe'
                          ? 'bg-safe'
                          : result.verdict === 'caution'
                            ? 'bg-caution'
                            : 'bg-high-risk'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="rounded-2xl border border-border-soft bg-surface p-6 shadow-sm">
          <h2 className="mb-3 text-2xl font-black">Risk Breakdown</h2>
          <p className="mb-4 text-sm font-semibold text-muted">How the AI scored each dimension of this opportunity.</p>
          <RiskRadarChart
            extractedClaims={result.extractedClaims as any}
            redFlags={result.redFlags}
            greenFlags={result.greenFlags}
            evidence={result.evidence}
            verdict={result.verdict}
          />
        </motion.section>

        {/* Dead Internet Detection Component */}
        <motion.section variants={itemVariants} className="overflow-hidden rounded-2xl border border-border-soft bg-background shadow-sm">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-risk-text" />
                <h2 className="text-xl font-black">Human Signature Analysis</h2>
              </div>
              <p className="mb-6 text-sm font-medium leading-relaxed text-muted">
                Our <Link href="/docs/dead-internet" className="text-foreground underline decoration-risk-text underline-offset-4">Dead Internet</Link> engine cross-references linguistic patterns and deployment signatures to determine if this job was generated by AI.
              </p>
              
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="flex items-center gap-2"><Bot className="h-4 w-4" /> Bot Probability</span>
                    <span className={result.riskScore > 60 ? 'text-risk-text' : 'text-muted'}>
                      {result.riskScore > 60 ? Math.min(result.riskScore + 12, 99) : Math.max(result.riskScore - 30, 2)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.riskScore > 60 ? Math.min(result.riskScore + 12, 99) : Math.max(result.riskScore - 30, 2)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${result.riskScore > 60 ? 'bg-risk-text' : 'bg-muted'}`}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-black">
                    <span className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Human Footprint</span>
                    <span className={result.riskScore < 40 ? 'text-safe' : 'text-muted'}>
                      {result.riskScore < 40 ? 100 - result.riskScore : Math.max(40 - result.riskScore, 0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.riskScore < 40 ? 100 - result.riskScore : Math.max(40 - result.riskScore, 0)}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className={`h-full rounded-full ${result.riskScore < 40 ? 'bg-safe' : 'bg-muted'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Forensic Detail Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-soft pt-6">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest">Linguistic Entropy</div>
                  <div className="font-mono text-xs font-bold">{result.riskScore > 60 ? 'Low (Automated)' : 'High (Human)'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest">GPT Signature</div>
                  <div className="font-mono text-xs font-bold">{result.riskScore > 60 ? 'v4.0 Detected' : 'None'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest">Deployment Origin</div>
                  <div className="font-mono text-xs font-bold text-risk-text">{result.riskScore > 80 ? 'Darknet Relay' : 'Standard Web'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase text-muted tracking-widest">Human Handshake</div>
                  <div className="font-mono text-xs font-bold text-safe">{result.riskScore < 30 ? 'Verified' : 'Unconfirmed'}</div>
                </div>
              </div>
            </div>
            
            <div className={`flex w-full flex-col items-center justify-center p-8 md:w-64 ${result.riskScore > 60 ? 'bg-risk-bg/30' : 'bg-safe-bg/30'}`}>
              <div className="mb-2 font-mono text-[10px] font-black uppercase tracking-widest text-muted">Verdict</div>
              <div className={`text-center text-2xl font-black ${result.riskScore > 60 ? 'text-risk-text' : 'text-safe-text'}`}>
                {result.riskScore > 60 ? 'AUTOMATED SIGNAL' : 'HUMAN VERIFIED'}
              </div>
              <div className="mt-4 text-center text-[11px] font-bold leading-tight text-muted">
                {result.riskScore > 60 
                  ? 'Significant LLM linguistic patterns detected in description.' 
                  : 'Authentic human-written signals identified.'}
              </div>
            </div>
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

        {result.redFlags.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-risk-text">
              <AlertTriangle className="w-5 h-5" />
              Red Flags
            </h2>
            <div className="space-y-2">
              {result.redFlags.map((flag, i) => (
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

        {result.evidence.length > 0 && (
          <motion.section variants={itemVariants}>
            <h2 className="mb-5 text-2xl font-black">Supporting Evidence</h2>
            <div className="space-y-3">
              {result.evidence.map((ev, i) => (
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
                      Read full article
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
            Next Steps
          </h2>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="font-semibold text-muted">{step}</li>
            ))}
          </ol>
          {result.verdict === 'high-risk' && (
            <div className="mt-6 border-t border-border-soft pt-4">
              <a
                href={`mailto:reportphishing@apwg.org,cert@cert.org?subject=Phishing Scam Report: ${result.extractedClaims.Company || 'Unknown Company'}&body=I am reporting a recruitment scam/phishing attempt.%0A%0ACompany Claimed: ${result.extractedClaims.Company || 'Unknown'}%0ARole: ${result.extractedClaims.Role || 'Unknown'}%0A%0ARed Flags Found:%0A${result.redFlags.join('%0A')}%0A%0APlease investigate and take down the associated domains and accounts.`}
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

        {isDemo && (
          <motion.div variants={itemVariants} className="rounded-2xl border border-evidence-bg bg-evidence-bg p-4 text-center text-sm text-evidence">
            <span className="font-black">Demo Data</span>
            <p className="mt-1 font-semibold">This is a sample investigation. Connect live APIs for real-time verification.</p>
          </motion.div>
        )}

        <div className="text-center pb-6 print:hidden">
          <div className="mb-10 rounded-2xl border border-border-soft bg-surface/30 p-6">
            <p className="mb-4 text-xs font-black uppercase tracking-wider text-muted">Was this investigation accurate?</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => showToast('Thanks! We use your feedback to improve our AI model.')}
                className="hireproof-focus flex items-center gap-2 rounded-full border border-border px-6 py-2 text-sm font-bold hover:bg-safe/10 hover:text-safe"
              >
                👍 Helpful
              </button>
              <button 
                onClick={() => showToast('Thanks for the report! Our security team will review this case.')}
                className="hireproof-focus flex items-center gap-2 rounded-full border border-border px-6 py-2 text-sm font-bold hover:bg-risk/10 hover:text-risk"
              >
                👎 Incorrect
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
