async function testFallbackSimulation() {
  console.log("==================================================");
  console.log("🚀 TESTING MULTI-TIER FALLBACK CHAIN");
  console.log("==================================================\n");

  const testIDs = [
    { malId: 50668, name: 'Witch on the Holy Night' },
    { malId: 21, name: 'One Piece' },
    { malId: 58505, name: 'Demon Slayer Hashira' },
    { malId: 1535, name: 'Death Note' },
    { malId: 30276, name: 'One Punch Man' }
  ];

  for (const item of testIDs) {
    console.log(`\n--- Testing ID ${item.malId} (${item.name}) ---`);

    // 1. Simulate Kitsu fallback directly
    const kitsuStart = Date.now();
    try {
      const res = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${item.malId}&include=item`, {
        headers: { 'Accept': 'application/vnd.api+json' }
      });
      const data = await res.json();
      const kitsuAnime = data.included?.find(i => i.type === 'anime');
      const kitsuId = kitsuAnime ? kitsuAnime.id : null;
      console.log(`   [Kitsu Mapping] Status: ${res.status} in ${Date.now() - kitsuStart}ms | Kitsu ID: ${kitsuId || 'NOT FOUND'}`);

      if (kitsuId) {
        const charStart = Date.now();
        const charRes = await fetch(`https://kitsu.io/api/edge/anime/${kitsuId}/characters?include=character&page[limit]=6`, {
          headers: { 'Accept': 'application/vnd.api+json' }
        });
        const charData = await charRes.json();
        console.log(`   [Kitsu Characters] Status: ${charRes.status} in ${Date.now() - charStart}ms | Characters count: ${charData.included?.length || 0}`);
      }
    } catch (err) {
      console.error(`   [Kitsu Error]: ${err.message}`);
    }

    // 2. Simulate AniList fallback directly
    const aniStart = Date.now();
    try {
      const queryChar = `
        query ($idMal: Int) {
          Media(idMal: $idMal, type: ANIME) {
            id
            characters(perPage: 6) {
              edges {
                role
                node { name { full } }
              }
            }
          }
        }
      `;
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryChar, variables: { idMal: item.malId } })
      });
      const data = await res.json();
      const count = data.data?.Media?.characters?.edges?.length || 0;
      console.log(`   [AniList Characters Fallback] Status: ${res.status} in ${Date.now() - aniStart}ms | Count: ${count}`);
    } catch (err) {
      console.error(`   [AniList Error]: ${err.message}`);
    }
  }

  console.log("\n==================================================");
}

testFallbackSimulation().catch(console.error);
