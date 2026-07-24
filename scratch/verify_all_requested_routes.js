async function runFullRouteAudit() {
  console.log("==================================================================================");
  console.log("🚀 COMPREHENSIVE PRODUCTION BUILD ROUTE AUDIT (http://localhost:3000)");
  console.log("==================================================================================\n");

  const routesToTest = [
    { category: 'Main Pages', path: '/' },
    { category: 'Main Pages', path: '/home' },
    { category: 'Series Details', path: '/series/21' },
    { category: 'Series Details', path: '/series/50668' },
    { category: 'Series Details', path: '/series/58505' },
    { category: 'Series Details', path: '/series/1535' },
    { category: 'Series Details', path: '/series/30276' },
    { category: 'Manga Details', path: '/manga/2' },
    { category: 'Manga Details', path: '/manga/13' },
    { category: 'Character Details', path: '/character/40' },
    { category: 'Staff Details', path: '/staff/26147' },
    { category: 'Watch Player', path: '/watch/21' },
    { category: 'Watch Player', path: '/watch/2286' },
    { category: 'Catalog Browse', path: '/browse/all' },
    { category: 'Catalog Browse', path: '/browse/manga' },
    { category: 'Search Query', path: '/search?q=naruto' },
    { category: 'Genres Listing', path: '/genres' },
    { category: 'Genre Specific', path: '/genre/action' },
    { category: 'Top Lists', path: '/trending' },
    { category: 'Top Lists', path: '/popular' },
    { category: 'Schedules & Media', path: '/schedule' },
    { category: 'Schedules & Media', path: '/trailers' },
    { category: 'News & Community', path: '/news' },
    { category: 'News & Community', path: '/reviews' },
    { category: 'User Account', path: '/watchlist' },
    { category: 'User Account', path: '/profile' },
    { category: 'User Account', path: '/settings' },
    { category: 'User Account', path: '/auth' },
    { category: 'Legal & Info', path: '/privacy' },
    { category: 'Legal & Info', path: '/terms' },
    { category: 'Legal & Info', path: '/faq' },
    { category: 'Legal & Info', path: '/contact' },
    { category: '404 Handling', path: '/non-existent-page-xyz-404' }
  ];

  const results = [];

  for (const item of routesToTest) {
    const t0 = Date.now();
    try {
      const res = await fetch(`http://localhost:3000${item.path}`);
      const duration = Date.now() - t0;
      const text = await res.text();

      const is500 = res.status === 500 || text.includes('Internal Server Error') || text.includes('require() of ES Module');
      const is404Expected = item.path.includes('non-existent');
      const passed = is404Expected ? res.status === 404 : res.status === 200 && !is500;

      results.push({
        category: item.category,
        path: item.path,
        status: res.status,
        durationMs: duration,
        passed,
        is500
      });

      console.log(`[${item.category.padEnd(18)}] ${item.path.padEnd(30)} | Status: ${res.status} | Time: ${duration}ms | Passed: ${passed ? '✅ YES' : '❌ NO'}`);
    } catch (err) {
      console.error(`[${item.category}] ${item.path} ERROR: ${err.message}`);
      results.push({ category: item.category, path: item.path, status: 0, durationMs: Date.now() - t0, passed: false, error: err.message });
    }
  }

  console.log("\n==================================================================================");
  console.log(`SUMMARY: Tested ${results.length} routes | Passed: ${results.filter(r => r.passed).length} / ${results.length}`);
  console.log("==================================================================================");
}

runFullRouteAudit().catch(console.error);
