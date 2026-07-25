const fs = require('fs');
const path = require('path');

const targetFiles = [
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
  'frontend/app/manga/[id]/page.tsx',
  'frontend/app/character/[id]/page.tsx',
  'frontend/app/staff/[id]/page.tsx',
  'frontend/app/schedule/ScheduleList.tsx',
  'frontend/app/trailers/page.tsx',
  'frontend/app/watchlist/page.tsx',
  'frontend/app/news/[slug]/page.tsx',
  'frontend/app/home/page.tsx',
  'frontend/app/forums/page.tsx',
  'frontend/app/forums/general/page.tsx',
  'frontend/app/forums/manga-novels/page.tsx',
  'frontend/app/forums/trending/page.tsx'
];

let modifiedCount = 0;

targetFiles.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;

  let code = fs.readFileSync(fullPath, 'utf8');
  const originalCode = code;

  // Replace <Image with <img and remove next/image specific props like fill, priority, quality, sizes, unoptimized
  // Replace fill with className="absolute inset-0 w-full h-full object-cover" if fill was present
  code = code.replace(/<Image\b([\s\S]*?)(\/>|><\/Image>)/g, (match, props) => {
    let hasFill = props.includes('fill');
    let hasPriority = props.includes('priority');
    let srcMatch = props.match(/src=\{([^}]+)\}/) || props.match(/src="([^"]+)"/);
    let altMatch = props.match(/alt=\{([^}]+)\}/) || props.match(/alt="([^"]+)"/);
    let classMatch = props.match(/className=\{([^}]+)\}/) || props.match(/className="([^"]+)"/);
    let widthMatch = props.match(/width=\{([^}]+)\}/) || props.match(/width="([^"]+)"/);
    let heightMatch = props.match(/height=\{([^}]+)\}/) || props.match(/height="([^"]+)"/);

    let src = srcMatch ? (srcMatch[1].startsWith('{') ? srcMatch[1] : `"${srcMatch[1]}"`) : '""';
    let alt = altMatch ? (altMatch[1].startsWith('{') ? altMatch[1] : `"${altMatch[1]}"`) : '""';
    let classVal = classMatch ? classMatch[1].replace(/^["']|["']$/g, '') : '';
    
    // Check if src is local logo/icon
    if (src.includes('/logo.png') || src.includes('/ani-logo.png') || src.includes('/sleeping_cat.png')) {
      return match; // Keep Next.js Image for local logos
    }

    if (hasFill) {
      if (!classVal.includes('absolute')) {
        classVal = `absolute inset-0 w-full h-full ${classVal}`.trim();
      }
    }

    let loadingAttr = hasPriority ? 'loading="eager" fetchPriority="high"' : 'loading="lazy"';
    let dimAttrs = '';
    if (widthMatch) dimAttrs += ` width={${widthMatch[1]}}`;
    if (heightMatch) dimAttrs += ` height={${heightMatch[1]}}`;

    return `/* eslint-disable-next-line @next/next/no-img-element */\n<img src={${src}} alt={${alt}} ${loadingAttr}${dimAttrs} className="${classVal}" />`;
  });

  if (code !== originalCode) {
    // Remove unused import Image from 'next/image'; if no <Image remains
    if (!code.includes('<Image')) {
      code = code.replace(/import\s+Image\s+from\s+['"]next\/image['"];?\r?\n?/g, '');
    }
    fs.writeFileSync(fullPath, code, 'utf8');
    console.log(`✅ Converted Image -> img in: ${relPath}`);
    modifiedCount++;
  }
});

console.log(`\nDone! Converted ${modifiedCount} files.`);
