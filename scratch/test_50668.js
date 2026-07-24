async function testID50668() {
  console.log("==================================================");
  console.log("🚀 TESTING ANIME ID 50668 (DIRECT FETCH)");
  console.log("==================================================\n");

  const id = 50668;

  // 1. Query Jikan for ID 50668
  console.log("1. Querying Jikan API https://api.jikan.moe/v4/anime/50668/full ...");
  const jikanStart = Date.now();
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/50668/full`);
    console.log(`   -> Jikan Status: ${res.status} ${res.statusText} in ${Date.now() - jikanStart}ms`);
    if (res.ok) {
      const data = await res.json();
      console.log(`      Title: ${data.data?.title_english || data.data?.title}`);
    }
  } catch (err) {
    console.error(`   -> Jikan Error: ${err.message}`);
  }

  // 2. Query AniList by id = 50668
  console.log("\n2. Querying AniList GraphQL with media(id: 50668) ...");
  const aniStart = Date.now();
  const aniQueryById = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title { romaji english }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { romaji english }
              format
              type
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: aniQueryById, variables: { id } })
    });
    console.log(`   -> AniList by ID Status: ${res.status} in ${Date.now() - aniStart}ms`);
    const data = await res.json();
    console.log(`      AniList Media (id: 50668):`, data.data?.Media ? data.data.Media.title : 'NULL / NOT FOUND');
    if (data.errors) {
      console.log(`      AniList Errors:`, JSON.stringify(data.errors));
    }
  } catch (err) {
    console.error(`   -> AniList ID Error: ${err.message}`);
  }

  // 3. Query AniList by idMal = 50668
  console.log("\n3. Querying AniList GraphQL with media(idMal: 50668) ...");
  const malStart = Date.now();
  const aniQueryByMal = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
        idMal
        title { romaji english }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { romaji english }
              format
              type
              startDate { year }
              coverImage { extraLarge large }
            }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: aniQueryByMal, variables: { idMal: id } })
    });
    console.log(`   -> AniList by idMal Status: ${res.status} in ${Date.now() - malStart}ms`);
    const data = await res.json();
    console.log(`      AniList Media (idMal: 50668):`, data.data?.Media ? data.data.Media.title : 'NULL / NOT FOUND');
    if (data.data?.Media) {
      console.log(`      AniList ID is: ${data.data.Media.id}`);
      console.log(`      Relations count: ${data.data.Media.relations?.edges?.length || 0}`);
      console.log(`      Relations sample:`, JSON.stringify(data.data.Media.relations?.edges?.slice(0, 3), null, 2));
    }
  } catch (err) {
    console.error(`   -> AniList idMal Error: ${err.message}`);
  }

  console.log("\n==================================================");
}

testID50668().catch(console.error);
