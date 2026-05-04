'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, X, Zap, Loader2 } from 'lucide-react'
import { showToast } from '@/components/system/toast'

const SHOW_DELAY_MS = 1800
const AUTO_DISMISS_MS = 18000 // 18 seconds before it decays away
const demoLoginEnabled = process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED === 'true'

export function DemoLoginSnackbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(100)

  // Only show on the developer portal
  const isDeveloperPage = demoLoginEnabled && pathname === '/developer'

  useEffect(() => {
    if (!isDeveloperPage || dismissed) return

    // Show after a short delay so the page loads first
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(showTimer)
  }, [isDeveloperPage, dismissed])

  // Progress bar decay
  useEffect(() => {
    if (!visible) return

    const interval = 100
    const step = (interval / AUTO_DISMISS_MS) * 100
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step
        if (next <= 0) {
          setVisible(false)
          return 0
        }
        return next
      })
    }, interval)

    return () => clearInterval(timer)
  }, [visible])

  const handleDemoLogin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' })
      const json = await res.json()
      if (res.status === 403) {
        showToast('Demo login is disabled in this environment.', 'info')
        setVisible(false)
        return
      }
      if (!res.ok) {
        showToast(json.error || 'Demo login failed.', 'info')
        return
      }
      showToast(`Signed in as ${json.user?.email}`, 'success')
      setVisible(false)
      router.refresh()
    } catch {
      showToast('Network error during demo login.', 'info')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
  }

  if (!isDeveloperPage) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-2xl shadow-black/20 backdrop-blur-md"
        >
          {/* Decay progress bar */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border-soft">
            <motion.div
              className="h-full bg-safe origin-left"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0 }}
            />
          </div>

          <div className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-safe text-background dark:text-[#06130d]">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest">Judge Access</div>
                  <div className="text-[10px] font-semibold text-muted">Quick demo credentials</div>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-border-soft bg-background px-3 py-2.5 font-mono text-[11px] text-muted space-y-0.5">
              <div><span className="text-muted/50">email</span> <span className="text-foreground font-bold">judge@hackathon.com</span></div>
              <div><span className="text-muted/50">pass </span> <span className="text-foreground font-bold">hireproof2026</span></div>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="hireproof-cta-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              {loading ? 'Signing in…' : 'One-click demo login'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
