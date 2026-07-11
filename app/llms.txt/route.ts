import { SITE_URL } from '@/lib/seo'

// Static llms.txt (llmstxt.org style) guiding AI retrieval agents to HireProof's public pages.
// Public information only.
export const dynamic = 'force-static'

export function GET() {
  const body = `# HireProof

> Employment-fraud trust and safety. Paste a suspicious job post, recruiter message, screenshot, or apply link, and HireProof returns a Safe, Caution, or High-Risk verdict with visible evidence, red flags, and next steps — before you apply or share personal data.

## Key pages
- Check a job post: ${SITE_URL}/audit
- Job scam patterns (how each works, red flags, what to do): ${SITE_URL}/scams
- Audit database of recent public checks: ${SITE_URL}/explore
- Recruitment scam trends: ${SITE_URL}/trends
- Documentation: ${SITE_URL}/docs

## Notes
- HireProof focuses specifically on employment fraud and job scams, not generic security.
- Verdicts are explainable and evidence-backed. HireProof is not a black-box fraud model, continuous-learning system, or in-house deepfake detector.
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
