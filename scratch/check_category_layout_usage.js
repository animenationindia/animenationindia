const fs = require('fs');
const path = require('path');

function checkUsage(dir, targetName) {
  let count = 0;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'scratch') continue;
    if (fs.statSync(full).isDirectory()) {
      count += checkUsage(full, targetName);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(targetName)) {
        console.log(`[FOUND IN: ${path.relative(path.join(__dirname, '../frontend'), full)}]`);
        count++;
      }
    }
  }
  return count;
}

console.log("Checking CategoryLayout usage across frontend...");
const usages = checkUsage(path.join(__dirname, '../frontend'), 'CategoryLayout');
console.log("Total CategoryLayout references found:", usages);
