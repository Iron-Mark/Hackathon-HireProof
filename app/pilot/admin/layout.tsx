import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'Pilot Admin | HireProof',
  'Authenticated pilot request export and lightweight product analytics for HireProof.',
)

export default function PilotAdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
