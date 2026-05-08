import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { buildTrendsViewModel } from '../lib/trends-view-model.mjs'

test('explore client fetches the intelligence reports endpoint', async () => {
  const source = await fs.readFile(new URL('../app/explore/explore-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /\/api\/intelligence\/reports/)
  assert.doesNotMatch(source, /\/api\/reports/)
})

test('audit report permalinks await dynamic params before lookup', async () => {
  const source = await fs.readFile(new URL('../app/audit/[id]/page.tsx', import.meta.url), 'utf8')

  assert.match(source, /params:\s*Promise<\{\s*id:\s*string\s*\}>/)
  assert.match(source, /const\s+\{\s*id\s*\}\s*=\s*await\s+params/)
  assert.match(source, /\^\(report\|chat\)_\[a-zA-Z0-9_-\]\+\$/)
  assert.doesNotMatch(source, /params\.id/)
})

test('missing-user auth dummy hash uses the scrypt verifier format', async () => {
  const source = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.match(source, /scrypt:hireproof_dummy_salt_2026:/)
  assert.doesNotMatch(source, /\$2b\$10\$dummyhashplaceholder/)
})

test('trends view model maps stored audit API shape into UI sections', () => {
  const viewModel = buildTrendsViewModel({
    totalReports: 10,
    verdicts: { safe: 4, caution: 3, 'high-risk': 3 },
    topLocations: [{ label: 'Philippines', count: 6 }],
    topRoles: [{ label: 'Frontend Intern', count: 5 }],
    topContactMethods: [{ label: 'Telegram', count: 3 }],
    recentReports: [
      {
        id: 'audit_1',
        verdict: 'high-risk',
        riskScore: 92,
        summary: 'Telegram handoff and unrealistic salary.',
        extractedClaims: {
          company: 'TechStart',
          role: 'Frontend Intern',
          salary: 'PHP 80,000/week',
          location: 'Remote',
          contactMethod: 'Telegram',
          applicationPath: 'Message recruiter',
        },
        redFlags: ['Telegram-only contact'],
        greenFlags: [],
        evidence: [],
        alternatives: [],
        timeline: [],
        confidence: 'high',
        timestamp: '2026-04-29T00:00:00.000Z',
      },
    ],
    externalSignals: [{ title: 'Fake job warning' }],
    mode: 'stored-audits',
  })

  assert.equal(viewModel.statCards[0].label, 'Reports Reviewed')
  assert.equal(viewModel.statCards[0].value, '10')
  assert.equal(viewModel.statCards[1].label, 'Trend-Ready')
  assert.equal(viewModel.statCards[2].value, '3')
  assert.equal(viewModel.sampleQuality, 'limited')
  assert.match(viewModel.headline, /Public Audit Pattern Sample/)
  assert.equal(viewModel.verdictMixLabel, 'Public sample mix')
  assert.equal(viewModel.vectorSections[0].title, 'Contact methods')
  assert.deepEqual(viewModel.vectorSections[0].items[0], { label: 'Telegram', count: 3, percent: 30 })
  assert.equal(viewModel.recentHighRisk[0].company, 'TechStart')
  assert.equal(viewModel.modeLabel, 'Stored audits')
})

test('public intelligence listings exclude demo fixture reports by default', async () => {
  const { filterPublicIntelligenceReports } = await import('../lib/public-intelligence-reports.mjs')
  const liveReport = {
    id: 'report_live',
    version: '2',
    mode: 'live',
    credentialMode: 'platform-env',
    source: 'api',
    publiclyListed: true,
    evidence: [{ source: 'SerpApi Google Search' }],
    intelligence: {
      coverage: {},
      companyIdentity: { status: 'matched', evidenceIds: [] },
      localPresence: { status: 'missing', evidenceIds: [] },
      marketBenchmark: { status: 'normal', evidenceIds: [] },
      applyPath: { status: 'matched', evidenceIds: [] },
      signals: [],
      scoreTrace: [],
    },
  }

  const reports = [
    liveReport,
    { ...liveReport, id: 'report_legacy_v1', version: undefined },
    { ...liveReport, id: 'report_no_intelligence', intelligence: undefined },
    { ...liveReport, id: 'report_legacy_no_public_flag', publiclyListed: undefined },
    { ...liveReport, id: 'report_private', publiclyListed: false },
    { ...liveReport, id: 'report_demo_mode', mode: 'demo' },
    { ...liveReport, id: 'report_demo_credentials', credentialMode: 'demo' },
    { ...liveReport, id: 'report_demo_source', source: 'demo' },
    { ...liveReport, id: 'report_demo_owner', ownerId: 'demo' },
    { ...liveReport, id: 'report_demo_key', apiKeyId: 'env_demo_key' },
    {
      ...liveReport,
      id: 'report_demo_fixture_evidence',
      evidence: [{ source: 'Demo fixture: market signal' }],
    },
    {
      ...liveReport,
      id: 'report_legacy_telegram_fixture',
      extractedClaims: {
        company: 'Unknown / Not Verifiable',
        role: 'Frontend Intern',
        salary: 'PHP 80,000 per week',
        location: 'Remote',
        contactMethod: 'Telegram',
        applicationPath: 'Direct message only',
      },
      summary: 'This opportunity has unrealistic salary and Telegram-only contact.',
      evidence: [{ source: 'Job Search Analysis', snippet: 'Average intern salary for Southeast Asia is $500-$1,500/month.' }],
    },
  ]

  assert.deepEqual(filterPublicIntelligenceReports(reports).map((report) => report.id), ['report_live'])
})

test('trend intelligence collapses repeated demo-run signatures', async () => {
  const { buildPublicReportTrends } = await import('../lib/public-intelligence-reports.mjs')
  const first = {
    id: 'report_first',
    version: '2',
    verdict: 'high-risk',
    riskScore: 94,
    mode: 'live',
    credentialMode: 'platform-env',
    source: 'api',
    publiclyListed: true,
    timestamp: '2026-05-04T00:00:00.000Z',
    intelligence: {
      coverage: {},
      companyIdentity: { status: 'matched', evidenceIds: [] },
      localPresence: { status: 'missing', evidenceIds: [] },
      marketBenchmark: { status: 'normal', evidenceIds: [] },
      applyPath: { status: 'matched', evidenceIds: [] },
      signals: [],
      scoreTrace: [],
    },
    extractedClaims: {
      company: 'Apex Hiring',
      role: 'Frontend Intern',
      location: 'Philippines',
      contactMethod: 'Telegram',
    },
    evidence: [{ source: 'SerpApi Google Search' }],
  }
  const duplicate = {
    ...first,
    id: 'report_duplicate',
    timestamp: '2026-05-04T00:01:00.000Z',
  }
  const oldFixture = {
    ...first,
    id: 'report_old_fixture',
    extractedClaims: {
      company: 'Unknown / Not Verifiable',
      role: 'Frontend Intern',
      salary: 'PHP 80,000 per week',
      location: 'Remote',
      contactMethod: 'Telegram',
      applicationPath: 'Direct message only',
    },
    summary: 'This opportunity has unrealistic salary and Telegram-only contact.',
    evidence: [{ source: 'Job Search Analysis', snippet: 'Average intern salary for Southeast Asia is $500-$1,500/month.' }],
  }
  const distinct = {
    ...first,
    id: 'report_distinct',
    verdict: 'safe',
    extractedClaims: {
      company: 'Microsoft Corporation',
      role: 'Senior Software Engineer',
      location: 'Seattle, WA',
      contactMethod: 'LinkedIn Recruiter',
    },
  }

  const trends = buildPublicReportTrends([first, duplicate, oldFixture, distinct])

  assert.equal(trends.totalReports, 2)
  assert.equal(trends.sampleQuality, 'limited')
  assert.match(trends.sampleWarning, /Limited trend sample/)
  assert.deepEqual(trends.verdicts, { safe: 1, caution: 0, 'high-risk': 1 })
  assert.deepEqual(trends.topRoles, [
    { label: 'Frontend Intern', count: 1 },
    { label: 'Senior Software Engineer', count: 1 },
  ])
})

test('trend intelligence normalizes noisy public buckets and exposes sample quality metadata', async () => {
  const { buildPublicReportTrends } = await import('../lib/public-intelligence-reports.mjs')
  const base = {
    id: 'report_noisy',
    version: '2',
    verdict: 'caution',
    riskScore: 45,
    mode: 'live',
    credentialMode: 'platform-env',
    source: 'web',
    publiclyListed: true,
    timestamp: '2026-05-04T00:00:00.000Z',
    intelligence: {
      coverage: {},
      companyIdentity: { status: 'matched', evidenceIds: [] },
      localPresence: { status: 'missing', evidenceIds: [] },
      marketBenchmark: { status: 'normal', evidenceIds: [] },
      applyPath: { status: 'matched', evidenceIds: [] },
      signals: [],
      scoreTrace: [],
    },
    redFlags: [
      'Company name could not be confidently extracted from the post',
      'Company name could not be confidently extracted from the post',
    ],
    extractedClaims: {
      company: 'Unknown / Not Verifiable',
      role: 'At TELUS Digital',
      location: 'New York City, San Francisco Read more Senior Communications Manager San Francisco Read more Senior Customer Support Engineer Japan',
      contactMethod: 'Not specified',
      applicationPath: 'LinkedIn job page',
    },
    evidence: [{ source: 'SerpApi Google Search' }],
  }
  const metro = {
    ...base,
    id: 'report_metro',
    verdict: 'safe',
    extractedClaims: {
      company: 'Heidi',
      role: 'Frontend Website Developer PH',
      location: 'Quezon City, National Capital Region, Philippines Remote',
      contactMethod: 'LinkedIn',
      applicationPath: 'Ashby job page',
    },
  }

  const trends = buildPublicReportTrends([base, metro])

  assert.equal(trends.totalReports, 2)
  assert.equal(trends.sampleQuality, 'limited')
  assert.ok(trends.bucketQuality.unclear >= 1)
  assert.ok(trends.topLocations.some((item) => item.label === 'Unclear'))
  assert.ok(trends.topLocations.some((item) => item.label === 'Remote'))
  assert.ok(trends.topContactMethods.some((item) => item.label === 'Unspecified'))
  assert.ok(trends.topContactMethods.some((item) => item.label === 'LinkedIn'))
  assert.equal(trends.recentReports[0].redFlags.length, 1)
  assert.match(trends.recentReports[0].summary, /Unresolved submission|Strongest signals/)
})

test('triple-track coverage has an app docs page and sidebar link', async () => {
  const docsPage = await fs.readFile(new URL('../app/docs/triple-track-coverage/page.tsx', import.meta.url), 'utf8')
  const docsLayout = await fs.readFile(new URL('../app/docs/layout.tsx', import.meta.url), 'utf8')

  assert.match(docsPage, /v0 \+ MCPs/)
  assert.match(docsPage, /ChatSDK Agents/)
  assert.match(docsPage, /Vercel Workflow/)
  assert.match(docsLayout, /\/docs\/triple-track-coverage/)
})

test('use cases docs page markets real workflows with proof-safe integration language', async () => {
  const useCases = await fs.readFile(new URL('../app/docs/use-cases/page.tsx', import.meta.url), 'utf8')
  const docsLayout = await fs.readFile(new URL('../app/docs/layout.tsx', import.meta.url), 'utf8')
  const docsOverview = await fs.readFile(new URL('../app/docs/page.tsx', import.meta.url), 'utf8')
  const graphic = await fs.readFile(new URL('../public/docs-media/use-cases-agent-gate.svg', import.meta.url), 'utf8')

  assert.match(useCases, /Use Cases for Safer Hiring Automation/)
  assert.match(useCases, /AI apply automation/)
  assert.match(useCases, /pre-submit safety gate/)
  assert.match(useCases, /Headless API, MCP tool, SDK, or workflow handoff/)
  assert.match(useCases, /Safe, Caution, or High-Risk/)
  assert.match(useCases, /Demo fixture mode is intentionally labeled/)
  assert.match(useCases, /Shared report shape/)
  assert.match(useCases, /API, SDK, webhooks/)
  assert.match(useCases, /MCP and skills/)
  assert.doesNotMatch(useCases, /docs-media\/docs-automations\.png/)
  assert.doesNotMatch(useCases, /docs-media\/docs-investigation-engine\.png/)
  assert.doesNotMatch(useCases, /docs-media\/docs-skills\.png/)
  assert.match(useCases, /docs-media\/use-cases-agent-gate\.svg/)
  assert.match(useCases, /not law-enforcement verification or a guarantee/)
  assert.match(docsLayout, /Use Cases/)
  assert.match(docsLayout, /\/docs\/use-cases/)
  assert.match(docsOverview, /Real-world workflows for applicants/)
  assert.match(graphic, /HireProof as the apply-agent safety gate/)
})

test('global command search is visible and indexes public app pages', async () => {
  const header = await fs.readFile(new URL('../components/layout/site-header.tsx', import.meta.url), 'utf8')
  const commandMenu = await fs.readFile(new URL('../components/layout/command-menu.tsx', import.meta.url), 'utf8')
  const docsLayout = await fs.readFile(new URL('../app/docs/layout.tsx', import.meta.url), 'utf8')

  assert.match(header, /openHireProofCommandMenu/)
  assert.match(header, /aria-label="Search site/)
  assert.match(header, />Search</)
  assert.match(header, /Ctrl K/)
  assert.match(commandMenu, /COMMAND_MENU_EVENT = 'hireproof:open-command-menu'/)
  assert.match(commandMenu, /metaKey \|\| e\.ctrlKey/)
  assert.match(commandMenu, /SEARCH_INDEX/)
  for (const href of ['/docs/use-cases', '/docs/automations', '/docs/api-reference', '/audit', '/explore', '/proof', '/developer']) {
    assert.match(commandMenu, new RegExp(href.replaceAll('/', '\\/')))
  }
  for (const href of ['/docs/api-reference#audit-headless', '/docs/api-reference#schema-request', '/docs/api-reference#mcp-call', '/docs/legal#privacy-policy']) {
    assert.match(commandMenu, new RegExp(href.replaceAll('/', '\\/')))
  }
  assert.match(commandMenu, /webhook_url async audit/)
  assert.match(commandMenu, /202 accepted/)
  assert.match(commandMenu, /AuditRequest schema/)
  assert.match(commandMenu, /scoreItem/)
  assert.match(commandMenu, /api, mcp, automation, extension, pricing, or use cases/)
  assert.doesNotMatch(commandMenu, /href:\s*'\/api\//)
  assert.doesNotMatch(commandMenu, /\/audit\/\[id\]/)
  assert.doesNotMatch(commandMenu, /\/history\/\[id\]/)
  assert.match(docsLayout, /openHireProofCommandMenu/)
  assert.match(docsLayout, /Search docs\.\.\./)
  assert.match(docsLayout, /aria-label="Search documentation with global site search"/)
  assert.doesNotMatch(docsLayout, /docsQuery/)
  assert.doesNotMatch(docsLayout, /filteredSidebar/)
})

test('global scroll-to-top control is mobile and desktop friendly', async () => {
  const layout = await fs.readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8')
  const control = await fs.readFile(new URL('../components/layout/scroll-to-top-control.tsx', import.meta.url), 'utf8')

  assert.match(layout, /ScrollToTopControl/)
  assert.match(control, /window\.scrollY > 420/)
  assert.match(control, /prefers-reduced-motion: reduce/)
  assert.match(control, /aria-label="Scroll back to top"/)
  assert.match(control, /min-h-12 min-w-12/)
  assert.match(control, /right-3/)
  assert.match(control, /lg:right-8/)
  assert.match(control, /bottom-\[5\.25rem\]/)
})

test('chat and workflow status endpoints expose honest track readiness', async () => {
  const chatRoute = await fs.readFile(new URL('../app/api/chat/hireproof/route.ts', import.meta.url), 'utf8')
  const workflowRoute = await fs.readFile(new URL('../app/api/workflows/audit/route.ts', import.meta.url), 'utf8')

  assert.match(chatRoute, /ChatSDK Agents/)
  assert.match(chatRoute, /\/api\/webhooks\/slack/)
  assert.match(workflowRoute, /Vercel Workflow/)
  assert.match(workflowRoute, /startAuditWorkflow/)
})

test('chat verdict formatter strips accidental whitespace from report URLs', async () => {
  const source = await fs.readFile(new URL('../lib/chat-verdict.ts', import.meta.url), 'utf8')

  assert.match(source, /normalizeReportBaseUrl/)
  assert.match(source, /\.trim\(\)\.replace\(\/\\s\+\/g, ''\)/)
  assert.match(source, /\`\$\{normalizedBaseUrl\}\/audit\/\$\{report\.id\}\`/)
})

test('slack webhook is wired through ChatSDK instead of a local-only simulator', async () => {
  const bot = await fs.readFile(new URL('../lib/hireproof-bot.ts', import.meta.url), 'utf8')
  const webhook = await fs.readFile(new URL('../app/api/webhooks/slack/route.ts', import.meta.url), 'utf8')

  assert.match(bot, /from 'chat'/)
  assert.match(bot, /from '@chat-adapter\/slack'/)
  assert.match(bot, /from '@chat-adapter\/state-redis'/)
  assert.match(bot, /new Chat/)
  assert.match(bot, /createSlackAdapter/)
  assert.match(bot, /createRedisState/)
  assert.match(bot, /onNewMention/)
  assert.match(bot, /onSubscribedMessage/)
  assert.match(bot, /formatChatVerdict/)
  assert.match(webhook, /handleSlackWebhook/)
  assert.match(webhook, /waitUntil/)
})

test('multi-platform chat agents are wired through ChatSDK adapters', async () => {
  const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const bot = await fs.readFile(new URL('../lib/hireproof-bot.ts', import.meta.url), 'utf8')
  const schemas = await fs.readFile(new URL('../lib/schemas.ts', import.meta.url), 'utf8')
  const discordWebhook = await fs.readFile(new URL('../app/api/webhooks/discord/route.ts', import.meta.url), 'utf8')
  const telegramWebhook = await fs.readFile(new URL('../app/api/webhooks/telegram/route.ts', import.meta.url), 'utf8')
  const zernioWebhook = await fs.readFile(new URL('../app/api/webhooks/zernio/route.ts', import.meta.url), 'utf8')
  const chatRoute = await fs.readFile(new URL('../app/api/chat/hireproof/route.ts', import.meta.url), 'utf8')

  assert.equal(packageJson.dependencies['@chat-adapter/discord'], '^4.26.0')
  assert.equal(packageJson.dependencies['@chat-adapter/telegram'], '^4.26.0')
  assert.equal(packageJson.dependencies['@zernio/chat-sdk-adapter'], '^0.2.3')
  assert.match(bot, /from '@chat-adapter\/discord'/)
  assert.match(bot, /from '@chat-adapter\/telegram'/)
  assert.match(bot, /from '@zernio\/chat-sdk-adapter'/)
  assert.match(bot, /createDiscordAdapter/)
  assert.match(bot, /createTelegramAdapter/)
  assert.match(bot, /createZernioAdapter/)
  assert.match(bot, /from 'node:crypto'/)
  assert.match(bot, /verifyDiscordInteractionRequest/)
  assert.match(bot, /DISCORD_INTERACTION_PING_TYPE = 1/)
  assert.match(bot, /DISCORD_INTERACTION_CALLBACK_PONG_TYPE = 1/)
  assert.match(bot, /Response\.json\(\{ type: DISCORD_INTERACTION_CALLBACK_PONG_TYPE \}/)
  assert.match(bot, /DISCORD_INTERACTION_APPLICATION_COMMAND_TYPE = 2/)
  assert.match(bot, /DISCORD_INTERACTION_CALLBACK_DEFERRED_CHANNEL_MESSAGE_TYPE = 5/)
  assert.match(bot, /handleDiscordApplicationCommand/)
  assert.match(bot, /createDiscordAuditReply/)
  assert.match(bot, /CHAT_URL_PATTERN/)
  assert.doesNotMatch(bot, /enrichJobUrlInput/)
  assert.match(bot, /updateDiscordInteraction/)
  assert.match(bot, /\/api\/v1\/audit/)
  assert.match(bot, /handleTelegramStartCommand/)
  assert.match(bot, /Welcome to HireProof/)
  assert.match(bot, /sendTelegramMessage/)
  assert.match(bot, /DEFAULT_PRODUCTION_BASE_URL = 'https:\/\/hireproof\.tech'/)
  assert.match(bot, /getChatReplyBaseUrl/)
  assert.match(bot, /VERCEL_PROJECT_PRODUCTION_URL/)
  assert.match(bot, /Fake Check Pattern/)
  assert.match(bot, /Zelle/)
  assert.match(bot, /Advance-Fee Pattern/)
  assert.match(bot, /Identity Theft Pattern/)
  assert.match(bot, /Reshipping Scam Pattern/)
  assert.match(bot, /getDiscordCredentialStatus/)
  assert.match(bot, /getTelegramCredentialStatus/)
  assert.match(bot, /getWhatsAppCredentialStatus/)
  assert.match(bot, /CHAT_TEXT_LIMIT = 10_000/)
  assert.match(bot, /createCredentialGateResponse/)
  assert.match(bot, /getChatConfigFingerprint/)
  assert.match(bot, /botFingerprint/)
  assert.match(bot, /platform: chatPlatform/)
  assert.match(bot, /required: requiredEnvironmentByPlatform/)
  assert.match(bot, /mode: 'live'/)
  assert.match(bot, /source: 'chat'/)
  assert.match(discordWebhook, /handleDiscordWebhook/)
  assert.match(discordWebhook, /waitUntil/)
  assert.match(telegramWebhook, /handleTelegramWebhook/)
  assert.match(telegramWebhook, /waitUntil/)
  assert.match(zernioWebhook, /handleZernioWebhook/)
  assert.match(zernioWebhook, /waitUntil/)
  assert.match(chatRoute, /supportedPlatforms/)
  assert.match(chatRoute, /'discord'/)
  assert.match(chatRoute, /'telegram'/)
  assert.match(chatRoute, /'whatsapp'/)
  assert.match(chatRoute, /Job post text must be 10,000 characters or fewer/)
  assert.match(schemas, /'chat'/)
})

test('live chat proof script fails loudly but keeps controlled credential gates honest', async () => {
  const packageJson = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const script = await fs.readFile(new URL('../scripts/check-live-chat-proof.mjs', import.meta.url), 'utf8')
  const runbook = await fs.readFile(new URL('../docs/live-chat-platform-proof-plan.md', import.meta.url), 'utf8')
  const proofArchive = await fs.readFile(new URL('../docs/demo/proof-archive.md', import.meta.url), 'utf8')

  assert.equal(packageJson.scripts['proof:chat-live'], 'node scripts/check-live-chat-proof.mjs')
  assert.equal(packageJson.scripts['proof:chat-live:strict'], 'node scripts/check-live-chat-proof.mjs --require-live')
  assert.match(script, /REQUEST_TIMEOUT_MS = 15_000/)
  assert.match(script, /live-chat-proof-check-strict-latest\.json/)
  assert.match(script, /assertPublicHttpBaseUrl/)
  assert.match(script, /collectValidationErrors/)
  assert.match(script, /coreStatus/)
  assert.match(script, /optionalStatus/)
  assert.match(script, /shared ChatSDK reply path did not return the expected high-risk production report/)
  assert.match(script, /live platform proof is still pending for/)
  assert.match(script, /HIREPROOF_PROOF_OUTPUT_PATH/)
  assert.doesNotMatch(script, /raw: text/)
  assert.match(runbook, /proof:chat-live:strict/)
  assert.match(proofArchive, /live-chat-proof-check-latest\.json/)
})

test('ai gateway is the primary model provider when configured', async () => {
  const model = await fs.readFile(new URL('../lib/ai-model.ts', import.meta.url), 'utf8')
  const auditRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const v1AuditRoute = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const healthRoute = await fs.readFile(new URL('../app/api/health/route.ts', import.meta.url), 'utf8')

  assert.match(model, /from '@ai-sdk\/gateway'/)
  assert.match(model, /gateway\(/)
  assert.match(model, /createOpenAI/)
  assert.match(model, /HIREPROOF_MODEL/)
  assert.match(model, /hasHireProofModelProvider/)
  assert.match(model, /getModelProviderStatus/)
  assert.match(auditRoute, /getHireProofModel/)
  assert.match(auditRoute, /hasHireProofModelProvider/)
  assert.doesNotMatch(auditRoute, /createOpenAI/)
  assert.match(v1AuditRoute, /getHireProofModel/)
  assert.match(v1AuditRoute, /hasHireProofModelProvider/)
  assert.doesNotMatch(v1AuditRoute, /createOpenAI/)
  assert.match(healthRoute, /getModelProviderStatus/)
  assert.match(healthRoute, /hasHireProofModelProvider/)
})

test('workflow route uses the WDK package and next plugin is enabled', async () => {
  const workflow = await fs.readFile(new URL('../lib/workflows/audit-workflow.ts', import.meta.url), 'utf8')
  const route = await fs.readFile(new URL('../app/api/workflows/audit/route.ts', import.meta.url), 'utf8')
  const nextConfig = await fs.readFile(new URL('../next.config.js', import.meta.url), 'utf8')

  assert.match(workflow, /from 'workflow'/)
  assert.match(workflow, /'use workflow'/)
  assert.match(workflow, /sleep\(/)
  assert.match(route, /from 'workflow\/api'/)
  assert.match(route, /start\(/)
  assert.match(route, /WORKFLOW_SECRET/)
  assert.match(nextConfig, /withWorkflow/)
})

test('next config stubs optional discord zlib dependency for server builds', async () => {
  const nextConfig = await fs.readFile(new URL('../next.config.js', import.meta.url), 'utf8')
  const stub = await fs.readFile(new URL('../lib/optional-zlib-sync-stub.js', import.meta.url), 'utf8')

  assert.match(nextConfig, /optional-zlib-sync-stub\.js/)
  assert.match(nextConfig, /resolveAlias/)
  assert.match(nextConfig, /'zlib-sync'/)
  assert.match(stub, /module\.exports = null/)
})

test('verified badge requires owned verified domains and public embed tokens', async () => {
  const badgeRoute = await fs.readFile(new URL('../app/api/verified-badge/route.ts', import.meta.url), 'utf8')
  const domainRoute = await fs.readFile(new URL('../app/api/developer/domains/route.ts', import.meta.url), 'utf8')
  const verifyRoute = await fs.readFile(new URL('../app/api/developer/domains/verify/route.ts', import.meta.url), 'utf8')
  const statusRoute = await fs.readFile(new URL('../app/api/verified-badge/status/route.ts', import.meta.url), 'utf8')
  const scriptRoute = await fs.readFile(new URL('../app/api/verified-badge/script/route.ts', import.meta.url), 'utf8')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')

  assert.doesNotMatch(badgeRoute, /Boolean\(auth && domain\)/)
  assert.match(badgeRoute, /getVerifiedDomainByToken/)
  assert.match(statusRoute, /getVerifiedDomainByToken/)
  assert.match(scriptRoute, /application\/javascript/)
  assert.match(domainRoute, /createVerifiedDomain/)
  assert.match(verifyRoute, /verifyDomainOwnership/)
  assert.match(authStore, /VerifiedDomainRecord/)
  assert.match(authStore, /verificationToken/)
  assert.match(authStore, /publicToken/)
  assert.match(authStore, /resolveTxt/)
})

test('platform proof endpoint exposes credential-aware ChatSDK and WDK e2e state', async () => {
  const route = await fs.readFile(new URL('../app/api/integrations/proof/route.ts', import.meta.url), 'utf8')
  const readiness = await fs.readFile(new URL('../lib/platform-readiness.ts', import.meta.url), 'utf8')

  assert.match(route, /getPlatformReadiness/)
  assert.match(readiness, /SLACK_BOT_TOKEN/)
  assert.match(readiness, /SLACK_SIGNING_SECRET/)
  assert.match(readiness, /REDIS_URL/)
  assert.match(readiness, /WORKFLOW_SECRET/)
  assert.match(readiness, /AI_GATEWAY_API_KEY/)
  assert.match(readiness, /credential-gated/)
  assert.match(readiness, /ready/)
  assert.match(readiness, /coreStatus/)
  assert.match(readiness, /optionalStatus/)
  assert.match(readiness, /requiredSurfaces/)
  assert.doesNotMatch(readiness, /\[slack\.state,\s*discord\.state,\s*telegram\.state,\s*whatsapp\.state,\s*workflow\.state,\s*gateway\.state\]\.every/)
})

test('platform proof endpoint exposes readiness for all chat platforms', async () => {
  const readiness = await fs.readFile(new URL('../lib/platform-readiness.ts', import.meta.url), 'utf8')

  assert.match(readiness, /DISCORD_BOT_TOKEN/)
  assert.match(readiness, /DISCORD_PUBLIC_KEY/)
  assert.match(readiness, /DISCORD_APPLICATION_ID/)
  assert.match(readiness, /TELEGRAM_BOT_TOKEN/)
  assert.match(readiness, /TELEGRAM_WEBHOOK_SECRET_TOKEN/)
  assert.match(readiness, /TELEGRAM_BOT_USERNAME/)
  assert.match(readiness, /ZERNIO_API_KEY/)
  assert.match(readiness, /ZERNIO_WEBHOOK_SECRET/)
  assert.match(readiness, /discord/)
  assert.match(readiness, /telegram/)
  assert.match(readiness, /whatsapp/)
})

test('lab client streams real audit events instead of simulated telemetry', async () => {
  const source = await fs.readFile(new URL('../app/lab/lab-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /\/api\/audit/)
  assert.match(source, /AuditReport/)
  assert.match(source, /TextDecoder/)
  assert.match(source, /parsed\.type === 'log'/)
  assert.match(source, /parsed\.type === 'result'/)
  assert.match(source, /parsed\.type === 'error'/)
  assert.doesNotMatch(source, /Generic Optimization/)
  assert.doesNotMatch(source, /Domain age: 4 days/)
  assert.doesNotMatch(source, /Visual demo mode/)
  assert.doesNotMatch(source, /0\.4ms/)
  assert.doesNotMatch(source, /Math\.random/)
})

test('audit page consumes the live audit sse stream instead of parsing it as json', async () => {
  const source = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')
  const progress = await fs.readFile(new URL('../components/audit/audit-live-progress.tsx', import.meta.url), 'utf8')
  const route = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')

  assert.match(source, /type StreamEvent/)
  assert.match(source, /setLiveMode/)
  assert.match(source, /streamLogs/)
  assert.match(source, /streamEvents/)
  assert.match(source, /AbortController/)
  assert.match(source, /handleStopWaiting/)
  assert.match(source, /AuditLiveProgress/)
  assert.match(source, /response\.body\.getReader\(\)/)
  assert.match(source, /new TextDecoder\(\)/)
  assert.match(source, /line\.startsWith\('data:'\)/)
  assert.match(source, /parsed\.type === 'log'/)
  assert.match(source, /parsed\.type === 'result'/)
  assert.match(source, /parsed\.type === 'error'/)
  assert.match(source, /Live evidence/)
  assert.match(source, /Demo fixtures/)
  assert.match(progress, /Analyst console/)
  assert.match(progress, /aria-live="polite"/)
  assert.match(progress, /prefers-reduced-motion/)
  assert.match(progress, /Still waiting on search providers/)
  assert.match(progress, /Stop waiting/)
  assert.match(progress, /min-h-11/)
  assert.match(progress, /PHASES/)
  assert.match(route, /phase:/)
  assert.match(route, /status:/)
  assert.match(route, /label:/)
  assert.doesNotMatch(source, /await res\.json\(\)/)
  assert.doesNotMatch(source, /Math\.random\(\)/)
})

test('audit mode tabs explain live evidence and demo fixtures with accessible help text', async () => {
  const source = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /function ModeTooltip/)
  assert.match(source, /HelpCircle/)
  assert.match(source, /Runs the real audit using configured evidence search, OCR, and model providers/)
  assert.match(source, /Loads prebuilt example reports instantly/)
  assert.match(source, /aria-label="Use live evidence mode/)
  assert.match(source, /aria-label="Use demo fixtures mode/)
  assert.doesNotMatch(source, /title="Live evidence runs/)
  assert.doesNotMatch(source, /title="Demo fixtures load/)
  assert.match(source, /overflow-visible rounded-xl/)
  assert.match(source, /bottom-\[calc\(100%\+0\.65rem\)\]/)
  assert.match(source, /border-t-border-soft/)
  assert.match(source, /bg-surface\/95/)
  assert.match(source, /backdrop-blur-md/)
  assert.match(source, /AnimatePresence/)
  assert.match(source, /role="tooltip"/)
})

test('demo reports disclose fixture mode and timeline avoids fake timings', async () => {
  const auditClient = await fs.readFile(new URL('../app/audit/audit-client.tsx', import.meta.url), 'utf8')
  const resultScreen = await fs.readFile(new URL('../components/audit/result-screen.tsx', import.meta.url), 'utf8')

  assert.match(auditClient, /showToast\('Demo fixture loaded/)
  assert.match(auditClient, /timelineEvents=/)
  assert.match(auditClient, /Demo fixture/)
  assert.match(resultScreen, /Demo fixture/)
  assert.match(resultScreen, /timelineEvents/)
  assert.match(resultScreen, /expandedTimelineSteps/)
  assert.match(resultScreen, /aria-expanded=\{isExpanded\}/)
  assert.match(resultScreen, /Expand timeline/)
  assert.match(resultScreen, /Collapse timeline/)
  assert.match(resultScreen, /Timeline details explain the audit process/)
  assert.match(resultScreen, /Use live evidence mode for fresh source checks/)
  assert.doesNotMatch(resultScreen, /T\+0\.4s/)
  assert.doesNotMatch(resultScreen, /T\+1\.2s/)
  assert.doesNotMatch(resultScreen, /T\+2\.1s/)
  assert.doesNotMatch(resultScreen, /Identified \$\{result\.extractedClaims\.company/)
})

test('docs explain current audit behavior without release wording', async () => {
  const docsLayout = await fs.readFile(new URL('../app/docs/layout.tsx', import.meta.url), 'utf8')
  const docsOverview = await fs.readFile(new URL('../app/docs/page.tsx', import.meta.url), 'utf8')
  const howItWorks = await fs.readFile(new URL('../app/docs/how-it-works/page.tsx', import.meta.url), 'utf8')
  const investigation = await fs.readFile(new URL('../app/docs/investigation-engine/page.tsx', import.meta.url), 'utf8')
  const streaming = await fs.readFile(new URL('../app/docs/streaming/page.tsx', import.meta.url), 'utf8')

  assert.match(docsLayout, /How It Works/)
  assert.match(docsOverview, /Verified-only alternatives/)
  assert.match(howItWorks, /Live evidence mode/)
  assert.match(howItWorks, /Demo fixture mode/)
  assert.match(howItWorks, /verified-only safer alternatives/i)
  assert.match(howItWorks, /remote startup mode/i)
  assert.match(howItWorks, /SerpApi circuit breaker/i)
  assert.match(howItWorks, /queue throttling/i)
  assert.match(investigation, /timeline uses the stream events/)
  assert.match(streaming, /Demo fixture mode does not emit live investigation events/)
  assert.doesNotMatch(howItWorks, /\bupdated\b/i)
  assert.doesNotMatch(howItWorks, /\breleased\b/i)
})

test('audit APIs do not fail the response when report persistence fails', async () => {
  const uiRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const v1Route = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const db = await fs.readFile(new URL('../lib/db.ts', import.meta.url), 'utf8')

  assert.match(uiRoute, /persistReportSafely/)
  assert.match(v1Route, /persistReportSafely/)
  assert.match(db, /function parseRedisIndex/)
  assert.match(db, /await redis\.set\(redisIndexKey, nextIndex\)/)
  assert.doesNotMatch(db, /await redis\.set\(redisIndexKey, JSON\.stringify\(nextIndex\)\)/)
})

test('audit APIs enrich job URLs before claim extraction', async () => {
  const uiRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const v1Route = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const enrichment = await fs.readFile(new URL('../lib/job-url-enrichment.mjs', import.meta.url), 'utf8')
  const auditForm = await fs.readFile(new URL('../components/audit/audit-form.tsx', import.meta.url), 'utf8')

  assert.match(uiRoute, /enrichAuditRequestInput/)
  assert.match(v1Route, /enrichAuditRequestInput/)
  assert.match(enrichment, /PUBLIC_JOB_HOST_SOURCES/)
  assert.match(enrichment, /application\\\/ld\\\+json/)
  assert.match(enrichment, /generic-html/)
  assert.match(enrichment, /detectInputConflicts/)
  assert.match(enrichment, /buildEnrichmentEvidence/)
  assert.match(enrichment, /buildEnrichmentRedFlags/)
  assert.match(uiRoute, /buildEnrichmentRedFlags/)
  assert.match(v1Route, /buildEnrichmentRedFlags/)
  assert.match(auditForm, /cleanText \|\| cleanUrl \|\| image/)
  assert.match(auditForm, /!text\.trim\(\) && !url\.trim\(\) && !image/)
})

test('audit form focuses the main paste box on desktop for fast text or screenshot paste', async () => {
  const auditForm = await fs.readFile(new URL('../components/audit/audit-form.tsx', import.meta.url), 'utf8')

  assert.match(auditForm, /textInputRef/)
  assert.match(auditForm, /window\.matchMedia\?\.\('\(pointer: fine\)'\)/)
  assert.match(auditForm, /focus\(\{ preventScroll: true \}\)/)
  assert.match(auditForm, /onPaste=\{handleClipboardPaste\}/)
  assert.match(auditForm, /Paste text or screenshot from clipboard/)
})

test('audit APIs run screenshot OCR before claim extraction', async () => {
  const uiRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const v1Route = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const ocr = await fs.readFile(new URL('../lib/ocr.mjs', import.meta.url), 'utf8')

  assert.match(uiRoute, /enrichAuditRequestWithOcr/)
  assert.match(v1Route, /enrichAuditRequestWithOcr/)
  assert.match(uiRoute, /!validated\.text && !validated\.image && validated\.url/)
  assert.match(v1Route, /!validated\.text && !validated\.image && validated\.url/)
  assert.match(ocr, /GOOGLE_CLOUD_VISION_API_KEY/)
  assert.match(ocr, /DOCUMENT_TEXT_DETECTION/)
  assert.match(ocr, /preprocessImageForTesseract/)
  assert.match(ocr, /sharp/)
  assert.match(ocr, /grayscale\(\)/)
  assert.match(ocr, /normalise\(\)/)
  assert.match(ocr, /sharpen/)
  assert.match(ocr, /tesseract\.js/)
  assert.match(ocr, /Screenshot OCR/)
})

test('audit result UI renders a dedicated screenshot OCR evidence receipt', async () => {
  const resultScreen = await fs.readFile(new URL('../components/audit/result-screen.tsx', import.meta.url), 'utf8')

  assert.match(resultScreen, /data-testid="ocr-evidence-receipt"/)
  assert.match(resultScreen, /Screenshot analyzed/)
  assert.match(resultScreen, /Google Vision OCR/)
  assert.match(resultScreen, /Tesseract fallback OCR/)
  assert.match(resultScreen, /Show extracted text/)
  assert.match(resultScreen, /aria-controls="ocr-extracted-text"/)
  assert.match(resultScreen, /min-h-11/)
  assert.match(resultScreen, /Screenshot text could not be extracted/)
  assert.match(resultScreen, /redactSensitiveDisplayText/)
  assert.match(resultScreen, /getEvidenceDisplaySnippet/)
})

test('screenshot audits are excluded from public explore and trends listings by default', async () => {
  const uiRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const v1Route = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const reportsRoute = await fs.readFile(new URL('../app/api/intelligence/reports/route.ts', import.meta.url), 'utf8')
  const db = await fs.readFile(new URL('../lib/db.ts', import.meta.url), 'utf8')
  const publicReports = await fs.readFile(new URL('../lib/public-intelligence-reports.mjs', import.meta.url), 'utf8')
  const omniDocs = await fs.readFile(new URL('../app/docs/omni-modal/page.tsx', import.meta.url), 'utf8')

  assert.match(uiRoute, /publiclyListed:\s*!validated\.image/)
  assert.match(v1Route, /publiclyListed:\s*!validated\.image/)
  assert.match(reportsRoute, /filterPublicIntelligenceReports/)
  assert.match(db, /buildPublicReportTrends/)
  assert.match(publicReports, /publiclyListed === true/)
  assert.match(publicReports, /version === '2'/)
  assert.match(publicReports, /Boolean\(report\.intelligence\)/)
  assert.match(omniDocs, /Google Vision OCR \+ Tesseract fallback/)
  assert.match(omniDocs, /excluded from Explore and Trends by default/)
})

test('docs explain current OCR, URL enrichment, scoring, and screenshot privacy behavior', async () => {
  const docsOverview = await fs.readFile(new URL('../app/docs/page.tsx', import.meta.url), 'utf8')
  const investigation = await fs.readFile(new URL('../app/docs/investigation-engine/page.tsx', import.meta.url), 'utf8')
  const scoring = await fs.readFile(new URL('../app/docs/risk-scoring/page.tsx', import.meta.url), 'utf8')
  const headless = await fs.readFile(new URL('../app/docs/headless-api/page.tsx', import.meta.url), 'utf8')

  assert.match(docsOverview, /Google Vision OCR first/)
  assert.match(docsOverview, /resolves public job URLs/)
  assert.match(investigation, /Screenshot OCR path/)
  assert.match(investigation, /Tesseract OCR after image preprocessing/)
  assert.match(investigation, /excluded from Explore and Trends by default/)
  assert.match(scoring, /OCR confidence/)
  assert.match(scoring, /Input conflicts/)
  assert.match(headless, /Supported Inputs/)
  assert.match(headless, /marks the report as not publicly listed by default/)
})

test('markdown docs explain OCR behavior, URL enrichment, privacy defaults, and demo fixture boundaries', async () => {
  const readme = await fs.readFile(new URL('../README.md', import.meta.url), 'utf8')
  const currentBehavior = await fs.readFile(new URL('../docs/current-audit-behavior.md', import.meta.url), 'utf8')
  const submission = await fs.readFile(new URL('../docs/final-submission-pack.md', import.meta.url), 'utf8')
  const remaining = await fs.readFile(new URL('../docs/remaining-work.md', import.meta.url), 'utf8')
  const liveStatus = await fs.readFile(new URL('../docs/final-live-vs-pending-status.md', import.meta.url), 'utf8')

  assert.match(readme, /Google Vision OCR runs first/)
  assert.match(readme, /Tesseract fallback/)
  assert.match(readme, /not publicly listed by default/)
  assert.match(readme, /should not be described as live evidence/)
  assert.match(readme, /Verified-only safer alternatives/)
  assert.match(readme, /Demo fixture mode/)
  assert.match(readme, /SerpApi circuit breaker/)
  assert.match(currentBehavior, /Live evidence mode/)
  assert.match(currentBehavior, /Demo fixture mode/)
  assert.match(currentBehavior, /Verified-only safer alternatives/)
  assert.match(currentBehavior, /remote startup mode/i)
  assert.match(currentBehavior, /queue throttling/i)
  assert.match(currentBehavior, /SerpApi circuit breaker/)
  assert.doesNotMatch(currentBehavior, /\bupdated\b/i)
  assert.doesNotMatch(currentBehavior, /\breleased\b/i)
  assert.match(submission, /reads screenshots through OCR/)
  assert.match(submission, /flags conflicts between pasted text, OCR text, and resolved job-page content/)
  assert.match(submission, /verified-only safer alternatives/i)
  assert.match(submission, /Demo fixture mode is clearly labeled/)
  assert.match(remaining, /Screenshot OCR is implemented/)
  assert.match(remaining, /Demo fixtures are intentional seeded examples/)
  assert.match(remaining, /Verified-only safer alternatives/)
  assert.match(remaining, /SerpApi circuit breaker/)
  assert.match(liveStatus, /Latest Screenshot OCR Smoke/)
  assert.match(liveStatus, /Demo mode uses seeded fixtures/)
  assert.match(liveStatus, /Timeline uses captured stream events/)
})

test('audit scoring uses normalized evidence-weighted signals', async () => {
  const scorer = await fs.readFile(new URL('../lib/risk-scorer.ts', import.meta.url), 'utf8')
  const signals = await fs.readFile(new URL('../lib/audit-signals.mjs', import.meta.url), 'utf8')

  assert.match(scorer, /buildAuditSignals/)
  assert.match(scorer, /scoreAuditSignals/)
  assert.match(signals, /sourceTier/)
  assert.match(signals, /entity\.input_conflict/)
  assert.match(signals, /salary\.implausible_weekly_entry_role/)
  assert.match(signals, /score = Math\.max\(score, 80\)/)
  assert.match(signals, /score = Math\.min\(score, 30\)/)
})

test('redis-backed services trim production environment variables before client creation', async () => {
  const db = await fs.readFile(new URL('../lib/db.ts', import.meta.url), 'utf8')
  const authStore = await fs.readFile(new URL('../lib/auth-store.ts', import.meta.url), 'utf8')
  const rateLimit = await fs.readFile(new URL('../lib/rate-limit.ts', import.meta.url), 'utf8')
  const bot = await fs.readFile(new URL('../lib/hireproof-bot.ts', import.meta.url), 'utf8')

  for (const source of [db, authStore, rateLimit]) {
    assert.match(source, /UPSTASH_REDIS_REST_URL\?\.trim\(\)/)
    assert.match(source, /UPSTASH_REDIS_REST_TOKEN\?\.trim\(\)/)
  }
  assert.match(bot, /REDIS_URL\?\.trim\(\)/)
  assert.match(bot, /REDIS_URL!\.trim\(\)/)
})

test('robots and proxy discourage common AI crawlers from scraping public pages', async () => {
  const robots = await fs.readFile(new URL('../app/robots.ts', import.meta.url), 'utf8')
  const proxy = await fs.readFile(new URL('../proxy.ts', import.meta.url), 'utf8')

  for (const crawler of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'CCBot', 'Bytespider', 'Google-Extended', 'Applebot-Extended', 'Meta-ExternalAgent']) {
    assert.match(robots, new RegExp(crawler.replace('-', '[-]'), 'i'))
    assert.match(proxy, new RegExp(crawler.replace('-', '[-]'), 'i'))
  }

  assert.match(robots, /disallow:\s*'\/'/)
  assert.match(robots, /hireproof\.tech\/sitemap\.xml/)
  assert.match(proxy, /hireproof-sigma\.vercel\.app/)
  assert.match(proxy, /www\.hireproof\.tech/)
  assert.match(proxy, /NextResponse\.redirect\(url, 308\)/)
  assert.match(proxy, /noai, noimageai/)
  assert.match(proxy, /isApiOrIntegrationRoute/)
  assert.match(proxy, /API, MCP, webhook, and headless agent routes stay reachable/)
  assert.match(proxy, /Access Denied/)
})

test('feedback endpoint accepts structured reason metadata', async () => {
  const route = await fs.readFile(new URL('../app/api/intelligence/feedback/route.ts', import.meta.url), 'utf8')
  const schemas = await fs.readFile(new URL('../lib/schemas.ts', import.meta.url), 'utf8')
  const resultScreen = await fs.readFile(new URL('../components/audit/result-screen.tsx', import.meta.url), 'utf8')

  assert.match(route, /userFeedbackReason/)
  assert.match(route, /false_positive/)
  assert.match(route, /salary_wrong/)
  assert.match(schemas, /userFeedbackReason/)
  assert.match(resultScreen, /feedbackReason/)
})

test('demo fixtures do not ship fake safer alternatives', async () => {
  const fixtures = await fs.readFile(new URL('../lib/fixtures.ts', import.meta.url), 'utf8')

  assert.doesNotMatch(fixtures, /TechCorp PH/)
  assert.doesNotMatch(fixtures, /Digital Solutions Inc/)
  assert.doesNotMatch(fixtures, /Acme Tech Solutions/)
  assert.doesNotMatch(fixtures, /GlobalTech Inc/)
  assert.doesNotMatch(fixtures, /Digital Innovation Labs/)
  assert.match(fixtures, /alternatives:\s*\[\]/)
})

test('live audit routes expose balanced guardrails and SerpApi circuit status', async () => {
  const uiRoute = await fs.readFile(new URL('../app/api/audit/route.ts', import.meta.url), 'utf8')
  const v1Route = await fs.readFile(new URL('../app/api/v1/audit/route.ts', import.meta.url), 'utf8')
  const schemas = await fs.readFile(new URL('../lib/schemas.ts', import.meta.url), 'utf8')
  const guardrails = await fs.readFile(new URL('../lib/live-audit-guardrails.ts', import.meta.url), 'utf8')
  const serpapi = await fs.readFile(new URL('../lib/serpapi.ts', import.meta.url), 'utf8')

  for (const source of [uiRoute, v1Route]) {
    assert.match(source, /acquireLiveAuditGuardrail/)
    assert.match(source, /runEvidenceBroker/)
    assert.match(source, /evidenceProviders/)
    assert.match(source, /Retry-After/)
  }
  assert.match(schemas, /evidenceProviders/)
  assert.match(guardrails, /maxConcurrent/)
  assert.match(guardrails, /liveSearch/)
  assert.match(serpapi, /circuitOpenUntil/)
  assert.match(serpapi, /recordSerpApiFailure/)
  assert.match(serpapi, /getSerpApiOperationalStatus/)
})

test('audit result UI exposes evidence provider status transparency', async () => {
  const resultScreen = await fs.readFile(new URL('../components/audit/result-screen.tsx', import.meta.url), 'utf8')
  const investigationDocs = await fs.readFile(new URL('../app/docs/investigation-engine/page.tsx', import.meta.url), 'utf8')

  assert.match(resultScreen, /data-testid="evidence-provider-status"/)
  assert.match(resultScreen, /Evidence provider status/)
  assert.match(resultScreen, /getProviderDisplayName/)
  assert.match(resultScreen, /safeBrowsing/)
  assert.match(resultScreen, /certificateTransparency/)
  assert.match(resultScreen, /Provider misses are operational context/)
  assert.match(investigationDocs, /Evidence provider status/)
  assert.match(investigationDocs, /A missing phishing hit is neutral/)
})

test('audit report schema accepts live enriched claims with provider status metadata', async () => {
  const { AuditReportSchema } = await import('../lib/schemas.ts')

  const report = {
    id: 'report_schema_provider_status',
    version: '2',
    verdict: 'caution',
    riskScore: 45,
    confidence: 'Medium',
    summary: 'Live provider status regression fixture.',
    extractedClaims: {
      company: 'Vercel',
      role: 'Software Engineer',
      salary: 'Not specified',
      location: 'New York City, San Francisco Read more Senior Communications Manager San Francisco Read more Senior Customer Support Engineer Australia Read more Senior Customer Support Engineer Germany, United Kingdom',
      contactMethod: 'LinkedIn',
      applicationPath: 'Provided job URL with a resolved public careers path and additional normalized context from the source page.',
      recruiterName: 'Software Engineer Role At Vercel. Apply Through',
      recruiterEmail: 'recruiting@vercel.com',
    },
    redFlags: [],
    greenFlags: [],
    evidence: [],
    alternatives: [],
    nextSteps: ['Review the provider status before trusting the report.'],
    timestamp: new Date().toISOString(),
    mode: 'live',
    source: 'web',
    publiclyListed: true,
    intelligence: {
      coverage: {
        company: 'verified',
        local: 'partial',
        recruiter: 'verified',
        reputation: 'clear',
        market: 'missing',
        applyPath: 'official',
      },
      companyProfileMode: 'established_remote',
      companyIdentity: { status: 'matched', officialDomain: 'vercel.com', evidenceIds: [] },
      recruiterIdentity: { status: 'domain-match', recruiterEmailDomain: 'vercel.com', evidenceIds: [] },
      localPresence: { status: 'partial', evidenceIds: [] },
      marketBenchmark: { status: 'missing', evidenceIds: [] },
      applyPath: { status: 'official', submittedHost: 'vercel.com', officialHost: 'vercel.com', evidenceIds: [] },
      signals: [],
      scoreTrace: [],
    },
    operations: {
      liveSearch: { status: 'cache-only', message: 'Fresh evidence broker cache was reused.' },
      evidenceProviders: {
        serpapi: { provider: 'serpapi', status: 'ok', message: 'SerpApi live search completed.' },
        rdap: { provider: 'rdap', status: 'degraded', message: 'RDAP did not return usable data.' },
        dns: { provider: 'dns', status: 'ok' },
        safeBrowsing: { provider: 'safeBrowsing', status: 'not-live', message: 'Google Safe Browsing key is not configured.' },
      },
    },
  }

  assert.equal(AuditReportSchema.safeParse(report).success, true)
})
