const {
  getSportsZoneAnimeAniList,
  getFantasyZoneAnimeAniList,
  getSupernaturalWorldAnimeAniList,
  getSciFiAnimeAniList,
  getEvergreenAnimeAniList,
  getSimilarToMHAAnimeAniList,
  getHiddenGemsAnimeAniList,
  getSimilarToSAOAnimeAniList
} = require('./frontend/lib/api');

async function testThemedZones() {
  console.log("==================================================================================");
  console.log("🔍 TESTING HOME PAGE THEMED ZONE API FUNCTIONS");
  console.log("==================================================================================\n");

  const zones = [
    { name: "Sports Zone", fn: getSportsZoneAnimeAniList },
    { name: "Fantasy Worlds", fn: getFantasyZoneAnimeAniList },
    { name: "Supernatural & Mystery", fn: getSupernaturalWorldAnimeAniList },
    { name: "Sci-Fi & Cyberpunk", fn: getSciFiAnimeAniList },
    { name: "Evergreen Classics", fn: getEvergreenAnimeAniList },
    { name: "Similar to MHA", fn: getSimilarToMHAAnimeAniList },
    { name: "Hidden Gems", fn: getHiddenGemsAnimeAniList },
    { name: "Similar to SAO", fn: getSimilarToSAOAnimeAniList }
  ];

  for (const zone of zones) {
    const t0 = Date.now();
    try {
      const data = await zone.fn();
      const duration = Date.now() - t0;
      console.log(`[${zone.name.padEnd(25)}] -> Status: OK (${duration}ms) | Items returned: ${Array.isArray(data) ? data.length : 0}`);
    } catch (err) {
      console.error(`[${zone.name.padEnd(25)}] -> ERROR: ${err.message}`);
    }
  }

  console.log("\n==================================================================================");
}

testThemedZones();
