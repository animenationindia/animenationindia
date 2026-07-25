const fs = require('fs');
const path = require('path');

function getAppRoutes(dir, baseRoute = '') {
  let routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDir = path.join(dir, entry.name);
      const subRoute = `${baseRoute}/${entry.name}`;
      if (fs.existsSync(path.join(subDir, 'page.tsx')) || fs.existsSync(path.join(subDir, 'page.jsx'))) {
        routes.push(subRoute);
      }
      routes = routes.concat(getAppRoutes(subDir, subRoute));
    }
  }
  return routes;
}

const appDir = path.join(__dirname, '../frontend/app');
const routes = getAppRoutes(appDir);
console.log("==================================================================================");
console.log("📌 FRONTEND ROUTE DIRECTORIES (TOTAL:", routes.length + 1, ")");
console.log("==================================================================================");
console.log("Route [/]");
routes.forEach(r => console.log(`Route [${r}]`));
