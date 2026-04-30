import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Link2, Loader2, MapPin, Image as ImageIcon, X } from 'lucide-react'
import VoiceInputButton from '@/components/voice-input-button'

interface AuditFormProps {
  onInvestigate: (data: { text: string; url?: string; location?: string; image?: string }) => void
  loading?: boolean
}

export default function AuditForm({ onInvestigate, loading = false }: AuditFormProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [location, setLocation] = useState('Philippines')
  const [image, setImage] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  
  const Waveform = () => (
    <div className="flex items-center gap-1 h-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <motion.div
          key={i}
          animate={{ height: [4, Math.random() * 16 + 4, 4] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
          className="w-1 bg-safe rounded-full"
        />
      ))}
    </div>
  )
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImage(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Input Sanitization: Trim and strip potential malicious tags
    const cleanText = text.trim().replace(/<script.*?>.*?<\/script>/gi, '')
    const cleanUrl = url.trim().replace(/<script.*?>.*?<\/script>/gi, '')
    
    if (cleanText || image) {
      onInvestigate({ 
        text: cleanText || 'Please extract job details from the uploaded image.', 
        url: cleanUrl, 
        location,
        image: image || undefined
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="hireproof-card space-y-6 rounded-2xl p-6 sm:p-8">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-black">
            <FileText className="h-4 w-4 text-safe" />
            Job post or message
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isListening ? (
                <>
                  <Waveform />
                  <span className="text-[10px] font-black uppercase tracking-widest text-safe animate-pulse">Listening...</span>
                </>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Voice Dictation</span>
              )}
            </div>
            <VoiceInputButton 
              onTranscript={(transcript) => setText(prev => prev + (prev ? ' ' : '') + transcript)}
              disabled={loading}
              onListeningChange={setIsListening}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[44px] items-center gap-1.5 px-2 text-xs font-black text-muted hover:text-foreground"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Screenshot
            </button>
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/jpeg,image/png,image/webp" 
          className="hidden" 
          onChange={handleImageUpload}
        />

        {image && (
          <div className="mb-3 relative rounded-xl border border-border-soft p-2">
            <img src={image} alt="Uploaded screenshot" className="h-32 w-auto rounded-lg object-contain" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background hover:bg-risk-text shadow-sm after:absolute after:inset-[-10px]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the job post, recruiter message, freelance gig, or scholarship/work offer here..."
          data-testid="job-input-text"
          aria-label="Job Description"
          className="hireproof-focus w-full resize-none rounded-xl border border-border bg-background p-4 text-sm font-medium leading-6 placeholder:text-muted/70 focus:border-evidence focus:bg-surface focus:outline-none focus:ring-4 focus:ring-evidence-bg"
          disabled={loading}
          rows={image ? 3 : 6}
          maxLength={10000}
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
          placeholder="Optional. Some job boards may block automated fetches, so paste the post text too."
          data-testid="job-input-url"
          aria-label="Job URL"
          className="hireproof-focus w-full rounded-xl border border-border bg-background p-3 text-sm font-medium placeholder:text-muted/70 focus:border-evidence focus:bg-surface focus:outline-none focus:ring-4 focus:ring-evidence-bg"
          disabled={loading}
          maxLength={2000}
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
          data-testid="job-input-location"
          aria-label="Location"
          className="hireproof-focus w-full rounded-xl border border-border bg-background p-3 text-sm font-medium placeholder:text-muted/70 focus:border-evidence focus:bg-surface focus:outline-none focus:ring-4 focus:ring-evidence-bg"
          disabled={loading}
          maxLength={200}
        />
      </div>

      <button
        type="submit"
        data-testid="investigate-button"
        aria-label="Investigate Job Post"
        disabled={loading || (!text.trim() && !image)}
        className="hireproof-focus cta-glow flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 font-black text-background shadow-lg hover:bg-safe disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Investigating...' : 'Investigate'}
      </button>

      <p className="text-center text-xs font-semibold text-muted">
        Do not paste passwords, IDs, bank details, or verification codes. Reports may be saved for history or share links.
      </p>
    </form>
  )
}
