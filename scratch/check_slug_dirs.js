const fs = require('fs');
const path = require('path');

['app/genre', 'app/genres', 'app/browse/genres'].forEach(rel => {
  const p = path.join(__dirname, '../frontend', rel);
  if (fs.existsSync(p)) {
    console.log(`[${rel}] contents:`, fs.readdirSync(p));
  } else {
    console.log(`[${rel}] does NOT exist`);
  }
});
