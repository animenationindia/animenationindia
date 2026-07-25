const http = require('http');

const routes = [
  '/',
  '/home',
  '/series/21',
  '/series/5114',
  '/series/11757',
  '/series/21459',
  '/series/101922',
  '/manga/13',
  '/manga/2',
  '/character/40',
  '/staff/1880',
  '/watch/21',
  '/browse/all',
  '/browse/manga',
  '/search',
  '/genres',
  '/genre/action',
  '/trending',
  '/popular',
  '/schedule',
  '/trailers',
  '/news',
  '/reviews',
  '/watchlist',
  '/profile',
  '/settings',
  '/auth',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/contact',
  '/faq',
  '/non-existent-page-404'
];

function testRoute(p) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${p}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasEslint = data.includes('eslint-disable-next-line') || data.includes('@next/next/no-img-element');
        const hasBadSrc = /src="[a-zA-Z0-9_\?\.]+\.[a-zA-Z0-9_\?\.]+"/.test(data) && !data.includes('http') && !data.includes('data:');
        const hasImages = data.includes('src="https://s4.anilist.co') || data.includes('src="https://cdn.myanimelist.net') || data.includes('src="/logo.png') || data.includes('src="/ani-logo.png');

        resolve({
          path: p,
          status: res.statusCode,
          hasEslint,
          hasBadSrc,
          hasImages
        });
      });
    }).on('error', err => {
      resolve({ path: p, status: 500, error: err.message, hasEslint: false, hasBadSrc: false, hasImages: false });
    });
  });
}

async function run() {
  console.log("==================================================================================================");
  console.log("🧪 ROUTE-BY-ROUTE PRODUCTION AUDIT TEST");
  console.log("==================================================================================================\n");

  for (const r of routes) {
    const res = await testRoute(r);
    const statusStr = res.status === 200 || res.status === 404 ? `STATUS: ${res.status}` : `STATUS: ${res.status} ❌`;
    const eslintStr = res.hasEslint ? '❌ Stray ESLint Text' : '✅ Clean';
    const badSrcStr = res.hasBadSrc ? '❌ Bad src' : '✅ Clean';
    const imgStr = res.hasImages ? '✅ Valid Imgs' : '⚠️ No Imgs / Static';

    console.log(`Route [${res.path.padEnd(25)}] -> ${statusStr.padEnd(14)} | ESLint: ${eslintStr.padEnd(20)} | VarSrc: ${badSrcStr.padEnd(10)} | Images: ${imgStr}`);
  }

  console.log("\n==================================================================================================");
}

run();
