const fs = require('fs');
const path = require('path');

const fileToDelete = path.join(__dirname, '../frontend/app/genre/page.tsx');
const dirToDelete = path.join(__dirname, '../frontend/app/genre');

if (fs.existsSync(fileToDelete)) {
  fs.unlinkSync(fileToDelete);
  console.log("Deleted file:", fileToDelete);
}

if (fs.existsSync(dirToDelete)) {
  fs.rmdirSync(dirToDelete);
  console.log("Deleted directory:", dirToDelete);
}

console.log("Dead /genre route cleanup completed.");
