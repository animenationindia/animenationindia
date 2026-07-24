async function testMultipleIDs() {
  console.log("==================================================");
  console.log("🚀 TESTING MULTIPLE ANIME IDS ON LOCALHOST:3000");
  console.log("==================================================\n");

  const testIDs = ['50668', '21', '58505', '62076', '1535', '30276'];

  for (const id of testIDs) {
    const t0 = Date.now();
    try {
      const res = await fetch(`http://localhost:3000/series/${id}`);
      const text = await res.text();
      const hasErrorUI = text.includes('Unhandled Runtime Error') || text.includes('Application error');
      const is404 = text.includes('404') && text.includes('Page Not Found');
      const is500 = res.status === 500;
      
      console.log(`[ID ${id.padEnd(6)}] -> Status: ${res.status} in ${Date.now() - t0}ms | Error UI: ${hasErrorUI} | 404 Page: ${is404}`);
    } catch (err) {
      console.error(`[ID ${id}] -> ERROR: ${err.message}`);
    }
  }

  console.log("\n==================================================");
}

testMultipleIDs().catch(console.error);
