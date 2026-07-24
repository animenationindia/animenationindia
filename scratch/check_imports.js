const fs = require('fs');
const path = require('path');

function searchImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'scratch') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchImports(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('dompurify') || content.includes('isomorphic-dompurify')) {
        console.log(`FOUND IMPORT IN: ${fullPath}`);
      }
    }
  }
}

console.log("Searching for any dompurify imports in project...");
searchImports('C:\\Users\\hp\\OneDrive\\Documents\\Shouvik Work\\animenationindia\\frontend');
console.log("Search completed!");
