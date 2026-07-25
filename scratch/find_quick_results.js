const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'scratch') continue;
    if (fs.statSync(full).isDirectory()) {
      searchFiles(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.toLowerCase().includes('quick results')) {
        console.log(`FOUND in: ${full}`);
      }
    }
  }
}

searchFiles(path.join(__dirname, '../frontend'));
