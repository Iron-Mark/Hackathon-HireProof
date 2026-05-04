'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Share2, AlertTriangle, Zap, CheckCircle2, Clock, AlertCircle, Loader2, Link2, FileText, Bot, UserCheck, ShieldCheck, SearchCheck, Table, Camera, Eye, EyeOff, ChevronDown, ListTree, ThumbsUp, ThumbsDown } from 'lucide-react'
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
  userFeedbackReason?: string
  verdict: 'safe' | 'caution' | 'high-risk'
  riskScore: number
  confidence: string
  summary: string
  mode?: 'live' | 'demo'
  credentialMode?: string
  source?: string
  extractedClaims: Record<string, string>
  redFlags: string[]
  greenFlags: string[]
  evidence: Array<{
    id?: string
    source: string
    snippet: string
    url?: string
    type: string
    sourceType?: string
    trustLevel?: string
    matchConfidence?: number
  }>
  alternatives: Array<{
    title: string
    company: string
    salary?: string
    location?: string
    url?: string
    source?: string
    verifiedSource?: string
  }>
  nextSteps: string[]
  intelligence?: {
    coverage: Record<string, string>
    companyProfileMode?: string
    companyIdentity: { status: string; officialDomain?: string; evidenceIds: string[] }
    recruiterIdentity?: { status: string; recruiterName?: string; recruiterEmailDomain?: string; evidenceIds: string[] }
    localPresence: { status: string; evidenceIds: string[] }
    marketBenchmark: {
      status: string
      claimedMonthlyAmount?: number
      comparableMonthlyAmount?: number
      currency?: string
      ratio?: number
      evidenceIds: string[]
    }
    applyPath: { status: string; submittedHost?: string; officialHost?: string; evidenceIds: string[] }
    signals: Array<{
      id: string
      label: string
      direction: 'risk' | 'trust' | 'neutral'
      severity: 'low' | 'medium' | 'high'
      weight: number
      evidenceIds: string[]
      rationale: string
    }>
    scoreTrace: Array<{ step: string; delta: number; scoreAfter: number; reason: string }>
  }
  operations?: {
    liveSearch?: OperationalStatus
    coverageBackfill?: OperationalStatus
    evidenceProviders?: Partial<Record<EvidenceProviderKey, OperationalStatus>>
    salaryBenchmark?: { source?: string; country?: string; currency?: string; message?: string }
    falsePositiveControl?: { profileModeExplanation?: string }
  }
}

interface ResultScreenProps {
  result: Result
  onBackToAudit?: () => void
  timelineEvents?: TimelineEvent[]
}

type TimelineEvent = string | {
  step?: string
  detail?: string
  time?: string
  message?: string
  phase?: string
  label?: string
  status?: string
}

type NormalizedTimelineEvent = {
  step: string
  detail: string
  time: string
  phase?: string
  status?: string
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

type ResultEvidence = Result['evidence'][number]
type OperationalStatus = {
  status?: string
  message?: string
  retryAfterSec?: number
  provider?: string
  fetchedAt?: string
  expiresAt?: string
  rateLimitedUntil?: string
}
type EvidenceProviderKey =
  | 'serpapi'
  | 'rdap'
  | 'dns'
  | 'safeBrowsing'
  | 'certificateTransparency'
  | 'threatIntel'
  | 'companyRegistry'
  | 'urlscan'

function isOcrEvidence(item: ResultEvidence) {
  const type = item.type.toLowerCase()
  const source = item.source.toLowerCase()
  return type.includes('screenshot ocr') || source.includes('screenshot ocr')
}

function isUnavailableOcr(item: ResultEvidence) {
  return item.type.toLowerCase().includes('unavailable') || item.source.toLowerCase().includes('unavailable')
}

function getOcrProviderLabel(item: ResultEvidence) {
  const source = item.source.toLowerCase()
  if (source.includes('google vision')) return 'Google Vision OCR'
  if (source.includes('tesseract')) return 'Tesseract fallback OCR'
  return 'Screenshot OCR'
}

function getOcrConfidenceLabel(item: ResultEvidence) {
  if (isUnavailableOcr(item)) return 'Low confidence'
  if (item.source.toLowerCase().includes('google vision')) return 'High confidence'
  return 'Medium confidence'
}

function getOcrSummary(item: ResultEvidence) {
  if (isUnavailableOcr(item)) {
    return 'Screenshot text could not be extracted. HireProof lowered confidence for this image-only evidence.'
  }
  if (item.source.toLowerCase().includes('tesseract')) {
    return 'Screenshot analyzed with fallback OCR. Text may be less accurate, so HireProof weighted this evidence lower.'
  }
  return 'Text extracted from the uploaded screenshot using Google Vision and included in the evidence review.'
}

function redactSensitiveDisplayText(value: string) {
  return String(value || '')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email redacted]')
    .replace(/\b(?:\+?\d[\d\s().-]{7,}\d)\b/g, '[phone redacted]')
    .replace(/https?:\/\/\S+/gi, '[link redacted]')
    .replace(/\b(?:token|code|otp|password|passcode)\s*[:=-]?\s*[A-Za-z0-9_-]{4,}\b/gi, '[private code redacted]')
    .replace(/\s+/g, ' ')
    .trim()
}

function shortenDisplayText(value: string, limit = 420) {
  const text = redactSensitiveDisplayText(value)
  if (text.length <= limit) return text
  return `${text.slice(0, limit).trim()}...`
}

function getOcrPreview(item: ResultEvidence) {
  return shortenDisplayText(item.snippet
    .replace(/^Extracted screenshot text using Screenshot OCR:\s*(Google Vision|Tesseract fallback)\.\s*/i, '')
    .replace(/^Screenshot text could not be extracted\.\s*/i, '')
    .trim())
}

function getEvidenceDisplaySnippet(item: ResultEvidence) {
  if (!isOcrEvidence(item)) return item.snippet
  if (isUnavailableOcr(item)) return getOcrSummary(item)
  return `${getOcrSummary(item)} Preview: ${getOcrPreview(item)}`
}

type EvidenceStatusTone = 'safe' | 'risk' | 'caution' | 'neutral'

function formatEvidenceLabel(value: string) {
  return String(value || 'Unknown')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatEvidenceStatus(value?: string) {
  return String(value || 'unknown').replace(/[_-]+/g, ' ')
}

function getEvidenceStatusTone(value?: string): EvidenceStatusTone {
  const normalized = String(value || '').toLowerCase()
  if (['verified', 'clear', 'normal', 'official', 'matched', 'platform-match', 'ok'].includes(normalized)) return 'safe'
  if (['risk', 'risky', 'anomalous', 'mismatch', 'blocked', 'throttled', 'circuit-open'].includes(normalized)) return 'risk'
  if (['missing', 'unknown', 'partial', 'not-live', 'sparse', 'degraded', 'cache-only'].includes(normalized)) return 'caution'
  return 'neutral'
}

function getProviderDisplayName(value: string) {
  const labels: Record<string, string> = {
    serpapi: 'SerpApi',
    rdap: 'RDAP',
    dns: 'DNS',
    safeBrowsing: 'Safe Browsing',
    certificateTransparency: 'Certificate Transparency',
    threatIntel: 'Threat Intel',
    companyRegistry: 'Company Registry',
    urlscan: 'urlscan',
  }
  return labels[value] || formatEvidenceLabel(value)
}

function formatProviderTimestamp(value?: string) {
  if (!value) return ''
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return ''
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

function getEvidenceToneClasses(tone: EvidenceStatusTone) {
  switch (tone) {
    case 'safe':
      return 'border-safe/25 bg-safe/10 text-safe-text'
    case 'risk':
      return 'border-risk-bg/35 bg-risk-bg/10 text-risk-text'
    case 'caution':
      return 'border-caution/30 bg-caution/10 text-caution-text'
    default:
      return 'border-border-soft bg-surface-elevated text-muted'
  }
}

function normalizeTimelineEvents(result: Result, timelineEvents: TimelineEvent[]): NormalizedTimelineEvent[] {
  const isDemo = result.mode === 'demo' || result.credentialMode === 'demo' || result.source === 'demo'
  const provided = timelineEvents
    .map((event, index) => {
      if (typeof event === 'string') {
        return {
          step: isDemo ? 'Demo fixture' : `Live event ${index + 1}`,
          detail: event,
          time: `Event ${index + 1}`,
        } satisfies NormalizedTimelineEvent
      }

      return {
        step: event.step || event.label || event.phase || (isDemo ? 'Demo fixture' : `Live event ${index + 1}`),
        detail: event.detail || event.message || 'Audit event recorded.',
        time: event.time || `Event ${index + 1}`,
        phase: event.phase,
        status: event.status,
      } satisfies NormalizedTimelineEvent
    })
    .filter(event => event.detail.trim().length > 0)

  if (provided.length > 0) return provided

  if (isDemo) {
    return [{
      step: 'Demo fixture',
      detail: 'Prebuilt example report loaded. No live source checks, recruiter checks, or fresh job searches were run.',
      time: 'Demo',
      status: 'complete',
    }]
  }

  return [
    {
      step: 'Report generated',
      detail: `Review completed with ${result.evidence.length} evidence receipt${result.evidence.length === 1 ? '' : 's'} and ${result.redFlags.length + result.greenFlags.length} scored signal${result.redFlags.length + result.greenFlags.length === 1 ? '' : 's'}.`,
      time: 'Report',
      status: 'complete',
    },
    {
      step: 'Final verdict',
      detail: `Risk score assigned: ${result.riskScore}/100.`,
      time: 'Verdict',
      status: 'complete',
    },
  ]
}

const PNG_EXPORT_PALETTES = {
  dark: {
    background: '#0c0f14',
    surface: '#121821',
    surfaceSoft: '#18212d',
    foreground: '#f8fafc',
    muted: '#a3adba',
    border: '#2a3442',
    safe: '#55f06f',
    safeBg: '#10351f',
    caution: '#facc15',
    cautionBg: '#3b2f0a',
    risk: '#ff5f57',
    riskBg: '#3a1415',
    evidence: '#7dd3fc',
    evidenceBg: '#0e2a3a',
  },
  light: {
    background: '#f8faf7',
    surface: '#ffffff',
    surfaceSoft: '#edf5ef',
    foreground: '#0b1210',
    muted: '#52615c',
    border: '#d8e2dc',
    safe: '#12864f',
    safeBg: '#dff8e7',
    caution: '#9a6b00',
    cautionBg: '#fff3c4',
    risk: '#c92a2a',
    riskBg: '#ffe2e2',
    evidence: '#0f6f9f',
    evidenceBg: '#dff4ff',
  },
} as const

function hasClass(element: HTMLElement, prefix: string) {
  return Array.from(element.classList).some((className) => className === prefix || className.startsWith(`${prefix}/`))
}

function preparePngExportClone(clonedDocument: Document, isDark: boolean) {
  const root = clonedDocument.getElementById('result-content')
  if (!(root instanceof HTMLElement)) return

  const palette = isDark ? PNG_EXPORT_PALETTES.dark : PNG_EXPORT_PALETTES.light
  root.dataset.hireproofPngExport = 'true'

  const style = clonedDocument.createElement('style')
  style.textContent = `
    [data-hireproof-png-export],
    [data-hireproof-png-export] * {
      animation: none !important;
      transition: none !important;
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
      backdrop-filter: none !important;
      color-scheme: ${isDark ? 'dark' : 'light'} !important;
    }
  `
  clonedDocument.head.appendChild(style)

  const elements = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]
  elements.forEach((element) => {
    element.style.boxShadow = 'none'
    element.style.textShadow = 'none'
    element.style.filter = 'none'
    element.style.backdropFilter = 'none'
    element.style.backgroundColor = 'transparent'
    element.style.backgroundImage = 'none'
    element.style.color = palette.foreground
    element.style.caretColor = palette.safe
    element.style.textDecorationColor = palette.safe
    element.style.borderColor = palette.border
    element.style.outlineColor = palette.safe

    if (element === root || hasClass(element, 'bg-background')) {
      element.style.backgroundColor = palette.background
    } else if (hasClass(element, 'bg-foreground') || hasClass(element, 'bg-white')) {
      element.style.backgroundColor = palette.foreground
    } else if (hasClass(element, 'bg-border') || hasClass(element, 'bg-border-soft')) {
      element.style.backgroundColor = palette.border
    } else if (hasClass(element, 'bg-surface') || hasClass(element, 'bg-card')) {
      element.style.backgroundColor = palette.surface
    } else if (hasClass(element, 'bg-surface-elevated')) {
      element.style.backgroundColor = palette.surfaceSoft
    } else if (hasClass(element, 'bg-safe') || hasClass(element, 'bg-safe-bg')) {
      element.style.backgroundColor = palette.safeBg
    } else if (hasClass(element, 'bg-caution') || hasClass(element, 'bg-caution-bg')) {
      element.style.backgroundColor = palette.cautionBg
    } else if (hasClass(element, 'bg-risk') || hasClass(element, 'bg-risk-bg')) {
      element.style.backgroundColor = palette.riskBg
    } else if (hasClass(element, 'bg-evidence') || hasClass(element, 'bg-evidence-bg')) {
      element.style.backgroundColor = palette.evidenceBg
    }

    if (hasClass(element, 'text-muted')) {
      element.style.color = palette.muted
    } else if (hasClass(element, 'text-background')) {
      element.style.color = palette.background
    } else if (hasClass(element, 'text-white')) {
      element.style.color = '#ffffff'
    } else if (hasClass(element, 'text-border') || hasClass(element, 'text-border-soft')) {
      element.style.color = palette.border
    } else if (hasClass(element, 'text-safe') || hasClass(element, 'text-safe-text')) {
      element.style.color = palette.safe
    } else if (hasClass(element, 'text-caution') || hasClass(element, 'text-caution-text')) {
      element.style.color = palette.caution
    } else if (hasClass(element, 'text-risk') || hasClass(element, 'text-risk-text')) {
      element.style.color = palette.risk
    } else if (hasClass(element, 'text-evidence')) {
      element.style.color = palette.evidence
    } else if (hasClass(element, 'text-foreground') || element === root) {
      element.style.color = palette.foreground
    }

    if (hasClass(element, 'border-safe') || hasClass(element, 'border-safe-bg')) {
      element.style.borderColor = palette.safe
    } else if (hasClass(element, 'border-caution') || hasClass(element, 'border-caution-bg')) {
      element.style.borderColor = palette.caution
    } else if (hasClass(element, 'border-risk') || hasClass(element, 'border-risk-bg')) {
      element.style.borderColor = palette.risk
    } else if (hasClass(element, 'border-evidence')) {
      element.style.borderColor = palette.evidence
    }
  })
}

export default function ResultScreen({ result, onBackToAudit, timelineEvents = [] }: ResultScreenProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null)
  const [feedbackReason, setFeedbackReason] = useState(result.userFeedbackReason || '')
  const [expandedOcr, setExpandedOcr] = useState(false)
  const isDemoReport = result.mode === 'demo' || result.credentialMode === 'demo' || result.source === 'demo'
  const normalizedTimelineEvents = normalizeTimelineEvents(result, timelineEvents)
  const [expandedTimelineSteps, setExpandedTimelineSteps] = useState<Set<number>>(() => new Set([0, Math.max(0, normalizedTimelineEvents.length - 1)]))
  const allTimelineExpanded = expandedTimelineSteps.size >= normalizedTimelineEvents.length
  const toggleTimelineStep = (index: number) => {
    setExpandedTimelineSteps((current) => {
      const next = new Set(current)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }
  const toggleAllTimelineSteps = () => {
    setExpandedTimelineSteps((current) => {
      if (current.size >= normalizedTimelineEvents.length) return new Set([0, Math.max(0, normalizedTimelineEvents.length - 1)])
      return new Set(normalizedTimelineEvents.map((_, index) => index))
    })
  }

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
    const isDarkExport = resolvedTheme === 'dark'
    try {
      setIsExporting(true)
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDarkExport ? PNG_EXPORT_PALETTES.dark.background : PNG_EXPORT_PALETTES.light.background,
        onclone: (clonedDocument) => preparePngExportClone(clonedDocument, isDarkExport),
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `hireproof-verdict-${result.verdict}.png`
      link.click()
    } catch (error) {
      console.error('HireProof PNG export failed', error)
      showToast('PNG export failed. PDF and CSV exports are still available.', 'error')
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
  const intelligence = result.intelligence
  const coverageEntries = intelligence
    ? Object.entries(intelligence.coverage)
    : []
  const ocrReceipt = (result.evidence || []).find(isOcrEvidence)
  const ocrPreview = ocrReceipt ? getOcrPreview(ocrReceipt) : ''
  const formatMoney = (amount?: number, currency = '') => {
    if (typeof amount !== 'number') return 'Not enough data'
    return `${currency ? `${currency} ` : ''}${amount.toLocaleString()} / month`
  }
  const coverageRows = coverageEntries.map(([key, value]) => ({
    label: formatEvidenceLabel(key),
    value: formatEvidenceStatus(value),
    tone: getEvidenceStatusTone(value),
  }))
  const identityRows = [
    {
      label: 'Profile Mode',
      value: formatEvidenceStatus(intelligence?.companyProfileMode || 'legacy'),
      detail: 'Scoring profile',
      tone: getEvidenceStatusTone('neutral'),
    },
    {
      label: 'Company Identity',
      value: formatEvidenceStatus(intelligence?.companyIdentity?.status || 'legacy'),
      detail: intelligence?.companyIdentity?.officialDomain || 'No official domain linked',
      tone: getEvidenceStatusTone(intelligence?.companyIdentity?.status),
    },
    {
      label: 'Recruiter Identity',
      value: formatEvidenceStatus(intelligence?.recruiterIdentity?.status || 'legacy'),
      detail: intelligence?.recruiterIdentity?.recruiterEmailDomain || 'No recruiter domain linked',
      tone: getEvidenceStatusTone(intelligence?.recruiterIdentity?.status),
    },
    {
      label: 'Apply Path',
      value: formatEvidenceStatus(intelligence?.applyPath?.status || 'legacy'),
      detail: intelligence?.applyPath?.submittedHost || intelligence?.applyPath?.officialHost || 'No apply host linked',
      tone: getEvidenceStatusTone(intelligence?.applyPath?.status),
    },
    {
      label: 'Market Salary',
      value: formatEvidenceStatus(intelligence?.marketBenchmark?.status || 'legacy'),
      detail: formatMoney(intelligence?.marketBenchmark?.claimedMonthlyAmount, intelligence?.marketBenchmark?.currency),
      tone: getEvidenceStatusTone(intelligence?.marketBenchmark?.status),
    },
  ]
  const providerRows = Object.entries(result.operations?.evidenceProviders || {})
    .filter((entry): entry is [string, OperationalStatus] => Boolean(entry[1]?.status || entry[1]?.message))
    .map(([key, status]) => ({
      key,
      label: getProviderDisplayName(key),
      status: formatEvidenceStatus(status.status),
      tone: getEvidenceStatusTone(status.status),
      message: status.message || (
        status.status === 'ok'
          ? `${getProviderDisplayName(key)} responded during this audit.`
          : 'No provider detail was included.'
      ),
      fetchedAt: formatProviderTimestamp(status.fetchedAt),
      expiresAt: formatProviderTimestamp(status.expiresAt),
      retryAfterSec: status.retryAfterSec,
      rateLimitedUntil: formatProviderTimestamp(status.rateLimitedUntil),
    }))
  const providerOkCount = providerRows.filter((row) => row.tone === 'safe').length
  const providerAttentionCount = providerRows.length - providerOkCount

  const submitFeedback = async (vote: 'helpful' | 'incorrect') => {
    if (feedbackGiven || !result.id) return
    setFeedbackLoading(vote)
    setFeedbackGiven(true)
    try {
      const res = await fetch('/api/intelligence/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: result.id, feedback: vote, reason: feedbackReason || undefined }),
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
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
              className="hireproof-focus flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface transition-all hover:-translate-y-0.5 hover:bg-evidence-bg active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:gap-1.5 sm:px-3"
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
              className="hireproof-focus flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-evidence transition-all hover:-translate-y-0.5 hover:bg-evidence-bg active:translate-y-0 active:scale-95 sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden text-xs font-black sm:inline">PDF</span>
            </button>
            <button
              onClick={handleReportCsvDownload}
              title="Download report CSV"
              className="hireproof-focus flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-evidence transition-all hover:-translate-y-0.5 hover:bg-evidence-bg active:translate-y-0 active:scale-95 sm:w-auto sm:gap-1.5 sm:px-3"
            >
              <Table className="w-4 h-4" />
              <span className="hidden text-xs font-black sm:inline">CSV</span>
            </button>
            <button
              onClick={handleShare}
              title="Share verdict"
              aria-label="Share verdict"
              className="hireproof-focus flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-evidence transition-all hover:-translate-y-0.5 hover:bg-evidence-bg active:translate-y-0 active:scale-95 sm:w-auto sm:gap-1.5 sm:px-3"
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
                className="hireproof-focus flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-safe transition-all hover:-translate-y-0.5 hover:bg-evidence-bg active:translate-y-0 active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" ref={contentRef} id="result-content" className="relative mx-auto max-w-7xl space-y-10 px-4 py-10 lg:px-6 xl:px-8">
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
                    <span className="h-1.5 w-1.5 rounded-full bg-safe" />
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

        {isDemoReport && (
          <motion.section variants={itemVariants} className="rounded-2xl border border-caution/30 bg-caution-bg/30 p-4 text-caution-text">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-widest">Demo fixture</div>
                <p className="mt-1 text-sm font-semibold leading-6">
                  This is a prebuilt example report. Use live evidence mode for fresh source checks.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-lg border border-caution/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                Not live verified
              </span>
            </div>
          </motion.section>
        )}

        {ocrReceipt && (
          <motion.section variants={itemVariants} data-testid="ocr-evidence-receipt" className="rounded-[2rem] border border-evidence/30 bg-evidence/5 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                  isUnavailableOcr(ocrReceipt)
                    ? 'border-caution-bg bg-caution-bg text-caution-text'
                    : 'border-evidence/25 bg-background text-evidence'
                }`}>
                  {isUnavailableOcr(ocrReceipt) ? <AlertCircle className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">Screenshot analyzed</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                      isUnavailableOcr(ocrReceipt)
                        ? 'bg-caution-bg text-caution-text'
                        : ocrReceipt.source.toLowerCase().includes('google vision')
                          ? 'bg-safe-bg text-safe-text'
                          : 'bg-evidence-bg text-evidence'
                    }`}>
                      {getOcrConfidenceLabel(ocrReceipt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-muted">{getOcrProviderLabel(ocrReceipt)}</p>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-muted">{getOcrSummary(ocrReceipt)}</p>
                </div>
              </div>
              {ocrPreview && !isUnavailableOcr(ocrReceipt) && (
                <button
                  type="button"
                  aria-expanded={expandedOcr}
                  aria-controls="ocr-extracted-text"
                  onClick={() => setExpandedOcr((value) => !value)}
                  className="hireproof-focus inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-evidence/25 bg-background px-4 py-2 text-sm font-black text-evidence transition-colors hover:bg-evidence-bg"
                >
                  {expandedOcr ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {expandedOcr ? 'Hide extracted text' : 'Show extracted text'}
                </button>
              )}
            </div>
            {ocrPreview && !isUnavailableOcr(ocrReceipt) && expandedOcr && (
              <div id="ocr-extracted-text" className="mt-5 rounded-2xl border border-border-soft bg-background p-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted">Extracted text preview</div>
                <p className="max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-xs font-semibold leading-6 text-muted">
                  {ocrPreview}
                </p>
              </div>
            )}
          </motion.section>
        )}

        <motion.section variants={itemVariants} className="rounded-[2.5rem] border border-border-soft bg-surface p-5 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-black">Risk Breakdown</h2>
                <p className="text-sm font-semibold text-muted">How the AI scored each dimension of this opportunity.</p>
              </div>
              <RiskRadarChart
                extractedClaims={result.extractedClaims as any}
                redFlags={result.redFlags}
                greenFlags={result.greenFlags}
                evidence={result.evidence}
                verdict={result.verdict}
                intelligence={result.intelligence}
              />
            </div>

            <aside className="rounded-[2rem] border border-border-soft bg-background/70 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Score Trace</div>
                  <div className={`mt-2 text-4xl font-black leading-none tabular-nums ${result.riskScore > 60 ? 'text-risk-text' : result.riskScore > 35 ? 'text-caution-text' : 'text-safe'}`}>
                    {result.riskScore}<span className="text-lg text-muted">/100</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-soft bg-surface">
                  {result.riskScore > 60 ? <AlertTriangle className="h-6 w-6 text-risk-text" /> : <ShieldCheck className="h-6 w-6 text-safe" />}
                </div>
              </div>
              <div className="space-y-3">
                {(intelligence?.scoreTrace || []).slice(-4).map((trace, index) => (
                  <div key={`${trace.step}-${index}`} className="rounded-xl border border-border-soft bg-surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-wide text-foreground">{trace.step}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-black tabular-nums ${trace.delta > 0 ? 'bg-risk-bg/10 text-risk-text' : trace.delta < 0 ? 'bg-safe/10 text-safe-text' : 'bg-background text-muted'}`}>
                        {trace.delta > 0 ? '+' : ''}{trace.delta}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold leading-5 text-muted">{trace.reason}</div>
                  </div>
                ))}
                {(intelligence?.scoreTrace || []).length === 0 && (
                  <div className="rounded-xl border border-border-soft bg-surface p-3 text-sm font-semibold text-muted">
                    No v2 score trace was included in this result.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="overflow-hidden rounded-2xl border border-border-soft bg-background shadow-sm">
          <div className="grid" aria-label="Analyst coverage matrix">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-col gap-4 border-b border-border-soft pb-5 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-evidence/25 bg-evidence-bg text-evidence">
                    <SearchCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">Evidence Coverage</h2>
                      <span className="rounded-md border border-border-soft bg-surface px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted">
                        V2 intelligence report
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-muted">
                      Company identity, apply path, local footprint, reputation, and market salary are checked against visible receipts.
                    </p>
                  </div>
                </div>
                <div className={`flex min-w-[8rem] items-center justify-between gap-3 rounded-xl border px-4 py-3 ${getEvidenceToneClasses(getEvidenceStatusTone(result.verdict === 'high-risk' ? 'risk' : result.verdict === 'safe' ? 'verified' : 'partial'))}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">Risk</span>
                  <span className="text-2xl font-black tabular-nums">{result.riskScore}</span>
                </div>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-2">
                {result.operations?.liveSearch?.status && result.operations.liveSearch.status !== 'ok' && result.operations.liveSearch.status !== 'not-live' && (
                  <div className="rounded-xl border border-caution/30 bg-caution/10 p-4 text-xs font-bold leading-6 text-caution-text">
                    {result.operations.liveSearch.message}
                  </div>
                )}
                {result.operations?.coverageBackfill?.message && (
                  <div className="rounded-xl border border-caution/30 bg-caution/10 p-4 text-xs font-bold leading-6 text-caution-text">
                    {result.operations.coverageBackfill.message}
                  </div>
                )}
                {result.operations?.falsePositiveControl?.profileModeExplanation && (
                  <div className="rounded-xl border border-safe/25 bg-safe/10 p-4 text-xs font-bold leading-6 text-safe-text">
                    {result.operations.falsePositiveControl.profileModeExplanation}
                  </div>
                )}
                {result.operations?.salaryBenchmark?.message && (
                  <div className="rounded-xl border border-border-soft bg-surface p-4 text-xs font-bold leading-6 text-muted md:col-span-2">
                    {result.operations.salaryBenchmark.message}
                  </div>
                )}
              </div>

              {providerRows.length > 0 && (
                <div data-testid="evidence-provider-status" className="mb-5 overflow-hidden rounded-xl border border-border-soft bg-surface">
                  <div className="flex flex-col gap-3 border-b border-border-soft bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black">Evidence provider status</h3>
                      <p className="mt-1 text-xs font-semibold leading-5 text-muted">
                        Shows which live providers ran, reused cache, degraded, or were not configured. Provider misses are operational context, not proof that an opportunity is safe.
                      </p>
                    </div>
                    <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                      <span className="rounded-md border border-safe/25 bg-safe/10 px-2.5 py-1 text-safe-text">{providerOkCount} ok</span>
                      <span className="rounded-md border border-caution/30 bg-caution/10 px-2.5 py-1 text-caution-text">{providerAttentionCount} review</span>
                    </div>
                  </div>
                  <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
                    {providerRows.map((row) => (
                      <div key={row.key} className="border-b border-border-soft p-4 sm:border-r xl:[&:nth-child(3n)]:border-r-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black text-foreground">{row.label}</div>
                            <div className="mt-1 text-xs font-semibold leading-5 text-muted">{row.message}</div>
                          </div>
                          <span className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${getEvidenceToneClasses(row.tone)}`}>
                            {row.status}
                          </span>
                        </div>
                        {(row.fetchedAt || row.expiresAt || row.retryAfterSec || row.rateLimitedUntil) && (
                          <dl className="mt-3 grid gap-2 text-[10px] font-black uppercase tracking-wider text-muted">
                            {row.fetchedAt && (
                              <div className="flex justify-between gap-3">
                                <dt>Fetched</dt>
                                <dd className="text-foreground">{row.fetchedAt}</dd>
                              </div>
                            )}
                            {row.expiresAt && (
                              <div className="flex justify-between gap-3">
                                <dt>Cache expires</dt>
                                <dd className="text-foreground">{row.expiresAt}</dd>
                              </div>
                            )}
                            {row.retryAfterSec && (
                              <div className="flex justify-between gap-3">
                                <dt>Retry after</dt>
                                <dd className="text-foreground">{row.retryAfterSec}s</dd>
                              </div>
                            )}
                            {row.rateLimitedUntil && (
                              <div className="flex justify-between gap-3">
                                <dt>Rate limited until</dt>
                                <dd className="text-foreground">{row.rateLimitedUntil}</dd>
                              </div>
                            )}
                          </dl>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
                {coverageRows.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-border-soft bg-background/40">
                    <div className="hidden grid-cols-[minmax(7rem,0.75fr)_minmax(6rem,0.5fr)_minmax(0,1fr)] bg-surface px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted sm:grid xl:grid-cols-[minmax(6.5rem,0.8fr)_minmax(5.5rem,0.52fr)_minmax(0,1fr)]">
                      <div>Coverage</div>
                      <div>Status</div>
                      <div>Meaning</div>
                    </div>
                    {coverageRows.map((row) => (
                      <div key={row.label} className="border-t border-border-soft px-4 py-3 sm:grid sm:grid-cols-[minmax(7rem,0.75fr)_minmax(6rem,0.5fr)_minmax(0,1fr)] sm:items-center sm:gap-2 sm:py-2.5 xl:grid-cols-[minmax(6.5rem,0.8fr)_minmax(5.5rem,0.52fr)_minmax(0,1fr)]">
                        <div className="mb-2 flex items-center justify-between gap-3 sm:mb-0 sm:block">
                          <div className="text-sm font-black">{row.label}</div>
                          <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide sm:hidden ${getEvidenceToneClasses(row.tone)}`}>
                            {row.value}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${getEvidenceToneClasses(row.tone)}`}>
                            {row.value}
                          </span>
                        </div>
                        <div className="text-xs font-semibold leading-5 text-muted">
                          {row.tone === 'safe' ? 'Evidence supports this dimension.' : row.tone === 'risk' ? 'This dimension pushed risk upward.' : row.tone === 'caution' ? 'Evidence is incomplete or unresolved.' : 'Recorded for reviewer context.'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border-soft bg-surface p-4">
                    <div className="text-sm font-bold text-muted">Legacy report: structured v2 coverage was not included in this result.</div>
                  </div>
                )}

                <div className="overflow-hidden rounded-xl border border-border-soft bg-background/40">
                  <div className="hidden grid-cols-[minmax(8rem,0.75fr)_minmax(6rem,0.5fr)_minmax(0,1fr)] bg-surface px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted sm:grid xl:grid-cols-[minmax(7rem,0.78fr)_minmax(5.5rem,0.52fr)_minmax(0,1fr)]">
                    <div>Context</div>
                    <div>Status</div>
                    <div>Detail</div>
                  </div>
                  <div className="divide-y divide-border-soft">
                    {identityRows.map((row) => (
                      <div key={row.label} className="px-4 py-3 sm:grid sm:grid-cols-[minmax(8rem,0.75fr)_minmax(6rem,0.5fr)_minmax(0,1fr)] sm:items-center sm:gap-2 sm:py-2.5 xl:grid-cols-[minmax(7rem,0.78fr)_minmax(5.5rem,0.52fr)_minmax(0,1fr)]">
                        <div className="mb-2 flex items-center justify-between gap-3 sm:mb-0 sm:block">
                          <div className="text-xs font-black uppercase tracking-wide text-muted">{row.label}</div>
                          <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide sm:hidden ${getEvidenceToneClasses(row.tone)}`}>
                            {row.value}
                          </span>
                        </div>
                        <div className="hidden sm:block">
                          <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${getEvidenceToneClasses(row.tone)}`}>
                            {row.value}
                          </span>
                        </div>
                        <div className="min-w-0 break-words text-sm font-semibold text-muted sm:truncate">{row.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="hidden border-t border-border-soft bg-surface p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] text-muted">Score Trace</div>
                  <div className={`mt-2 text-4xl font-black leading-none tabular-nums ${result.riskScore > 60 ? 'text-risk-text' : result.riskScore > 35 ? 'text-caution-text' : 'text-safe'}`}>
                    {result.riskScore}<span className="text-lg text-muted">/100</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border-soft bg-background">
                  {result.riskScore > 60 ? <AlertTriangle className="h-6 w-6 text-risk-text" /> : <ShieldCheck className="h-6 w-6 text-safe" />}
                </div>
              </div>
              <div className="space-y-3">
                {(intelligence?.scoreTrace || []).slice(-4).map((trace, index) => (
                  <div key={`${trace.step}-${index}`} className="rounded-xl border border-border-soft bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-black uppercase tracking-wide text-foreground">{trace.step}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-black tabular-nums ${trace.delta > 0 ? 'bg-risk-bg/10 text-risk-text' : trace.delta < 0 ? 'bg-safe/10 text-safe-text' : 'bg-surface text-muted'}`}>
                        {trace.delta > 0 ? '+' : ''}{trace.delta}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-semibold leading-5 text-muted">{trace.reason}</div>
                  </div>
                ))}
                {(intelligence?.scoreTrace || []).length === 0 && (
                  <div className="rounded-xl border border-border-soft bg-background p-3 text-sm font-semibold text-muted">
                    No v2 score trace was included in this result.
                  </div>
                )}
              </div>
            </aside>
          </div>
        </motion.section>

        {/* Investigation Timeline Section */}
        <motion.section variants={itemVariants} className="rounded-3xl border border-border-soft bg-surface p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Clock className="h-32 w-32" />
          </div>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-black">
                <Zap className="h-6 w-6 text-safe" />
                Investigation Timeline
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted">
                Expand each step to inspect what HireProof checked. The entries come from the audit stream or the demo fixture disclosure.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAllTimelineSteps}
              className="hireproof-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-soft bg-background px-4 py-2 text-sm font-black text-foreground transition-colors hover:bg-surface-elevated"
            >
              <ListTree className="h-4 w-4" />
              {allTimelineExpanded ? 'Collapse timeline' : 'Expand timeline'}
            </button>
          </div>
          <div className="relative space-y-3 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border-soft">
            {normalizedTimelineEvents.map((step, i) => {
              const Icon = i === 0 ? Bot : i === normalizedTimelineEvents.length - 1 ? UserCheck : SearchCheck
              const color = i === 0 ? 'text-muted' : i === normalizedTimelineEvents.length - 1 ? 'text-safe' : 'text-evidence'
              const isExpanded = expandedTimelineSteps.has(i)
              const detailId = `timeline-step-${i}-detail`
              const statusLabel = step.status ? step.status.replace(/-/g, ' ') : i === normalizedTimelineEvents.length - 1 ? 'complete' : 'recorded'
              return (
              <div key={i} className="relative pl-12">
                <div className={`absolute left-0 top-1 h-9 w-9 rounded-full bg-background border border-border-soft flex items-center justify-center z-10 transition-colors ${isExpanded ? 'border-safe/50' : ''} ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className={`rounded-2xl border transition-colors ${isExpanded ? 'border-safe/25 bg-background shadow-sm' : 'border-border-soft bg-background/45 hover:border-border'}`}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={detailId}
                    onClick={() => toggleTimelineStep(i)}
                    className="hireproof-focus flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-black uppercase tracking-widest">{step.step}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted">
                        <span>{step.time}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{statusLabel}</span>
                        {step.phase && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{step.phase}</span>
                          </>
                        )}
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${isExpanded ? 'rotate-180 text-safe' : ''}`} />
                  </button>
                  {isExpanded && (
                    <motion.div
                      id={detailId}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.18 }}
                      className="border-t border-border-soft px-4 pb-4 pt-3"
                    >
                      <p className="text-sm font-medium leading-relaxed text-muted">{step.detail}</p>
                      <div className="mt-3 grid gap-2 text-xs font-semibold text-muted sm:grid-cols-3">
                        <div className="rounded-xl border border-border-soft bg-surface px-3 py-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-foreground">Sequence</span>
                          Step {i + 1} of {normalizedTimelineEvents.length}
                        </div>
                        <div className="rounded-xl border border-border-soft bg-surface px-3 py-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-foreground">Source</span>
                          {isDemoReport ? 'Demo fixture' : 'Audit stream'}
                        </div>
                        <div className="rounded-xl border border-border-soft bg-surface px-3 py-2">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-foreground">Status</span>
                          {statusLabel}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )})}
          </div>
          <div className="mt-5 rounded-2xl border border-border-soft bg-background/70 p-4 text-sm font-semibold leading-6 text-muted">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-evidence" />
              <p>
                Timeline details explain the audit process. They are not standalone proof; rely on evidence receipts, source quality, and scoring trace for the final trust decision.
              </p>
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

        {((result.redFlags || []).length > 0 || (result.greenFlags || []).length > 0) && (
          <motion.section variants={itemVariants} className="overflow-hidden rounded-2xl border border-border-soft bg-background shadow-sm">
            <div className="grid border-b border-border-soft bg-surface/60 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 border-b border-border-soft px-5 py-4 sm:border-b-0 sm:border-r">
                <div className="flex items-center gap-2 text-risk-text">
                  <AlertTriangle className="h-4 w-4" />
                  <h2 className="text-sm font-black uppercase tracking-[0.16em]">Red Flags</h2>
                </div>
                <span className="rounded-full bg-risk-bg px-2.5 py-1 text-xs font-black text-risk-text">{(result.redFlags || []).length}</span>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-2 text-safe-text">
                  <CheckCircle2 className="h-4 w-4" />
                  <h2 className="text-sm font-black uppercase tracking-[0.16em]">Green Flags</h2>
                </div>
                <span className="rounded-full bg-safe-bg px-2.5 py-1 text-xs font-black text-safe-text">{(result.greenFlags || []).length}</span>
              </div>
            </div>

            <div className="divide-y divide-border-soft">
              {Array.from({ length: Math.max((result.redFlags || []).length, (result.greenFlags || []).length) }).map((_, i) => (
                <div key={i} className="grid sm:grid-cols-2">
                  <div className="border-b border-border-soft p-4 sm:border-b-0 sm:border-r sm:p-5">
                    {(result.redFlags || [])[i] ? (
                      <div className="flex gap-3 text-risk-text">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <p className="text-sm font-semibold leading-relaxed">{(result.redFlags || [])[i]}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-muted/60">No matching concern.</p>
                    )}
                  </div>
                  <div className="p-4 sm:p-5">
                    {(result.greenFlags || [])[i] ? (
                      <div className="flex gap-3 text-safe-text">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <p className="text-sm font-semibold leading-relaxed">{(result.greenFlags || [])[i]}</p>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-muted/60">No matching positive signal.</p>
                    )}
                  </div>
                </div>
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
                  <p className="mb-3 text-sm font-medium leading-6 text-muted">{getEvidenceDisplaySnippet(ev)}</p>
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
                  <div className="mt-1 flex flex-wrap gap-2 text-sm font-black">
                    {alt.salary && <span>{alt.salary}</span>}
                    {alt.location && <span>{alt.location}</span>}
                  </div>
                  {(alt.url || alt.verifiedSource || alt.source) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-normal">
                      {alt.verifiedSource && <span>{alt.verifiedSource}</span>}
                      {alt.source && <span>{alt.source}</span>}
                      {alt.url && (
                        <a
                          href={alt.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hireproof-focus inline-flex items-center gap-1 rounded-lg border border-safe-text/30 px-2 py-1 hover:bg-safe-text hover:text-safe-bg"
                        >
                          <Link2 className="h-3 w-3" />
                          Source
                        </a>
                      )}
                    </div>
                  )}
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



        <div className="pb-6 print:hidden">
          <div className="mb-10 rounded-2xl border border-border-soft bg-surface/50 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-normal text-muted">
                  Investigation feedback
                </p>
                <p className="mt-1 text-sm font-black text-foreground">
                  {feedbackGiven ? 'Thank you for your feedback.' : 'Was this investigation accurate?'}
                </p>
              </div>

              {!feedbackGiven && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="block min-w-0 sm:w-64">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-muted">Reason</span>
                    <select
                      value={feedbackReason}
                      onChange={(event) => setFeedbackReason(event.target.value)}
                      className="hireproof-focus h-11 w-full rounded-xl border border-border-soft bg-background px-3 text-xs font-bold text-foreground outline-none transition-colors hover:border-border focus:border-safe"
                      aria-label="Feedback reason"
                    >
                      <option value="">Optional reason</option>
                      <option value="false_positive">False positive</option>
                      <option value="missed_risk">Missed risk</option>
                      <option value="stale_evidence">Stale evidence</option>
                      <option value="salary_wrong">Salary benchmark wrong</option>
                      <option value="company_match_wrong">Company match wrong</option>
                      <option value="recruiter_match_wrong">Recruiter match wrong</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <div className="grid h-11 grid-cols-2 overflow-hidden rounded-xl border border-border-soft bg-background p-1 sm:w-72" aria-label="Investigation accuracy feedback">
                    <button
                      onClick={() => submitFeedback('helpful')}
                      disabled={feedbackGiven || !result.id || !!feedbackLoading}
                      className="hireproof-focus inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black text-muted transition-colors hover:bg-safe-bg hover:text-safe-text disabled:pointer-events-none disabled:opacity-50"
                    >
                      {feedbackLoading === 'helpful' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                      Accurate
                    </button>
                    <button
                      onClick={() => submitFeedback('incorrect')}
                      disabled={feedbackGiven || !result.id || !!feedbackLoading}
                      className="hireproof-focus inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black text-muted transition-colors hover:bg-risk/10 hover:text-risk disabled:pointer-events-none disabled:opacity-50"
                    >
                      {feedbackLoading === 'incorrect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                      Inaccurate
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-border-soft pt-4">
              <p className="text-[10px] font-bold uppercase tracking-normal text-muted">
                Is this your company? <a href="/docs/legal" className="text-safe hover:underline">Report a false positive</a>
              </p>
            </div>
          </div>

          {onBackToAudit ? (
            <button
              onClick={onBackToAudit}
              className="hireproof-focus hireproof-cta-primary rounded-xl px-6 py-3 font-black shadow-lg"
            >
              Run Another Investigation
            </button>
          ) : (
            <a
              href="/audit"
              className="hireproof-focus hireproof-cta-primary inline-block rounded-xl px-6 py-3 font-black shadow-lg"
            >
              Run Another Investigation
            </a>
          )}
        </div>
      </motion.div>
    </div>
  )
}
