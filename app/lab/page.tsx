import type { Metadata } from 'next'
import { LabClient } from './lab-client'
import { SiteHeader } from '@/components/layout/site-header'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
  path: '/lab',
  title: 'Verification Lab | Job Post Signal Review',
  description: 'Step inside the Glass Box. Monitor how HireProof reviews recruitment data and highlights suspicious job-post signals.',
})

export default function LabPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-safe/30 hireproof-grid">
      <SiteHeader />
      <LabClient />
    </div>
  )
}
