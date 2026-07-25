const fs = require('fs');
const path = require('path');

function searchScores(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchScores(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('.score') || line.includes('averageScore')) {
          console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

searchScores(path.join(__dirname, '../frontend'));
