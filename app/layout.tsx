import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/system/theme-provider'
import { ToastProvider } from '@/components/system/toast'
import { CommandMenu } from '@/components/layout/command-menu'
import { SiteFooter } from '@/components/layout/site-footer'
import { ThemeScanner } from '@/components/system/theme-scanner'
import { DemoLoginSnackbar } from '@/components/system/demo-login-snackbar'
import Script from 'next/script'

export const metadata: Metadata = {
  title: {
    default: 'HireProof | Verify Job Posts Before Applying',
    template: '%s | HireProof'
  },
  description: 'Paste a job post or recruiter message. HireProof checks the claims with live evidence and returns a Safe, Caution, or High-Risk verdict before you apply.',
  metadataBase: new URL('https://hireproof.vercel.app'),
  keywords: ['job search', 'scam detector', 'hireproof', 'job verification', 'recruitment scam', 'recruitment fraud'],
  authors: [{ name: 'HireProof Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'HireProof',
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
    site: '@hireproof',
    creator: '@hireproof',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0c0f14',
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
            <ThemeScanner />
            <CommandMenu />
            <DemoLoginSnackbar />
            <Script
              id="json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'SoftwareApplication',
                  name: 'HireProof',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web, Chrome',
                  description: 'AI-powered job post verification and recruitment scam detection.',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                  },
                }),
              }}
            />
            <Script
              id="breadcrumb-json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Home",
                      "item": "https://hireproof.vercel.app"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "Audit",
                      "item": "https://hireproof.vercel.app/audit"
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": "Intelligence",
                      "item": "https://hireproof.vercel.app/explore"
                    }
                  ]
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
