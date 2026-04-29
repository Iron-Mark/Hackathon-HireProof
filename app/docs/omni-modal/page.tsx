import { Globe, Mic, Image, FileText, Zap, ShieldCheck } from 'lucide-react'

export const metadata = { 
  title: 'Omni-Modal Input — HireProof Docs',
  description: 'Submit job posts via text, image screenshots, or voice dictation.'
}

export default function OmniModalPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Omni-Modal Input</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          Scams don&apos;t just live in text. HireProof accepts job posts through three distinct input modalities to cover the entire recruitment landscape.
        </p>
      </section>

      {/* Modalities Grid */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* Text */}
        <div className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm transition-all hover:border-safe hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-safe/10 text-safe">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-black">Rich Text</h3>
          <p className="text-xs font-medium text-muted leading-relaxed">
            Paste raw job descriptions, recruiter DMs, or Telegram messages. Our NLP engine handles messy formatting and extracts core claims automatically.
          </p>
        </div>

        {/* Vision */}
        <div className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm transition-all hover:border-evidence hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-evidence/10 text-evidence">
            <Image className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-black">Vision Scan</h3>
          <p className="text-xs font-medium text-muted leading-relaxed">
            Upload screenshots of WhatsApp chats, LinkedIn posts, or PDF offer letters. Using <strong>GPT-4o Vision</strong>, we extract text directly from the pixels.
          </p>
        </div>

        {/* Voice */}
        <div className="rounded-3xl border border-border-soft bg-surface p-8 shadow-sm transition-all hover:border-caution hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-caution/10 text-caution">
            <Mic className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-black">Voice Dictation</h3>
          <p className="text-xs font-medium text-muted leading-relaxed">
            Interview on the go? Dictate a job offer using the <strong>Web Speech API</strong>. High-accuracy real-time transcription maps directly into our audit engine.
          </p>
        </div>
      </section>

      {/* Tech Breakdown */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black">Modalities Comparison</h2>
        <div className="overflow-hidden rounded-2xl border border-border-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft bg-surface">
                <th className="px-6 py-4 text-left font-black text-muted uppercase tracking-widest text-[10px]">Modality</th>
                <th className="px-6 py-4 text-left font-black text-muted uppercase tracking-widest text-[10px]">Processing Layer</th>
                <th className="px-6 py-4 text-left font-black text-muted uppercase tracking-widest text-[10px]">Best for</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Text', tech: 'GPT-4o-mini / Regex Fallback', use: 'Email, LinkedIn, Direct Messages' },
                { type: 'Image', tech: 'GPT-4o Vision', use: 'WhatsApp, Telegram, PDF Documents' },
                { type: 'Voice', tech: 'Web Speech API (Native)', use: 'On-the-go dictation, Phone calls' },
              ].map((row) => (
                <tr key={row.type} className="border-b border-border-soft last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4 font-black">{row.type}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted">{row.tech}</td>
                  <td className="px-6 py-4 text-xs font-medium text-muted">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Security Banner */}
      <section className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start gap-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-safe" />
          <div className="space-y-2">
            <p className="text-sm font-black uppercase tracking-widest text-safe">Privacy First</p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              All multi-modal inputs are processed in-memory and never persisted unless a permanent share link is generated. Images are stripped of EXIF metadata before being sent to the vision model.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
