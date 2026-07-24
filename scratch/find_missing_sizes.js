const fs = require('fs');
const path = require('path');

function findMissingSizes(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') findMissingSizes(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('<Image') && content.includes('fill')) {
        // Simple regex or parse image blocks
        const matches = content.match(/<Image[^>]*fill[^>]*>/g) || [];
        matches.forEach(m => {
          if (!m.includes('sizes=')) {
            console.log(`MISSING SIZES in ${file}:\n  ${m.replace(/\s+/g, ' ')}`);
          }
        });
      }
    }
  }
}

findMissingSizes(path.join(__dirname, '../frontend'));
