async function testAniListCharQuery() {
  const queryChar = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        characters(perPage: 12) {
          edges {
            role
            node {
              id
              name { full userPreferred native }
              image { large medium }
            }
            voiceActors(language: JAPANESE) {
              id
              name { full userPreferred }
              image { large medium }
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: queryChar, variables: { id: 143103 } })
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Characters count:", data.data?.Media?.characters?.edges?.length);
  if (data.data?.Media?.characters?.edges?.length > 0) {
    const sample = data.data.Media.characters.edges[0];
    console.log("Sample character:", sample.node?.name?.full || sample.node?.name?.userPreferred, "| Role:", sample.role, "| VA:", sample.voiceActors?.[0]?.name?.full);
  }
}

testAniListCharQuery();
