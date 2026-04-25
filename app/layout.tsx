import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HireProof',
  description: 'Paste a job post. Know if it\'s legit before you apply.',
  openGraph: {
    title: 'HireProof',
    description: 'Paste a job post. Know if it\'s legit before you apply.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
