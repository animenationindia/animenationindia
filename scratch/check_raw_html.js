const https = require('https');
const http = require('http');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Googlebot/2.1 (+http://www.google.com/bot.html)' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, html: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log("==================================================================================");
  console.log("🔍 RAW HTML INSPECTION FOR PROD & LOCAL DEV HOME PAGE");
  console.log("==================================================================================\n");

  const targets = [
    { name: "PRODUCTION LIVE (https://www.animenationindia.online/home)", url: "https://www.animenationindia.online/home" },
    { name: "LOCAL DEV SERVER (http://localhost:3000/home)", url: "http://localhost:3000/home" }
  ];

  const checkSections = [
    "Trending Anime in India",
    "Just Updated",
    "Upcoming Seasonal Anime",
    "Anime Not For Kids",
    "Trending Anime",
    "Sports & Competition",
    "If You Liked Sword Art Online",
    "Fantasy Worlds",
    "Supernatural & Mystery",
    "Sci-Fi & Cyberpunk",
    "Evergreen Classics",
    "If You Liked My Hero Academia",
    "Hidden Gems You Might Have Missed",
    "Recommended by users",
    "Community Reviews"
  ];

  for (const target of targets) {
    console.log(`📡 Fetching ${target.name}...`);
    try {
      const { status, html } = await fetchHtml(target.url);
      console.log(`   -> Status: ${status} | Total HTML Length: ${html.length} bytes`);

      console.log("\n   SECTION RAW HTML ANALYSIS:");
      checkSections.forEach(section => {
        const hasHeading = html.includes(section);
        // Find if anime card links or content exist after the heading
        const sectionIndex = html.indexOf(section);
        let hasCardContent = false;
        if (sectionIndex !== -1) {
          const chunk = html.substring(sectionIndex, sectionIndex + 2500);
          hasCardContent = chunk.includes('/series/') || chunk.includes('/manga/') || chunk.includes('object-cover') || chunk.includes('/watch/');
        }
        console.log(`   - [${section.padEnd(35)}] Heading Present: ${String(hasHeading).padEnd(5)} | Card Content in HTML: ${hasCardContent}`);
      });
      console.log("\n");
    } catch (e) {
      console.error(`❌ Failed to fetch ${target.name}: ${e.message}\n`);
    }
  }
}

run();
