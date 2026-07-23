async function testApiDirect() {
  console.log("=== Direct Verification of ExtraLarge Field in AniList & Jikan ===");

  // 1. AniList test query
  const query = `
    query {
      Page(page: 1, perPage: 2) {
        media(sort: POPULARITY_DESC, type: ANIME) {
          title { english romaji }
          coverImage {
            extraLarge
            large
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
  const data = await res.json();
  console.log("\nAniList extraLarge Cover Image URLs:");
  data.data.Page.media.forEach(item => {
    console.log("Title:", item.title.english || item.title.romaji);
    console.log("  extraLarge:", item.coverImage.extraLarge);
    console.log("  large:     ", item.coverImage.large);
  });

  // 2. Jikan recommendations test
  const jikanRes = await fetch('https://api.jikan.moe/v4/anime/21/recommendations');
  const jikanData = await jikanRes.json();
  if (jikanData.data && jikanData.data[0]) {
    const rec = jikanData.data[0];
    console.log("\nJikan Recommendation Cover Image URLs:");
    console.log("Title:", rec.entry.title);
    console.log("  webp large:", rec.entry.images?.webp?.large_image_url);
    console.log("  jpg large: ", rec.entry.images?.jpg?.large_image_url);
  }
}

testApiDirect().catch(console.error);
