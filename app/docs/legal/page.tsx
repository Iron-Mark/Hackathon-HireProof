import { Metadata } from 'next'
import { Scale, AlertTriangle, ShieldCheck, Mail, Info } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Legal Disclaimer & Disputes | HireProof Docs',
  description: 'Important legal disclaimers and information on how companies can dispute a risk verdict.',
}

export default function LegalPage() {
  return (
    <div className="space-y-12 pb-24 text-foreground">
      <section className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-safe/10 text-safe">
          <Scale className="h-6 w-6" />
        </div>
        <h1 className="text-4xl font-black tracking-tight lg:text-5xl">Legal Disclaimer</h1>
        <p className="text-xl font-medium leading-relaxed text-muted">
          HireProof provides AI-generated risk assessments for informational purposes only. Please read our terms and dispute policies carefully.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <AlertTriangle className="h-6 w-6 text-caution" />
          <h2 className="text-2xl font-black">AI Accuracy Disclaimer</h2>
        </div>
        <div className="prose prose-invert max-w-none space-y-4 font-medium text-muted">
          <p>
            HireProof utilizes large language models (LLMs) and real-time search data to evaluate job postings. While we strive for accuracy, AI can produce false positives or "hallucinations." 
          </p>
          <div className="rounded-2xl border border-caution-bg bg-caution-bg/30 p-6 text-caution-text">
            <p className="font-black">IMPORTANT NOTICE:</p>
            <p className="text-sm">
              Our risk scores are NOT definitive proof of legality or illegality. Users are solely responsible for their own safety and due diligence. HireProof is not liable for any employment decisions, financial losses, or security breaches resulting from the use of this tool.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <Info className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Fair Use & Data Usage</h2>
        </div>
        <div className="prose prose-invert max-w-none space-y-4 font-medium text-muted">
          <p>
            HireProof operates as a <strong>Safety Research Tool</strong>. We utilize small snippets of publicly available web content (Google, LinkedIn, News) under the <strong>Fair Use</strong> doctrine (17 U.S. Code § 107) for the purposes of security analysis and public protection. 
          </p>
          <p>
            We do not store full job descriptions or copyrighted materials. Our database contains only high-level metadata and risk signals extracted via AI.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-border-soft pb-2">
          <ShieldCheck className="h-6 w-6 text-safe" />
          <h2 className="text-2xl font-black">Business & False Positive Disputes</h2>
        </div>
        <div className="space-y-6">
          <p className="font-medium text-muted">
            Are you a legitimate company that has been incorrectly flagged? We take accuracy seriously and provide a fast-track verification process for verified business owners.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-surface p-6">
              <h3 className="mb-2 font-black">How to Dispute</h3>
              <p className="text-sm font-medium text-muted leading-relaxed">
                If your company is appearing as "High-Risk" or "Caution" and you believe this is an error, please submit a report with:
              </p>
              <ul className="mt-3 space-y-2 text-xs font-bold text-muted list-inside list-disc">
                <li>Proof of official corporate registration</li>
                <li>Link to the specific HireProof audit</li>
                <li>Official hiring portal URL</li>
                <li>Contact from a company-domain email</li>
              </ul>
            </div>
            
            <div className="flex flex-col justify-center rounded-2xl border border-safe/20 bg-safe/5 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-safe text-background">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-black">Submit Report</h3>
              <p className="mb-4 text-xs font-medium text-muted">Direct email to our verification team.</p>
              <a href="mailto:disputes@hireproof.com" className="hireproof-focus inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3 text-sm font-black text-background hover:bg-safe transition-colors">
                Contact Verification Team
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-6">
        <div className="flex items-start gap-4">
          <Info className="mt-1 h-5 w-5 text-muted" />
          <div className="space-y-4">
            <p id="privacy-policy" className="text-sm font-medium text-muted leading-relaxed">
              <strong>Privacy Policy:</strong> HireProof does not sell user data. For self-hosted instances, data remains on your infrastructure. For managed instances, we store anonymized audit IDs for 30 days solely for the purpose of improving detection accuracy.
            </p>
            <p id="terms-of-service" className="text-sm font-medium text-muted leading-relaxed">
              <strong>Terms of Service:</strong> By using HireProof, you agree to these terms. If you do not agree with our risk assessment model or our limitation of liability, please discontinue use of the platform immediately. 
            </p>
            <p className="text-sm font-medium text-muted leading-relaxed">
              <strong>Governing Law:</strong> These terms are governed by the laws of the jurisdiction in which the core infrastructure is hosted (Vercel Global Edge).
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
