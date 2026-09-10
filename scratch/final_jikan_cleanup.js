const fs = require('fs');

let code = fs.readFileSync('frontend/lib/api.ts', 'utf8');

// 1. Remove jikan fallbacks in getTodayReleasesAniList (around lines 612-675)
code = code.replace(
  /\/\/ Fallback 1: Jikan \/schedules for current day of week[\s\S]*?\/\/ Fallback 2: Jikan \/seasons\/now[\s\S]*?airingSchedules: jikanNow\.data\.map\(\(item: any, idx: number\) => \(\{[\s\S]*?\}\)\s*\}\s*\}\s*\} catch \{\}/,
  ``
);

// 2. Remove jikan fallback in getTopAiringAnimeAniList (around line 748)
code = code.replace(
  /\/\/ Resilient Fallback 1: Jikan \/seasons\/now[\s\S]*?airingSchedules: jikanData\.data\.map\(\(item: any\) => \(\{[\s\S]*?\}\)\s*\}\s*\}\s*\} catch \{\}/,
  ``
);

// 3. Remove jikan fallback in getAnimeDetailsAniList
code = code.replace(
  /\/\/ 4\. Jikan Fallback\s*try \{\s*const res = await fetchJikan\(`\/anime\/\$\{id\}\/full`\);[\s\S]*?if \(res\?\.data && isSafeContent\(res\.data\)\) return res\.data;\s*\} catch \{\}/,
  ``
);

code = code.replace(
  /try \{\s*const jikanRes = await fetchJikan\(`\/anime\/\$\{extra\.idMal\}\/full`\);[\s\S]*?if \(jikanRes\?\.data && isSafeContent\(jikanRes\.data\)\) return jikanRes\.data;\s*\} catch \{\}/,
  ``
);

// 4. Remove duplicate broken blocks in getCharacterDetailsJikan and getPersonDetailsJikan
code = code.replace(
  /const numId = Number\(strId\);\s*\/\/ 1\. Try Jikan API \(primary for MAL character IDs\)[\s\S]*?return null;\s*\}\s*export async function getPersonDetailsJikan/,
  `export async function getPersonDetailsJikan`
);

code = code.replace(
  /export async function getPersonDetailsJikan[\s\S]*?\/\/ Global Safe Content Verifier/,
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
}

// Global Safe Content Verifier`
);

// 5. Remove Jikan in reviews
code = code.replace(
  /try \{\s*const data = await fetchJikan\(`\/anime\/\$\{numId\}\/reviews`, GLOBAL_CACHE_TIME, 5000\);[\s\S]*?console\.warn\(`\[getAnimeReviews\] Failed for \$\{malId\}:`, err\?\.message\);\s*\}\s*return \[\];/,
  `return [];`
);

fs.writeFileSync('frontend/lib/api.ts', code);
console.log('Final Jikan cleanup done!');
