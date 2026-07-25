const fs = require('fs');
const path = require('path');

function checkImgAlt(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const imgMatches = code.match(/<img\b[^>]*>/g) || [];
  let missingAltCount = 0;

  imgMatches.forEach(img => {
    if (!img.includes('alt=')) {
      missingAltCount++;
      console.log(`[${filePath}] Missing alt attribute in: ${img}`);
    }
  });

  return missingAltCount;
}

function walkDir(dir) {
  let totalMissing = 0;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'scratch') continue;
    if (fs.statSync(full).isDirectory()) {
      totalMissing += walkDir(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      totalMissing += checkImgAlt(full);
    }
  }
  return totalMissing;
}

console.log("==================================================================================");
console.log("♿ ACCESSIBILITY AUDIT: CHECKING <img alt=...> ATTRIBUTES");
console.log("==================================================================================");
const missing = walkDir(path.join(__dirname, '../frontend'));
console.log(`\nTotal <img> tags missing alt attribute: ${missing}`);
console.log("==================================================================================");
