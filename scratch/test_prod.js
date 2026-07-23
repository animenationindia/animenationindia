async function testProductionUrl() {
  console.log("Testing Production URL https://www.animenationindia.online/series/62076...");
  try {
    const res = await fetch('https://www.animenationindia.online/series/62076', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Production Status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
    console.log("Contains 'This page couldn't load':", text.includes("This page couldn't load"));
    console.log("Snippet:", text.slice(0, 600).replace(/\s+/g, ' '));
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}
testProductionUrl();
