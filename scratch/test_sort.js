async function testRelationsSort() {
  console.log("Testing relations sorting for MAL ID 50668...");

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
              startDate { year month day }
              coverImage { extraLarge large }
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: aniQueryByMal, variables: { idMal: 50668 } })
  });

  const data = await res.json();
  const extraInfo = data.data?.Media;
  console.log("AniList Title:", extraInfo?.title);
  console.log("Relations edges count:", extraInfo?.relations?.edges?.length);

  try {
    const sortedRelations = extraInfo?.relations?.edges 
      ? [...extraInfo.relations.edges].sort((a, b) => {
          const getScore = (node) => {
            if (!node || !node.startDate) return 0;
            return (node.startDate.year || 0) * 10000 + (node.startDate.month || 0) * 100 + (node.startDate.day || 0);
          };
          return getScore(b ? b.node : null) - getScore(a ? a.node : null);
        })
      : [];
    console.log("Sorted relations successfully:", sortedRelations.length);
    sortedRelations.forEach((edge, idx) => {
      console.log(`Relation ${idx}: node exists? ${!!edge.node}, title: ${edge.node?.title?.romaji || edge.node?.title?.english}`);
    });
  } catch (err) {
    console.error("CRASH IN SORT:", err);
  }
}

testRelationsSort().catch(console.error);
