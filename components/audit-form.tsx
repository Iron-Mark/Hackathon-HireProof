import { useState } from 'react'
import { FileText, Link2, Loader2, MapPin } from 'lucide-react'

interface AuditFormProps {
  onInvestigate: (data: { text: string; url?: string; location?: string }) => void
  loading?: boolean
}

export default function AuditForm({ onInvestigate, loading = false }: AuditFormProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [location, setLocation] = useState('Philippines')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onInvestigate({ text, url, location })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="hireproof-card space-y-6 rounded-2xl p-6 sm:p-8">
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-black">
          <FileText className="h-4 w-4 text-safe" />
          Job post or message
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the job post, recruiter message, or email here..."
          rows={8}
          className="hireproof-focus w-full resize-none rounded-xl border border-border bg-background p-4 text-sm font-medium leading-6 placeholder:text-muted/70 focus:border-evidence focus:bg-white focus:outline-none focus:ring-4 focus:ring-evidence-bg"
          disabled={loading}
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-black">
          <Link2 className="h-4 w-4 text-evidence" />
          Job URL <span className="font-semibold text-muted">(optional)</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/job-posting"
          className="hireproof-focus w-full rounded-xl border border-border bg-background p-3 text-sm font-medium placeholder:text-muted/70 focus:border-evidence focus:bg-white focus:outline-none focus:ring-4 focus:ring-evidence-bg"
          disabled={loading}
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-black">
          <MapPin className="h-4 w-4 text-caution" />
          Location <span className="font-semibold text-muted">(for local signals)</span>
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Philippines, United States"
          className="hireproof-focus w-full rounded-xl border border-border bg-background p-3 text-sm font-medium placeholder:text-muted/70 focus:border-evidence focus:bg-white focus:outline-none focus:ring-4 focus:ring-evidence-bg"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="hireproof-focus flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 font-black text-white shadow-lg hover:bg-safe disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Investigating...' : 'Investigate'}
      </button>

      <p className="text-center text-xs font-semibold text-muted">
        Your data is processed securely and not stored permanently.
      </p>
    </form>
  )
}
