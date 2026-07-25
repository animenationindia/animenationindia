const fs = require('fs');
const path = require('path');

const routes = [
  'frontend/app/browse/loading.tsx',
  'frontend/app/search/loading.tsx',
  'frontend/app/series/[id]/loading.tsx',
  'frontend/app/manga/[id]/loading.tsx',
  'frontend/app/watch/[id]/loading.tsx'
];

routes.forEach(r => {
  const full = path.join(__dirname, '..', r);
  console.log(`${r}: ${fs.existsSync(full) ? 'EXISTS' : 'MISSING'}`);
});
