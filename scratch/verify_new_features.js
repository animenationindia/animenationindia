const http = require('http');

function fetchPath(p) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${p}`, res => {
      resolve(res.statusCode);
    }).on('error', () => resolve(500));
  });
}

async function run() {
  const routes = ['/browse', '/search', '/series/21', '/manga/13', '/watch/21'];
  for (const r of routes) {
    const status = await fetchPath(r);
    console.log(`Route [${r.padEnd(12)}] Status: ${status}`);
  }
}

run();
