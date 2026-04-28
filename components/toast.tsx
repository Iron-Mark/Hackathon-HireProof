'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: number
  message: string
  type?: 'success' | 'info' | 'error'
}

let toastId = 0

const MAX_TOASTS = 5
const TOAST_DURATION = 3500

// Global toast queue — components call showToast() anywhere
const listeners = new Set<(toast: Toast) => void>()

export function showToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
  if (!message || typeof message !== 'string') return
  const toast: Toast = { id: ++toastId, message: message.slice(0, 200), type }
  listeners.forEach((fn) => fn(toast))
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => {
        // Deduplicate: don't show the same message if it's already visible
        if (prev.some((t) => t.message === toast.message)) return prev
        // Cap visible toasts
        const next = [...prev, toast]
        return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next
      })
      const timerId = window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, TOAST_DURATION)
      // Cleanup on unmount handled by the timeout itself
      return () => window.clearTimeout(timerId)
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = toast.type === 'error' ? AlertCircle : CheckCircle2
            const iconColor = toast.type === 'error' ? 'text-high-risk' : toast.type === 'info' ? 'text-evidence' : 'text-safe'
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
                className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border-soft bg-surface px-4 py-3 shadow-lg max-w-sm"
              >
                <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                <span className="text-sm font-bold truncate">{toast.message}</span>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="ml-1 shrink-0 text-muted hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
