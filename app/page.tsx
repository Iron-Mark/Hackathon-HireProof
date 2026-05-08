import type { Metadata } from 'next'
import { HomeClient } from './home-client'

export const metadata: Metadata = {
  title: 'HireProof | Verify Job Posts Before Applying',
  description: 'Paste a job post or recruiter message. HireProof checks the claims with live evidence and returns a Safe, Caution, or High-Risk verdict before you apply.',
  openGraph: {
    title: 'HireProof - Verify Job Posts Before Applying',
    description: 'Know if it\'s legit before you apply. HireProof checks the claims and returns a verdict with receipts.',
    url: 'https://hireproof.tech',
    siteName: 'HireProof',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HireProof - Job Post Verification',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function HomePage() {
  return <HomeClient />
}
