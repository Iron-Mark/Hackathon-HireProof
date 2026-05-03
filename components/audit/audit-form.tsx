import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardPaste, FileText, Link2, Loader2, MapPin, Image as ImageIcon, X } from 'lucide-react'
import VoiceInputButton from '@/components/audit/voice-input-button'

interface AuditFormProps {
  onInvestigate: (data: { text: string; url?: string; location?: string; image?: string }) => void
  loading?: boolean
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const URL_PATTERN = /https?:\/\/[^\s<>"']+/i
const BARE_URL_PATTERN = /\b(?:(?:linkedin\.com|indeed\.com|www\.)|(?:[a-z0-9-]+\.)+(?:com|org|net|io|co|ph|dev|app)\/)[^\s<>"']*/i

function normalizeDetectedUrl(value: string) {
  const cleaned = value
    .replace(/^[([\]<]+/, '')
    .replace(/[)\].,;>]+$/, '')
    .trim()

  if (!cleaned) return ''
  return /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`
}

function extractFirstUrl(value: string) {
  const match = value.match(URL_PATTERN)?.[0] || value.match(BARE_URL_PATTERN)?.[0]
  return match ? normalizeDetectedUrl(match) : ''
}

function cleanDetectedLocation(value: string) {
  const cleaned = value
    .replace(/\s+/g, ' ')
    .replace(/(?:apply|contact|email|salary|role)\s*:.*$/i, '')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*[-–]\s*/g, ' - ')
    .replace(/[.;]+$/, '')
    .trim()
    .slice(0, 80)

  return cleaned
    .replace(/\bwfh\b/gi, 'WFH')
    .replace(/\b(remote|hybrid|onsite)\b/gi, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase())
}

function inferLocationFromText(value: string) {
  const setup = value.match(/(?:work\s*)?setup\s*[:\-]\s*([^\n;]{2,100})/i)
  if (setup?.[1]) return cleanDetectedLocation(setup[1])

  const explicit = value.match(/(?:job\s*)?(?:location|work\s*location|based)\s*[:\-]\s*([^\n;]{2,100})/i)
  if (explicit?.[1]) return cleanDetectedLocation(explicit[1])

  const modeWithPlace = value.match(/\b(Remote|Hybrid|Onsite|WFH)\s*[-–,/:]\s*([A-Za-z][A-Za-z .,'/-]{1,80})/i)
  if (modeWithPlace?.[1] && modeWithPlace?.[2]) {
    return cleanDetectedLocation(`${modeWithPlace[1]} - ${modeWithPlace[2]}`)
  }

  const phrase = value.match(/\b(?:based in|located in|onsite in|hybrid in|work from)\s+([A-Za-z][A-Za-z .,'/-]{1,80})/i)
  if (phrase?.[1]) return cleanDetectedLocation(phrase[1])

  if (/\bremote\b/i.test(value)) return 'Remote'
  if (/\bhybrid\b/i.test(value)) return 'Hybrid'
  return ''
}

function hasDraggedFile(event: DragEvent) {
  return Array.from(event.dataTransfer?.types || []).includes('Files')
}

export default function AuditForm({ onInvestigate, loading = false }: AuditFormProps) {
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [location, setLocation] = useState('Philippines')
  const [image, setImage] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [clipboardLoading, setClipboardLoading] = useState(false)
  const [urlClipboardLoading, setUrlClipboardLoading] = useState(false)
  const [locationTouched, setLocationTouched] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  
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
  const dragDepthRef = useRef(0)

  const applySmartFields = (nextText: string) => {
    const detectedUrl = extractFirstUrl(nextText)
    if (detectedUrl && !url.trim()) setUrl(detectedUrl)

    const detectedLocation = inferLocationFromText(nextText)
    if (detectedLocation && !locationTouched) setLocation(detectedLocation)
  }

  const handleTextChange = (nextText: string) => {
    setText(nextText)
    applySmartFields(nextText)
  }

  const loadImageBlob = useCallback((file: Blob) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
      return false
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      alert('Image must be less than 5MB')
      return false
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImage(base64String)
    }
    reader.readAsDataURL(file)
    return true
  }, [])

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      if (loading || !hasDraggedFile(event)) return
      event.preventDefault()
      dragDepthRef.current += 1
      setIsDraggingFile(true)
    }

    const handleDragOver = (event: DragEvent) => {
      if (loading || !hasDraggedFile(event)) return
      event.preventDefault()
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
      setIsDraggingFile(true)
    }

    const handleDragLeave = (event: DragEvent) => {
      if (!hasDraggedFile(event)) return
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
      if (dragDepthRef.current === 0) setIsDraggingFile(false)
    }

    const handleDrop = (event: DragEvent) => {
      if (loading || !hasDraggedFile(event)) return
      event.preventDefault()
      dragDepthRef.current = 0
      setIsDraggingFile(false)

      const file = Array.from(event.dataTransfer?.files || []).find((item) =>
        ALLOWED_IMAGE_TYPES.includes(item.type)
      )
      if (file) {
        loadImageBlob(file)
        return
      }

      alert('Drop a JPEG, PNG, or WebP screenshot.')
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [loadImageBlob, loading])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadImageBlob(file)
  }

  const handleClipboardPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      ALLOWED_IMAGE_TYPES.includes(item.type)
    )
    if (!imageItem) return

    const file = imageItem.getAsFile()
    if (!file) return
    e.preventDefault()
    loadImageBlob(file)
  }

  const handleClipboardButton = async () => {
    if (loading || clipboardLoading) return
    setClipboardLoading(true)

    try {
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          const imageType = item.types.find((type) => ALLOWED_IMAGE_TYPES.includes(type))
          if (imageType) {
            const blob = await item.getType(imageType)
            loadImageBlob(blob)
            return
          }
        }
      }

      if (navigator.clipboard.readText) {
        const clipboardText = (await navigator.clipboard.readText()).trim()
        if (clipboardText) {
          const nextText = text ? `${text}\n${clipboardText}` : clipboardText
          handleTextChange(nextText)
          return
        }
      }

      alert('No supported image or text found on the clipboard.')
    } catch {
      alert('Clipboard access is unavailable. Use Ctrl+V inside the text box or the Screenshot button.')
    } finally {
      setClipboardLoading(false)
    }
  }

  const handleUrlClipboardButton = async () => {
    if (loading || urlClipboardLoading) return
    setUrlClipboardLoading(true)

    try {
      const clipboardText = await navigator.clipboard.readText()
      const detectedUrl = extractFirstUrl(clipboardText)
      if (!detectedUrl) {
        alert('No job URL found on the clipboard.')
        return
      }
      setUrl(detectedUrl)
    } catch {
      alert('Clipboard access is unavailable. Paste the job URL manually.')
    } finally {
      setUrlClipboardLoading(false)
    }
  }

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const detectedUrl = extractFirstUrl(e.clipboardData.getData('text'))
    if (!detectedUrl) return
    e.preventDefault()
    setUrl(detectedUrl)
  }

  const handleAutoDetectLocation = () => {
    const detectedLocation = inferLocationFromText(`${text}\n${url}`)
    if (!detectedLocation) {
      alert('No location found in the job post yet.')
      return
    }
    setLocation(detectedLocation)
    setLocationTouched(false)
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
    <>
      {isDraggingFile && (
        <motion.div
          data-testid="audit-drop-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm"
        >
          <div className="max-w-sm rounded-2xl border border-dashed border-safe bg-surface p-6 text-center shadow-2xl shadow-safe/10">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-safe-bg text-safe">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-base font-black text-foreground">Drop screenshot to attach</p>
            <p className="mt-1 text-sm font-semibold text-muted">JPEG, PNG, or WebP up to 5MB</p>
          </div>
        </motion.div>
      )}
      <form onSubmit={handleSubmit} className="hireproof-card rounded-2xl p-5 sm:p-6 lg:p-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)] lg:items-start lg:gap-6">
        <div className="min-w-0">
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-black">
            <FileText className="h-4 w-4 text-safe" />
            Job post or message
          </label>
          <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end sm:gap-3">
            <div className="flex items-center gap-2">
              {isListening ? (
                <>
                  <Waveform />
                  <span className="hidden text-[10px] font-black uppercase tracking-widest text-safe animate-pulse md:inline">Listening...</span>
                </>
              ) : (
                <span className="hidden text-[10px] font-black uppercase tracking-widest text-muted md:inline">Voice Dictation</span>
              )}
            </div>
            <VoiceInputButton 
              onTranscript={(transcript) => handleTextChange(text + (text ? ' ' : '') + transcript)}
              disabled={loading}
              onListeningChange={setIsListening}
            />
            <button
              type="button"
              onClick={handleClipboardButton}
              disabled={loading || clipboardLoading}
              title="Paste text or screenshot from clipboard"
              aria-label="Paste text or screenshot from clipboard"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft bg-background text-xs font-black text-muted hover:text-foreground disabled:opacity-50 sm:h-auto sm:w-auto sm:min-h-[44px] sm:gap-1.5 sm:border-0 sm:bg-transparent sm:px-2"
            >
              {clipboardLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ClipboardPaste className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Paste</span>
            </button>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              title="Upload screenshot"
              aria-label="Upload screenshot"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft bg-background text-xs font-black text-muted hover:text-foreground sm:h-auto sm:w-auto sm:min-h-[44px] sm:gap-1.5 sm:border-0 sm:bg-transparent sm:px-2"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Screenshot</span>
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
          onChange={(e) => handleTextChange(e.target.value)}
          onPaste={handleClipboardPaste}
          placeholder="Paste the job post, recruiter message, freelance gig, or scholarship/work offer here..."
          data-testid="job-input-text"
          aria-label="Job Description"
          className="hireproof-focus w-full resize-none rounded-xl border border-border bg-background p-4 text-sm font-medium leading-6 placeholder:text-muted/70 focus:border-evidence focus:bg-surface focus:outline-none focus:ring-4 focus:ring-evidence-bg lg:min-h-[360px]"
          disabled={loading}
          rows={image ? 3 : 6}
          maxLength={10000}
        />
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:rounded-xl lg:border lg:border-border-soft lg:bg-background/45 lg:p-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-black">
              <Link2 className="h-4 w-4 text-evidence" />
              Job URL <span className="font-semibold text-muted">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onPaste={handleUrlPaste}
                placeholder="Paste job URL or let HireProof pull it from the job text."
                data-testid="job-input-url"
                aria-label="Job URL"
                className="hireproof-focus w-full rounded-xl border border-border bg-background p-3 pr-12 text-sm font-medium placeholder:text-muted/70 focus:border-evidence focus:bg-surface focus:outline-none focus:ring-4 focus:ring-evidence-bg"
                disabled={loading}
                maxLength={2000}
              />
              <button
                type="button"
                onClick={handleUrlClipboardButton}
                disabled={loading || urlClipboardLoading}
                title="Paste job URL from clipboard"
                aria-label="Paste job URL from clipboard"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-evidence transition-colors hover:bg-evidence-bg disabled:opacity-50"
              >
                {urlClipboardLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ClipboardPaste className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm font-black">
                <MapPin className="h-4 w-4 text-caution" />
                Location <span className="font-semibold text-muted">(for local signals)</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-caution-bg bg-caution-bg px-2 text-xs font-black text-caution-text transition-colors hover:bg-caution/20"
                aria-label="Auto-detect location from job post"
              >
                <MapPin className="h-3.5 w-3.5" />
                Auto
              </button>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setLocationTouched(true)
              }}
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
            className="hireproof-focus cta-glow flex w-full items-center justify-center gap-2 rounded-xl border border-safe bg-safe py-3 font-black text-background shadow-lg shadow-safe/20 transition-colors hover:bg-safe-text disabled:cursor-not-allowed disabled:border-safe/30 disabled:bg-safe-bg disabled:text-safe-text disabled:opacity-100 disabled:shadow-none"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Investigating...' : 'Investigate'}
          </button>

          <p className="text-center text-xs font-semibold text-muted">
            Do not paste passwords, IDs, bank details, or verification codes. Reports may be saved for history or share links.
          </p>
        </div>
      </div>
      </form>
    </>
  )
}
