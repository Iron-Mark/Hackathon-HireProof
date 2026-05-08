import { readFile } from 'node:fs/promises'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { readReportSummaries, saveReportSummary } from './report-history.mjs'

const MENU = [
  { id: 'audit', label: 'Audit', description: 'Run the guided audit workflow' },
  { id: 'paste', label: 'Paste message', description: 'Paste a recruiter message or job post' },
  { id: 'file', label: 'Audit file', description: 'Audit text from a local file path' },
  { id: 'url', label: 'Audit URL', description: 'Audit a job URL with optional context' },
  { id: 'reports', label: 'Recent reports', description: 'Review locally saved TUI report summaries' },
  { id: 'ask', label: 'Ask HireProof', description: 'Ask local questions about the selected report' },
  { id: 'health', label: 'Health', description: 'Check API, search, and model readiness' },
  { id: 'config', label: 'Config', description: 'Inspect base URL and API key status' },
  { id: 'help', label: 'Help', description: 'Show shortcuts and command examples' },
  { id: 'exit', label: 'Exit', description: 'Close the terminal UI' },
]

const SHIELD = [
  '    .-=========-.',
  "  .'  HIREPROOF  '.",
  ' /   .---------.   \\',
  '|   /    HP     \\   |',
  '|   |  [SCAN]   |   |',
  '|   \\___________/   |',
  " '.   SENTINEL   .'",
  "   '-._______ .-'",
]

const COMMANDS = [
  { command: 'audit', screen: 'audit', aliases: ['scan', 'check'] },
  { command: 'paste', screen: 'paste', aliases: ['message', 'text'] },
  { command: 'file', screen: 'file', aliases: ['path'] },
  { command: 'url', screen: 'url', aliases: ['link'] },
  { command: 'reports', screen: 'reports', aliases: ['report', 'history', 'recent'] },
  { command: 'ask', screen: 'ask', aliases: ['chat', 'why'] },
  { command: 'health', screen: 'health', aliases: ['status', 'ready'] },
  { command: 'config', screen: 'config', aliases: ['settings', 'key'] },
  { command: 'help', screen: 'help', aliases: ['?'] },
  { command: 'exit', screen: 'exit', aliases: ['quit'] },
]

const ColorContext = React.createContext(true)

function useInkColor(value) {
  return useContext(ColorContext) ? value : undefined
}

function normalizeVerdict(value) {
  const verdict = String(value || 'unknown').toLowerCase()
  if (verdict === 'safe') return 'Safe'
  if (verdict === 'caution') return 'Caution'
  if (verdict === 'high-risk') return 'High-Risk'
  return verdict ? `${verdict[0].toUpperCase()}${verdict.slice(1)}` : 'Unknown'
}

function riskBar(score) {
  const safeScore = Math.max(0, Math.min(100, Number(score || 0)))
  const total = 20
  const filled = Math.round((safeScore / 100) * total)
  return `[${'#'.repeat(filled)}${'-'.repeat(total - filled)}]`
}

function commandMatch(input) {
  const normalized = String(input || '').trim().toLowerCase().replace(/^\/+/, '')
  if (!normalized) return null
  return COMMANDS.find(item => item.command === normalized || item.aliases.includes(normalized)) || null
}

function commandCompletion(input) {
  const normalized = String(input || '').trim().toLowerCase().replace(/^\/+/, '')
  if (!normalized) return ''
  const candidates = COMMANDS.flatMap(item => [item.command, ...item.aliases.map(alias => `${alias}:${item.command}`)])
  const match = candidates.find(candidate => candidate.split(':')[0].startsWith(normalized))
  if (!match) return normalized
  return match.includes(':') ? match.split(':')[1] : match
}

function ScreenTitle({ children }) {
  return React.createElement(Text, { color: useInkColor('#12864f'), bold: true }, children)
}

function Header({ baseUrl, mode, keyStatus }) {
  const brand = useInkColor('#12864f')
  const lime = useInkColor('#55f06f')
  const muted = useInkColor('gray')
  return React.createElement(Box, { flexDirection: 'column', marginBottom: 1 }, [
    React.createElement(Text, { key: 'brand', color: brand, bold: true }, 'HIREPROOF'),
    React.createElement(Text, { key: 'sub', color: lime }, 'Shield Sentinel terminal console'),
    React.createElement(Text, { key: 'target', color: muted }, `Target ${baseUrl}  Mode ${mode}  Key ${keyStatus}`),
  ])
}

function Mascot() {
  const brand = useInkColor('#12864f')
  const lime = useInkColor('#55f06f')
  return React.createElement(Box, { flexDirection: 'column', marginRight: 3 }, [
    React.createElement(Text, { key: 'name', color: lime, bold: true }, 'Shield Sentinel'),
    ...SHIELD.map((line, index) => React.createElement(Text, { key: line, color: index === 1 ? lime : brand }, line)),
  ])
}

function Menu({ selected }) {
  const lime = useInkColor('#55f06f')
  return React.createElement(Box, { flexDirection: 'column' }, MENU.map((item, index) => {
    const active = index === selected
    return React.createElement(Text, { key: item.id, color: active ? lime : undefined }, `${active ? '>' : ' '} ${item.label} - ${item.description}`)
  }))
}

function CommandConsole({ value }) {
  const lime = useInkColor('#55f06f')
  const muted = useInkColor('gray')
  const completion = commandCompletion(value)
  const hint = value && completion && completion !== value ? `Tab -> ${completion}` : 'Try: health, paste, reports, ask, config'

  return React.createElement(Box, { flexDirection: 'column', marginTop: 1 }, [
    React.createElement(Text, { key: 'label', color: muted }, 'Command console  Tab autocomplete  Enter run'),
    React.createElement(Text, { key: 'input', color: lime }, `> ${value}`),
    React.createElement(Text, { key: 'hint', color: muted }, hint),
  ])
}

function StatusBar({ health, mode, keyStatus, report }) {
  const muted = useInkColor('gray')
  const latest = report ? `${normalizeVerdict(report.verdict)} ${Number(report.riskScore ?? 0)}/100` : 'none'
  const api = health?.status === 'ok' ? 'API ok' : health?.status === 'error' ? 'API error' : 'API not checked'
  return React.createElement(Text, { color: muted }, `${api} | mode ${mode} | key ${keyStatus} | latest ${latest} | / commands | Tab complete | ? help`)
}

function HelpScreen() {
  return React.createElement(Box, { flexDirection: 'column' }, [
    React.createElement(ScreenTitle, { key: 'title' }, 'Help'),
    React.createElement(Text, { key: 'shortcuts', bold: true }, 'Keyboard shortcuts'),
    React.createElement(Text, { key: 'nav' }, 'ArrowUp/ArrowDown moves. Enter opens. Esc goes back. Ctrl+C exits.'),
    React.createElement(Text, { key: 'slash' }, '/ focus command palette'),
    React.createElement(Text, { key: 'a' }, 'a audit'),
    React.createElement(Text, { key: 'h' }, 'h health'),
    React.createElement(Text, { key: 'r' }, 'r reports'),
    React.createElement(Text, { key: 'question' }, '? help'),
    React.createElement(Text, { key: 'audit' }, 'Direct command: hireproof audit --text "Suspicious job..." --mode demo'),
    React.createElement(Text, { key: 'json' }, 'Automation mode: hireproof audit --file ./job.txt --json'),
  ])
}

function ConfigScreen({ baseUrl, apiKey }) {
  const muted = useInkColor('gray')
  return React.createElement(Box, { flexDirection: 'column' }, [
    React.createElement(ScreenTitle, { key: 'title' }, 'Config'),
    React.createElement(Text, { key: 'base' }, `Base URL: ${baseUrl}`),
    React.createElement(Text, { key: 'key' }, `API key: ${apiKey ? 'configured' : 'missing'}`),
    React.createElement(Text, { key: 'hint', color: muted }, 'Use hireproof config set baseUrl <url> or hireproof config set apiKey <key>.'),
  ])
}

function HealthScreen({ health }) {
  const gateway = health?.modelProvider?.aiGateway
  const muted = useInkColor('gray')
  return React.createElement(Box, { flexDirection: 'column' }, [
    React.createElement(ScreenTitle, { key: 'title' }, 'Health'),
    React.createElement(Text, { key: 'api' }, `API: ${health?.status || 'not checked'}`),
    React.createElement(Text, { key: 'search' }, `Live search: ${health?.liveSearch ? 'ready' : 'not checked'}`),
    React.createElement(Text, { key: 'model' }, `Model: ${health?.model ? 'ready' : 'not checked'}`),
    React.createElement(Text, { key: 'gateway' }, `AI Gateway: ${gateway ? 'ready' : 'not checked'}`),
    React.createElement(Text, { key: 'hint', color: muted }, 'Run health from the menu or command: hireproof health.'),
  ])
}

function ReportScreen({ report, reports = [] }) {
  const activeReport = report || reports[0]
  if (!activeReport) {
    return React.createElement(Box, { flexDirection: 'column' }, [
      React.createElement(ScreenTitle, { key: 'title' }, 'Recent reports'),
      React.createElement(Text, { key: 'empty' }, 'No local TUI reports yet. Run an audit from this console first.'),
    ])
  }

  const lines = [
    React.createElement(ScreenTitle, { key: 'title' }, 'Recent reports'),
    React.createElement(Text, { key: 'id' }, `Report: ${activeReport.id || 'unknown'}`),
    React.createElement(Text, { key: 'verdict' }, `Verdict: ${normalizeVerdict(activeReport.verdict)}  Score: ${Number(activeReport.riskScore ?? 0)}/100 ${riskBar(activeReport.riskScore)}`),
    React.createElement(Text, { key: 'summary' }, activeReport.summary || 'No summary returned.'),
  ]

  return React.createElement(Box, { flexDirection: 'column' }, lines)
}

function AuditScreen({ mode, kind = 'audit', auditClient, saveReport, readFileText, onReport }) {
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('idle')
  const [progressSteps, setProgressSteps] = useState([])
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef('')
  const lime = useInkColor('#55f06f')
  const risk = useInkColor('#b42318')
  const brand = useInkColor('#12864f')
  const evidence = useInkColor('#1d4ed8')
  const muted = useInkColor('gray')

  function updateInput(value) {
    inputRef.current = value
    setInput(value)
  }

  async function runAudit() {
    const rawInput = inputRef.current.trim()
    if (!rawInput || status === 'running') return
    setStatus('running')
    setProgressSteps(['Reading input...', 'Calling HireProof API...', 'Extracting claims...', 'Rendering evidence...'])
    setError('')
    try {
      let text = rawInput
      let url
      if (kind === 'file') text = (await readFileText(rawInput)).trim()
      if (kind === 'url') {
        url = rawInput
        text = `Job URL: ${rawInput}`
      }
      const nextReport = await auditClient({ text, mode, ...(url ? { url } : {}) })
      setReport(nextReport)
      onReport(nextReport)
      await saveReport(nextReport)
      setStatus('done')
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : 'Audit failed')
      setStatus('error')
    }
  }

  useInput((value, key) => {
    if (status === 'running' || status === 'done') return
    if (key.return || value === '\r' || value === '\n') {
      runAudit()
      return
    }
    if (key.backspace || key.delete) {
      updateInput(inputRef.current.slice(0, -1))
      return
    }
    if (value && !key.ctrl && !key.meta) updateInput(`${inputRef.current}${value}`)
  })

  if (report) {
    return React.createElement(Box, { flexDirection: 'column' }, [
      React.createElement(ScreenTitle, { key: 'title' }, 'Audit result'),
      ...progressSteps.map(step => React.createElement(Text, { key: step, color: muted }, step)),
      React.createElement(Text, { key: 'verdict' }, `Verdict: ${normalizeVerdict(report.verdict)}  Score: ${Number(report.riskScore ?? 0)}/100 ${riskBar(report.riskScore)}`),
      React.createElement(Text, { key: 'summary' }, report.summary || 'No summary returned.'),
      React.createElement(Text, { key: 'claims', color: lime }, 'Claims'),
      React.createElement(Text, { key: 'company' }, `Company: ${report.extractedClaims?.company || 'Not specified'}`),
      React.createElement(Text, { key: 'role' }, `Role: ${report.extractedClaims?.role || 'Not specified'}`),
      React.createElement(Text, { key: 'flags', color: risk }, 'Red flags'),
      ...((report.redFlags || []).slice(0, 4).map((item, index) => React.createElement(Text, { key: `red-${index}` }, `- ${item}`))),
      React.createElement(Text, { key: 'steps', color: brand }, 'Next steps'),
      ...((report.nextSteps || []).slice(0, 3).map((item, index) => React.createElement(Text, { key: `step-${index}` }, `- ${item}`))),
      React.createElement(Text, { key: 'evidence', color: evidence }, 'Evidence'),
      ...((report.evidence || []).slice(0, 3).map((item, index) => React.createElement(Text, { key: `ev-${index}` }, `- ${item.snippet || item.source || item.type}`))),
    ])
  }

  const prompt = kind === 'file' ? 'File path' : kind === 'url' ? 'Job URL' : 'Job text'
  return React.createElement(Box, { flexDirection: 'column' }, [
    React.createElement(ScreenTitle, { key: 'title' }, 'Audit'),
    React.createElement(Text, { key: 'mode' }, `Mode: ${mode}`),
    React.createElement(Text, { key: 'prompt' }, `${prompt}: ${input}`),
    status === 'running' ? React.createElement(Text, { key: 'running', color: lime }, 'Running HireProof audit...') : null,
    error ? React.createElement(Text, { key: 'error', color: risk }, error) : null,
    ...progressSteps.map(step => React.createElement(Text, { key: step, color: muted }, step)),
    React.createElement(Text, { key: 'hint', color: muted }, 'Enter submits. Esc returns home. Direct hireproof audit commands remain unchanged.'),
  ])
}

function answerReportQuestion(question, report) {
  const normalized = String(question || '').toLowerCase()
  if (!report) return 'No selected report yet. Run an audit or open a recent report first.'
  if (normalized.includes('why')) return report.summary || 'No summary is available for this report.'
  if (normalized.includes('evidence')) return (report.evidence || []).map(item => item.snippet || item.source || item).slice(0, 3).join(' | ') || 'No evidence items are available.'
  if (normalized.includes('next')) return (report.nextSteps || []).slice(0, 3).join(' | ') || 'No next steps are available.'
  if (normalized.includes('claim')) return Object.entries(report.extractedClaims || {}).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'No extracted claims are available.'
  if (normalized.includes('health')) return 'Use the Health screen or run hireproof health for live API readiness.'
  if (normalized.includes('audit')) return 'Use Audit, Paste message, Audit file, or Audit URL from the menu.'
  return 'Try: why, evidence, next steps, claims, open latest, health, or audit.'
}

function AskScreen({ report }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const inputRef = useRef('')
  const lime = useInkColor('#55f06f')
  const muted = useInkColor('gray')

  function updateInput(value) {
    inputRef.current = value
    setInput(value)
  }

  useInput((value, key) => {
    if (key.return || value === '\r' || value === '\n') {
      const question = inputRef.current.trim()
      if (question) {
        setMessages(current => [...current.slice(-3), { question, answer: answerReportQuestion(question, report) }])
        updateInput('')
      }
      return
    }
    if (key.backspace || key.delete) {
      updateInput(inputRef.current.slice(0, -1))
      return
    }
    if (value && !key.ctrl && !key.meta) updateInput(`${inputRef.current}${value}`)
  })

  return React.createElement(Box, { flexDirection: 'column' }, [
    React.createElement(ScreenTitle, { key: 'title' }, 'Ask HireProof'),
    React.createElement(Text, { key: 'hint', color: muted }, 'Local report Q&A. No AI request is sent from this panel.'),
    ...messages.flatMap((message, index) => [
      React.createElement(Text, { key: `q-${index}`, color: lime }, `You: ${message.question}`),
      React.createElement(Text, { key: `a-${index}` }, `HireProof: ${message.answer}`),
    ]),
    React.createElement(Text, { key: 'input' }, `> ${input}`),
  ])
}

function MainPanel({ screen, baseUrl, apiKey, mode, health, report, reports, auditClient, saveReport, readFileText, onReport }) {
  if (screen === 'audit' || screen === 'paste' || screen === 'file' || screen === 'url') return React.createElement(AuditScreen, {
    mode,
    kind: screen,
    auditClient,
    saveReport,
    readFileText,
    onReport,
  })
  if (screen === 'reports') return React.createElement(ReportScreen, { report, reports })
  if (screen === 'ask') return React.createElement(AskScreen, { report })
  if (screen === 'health') return React.createElement(HealthScreen, { health })
  if (screen === 'config') return React.createElement(ConfigScreen, { baseUrl, apiKey })
  if (screen === 'help') return React.createElement(HelpScreen)
  return null
}

export function HireProofTuiApp({
  baseUrl = 'https://hireproof.tech',
  apiKey = '',
  mode = 'demo',
  color = true,
  initialScreen = 'home',
  initialReport = null,
  initialHealth = null,
  auditClient,
  healthClient,
  readReports = readReportSummaries,
  saveReport = saveReportSummary,
  readFileText = filePath => readFile(filePath, 'utf8'),
}) {
  const app = useApp()
  const [selected, setSelected] = useState(0)
  const [screen, setScreen] = useState(initialScreen)
  const [health, setHealth] = useState(initialHealth)
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(initialReport)
  const [commandInput, setCommandInput] = useState('')
  const commandInputRef = useRef('')
  const keyStatus = apiKey ? 'configured' : 'missing'
  const muted = color ? 'gray' : undefined
  const activeReport = useMemo(() => selectedReport || reports[0] || null, [selectedReport, reports])
  const shortcutScreens = { a: 'audit', h: 'health', r: 'reports' }
  const runAuditClient = auditClient || (async payload => {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/v1/audit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Audit failed: HTTP ${response.status}`)
    return response.json()
  })
  const runHealthClient = healthClient || (async () => {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/health`)
    if (!response.ok) throw new Error(`Health check failed: HTTP ${response.status}`)
    return response.json()
  })

  useEffect(() => {
    let active = true
    if (screen === 'health' && !health) {
      runHealthClient()
        .then(nextHealth => { if (active) setHealth(nextHealth) })
        .catch(() => { if (active) setHealth({ status: 'error', liveSearch: false, model: false }) })
    }
    return () => { active = false }
  }, [screen])

  useEffect(() => {
    let active = true
    if (screen === 'reports') {
      readReports()
        .then(nextReports => {
          if (!active) return
          setReports(nextReports)
          if (!selectedReport && nextReports[0]) setSelectedReport(nextReports[0])
        })
        .catch(() => { if (active) setReports([]) })
    }
    return () => { active = false }
  }, [screen])

  function updateCommandInput(value) {
    commandInputRef.current = value
    setCommandInput(value)
  }

  function openScreen(nextScreen) {
    updateCommandInput('')
    setScreen(nextScreen)
  }

  function runCommand(input) {
    const match = commandMatch(input)
    if (!match) return
    if (match.screen === 'exit') {
      app.exit()
      return
    }
    openScreen(match.screen)
  }

  useInput((input, key) => {
    if (key.escape && screen !== 'home') {
      setScreen('home')
      return
    }
    if (key.escape && screen === 'home' && commandInputRef.current) {
      updateCommandInput('')
      return
    }
    if (key.escape && screen === 'home') {
      app.exit()
      return
    }
    if (screen !== 'home') return
    if (input === '/' && !commandInputRef.current) {
      updateCommandInput('/')
      return
    }
    if (key.tab || input === '\t') {
      const completion = commandCompletion(commandInputRef.current)
      if (completion) updateCommandInput(completion)
      return
    }
    if (key.backspace || key.delete) {
      updateCommandInput(commandInputRef.current.slice(0, -1))
      return
    }
    if (key.upArrow) {
      if (commandInputRef.current) return
      setSelected(current => (current - 1 + MENU.length) % MENU.length)
      return
    }
    if (key.downArrow) {
      if (commandInputRef.current) return
      setSelected(current => (current + 1) % MENU.length)
      return
    }
    if (key.return) {
      if (commandInputRef.current.trim()) {
        runCommand(commandInputRef.current)
        return
      }
      const item = MENU[selected]
      if (item.id === 'exit') app.exit()
      else setScreen(item.id)
      return
    }
    if (input === 'q' && !commandInputRef.current) {
      app.exit()
      return
    }
    if (!commandInputRef.current && shortcutScreens[input]) {
      openScreen(shortcutScreens[input])
      return
    }
    if (!commandInputRef.current && input === '?') {
      openScreen('help')
      return
    }
    if (input && !key.ctrl && !key.meta) updateCommandInput(`${commandInputRef.current}${input}`)
  })

  return React.createElement(ColorContext.Provider, { value: color }, React.createElement(Box, { flexDirection: 'column', paddingX: 1 }, [
    React.createElement(Header, { key: 'header', baseUrl, mode, keyStatus }),
    React.createElement(StatusBar, { key: 'status', health, mode, keyStatus, report: activeReport }),
    screen === 'home'
      ? React.createElement(Box, { key: 'home' }, [
        React.createElement(Mascot, { key: 'mascot' }),
        React.createElement(Box, { key: 'home-main', flexDirection: 'column' }, [
          React.createElement(Menu, { key: 'menu', selected }),
          React.createElement(CommandConsole, { key: 'console', value: commandInput }),
        ]),
      ])
      : React.createElement(MainPanel, {
        key: 'panel',
        screen,
        baseUrl,
        apiKey,
        mode,
        health,
        report: activeReport,
        reports,
        auditClient: runAuditClient,
        saveReport,
        readFileText,
        onReport: setSelectedReport,
      }),
    React.createElement(Text, { key: 'footer', color: muted }, 'Esc back/exit  q exit  Direct JSON commands remain unchanged.'),
  ]))
}
