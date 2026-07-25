const fs = require('fs');
const content = fs.readFileSync('frontend/lib/api.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('fetchWithFallback') || line.includes('getAnimeCharacters') || line.includes('fetchAniListCharactersFallback')) {
    console.log(`${i+1}: ${line}`);
  }
});
