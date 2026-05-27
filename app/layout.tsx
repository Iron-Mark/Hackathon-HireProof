import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/system/theme-provider'
import { ToastProvider } from '@/components/system/toast'
import { CommandMenu } from '@/components/layout/command-menu'
import { ScrollToTopControl } from '@/components/layout/scroll-to-top-control'
import { SiteFooter } from '@/components/layout/site-footer'
import { ThemeScanner } from '@/components/system/theme-scanner'
import { DemoLoginSnackbar } from '@/components/system/demo-login-snackbar'
import { Analytics } from '@vercel/analytics/next'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SEO_KEYWORDS,
  SITE_NAME,
  SITE_URL,
  buildSiteJsonLd,
} from '@/lib/seo'

export const metadata: Metadata = {
  applicationName: SITE_NAME,
  title: {
    default: DEFAULT_TITLE,
    template: '%s | HireProof'
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  keywords: SEO_KEYWORDS,
  authors: [{ name: 'HireProof Team' }],
  creator: 'HireProof Team',
  publisher: SITE_NAME,
  category: 'employment safety',
  classification: 'Job post verification and recruitment scam detection',
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
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
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
    site: '@hireproof',
    creator: '@hireproof',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#167C5C',
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
            <ScrollToTopControl />
            <DemoLoginSnackbar />
            <script
              id="site-json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(buildSiteJsonLd()),
              }}
            />
            <main className="min-h-screen">
              {children}
            </main>
            <SiteFooter />
            <Analytics />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
