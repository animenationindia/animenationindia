async function testAniListFallbacks() {
  console.log("==================================================");
  console.log("🚀 TESTING ANILIST FALLBACK QUERIES");
  console.log("==================================================\n");

  const queryChar = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        characters(sort: [ROLE, RELEVANCE], perPage: 12) {
          edges {
            role
            node {
              id
              name { full romaji native }
              image { large medium }
            }
            voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
              id
              name { full romaji }
              image { large medium }
            }
          }
        }
      }
    }
  `;

  console.log("1. Querying AniList Characters for AniList ID 143103 (Witch on the Holy Night)...");
  try {
    const res1 = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryChar, variables: { id: 143103 } })
    });
    console.log(`   -> Status: ${res1.status}`);
    const data1 = await res1.json();
    const edges = data1.data?.Media?.characters?.edges || [];
    console.log(`   -> Characters count: ${edges.length}`);
    if (edges.length > 0) {
      const sample = edges[0];
      console.log(`   -> Sample char: name = ${sample.node?.name?.full}, role = ${sample.role}, VA = ${sample.voiceActors?.[0]?.name?.full}`);
    }
  } catch (err) {
    console.error(`   -> Error: ${err.message}`);
  }

  const queryRec = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        recommendations(perPage: 12, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              averageScore
            }
          }
        }
      }
    }
  `;

  console.log("\n2. Querying AniList Recommendations for AniList ID 143103...");
  try {
    const res2 = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryRec, variables: { id: 143103 } })
    });
    console.log(`   -> Status: ${res2.status}`);
    const data2 = await res2.json();
    const recs = data2.data?.Media?.recommendations?.nodes || [];
    console.log(`   -> Recommendations count: ${recs.length}`);
    if (recs.length > 0) {
      const sample = recs[0].mediaRecommendation;
      console.log(`   -> Sample rec: title = ${sample?.title?.english || sample?.title?.romaji}, MAL ID = ${sample?.idMal}`);
    }
  } catch (err) {
    console.error(`   -> Error: ${err.message}`);
  }

  console.log("\n==================================================");
}

testAniListFallbacks().catch(console.error);
