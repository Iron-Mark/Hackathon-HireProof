import { useState } from 'react'
import { Loader2 } from 'lucide-react'

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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/50 border rounded-lg p-8">
      {/* Text Input */}
      <div>
        <label className="block text-sm font-semibold mb-2">Job Post or Message</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the job post, recruiter message, or email here..."
          rows={8}
          className="w-full border rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
          disabled={loading}
        />
      </div>

      {/* URL Input */}
      <div>
        <label className="block text-sm font-semibold mb-2">Job URL (Optional)</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/job-posting"
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          disabled={loading}
        />
      </div>

      {/* Location Input */}
      <div>
        <label className="block text-sm font-semibold mb-2">Location (for local signals)</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Philippines, United States"
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="w-full bg-foreground text-background py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Investigating...' : 'Investigate'}
      </button>

      {/* Helper Text */}
      <p className="text-xs text-muted text-center">
        Your data is processed securely and not stored permanently.
      </p>
    </form>
  )
}
