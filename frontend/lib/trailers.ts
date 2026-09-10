/* eslint-disable @typescript-eslint/no-explicit-any */
import { logError } from './logger';

export interface TrailerItem {
  id: number | string;
  title: {
    romaji?: string;
    english?: string;
  };
  trailer: {
    id: string;
    site: string;
    thumbnail?: string;
  };
  status?: string;
  coverImage?: {
    large?: string;
    medium?: string;
  };
  genres?: string[];
  score?: number;
}

const trailerMemoryCache = new Map<string, { data: TrailerItem[]; timestamp: number }>();
const inFlightTrailerPromises = new Map<string, Promise<TrailerItem[]>>();
const TRAILER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes memory cache for live freshness

export const VERIFIED_CURATED_TRAILERS: TrailerItem[] = [
  {
    id: 38000,
    title: { english: 'Demon Slayer: Kimetsu no Yaiba - Infinity Castle Arc', romaji: 'Kimetsu no Yaiba: Mugen Jou-hen' },
    trailer: { id: 'VQGCKyvzIM4', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/VQGCKyvzIM4/hqdefault.jpg' },
    status: 'NOT_YET_RELEASED'
  },
  {
    id: 16498,
    title: { english: 'Attack on Titan Final Season', romaji: 'Shingeki no Kyojin: The Final Season' },
    trailer: { id: 'M_OauHnAFc8', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/M_OauHnAFc8/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 40748,
    title: { english: 'Jujutsu Kaisen Season 2 (Shibuya Incident)', romaji: 'Jujutsu Kaisen 2nd Season' },
    trailer: { id: 'O6qVieflwqs', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/O6qVieflwqs/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 41467,
    title: { english: 'Bleach: Thousand-Year Blood War - The Conflict', romaji: 'Bleach: Sennen Kessen-hen' },
    trailer: { id: 'e8YBesRKq_U', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/e8YBesRKq_U/hqdefault.jpg' },
    status: 'RELEASING'
  },
  {
    id: 44511,
    title: { english: 'Chainsaw Man Movie: Reze Arc', romaji: 'Chainsaw Man: Reze-hen' },
    trailer: { id: 'v4yLeNt-kCU', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/v4yLeNt-kCU/hqdefault.jpg' },
    status: 'NOT_YET_RELEASED'
  },
  {
    id: 50265,
    title: { english: 'Spy x Family Code: White', romaji: 'Spy x Family Movie' },
    trailer: { id: 'ofXigq9aIpo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/ofXigq9aIpo/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 5114,
    title: { english: 'Fullmetal Alchemist: Brotherhood', romaji: 'Hagane no Renkinjutsushi' },
    trailer: { id: 'yb2R1l0O9Zs', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/yb2R1l0O9Zs/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 21087,
    title: { english: 'One Punch Man', romaji: 'One Punch Man' },
    trailer: { id: 'tMblzsXwAKo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/tMblzsXwAKo/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 38408,
    title: { english: 'My Hero Academia Season 3', romaji: 'Boku no Hero Academia 3rd Season' },
    trailer: { id: 'JezE6iZUWxo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/JezE6iZUWxo/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 31964,
    title: { english: 'My Hero Academia', romaji: 'Boku no Hero Academia' },
    trailer: { id: 'D5fYOnwYkj4', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/D5fYOnwYkj4/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 1535,
    title: { english: 'Death Note', romaji: 'Death Note' },
    trailer: { id: 'NlJZ-YgAt-c', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/NlJZ-YgAt-c/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 32281,
    title: { english: 'Your Name.', romaji: 'Kimi no Na wa.' },
    trailer: { id: '3KR8_igDs1Y', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/3KR8_igDs1Y/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 16498,
    title: { english: 'Attack on Titan Season 1', romaji: 'Shingeki no Kyojin' },
    trailer: { id: 'LHtdKWJdif4', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/LHtdKWJdif4/hqdefault.jpg' },
    status: 'FINISHED'
  }
];

export async function getLiveAnimeTrailers({
  filter = 'all',
  page = 1,
  limit = 20
}: {
  filter?: 'all' | 'airing' | 'upcoming';
  page?: number;
  limit?: number;
} = {}): Promise<TrailerItem[]> {
  const cacheKey = `trailers:${filter}:${page}:${limit}`;
  const cached = trailerMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < TRAILER_CACHE_TTL)) {
    return cached.data;
  }

  if (inFlightTrailerPromises.has(cacheKey)) {
    return inFlightTrailerPromises.get(cacheKey)!;
  }

  const execute = async (): Promise<TrailerItem[]> => {
    // 1. Tier 1: AniList GraphQL
    try {
      const statusFilter = filter === 'airing' ? ', status: RELEASING' : (filter === 'upcoming' ? ', status: NOT_YET_RELEASED' : '');
      const query = `
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            media(sort: TRENDING_DESC, type: ANIME, countryOfOrigin: "JP", isAdult: false${statusFilter}) {
              id
              title { romaji english }
              trailer { id site thumbnail }
              status
              coverImage { large medium }
            }
          }
        }
      `;
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables: { page, perPage: limit * 2 } }),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const json = await res.json();
        const media = json?.data?.Page?.media;
        if (Array.isArray(media)) {
          const valid = media
            .filter((a: any) => a.trailer && a.trailer.site === 'youtube' && a.trailer.id)
            .map((a: any) => ({
              id: a.id,
              title: {
                english: a.title?.english || a.title?.romaji,
                romaji: a.title?.romaji || a.title?.english,
              },
              trailer: {
                id: a.trailer.id,
                site: 'youtube',
                thumbnail: a.trailer.thumbnail || `https://i.ytimg.com/vi/${a.trailer.id}/hqdefault.jpg`,
              },
              status: a.status,
              coverImage: a.coverImage,
            }));

          if (valid.length > 0) {
            const finalData = valid.slice(0, limit);
            trailerMemoryCache.set(cacheKey, { data: finalData, timestamp: Date.now() });
            return finalData;
          }
        }
      }
    } catch (e: any) {
      logError('getLiveAnimeTrailers:AniList', e);
    }

    // 2. Tier 2: Kitsu Live API
    try {
      const kitsuStatus = filter === 'airing' ? 'filter[status]=current&' : (filter === 'upcoming' ? 'filter[status]=upcoming&' : '');
      const kitsuUrl = `https://kitsu.io/api/edge/anime?${kitsuStatus}sort=-userCount&page[limit]=20&page[offset]=${(page - 1) * 20}`;
      const res = await fetch(kitsuUrl, {
        headers: { 'Accept': 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const json = await res.json();
        const items = json?.data || [];
        const validKitsu: TrailerItem[] = items
          .filter((item: any) => item.attributes?.youtubeVideoId)
          .map((item: any) => ({
            id: item.id,
            title: {
              english: item.attributes.titles?.en || item.attributes.canonicalTitle,
              romaji: item.attributes.titles?.ja_jp || item.attributes.canonicalTitle,
            },
            trailer: {
              id: item.attributes.youtubeVideoId,
              site: 'youtube',
              thumbnail: `https://i.ytimg.com/vi/${item.attributes.youtubeVideoId}/hqdefault.jpg`,
            },
            status: item.attributes.status === 'current' ? 'RELEASING' : (item.attributes.status === 'upcoming' ? 'NOT_YET_RELEASED' : 'FINISHED'),
            coverImage: {
              large: item.attributes.posterImage?.large || item.attributes.posterImage?.original,
              medium: item.attributes.posterImage?.medium,
            },
          }));

        if (validKitsu.length > 0) {
          const finalData = validKitsu.slice(0, limit);
          trailerMemoryCache.set(cacheKey, { data: finalData, timestamp: Date.now() });
          return finalData;
        }
      }
    } catch (e: any) {
      logError('getLiveAnimeTrailers:Kitsu', e);
    }

    // 3. Tier 3: Jikan Seasons Live API
    try {
      const jikanEndpoint = filter === 'upcoming' ? 'seasons/upcoming' : 'seasons/now';
      const jikanRes = await fetch(`https://api.jikan.moe/v4/${jikanEndpoint}?page=${page}&limit=25`, {
        signal: AbortSignal.timeout(3000),
      });
      if (jikanRes.ok) {
        const jikanJson = await jikanRes.json();
        const list = jikanJson.data || [];
        const jikanTrailers: TrailerItem[] = list
          .filter((a: any) => a.trailer?.youtube_id)
          .map((a: any) => ({
            id: a.mal_id,
            title: { english: a.title_english || a.title, romaji: a.title },
            trailer: {
              id: a.trailer.youtube_id,
              site: 'youtube',
              thumbnail: a.trailer.images?.maximum_image_url || a.trailer.images?.large_image_url || `https://i.ytimg.com/vi/${a.trailer.youtube_id}/hqdefault.jpg`,
            },
            status: a.status === 'Currently Airing' ? 'RELEASING' : (a.status === 'Not yet aired' ? 'NOT_YET_RELEASED' : 'FINISHED'),
            coverImage: { large: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url },
          }));

        if (jikanTrailers.length > 0) {
          const finalData = jikanTrailers.slice(0, limit);
          trailerMemoryCache.set(cacheKey, { data: finalData, timestamp: Date.now() });
          return finalData;
        }
      }
    } catch (e: any) {
      logError('getLiveAnimeTrailers:Jikan', e);
    }

    // 4. Fallback: Curated Verified List
    let filteredCurated = VERIFIED_CURATED_TRAILERS;
    if (filter === 'airing') filteredCurated = VERIFIED_CURATED_TRAILERS.filter(t => t.status === 'RELEASING');
    if (filter === 'upcoming') filteredCurated = VERIFIED_CURATED_TRAILERS.filter(t => t.status === 'NOT_YET_RELEASED');
    if (filteredCurated.length === 0) filteredCurated = VERIFIED_CURATED_TRAILERS;

    return filteredCurated.slice(0, limit);
  };

  const promise = execute().finally(() => {
    inFlightTrailerPromises.delete(cacheKey);
  });

  inFlightTrailerPromises.set(cacheKey, promise);
  return promise;
}

export async function searchLiveAnimeTrailers(searchQuery: string): Promise<TrailerItem[]> {
  if (!searchQuery || !searchQuery.trim()) return [];
  const cleanQ = searchQuery.trim();

  // Tier 1: AniList Search
  try {
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 15) {
          media(search: $search, type: ANIME, countryOfOrigin: "JP", isAdult: false) {
            id
            title { romaji english }
            trailer { id site thumbnail }
            status
            coverImage { large medium }
          }
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { search: cleanQ } }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const json = await res.json();
      const media = json?.data?.Page?.media;
      if (Array.isArray(media)) {
        const valid = media
          .filter((a: any) => a.trailer && a.trailer.site === 'youtube' && a.trailer.id)
          .map((a: any) => ({
            id: a.id,
            title: {
              english: a.title?.english || a.title?.romaji,
              romaji: a.title?.romaji || a.title?.english,
            },
            trailer: {
              id: a.trailer.id,
              site: 'youtube',
              thumbnail: a.trailer.thumbnail || `https://i.ytimg.com/vi/${a.trailer.id}/hqdefault.jpg`,
            },
            status: a.status,
            coverImage: a.coverImage,
          }));

        if (valid.length > 0) return valid;
      }
    }
  } catch {}

  // Tier 2: Kitsu Search
  try {
    const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(cleanQ)}&page[limit]=10`, {
      headers: { 'Accept': 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      const items = json?.data || [];
      const validKitsu: TrailerItem[] = items
        .filter((item: any) => item.attributes?.youtubeVideoId)
        .map((item: any) => ({
          id: item.id,
          title: {
            english: item.attributes.titles?.en || item.attributes.canonicalTitle,
            romaji: item.attributes.titles?.ja_jp || item.attributes.canonicalTitle,
          },
          trailer: {
            id: item.attributes.youtubeVideoId,
            site: 'youtube',
            thumbnail: `https://i.ytimg.com/vi/${item.attributes.youtubeVideoId}/hqdefault.jpg`,
          },
          status: item.attributes.status === 'current' ? 'RELEASING' : (item.attributes.status === 'upcoming' ? 'NOT_YET_RELEASED' : 'FINISHED'),
          coverImage: {
            large: item.attributes.posterImage?.large || item.attributes.posterImage?.original,
            medium: item.attributes.posterImage?.medium,
          },
        }));

      if (validKitsu.length > 0) return validKitsu;
    }
  } catch {}

  // Tier 3: Jikan Search
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanQ)}&limit=10`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      const list = json.data || [];
      return list
        .filter((a: any) => a.trailer?.youtube_id)
        .map((a: any) => ({
          id: a.mal_id,
          title: { english: a.title_english || a.title, romaji: a.title },
          trailer: {
            id: a.trailer.youtube_id,
            site: 'youtube',
            thumbnail: a.trailer.images?.maximum_image_url || `https://i.ytimg.com/vi/${a.trailer.youtube_id}/hqdefault.jpg`,
          },
          status: a.status === 'Currently Airing' ? 'RELEASING' : (a.status === 'Not yet aired' ? 'NOT_YET_RELEASED' : 'FINISHED'),
          coverImage: { large: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url },
        }));
    }
  } catch {}

  return [];
}
