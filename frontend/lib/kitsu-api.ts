import { logError } from './logger';

const KITSU_API_URL = 'https://kitsu.io/api/edge';
const KITSU_TIMEOUT_MS = 2000; // 2 seconds tight timeout for Vercel 10s limit

const KITSU_HEADERS = {
  'Accept': 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json'
};

async function fetchKitsu(endpoint: string, timeoutMs = KITSU_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${KITSU_API_URL}${endpoint}`, {
      headers: KITSU_HEADERS,
      signal: controller.signal,
      next: { revalidate: 86400 } // 24 hours cache for static metadata
    });
    clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      console.warn(`Kitsu API timeout after ${timeoutMs}ms for ${endpoint}`);
    } else {
      logError('fetchKitsu', error);
    }
    return null;
  }
}

// 1. Fetch Kitsu Anime ID by MyAnimeList (MAL) ID
export async function fetchKitsuAnimeByMalId(malId: number): Promise<string | null> {
  if (!malId || isNaN(malId)) return null;

  try {
    const data = await fetchKitsu(`/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}&include=item`);
    if (!data || !data.included || data.included.length === 0) {
      return null;
    }
    const kitsuItem = data.included.find((item: any) => item.type === 'anime');
    return kitsuItem ? kitsuItem.id : null;
  } catch (error) {
    logError('fetchKitsuAnimeByMalId', error);
    return null;
  }
}

// 2. Fetch Kitsu Characters & normalize to Jikan character data shape
export async function fetchKitsuCharacters(malId: number): Promise<any[] | null> {
  try {
    const kitsuId = await fetchKitsuAnimeByMalId(malId);
    if (!kitsuId) return null;

    const data = await fetchKitsu(`/anime/${kitsuId}/characters?include=character&page[limit]=12`);
    if (!data || !data.data || !Array.isArray(data.data)) return null;

    const includedCharacters = new Map<string, any>();
    if (data.included && Array.isArray(data.included)) {
      data.included.forEach((inc: any) => {
        if (inc.type === 'characters') {
          includedCharacters.set(inc.id, inc.attributes);
        }
      });
    }

    const normalizedCharacters: any[] = [];

    data.data.forEach((rel: any) => {
      const charId = rel.relationships?.character?.data?.id;
      const charAttr = charId ? includedCharacters.get(charId) : null;

      if (charAttr && charAttr.name) {
        normalizedCharacters.push({
          role: rel.attributes?.role === 'main' ? 'Main' : 'Supporting',
          character: {
            mal_id: Number(charId) || 0,
            name: charAttr.name,
            images: {
              jpg: {
                image_url: charAttr.image?.original || charAttr.image?.medium || '/placeholder.png'
              }
            }
          }
        });
      }
    });

    return normalizedCharacters.length > 0 ? normalizedCharacters : null;
  } catch (error) {
    logError('fetchKitsuCharacters', error);
    return null;
  }
}
