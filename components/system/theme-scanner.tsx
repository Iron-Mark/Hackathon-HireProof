'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'

export function ThemeScanner() {
  const { theme } = useTheme()
  const previousTheme = useRef<string | undefined>(undefined)
  const [isScanning, setIsScanning] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (previousTheme.current === undefined) {
      previousTheme.current = theme
      return
    }
    if (previousTheme.current === theme) return
    previousTheme.current = theme

    setIsScanning(true)
    const timer = setTimeout(() => setIsScanning(false), 2000)
    return () => clearTimeout(timer)
  }, [theme, mounted])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {isScanning && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-[100] flex justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-full border border-safe/20 bg-surface/95 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-safe shadow-lg backdrop-blur"
          >
            Theme updated
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
