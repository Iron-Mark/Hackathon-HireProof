'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RotateCw, ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="hireproof-card flex max-w-md flex-col items-center justify-center space-y-6 rounded-3xl border border-border-soft p-8 text-center shadow-xl sm:p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-high-risk/10 text-high-risk shadow-inner">
            <AlertCircle className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">This page couldn't load</h1>
            <p className="font-medium leading-relaxed text-muted">
              We encountered an unexpected error. Reload to try again, or go back.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 pt-2 sm:flex-row">
            <button
              onClick={() => reset()}
              className="hireproof-focus flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-black text-background transition-colors hover:bg-safe"
            >
              <RotateCw className="h-4 w-4" />
              Reload
            </button>
            <button
              onClick={() => router.back()}
              className="hireproof-focus flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-border"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
