async function auditSeriesPage() {
  console.log("==================================================================================");
  console.log("🚀 DEEP ISOLATED AUDIT FOR /series/[id] ON LOCAL PROD BUILD SERVER");
  console.log("==================================================================================\n");

  const testCases = [
    { id: '21', description: 'Long-running popular title (One Piece)' },
    { id: '58505', description: 'Recent title (Demon Slayer Hashira Arc)' },
    { id: '50668', description: 'Movie format title (Witch on the Holy Night)' },
    { id: '52299', description: 'Niche / obscure title' },
    { id: '999999999', description: 'Genuine invalid ID (Not Found 404)' }
  ];

  for (const test of testCases) {
    const t0 = Date.now();
    try {
      const res = await fetch(`http://localhost:3000/series/${test.id}`);
      const duration = Date.now() - t0;
      const html = await res.text();

      const is200 = res.status === 200;
      const is404 = res.status === 404 || html.includes('404') && html.includes('Page Not Found');
      const is500 = res.status === 500 || html.includes('Internal Server Error') || html.includes('Application error');

      const hasTitle = html.includes('<h1');
      const hasPoster = html.includes('object-cover');
      const hasCharacters = html.includes('Main Characters');
      const hasRelations = html.includes('Franchise &amp; Related Seasons') || html.includes('Franchise & Related Seasons');
      const hasRecommendations = html.includes('You Might Also Like');

      console.log(`[ID ${test.id.padEnd(10)}] (${test.description})`);
      console.log(`   -> Status: ${res.status} in ${duration}ms`);
      console.log(`   -> Checks: 500 Error: ${is500} | Has Title: ${hasTitle} | Characters: ${hasCharacters} | Relations: ${hasRelations} | Recommendations: ${hasRecommendations}`);
      console.log("");
    } catch (err) {
      console.error(`[ID ${test.id}] ERROR: ${err.message}\n`);
    }
  }

  console.log("==================================================================================");
}

auditSeriesPage().catch(console.error);
