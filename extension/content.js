// HireProof Content Script - LinkedIn/Indeed Injection
console.log('HireProof: Guardian active on this page.');

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
      
      // Extract text from the card
      const text = card.innerText.replace('Scan', '').trim();
      const url = `https://hireproof-sigma.vercel.app/audit?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    };

    // Find a place to inject (LinkedIn usually has a header or footer in the card)
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
      const url = `https://hireproof-sigma.vercel.app/audit?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
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
