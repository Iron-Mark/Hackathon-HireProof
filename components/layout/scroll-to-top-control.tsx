'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTopControl() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let ticking = false

    const updateVisibility = () => {
      setVisible(window.scrollY > 420)
      ticking = false
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(updateVisibility)
    }

    updateVisibility()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
      className={`hireproof-focus group fixed right-3 z-50 flex min-h-12 min-w-12 items-center justify-center rounded-full border border-border-soft bg-surface/95 text-foreground shadow-2xl backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-safe/40 hover:bg-background hover:text-safe sm:right-6 lg:right-8 ${
        visible
          ? 'bottom-[5.25rem] translate-x-0 opacity-100 sm:bottom-[6rem]'
          : 'pointer-events-none bottom-[5.25rem] translate-x-3 opacity-0 sm:bottom-[6rem]'
      }`}
    >
      <ArrowUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" aria-hidden="true" />
      <span className="sr-only">Back to top</span>
    </button>
  )
}
