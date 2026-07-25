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
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const query = `
  query ($ids: [Int]) {
    Page(page: 1, perPage: 25) {
      media(id_in: $ids, type: ANIME) {
        id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
      }
    }
  }
`;
const ids = [
  1889, 20665, 120, 21420, 2001, 269, 20755, 101190, 918, 5114, 
  9253, 11061, 1535, 1575, 4181, 1, 19, 4224, 20464, 21507, 
  205, 30, 9989, 8769, 270
];

fetchAniList(query, { ids }).then(data => {
  console.log("Evergreen Anime items returned:", data.data.Page.media.length);
}).catch(console.error);
