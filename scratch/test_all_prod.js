async function testAllProductionRoutes() {
  const routes = [
    '/',
    '/home',
    '/series/21',
    '/series/62076',
    '/series/58505',
    '/manga/13',
    '/watch/21',
    '/browse/all',
    '/search?q=naruto'
  ];

  console.log("==================================================");
  console.log("🌐 TESTING LIVE PRODUCTION ROUTES (Vercel)");
  console.log("==================================================\n");

  for (const route of routes) {
    try {
      const url = `https://www.animenationindia.online${route}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      const text = await res.text();
      const isNextError = text.includes('__next_error__');
      console.log(`[Prod Route] ${route.padEnd(25)} -> Status: ${res.status} | Is __next_error__: ${isNextError}`);
    } catch (err) {
      console.error(`[Prod Route ERROR] ${route} -> ${err.message}`);
    }
  }
}

testAllProductionRoutes();
