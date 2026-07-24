const fs = require('fs');
const path = require('path');

function searchScrollFalse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchScrollFalse(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('scroll={false}')) {
        console.log(`FOUND scroll={false} IN: ${fullPath}`);
      }
    }
  }
}

searchScrollFalse(path.join(__dirname, '../frontend'));
