let drawer = null;

function createDrawer() {
  if (drawer) return drawer;

  drawer = document.createElement('div');
  drawer.className = 'hireproof-drawer';
  drawer.innerHTML = `
    <div className="hireproof-drawer-header">
      <div className="hireproof-drawer-title">HireProof Investigation</div>
      <button className="hireproof-close-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div className="hireproof-loading-state" style="display: none;">
      <div className="hireproof-spinner"></div>
      <p style="margin-top: 12px; font-size: 12px; font-weight: 700; color: #475569;">Analyzing Listing...</p>
    </div>
    <iframe className="hireproof-iframe"></iframe>
  `;

  document.body.appendChild(drawer);

  const closeBtn = drawer.querySelector('.hireproof-close-btn');
  closeBtn.onclick = () => {
    drawer.classList.remove('open');
  };

  return drawer;
}

function openInvestigation(text) {
  const d = createDrawer();
  const iframe = d.querySelector('.hireproof-iframe');
  const loader = d.querySelector('.hireproof-loading-state');
  
  // Update: use the current Vercel URL
  const baseUrl = 'https://hireproof.tech/audit';
  const url = `${baseUrl}?text=${encodeURIComponent(text)}&embed=true`;
  
  loader.style.display = 'flex';
  iframe.src = url;
  
  iframe.onload = () => {
    loader.style.display = 'none';
  };

  d.classList.add('open');
}

function injectButtons() {
  // LinkedIn Search Results
  const linkedinCards = document.querySelectorAll('.job-card-container, .jobs-search-results-list__item');
  
  linkedinCards.forEach(card => {
    if (card.querySelector('.hireproof-scan-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'hireproof-scan-btn';
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      Scan
    `;
    
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const text = card.innerText.replace('Scan', '').trim();
      openInvestigation(text);
    };

    const anchor = card.querySelector('.job-card-list__title, .artdeco-entity-lockup__title');
    if (anchor) {
      anchor.parentElement.appendChild(btn);
    }
  });

  // Indeed Search Results
  const indeedCards = document.querySelectorAll('.job_seen_beacon');
  indeedCards.forEach(card => {
    if (card.querySelector('.hireproof-scan-btn')) return;
    
    const btn = document.createElement('button');
    btn.className = 'hireproof-scan-btn indeed';
    btn.innerHTML = `Scan`;
    
    btn.onclick = (e) => {
      e.preventDefault();
      const text = card.innerText.trim();
      openInvestigation(text);
    };

    const title = card.querySelector('.jcs-JobTitle');
    if (title) {
      title.parentElement.appendChild(btn);
    }
  });
}

// Run injection on scroll and load
window.addEventListener('load', injectButtons);
document.addEventListener('scroll', injectButtons);

// Observer for dynamic content
const observer = new MutationObserver(injectButtons);
observer.observe(document.body, { childList: true, subtree: true });
