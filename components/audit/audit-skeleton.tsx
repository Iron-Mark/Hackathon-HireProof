import { Skeleton } from "./ui/skeleton"
import { ShieldCheck, Activity } from "lucide-react"

export function AuditSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      {/* Verdict Skeleton */}
      <div className="rounded-2xl border border-border-soft bg-surface/50 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/10">
            <Activity className="h-6 w-6 animate-pulse text-muted" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-20 w-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-2.5 w-full max-w-md rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart Skeleton */}
      <div className="rounded-2xl border border-border-soft bg-surface/50 p-6 shadow-sm">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="flex justify-center py-10">
          <div className="relative h-64 w-64 rounded-full border-4 border-dashed border-muted/10 animate-spin-slow" />
        </div>
      </div>

      {/* Claims Skeleton */}
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-border-soft bg-surface/50 p-4">
              <Skeleton className="mb-2 h-3 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-10">
        <div className="flex items-center gap-2 text-sm font-black text-muted animate-pulse">
          <ShieldCheck className="h-4 w-4" />
          AGENT IS INVESTIGATING EVIDENCE...
        </div>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-safe animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-safe animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-safe animate-bounce" />
        </div>
      </div>
    </div>
  )
}
