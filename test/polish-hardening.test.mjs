import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { buildLegalAbuseReportMailto, buildReportCsvExport, buildTrendsCsvExport, buildTrendsJsonExport } from '../lib/report-actions.mjs'
import { pruneRecordsByTimestamp } from '../lib/local-data-retention.mjs'
import { buildHireProofWebhookHeaders } from '../lib/webhook-signing.mjs'

test('legal abuse mailto uses lowercase extracted claim keys', () => {
  const href = buildLegalAbuseReportMailto({
    extractedClaims: {
      company: 'Apex Careers',
      role: 'Remote Frontend Intern',
      Company: 'WRONG COMPANY',
      Role: 'WRONG ROLE',
    },
    redFlags: ['Telegram-only contact'],
  })
  const decoded = decodeURIComponent(href)

  assert.match(decoded, /Apex Careers/)
  assert.match(decoded, /Remote Frontend Intern/)
  assert.doesNotMatch(decoded, /WRONG COMPANY/)
  assert.doesNotMatch(decoded, /WRONG ROLE/)
})

test('trends export offers JSON and CSV while returning serializable JSON content', async () => {
  const source = await fs.readFile(new URL('../app/trends/trends-client.tsx', import.meta.url), 'utf8')
  const exportPayload = buildTrendsJsonExport({
    totalReports: 1,
    verdicts: { safe: 0, caution: 0, 'high-risk': 1 },
  })

  assert.match(source, /buildTrendsJsonExport/)
  assert.match(source, /buildTrendsCsvExport/)
  assert.match(source, />\s*JSON\s*</)
  assert.match(source, />\s*CSV\s*</)
  assert.equal(exportPayload.mimeType, 'application/json')
  assert.match(exportPayload.filename, /^hireproof-trends-\d{4}-\d{2}-\d{2}\.json$/)
  assert.equal(JSON.parse(exportPayload.content).totalReports, 1)
})

test('trends live evidence card stays theme-friendly instead of inverted', async () => {
  const source = await fs.readFile(new URL('../app/trends/trends-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /Live Evidence Signals/)
  assert.match(source, /border-evidence-bg/)
  assert.match(source, /bg-surface/)
  assert.doesNotMatch(source, /bg-foreground p-8 text-background/)
})

test('trends CSV export escapes values and uses a clear CSV filename', () => {
  const exportPayload = buildTrendsCsvExport({
    topLocations: [{ label: 'Manila, PH', count: 2 }],
    topRoles: [{ label: 'Frontend "Intern"', count: 1 }],
    topContactMethods: [{ label: 'Telegram', count: 3 }],
    verdicts: { 'high-risk': 4 },
  }, new Date('2026-04-30T00:00:00.000Z'))

  assert.equal(exportPayload.mimeType, 'text/csv')
  assert.equal(exportPayload.filename, 'hireproof-trends-2026-04-30.csv')
  assert.match(exportPayload.content, /"Category","Label","Count"/)
  assert.match(exportPayload.content, /"Location","Manila, PH","2"/)
  assert.match(exportPayload.content, /"Role","Frontend ""Intern""","1"/)
  assert.match(exportPayload.content, /"Verdict","high-risk","4"/)
})

test('audit report CSV export includes claims, signals, evidence, and next steps', () => {
  const exportPayload = buildReportCsvExport({
    verdict: 'high-risk',
    riskScore: 92,
    confidence: 'High',
    summary: 'Multiple red flags.',
    extractedClaims: {
      company: 'Apex Careers',
      role: 'Remote Frontend "Intern"',
    },
    redFlags: ['Telegram-only contact'],
    greenFlags: ['Has a website'],
    evidence: [{ source: 'Search', type: 'company', snippet: 'No official careers page found.', url: 'https://example.com' }],
    nextSteps: ['Do not send personal documents'],
  }, new Date('2026-04-30T00:00:00.000Z'))

  assert.equal(exportPayload.mimeType, 'text/csv')
  assert.equal(exportPayload.filename, 'hireproof-report-high-risk-2026-04-30.csv')
  assert.match(exportPayload.content, /"Section","Field","Value"/)
  assert.match(exportPayload.content, /"Verdict","Risk Score","92"/)
  assert.match(exportPayload.content, /"Claim","role","Remote Frontend ""Intern"""/)
  assert.match(exportPayload.content, /"Red Flag","1","Telegram-only contact"/)
  assert.match(exportPayload.content, /"Evidence","Search","company: No official careers page found. https:\/\/example.com"/)
})

test('chrome extension docs distinguish ZIP install from pending store review', async () => {
  const source = await fs.readFile(new URL('../app/docs/chrome-extension/page.tsx', import.meta.url), 'utf8')
  const overview = await fs.readFile(new URL('../app/docs/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /Download Chrome ZIP/)
  assert.match(source, /manual Developer mode install/i)
  assert.match(source, /Chrome Web Store publication is still pending review/)
  assert.match(overview, /Local extension package/)
  assert.match(overview, /Chrome Web Store listing is still pending review/i)
  assert.doesNotMatch(overview, /Click the toolbar icon on any job page to scan it in seconds/)
})

test('docs reflect current scoring and chat platform proof status', async () => {
  const riskScoring = await fs.readFile(new URL('../app/docs/risk-scoring/page.tsx', import.meta.url), 'utf8')
  const discordBot = await fs.readFile(new URL('../app/docs/discord-bot/page.tsx', import.meta.url), 'utf8')
  const security = await fs.readFile(new URL('../app/docs/security/page.tsx', import.meta.url), 'utf8')

  assert.match(riskScoring, /capped green-credit/)
  assert.match(riskScoring, /Company check evidence/)
  assert.match(riskScoring, /Negative scam evidence/)
  assert.match(riskScoring, /\+30/)
  assert.match(riskScoring, /-12/)
  assert.doesNotMatch(riskScoring, /Verified Domain/)
  assert.doesNotMatch(riskScoring, /LinkedIn Footprint/)

  assert.match(discordBot, /ChatSDK/)
  assert.match(discordBot, /credential-gated/)
  assert.match(discordBot, /Discord, Telegram, and WhatsApp/)
  assert.match(discordBot, /\/api\/webhooks\/discord/)
  assert.doesNotMatch(discordBot, /discord\.js/)
  assert.doesNotMatch(discordBot, /client\.login/)

  assert.match(security, /System Data Flow/)
  assert.match(security, /Hosted BYOK Vault/)
  assert.match(security, /Webhook and SSRF defenses/)
  assert.match(security, /HTTP and Browser Hardening/)
  assert.match(security, /Known Limitations and Hardening Roadmap/)
  assert.match(security, /BYOK_ENCRYPTION_KEY/)
  assert.match(security, /unsafe-inline and unsafe-eval/)
  assert.match(security, /5\/min\/IP/)
  assert.match(security, /20\/min\/key/)
  assert.match(security, /30\/min\/key/)
  assert.match(security, /Redis report TTL/)
  assert.doesNotMatch(security, /TLS 1\.3 Only/)
  assert.doesNotMatch(security, /Zero-PII Storage Strategy/)
  assert.doesNotMatch(security, /multi-layer egress proxy/)
})

test('legal docs expose real privacy and terms anchors used by the footer', async () => {
  const legalPage = await fs.readFile(new URL('../app/docs/legal/page.tsx', import.meta.url), 'utf8')
  const footer = await fs.readFile(new URL('../components/layout/site-footer.tsx', import.meta.url), 'utf8')

  assert.match(footer, /\/docs\/legal#terms-of-service/)
  assert.match(footer, /\/docs\/legal#privacy-policy/)

  assert.match(legalPage, /id="privacy-policy"/)
  assert.match(legalPage, /id="terms-of-service"/)
  assert.match(legalPage, /Privacy Policy/)
  assert.match(legalPage, /Terms of Service/)
  assert.match(legalPage, /What HireProof processes/)
  assert.match(legalPage, /Provider and third-party calls/)
  assert.match(legalPage, /Acceptable use/)
  assert.match(legalPage, /No guarantees/)
  assert.match(legalPage, /not legal advice/i)
  assert.match(legalPage, /not lawyer-reviewed/i)
  assert.doesNotMatch(legalPage, /Vercel Global Edge/)
  assert.doesNotMatch(legalPage, /disputes@hireproof\.com/)
})

test('public README keeps export and extension claims honest', async () => {
  const source = await fs.readFile(new URL('../README.md', import.meta.url), 'utf8')
  const pricing = await fs.readFile(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')
  const resultScreen = await fs.readFile(new URL('../components/audit/result-screen.tsx', import.meta.url), 'utf8')

  assert.match(source, /PNG Screenshot Export/)
  assert.match(source, /Forensic PDF Dossier/)
  assert.match(source, /Report CSV Export/)
  assert.match(source, /local install/i)
  assert.doesNotMatch(source, /Chrome Extension.*scan any webpage from the browser toolbar/)
  assert.match(pricing, /local extension/)
  assert.match(pricing, /JSON \+ PDF/)
  assert.match(pricing, /PDF \+ CSV/)
  assert.match(resultScreen, /Download report CSV/)
  assert.match(resultScreen, /Download PDF dossier/)
})

test('verified badge docs require DNS TXT ownership and public tokens', async () => {
  const source = await fs.readFile(new URL('../app/docs/verified-badge/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /DNS TXT/i)
  assert.match(source, /public token/i)
  assert.match(source, /does not expose API keys/i)
  assert.doesNotMatch(source, /https:\/\/hireproof\.com\/js\/badge\.js/)
})

test('research 03 action plan exists as active execution roadmap', async () => {
  const source = await fs.readFile(new URL('../docs/hireproof-action-plan.md', import.meta.url), 'utf8')
  const index = await fs.readFile(new URL('../docs/README.md', import.meta.url), 'utf8')

  assert.match(source, /P0 - Demo Credibility Cleanup/)
  assert.match(source, /live-tested in Slack and Telegram with screenshot\/log evidence/)
  assert.match(source, /production-accepted/)
  assert.match(index, /hireproof-action-plan\.md/)
})

test('local JSON retention prunes old and excess records deterministically', () => {
  const now = new Date('2026-04-30T00:00:00.000Z')
  const records = [
    { id: 'fresh', createdAt: '2026-04-29T00:00:00.000Z' },
    { id: 'middle', createdAt: '2026-04-20T00:00:00.000Z' },
    { id: 'old', createdAt: '2026-03-01T00:00:00.000Z' },
  ]

  assert.deepEqual(
    pruneRecordsByTimestamp(records, { now, maxAgeDays: 30, maxRecords: 1, timestampKey: 'createdAt' }),
    [{ id: 'fresh', createdAt: '2026-04-29T00:00:00.000Z' }],
  )
})

test('developer BYOK panel is honest about hosted encrypted credential storage', async () => {
  const source = await fs.readFile(new URL('../app/developer/developer-client.tsx', import.meta.url), 'utf8')
  const actionPlan = await fs.readFile(new URL('../docs/hireproof-action-plan.md', import.meta.url), 'utf8')

  assert.match(source, /Hosted BYOK Vault/)
  assert.match(source, /encrypted at rest/)
  assert.match(source, /\/api\/developer\/provider-credentials/)
  assert.match(actionPlan, /encrypted server-side/)
})

test('sandbox webhooks use the same signed headers as production webhooks', async () => {
  const route = await fs.readFile(new URL('../app/api/developer/webhook-test/route.ts', import.meta.url), 'utf8')
  const v1Route = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const payload = JSON.stringify({ event: 'audit.completed', id: 'evt_test' })
  const headers = buildHireProofWebhookHeaders(payload, 'hp_test_secret', 'audit.completed', 'HireProof-Webhook-Sandbox/1.0')

  assert.equal(headers['X-HireProof-Signature'], 'sha256=75d23b6c1988cc6496d6adb60ab0be71d696ade9b4d788c7ba186b301204f081')
  assert.equal(headers['X-HireProof-Event'], 'audit.completed')
  assert.equal(headers['User-Agent'], 'HireProof-Webhook-Sandbox/1.0')
  assert.match(route, /buildHireProofWebhookHeaders/)
  assert.match(v1Route, /buildHireProofWebhookHeaders/)
})

test('homepage ticker avoids unsupported hard impact metrics', async () => {
  const source = await fs.readFile(new URL('../components/marketing/impact-ticker.tsx', import.meta.url), 'utf8')

  assert.doesNotMatch(source, /scams identified this week/)
  assert.doesNotMatch(source, /potential theft prevented/)
  assert.doesNotMatch(source, /job seekers protected/)
  assert.match(source, /Live evidence search configured/)
})

test('first-place sprint surfaces demo clarity and public proof from the homepage', async () => {
  const source = await fs.readFile(new URL('../app/home-client.tsx', import.meta.url), 'utf8')
  const header = await fs.readFile(new URL('../components/layout/site-header.tsx', import.meta.url), 'utf8')
  const proofPage = await fs.readFile(new URL('../app/proof/page.tsx', import.meta.url), 'utf8')
  const spotTheBot = await fs.readFile(new URL('../components/marketing/spot-the-bot.tsx', import.meta.url), 'utf8')

  assert.match(source, /Paste a job post\. See if it/)
  assert.match(source, /safe, suspicious, or high-risk/)
  assert.match(source, /freelance gig/)
  assert.match(source, /scholarship or training offer/)
  assert.match(source, /xl:grid-cols-\[minmax\(0,1fr\)_460px\]/)
  assert.match(source, /text-center xl:mx-0 xl:max-w-2xl xl:text-left/)
  assert.match(source, /hidden xl:block/)
  assert.doesNotMatch(source, /lg:grid-cols-\[minmax\(0,1fr\)_460px\]/)
  assert.match(source, /\/audit\?demo=high-risk/)
  assert.match(source, /\/audit\?demo=caution/)
  assert.match(source, /\/audit\?demo=safe/)
  assert.match(source, /\/proof/)
  assert.match(header, /\/proof/)
  assert.match(proofPage, /production-deployed/)
  assert.match(proofPage, /Slack screenshot proof/)
  assert.match(proofPage, /wrun_01KQD9H6AND3W7YZBHHKAH2KV5/)
  assert.match(proofPage, /credential-gated/)
  assert.match(proofPage, /Proof at a glance/)
  assert.match(proofPage, /Server/)
  assert.match(proofPage, /MessageSquare/)
  assert.match(proofPage, /FileArchive/)
  assert.match(proofPage, /Store/)
  assert.match(proofPage, /cdn\.jsdelivr\.net\/npm\/simple-icons@latest\/icons\/slack\.svg/)
  assert.match(proofPage, /cdn\.simpleicons\.org\/discord/)
  assert.match(proofPage, /cdn\.simpleicons\.org\/telegram/)
  assert.match(proofPage, /cdn\.simpleicons\.org\/whatsapp/)
  assert.match(proofPage, /upload\.wikimedia\.org\/wikipedia\/commons\/0\/0c\/Google_Chrome_Web_Store_icon_2022\.svg/)
  assert.match(proofPage, /border-\[#4A154B\]\/25/)
  assert.match(proofPage, /bg-\[#4A154B\]\/10/)
  assert.match(proofPage, /brandIconColor: '#4A154B'/)
  assert.match(proofPage, /WebkitMaskImage/)
  assert.match(source, /<section className="py-12 sm:py-16">/)
  assert.match(source, /mb-6 text-center sm:mb-8/)
  assert.match(spotTheBot, /max-w-6xl/)
  assert.match(spotTheBot, /md:grid-cols-\[minmax\(13rem,0\.62fr\)_minmax\(0,1\.38fr\)\]/)
  assert.match(spotTheBot, /min-h-\[12rem\]/)
  assert.doesNotMatch(spotTheBot, /py-24/)
  assert.doesNotMatch(spotTheBot, /rounded-\[3rem\]/)
  assert.doesNotMatch(spotTheBot, /p-16 md:p-24/)
})

test('pricing and audit copy keep business and privacy claims honest', async () => {
  const pricing = await fs.readFile(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')
  const auditForm = await fs.readFile(new URL('../components/audit/audit-form.tsx', import.meta.url), 'utf8')

  assert.match(pricing, /Free individual checks/)
  assert.match(pricing, /job boards, schools, recruiters, and community groups/)
  assert.match(pricing, /Bulk verification/)
  assert.doesNotMatch(pricing, /Automated Domain Takedowns/)
  assert.doesNotMatch(pricing, /100% uptime/)
  assert.match(auditForm, /Do not paste passwords, IDs, bank details, or verification codes/)
  assert.match(auditForm, /Reports may be saved for history or share links/)
  assert.doesNotMatch(auditForm, /not stored permanently/)
})

test('audit form supports clipboard text and screenshot paste', async () => {
  const auditForm = await fs.readFile(new URL('../components/audit/audit-form.tsx', import.meta.url), 'utf8')
  const auditClient = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')

  assert.match(auditForm, /ClipboardPaste/)
  assert.match(auditForm, /extractFirstUrl/)
  assert.match(auditForm, /BARE_URL_PATTERN/)
  assert.match(auditForm, /handleUrlClipboardButton/)
  assert.match(auditForm, /handleClipboardPaste/)
  assert.match(auditForm, /inferLocationFromText/)
  assert.match(auditForm, /locationTouched/)
  assert.match(auditForm, /normalizeDetectedUrl/)
  assert.match(auditForm, /linkedin\\.com\\|indeed\\.com\\|www\\./)
  assert.match(auditForm, /work\\s\*\)\?setup/)
  assert.match(auditForm, /WFH/)
  assert.match(auditForm, /Remote\|Hybrid\|Onsite\|WFH/)
  assert.match(auditForm, /\[-–,\/:\]/)
  assert.match(auditForm, /Hybrid/)
  assert.match(auditForm, /onPaste=\{handleClipboardPaste\}/)
  assert.match(auditForm, /sm:flex-row/)
  assert.match(auditForm, /hidden sm:inline/)
  assert.match(auditForm, /navigator\.clipboard\.read/)
  assert.match(auditForm, /navigator\.clipboard\.readText/)
  assert.match(auditForm, /clipboardData\.items/)
  assert.match(auditForm, /isDraggingFile/)
  assert.match(auditForm, /dragDepthRef/)
  assert.match(auditForm, /document\.addEventListener\('dragenter'/)
  assert.match(auditForm, /document\.addEventListener\('drop'/)
  assert.match(auditForm, /dropEffect = 'copy'/)
  assert.match(auditForm, /data-testid="audit-drop-overlay"/)
  assert.match(auditForm, /Drop screenshot to attach/)
  assert.match(auditForm, /image\/jpeg/)
  assert.match(auditForm, /image\/png/)
  assert.match(auditForm, /image\/webp/)
  assert.match(auditForm, /aria-label="Paste job URL from clipboard"/)
  assert.match(auditForm, /aria-label="Auto-detect location from job post"/)
  assert.match(auditForm, /bg-safe/)
  assert.match(auditForm, /disabled:border-safe/)
  assert.doesNotMatch(auditForm, /bg-foreground py-3/)
  assert.match(auditClient, /max-w-6xl/)
  assert.match(auditClient, /lg:py-10/)
  assert.match(auditClient, /max-w-\[17\.25rem\]/)
  assert.match(auditClient, /bg-safe\/10/)
  assert.match(auditClient, /animate=\{\{ x: liveMode \? '0%' : '100%' \}\}/)
  assert.match(auditClient, /bg-safe shadow-lg shadow-safe\/20/)
  assert.doesNotMatch(auditClient, /bg-foreground text-background/)
  assert.match(auditForm, /lg:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(20rem,0\.85fr\)\]/)
  assert.match(auditForm, /lg:sticky/)
  assert.match(auditForm, /lg:min-h-\[360px\]/)
})

test('history, result, and proof pages keep the audit journey polished', async () => {
  const historyPage = await fs.readFile(new URL('../app/history/page.tsx', import.meta.url), 'utf8')
  const resultScreen = await fs.readFile(new URL('../components/audit/result-screen.tsx', import.meta.url), 'utf8')
  const proofPage = await fs.readFile(new URL('../app/proof/page.tsx', import.meta.url), 'utf8')
  const siteHeader = await fs.readFile(new URL('../components/layout/site-header.tsx', import.meta.url), 'utf8')
  const docsLayout = await fs.readFile(new URL('../app/docs/layout.tsx', import.meta.url), 'utf8')

  assert.match(historyPage, /Open report/)
  assert.match(historyPage, /isLoaded/)
  assert.match(historyPage, /Loading local archive/)
  assert.match(historyPage, /Archive summary/)
  assert.match(historyPage, /High-risk/)
  assert.match(historyPage, /data-testid="history-report-card"/)
  assert.match(historyPage, /data-testid="history-empty-state"/)
  assert.match(historyPage, /rounded-2xl/)
  assert.doesNotMatch(historyPage, /rounded-\[3rem\]/)

  assert.match(resultScreen, /Quick exports/)
  assert.match(resultScreen, /Evidence receipts/)
  assert.match(resultScreen, /Share verdict/)
  assert.match(resultScreen, /Open source/)
  assert.match(resultScreen, /Next step/)
  assert.match(resultScreen, /data-testid="audit-result-verdict"/)

  assert.match(proofPage, /Remaining proof boundaries/)
  assert.match(proofPage, /brandColor/)
  assert.match(proofPage, /Live delivery proven/)
  assert.match(proofPage, /Credential-ready/)
  assert.match(proofPage, /Chrome Web Store/)

  assert.match(siteHeader, /z-50/)
  assert.match(siteHeader, /z-\[60\]/)
  assert.match(docsLayout, /z-20/)
})

test('demo login response only returns public demo identity', async () => {
  const route = await fs.readFile(new URL('../app/api/auth/demo-login/route.ts', import.meta.url), 'utf8')
  const snackbar = await fs.readFile(new URL('../components/system/demo-login-snackbar.tsx', import.meta.url), 'utf8')

  assert.match(route, /assertSameOrigin/)
  assert.match(route, /new URL\(origin\)/)
  assert.match(route, /request\.url/)
  assert.match(route, /Cross-origin demo login is not allowed/)
  assert.match(snackbar, /NEXT_PUBLIC_DEMO_LOGIN_ENABLED/)
  assert.match(snackbar, /demoLoginEnabled/)
  assert.match(route, /user: \{ id: user\.id, email: user\.email, name: user\.name \}/)
  assert.match(route, /reqHeaders\.get\('x-real-ip'\) \?\?\s+reqHeaders\.get\('x-forwarded-for'\)/)
  assert.doesNotMatch(route, /return NextResponse\.json\(\s*\{\s*user, isDemo: true/)
  assert.match(snackbar, /json\.user\?\.email/)
})

test('final submission pack includes localized voting and short-form campaign copy', async () => {
  const source = await fs.readFile(new URL('../docs/final-submission-pack.md', import.meta.url), 'utf8')

  assert.match(source, /15-Second Vertical Video/)
  assert.match(source, /30-Second Vertical Video/)
  assert.match(source, /Paste mo muna/)
  assert.match(source, /Pégalo primero/)
  assert.match(source, /Voting-Day Mobilization/)
})
