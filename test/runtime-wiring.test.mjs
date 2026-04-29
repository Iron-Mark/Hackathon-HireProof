import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { buildTrendsViewModel } from '../lib/trends-view-model.mjs'

test('explore client fetches the intelligence reports endpoint', async () => {
  const source = await fs.readFile(new URL('../app/explore/explore-client.tsx', import.meta.url), 'utf8')

  assert.match(source, /\/api\/intelligence\/reports/)
  assert.doesNotMatch(source, /\/api\/reports/)
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
  assert.equal(viewModel.statCards[1].value, '3')
  assert.equal(viewModel.vectorSections[0].title, 'Contact methods')
  assert.deepEqual(viewModel.vectorSections[0].items[0], { label: 'Telegram', count: 3, percent: 30 })
  assert.equal(viewModel.recentHighRisk[0].company, 'TechStart')
  assert.equal(viewModel.modeLabel, 'Stored audits')
})

test('triple-track coverage has an app docs page and sidebar link', async () => {
  const docsPage = await fs.readFile(new URL('../app/docs/triple-track-coverage/page.tsx', import.meta.url), 'utf8')
  const docsLayout = await fs.readFile(new URL('../app/docs/layout.tsx', import.meta.url), 'utf8')

  assert.match(docsPage, /v0 \+ MCPs/)
  assert.match(docsPage, /ChatSDK Agents/)
  assert.match(docsPage, /Vercel Workflow/)
  assert.match(docsLayout, /\/docs\/triple-track-coverage/)
})

test('chat and workflow status endpoints expose honest track readiness', async () => {
  const chatRoute = await fs.readFile(new URL('../app/api/chat/hireproof/route.ts', import.meta.url), 'utf8')
  const workflowRoute = await fs.readFile(new URL('../app/api/workflows/audit/route.ts', import.meta.url), 'utf8')

  assert.match(chatRoute, /ChatSDK Agents/)
  assert.match(chatRoute, /\/api\/webhooks\/slack/)
  assert.match(workflowRoute, /Vercel Workflow/)
  assert.match(workflowRoute, /startAuditWorkflow/)
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
