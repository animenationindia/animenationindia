import { fetchAniList, getTopAiringAnimeAniList } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {};

  // 1. Direct AniList check
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: 'query { Page(page: 1, perPage: 1) { media(type: ANIME) { id } } }' })
    });
    diagnostics.directAniListStatus = res.status;
  } catch (err: any) {
    diagnostics.directAniListError = err.message;
  }

  // 2. Render Proxy check
  try {
    const res = await fetch('https://animenationindia.onrender.com/api/anilist/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query: 'query { Page(page: 1, perPage: 1) { media(type: ANIME) { id title { romaji } } } }' })
    });
    diagnostics.renderProxyStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      diagnostics.renderProxyAnime = data?.data?.Page?.media?.[0]?.title?.romaji || null;
    }
  } catch (err: any) {
    diagnostics.renderProxyError = err.message;
  }

  // 3. High-level fetchAniList check
  try {
    const data = await fetchAniList('query { Page(page: 1, perPage: 2) { media(type: ANIME) { id title { romaji } } } }');
    diagnostics.fetchAniListCount = data?.data?.Page?.media?.length || 0;
  } catch (err: any) {
    diagnostics.fetchAniListError = err.message;
  }

  // 4. Hero List check
  try {
    const heroList = await getTopAiringAnimeAniList();
    diagnostics.heroListCount = heroList?.length || 0;
  } catch (err: any) {
    diagnostics.heroListError = err.message;
  }

  return Response.json(diagnostics);
}
