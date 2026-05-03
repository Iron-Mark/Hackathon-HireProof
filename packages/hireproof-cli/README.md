# HireProof CLI

Command-line access to the HireProof job-post audit API.

The CLI is for developers, power users, and automations that need a terminal-friendly way to audit a job post without opening the web app. Running `hireproof` in an interactive terminal opens the branded HireProof console; direct commands still support rich reports, plain text, and clean JSON.

## Install

From the repo while developing:

```powershell
npm install
node packages\hireproof-cli\bin\hireproof.mjs --help
node packages\hireproof-cli\bin\hireproof.mjs tui
```

After publishing, the intended usage is:

```powershell
npx @hireproof/cli audit --text "Remote frontend intern. PHP 80,000/week. No interview. Telegram only."
```

## Commands

### Interactive Console

```powershell
hireproof
hireproof tui
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../public/cli-tui-screenshot-dark.png">
  <img alt="HireProof CLI interactive TUI" src="../../public/cli-tui-screenshot.png">
</picture>

The interactive console includes:

- Shield Sentinel ASCII mascot.
- HireProof green and lime terminal accents.
- Command console with Tab autocomplete.
- Slash commands and one-key shortcuts.
- Persistent status bar with API/mode/key/latest-report context.
- Audit, paste-message, file, and URL workflows.
- Health, config, help, recent reports, and local Ask HireProof screens.
- Sanitized local report summaries saved at `~/.hireproof/reports.jsonl`.

Non-interactive shells, CI, and piped output print help instead of opening the TUI. JSON mode is intentionally available only on direct commands such as `hireproof audit --json`.

Example console frame:

```text
HIREPROOF
Shield Sentinel terminal console
Target https://hireproof-sigma.vercel.app  Mode demo  Key configured

Shield Sentinel        > Audit - Run the guided audit workflow
    .-=========-.        Paste message - Paste a recruiter message or job post
  .'  HIREPROOF  '.      Audit file - Audit text from a local file path
 /   .---------.   \     Audit URL - Audit a job URL with optional context
|   /    HP     \   |    Recent reports - Review locally saved TUI report summaries
|   |  [SCAN]   |   |    Ask HireProof - Ask local questions about the selected report
|   \___________/   |    Health - Check API, search, and model readiness
 '.   SENTINEL   .'      Config - Inspect base URL and API key status
   '-._______ .-'        Help - Show shortcuts and command examples

Command console  Tab autocomplete  Enter run
> hea
Tab -> health
```

The console also supports slash commands and shortcuts:

```text
/health
/reports
/ask

a audit
h health
r reports
? help
Esc back
q exit from home
```

Console commands and aliases:

```text
audit, scan, check
paste, message, text
file, path
url, link
reports, report, history, recent
ask, chat, why
health, status, ready
config, settings, key
help, ?
exit, quit
```

During TUI audits, HireProof shows staged progress states before rendering the result:

```text
Reading input...
Calling HireProof API...
Extracting claims...
Rendering evidence...
```

### Audit Inline Text

```powershell
hireproof audit --text "Remote frontend intern. PHP 80,000/week. No interview. Telegram only."
```

Default human output includes:

- HireProof terminal report header.
- Verdict, confidence, and risk score bar.
- Summary, extracted claims, red flags, green flags, next steps, and evidence.
- Report link when the API returns one.

### Audit A File

```powershell
hireproof audit --file .\job-post.txt
```

or:

```powershell
hireproof audit .\job-post.txt
```

### JSON Output

```powershell
hireproof audit --file .\job-post.txt --json
```

`--json` prints only the API JSON response. It does not include colors, banners, boxes, or extra status text.

### Plain And Colorless Output

```powershell
hireproof audit --file .\job-post.txt --plain
hireproof audit --file .\job-post.txt --no-color
hireproof audit --file .\job-post.txt --verbose
```

- `--plain`: old-style compact text output with no boxed layout.
- `--no-color`: keep the rich layout, but remove ANSI color.
- `--verbose`: show more evidence items and longer human-readable detail.

The rich layout uses HireProof's brand green accent for terminal headings and readiness states, plus verdict-specific colors for safe, caution, and high-risk results. The CLI disables color automatically when output is not a TTY or when `NO_COLOR` is set.

## Local Report History

The TUI saves compact report summaries only. It does not store API keys or the full pasted recruiter text by default.

Path:

```powershell
~\.hireproof\reports.jsonl
```

### Health

```powershell
hireproof health
```

### Config

```powershell
hireproof config set baseUrl https://hireproof-sigma.vercel.app
hireproof config set apiKey hireproof_agent_demo_key
hireproof config list
```

## Options

Shared:

- `--base-url <url>`: HireProof server URL. Defaults to config, `HIREPROOF_URL`, or `https://hireproof-sigma.vercel.app`.
- `--api-key <key>`: API key. Defaults to config, `HIREPROOF_API_KEY`, or the public demo key.
- `--json`: Print raw JSON where supported.
- `--plain`: Print compact non-boxed text where supported.
- `--no-color`: Disable ANSI color in rich output.
- `--verbose`: Show more detail in human output.

Audit:

- `--text <text>`: Job post or recruiter message text.
- `--file <path>`: Read text from a file.
- `--url <url>`: Optional job post URL context.
- `--location <place>`: Optional location context.
- `--mode <demo|live>`: Audit mode.
- `--webhook-url <url>`: Ask the API for async processing.

## Honest Status

This package is repo-shipped, TUI-enabled, and tested. It is not published to npm until the package owner runs the external publish flow.
