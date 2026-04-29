import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/toast'
import { CommandMenu } from '@/components/command-menu'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: {
    default: 'HireProof | The Human Filter for Job Scams',
    template: '%s | HireProof'
  },
  description: 'The last line of defense against automated recruitment scams. Filter out the "Dead Internet" and verify job posts with live evidence.',
  metadataBase: new URL('https://hireproof.vercel.app'),
  keywords: ['job search', 'scam detector', 'hireproof', 'job verification', 'dead internet theory', 'bot detection', 'recruitment fraud'],
  authors: [{ name: 'HireProof Team' }],
  manifest: '/manifest.json',
  themeColor: '#0c0f14',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HireProof',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'HireProof - Job Verification',
    description: 'Paste a job post. Know if it\'s legit before you apply. HireProof checks the claims and returns a verdict with receipts.',
    url: 'https://hireproof.vercel.app',
    siteName: 'HireProof',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HireProof - Verify job posts before applying',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HireProof - Job Verification',
    description: 'Know if it\'s legit before you apply.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ToastProvider>
            <CommandMenu />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'SoftwareApplication',
                  name: 'HireProof',
                  applicationCategory: 'SecurityApplication',
                  operatingSystem: 'Web, Chrome',
                  description: 'AI-powered job post verification and scam detection platform.',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                }),
              }}
            />
            <main className="min-h-screen">
              {children}
            </main>
            <SiteFooter />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
