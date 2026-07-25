const http = require('http');

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  console.log("==================================================================================");
  console.log("🔍 VERIFYING DIRECT EXTERNAL IMAGE URLS (BYPASSING /_next/image)");
  console.log("==================================================================================\n");

  const paths = ['/home', '/series/21', '/manga/13'];
  for (const path of paths) {
    try {
      const html = await fetchPage(path);
      const hasNextImageProxy = html.includes('/_next/image?url=https');
      const hasDirectImg = html.includes('src="https://s4.anilist.co') || html.includes('src="https://cdn.myanimelist.net') || html.includes('src="https://i.ytimg.com');

      console.log(`[PATH ${path.padEnd(12)}]`);
      console.log(`   -> Next.js Proxy Image Links (/_next/image): ${hasNextImageProxy}`);
      console.log(`   -> Direct External CDN img Links (s4.anilist.co / MAL / YT): ${hasDirectImg}`);
      console.log("");
    } catch (e) {
      console.error(`Error fetching ${path}: ${e.message}`);
    }
  }

  console.log("==================================================================================");
}

run();
