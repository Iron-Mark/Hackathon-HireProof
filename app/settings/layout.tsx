import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo'

export const metadata: Metadata = privatePageMetadata(
  'Settings | HireProof',
  'Private local HireProof settings for browser history, theme, notification, and saved audit preferences.',
)

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
