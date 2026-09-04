import { fetchAniList, getTopAiringAnimeAniList } from '../../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {};

  try {
    const t0 = Date.now();
    const rawRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        query: 'query { Page(page: 1, perPage: 2) { media(type: ANIME) { id title { romaji } } } }'
      })
    });
    diagnostics.rawFetchStatus = rawRes.status;
    diagnostics.rawFetchTime = `${Date.now() - t0}ms`;
    const rawJson = await rawRes.json();
    diagnostics.rawFetchCount = rawJson?.data?.Page?.media?.length || 0;
  } catch (err: any) {
    diagnostics.rawFetchError = err.message;
  }

  try {
    const t1 = Date.now();
    const data = await fetchAniList('query { Page(page: 1, perPage: 2) { media(type: ANIME) { id title { romaji } } } }');
    diagnostics.fetchAniListTime = `${Date.now() - t1}ms`;
    diagnostics.fetchAniListCount = data?.data?.Page?.media?.length || 0;
  } catch (err: any) {
    diagnostics.fetchAniListError = err.message;
  }

  try {
    const t2 = Date.now();
    const heroList = await getTopAiringAnimeAniList();
    diagnostics.heroListTime = `${Date.now() - t2}ms`;
    diagnostics.heroListCount = heroList?.length || 0;
  } catch (err: any) {
    diagnostics.heroListError = err.message;
  }

  return Response.json(diagnostics);
}
