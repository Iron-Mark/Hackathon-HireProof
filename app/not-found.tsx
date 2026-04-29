import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="hireproof-card flex max-w-md flex-col items-center justify-center space-y-6 rounded-3xl border border-border-soft p-8 text-center shadow-xl sm:p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-muted shadow-inner">
            <FileQuestion className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground">404</h1>
            <h2 className="text-xl font-bold text-foreground">Page not found</h2>
            <p className="font-medium leading-relaxed text-muted pt-2">
              We couldn't find the page you were looking for. It might have been moved or deleted.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 pt-4">
            <Link
              href="/"
              className="hireproof-focus flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-black text-background transition-colors hover:bg-safe"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
