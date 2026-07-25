const fs = require('fs');
const path = require('path');

function checkFileForIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const hasUnescapedEslint = content.includes('/* eslint-disable-next-line');
  const hasStringifiedSrc = /src=\{"[^"]+\.\w+[^"]*"\}|src=\{"[a-zA-Z0-9_\?\.\s\|\|]+"\}|src=\{"cover"\}|src=\{"backgroundImage"\}/.test(content);
  
  if (hasUnescapedEslint || hasStringifiedSrc || content.includes('src={"')) {
    console.log(`ISSUES FOUND IN: ${filePath}`);
    if (hasUnescapedEslint) console.log('  -> Contains unescaped /* eslint-disable */');
    if (content.includes('src={"')) console.log('  -> Contains stringified src={"..."}');
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'scratch') continue;
    if (fs.statSync(full).isDirectory()) {
      walkDir(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      checkFileForIssues(full);
    }
  }
}

walkDir(path.join(__dirname, '../frontend'));
