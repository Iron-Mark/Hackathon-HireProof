/**
 * Real-pasted-text eval corpus for HireProof's OFFLINE deterministic path.
 *
 * Unlike test/fixtures/scoring-dataset.mjs (which feeds pre-extracted claims), each case here is a
 * RAW job post exactly as a user would paste it. The harness (scripts/eval-real-text.mjs) runs the
 * full offline pipeline — extractClaimsFromText -> buildAuditReportV2 with NO evidence — so it
 * exercises claim extraction, the messy real failure surface that the synthetic dataset never touches.
 *
 * Labeling policy (honest human label for the OFFLINE, no-evidence verdict a job seeker should get):
 *   - high-risk : the pasted TEXT alone shows a strong scam pattern (off-platform pivot + no interview,
 *                 upfront payment / gift cards / crypto, implausible pay for level, impersonation via a
 *                 look-alike domain, reshipping / money-mule, ID/selfie harvesting, fake-check overpayment).
 *   - safe      : a conventional post with a real role, an official/ATS apply path, and ZERO scam signal.
 *   - caution   : needs verification offline — sparse detail, unverifiable identity, a single moderate
 *                 signal, or genuinely ambiguous. Ambiguous scenarios are labeled caution.
 *
 * @typedef {{ id: string, archetype: string, expected: 'safe'|'caution'|'high-risk',
 *   text: string, url?: string, location?: string, rationale: string }} RealTextCase
 */

/** @type {RealTextCase[]} */
export const REAL_TEXT_CASES = [
  // ------------------------------------------------------------------ high-risk
  {
    id: 'hr-upfront-giftcard',
    archetype: 'upfront-fee',
    expected: 'high-risk',
    text: 'Congratulations, you are pre-selected as a remote reshipping associate. No interview needed. To activate onboarding, buy a $200 starter kit with Google Play gift cards and message us on WhatsApp to begin.',
    rationale: 'Upfront gift-card payment + off-platform WhatsApp + no interview: textbook scam. Also reproduces the run-on company-extraction misfire ("with Google Play gift cards and ...").',
  },
  {
    id: 'hr-telegram-task',
    archetype: 'whatsapp-telegram-task',
    expected: 'high-risk',
    text: 'Easy work-from-home tasks! Like videos and rate products to earn 3,000 daily. No experience, no interview. Contact our mentor on Telegram to get started and receive your first payout.',
    rationale: 'Unsolicited task scam, off-platform Telegram, unrealistic pay, no interview.',
  },
  {
    id: 'hr-crypto-deposit',
    archetype: 'crypto-deposit',
    expected: 'high-risk',
    text: 'Remote product-boosting job. Complete sets of tasks to earn commission. You must deposit USDT to unlock higher-paying task tiers and withdraw earnings. Chat with us on Telegram to onboard today.',
    rationale: 'Crypto deposit to "unlock" tasks + off-platform: deposit/commission fraud.',
  },
  {
    id: 'hr-weekly-implausible-pay',
    archetype: 'implausible-pay',
    expected: 'high-risk',
    text: 'Hiring remote data entry clerks. Pay is PHP 80,000 per week, guaranteed. No interview required. Message us on Telegram to start immediately.',
    location: 'Philippines',
    rationale: 'Implausible weekly pay for entry role + off-platform + no interview.',
  },
  {
    id: 'hr-fake-recruiter-lookalike',
    archetype: 'fake-recruiter',
    expected: 'high-risk',
    text: 'You have been selected for a Software Engineer role. Our recruiter will contact you from careers@vercel-hr-team.com. Before starting you must purchase your work laptop through our vendor and pay the $350 setup fee.',
    rationale: 'Look-alike recruiter domain + pay-to-start equipment fee: impersonation scam.',
  },
  {
    id: 'hr-check-overpayment',
    archetype: 'check-overpayment',
    expected: 'high-risk',
    text: 'Welcome aboard as a personal assistant! We are mailing you a check for your first week plus supplies budget. Deposit it, keep your pay, then wire the remaining balance to our approved equipment vendor today.',
    rationale: 'Fake-check overpayment + wire-the-difference: classic money scam.',
  },
  {
    id: 'hr-data-harvest',
    archetype: 'data-harvesting',
    expected: 'high-risk',
    text: 'Congrats, you are hired! No interview needed. To complete onboarding on our HR portal, upload a photo of your passport, a selfie holding your ID, and your bank account details so we can set up payroll.',
    rationale: 'ID + selfie + bank details before any interview: identity-harvesting scam.',
  },
  {
    id: 'hr-equipment-kit-giftcard',
    archetype: 'equipment-kit',
    expected: 'high-risk',
    text: 'You got the job! Before your start date you must buy the mandatory equipment kit and training license for $300. Pay via gift cards and DM us to confirm. Spots are limited so pay today.',
    rationale: 'Mandatory pay-to-start kit via gift cards + urgency + DM: scam.',
  },

  // --------------------------------------------------------------------- caution
  {
    id: 'ca-sparse-remote-dm',
    archetype: 'sparse-unverifiable',
    expected: 'caution',
    text: 'Remote assistant needed. Flexible hours, good pay. DM me if interested and I will send the details.',
    rationale: 'Sparse, no company/role/pay, apply via DM: unverifiable, needs checking.',
  },
  {
    id: 'ca-contractor-variable',
    archetype: 'transparent-contractor',
    expected: 'caution',
    text: 'Freelance AI data annotator (contract). Pay varies by project and availability; typical $18-25/hr. Remote. Apply through our contractor onboarding form.',
    rationale: 'Transparent contractor variability but unverifiable identity offline: caution.',
  },
  {
    id: 'ca-startup-unknown-footprint',
    archetype: 'startup-unknown',
    expected: 'caution',
    text: 'Early-stage startup hiring a remote community manager. We are small and moving fast. Send your resume to our team email to chat.',
    rationale: 'Plausible but no verifiable footprint offline: caution.',
  },
  {
    id: 'ca-recruiter-move-to-email',
    archetype: 'recruiter-outreach',
    expected: 'caution',
    text: 'Hi! I came across your profile on LinkedIn and think you would be a great fit for a Backend Engineer role. Can we continue over email to discuss next steps and schedule an interview?',
    rationale: 'Plausible recruiter outreach, interview offered, but identity unverified: caution.',
  },
  {
    id: 'ca-staffing-agency',
    archetype: 'staffing-agency',
    expected: 'caution',
    text: 'This Customer Support Specialist role is with Bright Path Staffing and applications are reviewed weekly. We place candidates for clients in the tech sector and manage the process end to end. Reply with your CV to be considered.',
    rationale: 'Legit staffing-agency structure but client opaque offline: caution. Also tests correct multi-word company extraction ("Bright Path Staffing", not a run-on clause).',
  },
  {
    id: 'ca-flexible-earn-home',
    archetype: 'vague-opportunity',
    expected: 'caution',
    text: 'Great opportunity! Flexible hours, work from home, be your own boss and earn extra income. Limited slots. Message for details.',
    rationale: 'Vague, no role/company, mild urgency but no hard scam signal: caution.',
  },
  {
    id: 'ca-url-only',
    archetype: 'sparse-url',
    expected: 'caution',
    text: 'We are hiring. Apply here.',
    url: 'https://jobs.example.com/apply/12345',
    rationale: 'Almost no text; unverifiable third-party URL: caution.',
  },
  {
    id: 'ca-high-pay-no-channel',
    archetype: 'single-signal',
    expected: 'caution',
    text: 'Remote marketing coordinator. Competitive salary, room to grow. Send your portfolio and we will set up a call.',
    rationale: 'Normal-sounding but unverifiable; interview implied: caution offline.',
  },

  // ------------------------------------------------------------------------ safe
  {
    id: 'sf-established-careers',
    archetype: 'established-official',
    expected: 'safe',
    text: 'Microsoft is hiring a Senior Software Engineer (Azure). Competitive salary and benefits. Interviews include a technical screen and onsite. Apply on our official careers site.',
    url: 'https://careers.microsoft.com/us/en/job/123456',
    location: 'Seattle, WA',
    rationale: 'Established company, official careers URL, interview process, no scam signal.',
  },
  {
    id: 'sf-greenhouse-ats',
    archetype: 'ats-standard',
    expected: 'safe',
    text: 'We are hiring a Product Designer. Full-time, remote-friendly. Salary $110k-$140k. Our process is a recruiter call, a portfolio review, and two interviews. Apply via our job page.',
    url: 'https://boards.greenhouse.io/acmecorp/jobs/456789',
    rationale: 'Standard ATS post, clear salary and interview process, no scam signal.',
  },
  {
    id: 'sf-lever-ats',
    archetype: 'ats-standard',
    expected: 'safe',
    text: 'Data Analyst opening. Hybrid in Toronto. We offer a structured interview process and a clear salary band of CAD 85k-100k. Submit your application through our careers page.',
    url: 'https://jobs.lever.co/exampleco/abcdef',
    location: 'Toronto, Canada',
    rationale: 'Legit ATS post with official apply path and interview: safe.',
  },
  {
    id: 'sf-linkedin-easyapply',
    archetype: 'linkedin-standard',
    expected: 'safe',
    text: 'Frontend Engineer at Shopify. Remote (Canada). Salary CAD 120k-150k. Interview process includes a recruiter screen and technical rounds. Easy Apply on LinkedIn.',
    url: 'https://www.linkedin.com/jobs/view/987654321',
    location: 'Remote, Canada',
    rationale: 'Named employer, official LinkedIn apply, normal salary + interview: safe.',
  },
  {
    id: 'sf-remote-startup-footprint',
    archetype: 'startup-footprint',
    expected: 'safe',
    text: 'Vercel is hiring a Developer Advocate. Remote. We list the full role, salary range, and interview steps on our careers page. Apply there and our team will reach out to schedule interviews.',
    url: 'https://vercel.com/careers/developer-advocate',
    rationale: 'Named company with official careers URL, salary + interview disclosed: safe.',
  },
  {
    id: 'sf-normal-email-domain',
    archetype: 'normal-corporate',
    expected: 'safe',
    text: 'Stripe is hiring an Account Executive in Singapore. Competitive base plus commission. Our recruiter will schedule interviews. Apply through our official jobs page.',
    url: 'https://stripe.com/jobs/listing/account-executive/123',
    location: 'Singapore',
    rationale: 'Named company, official domain, interview process: safe.',
  },
  {
    id: 'sf-workday-ats',
    archetype: 'ats-standard',
    expected: 'safe',
    text: 'Registered Nurse position, full-time. Standard interview and credential verification process. Competitive pay per the posted band. Apply on our Workday careers portal.',
    url: 'https://example.myworkdayjobs.com/careers/job/RN-123',
    rationale: 'Conventional employer post, Workday ATS, interview + verification: safe.',
  },
  {
    id: 'ca-local-business-unverifiable',
    archetype: 'local-business',
    expected: 'caution',
    text: 'Downtown coffee roaster is hiring a full-time barista. Pay is PHP 650/day plus tips. Come in for an in-person interview at our Makati branch, or email your resume to our shop.',
    location: 'Makati, Philippines',
    rationale: 'In-person interview + normal pay (no scam signal), but no verifiable company/domain offline: honest offline verdict is caution.',
  },
]
