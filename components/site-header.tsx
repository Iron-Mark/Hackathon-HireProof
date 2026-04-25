import Link from 'next/link'
import { BrandMark } from '@/components/brand-mark'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-soft bg-background/92 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="hireproof-focus flex items-center gap-3 rounded-sm">
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className="leading-tight">
            <div className="text-lg font-black tracking-normal">HireProof</div>
            <div className="hidden text-xs font-semibold text-muted sm:block">Job-post verification with receipts</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-border-soft bg-surface/75 p-1 text-sm font-semibold shadow-sm">
          <Link href="/" className="hireproof-focus rounded-full px-3 py-2 text-muted hover:bg-background hover:text-foreground">
            Home
          </Link>
          <Link href="/audit" className="hireproof-focus rounded-full px-3 py-2 text-muted hover:bg-background hover:text-foreground">
            Audit
          </Link>
          <Link href="/history" className="hireproof-focus rounded-full px-3 py-2 text-muted hover:bg-background hover:text-foreground">
            History
          </Link>
        </nav>
      </div>
    </header>
  )
}
