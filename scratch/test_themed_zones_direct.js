const https = require('https');

function fetchAniList(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query, variables });
    const req = https.request('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log("==================================================================================");
  console.log("🔍 TESTING THEMED ZONE GRAPHQL ENDPOINTS DIRECTLY");
  console.log("==================================================================================\n");

  const queries = [
    { name: "Sports Zone (genre: Sports)", query: `query { Page(page: 1, perPage: 20) { media(genre_in: ["Sports"], sort: POPULARITY_DESC, type: ANIME, isAdult: false) { id idMal title { romaji english } coverImage { extraLarge large } } } }` },
    { name: "Fantasy Worlds (genre: Fantasy)", query: `query { Page(page: 1, perPage: 20) { media(genre_in: ["Fantasy"], sort: POPULARITY_DESC, type: ANIME, isAdult: false) { id idMal title { romaji english } coverImage { extraLarge large } } } }` },
    { name: "Supernatural & Mystery (genres: Mystery, Supernatural)", query: `query { Page(page: 1, perPage: 20) { media(genre_in: ["Mystery", "Supernatural"], sort: POPULARITY_DESC, type: ANIME, isAdult: false) { id idMal title { romaji english } coverImage { extraLarge large } } } }` },
    { name: "Sci-Fi & Cyberpunk (genre: Sci-Fi)", query: `query { Page(page: 1, perPage: 20) { media(genre_in: ["Sci-Fi"], sort: POPULARITY_DESC, type: ANIME, isAdult: false) { id idMal title { romaji english } coverImage { extraLarge large } } } }` },
    { name: "Evergreen Classics (before 2012)", query: `query { Page(page: 1, perPage: 25) { media(seasonYear_lesser: 2012, sort: SCORE_DESC, type: ANIME, isAdult: false) { id idMal title { romaji english } coverImage { extraLarge large } } } }` },
    { name: "Similar to MHA (Media 21459)", query: `query { Media(id: 21459, type: ANIME) { recommendations(page: 1, perPage: 20, sort: RATING_DESC) { nodes { mediaRecommendation { id idMal title { romaji english } coverImage { extraLarge large } } } } } }` },
    { name: "Hidden Gems (Curated IDs)", query: `query { Page(page: 1, perPage: 20) { media(id_in: [21519, 106286, 145904, 1689], type: ANIME) { id idMal title { romaji english } coverImage { extraLarge large } } } }` },
    { name: "Similar to SAO (Media 11757)", query: `query { Media(id: 11757, type: ANIME) { recommendations(page: 1, perPage: 20, sort: RATING_DESC) { nodes { mediaRecommendation { id idMal title { romaji english } coverImage { extraLarge large } } } } } }` }
  ];

  for (const q of queries) {
    const t0 = Date.now();
    try {
      const data = await fetchAniList(q.query);
      const duration = Date.now() - t0;
      const media = data?.data?.Page?.media || data?.data?.Media?.recommendations?.nodes || [];
      console.log(`[${q.name.padEnd(45)}] -> Status: OK (${duration}ms) | Items: ${media.length}`);
    } catch (e) {
      console.error(`[${q.name.padEnd(45)}] -> ERROR: ${e.message}`);
    }
  }

  console.log("\n==================================================================================");
}

run();
