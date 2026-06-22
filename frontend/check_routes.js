const http = require('http');

const routes = [
  '/series/16498', '/watch/16498'
];

async function checkRoutes() {
  for (const route of routes) {
    await new Promise((resolve) => {
      http.get(`http://localhost:3000${route}`, (res) => {
        console.log(`Route: ${route} - Status: ${res.statusCode}`);
        res.on('data', () => {}); // Consume data to free memory
        res.on('end', resolve);
      }).on('error', (err) => {
        console.log(`Route: ${route} - Error: ${err.message}`);
        resolve();
      });
    });
  }
}

checkRoutes();
