function luminance(hex) {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  const a = [r, g, b].map(function (v) {
      return v <= 0.03928
          ? v / 12.92
          : Math.pow( (v + 0.055) / 1.055, 2.4 );
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(hex1, hex2) {
  const lum1 = luminance(hex1);
  const lum2 = luminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function mix(rgba, bgHex) {
  const bgR = parseInt(bgHex.substring(1, 3), 16);
  const bgG = parseInt(bgHex.substring(3, 5), 16);
  const bgB = parseInt(bgHex.substring(5, 7), 16);
  
  const a = rgba[3];
  const r = Math.round(rgba[0] * a + bgR * (1 - a));
  const g = Math.round(rgba[1] * a + bgG * (1 - a));
  const b = Math.round(rgba[2] * a + bgB * (1 - a));
  
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2, '0')).join('');
}

const light = {
  ink: '#111827',
  muted: '#475569',
  paper: '#f8faf7',
  surface: '#ffffff',
  safeText: '#145a43',
  safeBg: '#e7f4ee',
  safe: '#167c5c',
  cautionText: '#7c4a03',
  cautionBg: '#fff4d6',
  caution: '#b7791f',
  riskText: '#7a1c14',
  riskBg: '#fde7e5',
  risk: '#b42318',
  evidence: '#2563eb',
  evidenceBg: '#e9f0ff',
  evidenceText: '#2563eb'
};

const dark = {
  ink: '#f1f5f9',
  muted: '#94a3b8',
  paper: '#0c0f14',
  surface: '#151921',
  safeText: '#6ee7b7',
  safeBg: mix([52, 211, 153, 0.12], '#151921'),
  safe: '#34d399',
  cautionText: '#fde68a',
  cautionBg: mix([251, 191, 36, 0.12], '#151921'),
  caution: '#fbbf24',
  riskText: '#fca5a5',
  riskBg: mix([248, 113, 113, 0.12], '#151921'),
  risk: '#f87171',
  evidence: '#60a5fa',
  evidenceBg: mix([96, 165, 250, 0.12], '#151921'),
  evidenceText: '#60a5fa'
};

function checkAll(theme, name) {
  console.log(`\n=== ${name} Mode ===`);
  const pairs = [
    ['paper', 'safe'],      // e.g. text-background on bg-safe
    ['paper', 'caution'],   // e.g. text-background on bg-caution
    ['paper', 'risk'],      // e.g. text-background on bg-high-risk
    ['paper', 'evidence'],  // e.g. text-background on bg-evidence
    ['surface', 'safe'],    // e.g. hover states or cards
    ['ink', 'safe'],        // e.g. text-foreground on bg-safe
    ['ink', 'caution'],     // e.g. text-foreground on bg-caution
    ['ink', 'risk'],        // e.g. text-foreground on bg-high-risk
    ['ink', 'evidence'],    // e.g. text-foreground on bg-evidence
  ];

  for (const [fg, bg] of pairs) {
    const c = contrast(theme[fg], theme[bg]).toFixed(2);
    const status = c >= 4.5 ? 'PASS AA' : (c >= 3.0 ? 'PASS Large/UI' : 'FAIL');
    console.log(`${fg} on ${bg}: ${c}:1 - ${status}`);
  }
}

checkAll(light, 'Light');
checkAll(dark, 'Dark');
