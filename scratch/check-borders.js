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

const light = {
  paper: '#f8faf7',
  surface: '#ffffff',
  border: '#cbd5c7',
  borderSoft: '#d9e2d6'
};

const dark = {
  paper: '#0c0f14',
  surface: '#151921',
  border: '#2d3748',
  borderSoft: '#1e293b'
};

console.log("Light Mode Borders:");
console.log("border vs paper: " + contrast(light.border, light.paper).toFixed(2));
console.log("borderSoft vs paper: " + contrast(light.borderSoft, light.paper).toFixed(2));
console.log("border vs surface: " + contrast(light.border, light.surface).toFixed(2));

console.log("\nDark Mode Borders:");
console.log("border vs paper: " + contrast(dark.border, dark.paper).toFixed(2));
console.log("borderSoft vs paper: " + contrast(dark.borderSoft, dark.paper).toFixed(2));
console.log("border vs surface: " + contrast(dark.border, dark.surface).toFixed(2));
