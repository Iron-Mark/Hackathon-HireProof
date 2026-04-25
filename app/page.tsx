import Link from 'next/link'
import { ArrowRight, CheckCircle2, AlertCircle, Globe, TrendingUp, MapPin } from 'lucide-react'

export default function Home() {
  return (
    <div className="w-full bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="font-bold text-2xl">HireProof</div>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-muted">Home</Link>
            <Link href="/audit" className="hover:text-muted">Audit</Link>
            <Link href="/history" className="hover:text-muted">History</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6 text-balance">
            Paste a job post. Know if it&apos;s legit before you apply.
          </h1>
          <p className="text-xl text-muted mb-10 text-balance">
            HireProof checks company presence, recent news, comparable openings, and local signals before you waste time applying.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded font-medium hover:opacity-90"
          >
            Start Investigation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Sample Suspicious Post */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Example Suspicious Opportunity</h2>
          <div className="border rounded-lg p-6 bg-white/50">
            <div className="space-y-3 text-sm mb-6">
              <p><strong>Position:</strong> Remote Frontend Intern</p>
              <p><strong>Salary:</strong> PHP 80,000 per week</p>
              <p><strong>Location:</strong> Remote</p>
              <p><strong>Contact:</strong> Message us on Telegram</p>
              <p><strong>Requirements:</strong> Basic HTML/CSS knowledge, no interview needed</p>
            </div>
            <Link
              href="/audit"
              className="text-sm text-foreground underline hover:opacity-70"
            >
              Investigate this post →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">How It Works</h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-border rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Paste the Post</h3>
              <p className="text-sm text-muted">Enter any job post, recruiter message, or URL you&apos;re suspicious about.</p>
            </div>
            <div className="text-center">
              <div className="bg-border rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">We Investigate</h3>
              <p className="text-sm text-muted">Our agent checks web presence, news, comparable jobs, and local footprint.</p>
            </div>
            <div className="text-center">
              <div className="bg-border rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">See the Verdict</h3>
              <p className="text-sm text-muted">Get a Safe, Caution, or High-Risk verdict backed by real evidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence Signals */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Evidence We Check</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Globe className="w-6 h-6 text-muted flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Company Web Presence</h3>
                <p className="text-sm text-muted">Real company websites, LinkedIn profiles, domain registration details.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-muted flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Recent News & Reputation</h3>
                <p className="text-sm text-muted">Latest articles, reviews, scam reports, and media mentions.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <TrendingUp className="w-6 h-6 text-muted flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Comparable Job Listings</h3>
                <p className="text-sm text-muted">Similar legitimate jobs to spot unrealistic salary and perks.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="w-6 h-6 text-muted flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Local Business Footprint</h3>
                <p className="text-sm text-muted">Maps, directories, business registrations, and local presence.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Mode Notice */}
      <section className="bg-white/50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-sm text-muted mb-4">
            HireProof works in <strong>demo mode</strong> with sample investigations. Connect live APIs to verify real opportunities.
          </p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2 rounded text-sm font-medium hover:opacity-90"
          >
            Try Demo Mode <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/50">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted">
          <p>HireProof © 2024. Powered by v0 + MCPs.</p>
        </div>
      </footer>
    </div>
  )
}
