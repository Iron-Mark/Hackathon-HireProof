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

// Test varying darkness for caution
const paper = '#f8faf7';
console.log("Testing caution colors against paper (#f8faf7):");
const candidates = ['#b7791f', '#a16207', '#854d0e', '#713f12'];
for (const c of candidates) {
  console.log(`${c}: ${contrast(c, paper).toFixed(2)}:1`);
}

console.log("\nTesting evidence colors against paper (#f8faf7):");
const evCands = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'];
for (const c of evCands) {
  console.log(`${c}: ${contrast(c, paper).toFixed(2)}:1`);
}
