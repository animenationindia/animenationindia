const fs = require('fs');
const path = require('path');

function findSwipers(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') findSwipers(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('mousewheel') || content.includes('Swiper')) {
        console.log(`\n--- ${file} ---`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('mousewheel') || l.includes('Swiper') || l.includes('modules')) {
            console.log(`  L${idx+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

findSwipers(path.join(__dirname, '../frontend'));
