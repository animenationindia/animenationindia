const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        searchFiles(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('medium') || content.includes('coverImage')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('coverImage') || line.includes('medium')) {
            console.log(`${fullPath}:${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles(path.join(__dirname, '../frontend'));
