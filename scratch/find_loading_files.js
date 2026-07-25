const fs = require('fs');
const path = require('path');

function searchLoadingUI(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'scratch') continue;
    if (fs.statSync(full).isDirectory()) {
      searchLoadingUI(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('LOADING...') || content.includes('animate-spin') || content.includes('SplashScreen')) {
        console.log(`[FOUND LOADING MATCH IN: ${path.relative(path.join(__dirname, '../frontend'), full)}]`);
      }
    }
  }
}

searchLoadingUI(path.join(__dirname, '../frontend'));
