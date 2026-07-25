const http = require('http');

function fetchPage(p) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${p}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  console.log("==================================================================================");
  console.log("🔍 COMPREHENSIVE PRODUCTION VERIFICATION OF IMAGES & ESLINT COMMENTS");
  console.log("==================================================================================\n");

  const routes = ['/', '/home', '/browse', '/series/21', '/manga/13'];

  for (const r of routes) {
    try {
      const html = await fetchPage(r);
      const hasEslintText = html.includes('eslint-disable-next-line') || html.includes('@next/next/no-img-element');
      const hasStringifiedVarSrc = /src="[a-zA-Z0-9_\?\.]+\.[a-zA-Z0-9_\?\.]+"/.test(html) && !html.includes('http') && !html.includes('data:');
      const hasValidImages = html.includes('src="https://s4.anilist.co') || html.includes('src="https://cdn.myanimelist.net') || html.includes('src="/logo.png');

      console.log(`[ROUTE ${r.padEnd(12)}]`);
      console.log(`   -> Stray ESLint Comment Visible in HTML: ${hasEslintText ? '❌ BROKEN (STRAY TEXT FOUND!)' : '✅ CLEAN (0 Stray Text)'}`);
      console.log(`   -> Invalid Stringified Variable src:    ${hasStringifiedVarSrc ? '❌ BROKEN' : '✅ CLEAN'}`);
      console.log(`   -> Valid External / Local img URLs:      ${hasValidImages ? '✅ YES' : '❌ NO'}`);
      console.log("");
    } catch (e) {
      console.error(`Error on route ${r}:`, e.message);
    }
  }

  console.log("==================================================================================");
}

run();
