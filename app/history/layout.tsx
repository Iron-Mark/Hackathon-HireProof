import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'Local Report History | HireProof',
  'Private browser-local HireProof report history for previously checked job posts.',
)

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
