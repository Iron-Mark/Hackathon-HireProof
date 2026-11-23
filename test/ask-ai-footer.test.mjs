import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import {
  ASK_AI_LABEL,
  ASK_AI_PROVIDERS,
  buildAskAiHref,
  buildAskAiPrompt,
  citePublishedCanonical,
  showAskAiRow,
} from '../lib/ask-ai.mjs'

test('ask ai row is present on docs and portfolio and absent on audit and developer', async () => {
  assert.equal(showAskAiRow('/docs'), true)
  assert.equal(showAskAiRow('/docs/api-reference'), true)
  assert.equal(showAskAiRow('/portfolio'), true)
  assert.equal(showAskAiRow('/audit'), false)
  assert.equal(showAskAiRow('/developer'), false)

  const footer = await fs.readFile(new URL('../components/layout/site-footer.tsx', import.meta.url), 'utf8')
  assert.equal(ASK_AI_LABEL, 'Ask your AI')
  assert.match(footer, /ASK_AI_LABEL/)
  assert.match(footer, /showAskAiRow\(pathname\)/)
  assert.match(footer, /buildAskAiHref/)

  const canonical = citePublishedCanonical('https://hireproof.tech/portfolio?utm=1#case', '/portfolio')
  assert.equal(canonical, 'https://hireproof.tech/portfolio')
  const prompt = buildAskAiPrompt('Mark Siazon — HireProof Portfolio Case Study | HireProof', canonical)
  assert.equal(
    prompt,
    'As a job seeker, I want to understand how HireProof can help me check a suspicious job post before I apply or share any personal details, so I know whether to go further. I want to know what I can look for, and I am asking about the public page rather than handing you a job to judge. Summarize the highlights from "Mark Siazon — HireProof Portfolio Case Study | HireProof": https://hireproof.tech/portfolio Don\'t give me HireProof\'s verdict, and don\'t include a job post I paste in.',
  )

  assert.equal(ASK_AI_PROVIDERS.length, 5)
  const hrefs = ASK_AI_PROVIDERS.map((provider) => buildAskAiHref(provider.href, prompt))
  assert.deepEqual(
    hrefs.map((href) => {
      const url = new URL(href)
      return `${url.origin}${url.pathname}`
    }),
    [
      'https://chatgpt.com/',
      'https://claude.ai/new',
      'https://gemini.google.com/app',
      'https://www.perplexity.ai/search',
      'https://grok.com/',
    ],
  )
  for (const href of hrefs) {
    const url = new URL(href)
    assert.equal(url.searchParams.get('q'), prompt)
    assert.equal(url.hash, '')
  }
})
