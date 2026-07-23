async function debug62076Direct() {
  console.log("Debugging ID 62076 via API...");
  
  // Jikan full
  const jikanRes = await fetch('https://api.jikan.moe/v4/anime/62076/full');
  console.log("Jikan /anime/62076/full status:", jikanRes.status);

  // AniList
  const query = `
    query ($id: Int) {
      Media(idMal: $id, type: ANIME) {
        id idMal title { english romaji native } coverImage { extraLarge large } bannerImage description
      }
    }
  `;
  const aniRes = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: 62076 } })
  });
  const aniData = await aniRes.json();
  console.log("AniList status:", aniRes.status, "Media:", aniData.data?.Media ? aniData.data.Media.title : "NULL");
}

debug62076Direct().catch(console.error);
