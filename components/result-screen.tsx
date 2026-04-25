'use client'

import { ArrowLeft, Download, Share2, AlertTriangle, Zap, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

interface Result {
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
  onBackToAudit: () => void
}

export default function ResultScreen({ result, isDemo = true, onBackToAudit }: ResultScreenProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return 'text-safe-text'
      case 'caution':
        return 'text-caution-text'
      case 'high-risk':
        return 'text-risk-text'
      default:
        return 'text-foreground'
    }
  }

  const getVerdictBg = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return 'border-safe-bg bg-safe-bg'
      case 'caution':
        return 'border-caution-bg bg-caution-bg'
      case 'high-risk':
        return 'border-risk-bg bg-risk-bg'
      default:
        return 'border-border bg-surface'
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return <CheckCircle2 className="w-8 h-8" />
      case 'caution':
        return <Zap className="w-8 h-8" />
      case 'high-risk':
        return <AlertTriangle className="w-8 h-8" />
      default:
        return null
    }
  }

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return 'Safe'
      case 'caution':
        return 'Caution'
      case 'high-risk':
        return 'High-Risk'
      default:
        return 'Unknown'
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

  const handleDownload = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-[73px] z-10 border-b border-border-soft bg-background/95 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button
            onClick={onBackToAudit}
            className="hireproof-focus flex items-center gap-2 rounded-lg text-sm font-black hover:text-safe"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Audit
          </button>
          <div className="flex gap-3">
            <button onClick={handleShare} className="hireproof-focus rounded-lg border border-border bg-surface p-2 hover:bg-evidence-bg" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={handleDownload} className="hireproof-focus rounded-lg border border-border bg-surface p-2 hover:bg-evidence-bg" title="Print or save as PDF">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
        <section className={`rounded-2xl border p-6 shadow-sm sm:p-8 ${getVerdictBg(result.verdict)}`}>
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
                    <div
                      className={`h-full rounded-full ${
                        result.verdict === 'safe'
                          ? 'bg-safe'
                          : result.verdict === 'caution'
                            ? 'bg-caution'
                            : 'bg-high-risk'
                      }`}
                      style={{ width: `${result.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
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
        </section>

        <section>
          <h2 className="mb-5 flex items-center gap-2 text-2xl font-black">
            <Clock className="w-5 h-5" />
            Investigation Timeline
          </h2>
          <div className="space-y-3 rounded-2xl border border-border-soft bg-surface p-5 shadow-sm">
            <div className="flex gap-4">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-safe" />
              <div>
                <div className="font-black">Parsed job post claims</div>
                <div className="text-sm font-semibold text-muted">Extracted company, role, salary, and contact details</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-safe" />
              <div>
                <div className="font-black">Searched company web presence</div>
                <div className="text-sm font-semibold text-muted">Checked domain registration and LinkedIn profile</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-evidence" />
              <div>
                <div className="font-black">Checked recent news and reputation</div>
                <div className="text-sm font-semibold text-muted">Searched for scam reports and company mentions</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-caution" />
              <div>
                <div className="font-black">Compared market standards</div>
                <div className="text-sm font-semibold text-muted">Looked up comparable legitimate job listings</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-high-risk" />
              <div>
                <div className="font-black">Verified local presence</div>
                <div className="text-sm font-semibold text-muted">Checked maps, directories, and business registrations</div>
              </div>
            </div>
          </div>
        </section>

        {result.redFlags.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-risk-text">
              <AlertTriangle className="w-5 h-5" />
              Red Flags
            </h2>
            <div className="space-y-2">
              {result.redFlags.map((flag, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-risk-bg bg-risk-bg p-3 text-risk-text">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="font-semibold">{flag}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Green Flags */}
        {result.greenFlags.length > 0 && (
          <section>
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-black text-safe-text">
              <CheckCircle2 className="w-5 h-5" />
              Green Flags
            </h2>
            <div className="space-y-2">
              {result.greenFlags.map((flag, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-safe-bg bg-safe-bg p-3 text-safe-text">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="font-semibold">{flag}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.evidence.length > 0 && (
          <section>
            <h2 className="mb-5 text-2xl font-black">Supporting Evidence</h2>
            <div className="space-y-3">
              {result.evidence.map((ev, i) => (
                <div key={i} className="rounded-2xl border border-border-soft bg-surface p-4 shadow-sm">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="text-sm font-black">{ev.source}</div>
                    <span className="rounded-full bg-evidence-bg px-2 py-1 text-xs font-black text-evidence">{ev.type}</span>
                  </div>
                  <p className="mb-3 text-sm font-medium leading-6 text-muted">{ev.snippet}</p>
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="hireproof-focus text-xs font-black text-evidence hover:text-safe">
                      Read full article
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {result.alternatives.length > 0 && (
          <section>
            <h2 className="mb-5 text-2xl font-black">Safer Alternatives</h2>
            <div className="space-y-3">
              {result.alternatives.map((alt, i) => (
                <div key={i} className="rounded-2xl border border-safe-bg bg-safe-bg p-4 text-safe-text">
                  <div className="font-black">{alt.title}</div>
                  <div className="text-sm font-semibold">{alt.company}</div>
                  {alt.salary && <div className="mt-1 text-sm font-black">{alt.salary}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
            <AlertCircle className="w-5 h-5" />
            Next Steps
          </h2>
          <ol className="list-inside list-decimal space-y-2 text-sm">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="font-semibold text-muted">{step}</li>
            ))}
          </ol>
        </section>

        {isDemo && (
          <div className="rounded-2xl border border-evidence-bg bg-evidence-bg p-4 text-center text-sm text-evidence">
            <span className="font-black">Demo Data</span>
            <p className="mt-1 font-semibold">This is a sample investigation. Connect live APIs for real-time verification.</p>
          </div>
        )}

        <div className="text-center pb-6 print:hidden">
          <button
            onClick={onBackToAudit}
            className="hireproof-focus rounded-xl bg-foreground px-6 py-3 font-black text-white shadow-lg hover:bg-safe"
          >
            Run Another Investigation
          </button>
        </div>
      </div>
    </div>
  )
}
