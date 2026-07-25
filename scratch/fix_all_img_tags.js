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

  // Fix 1: Fix stringified src attributes like src={"something"} -> src={something}
  // Matches src={"..."} where inner content is JS expression
  code = code.replace(/src=\{"([^"]+)"\}/g, (match, expr) => {
    // If expr is a static URL string like "/placeholder-poster.png", make it src="/placeholder-poster.png"
    if (expr.startsWith('/') || expr.startsWith('http')) {
      return `src="${expr}"`;
    }
    // Otherwise it's a JS expression variable like a.coverImage?.large or cover
    return `src={${expr}}`;
  });

  // Fix 2: Fix unescaped /* eslint-disable-next-line */ comments in JSX
  // Change /* eslint-disable-next-line ... */ to {/* eslint-disable-next-line ... */}
  // Handle cases where it's not already wrapped in {}
  code = code.replace(/(?<!\{)\/\*\s*eslint-disable-next-line[^*]*\*\/(?!\})/g, (match) => {
    return `{${match}}`;
  });

  // Fix 3: Also fix alt={"something"} -> alt={something}
  code = code.replace(/alt=\{"([^"]+)"\}/g, (match, expr) => {
    if (/^[a-zA-Z0-9_\?\.\s\|\|]+$/.test(expr) && !expr.startsWith('"')) {
      return `alt={${expr}}`;
    }
    return match;
  });

  fs.writeFileSync(fullPath, code, 'utf8');
  console.log(`FIXED: ${relPath}`);
});

console.log('Done fixing all img tags and eslint comments.');
