const fs = require('fs');
const path = require('path');

const targetFiles = [
  'frontend/components/AnimeCard.tsx',
  'frontend/components/PersonCard.tsx',
  'frontend/components/Hero.tsx',
  'frontend/components/HomeTrendingBanner.tsx',
  'frontend/components/TrailerSlider.tsx',
  'frontend/components/LandingPageClient.tsx',
  'frontend/components/SearchPageClient.tsx',
  'frontend/components/NewEpisodesList.tsx',
  'frontend/components/HomeNewsSection.tsx',
  'frontend/components/HomeRecommendations.tsx',
  'frontend/components/HomeReviews.tsx',
  'frontend/components/HomeTopLists.tsx',
  'frontend/components/AnimeSearchFilters.tsx',
  'frontend/components/WatchPageContent.tsx',
  'frontend/components/NewsCards.tsx',
  'frontend/app/series/[id]/page.tsx',
  'frontend/app/manga/[id]/page.tsx',
  'frontend/app/character/[id]/page.tsx',
  'frontend/app/staff/[id]/page.tsx',
  'frontend/app/schedule/ScheduleList.tsx',
  'frontend/app/trailers/page.tsx',
  'frontend/app/watchlist/page.tsx',
  'frontend/app/news/[slug]/page.tsx',
  'frontend/app/home/page.tsx'
];

targetFiles.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;

  let code = fs.readFileSync(fullPath, 'utf8');

  // Remove any inline eslint comments (with or without JSX braces)
  code = code.replace(/\{\/\*\s*eslint-disable-next-line[^*]*\*\/\}\s*/g, '');
  code = code.replace(/\/\*\s*eslint-disable-next-line[^*]*\*\/\s*/g, '');

  // Add /* eslint-disable @next/next/no-img-element */ at top of file if not present
  if (!code.includes('/* eslint-disable @next/next/no-img-element */')) {
    code = `/* eslint-disable @next/next/no-img-element */\n` + code;
  }

  fs.writeFileSync(fullPath, code, 'utf8');
  console.log(`CLEANED: ${relPath}`);
});

console.log('Cleaned all inline eslint comments and added file-level eslint-disable.');
