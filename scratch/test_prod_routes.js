async function testProdRoutes() {
  console.log("==================================================");
  console.log("🚀 TESTING VERCEL LOG ROUTES ON PROD BUILD SERVER");
  console.log("==================================================\n");

  const routes = [
    '/series/21',
    '/series/52299',
    '/series/38671',
    '/staff/26147',
    '/watch/2286'
  ];

  for (const route of routes) {
    const t0 = Date.now();
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      const text = await res.text();
      const has500 = res.status === 500 || text.includes('Internal Server Error') || text.includes('require() of ES Module');
      console.log(`[Route ${route.padEnd(16)}] -> Status: ${res.status} in ${Date.now() - t0}ms | Has 500/ESM Error: ${has500}`);
    } catch (err) {
      console.error(`[Route ${route}] -> ERROR: ${err.message}`);
    }
  }

  console.log("\n==================================================");
}

testProdRoutes().catch(console.error);
