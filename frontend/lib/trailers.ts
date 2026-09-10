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

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://animenationindia.onrender.com');
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
    id: 52991,
    title: { english: 'Frieren: Beyond Journey\'s End', romaji: 'Sousou no Frieren' },
    trailer: { id: 'ZEkwCGJ3o-g', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/ZEkwCGJ3o-g/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 51179,
    title: { english: 'Solo Leveling: Season 2 - Arise from the Shadow', romaji: 'Ore dake Level Up na Ken Season 2' },
    trailer: { id: '9k_vK_P3jZ8', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/9k_vK_P3jZ8/hqdefault.jpg' },
    status: 'RELEASING'
  },
  {
    id: 57334,
    title: { english: 'Dandadan', romaji: 'Dandadan' },
    trailer: { id: 'dQ-a_0tU4pI', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/dQ-a_0tU4pI/hqdefault.jpg' },
    status: 'RELEASING'
  },
  {
    id: 54744,
    title: { english: 'Kaiju No. 8 Season 2', romaji: 'Kaijuu 8-gou 2nd Season' },
    trailer: { id: 'cyW8C8bV_bE', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/cyW8C8bV_bE/hqdefault.jpg' },
    status: 'NOT_YET_RELEASED'
  },
  {
    id: 5114,
    title: { english: 'Fullmetal Alchemist: Brotherhood', romaji: 'Hagane no Renkinjutsushi' },
    trailer: { id: 'yb2R1l0O9Zs', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/yb2R1l0O9Zs/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 21087,
    title: { english: 'One Punch Man Season 3', romaji: 'One Punch Man 3' },
    trailer: { id: '8Qn_spdM5Zg', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/8Qn_spdM5Zg/hqdefault.jpg' },
    status: 'NOT_YET_RELEASED'
  },
  {
    id: 38408,
    title: { english: 'My Hero Academia Season 7', romaji: 'Boku no Hero Academia 7th Season' },
    trailer: { id: 'yAswjO8z830', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/yAswjO8z830/hqdefault.jpg' },
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
    id: 21,
    title: { english: 'One Piece (Egghead Arc)', romaji: 'One Piece' },
    trailer: { id: 'qS_gH_k0L8M', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/qS_gH_k0L8M/hqdefault.jpg' },
    status: 'RELEASING'
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

    // 2. Tier 2: Official MAL v2 + Backend BFF Airing Trailer Proxy
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/trailers?limit=${limit * 2}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500),
        cache: 'no-store'
      });

      if (res.ok) {
        const json = await res.json();
        const items = json?.data || [];
        const validMal: TrailerItem[] = items
          .filter((item: any) => item.trailer && item.trailer.id)
          .map((item: any) => ({
            id: item.idMal || item.id,
            title: {
              english: item.title?.english || item.title?.romaji || (typeof item.title === 'string' ? item.title : ''),
              romaji: item.title?.romaji || item.title?.english || (typeof item.title === 'string' ? item.title : '')
            },
            trailer: {
              id: item.trailer.id,
              site: item.trailer.site || 'youtube',
              thumbnail: item.trailer.thumbnail || `https://i.ytimg.com/vi/${item.trailer.id}/hqdefault.jpg`
            },
            status: item.status || 'RELEASING',
            coverImage: item.coverImage || { large: item.bannerImage }
          }));

        if (validMal.length > 0) {
          const finalData = validMal.slice(0, limit);
          trailerMemoryCache.set(cacheKey, { data: finalData, timestamp: Date.now() });
          return finalData;
        }
      }
    } catch (e: any) {
      logError('getLiveAnimeTrailers:MAL_BFF', e);
    }

    // 3. Fallback: Curated Verified List
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

  // Tier 1: AniList GraphQL Search
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

  // Tier 2: Official MAL v2 Search + AniList Proxy Resolve
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/anime/search?q=${encodeURIComponent(cleanQ)}&limit=8`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      const items = json?.data || [];
      const validMal: TrailerItem[] = items
        .filter((item: any) => item.trailer && item.trailer.id)
        .map((item: any) => ({
          id: item.id || item.idMal,
          title: {
            english: item.title?.english || item.title?.romaji || (typeof item.title === 'string' ? item.title : ''),
            romaji: item.title?.romaji || item.title?.english || (typeof item.title === 'string' ? item.title : '')
          },
          trailer: {
            id: item.trailer.id,
            site: item.trailer.site || 'youtube',
            thumbnail: item.trailer.thumbnail || `https://i.ytimg.com/vi/${item.trailer.id}/hqdefault.jpg`
          },
          status: item.status || 'FINISHED',
          coverImage: item.coverImage || { large: item.images?.webp?.large_image_url }
        }));

      if (validMal.length > 0) return validMal;
    }
  } catch {}

  // Tier 3: Local Curated HD List Match
  const q = cleanQ.toLowerCase();
  const curatedMatches = VERIFIED_CURATED_TRAILERS.filter(item => {
    const t = `${item.title?.english || ''} ${item.title?.romaji || ''}`.toLowerCase();
    return t.includes(q);
  });

  return curatedMatches;
}
