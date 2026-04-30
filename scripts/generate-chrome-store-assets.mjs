import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = process.cwd()
const outDir = path.join(root, 'docs', 'chrome-web-store-assets')

const logo = `
<svg width="56" height="56" viewBox="0 0 128 128" fill="none" aria-hidden="true">
  <rect width="128" height="128" rx="28" fill="#16a34a"/>
  <circle cx="64" cy="64" r="36" stroke="white" stroke-width="6" fill="none"/>
  <path d="M44 66 L58 80 L86 48" stroke="white" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`

function shell(title, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: 1280px;
      height: 800px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #141414;
      background: #f6f7f4;
    }
    .stage {
      width: 1280px;
      height: 800px;
      padding: 56px 72px;
      display: grid;
      grid-template-columns: 1fr 430px;
      gap: 58px;
      align-items: center;
    }
    .copy { max-width: 650px; }
    .brand { display: flex; align-items: center; gap: 16px; font-weight: 900; font-size: 28px; margin-bottom: 56px; }
    h1 { font-size: 74px; line-height: 0.98; margin: 0 0 24px; letter-spacing: 0; }
    p { font-size: 27px; line-height: 1.35; margin: 0; color: #4b5563; font-weight: 650; }
    .browser {
      border: 1px solid #d7ddd3;
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 30px 80px rgba(20, 20, 20, 0.14);
      overflow: hidden;
    }
    .bar { height: 44px; background: #eef1ec; display: flex; align-items: center; padding: 0 14px; gap: 8px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #c2c8be; }
    .url { margin-left: 12px; flex: 1; height: 24px; border-radius: 999px; background: #fff; color: #657066; font-size: 12px; font-weight: 800; display: flex; align-items: center; padding: 0 14px; }
    .popup { width: 360px; background: #fafafa; padding: 16px; border-left: 1px solid #e5e7eb; min-height: 470px; margin-left: auto; }
    .popup-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 16px; }
    .popup-logo { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 16px; }
    .mini-logo svg { width: 24px; height: 24px; }
    .badge { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #16a34a; background: #f0fdf4; border-radius: 999px; padding: 4px 8px; }
    .status { background: #111; color: #fff; border-radius: 8px; padding: 9px 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 12px; }
    label { display: block; font-size: 11px; font-weight: 800; color: #6b7280; margin: 8px 0 4px; }
    input, textarea { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 9px 10px; font-size: 12px; background: #fff; }
    .actions { display: flex; gap: 8px; margin-top: 14px; }
    button { flex: 1; border: 0; border-radius: 10px; padding: 10px; font-weight: 900; font-size: 12px; }
    .primary { background: #111; color: #fff; }
    .secondary { background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb; }
    .verdict { margin-top: 14px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; padding: 14px; }
    .verdict-head { display: flex; justify-content: space-between; font-weight: 900; color: #dc2626; font-size: 16px; }
    .score { color: #6b7280; font-size: 13px; }
    .summary { margin-top: 8px; color: #374151; font-size: 12px; line-height: 1.45; font-weight: 650; }
    .flag { margin-top: 7px; border-radius: 8px; background: #fef2f2; color: #991b1b; padding: 7px 8px; font-size: 11px; font-weight: 800; }
    .page { padding: 28px; min-height: 512px; background: #fff; }
    .job-card { border: 1px solid #d7ddd3; border-radius: 12px; padding: 22px; width: 620px; }
    .job-title { font-size: 28px; font-weight: 900; margin-bottom: 8px; }
    .job-meta { color: #657066; font-weight: 800; margin-bottom: 20px; }
    .scan { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; background: #16a34a; color: #fff; font-weight: 900; padding: 10px 16px; }
    .menu { position: absolute; right: 120px; bottom: 118px; width: 270px; border-radius: 12px; background: #fff; box-shadow: 0 18px 60px rgba(20,20,20,0.22); border: 1px solid #dfe5dc; padding: 8px; font-size: 14px; font-weight: 750; }
    .menu div { padding: 11px 12px; border-radius: 8px; }
    .menu .active { background: #f0fdf4; color: #166534; }
    .promo { width: 440px; height: 280px; padding: 30px; background: #111; color: #fff; display: flex; flex-direction: column; justify-content: space-between; }
    .promo h1 { color: #fff; font-size: 42px; line-height: 1; margin: 0; }
    .promo p { color: #d1d5db; font-size: 18px; }
  </style>
</head>
<body>${body}</body>
</html>`
}

const popupIdle = shell('HireProof popup', `
<main class="stage">
  <section class="copy"><div class="brand">${logo}<span>HireProof</span></div><h1>Scan job posts before you apply.</h1><p>Check suspicious listings and recruiter messages from the browser, with evidence-backed verdicts.</p></section>
  <section class="browser"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><div class="url">chrome-extension://hireproof/popup.html</div></div><div class="popup">
    <div class="popup-header"><div class="popup-logo"><span class="mini-logo">${logo}</span><span>HireProof</span></div><span class="badge">Extension</span></div>
    <div class="status">Human-filter active</div><label>API Server URL</label><input value="https://hireproof-sigma.vercel.app" /><label>API Key</label><input value="hireproof_agent_demo_key" /><div class="actions"><button class="primary">Scan This Page</button><button class="secondary">Paste & Check</button></div>
  </div></section>
</main>`)

const popupResult = shell('HireProof result', `
<main class="stage">
  <section class="copy"><div class="brand">${logo}<span>HireProof</span></div><h1>Get a verdict with receipts.</h1><p>The popup returns a risk score, summary, and the strongest warning signs.</p></section>
  <section class="browser"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><div class="url">chrome-extension://hireproof/popup.html</div></div><div class="popup">
    <div class="popup-header"><div class="popup-logo"><span class="mini-logo">${logo}</span><span>HireProof</span></div><span class="badge">Extension</span></div>
    <div class="status">Human-filter active</div><textarea rows="4">Remote frontend intern. PHP 80,000/week. No interview. Message us on Telegram.</textarea><div class="verdict"><div class="verdict-head"><span>HIGH RISK</span><span class="score">92/100</span></div><div class="summary">Unrealistic pay and off-platform contact match common recruitment scam patterns.</div></div><div class="flag">Warning: No interview before payment or personal data request</div><div class="flag">Warning: Telegram-only recruiter contact</div>
  </div></section>
</main>`)

const supportedPage = shell('Supported job page', `
<main class="stage">
  <section class="copy"><div class="brand">${logo}<span>HireProof</span></div><h1>Works on supported job boards.</h1><p>HireProof adds a scan control to job listings so users can inspect posts in context.</p></section>
  <section class="browser"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><div class="url">linkedin.com/jobs/view/sample</div></div><div class="page"><div class="job-card"><div class="job-title">Remote Frontend Intern</div><div class="job-meta">Unknown Company · Remote · PHP 80,000/week</div><p style="font-size:16px;color:#4b5563;margin-bottom:24px">No interview required. Message the recruiter on Telegram to start today.</p><span class="scan">Shield Scan with HireProof</span></div></div></section>
</main>`)

const contextMenu = shell('Context menu scan', `
<main class="stage">
  <section class="copy"><div class="brand">${logo}<span>HireProof</span></div><h1>Right-click selected text.</h1><p>Users can highlight any suspicious recruiter message and send it to HireProof.</p></section>
  <section class="browser" style="position:relative"><div class="bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><div class="url">mail.example/recruiter-message</div></div><div class="page"><p style="font-size:24px;line-height:1.5;color:#374151">We offer remote work with weekly pay. No interview needed. Send your government ID and contact us on Telegram.</p></div><div class="menu"><div>Copy</div><div>Search Google for selected text</div><div class="active">Scan with HireProof</div></div></section>
</main>`)

const promo = `<!doctype html><html><head><style>body{margin:0}.promo{width:440px;height:280px;padding:30px;background:#111;color:#fff;display:flex;flex-direction:column;justify-content:space-between;font-family:Inter,ui-sans-serif,system-ui}.brand{display:flex;align-items:center;gap:12px;font-weight:900;font-size:22px}.brand svg{width:42px;height:42px}h1{font-size:42px;line-height:1;margin:0;letter-spacing:0}p{color:#d1d5db;font-size:18px;font-weight:700;line-height:1.25;margin:0}.pill{align-self:flex-start;background:#16a34a;color:#fff;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:900;text-transform:uppercase}</style></head><body><div class="promo"><div class="brand">${logo}<span>HireProof</span></div><h1>Check job posts before you apply.</h1><p>Evidence-backed scam risk checks from your browser.</p><div class="pill">Chrome Extension</div></div></body></html>`

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })

for (const [name, html] of [
  ['screenshot-01-popup-idle-1280x800.png', popupIdle],
  ['screenshot-02-popup-result-1280x800.png', popupResult],
  ['screenshot-03-supported-job-page-1280x800.png', supportedPage],
  ['screenshot-04-context-menu-1280x800.png', contextMenu],
]) {
  await page.setContent(html)
  await page.screenshot({ path: path.join(outDir, name), fullPage: false })
}

await page.setViewportSize({ width: 440, height: 280 })
await page.setContent(promo)
await page.screenshot({ path: path.join(outDir, 'promo-small-440x280.png'), fullPage: false })

await browser.close()
console.log(`Generated Chrome Web Store image assets in ${path.relative(root, outDir)}`)
