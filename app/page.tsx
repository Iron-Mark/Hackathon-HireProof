import type { Metadata } from 'next'
import { HomePage as HireProofHomePage } from './home-page'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, canonicalFor, defaultOpenGraph } from '@/lib/seo'

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: canonicalFor('/'),
  },
  openGraph: defaultOpenGraph('/', DEFAULT_TITLE, DEFAULT_DESCRIPTION),
}

export default function HomePage() {
  return <HireProofHomePage />
}
