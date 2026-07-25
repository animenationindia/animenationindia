const http = require('http');

function fetchMeta(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const titleMatch = data.match(/<title>([^<]+)<\/title>/);
        const descMatch = data.match(/<meta name="description" content="([^"]+)"/);
        resolve({
          path: urlPath,
          title: titleMatch ? titleMatch[1] : 'No Title',
          description: descMatch ? descMatch[1] : 'No Description'
        });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log("==================================================================================");
  console.log("🏷️ DYNAMIC GENRE METADATA VERIFICATION");
  console.log("==================================================================================\n");

  const testUrls = [
    '/genres',
    '/genres?genreId=1', // Action
    '/genres?genreId=2', // Adventure
    '/browse/genres?genreId=4' // Comedy
  ];

  for (const url of testUrls) {
    try {
      const meta = await fetchMeta(url);
      console.log(`[URL: ${meta.path.padEnd(30)}]`);
      console.log(`   -> Meta Title:       "${meta.title}"`);
      console.log(`   -> Meta Description: "${meta.description}"\n`);
    } catch (e) {
      console.error(`Error on ${url}:`, e.message);
    }
  }

  console.log("==================================================================================");
}

run();
