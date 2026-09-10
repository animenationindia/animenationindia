const fs = require('node:fs');
const path = require('node:path');

const openNextDir = path.join(__dirname, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');
const workerSrc = path.join(openNextDir, 'worker.js');
const workerDest = path.join(assetsDir, '_worker.js');
const routesDest = path.join(assetsDir, '_routes.json');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

if (fs.existsSync(workerSrc)) {
  fs.copyFileSync(workerSrc, workerDest);
  console.log('✅ Copied worker.js -> assets/_worker.js (Cloudflare Pages Advanced Worker)');
} else {
  console.warn('⚠️ .open-next/worker.js not found');
}

// Generate Cloudflare Pages _routes.json for optimal static bypass & SSR routing
const routesConfig = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/images/*",
    "/icons/*",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/ani-logo.png",
    "/placeholder.png",
    "/placeholder-poster.png",
    "/sleeping_cat.png"
  ]
};

fs.writeFileSync(routesDest, JSON.stringify(routesConfig, null, 2), 'utf8');
console.log('✅ Generated assets/_routes.json for Cloudflare Pages CDN asset offloading');
