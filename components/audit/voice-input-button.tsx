'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  onListeningChange?: (isListening: boolean) => void
  disabled?: boolean
}

export default function VoiceInputButton({ onTranscript, onListeningChange, disabled }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const toggleListening = useCallback(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      onListeningChange?.(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript
        }
      }
      if (transcript.trim()) {
        onTranscript(transcript.trim())
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      onListeningChange?.(false)
    }

    recognition.start()
    setIsListening(true)
    onListeningChange?.(true)
  }, [isListening, onTranscript, onListeningChange])

  // Check if browser supports speech recognition
  if (typeof window !== 'undefined') {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded-lg border border-border-soft bg-background text-xs font-black transition-colors sm:h-auto sm:w-auto sm:min-h-[44px] sm:min-w-[44px] sm:gap-1.5 sm:border-0 sm:bg-transparent sm:px-2 ${
        isListening
          ? 'text-high-risk animate-pulse'
          : 'text-muted hover:text-foreground'
      }`}
      title={isListening ? 'Stop listening' : 'Dictate job post'}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
    </button>
  )
}
