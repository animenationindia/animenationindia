const fs = require('fs');
const path = require('path');

const compDir = path.join(__dirname, '../frontend/components');
const files = fs.readdirSync(compDir);
files.filter(f => f.toLowerCase().includes('skeleton')).forEach(f => console.log(f));
