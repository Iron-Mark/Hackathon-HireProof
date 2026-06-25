document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scan-btn');
  const pasteBtn = document.getElementById('paste-btn');
  const manualInput = document.getElementById('manual-input');
  const checkPasteBtn = document.getElementById('check-paste-btn');
  const loading = document.getElementById('loading');
  const resultDiv = document.getElementById('result');
  const errorDiv = document.getElementById('error');
  const verdictCard = document.getElementById('verdict-card');
  const verdictLabel = document.getElementById('verdict-label');
  const riskScoreEl = document.getElementById('risk-score');
  const summaryEl = document.getElementById('summary');
  const flagsSection = document.getElementById('flags-section');
  const fullReportLink = document.getElementById('full-report-link');
  const serverUrlInput = document.getElementById('server-url');
  const apiKeyInput = document.getElementById('api-key');

  function getConfig() {
    return {
      serverUrl: serverUrlInput.value.replace(/\/$/, ''),
      apiKey: apiKeyInput.value,
    };
  }

  function showLoading() {
    loading.style.display = 'flex';
    resultDiv.style.display = 'none';
    errorDiv.style.display = 'none';
    scanBtn.disabled = true;
  }

  function hideLoading() {
    loading.style.display = 'none';
    scanBtn.disabled = false;
  }

  function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    hideLoading();
  }

  function safeReportUrl(serverUrl, reportId) {
    const id = String(reportId || '').trim();
    if (!/^[a-zA-Z0-9_-]{8,120}$/.test(id)) return '';

    try {
      const base = new URL(serverUrl);
      if (!['http:', 'https:'].includes(base.protocol)) return '';
      return new URL('/audit/' + encodeURIComponent(id), base).toString();
    } catch {
      return '';
    }
  }

  function displayResult(report) {
    hideLoading();

    // Verdict
    verdictLabel.textContent = report.verdict === 'high-risk' ? 'HIGH RISK' : report.verdict.toUpperCase();
    verdictLabel.className = 'verdict-label ' + report.verdict;
    verdictCard.className = 'verdict-card ' + report.verdict;
    riskScoreEl.textContent = report.riskScore + '/100';
    summaryEl.textContent = report.summary;

    // Flags
    flagsSection.innerHTML = '';
    (report.redFlags || []).slice(0, 3).forEach(flag => {
      const el = document.createElement('div');
      el.className = 'flag red';
      const icon = document.createElement('span');
      icon.className = 'flag-icon';
      icon.textContent = '⚠️';
      const textSpan = document.createElement('span');
      textSpan.textContent = flag;
      el.appendChild(icon);
      el.appendChild(textSpan);
      flagsSection.appendChild(el);
    });
    (report.greenFlags || []).slice(0, 2).forEach(flag => {
      const el = document.createElement('div');
      el.className = 'flag green';
      const icon = document.createElement('span');
      icon.className = 'flag-icon';
      icon.textContent = '✅';
      const textSpan = document.createElement('span');
      textSpan.textContent = flag;
      el.appendChild(icon);
      el.appendChild(textSpan);
      flagsSection.appendChild(el);
    });

    // Full report link
    const config = getConfig();
    const reportUrl = safeReportUrl(config.serverUrl, report.id);
    if (reportUrl) {
      fullReportLink.href = reportUrl;
      fullReportLink.style.display = 'block';
    } else {
      fullReportLink.style.display = 'none';
    }

    resultDiv.style.display = 'block';
  }

  async function investigate(text) {
    const config = getConfig();
    if (!config.serverUrl || !config.apiKey) {
      showError('Please configure the server URL and API key.');
      return;
    }

    showLoading();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(config.serverUrl + '/api/v1/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        body: JSON.stringify({ text, mode: 'demo' }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Server returned ' + res.status);
      }

      const report = await res.json();
      displayResult(report);
    } catch (err) {
      if (err.name === 'AbortError') {
        showError('Request timed out. The investigation is taking longer than expected.');
      } else {
        showError('Investigation failed: ' + err.message);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Scan current page
  scanBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        showError('Cannot access current tab.');
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Try to get the main content text
          const selectors = [
            'article',
            '[role="main"]',
            '.job-description',
            '.description__text',
            '.jobs-description__content',
            'main',
          ];
          for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 50) {
              return el.innerText.trim().substring(0, 3000);
            }
          }
          return document.body.innerText.trim().substring(0, 3000);
        },
      });

      const text = results?.[0]?.result;
      if (!text || text.length < 20) {
        showError('Could not extract enough text from this page.');
        return;
      }

      investigate(text);
    } catch (err) {
      showError('Failed to scan page: ' + err.message);
    }
  });

  // Paste mode toggle
  pasteBtn.addEventListener('click', () => {
    const isVisible = manualInput.style.display !== 'none';
    manualInput.style.display = isVisible ? 'none' : 'block';
    checkPasteBtn.style.display = isVisible ? 'none' : 'block';
  });

  checkPasteBtn.addEventListener('click', () => {
    const text = manualInput.value.trim();
    if (text.length < 10) {
      showError('Please paste a longer job post or message.');
      return;
    }
    investigate(text);
  });
});
