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
        return 'text-safe'
      case 'caution':
        return 'text-caution'
      case 'high-risk':
        return 'text-high-risk'
      default:
        return 'text-foreground'
    }
  }

  const getVerdictBg = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return 'bg-safe/5'
      case 'caution':
        return 'bg-caution/5'
      case 'high-risk':
        return 'bg-high-risk/5'
      default:
        return 'bg-border/50'
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

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBackToAudit}
            className="flex items-center gap-2 text-sm font-medium hover:text-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Audit
          </button>
          <div className="flex gap-3">
            <button className="p-2 border rounded hover:bg-white/50 transition-colors" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 border rounded hover:bg-white/50 transition-colors" title="Download">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Verdict Section */}
        <section className={`rounded-lg p-8 border ${getVerdictBg(result.verdict)}`}>
          <div className="flex items-start gap-6">
            <div className={`${getVerdictColor(result.verdict)} flex-shrink-0`}>
              {getVerdictIcon(result.verdict)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl font-bold ${getVerdictColor(result.verdict)}`}>
                  {getVerdictText(result.verdict)}
                </h1>
                <span className="text-sm font-semibold text-muted">
                  {result.confidence}
                </span>
              </div>
              <p className="text-lg mb-4">{result.summary}</p>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-sm text-muted mb-1">Risk Score</div>
                  <div className="text-3xl font-bold">{result.riskScore}/100</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Extracted Claims */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Extracted Information</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(result.extractedClaims).map(([key, value]) => (
              <div key={key} className="border rounded-lg p-4 bg-white/50">
                <div className="text-sm text-muted capitalize mb-1">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Investigation Timeline */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Investigation Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">Parsed job post claims</div>
                <div className="text-sm text-muted">Extracted company, role, salary, and contact details</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">Searched company web presence</div>
                <div className="text-sm text-muted">Checked domain registration and LinkedIn profile</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">Checked recent news and reputation</div>
                <div className="text-sm text-muted">Searched for scam reports and company mentions</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">Compared market standards</div>
                <div className="text-sm text-muted">Looked up comparable legitimate job listings</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">Verified local presence</div>
                <div className="text-sm text-muted">Checked maps, directories, and business registrations</div>
              </div>
            </div>
          </div>
        </section>

        {/* Red Flags */}
        {result.redFlags.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-high-risk">
              <AlertTriangle className="w-5 h-5" />
              Red Flags
            </h2>
            <div className="space-y-2">
              {result.redFlags.map((flag, i) => (
                <div key={i} className="flex gap-3 p-3 border rounded-lg bg-high-risk/5">
                  <AlertTriangle className="w-4 h-4 text-high-risk flex-shrink-0 mt-0.5" />
                  <div>{flag}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Green Flags */}
        {result.greenFlags.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-safe">
              <CheckCircle2 className="w-5 h-5" />
              Green Flags
            </h2>
            <div className="space-y-2">
              {result.greenFlags.map((flag, i) => (
                <div key={i} className="flex gap-3 p-3 border rounded-lg bg-safe/5">
                  <CheckCircle2 className="w-4 h-4 text-safe flex-shrink-0 mt-0.5" />
                  <div>{flag}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Evidence Section */}
        {result.evidence.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Supporting Evidence</h2>
            <div className="space-y-3">
              {result.evidence.map((ev, i) => (
                <div key={i} className="border rounded-lg p-4 bg-white/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-sm">{ev.source}</div>
                    <span className="text-xs px-2 py-1 bg-border rounded">{ev.type}</span>
                  </div>
                  <p className="text-sm mb-2 text-muted">{ev.snippet}</p>
                  {ev.url && (
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-xs text-foreground underline hover:opacity-70">
                      Read full article →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Safer Alternatives */}
        {result.alternatives.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Safer Alternatives</h2>
            <div className="space-y-3">
              {result.alternatives.map((alt, i) => (
                <div key={i} className="border rounded-lg p-4 bg-safe/5">
                  <div className="font-semibold">{alt.title}</div>
                  <div className="text-sm text-muted">{alt.company}</div>
                  {alt.salary && <div className="text-sm font-medium mt-1">{alt.salary}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Next Steps */}
        <section className="bg-white/50 border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Next Steps
          </h2>
          <ol className="space-y-2 list-decimal list-inside text-sm">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="text-muted">{step}</li>
            ))}
          </ol>
        </section>

        {/* Demo Badge */}
        {isDemo && (
          <div className="p-4 bg-border/50 rounded-lg border text-center text-sm">
            <span className="font-semibold text-muted">Demo Data</span>
            <p className="text-muted mt-1">This is a sample investigation. Connect live APIs for real-time verification.</p>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center pb-6">
          <button
            onClick={onBackToAudit}
            className="px-6 py-3 bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Run Another Investigation
          </button>
        </div>
      </div>
    </div>
  )
}
