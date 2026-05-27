import type { Metadata } from 'next'
import { HomeClient } from './home-client'
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
  return <HomeClient />
}
