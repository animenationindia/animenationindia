const fs = require('fs');
const path = require('path');

console.log("==================================================================================");
console.log("🔍 GENRE ROUTE STRUCTURE & LINK DESTINATIONS INSPECTION");
console.log("==================================================================================\n");

// Check folders under frontend/app
const appDir = path.join(__dirname, '../frontend/app');
const genreDirs = ['genres', 'genre', 'browse/genres'];

genreDirs.forEach(d => {
  const full = path.join(appDir, d);
  console.log(`[DIRECTORY frontend/app/${d.padEnd(16)}] Exists: ${fs.existsSync(full)}`);
  if (fs.existsSync(full)) {
    const files = fs.readdirSync(full);
    console.log(`   -> Files inside: ${files.join(', ')}`);
  }
});

// Search for href="/genre..." and href="/genres..." in components and app files
function findGenreLinks(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'scratch') continue;
    if (fs.statSync(full).isDirectory()) {
      findGenreLinks(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(/href=["']\/genre[s]?\/?[^"']*["']/g) || [];
      const searchParamMatches = content.match(/href=["']\/search\?[^"']*genres?=[^"']*["']/g) || [];
      if (matches.length > 0 || searchParamMatches.length > 0) {
        console.log(`\n[LINK SOURCE: ${path.relative(path.join(__dirname, '../frontend'), full)}]`);
        matches.forEach(m => console.log(`   -> ${m}`));
        searchParamMatches.forEach(m => console.log(`   -> ${m}`));
      }
    }
  }
}

console.log("\n----------------------------------------------------------------------------------");
console.log("🔗 GENRE LINK HREF DESTINATIONS ACROSS CODEBASE:");
console.log("----------------------------------------------------------------------------------");
findGenreLinks(path.join(__dirname, '../frontend'));

console.log("\n==================================================================================");
