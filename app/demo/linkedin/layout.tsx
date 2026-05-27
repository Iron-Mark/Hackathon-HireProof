import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'LinkedIn Extension Demo | HireProof',
  'Non-indexed HireProof extension demo surface for showing a seeded suspicious job post scan.',
)

export default function LinkedInDemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
