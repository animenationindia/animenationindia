/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts
import { logError } from './logger';
import { fetchKitsuCharacters } from './kitsu-api';
import { DEFAULT_GENRES_LIST } from './genres-data';

const ANILIST_API_URL = 'https://graphql.anilist.co';
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://animenationindia.onrender.com';
const ANILIST_PROXY_URL = `${BACKEND_BASE_URL}/api/anilist/proxy`;
const JIKAN_API_URL = 'https://api.jikan.moe/v4';

export const GLOBAL_CACHE_TIME = 21600; // 6 hours in seconds

// 🚀 High-Speed In-Memory LRU/TTL Cache (5-Minute Memory Cache)
const apiMemoryCache = new Map<string, { data: any; timestamp: number }>();
const inFlightPromises = new Map<string, Promise<any>>();
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchInBatches<T>(
  tasks: (() => Promise<T>)[],
  batchSize = 3,
  delayMs = 100
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((fn) =>
        fn().catch((err) => {
          logError('fetchInBatches', err);
          return null as any;
        })
      )
    );
    results.push(...batchResults);
    if (i + batchSize < tasks.length && delayMs > 0) {
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  return results;
}

export async function fetchAniList(query: string, variables: any = {}, revalidate = GLOBAL_CACHE_TIME, timeoutMs = 8000) {
  const cacheKey = `anilist:${JSON.stringify(query)}:${JSON.stringify(variables)}`;

  // 1. Return from memory cache if fresh
  const cached = apiMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < MEMORY_CACHE_TTL) && revalidate !== 0) {
    return cached.data;
  }

  // 2. Return active in-flight Promise if identical request is pending
  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey);
  }

  const executeFetch = async () => {
    let retries = 2;
    let delay = 500;

    while (retries > 0) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const isServer = typeof window === 'undefined';
      // Server-side (Cloudflare Worker) uses Render proxy because AniList blocks Cloudflare IPs with 403.
      // Client-side (browser) attempts direct AniList query.
      const targetUrl = isServer ? ANILIST_PROXY_URL : ANILIST_API_URL;
      const fallbackUrl = isServer ? ANILIST_API_URL : ANILIST_PROXY_URL;

      const fetchOptions: any = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
        cache: 'no-store'
      };

      try {
        let res = await fetch(targetUrl, fetchOptions);
        
        // If target returned 403 (e.g. Cloudflare Worker IP blocked) or 502/503/504, attempt fallback
        if ((res.status === 403 || res.status >= 500) && targetUrl !== fallbackUrl) {
          console.warn(`Endpoint ${targetUrl} returned status ${res.status}. Falling back to ${fallbackUrl}...`);
          try {
            res = await fetch(fallbackUrl, fetchOptions);
          } catch (fbErr: any) {
            console.error('Fallback fetch error:', fbErr.message);
          }
        }
        clearTimeout(timer);
        
        if (res.status === 429) {
          console.warn(`AniList API 429 Rate Limit hit. Retrying in ${delay}ms...`);
          retries--;
          if (retries === 0) return null;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        
        const data = await res.json();
        if (data.errors && data.errors.some((err: any) => err.status === 429 || err.message === "Too Many Requests.")) {
          console.warn(`AniList API returned 429 error in body. Retrying in ${delay}ms...`);
          retries--;
          if (retries === 0) return null;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        
        if (data && data.data && (!data.errors || data.errors.length === 0)) {
          apiMemoryCache.set(cacheKey, { data, timestamp: Date.now() });
        }
        return data;
      } catch (error: any) {
        clearTimeout(timer);
        if (error.name === 'AbortError') {
          console.warn(`AniList API fetch timed out after ${timeoutMs}ms`);
          return null;
        }
        console.error("Error in fetchAniList:", error);
        retries--;
        if (retries === 0) return null;
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return null;
  };

  const promise = executeFetch().finally(() => {
    inFlightPromises.delete(cacheKey);
  });

  inFlightPromises.set(cacheKey, promise);
  return promise;
}

export async function fetchJikan(endpoint: string, revalidate = GLOBAL_CACHE_TIME, timeoutMs = 5000) {
  const cacheKey = `jikan:${endpoint}`;

  // 1. Return from memory cache if fresh
  const cached = apiMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < MEMORY_CACHE_TTL) && revalidate !== 0) {
    return cached.data;
  }

  // 2. Return active in-flight Promise if identical request is pending
  if (inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey);
  }

  const executeFetch = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions: any = { signal: controller.signal, cache: 'no-store' };

    try {
      const res = await fetch(`${JIKAN_API_URL}${endpoint}`, fetchOptions);
      clearTimeout(timer);
      
      if (res.status === 429 || res.status === 504 || res.status === 503 || res.status === 502) {
        console.warn(`Jikan API ${res.status} hit on ${endpoint}. Returning null to prevent timeout.`);
        return null;
      }
      
      if (!res.ok) {
        if (res.status === 404) {
          return null;
        }
        throw new Error(`Jikan API returned status ${res.status}`);
      }
      
      const data = await res.json();
      if (data && data.data) {
        apiMemoryCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data;
    } catch (error: any) {
      clearTimeout(timer);
      if (error.name === 'AbortError') {
        console.warn(`Jikan API fetch timed out after ${timeoutMs}ms for ${endpoint}`);
        return null;
      }
      console.error(`Error in fetchJikan for ${endpoint}:`, error);
      return null;
    }
  };

  const promise = executeFetch().finally(() => {
    inFlightPromises.delete(cacheKey);
  });

  inFlightPromises.set(cacheKey, promise);
  return promise;
}

// ─── Multi-Tier Fallback Engine ────────────────────────────────────────────────
export async function fetchWithFallback<T>(
  providers: Array<{ name: string; fn: () => Promise<T | null> }>
): Promise<T | null> {
  for (const provider of providers) {
    const startTime = Date.now();
    try {
      console.log(`[FallbackChain] Trying ${provider.name}...`);
      const result = await provider.fn();
      
      const isArray = Array.isArray(result);
      const hasValue = isArray ? result.length > 0 : result !== null && result !== undefined;

      if (hasValue) {
        console.log(`[FallbackChain SUCCESS] ${provider.name} succeeded in ${Date.now() - startTime}ms!`);
        return result;
      }
      console.warn(`[FallbackChain EMPTY] ${provider.name} returned empty/null in ${Date.now() - startTime}ms. Trying next...`);
    } catch (error: any) {
      logError(`FallbackChain:${provider.name}`, error);
      console.warn(`[FallbackChain FAIL] ${provider.name} failed in ${Date.now() - startTime}ms. Trying next...`);
    }
  }
  console.warn(`[FallbackChain EXHAUSTED] All providers failed or returned empty.`);
  return null;
}

// AniList Character Fallback
export async function fetchAniListCharactersFallback(anilistId: number): Promise<any[] | null> {
  if (!anilistId || isNaN(anilistId)) return null;

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

  try {
    const data = await fetchAniList(queryChar, { id: anilistId }, GLOBAL_CACHE_TIME, 2500);
    const edges = data?.data?.Media?.characters?.edges;
    if (!edges || !Array.isArray(edges) || edges.length === 0) return null;

    return edges.map((edge: any) => {
      const japaneseVA = edge.voiceActors?.[0];
      return {
        role: edge.role === 'MAIN' ? 'Main' : 'Supporting',
        character: {
          mal_id: edge.node?.id || 0,
          name: edge.node?.name?.full || edge.node?.name?.userPreferred || 'Unknown Character',
          images: {
            jpg: {
              image_url: edge.node?.image?.large || edge.node?.image?.medium || '/placeholder.png'
            }
          }
        },
        voice_actors: japaneseVA ? [
          {
            language: 'Japanese',
            person: {
              mal_id: japaneseVA.id || 0,
              name: japaneseVA.name?.full || japaneseVA.name?.userPreferred || 'Unknown VA',
              images: {
                jpg: {
                  image_url: japaneseVA.image?.large || japaneseVA.image?.medium || '/placeholder.png'
                }
              }
            }
          }
        ] : []
      };
    });
  } catch (error) {
    logError('fetchAniListCharactersFallback', error);
    return null;
  }
}

// AniList Recommendation Fallback (Queries both idMal and native ID)
export async function fetchAniListRecommendationsFallback(animeId: number): Promise<any[] | null> {
  if (!animeId || isNaN(animeId)) return null;

  const queryMal = `
    query ($id: Int) {
      Media(idMal: $id, type: ANIME) {
        id
        idMal
        recommendations(page: 1, perPage: 18, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              averageScore
              genres
              isAdult
            }
          }
        }
      }
    }
  `;

  const queryDirect = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        recommendations(page: 1, perPage: 18, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              averageScore
              genres
              isAdult
            }
          }
        }
      }
    }
  `;

  try {
    let data = await fetchAniList(queryMal, { id: animeId }, GLOBAL_CACHE_TIME, 2500);
    let nodes = data?.data?.Media?.recommendations?.nodes;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      data = await fetchAniList(queryDirect, { id: animeId }, GLOBAL_CACHE_TIME, 2500);
      nodes = data?.data?.Media?.recommendations?.nodes;
    }

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return null;

    const validRecs = nodes
      .map((n: any) => n.mediaRecommendation)
      .filter((rec: any) => rec && (rec.idMal || rec.id) && isSafeContent(rec));

    if (validRecs.length === 0) return null;

    return validRecs.map((rec: any) => ({
      entry: {
        mal_id: rec.idMal || rec.id,
        title: rec.title?.english || rec.title?.romaji || 'Recommended Anime',
        images: {
          jpg: {
            large_image_url: rec.coverImage?.extraLarge || rec.coverImage?.large || '/placeholder.png'
          },
          webp: {
            large_image_url: rec.coverImage?.extraLarge || rec.coverImage?.large || '/placeholder.png'
          }
        }
      },
      format: rec.format || 'TV',
      averageScore: rec.averageScore || null
    }));
  } catch (error) {
    logError('fetchAniListRecommendationsFallback', error);
    return null;
  }
}



export interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage: {
    extraLarge?: string;
    large: string;
  };
  bannerImage: string | null;
  description: string | null;
  episodes: number | null;
  format: string | null;
  status: string | null;
  averageScore: number | null;
  genres: string[] | null;
  seasonYear: number | null;
  startDate?: {
    year: number | null;
  } | null;
}

export interface AiringSchedule {
  id: number;
  airingAt: number;
  episode: number;
  media: {
    id: number;
    idMal: number | null;
    title: {
      english: string | null;
      romaji: string;
    };
    coverImage?: {
      extraLarge?: string;
      large: string;
    };
    bannerImage?: string | null;
    description?: string | null;
    averageScore?: number | null;
    episodes?: number | null;
    format?: string | null;
    status?: string | null;
    genres?: string[] | null;
    seasonYear?: number | null;
    studios?: {
      nodes: Array<{ name: string }>;
    } | null;
  };
}

export interface CharacterItem {
  id: number;
  name: {
    full: string;
  };
  image: {
    large: string | null;
  };
  favourites: number;
}

export interface StaffItem {
  id: number;
  name: {
    full: string;
  };
  image: {
    large: string | null;
  };
  favourites: number;
}

export interface AniListExtra {
  id?: number;
  idMal?: number | null;
  title?: {
    english: string | null;
    romaji: string;
    native?: string | null;
  };
  coverImage?: {
    extraLarge?: string;
    large: string;
  };
  bannerImage: string | null;
  description?: string | null;
  episodes?: number | null;
  format?: string | null;
  status?: string | null;
  averageScore?: number | null;
  genres?: string[] | null;
  seasonYear?: number | null;
  trailer?: {
    id: string | null;
    site: string | null;
    thumbnail: string | null;
  } | null;
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  } | null;
  duration?: number | null;
  source?: string | null;
  studios?: {
    nodes: Array<{ name: string }>;
  } | null;
  relations?: {
    edges: Array<{
      relationType: string;
      node: {
        id: number;
        idMal: number | null;
        title: {
          english: string | null;
          romaji: string;
        };
        coverImage: {
          extraLarge?: string;
          large: string;
        };
        format: string | null;
        type?: string | null;
        startDate?: {
          year: number | null;
          month: number | null;
          day: number | null;
        } | null;
      };
    }>;
  } | null;
}

export async function getScheduleAniList(start: number, end: number, page = 1): Promise<AiringSchedule[]> {
  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 50) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          airingAt
          episode
          media {
            id idMal title { english romaji } coverImage { extraLarge large } bannerImage description averageScore
            episodes format status genres seasonYear studios(isMain: true) { nodes { name } }
          }
        }
      }
    }
  `;
  try {
    // Fast parallel fetch for page 1 & 2 (up to 100 schedule items) in 1 roundtrip
    const [p1, p2] = await Promise.all([
      fetchAniList(query, { page: 1, start, end }, 3600, 2500),
      fetchAniList(query, { page: 2, start, end }, 3600, 2500)
    ]);

    const s1 = p1?.data?.Page?.airingSchedules || [];
    const s2 = p2?.data?.Page?.airingSchedules || [];
    return [...s1, ...s2];
  } catch (error) { 
    console.error("Error fetching schedule from AniList:", error);
    return [] as AiringSchedule[];
  }
}

// ১. Today Releases
export async function getTodayReleasesAniList(page = 1) {
  const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const endOfDay = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000);

  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage currentPage }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_DESC) {
          episode
          media {
            id idMal title { english romaji } coverImage { extraLarge large }
            episodes format status genres seasonYear
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { page, start: startOfDay, end: endOfDay });
    return data.data.Page; 
  } catch { 
    return { airingSchedules: [] as AiringSchedule[], pageInfo: { hasNextPage: false, currentPage: 1 } }; 
  }
}

// ১.১ Past Week Releases
export async function getPastWeekReleasesAniList(page = 1) {
  const end = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const start = end - (7 * 24 * 60 * 60);

  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 24) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_DESC) {
          episode media { id idMal title { english romaji } coverImage { extraLarge large } episodes format status genres seasonYear }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { page, start, end });
    return data.data.Page; 
  } catch { return { airingSchedules: [] as AiringSchedule[] }; }
}

// ১.২ Past Month Releases
export async function getPastMonthReleasesAniList(page = 1) {
  const end = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000) - (7 * 24 * 60 * 60);
  const start = end - (30 * 24 * 60 * 60);

  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 24) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_DESC) {
          episode media { id idMal title { english romaji } coverImage { extraLarge large } episodes format status genres seasonYear }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { page, start, end });
    return data.data.Page; 
  } catch { return { airingSchedules: [] as AiringSchedule[] }; }
}

// ২. Top Rated Anime
export async function getTopAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 10) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } averageScore format status episodes seasonYear genres description
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৩. Trending Anime (Updated for Home Page Grid)
export async function getTrendingAnimeAniList(limit: number = 10): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 30) { 
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    const mediaList = data.data.Page.media as AniListMedia[];
    const animeWithBanners = mediaList.filter((anime) => anime.bannerImage !== null);
    // If we request more than banner anime, just return mediaList directly
    if (limit > 10) {
      return mediaList.slice(0, limit);
    }
    return animeWithBanners.slice(0, limit);
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৩.২ Popular Anime Page (With Pagination)
export async function getPopularAnimePageAniList(page: number = 1): Promise<{ media: AniListMedia[], pageInfo: any }> {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 24) { 
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { page });
    return {
      media: data.data.Page.media as AniListMedia[],
      pageInfo: data.data.Page.pageInfo
    };
  } catch { 
    return { media: [], pageInfo: { currentPage: 1, lastPage: 1 } }; 
  }
}


// ৩.১ Top Airing Anime (For Hero Slider)
export async function getTopAiringAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 25) { 
        media(sort: POPULARITY_DESC, status: RELEASING, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    const mediaList = data.data.Page.media as AniListMedia[];
    const animeWithBanners = mediaList.filter((anime) => anime.bannerImage !== null);
    return animeWithBanners.slice(0, 10);
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৪. Details Page এর জন্য Jikan Full Info (With AniList Direct Fallback)
export async function getAnimeFullDetails(id: string) {
  const numId = Number(id);

  // 1. Try Jikan API
  try {
    const res = await fetchJikan(`/anime/${id}/full`);
    if (res?.data && isSafeContent(res.data)) return res.data;
  } catch {}

  // 2. Fallback to AniList Direct Query if Jikan is rate-limited or times out
  if (!isNaN(numId) && numId > 0) {
    try {
      const extra = await getAniListExtraInfo(numId);
      if (extra && isSafeContent(extra)) {
        return {
          mal_id: extra.idMal || extra.id || numId,
          title: extra.title?.romaji || extra.title?.english || 'Unknown Title',
          title_english: extra.title?.english || extra.title?.romaji || 'Unknown Title',
          title_japanese: extra.title?.native || '',
          synopsis: extra.description || 'No description available.',
          images: {
            webp: { large_image_url: extra.coverImage?.extraLarge || extra.coverImage?.large || '/placeholder-poster.png' },
            jpg: { large_image_url: extra.coverImage?.large || '/placeholder-poster.png' }
          },
          bannerImage: extra.bannerImage,
          score: extra.averageScore ? extra.averageScore / 10 : null,
          episodes: extra.episodes || null,
          status: extra.status === 'RELEASING' ? 'Currently Airing' : 'Finished Airing',
          genres: (extra.genres || []).map(g => ({ name: g })),
          year: extra.seasonYear || null,
          trailer: extra.trailer,
          studios: extra.studios
        };
      }
    } catch {}
  }

  return null;
}

// ৫. ক্যারেক্টার ও ভয়েস অ্যাক্টর (Multi-Tier Fallback: AniList -> Jikan -> Kitsu)
export async function getAnimeCharacters(id: string | number, anilistId?: number): Promise<any[]> {
  const numMalId = Number(id);
  const resolvedAniListId = anilistId || numMalId;

  const providers = [
    {
      name: 'Jikan Characters (Primary for MAL ID)',
      fn: async () => {
        const res = await fetchJikan(`/anime/${id}/characters`, GLOBAL_CACHE_TIME, 2000);
        return res?.data && Array.isArray(res.data) && res.data.length > 0 ? res.data : null;
      }
    },
    {
      name: 'AniList Characters (Secondary Fallback)',
      fn: async () => fetchAniListCharactersFallback(resolvedAniListId)
    },
    {
      name: 'Kitsu Characters (Tertiary)',
      fn: async () => fetchKitsuCharacters(numMalId)
    }
  ];

  const result = await fetchWithFallback(providers);
  return result || [];
}

// ৫.১ Episodes (Jikan)
export async function getAnimeEpisodes(id: string) {
  try {
    const res = await fetchJikan(`/anime/${id}/episodes`);
    return res?.data || []; 
  } catch { 
    return []; 
  }
}

// ৬. AniList থেকে ব্যানার ও ফ্র্যাঞ্চাইজি (Relations)
export async function getAniListExtraInfo(idMal: number): Promise<AniListExtra | null> {
  const queryByMal = `
    query ($id: Int) {
      Media(idMal: $id, type: ANIME) {
        id
        idMal
        title { english romaji native }
        coverImage { extraLarge large }
        bannerImage
        description
        episodes
        format
        status
        averageScore
        genres
        seasonYear
        duration
        source
        studios(isMain: true) { nodes { name } }
        trailer { id site thumbnail }
        nextAiringEpisode { airingAt timeUntilAiring episode }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              startDate { year month day }
              type
              relations {
                edges {
                  relationType
                  node {
                    id
                    idMal
                    title { english romaji }
                    coverImage { extraLarge large }
                    format
                    startDate { year month day }
                    type
                    relations {
                      edges {
                        relationType
                        node {
                          id
                          idMal
                          title { english romaji }
                          coverImage { extraLarge large }
                          format
                          startDate { year month day }
                          type
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const queryDirect = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title { english romaji native }
        coverImage { extraLarge large }
        bannerImage
        description
        episodes
        format
        status
        averageScore
        genres
        seasonYear
        duration
        source
        studios(isMain: true) { nodes { name } }
        trailer { id site thumbnail }
        nextAiringEpisode { airingAt timeUntilAiring episode }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              startDate { year month day }
              type
              relations {
                edges {
                  relationType
                  node {
                    id
                    idMal
                    title { english romaji }
                    coverImage { extraLarge large }
                    format
                    startDate { year month day }
                    type
                    relations {
                      edges {
                        relationType
                        node {
                          id
                          idMal
                          title { english romaji }
                          coverImage { extraLarge large }
                          format
                          startDate { year month day }
                          type
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const dataMal = await fetchAniList(queryByMal, { id: idMal });
    if (dataMal?.data?.Media) {
      return dataMal.data.Media as AniListExtra;
    }
    
    // Fallback: Try querying as AniList native ID
    const dataDirect = await fetchAniList(queryDirect, { id: idMal });
    return (dataDirect?.data?.Media as AniListExtra) || null;
  } catch { 
    return null; 
  }
}

// ৭. New Releases (Recently Added)
export async function getNewReleasesAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 15) {
        media(seasonYear: 2026, status_in: [RELEASING, FINISHED], sort: START_DATE_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage format status averageScore genres description episodes seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৭.১ Current Season (Simulcast)
export async function getCurrentSeasonAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 24) {
        media(season: SUMMER, seasonYear: 2026, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } format status episodes genres seasonYear description
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৮. Upcoming (Next Season)
export async function getUpcomingAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 24) {
        media(season: FALL, seasonYear: 2026, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } format status episodes genres seasonYear description
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৯. Popular Dubbed
export async function getPopularDubbedAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 15) {
        media(sort: POPULARITY_DESC, format: TV, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } format status episodes genres seasonYear description
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ১০. Top Characters
export async function getTopCharactersAniList(page: number = 1): Promise<CharacterItem[]> {
  const query = `query($page:Int){Page(page:$page,perPage:24){characters(sort:FAVOURITES_DESC){id name{full} image{large} favourites}}}`;
  try {
    const data = await fetchAniList(query, { page });
    return data.data.Page.characters as CharacterItem[];
  } catch { 
    return [] as CharacterItem[]; 
  }
}

// ১১. Top Staff
export async function getTopStaffAniList(page: number = 1): Promise<StaffItem[]> {
  const query = `query($page:Int){Page(page:$page,perPage:24){staff(sort:FAVOURITES_DESC){id name{full} image{large} favourites}}}`;
  try {
    const data = await fetchAniList(query, { page });
    return data.data.Page.staff as StaffItem[];
  } catch { 
    return [] as StaffItem[]; 
  }
}

// ১৩. Search Anime (With Pagination)
export async function searchAnimeAniList(queryText: string, page: number = 1) {
  const query = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
          id idMal title { romaji english } coverImage { extraLarge large } averageScore format status episodes seasonYear startDate { year } genres description
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { search: queryText, page: page }, 0);
    return data.data.Page; 
  } catch (e) { 
    console.error("Search Error:", e);
    return { media: [] as AniListMedia[], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } }; 
  }
}

// ১৪. Advanced Filter Anime (Strict Safe Content - Hentai Blocked)
export async function getFilteredAnimeAniList(params: {
  page?: number;
  season?: string;
  seasonYear?: number;
  format?: string;
  status?: string;
  genres?: string[];
  tags?: string[];
  sort?: string;
  perPage?: number;
  isAdult?: boolean;
}) {
  const { page = 1, season, seasonYear, format, status, genres, tags, sort = 'POPULARITY_DESC', perPage = 24 } = params;
  
  // Strict non-hentai genres filter
  const cleanGenres = (genres || []).filter(g => g.toLowerCase() !== 'hentai');
  const cleanTags = (tags || []).filter(t => t.toLowerCase() !== 'hentai');

  // Build dynamic filters with strictly isAdult: false
  let queryArgs = `$page: Int, $perPage: Int`;
  let mediaArgs = `type: ANIME, isAdult: false, genre_not_in: ["Hentai"], sort: [$sort]`;
  const variables: Record<string, any> = { page, perPage, sort };

  if (season) { queryArgs += `, $season: MediaSeason`; mediaArgs += `, season: $season`; variables.season = season; }
  if (seasonYear) { queryArgs += `, $seasonYear: Int`; mediaArgs += `, seasonYear: $seasonYear`; variables.seasonYear = seasonYear; }
  if (format) { queryArgs += `, $format: MediaFormat`; mediaArgs += `, format: $format`; variables.format = format; }
  if (status) { queryArgs += `, $status: MediaStatus`; mediaArgs += `, status: $status`; variables.status = status; }
  if (cleanGenres.length > 0) { queryArgs += `, $genres: [String]`; mediaArgs += `, genre_in: $genres`; variables.genres = cleanGenres; }
  if (cleanTags.length > 0) { queryArgs += `, $tags: [String]`; mediaArgs += `, tag_in: $tags`; variables.tags = cleanTags; }
  queryArgs += `, $sort: MediaSort`;

  const query = `
    query (${queryArgs}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(${mediaArgs}) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage averageScore format status episodes seasonYear genres description startDate { year }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(query, variables);
    const pageData = data?.data?.Page;
    if (!pageData) return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
    
    // Filter out any adult/hentai content
    pageData.media = (pageData.media || []).filter(isSafeContent);
    return pageData;
  } catch (e) {
    console.error("Filter API Error:", e);
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  }
}

// ??. Jikan API - Get All Genres (Hentai Filtered Out with high-reliability fallback)
export async function getJikanGenres() {
  try {
    const data = await fetchJikan('/genres/anime', 86400, 2500);
    const list = data?.data || [];
    // Strict block on Hentai & explicit adult categories
    const filtered = list.filter((g: any) => 
      g.name.toLowerCase() !== 'hentai' && 
      g.mal_id !== 12
    );
    if (filtered.length > 0) return filtered;
  } catch (error) {
    console.error('getJikanGenres error, using default genre list:', error);
  }
  return DEFAULT_GENRES_LIST;
}

// ??. Jikan API - Get Anime by Genre
export async function getJikanAnimeByGenre(genreId: string, page = 1, orderBy = 'start_date', sort = 'desc') {
  try {
    const endpoint = `/anime?genres=${genreId}&page=${page}&limit=24&order_by=${orderBy}&sort=${sort}`;
    const data = await fetchJikan(endpoint);
    if (!data) return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
    
    // Transform Jikan response to match our AnimeCard props (AniList format)
    const transformedMedia = (data.data || []).map((anime: any) => ({
      id: anime.mal_id, // Fallback to mal_id as primary ID
      idMal: anime.mal_id,
      title: {
        romaji: anime.title_english || anime.title,
        english: anime.title_english,
      },
      coverImage: {
        large: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        extraLarge: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url,
      },
      averageScore: typeof anime.score === 'number' && !isNaN(anime.score) ? Math.round(anime.score * 10) : null,
      format: anime.type,
      status: anime.status === 'Currently Airing' ? 'RELEASING' : anime.status === 'Finished Airing' ? 'FINISHED' : anime.status,
      episodes: anime.episodes,
      seasonYear: anime.year,
      genres: anime.genres?.map((g: any) => g.name) || [],
    }));

    return {
      media: transformedMedia,
      pageInfo: {
        total: data.pagination?.items?.total || 0,
        currentPage: page,
        lastPage: data.pagination?.last_visible_page || 1,
        hasNextPage: data.pagination?.has_next_page || false,
      }
    };
  } catch (error) {
    console.error(error);
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  }
}

// 15. Recommendations (Multi-Tier Fallback: AniList -> Jikan)
export async function getAnimeRecommendations(id: string | number, anilistId?: number): Promise<any[]> {
  const numMalId = Number(id);
  const resolvedAniListId = anilistId || numMalId;

  const providers = [
    {
      name: 'AniList Recommendations (Primary)',
      fn: async () => fetchAniListRecommendationsFallback(resolvedAniListId)
    },
    {
      name: 'Jikan Recommendations (Secondary Fallback)',
      fn: async () => {
        const data = await fetchJikan(`/anime/${id}/recommendations`, GLOBAL_CACHE_TIME, 2000);
        return data?.data && Array.isArray(data.data) && data.data.length > 0
          ? data.data.map((rec: any) => ({
              entry: {
                mal_id: rec.entry.mal_id,
                title: rec.entry.title,
                images: {
                  jpg: {
                    large_image_url: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url
                  }
                }
              }
            }))
          : null;
      }
    }
  ];

  const result = await fetchWithFallback(providers);
  return result || [];
}

// 16. Top Characters (Jikan)
export async function getTopCharactersJikan() {
  try {
    const data = await fetchJikan('/top/characters?limit=15');
    return (data?.data || []).map((char: any) => ({
      id: char.mal_id,
      name: { full: char.name },
      image: { large: char.images?.jpg?.image_url },
      favourites: char.favorites
    }));
  } catch (error) {
    console.error("Top Characters API Error:", error);
    return [];
  }
}

// 17. Top People / Staff (Jikan)
export async function getTopPeopleJikan() {
  try {
    const data = await fetchJikan('/top/people?limit=15');
    return (data?.data || []).map((person: any) => ({
      id: person.mal_id,
      name: { full: person.name },
      image: { large: person.images?.jpg?.image_url },
      favourites: person.favorites
    }));
  } catch (error) {
    console.error("Top People API Error:", error);
    return [];
  }
}

// AniList Direct Character Fetcher
export async function fetchAniListCharacter(id: number): Promise<any | null> {
  if (!id || isNaN(id)) return null;

  const query = `
    query ($id: Int) {
      Character(id: $id) {
        id
        name { full native alternative userPreferred }
        image { large medium }
        description
        favourites
        media(type: ANIME, sort: POPULARITY_DESC, perPage: 25) {
          edges {
            characterRole
            node { id idMal title { english romaji } coverImage { large } format }
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

  try {
    const data = await fetchAniList(query, { id }, GLOBAL_CACHE_TIME, 3000);
    const char = data?.data?.Character;
    if (!char) return null;

    return {
      mal_id: char.id,
      name: char.name?.full || char.name?.userPreferred || 'Unknown Character',
      name_kanji: char.name?.native || '',
      nicknames: char.name?.alternative || [],
      favorites: char.favourites || 0,
      about: char.description || '',
      images: {
        jpg: {
          image_url: char.image?.large || char.image?.medium || '/placeholder.png'
        },
        webp: {
          image_url: char.image?.large || char.image?.medium || '/placeholder.png'
        }
      },
      anime: (char.media?.edges || []).map((edge: any) => ({
        role: edge.characterRole === 'MAIN' ? 'Main' : 'Supporting',
        anime: {
          mal_id: edge.node?.idMal || edge.node?.id,
          title: edge.node?.title?.english || edge.node?.title?.romaji || 'Unknown Anime',
          images: {
            jpg: {
              image_url: edge.node?.coverImage?.large || '/placeholder-poster.png'
            }
          }
        }
      })),
      voices: (char.media?.edges || []).flatMap((edge: any) => 
        (edge.voiceActors || []).map((va: any) => ({
          language: 'Japanese',
          person: {
            mal_id: va.id,
            name: va.name?.full || va.name?.userPreferred || 'Unknown VA',
            images: {
              jpg: {
                image_url: va.image?.large || va.image?.medium || '/placeholder.png'
              }
            }
          }
        }))
      )
    };
  } catch (error) {
    logError('fetchAniListCharacter', error);
    return null;
  }
}

// AniList Direct Staff Fetcher
export async function fetchAniListStaff(id: number): Promise<any | null> {
  if (!id || isNaN(id)) return null;

  const query = `
    query ($id: Int) {
      Staff(id: $id) {
        id
        name { full native alternative userPreferred }
        image { large medium }
        description
        primaryOccupations
        favourites
        characterMedia(page: 1, perPage: 30, sort: POPULARITY_DESC) {
          edges {
            characters { id name { full userPreferred } image { large medium } }
            node { id idMal title { english romaji } coverImage { large } format }
          }
        }
        staffMedia(page: 1, perPage: 25, sort: POPULARITY_DESC) {
          edges {
            staffRole
            node { id idMal title { english romaji } coverImage { large } format }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(query, { id }, GLOBAL_CACHE_TIME, 3000);
    const staff = data?.data?.Staff;
    if (!staff) return null;

    return {
      mal_id: staff.id,
      name: staff.name?.full || staff.name?.userPreferred || 'Unknown Staff',
      given_name: null,
      family_name: null,
      favorites: staff.favourites || 0,
      about: staff.description || '',
      website_url: null,
      images: {
        jpg: {
          image_url: staff.image?.large || staff.image?.medium || '/placeholder.png'
        },
        webp: {
          image_url: staff.image?.large || staff.image?.medium || '/placeholder.png'
        }
      },
      voices: (staff.characterMedia?.edges || []).flatMap((edge: any) => 
        (edge.characters || []).map((char: any) => ({
          role: 'Voice Actor',
          character: {
            mal_id: char.id,
            name: char.name?.full || char.name?.userPreferred || 'Unknown Character',
            images: {
              jpg: {
                image_url: char.image?.large || '/placeholder.png'
              }
            }
          },
          anime: edge.node ? {
            mal_id: edge.node.idMal || edge.node.id,
            title: edge.node.title?.english || edge.node.title?.romaji || 'Unknown Anime',
            images: {
              jpg: {
                image_url: edge.node.coverImage?.large || '/placeholder-poster.png'
              }
            }
          } : null
        }))
      ),
      anime: (staff.staffMedia?.edges || []).map((edge: any) => ({
        position: edge.staffRole || 'Staff',
        anime: {
          mal_id: edge.node?.idMal || edge.node?.id,
          title: edge.node?.title?.english || edge.node?.title?.romaji || 'Unknown Anime',
          images: {
            jpg: {
              image_url: edge.node?.coverImage?.large || '/placeholder-poster.png'
            }
          }
        }
      }))
    };
  } catch (error) {
    logError('fetchAniListStaff', error);
    return null;
  }
}

export async function getCharacterDetailsJikan(id: string | number) {
  const numId = Number(id);
  // 1. Try Jikan API
  try {
    const data = await fetchJikan(`/characters/${id}/full`, GLOBAL_CACHE_TIME, 2500);
    if (data?.data) return data.data;
  } catch (error) {
    console.warn(`[Jikan Character Fail] ID ${id}:`, error);
  }

  // 2. Fallback to AniList Direct Query
  if (!isNaN(numId) && numId > 0) {
    const aniChar = await fetchAniListCharacter(numId);
    if (aniChar) return aniChar;
  }

  return null;
}

export async function getPersonDetailsJikan(id: string | number) {
  const numId = Number(id);
  // 1. Try Jikan API
  try {
    const data = await fetchJikan(`/people/${id}/full`, GLOBAL_CACHE_TIME, 2500);
    if (data?.data) return data.data;
  } catch (error) {
    console.warn(`[Jikan People Fail] ID ${id}:`, error);
  }

  // 2. Fallback to AniList Direct Query
  if (!isNaN(numId) && numId > 0) {
    const aniStaff = await fetchAniListStaff(numId);
    if (aniStaff) return aniStaff;
  }

  return null;
}

// Global Safe Content Verifier (Strict Hentai & NSFW Filter)
export function isSafeContent(item: any): boolean {
  if (!item) return false;
  const genres = Array.isArray(item.genres) 
    ? item.genres.map((g: any) => (typeof g === 'string' ? g : g.name || '')) 
    : [];
  const tags = Array.isArray(item.tags)
    ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || ''))
    : [];
  const format = (item.format || item.type || '').toString().toLowerCase();
  
  if (format === 'hentai' || format.includes('hentai')) return false;
  if (genres.some((g: string) => g.toLowerCase() === 'hentai' || g.toLowerCase() === 'erotica')) return false;
  if (tags.some((t: string) => t.toLowerCase() === 'hentai' || t.toLowerCase() === 'erotica')) return false;
  if (item.isAdult === true) return false;
  
  return true;
}

// --- MANGA / LIGHT NOVEL FUNCTIONS ---

// 1. AniList Direct Manga Details Fetcher
export async function fetchAniListMangaDetails(id: string | number): Promise<any | null> {
  const numId = Number(id);
  if (!numId || isNaN(numId)) return null;

  const queryDirect = `
    query ($id: Int) {
      Media(id: $id, type: MANGA, isAdult: false) {
        id
        idMal
        title { english romaji native }
        coverImage { extraLarge large }
        bannerImage
        description
        chapters
        volumes
        format
        status
        averageScore
        genres
        seasonYear
        startDate { year month day }
        countryOfOrigin
        isAdult
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              type
              status
            }
          }
        }
        characters(perPage: 12, sort: [ROLE, RELEVANCE]) {
          edges {
            role
            node {
              id
              name { full userPreferred }
              image { large medium }
            }
          }
        }
        recommendations(perPage: 12, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              type
              isAdult
              genres
            }
          }
        }
      }
    }
  `;

  const queryMal = `
    query ($id: Int) {
      Media(idMal: $id, type: MANGA, isAdult: false) {
        id
        idMal
        title { english romaji native }
        coverImage { extraLarge large }
        bannerImage
        description
        chapters
        volumes
        format
        status
        averageScore
        genres
        seasonYear
        startDate { year month day }
        countryOfOrigin
        isAdult
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              type
              status
            }
          }
        }
        characters(perPage: 12, sort: [ROLE, RELEVANCE]) {
          edges {
            role
            node {
              id
              name { full userPreferred }
              image { large medium }
            }
          }
        }
        recommendations(perPage: 12, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              type
              isAdult
              genres
            }
          }
        }
      }
    }
  `;

  try {
    let data = await fetchAniList(queryDirect, { id: numId }, GLOBAL_CACHE_TIME, 3000);
    let media = data?.data?.Media;

    if (!media) {
      data = await fetchAniList(queryMal, { id: numId }, GLOBAL_CACHE_TIME, 3000);
      media = data?.data?.Media;
    }

    if (!media || !isSafeContent(media)) return null;

    return {
      mal_id: media.idMal || media.id,
      id: media.id,
      anilistId: media.id,
      title: media.title?.romaji || media.title?.english || 'Unknown Title',
      title_english: media.title?.english || media.title?.romaji || 'Unknown Title',
      title_japanese: media.title?.native || '',
      synopsis: media.description || 'No synopsis available for this title.',
      images: {
        webp: { large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || '/placeholder-poster.png' },
        jpg: { large_image_url: media.coverImage?.large || '/placeholder-poster.png' }
      },
      bannerImage: media.bannerImage || null,
      genres: (media.genres || []).filter((g: string) => g.toLowerCase() !== 'hentai').map((g: string, idx: number) => ({ mal_id: idx, name: g })),
      score: typeof media.averageScore === 'number' ? media.averageScore / 10 : null,
      type: media.format ? media.format.replace(/_/g, ' ') : 'Manga',
      status: media.status === 'RELEASING' ? 'Publishing' : 'Finished',
      countryOfOrigin: media.countryOfOrigin || 'JP',
      chapters: media.chapters || null,
      volumes: media.volumes || null,
      relations: (media.relations?.edges || [])
        .filter((e: any) => e.node && isSafeContent(e.node))
        .map((e: any) => ({
          relationType: e.relationType,
          entry: {
            id: e.node.idMal || e.node.id,
            idMal: e.node.idMal || e.node.id,
            anilistId: e.node.id,
            title: e.node.title?.english || e.node.title?.romaji || 'Unknown Title',
            format: e.node.format,
            type: e.node.type,
            images: {
              webp: { large_image_url: e.node.coverImage?.extraLarge || e.node.coverImage?.large || '/placeholder-poster.png' },
              jpg: { large_image_url: e.node.coverImage?.large || '/placeholder-poster.png' }
            }
          }
        })),
      characters: (media.characters?.edges || []).map((edge: any) => ({
        role: edge.role === 'MAIN' ? 'Main' : 'Supporting',
        character: {
          mal_id: edge.node?.id,
          name: edge.node?.name?.full || edge.node?.name?.userPreferred || 'Unknown',
          images: {
            jpg: { image_url: edge.node?.image?.large || edge.node?.image?.medium || '/placeholder.png' }
          }
        }
      })),
      recommendations: (media.recommendations?.nodes || [])
        .map((n: any) => n.mediaRecommendation)
        .filter((r: any) => r && (r.idMal || r.id) && isSafeContent(r))
        .map((r: any) => ({
          entry: {
            mal_id: r.idMal || r.id,
            title: r.title?.english || r.title?.romaji || 'Unknown Title',
            images: {
              webp: { large_image_url: r.coverImage?.extraLarge || r.coverImage?.large || '/placeholder-poster.png' },
              jpg: { large_image_url: r.coverImage?.large || '/placeholder-poster.png' }
            }
          }
        }))
    };
  } catch (error) {
    logError('fetchAniListMangaDetails', error);
    return null;
  }
}

const ANILIST_TO_KITSU_MAP: Record<string, string> = {
  '105778': '54139', // Chainsaw Man
  '30002': '8',      // Berserk
  '2': '8',          // Berserk MAL
  '105398': '54114', // Solo Leveling
  '121496': '54114', // Solo Leveling MAL
  '119257': '56452', // Omniscient Reader
  '85143': '25436',  // Tower of God
  '86334': '39293',  // Lookism AniList
  '93633': '39293',  // Lookism MAL
  '38167': '38167',  // Wind Breaker
  '30013': '13',     // One Piece
  '13': '13',        // One Piece MAL
};

// Kitsu Manga Details Resolver
export async function getKitsuMangaDetails(id: string) {
  const cleanId = String(id).replace(/^kitsu-/, '').trim();
  const url = `https://kitsu.io/api/edge/manga/${cleanId}?include=genres`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.api+json' }, next: { revalidate: GLOBAL_CACHE_TIME } });
    if (res.status !== 200) return null;
    const json = await res.json();
    const attr = json.data?.attributes;
    if (!attr) return null;

    const canonical = attr.canonicalTitle === 'Oemojisangjuui' ? 'Lookism' : attr.canonicalTitle;
    const titleEnglish = attr.titles?.en || attr.titles?.en_us || canonical || attr.titles?.en_jp || 'Unknown Title';
    const titleRomaji = attr.titles?.en_jp || canonical || titleEnglish;
    const format = (attr.subtype || 'manga').toUpperCase();
    const rawScore = attr.averageRating ? parseFloat(attr.averageRating) : null;
    const score = rawScore ? parseFloat((rawScore / 10).toFixed(1)) : null;

    const countryOfOrigin = format === 'MANHWA' ? 'KR' : format === 'MANHUA' ? 'CN' : 'JP';

    const mangaData = {
      mal_id: cleanId,
      id: `kitsu-${cleanId}`,
      kitsuId: cleanId,
      title: titleRomaji,
      title_english: titleEnglish,
      title_japanese: attr.titles?.ja_jp || '',
      synopsis: attr.synopsis || 'No synopsis available for this title.',
      images: {
        webp: { large_image_url: attr.posterImage?.large || attr.posterImage?.original || '/placeholder-poster.png' },
        jpg: { large_image_url: attr.posterImage?.large || attr.posterImage?.original || '/placeholder-poster.png' }
      },
      coverImage: {
        large: attr.posterImage?.large || attr.posterImage?.original || '/placeholder-poster.png',
        extraLarge: attr.posterImage?.original || attr.posterImage?.large || '/placeholder-poster.png'
      },
      bannerImage: attr.coverImage?.large || attr.coverImage?.original || null,
      genres: [],
      score: score,
      type: format === 'MANHWA' ? 'Manhwa' : format === 'MANHUA' ? 'Manhua' : format === 'NOVEL' ? 'Novel' : 'Manga',
      status: attr.status === 'current' ? 'Publishing' : 'Finished',
      countryOfOrigin,
      chapters: attr.chapterCount || null,
      volumes: attr.volumeCount || null,
      relations: [],
      characters: [],
      recommendations: []
    };

    MANGA_DETAILS_CACHE.set(`kitsu-${cleanId}`, mangaData);
    MANGA_DETAILS_CACHE.set(cleanId, mangaData);
    return mangaData;
  } catch (err) {
    console.warn(`[Kitsu Manga Details Fail] ID ${id}:`, err);
    return null;
  }
}

// In-memory persistent cache for manga details to survive external API downtimes
const MANGA_DETAILS_CACHE = new Map<string, any>([
  ['105398', {
    mal_id: 121496,
    id: 105398,
    anilistId: 105398,
    title: 'Solo Leveling',
    title_english: 'Solo Leveling',
    title_japanese: '나 혼자만 레벨업',
    synopsis: 'Ten years ago, "the Gate" opened and connected the real world with the realm of magic and monsters. To combat these vile beasts, ordinary people received superhuman powers and became known as "Hunters." Twenty-year-old Sung Jin-Woo is one such Hunter, but he is known as the "World\'s Weakest," owing to his pathetic power compared to even a measly E-Rank.',
    images: {
      webp: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' },
      jpg: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' }
    },
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/105398-bCg73Vp7zM5M.jpg',
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 2, name: 'Adventure' }, { mal_id: 3, name: 'Fantasy' }],
    score: 8.4,
    type: 'Manhwa',
    status: 'Finished',
    countryOfOrigin: 'KR',
    chapters: 201,
    volumes: 14,
    relations: [],
    characters: [],
    recommendations: []
  }],
  ['121496', {
    mal_id: 121496,
    id: 105398,
    anilistId: 105398,
    title: 'Solo Leveling',
    title_english: 'Solo Leveling',
    title_japanese: '나 혼자만 레벨업',
    synopsis: 'Ten years ago, "the Gate" opened and connected the real world with the realm of magic and monsters. To combat these vile beasts, ordinary people received superhuman powers and became known as "Hunters." Twenty-year-old Sung Jin-Woo is one such Hunter, but he is known as the "World\'s Weakest," owing to his pathetic power compared to even a measly E-Rank.',
    images: {
      webp: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' },
      jpg: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' }
    },
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/105398-bCg73Vp7zM5M.jpg',
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 2, name: 'Adventure' }, { mal_id: 3, name: 'Fantasy' }],
    score: 8.4,
    type: 'Manhwa',
    status: 'Finished',
    countryOfOrigin: 'KR',
    chapters: 201,
    volumes: 14,
    relations: [],
    characters: [],
    recommendations: []
  }]
]);

export async function getMangaFullDetails(id: string) {
  const strId = String(id).trim();

  // 1. If Kitsu ID format
  if (strId.startsWith('kitsu-')) {
    const kitsuManga = await getKitsuMangaDetails(strId);
    if (kitsuManga) return kitsuManga;
  }

  // 2. Try AniList Direct Fetcher First
  try {
    const aniManga = await fetchAniListMangaDetails(strId);
    if (aniManga && isSafeContent(aniManga)) {
      MANGA_DETAILS_CACHE.set(strId, aniManga);
      if (aniManga.mal_id) MANGA_DETAILS_CACHE.set(String(aniManga.mal_id), aniManga);
      if (aniManga.anilistId) MANGA_DETAILS_CACHE.set(String(aniManga.anilistId), aniManga);
      return aniManga;
    }
  } catch (error) {
    console.warn(`[AniList Manga Fail] ID ${strId}:`, error);
  }

  // 3. Try mapped Kitsu ID if AniList is failing/403
  if (ANILIST_TO_KITSU_MAP[strId]) {
    try {
      const mappedKitsu = await getKitsuMangaDetails(ANILIST_TO_KITSU_MAP[strId]);
      if (mappedKitsu) return mappedKitsu;
    } catch {}
  }

  // 4. Try Kitsu by ID directly
  try {
    const kitsuManga = await getKitsuMangaDetails(strId);
    if (kitsuManga && isSafeContent(kitsuManga)) {
      return kitsuManga;
    }
  } catch {}

  // 5. Fallback to Jikan API
  try {
    const data = await fetchJikan(`/manga/${strId}/full`, GLOBAL_CACHE_TIME, 2500);
    const mangaData = data?.data;
    if (mangaData && isSafeContent(mangaData)) {
      MANGA_DETAILS_CACHE.set(strId, mangaData);
      return mangaData;
    }
  } catch {}

  // 6. Fallback to Persistent In-Memory Cache
  if (MANGA_DETAILS_CACHE.has(strId)) {
    return MANGA_DETAILS_CACHE.get(strId);
  }

  return null;
}

export async function getMangaCharacters(id: string) {
  // 1. Try AniList cached characters
  try {
    const aniManga = await fetchAniListMangaDetails(id);
    if (aniManga?.characters && aniManga.characters.length > 0) {
      return aniManga.characters;
    }
  } catch (error) {
    console.warn(`[AniList Manga Characters Fail] ID ${id}:`, error);
  }

  // 2. Fallback to Jikan API
  try {
    const data = await fetchJikan(`/manga/${id}/characters`, GLOBAL_CACHE_TIME, 2500);
    return data?.data || []; 
  } catch { 
    return []; 
  }
}

export async function getMangaRecommendations(id: string) {
  // 1. Try AniList recommendations
  try {
    const aniManga = await fetchAniListMangaDetails(id);
    if (aniManga?.recommendations && aniManga.recommendations.length > 0) {
      return aniManga.recommendations;
    }
  } catch (error) {
    console.warn(`[AniList Manga Recs Fail] ID ${id}:`, error);
  }

  // 2. Fallback to Jikan API
  try {
    const data = await fetchJikan(`/manga/${id}/recommendations`, GLOBAL_CACHE_TIME, 2500);
    return (data?.data || []).map((rec: any) => ({
      id: rec.entry.mal_id,
      idMal: rec.entry.mal_id,
      title: {
        romaji: rec.entry.title,
        english: rec.entry.title,
      },
      coverImage: {
        extraLarge: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url,
        large: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url,
      },
      format: 'MANGA',
    }));
  } catch (error) {
    console.error("Manga Recommendations API Error:", error);
    return [];
  }
}

export async function getAniListMangaExtraInfo(idMal: number): Promise<AniListExtra | null> {
  const query = `
    query ($id: Int) {
      Media(idMal: $id, type: MANGA, isAdult: false) {
        bannerImage
        relations {
          edges {
            relationType
            node { id idMal title { english romaji } coverImage { extraLarge large } format startDate { year month day } type isAdult genres }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { id: idMal });
    const extra = data.data?.Media as AniListExtra;
    if (extra?.relations?.edges) {
      extra.relations.edges = extra.relations.edges.filter((e: any) => e.node && isSafeContent(e.node));
    }
    return extra || null;
  } catch { 
    return null; 
  }
}

// 2. Trending Manga Spotlight Fetcher (For Top Hero Banner)
export async function getTrendingMangaSpotlight(): Promise<any[]> {
  const query = `
    query {
      Page(page: 1, perPage: 8) {
        media(type: MANGA, sort: TRENDING_DESC, isAdult: false, genre_not_in: ["Hentai"]) {
          id
          idMal
          title { english romaji native }
          coverImage { extraLarge large }
          bannerImage
          format
          status
          averageScore
          genres
          description
          seasonYear
          startDate { year }
          countryOfOrigin
          chapters
          volumes
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, {}, GLOBAL_CACHE_TIME, 3000);
    const media = data?.data?.Page?.media || [];
    return media.filter(isSafeContent).map((manga: any) => ({
      id: manga.idMal || manga.id,
      idMal: manga.idMal || manga.id,
      anilistId: manga.id,
      title: {
        romaji: manga.title?.romaji || manga.title?.english || 'Unknown Title',
        english: manga.title?.english || manga.title?.romaji || 'Unknown Title',
        native: manga.title?.native || ''
      },
      coverImage: {
        large: manga.coverImage?.extraLarge || manga.coverImage?.large || '/placeholder-poster.png',
        extraLarge: manga.coverImage?.extraLarge || manga.coverImage?.large || '/placeholder-poster.png',
      },
      bannerImage: manga.bannerImage || manga.coverImage?.extraLarge || null,
      averageScore: typeof manga.averageScore === 'number' ? manga.averageScore : null,
      format: manga.format ? manga.format.replace(/_/g, ' ') : 'MANGA',
      type: 'MANGA',
      status: manga.status === 'RELEASING' ? 'RELEASING' : 'FINISHED',
      seasonYear: manga.seasonYear || manga.startDate?.year || null,
      genres: manga.genres || [],
      description: manga.description || '',
      countryOfOrigin: manga.countryOfOrigin || 'JP',
      chapters: manga.chapters || null,
      volumes: manga.volumes || null
    }));
  } catch (error) {
    logError('getTrendingMangaSpotlight', error);
    return [];
  }
}

// 3. Kitsu High-Speed Manga Search Engine (100% Uptime & Comprehensive Webtoons/Manhwa/Manga)
export async function searchMangaKitsu(
  queryText = '', 
  page = 1, 
  type = '', 
  genre = '', 
  sort = 'popular',
  status = '',
  year: string | number = ''
) {
  const limit = 20;
  const offset = (page - 1) * limit;
  let url = `https://kitsu.io/api/edge/manga?page[limit]=${limit}&page[offset]=${offset}`;

  if (queryText && queryText.trim()) {
    url += `&filter[text]=${encodeURIComponent(queryText.trim())}`;
  } else {
    if (sort === 'score' || sort === 'top_rated') url += '&sort=-averageRating';
    else if (sort === 'newest' || sort === 'latest') url += '&sort=-startDate';
    else if (sort === 'title') url += '&sort=canonicalTitle';
    else url += '&sort=-userCount';
  }

  if (type) {
    const t = type.toLowerCase();
    if (t === 'manhwa') url += '&filter[subtype]=manhwa';
    else if (t === 'manhua') url += '&filter[subtype]=manhua';
    else if (t === 'novel' || t === 'lightnovel') url += '&filter[subtype]=novel';
    else if (t === 'manga') url += '&filter[subtype]=manga';
  }

  if (status) {
    if (status === 'releasing' || status === 'publishing') url += '&filter[status]=current';
    else if (status === 'finished' || status === 'completed') url += '&filter[status]=finished';
  }

  if (year) {
    url += `&filter[year]=${year}`;
  }

  if (genre) {
    url += `&filter[categories]=${encodeURIComponent(genre.split(',')[0].trim())}`;
  }

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/vnd.api+json' }, next: { revalidate: queryText ? 0 : GLOBAL_CACHE_TIME } });
    if (res.status !== 200) return null;
    const json = await res.json();

    const media = (json.data || []).map((item: any) => {
      const attr = item.attributes || {};
      const canonical = attr.canonicalTitle === 'Oemojisangjuui' ? 'Lookism' : attr.canonicalTitle;
      const titleEnglish = attr.titles?.en || attr.titles?.en_us || canonical || attr.titles?.en_jp || 'Unknown Title';
      const titleRomaji = attr.titles?.en_jp || canonical || titleEnglish;
      const format = (attr.subtype || 'manga').toUpperCase();
      const rawScore = attr.averageRating ? parseFloat(attr.averageRating) : null;
      const score = rawScore ? Math.round(rawScore) : null;

      return {
        id: `kitsu-${item.id}`,
        idMal: item.id,
        kitsuId: item.id,
        title: {
          english: titleEnglish,
          romaji: titleRomaji,
          native: attr.titles?.ja_jp || ''
        },
        coverImage: {
          large: attr.posterImage?.large || attr.posterImage?.original || '/placeholder-poster.png',
          extraLarge: attr.posterImage?.original || attr.posterImage?.large || '/placeholder-poster.png'
        },
        bannerImage: attr.coverImage?.large || attr.coverImage?.original || null,
        averageScore: score,
        format: format === 'MANHWA' ? 'MANHWA' : format === 'MANHUA' ? 'MANHUA' : format === 'NOVEL' ? 'NOVEL' : 'MANGA',
        type: 'MANGA',
        status: attr.status === 'current' ? 'RELEASING' : 'FINISHED',
        seasonYear: attr.startDate ? parseInt(attr.startDate.split('-')[0], 10) : null,
        genres: [],
        description: attr.synopsis || '',
        countryOfOrigin: format === 'MANHWA' ? 'KR' : format === 'MANHUA' ? 'CN' : 'JP',
        chapters: attr.chapterCount || null,
        volumes: attr.volumeCount || null
      };
    });

    return {
      media,
      pageInfo: {
        total: json.meta?.count || media.length,
        currentPage: page,
        lastPage: Math.ceil((json.meta?.count || 24) / limit),
        hasNextPage: Boolean(json.links?.next)
      }
    };
  } catch (err) {
    console.warn('[Kitsu Manga Search Fail]:', err);
    return null;
  }
}

// 4. AniList High-Speed Manga Search Engine (With Format, Genre, Status, Year & Sort Filters - Hentai Blocked)
export async function searchMangaAniList(
  queryText = '', 
  page = 1, 
  type = '', 
  genre = '', 
  sort = 'popular',
  status = '',
  year: string | number = ''
) {
  let queryArgs = `$page: Int, $perPage: Int`;
  let mediaArgs = `type: MANGA, isAdult: false, genre_not_in: ["Hentai"]`;
  const perPage = queryText.trim() ? 50 : 24;
  const variables: Record<string, any> = { page, perPage };

  let format: string | null = null;
  let country: string | null = null;

  const cleanType = (type || '').toLowerCase();
  if (cleanType === 'novel' || cleanType === 'lightnovel' || cleanType === 'light novel') {
    format = 'NOVEL';
  } else if (cleanType === 'manhwa') {
    country = 'KR';
  } else if (cleanType === 'manhua') {
    country = 'CN';
  } else if (cleanType === 'manga') {
    format = 'MANGA';
    country = 'JP';
  }

  if (format) {
    queryArgs += `, $format: MediaFormat`;
    mediaArgs += `, format: $format`;
    variables.format = format;
  }

  if (country) {
    queryArgs += `, $country: CountryCode`;
    mediaArgs += `, countryOfOrigin: $country`;
    variables.country = country;
  }

  let sortEnum = 'POPULARITY_DESC';
  if (sort === 'trending') sortEnum = 'TRENDING_DESC';
  else if (sort === 'score' || sort === 'top_rated') sortEnum = 'SCORE_DESC';
  else if (sort === 'newest' || sort === 'latest') sortEnum = 'START_DATE_DESC';
  else if (sort === 'updated') sortEnum = 'UPDATED_AT_DESC';
  else if (sort === 'chapters') sortEnum = 'CHAPTERS_DESC';
  else if (sort === 'title' || sort === 'title_asc') sortEnum = 'TITLE_ENGLISH';

  queryArgs += `, $sort: [MediaSort]`;
  mediaArgs += `, sort: $sort`;
  variables.sort = [sortEnum];

  let statusEnum: string | null = null;
  const cleanStatus = (status || '').toLowerCase();
  if (cleanStatus === 'publishing' || cleanStatus === 'releasing') statusEnum = 'RELEASING';
  else if (cleanStatus === 'finished' || cleanStatus === 'completed') statusEnum = 'FINISHED';
  else if (cleanStatus === 'hiatus') statusEnum = 'HIATUS';

  if (statusEnum) {
    queryArgs += `, $status: MediaStatus`;
    mediaArgs += `, status: $status`;
    variables.status = statusEnum;
  }

  // Support single or comma-separated multiple genres
  if (genre && genre.trim()) {
    const rawList = genre.split(',').map(g => g.trim()).filter(g => g.toLowerCase() !== 'hentai');
    if (rawList.length > 0) {
      queryArgs += `, $genre: [String]`;
      mediaArgs += `, genre_in: $genre`;
      variables.genre = rawList;
    }
  }

  // Support release year
  if (year) {
    const numYear = parseInt(String(year), 10);
    if (!isNaN(numYear) && numYear > 1950) {
      queryArgs += `, $seasonYear: Int`;
      mediaArgs += `, seasonYear: $seasonYear`;
      variables.seasonYear = numYear;
    }
  }

  const query = `
    query (${queryArgs}) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media(${mediaArgs}) {
          id
          idMal
          title { english romaji native }
          coverImage { extraLarge large }
          format
          status
          averageScore
          genres
          description
          seasonYear
          startDate { year month day }
          countryOfOrigin
          chapters
          volumes
          synonyms
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(query, variables, GLOBAL_CACHE_TIME, 3000);
    const pageData = data?.data?.Page;
    if (!pageData || !pageData.media) return null;

    let rawMedia = (pageData.media || []).filter(isSafeContent);

    // Smart fuzzy text search matching across English, Romaji, Native title and synonyms
    if (queryText && queryText.trim()) {
      const q = queryText.toLowerCase().trim();
      const qTokens = q.split(/\s+/).filter(Boolean);

      rawMedia = rawMedia.filter((m: any) => {
        const eng = (m.title?.english || '').toLowerCase();
        const rom = (m.title?.romaji || '').toLowerCase();
        const nat = (m.title?.native || '').toLowerCase();
        const syns = (m.synonyms || []).map((s: string) => s.toLowerCase());

        const fullText = `${eng} ${rom} ${nat} ${syns.join(' ')}`;
        return qTokens.every(token => fullText.includes(token));
      });
    }

    const transformedMedia = rawMedia.map((manga: any) => ({
      id: manga.id,
      idMal: manga.idMal || manga.id,
      anilistId: manga.id,
      title: {
        romaji: manga.title?.romaji || manga.title?.english || 'Unknown Title',
        english: manga.title?.english || manga.title?.romaji || 'Unknown Title',
        native: manga.title?.native || ''
      },
      coverImage: {
        large: manga.coverImage?.extraLarge || manga.coverImage?.large || '/placeholder-poster.png',
        extraLarge: manga.coverImage?.extraLarge || manga.coverImage?.large || '/placeholder-poster.png',
      },
      averageScore: typeof manga.averageScore === 'number' ? manga.averageScore : null,
      format: manga.format ? manga.format.replace(/_/g, ' ') : 'MANGA',
      type: 'MANGA',
      status: manga.status === 'RELEASING' ? 'RELEASING' : 'FINISHED',
      seasonYear: manga.seasonYear || manga.startDate?.year || null,
      genres: (manga.genres || []).filter((g: string) => g.toLowerCase() !== 'hentai'),
      description: manga.description || '',
      countryOfOrigin: manga.countryOfOrigin || 'JP',
      chapters: manga.chapters || null,
      volumes: manga.volumes || null
    }));

    return {
      media: transformedMedia,
      pageInfo: {
        total: pageData.pageInfo?.total || transformedMedia.length,
        currentPage: page,
        lastPage: pageData.pageInfo?.lastPage || 1,
        hasNextPage: pageData.pageInfo?.hasNextPage || false
      }
    };
  } catch (error) {
    logError('searchMangaAniList', error);
    return null;
  }
}

// searchMangaJikan queries Kitsu for search queries with fallbacks to AniList & Jikan
export async function searchMangaJikan(
  queryText: string, 
  page = 1, 
  type = '', 
  genre = '', 
  sort = 'popular',
  status = '',
  year: string | number = ''
) {
  // If user searched for a specific text title (e.g. "Lookism", "Solo Leveling", "Wind Breaker"):
  if (queryText && queryText.trim()) {
    try {
      const kitsuResult = await searchMangaKitsu(queryText, page, type, genre, sort, status, year);
      if (kitsuResult && kitsuResult.media && kitsuResult.media.length > 0) {
        return kitsuResult;
      }
    } catch (e) {
      console.warn('[Kitsu Manga Search Fail]:', e);
    }
  }

  // 1. Try AniList Manga Search (Primary High-Speed Browse Engine)
  try {
    const aniResult = await searchMangaAniList(queryText, page, type, genre, sort, status, year);
    if (aniResult && aniResult.media && aniResult.media.length > 0) {
      return aniResult;
    }
  } catch (error) {
    console.warn('[AniList Manga Search Fail]:', error);
  }

  // 2. Fallback to Kitsu for browse
  try {
    const kitsuResult = await searchMangaKitsu(queryText, page, type, genre, sort, status, year);
    if (kitsuResult && kitsuResult.media && kitsuResult.media.length > 0) {
      return kitsuResult;
    }
  } catch (e) {
    console.warn('[Kitsu Manga Fallback Fail]:', e);
  }

  // 3. Fallback to Jikan Manga Search (Strict SFW)
  const queryParams = new URLSearchParams();
  if (queryText.trim()) {
    queryParams.append('q', queryText.trim());
  } else {
    queryParams.append('order_by', sort === 'score' ? 'score' : sort === 'newest' ? 'start_date' : sort === 'title' ? 'title' : 'popularity');
    queryParams.append('sort', sort === 'title' ? 'asc' : 'desc');
  }
  queryParams.append('page', page.toString());
  queryParams.append('limit', '24');
  queryParams.append('sfw', 'true');
  queryParams.append('genres_exclude', '12,49'); // Exclude Hentai and Erotica
  
  if (type) {
    queryParams.append('type', type);
  }
  if (status) {
    queryParams.append('status', status === 'releasing' ? 'publishing' : status === 'finished' ? 'complete' : status);
  }

  const endpoint = `/manga?${queryParams.toString()}`;
  const revalidate = queryText.trim() ? 0 : GLOBAL_CACHE_TIME;
  
  try {
    const data = await fetchJikan(endpoint, revalidate, 2500);
    if (!data) return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
    
    const transformedMedia = (data.data || [])
      .filter(isSafeContent)
      .map((manga: any) => ({
        id: manga.mal_id,
        idMal: manga.mal_id,
        title: {
          romaji: manga.title || manga.title_english,
          english: manga.title_english || manga.title,
        },
        coverImage: {
          large: manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url,
          extraLarge: manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url,
        },
        averageScore: typeof manga.score === 'number' && !isNaN(manga.score) ? Math.round(manga.score * 10) : null,
        format: manga.type,
        type: 'MANGA',
        status: manga.publishing ? 'RELEASING' : 'FINISHED',
        seasonYear: manga.published?.prop?.from?.year || null,
        genres: (manga.genres || []).filter((g: any) => g.name.toLowerCase() !== 'hentai').map((g: any) => g.name),
      }));

    return {
      media: transformedMedia,
      pageInfo: {
        total: data.pagination?.items?.total || 0,
        currentPage: page,
        lastPage: data.pagination?.last_visible_page || 1,
        hasNextPage: data.pagination?.has_next_page || false,
      }
    };
  } catch (error) {
    console.error("Error in searchMangaJikan:", error);
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  }
}

// ৭. Top Movies (For Homepage Lists)
export async function getTopMoviesAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 4) {
        media(sort: SCORE_DESC, type: ANIME, format: MOVIE, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } averageScore format status episodes seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৮. Top TV Series (For Homepage Lists)
export async function getTopTVSeriesAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 4) {
        media(sort: SCORE_DESC, type: ANIME, format: TV, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } averageScore format status episodes seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ৯. Year Awards/Contenders (For Homepage Lists)
export async function getYearAwardsAniList(year: number): Promise<AniListMedia[]> {
  const query = `
    query ($year: Int) {
      Page(page: 1, perPage: 4) {
        media(seasonYear: $year, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } averageScore format status episodes seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { year });
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// Anime Not For Kids Curated List (25 titles)
export async function getNotForKidsAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 25) {
        media(id_in: $ids, type: ANIME) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  const ids = [
    1570, 137909, 101367, 170890, 21613, 153845, 147571, 10087, 136707, 166828,
    138522, 156039, 111322, 169417, 130586, 146065, 6682, 1292, 153629, 21131,
    129898, 166372, 144553, 155011, 103632
  ];
  try {
    const data = await fetchAniList(query, { ids });
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// Kickstart Your Anime Journey Curated List (25 titles)
export async function getKickstartJourneyAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 25) {
        media(id_in: $ids, type: ANIME) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  const ids = [
    154587, 5114, 16498, 1535, 108465, 113415, 11061, 20954, 21519, 9253,
    199, 140960, 150672, 21459, 112641, 127230, 21087, 101922, 21234, 20464,
    97986, 101348, 1575, 19, 1
  ];
  try {
    const data = await fetchAniList(query, { ids });
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// The Shounen Zone (Fetches top popular Shounen anime)
export async function getShounenZoneAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 40) {
        media(tag: "Shounen", sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// The Sports Zone (Fetches top popular Sports anime)
export async function getSportsZoneAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 40) {
        media(genre: "Sports", sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// Inspired by Sword Art Online (Fetches recommendations for SAO: 11757)
export async function getSimilarToSAOAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        recommendations(page: 1, perPage: 40, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
            }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { id: 11757 });
    const mediaList = (data.data?.Media?.recommendations?.nodes || [])
      .map((node: any) => node.mediaRecommendation)
      .filter((media: any) => media !== null && media !== undefined);
    return mediaList as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// The Fantasy Zone (Fetches top popular Fantasy anime)
export async function getFantasyZoneAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 40) {
        media(genre: "Fantasy", sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// Supernatural World (Fetches top popular Supernatural anime)
export async function getSupernaturalWorldAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 40) {
        media(genre: "Supernatural", sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// Seasonal Romance Anime (Fetches top popular Romance anime from a given season and year)
export async function getSeasonalRomanceAnimeAniList(year: number, season: string): Promise<AniListMedia[]> {
  const query = `
    query ($year: Int, $season: MediaSeason) {
      Page(page: 1, perPage: 20) {
        media(genre: "Romance", seasonYear: $year, season: $season, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { year, season });
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// Sci-Fi Anime (Fetches top popular Sci-Fi anime)
export async function getSciFiAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 40) {
        media(genre: "Sci-Fi", sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// Evergreen Anime Curated List (25 titles)
export async function getEvergreenAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 25) {
        media(id_in: $ids, type: ANIME) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  const ids = [
    1889, 20665, 120, 21420, 2001, 269, 20755, 101190, 918, 5114, 
    9253, 11061, 1535, 1575, 4181, 1, 19, 4224, 20464, 21507, 
    205, 30, 9989, 8769, 270
  ];
  try {
    const data = await fetchAniList(query, { ids });
    const mediaList = data.data.Page.media as AniListMedia[];
    
    // Sort mediaList by the order of IDs in the array to preserve user preference
    return mediaList.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  } catch {
    return [] as AniListMedia[];
  }
}

// Must Watch For My Hero Academia Fans (Fetches recommendations for MHA: 21459)
export async function getSimilarToMHAAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        recommendations(page: 1, perPage: 40, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
            }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { id: 21459 });
    const mediaList = (data.data?.Media?.recommendations?.nodes || [])
      .map((node: any) => node.mediaRecommendation)
      .filter((media: any) => media !== null && media !== undefined);
    return mediaList as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}

// Hidden Gems Curated List (20 titles including Makoto Shinkai movies and underrated gems)
export async function getHiddenGemsAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 20) {
        media(id_in: $ids, type: ANIME) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;
  const ids = [
    21519, 106286, 145904, 1689, 16782, 9760, 433, 256, 10516, 20972, 
    20607, 98707, 7785, 2246, 3297, 457, 10165, 109268, 16664, 5681
  ];
  try {
    const data = await fetchAniList(query, { ids });
    const mediaList = data.data.Page.media as AniListMedia[];
    
    // Sort mediaList by the order of IDs in the array to preserve user preference
    return mediaList.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  } catch {
    return [] as AniListMedia[];
  }
}







