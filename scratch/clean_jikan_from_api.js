const fs = require('fs');

let code = fs.readFileSync('frontend/lib/api.ts', 'utf8');

// 1. Clean getJikanGenres and getJikanAnimeByGenre
code = code.replace(
  /export async function getJikanGenres\(\)[\s\S]*?return DEFAULT_GENRES_LIST;\s*\}/,
  `export async function getJikanGenres() {
  return DEFAULT_GENRES_LIST;
}`
);

code = code.replace(
  /export async function getJikanAnimeByGenre\([\s\S]*?return \{ media: \[\], pageInfo: \{ total: 0, currentPage: 1, lastPage: 1, hasNextPage: false \} \};\s*\}/,
  `export async function getJikanAnimeByGenre(genreId: string, page = 1) {
  try {
    const data = await getFilteredAnimeAniList({ genre: genreId, page, perPage: 24 });
    return {
      media: data || [],
      pageInfo: {
        total: 100,
        currentPage: page,
        lastPage: 5,
        hasNextPage: page < 5
      }
    };
  } catch (error) {
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  }
}`
);

// 2. Clean getTopCharactersJikan & getTopPeopleJikan
code = code.replace(
  /export async function getTopCharactersJikan\(\)[\s\S]*?return DEFAULT_TOP_CHARACTERS;\s*\}/,
  `export async function getTopCharactersJikan() {
  try {
    const chars = await getTopCharactersAniList(1);
    if (chars && chars.length > 0) return chars;
  } catch {}
  return DEFAULT_TOP_CHARACTERS;
}`
);

code = code.replace(
  /export async function getTopPeopleJikan\(\)[\s\S]*?return DEFAULT_TOP_PEOPLE;\s*\}/,
  `export async function getTopPeopleJikan() {
  try {
    const staff = await getTopStaffAniList(1);
    if (staff && staff.length > 0) return staff;
  } catch {}
  return DEFAULT_TOP_PEOPLE;
}`
);

// 3. Clean getCharacterDetailsJikan & getPersonDetailsJikan
code = code.replace(
  /export async function getCharacterDetailsJikan\([\s\S]*?return null;\s*\}/,
  `export async function getCharacterDetailsJikan(id: string | number) {
  const strId = String(id).trim().replace(/^al-/, '');
  const numId = Number(strId);
  if (!isNaN(numId) && numId > 0) {
    try {
      const aniChar = await fetchAniListCharacter(numId);
      if (aniChar) return aniChar;
    } catch {}
    if (TOP_CHARACTERS_CACHE[numId]) return TOP_CHARACTERS_CACHE[numId];
  }
  return null;
}`
);

code = code.replace(
  /export async function getPersonDetailsJikan\([\s\S]*?return null;\s*\}/,
  `export async function getPersonDetailsJikan(id: string | number) {
  const strId = String(id).trim().replace(/^al-/, '');
  const numId = Number(strId);
  if (!isNaN(numId) && numId > 0) {
    try {
      const aniStaff = await fetchAniListStaff(numId);
      if (aniStaff) return aniStaff;
    } catch {}
    if (TOP_STAFF_CACHE[numId]) return TOP_STAFF_CACHE[numId];
  }
  return null;
}`
);

// 4. Clean searchMangaJikan
code = code.replace(
  /export async function searchMangaJikan\([\s\S]*?console\.error\("Error in searchMangaJikan:", error\);\s*return \{ media: \[\], pageInfo: \{ total: 0, currentPage: 1, lastPage: 1, hasNextPage: false \} \};\s*\}/,
  `export async function searchMangaJikan(
  queryText: string, 
  page = 1, 
  type = '', 
  genre = '', 
  sort = 'popular',
  status = '',
  year: string | number = ''
) {
  try {
    const aniResult = await searchMangaAniList(queryText, page, type, genre, sort, status, year);
    if (aniResult && aniResult.media && aniResult.media.length > 0) {
      return aniResult;
    }
  } catch (error) {
    console.warn('[AniList Manga Search Fail]:', error);
  }

  try {
    const bffResult = await searchMangaBFF(queryText, page, 24);
    if (bffResult && bffResult.media && bffResult.media.length > 0) {
      return bffResult;
    }
  } catch (e: any) {
    console.warn('[BFF Manga Fallback Fail]:', e?.message);
  }

  return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
}`
);

// 5. Clean Manga fallbacks in getMangaDetails, getMangaCharacters, getMangaRecommendations
code = code.replace(
  /\/\/ 4\. Try Jikan Fallback[\s\S]*?MANGA_DETAILS_CACHE\.set\(strId, mangaData\);\s*return mangaData;\s*\}\s*\} catch \{\}/,
  `// AniList is the authoritative manga database`
);

code = code.replace(
  /\/\/ 2\. Fallback to Jikan API\s*try \{\s*const data = await fetchJikan\(`\/manga\/\$\{id\}\/characters`[\s\S]*?return \[\];\s*\}/,
  `return [];`
);

code = code.replace(
  /\/\/ 2\. Fallback to Jikan API\s*try \{\s*const data = await fetchJikan\(`\/manga\/\$\{id\}\/recommendations`[\s\S]*?return \[\];\s*\}/,
  `return [];`
);

// 6. Clean Jikan Airing Schedule / Today Releases fallbacks
code = code.replace(
  /\/\/ Fallback 2: Direct Jikan Airing Schedules[\s\S]*?\}\);[\s\S]*?\}\s*\} catch \{\}/,
  `}`
);

code = code.replace(
  /\/\/ Fallback 1: Jikan \/schedules for current day of week[\s\S]*?airingSchedules: jikanNow\.data\.map\(\(item: any, idx: number\) => \(\{[\s\S]*?\}\)\s*\}\s*\}\s*\} catch \{\}/,
  `}`
);

code = code.replace(
  /\/\/ Resilient Fallback 1: Jikan \/seasons\/now[\s\S]*?airingSchedules: jikanData\.data\.map\(\(item: any\) => \(\{[\s\S]*?\}\)\s*\}\s*\}\s*\} catch \{\}/,
  `}`
);

// 7. Clean Jikan Recommendations fallback
code = code.replace(
  /\{\s*name: 'Jikan Recommendations \(Tertiary Fallback\)',\s*fn: async \(\) => \{[\s\S]*?\}\s*\}\s*\];/,
  `];`
);

// 8. Clean Jikan Top Anime fallback
code = code.replace(
  /\/\/ Backup: Jikan \/top\/anime\?filter=bypopularity[\s\S]*?return jikanData\.data\.map\(formatToAniListMedia\)\.filter\(Boolean\);\s*\}\s*\} catch \{\}/,
  `try {
    const malData = await getOfficialMALRankings('bypopularity', limit);
    if (malData && malData.length > 0) return malData;
  } catch {}`
);

// 9. Clean Jikan Anime Details / Characters / Episodes fallbacks
code = code.replace(
  /\/\/ 4\. Jikan Fallback[\s\S]*?if \(jikanRes\?\.data && isSafeContent\(jikanRes\.data\)\) return jikanRes\.data;\s*\}\s*\}\s*\} catch \{\}/,
  `}`
);

code = code.replace(
  /name: 'Jikan Characters \(Secondary Fallback\)',\s*fn: async \(\) => \{[\s\S]*?\}\s*\}\s*\];/,
  `];`
);

code = code.replace(
  /\/\/ ৫\.১ Episodes \(Jikan\)[\s\S]*?const res = await fetchJikan\(`\/anime\/\$\{id\}\/episodes`\);[\s\S]*?\}\s*\} catch \{\}/,
  `}`
);

// 10. Clean Reviews
code = code.replace(
  /const data = await fetchJikan\(`\/anime\/\$\{numId\}\/reviews`, GLOBAL_CACHE_TIME, 5000\);[\s\S]*?return cleanReviews;/,
  `return [];`
);

fs.writeFileSync('frontend/lib/api.ts', code);
console.log('Successfully cleaned Jikan from frontend/lib/api.ts!');
