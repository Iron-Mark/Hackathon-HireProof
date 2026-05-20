#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { formatResearchMarkdown, runResearchAgent } from '../lib/research-agent.mjs'

function printHelp() {
  console.log(`HireProof research agent

Usage:
  npm run research:agent -- --prompt "Investigate this job post"
  node scripts/research-agent.mjs --prompt "Investigate this job post"
  node scripts/research-agent.mjs --file ./job-post.txt --enable-codex

Options:
  --prompt <text>       Research prompt or suspicious job/recruiter text.
  --file <path>         Read the prompt from a UTF-8 text file.
  --primary <provider>  cursor, codex, or none. Default: RESEARCH_AGENT_PRIMARY or cursor.
  --fallback <provider> cursor, codex, or none. Default: RESEARCH_AGENT_FALLBACK or codex.
  --enable-codex        Permit Codex SDK fallback for this run.
  --timeout-ms <ms>     Per-provider timeout. Default: CODEX_AGENT_TIMEOUT_MS or 120000.
  --save                Save JSON and Markdown reports under artifacts/research-agent/.
  --out <path>          Save to a file or directory. .json writes JSON, .md writes Markdown.
  --json                Print only the JSON result.
  --help                Show this help.
`)
}

function parseArgs(argv) {
  const options = { json: false, enableCodex: false }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--json') options.json = true
    else if (arg === '--save') options.save = true
    else if (arg === '--enable-codex') options.enableCodex = true
    else if (arg === '--prompt' || arg === '-p') {
      options.prompt = next
      index += 1
    } else if (arg === '--file' || arg === '-f') {
      options.file = next
      index += 1
    } else if (arg === '--primary') {
      options.primary = next
      index += 1
    } else if (arg === '--fallback') {
      options.fallback = next
      index += 1
    } else if (arg === '--timeout-ms') {
      options.timeoutMs = Number(next)
      index += 1
    } else if (arg === '--out' || arg === '-o') {
      options.out = next
      index += 1
    } else if (!options.prompt) {
      options.prompt = arg
    }
  }

  return options
}

function printReadable(result) {
  console.log(`Provider: ${result.provider}`)
  console.log(`Status: ${result.status}`)
  console.log('')
  console.log(result.summary || 'No summary returned.')

  const sections = [
    ['Findings', result.findings],
    ['Evidence', result.evidence],
    ['Commands', result.commands],
    ['Next steps', result.nextSteps],
  ]

  for (const [title, items] of sections) {
    if (!items?.length) continue
    console.log('')
    console.log(`${title}:`)
    for (const item of items) console.log(`- ${item}`)
  }

  if (result.attempts?.length > 1) {
    console.log('')
    console.log('Attempts:')
    for (const attempt of result.attempts) {
      console.log(`- ${attempt.provider}: ${attempt.status}`)
    }
  }
}

function safeStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function writeArtifacts(result, outPath, saveDefault) {
  if (!outPath && !saveDefault) return []

  const target = outPath
    ? path.resolve(process.cwd(), outPath)
    : path.resolve(process.cwd(), 'artifacts/research-agent', `research-${safeStamp()}`)
  const ext = path.extname(target).toLowerCase()
  const written = []

  if (ext === '.json') {
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, `${JSON.stringify(result, null, 2)}\n`)
    written.push(target)
    return written
  }

  if (ext === '.md') {
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, formatResearchMarkdown(result))
    written.push(target)
    return written
  }

  await fs.mkdir(target, { recursive: true })
  const jsonPath = path.join(target, 'report.json')
  const markdownPath = path.join(target, 'report.md')
  await fs.writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`)
  await fs.writeFile(markdownPath, formatResearchMarkdown(result))
  written.push(jsonPath, markdownPath)
  return written
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  let prompt = options.prompt || ''
  if (options.file) {
    const filePath = path.resolve(process.cwd(), options.file)
    prompt = await fs.readFile(filePath, 'utf8')
  }

  if (!prompt.trim()) {
    printHelp()
    process.exitCode = 1
    return
  }

  const result = await runResearchAgent({
    prompt,
    primary: options.primary,
    fallback: options.fallback,
    enableCodex: options.enableCodex,
    timeoutMs: Number.isFinite(options.timeoutMs) ? options.timeoutMs : undefined,
  })
  const artifacts = await writeArtifacts(result, options.out, options.save)
  if (artifacts.length) result.artifacts = artifacts

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printReadable(result)
    if (artifacts.length) {
      console.log('')
      console.log('Artifacts:')
      for (const artifact of artifacts) console.log(`- ${artifact}`)
    }
  }

  if (result.status !== 'ok') process.exitCode = 2
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
