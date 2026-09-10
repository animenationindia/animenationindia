const fs = require('fs');

async function run() {
  const query = `
    query {
      Page(page: 1, perPage: 50) {
        media(type: ANIME, sort: POPULARITY_DESC, countryOfOrigin: "JP", isAdult: false) {
          id
          title {
            romaji
            english
          }
          trailer {
            id
            site
          }
        }
      }
    }
  `;
  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const json = await res.json();
  const list = (json.data?.Page?.media || []).filter(m => m.trailer && m.trailer.site === 'youtube');
  
  const valid = [];
  for (const m of list) {
    try {
      const tRes = await fetch(`https://i.ytimg.com/vi/${m.trailer.id}/hqdefault.jpg`);
      if (tRes.status === 200) {
        valid.push({
          id: m.id,
          title: m.title,
          trailer: {
            id: m.trailer.id,
            site: 'youtube',
            thumbnail: `https://i.ytimg.com/vi/${m.trailer.id}/hqdefault.jpg`
          }
        });
        console.log('VALID:', m.title.english || m.title.romaji, m.trailer.id);
      }
    } catch (e) {
      console.error(e.message);
    }
  }
  fs.writeFileSync('scratch/valid_trailers.json', JSON.stringify(valid, null, 2));
}

run();
