/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts
import { logError } from './logger';
import { DEFAULT_GENRES_LIST } from './genres-data';
import { toEnglishTitle } from './titleCleaner';
import { 
  getOfficialMALAnimeDetails, 
  getOfficialMALRecommendations, 
  getOfficialMALRankings, 
  searchOfficialMAL 
} from './mal-api';

export { 
  getOfficialMALAnimeDetails, 
  getOfficialMALRecommendations, 
  getOfficialMALRankings, 
  searchOfficialMAL 
};

const ANILIST_API_URL = 'https://graphql.anilist.co';
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://animenationindia.onrender.com');
const ANILIST_PROXY_URL = `${BACKEND_BASE_URL}/api/anilist/proxy`;

// ─── Curated Sections Helper (Loaded from MongoDB Atlas with 1-Hour ISR) ─────
export async function fetchCuratedSectionFromAtlas(sectionKey: string): Promise<AniListMedia[]> {
  const tryFetch = async (url: string) => {
    try {
      const res = await fetch(`${url}/api/curated/${sectionKey}`, {
        next: { revalidate: 3600 },
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data as AniListMedia[];
        }
      }
    } catch {}
    return null;
  };

  const primary = await tryFetch(BACKEND_BASE_URL);
  if (primary && primary.length > 0) return primary;

  // Fallback to localhost:5000 if BACKEND_BASE_URL is not localhost
  if (!BACKEND_BASE_URL.includes('localhost') && !BACKEND_BASE_URL.includes('127.0.0.1')) {
    const localFallback = await tryFetch('http://localhost:5000');
    if (localFallback && localFallback.length > 0) return localFallback;
  }

  return [];
}

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

export async function fetchAniList(query: string, variables: any = {}, revalidate = GLOBAL_CACHE_TIME, timeoutMs = 2500) {
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const targetUrl = ANILIST_PROXY_URL;
    const fallbackUrl = ANILIST_API_URL;

    try {
      // 1. Try Backend AniList Proxy (Primary)
      let res = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
        cache: 'no-store'
      }).catch(() => null);

      // 2. Direct AniList Fallback with origin headers (if backend fails)
      if ((!res || res.status === 403 || res.status >= 500 || !res.ok) && targetUrl !== fallbackUrl) {
        try {
          res = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'https://anilist.co',
              'Referer': 'https://anilist.co/'
            },
            body: JSON.stringify({ query, variables }),
            signal: controller.signal,
            cache: 'no-store'
          }).catch(() => null);
        } catch {}
      }
      clearTimeout(timer);

      if (!res || res.status === 429 || res.status === 403 || !res.ok) {
        if (cached) return cached.data;
        return null;
      }

      const data = await res.json();
      if (data.errors && data.errors.length > 0) {
        if (cached) return cached.data;
        return null;
      }

      if (data && data.data) {
        apiMemoryCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data;
    } catch (error: any) {
      clearTimeout(timer);
      if (cached) return cached.data;
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
          mal_id: edge.node?.id ? `al-${edge.node.id}` : 0,
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
              mal_id: japaneseVA.id ? `al-${japaneseVA.id}` : 0,
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
        mal_id: rec.idMal || (rec.id ? `al-${rec.id}` : null),
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
    native?: string | null;
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
  broadcast?: {
    day_of_the_week?: string;
    start_time?: string;
  } | null;
  isAiringToday?: boolean;
  airingDay?: string | null;
  airingTime?: string | null;
  isDubbed?: boolean;
  trailer?: {
    id: string | null;
    site: string | null;
    thumbnail?: string | null;
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

// ─── High-Speed Backend BFF Helper with Official MAL v2 5-Key Pool ───────────
export async function fetchBFF<T>(endpoint: string, revalidate = 1800, timeoutMs = 4000): Promise<T | null> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cacheKey = `bff:${cleanEndpoint}`;

  const cached = apiMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < MEMORY_CACHE_TTL) && revalidate !== 0) {
    return cached.data as T;
  }

  const tryFetch = async (baseUrl: string) => {
    try {
      const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
        next: { revalidate },
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (res.ok) {
        const json = await res.json();
        if (json && (json.success !== false || json.data !== undefined)) {
          return (json.data !== undefined ? json.data : json) as T;
        }
      }
    } catch {}
    return null;
  };

  let data = await tryFetch(BACKEND_BASE_URL);
  if (!data && !BACKEND_BASE_URL.includes('localhost') && !BACKEND_BASE_URL.includes('127.0.0.1')) {
    data = await tryFetch('http://localhost:5000');
  }

  if (data) {
    apiMemoryCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  return null;
}

export function formatToAniListMedia(item: any): AniListMedia {
  if (!item) return null as any;
  const id = item.id || item.mal_id || item.idMal;
  const rawEnglish = item.title?.english || item.title_english || (typeof item.title === 'string' ? item.title : null) || item.title?.romaji || item.title_japanese || 'Anime';
  const rawRomaji = item.title?.romaji || item.title_japanese || rawEnglish || (typeof item.title === 'string' ? item.title : 'Anime');
  
  const englishTitle = toEnglishTitle(rawEnglish);
  const romajiTitle = toEnglishTitle(rawRomaji);

  const coverUrl = item.coverImage?.extraLarge || item.coverImage?.large || item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || item.images?.webp?.image_url || item.images?.jpg?.image_url || '/placeholder-poster.png';
  const bannerUrl = item.bannerImage || item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || coverUrl;
  const score = item.averageScore || (typeof item.score === 'number' ? Math.round(item.score * 10) : (typeof item.mean === 'number' ? Math.round(item.mean * 10) : null));
  const genres = Array.isArray(item.genres) 
    ? item.genres.map((g: any) => (typeof g === 'string' ? g : (g.name || '')))
    : [];

  return {
    id: Number(id),
    idMal: Number(item.idMal || item.mal_id || id),
    title: {
      english: englishTitle,
      romaji: romajiTitle
    },
    coverImage: {
      extraLarge: coverUrl,
      large: coverUrl
    },
    bannerImage: bannerUrl,
    description: item.description || item.synopsis || null,
    episodes: item.episodes || item.num_episodes || null,
    format: item.format || item.type || 'TV',
    status: item.status || 'FINISHED',
    averageScore: score,
    genres: genres.filter(Boolean),
    seasonYear: item.seasonYear || item.year || (item.start_date ? new Date(item.start_date).getFullYear() : null),
    startDate: item.startDate || (item.start_date ? { year: new Date(item.start_date).getFullYear() } : null)
  };
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
    const [p1, p2] = await Promise.all([
      fetchAniList(query, { page: 1, start, end }, 3600, 2500),
      fetchAniList(query, { page: 2, start, end }, 3600, 2500)
    ]);

    const s1 = p1?.data?.Page?.airingSchedules || [];
    const s2 = p2?.data?.Page?.airingSchedules || [];
    const combined = [...s1, ...s2];
    if (combined.length > 0) return combined;
  } catch {}

  // Fallback 1: Live Backend Normalized Schedule Engine (MongoDB Atlas)
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/schedule?start=${start}&end=${end}`, {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {}

  return [];
}

// ১. আজকের রিলিজ (Airing Today)
export async function getTodayReleasesAniList(page = 1) {
  const start = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const end = Math.floor(new Date().setHours(23, 59, 59, 999) / 1000);
  const now = Math.floor(Date.now() / 1000);

  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage currentPage lastPage total }
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
    const data = await fetchAniList(query, { page, start, end });
    if (data?.data?.Page?.airingSchedules?.length > 0) {
      return data.data.Page;
    }
  } catch {}

  // Fallback: MongoDB Atlas Trending Airing Collection (/api/trending)
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/trending`, {
      next: { revalidate: 3600 },
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return {
          pageInfo: { hasNextPage: false, currentPage: 1, lastPage: 1, total: json.data.length },
          airingSchedules: json.data.map((item: any, idx: number) => ({
            id: item.mal_id,
            airingAt: now - idx * 3600,
            episode: (idx % 12) + 1,
            media: {
              id: item.mal_id,
              idMal: item.mal_id,
              title: { english: item.title_english || item.title, romaji: item.title },
              coverImage: {
                extraLarge: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
                large: item.images?.jpg?.large_image_url
              },
              episodes: 12,
              format: 'TV',
              status: 'Releasing',
              genres: (item.genres || []).map((g: any) => typeof g === 'string' ? g : g.name),
              seasonYear: new Date().getFullYear()
            }
          }))
        };
      }
    }
  } catch {}

  return { airingSchedules: [] as AiringSchedule[], pageInfo: { hasNextPage: false, currentPage: 1, lastPage: 1, total: 0 } };
}

// ১.১ Past Week Releases
export async function getPastWeekReleasesAniList(page = 1) {
  const end = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const start = end - (7 * 24 * 60 * 60);

  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage currentPage lastPage total }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_DESC) {
          episode media { id idMal title { english romaji } coverImage { extraLarge large } episodes format status genres seasonYear }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { page, start, end });
    if (data?.data?.Page?.airingSchedules?.length > 0) {
      return data.data.Page;
    }
  } catch {}



  // Resilient Fallback 2: Atlas curated 'trending'
  const trendingAtlas = await fetchCuratedSectionFromAtlas('trending');
  if (trendingAtlas.length > 0) {
    return {
      pageInfo: { hasNextPage: false, currentPage: 1, lastPage: 1, total: trendingAtlas.length },
      airingSchedules: trendingAtlas.slice(0, 24).map((m: any) => ({
        episode: m.episodes || 12,
        media: m
      }))
    };
  }

  return { airingSchedules: [] as AiringSchedule[], pageInfo: { hasNextPage: false, currentPage: 1, lastPage: 1, total: 0 } };
}

// ১.২ Past Month Releases
export async function getPastMonthReleasesAniList(page = 1) {
  const end = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000) - (7 * 24 * 60 * 60);
  const start = end - (30 * 24 * 60 * 60);

  const query = `
    query ($page: Int, $start: Int, $end: Int) {
      Page(page: $page, perPage: 24) {
        pageInfo { hasNextPage currentPage lastPage total }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME_DESC) {
          episode media { id idMal title { english romaji } coverImage { extraLarge large } episodes format status genres seasonYear }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { page, start, end });
    if (data?.data?.Page?.airingSchedules?.length > 0) {
      return data.data.Page;
    }
  } catch {}

  // Resilient Fallback: Atlas curated 'popular' & 'kickstart'
  const popularAtlas = await fetchCuratedSectionFromAtlas('popular');
  const kickstartAtlas = await fetchCuratedSectionFromAtlas('kickstart');
  const combined = [...popularAtlas, ...kickstartAtlas];
  if (combined.length > 0) {
    return {
      pageInfo: { hasNextPage: false, currentPage: 1, lastPage: 1, total: combined.length },
      airingSchedules: combined.slice(0, 24).map((m: any) => ({
        episode: m.episodes || 24,
        media: m
      }))
    };
  }

  return { airingSchedules: [] as AiringSchedule[], pageInfo: { hasNextPage: false, currentPage: 1, lastPage: 1, total: 0 } };
}

// ২. Top Rated / All-Time Popular Anime (Primary: BFF / Official MAL v2, Backup: AniList / Jikan)
export async function getTopAnimeAniList(): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/all?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  const query = `
    query {
      Page(page: 1, perPage: 12) {
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } averageScore format status episodes seasonYear genres description
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    if (data?.data?.Page?.media && data.data.Page.media.length > 0) {
      return data.data.Page.media as AniListMedia[];
    }
  } catch {}

  try {
    const malData = await getOfficialMALRankings('bypopularity', 12);
    if (malData && malData.length > 0) return malData;
  } catch {}

  return [] as AniListMedia[];
}

// ৩. Trending Anime (Updated for Home Page Grid)
export async function getTrendingAnimeAniList(limit: number = 10): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>(`/api/trending?limit=${limit}`);
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.slice(0, limit).map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  try {
    const malData = await fetchBFF<any[]>(`/api/anime/ranking/airing?limit=${limit}`);
    if (malData && Array.isArray(malData) && malData.length > 0) {
      return malData.slice(0, limit).map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

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
    const mediaList = data?.data?.Page?.media as AniListMedia[];
    if (mediaList && mediaList.length > 0) {
      return mediaList.slice(0, limit);
    }
  } catch {}

  return [] as AniListMedia[];
}

// ৩.২ Popular Anime Page (With Pagination)
export async function getPopularAnimePageAniList(page: number = 1): Promise<{ media: AniListMedia[], pageInfo: any }> {
  try {
    const offset = (page - 1) * 24;
    const bffData = await fetchBFF<any[]>(`/api/anime/ranking/bypopularity?limit=24&offset=${offset}`);
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      const media = bffData.map(formatToAniListMedia).filter(Boolean);
      return {
        media,
        pageInfo: {
          total: 500,
          currentPage: page,
          lastPage: 20,
          hasNextPage: page < 20,
          perPage: 24
        }
      };
    }
  } catch {}

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
    if (data?.data?.Page?.media?.length > 0) {
      return {
        media: data.data.Page.media as AniListMedia[],
        pageInfo: data.data.Page.pageInfo
      };
    }
  } catch {}

  return { media: [], pageInfo: { currentPage: 1, lastPage: 1, hasNextPage: false, total: 0 } };
}


// ৩.১ Top Airing Anime (For Hero Slider: Primary BFF / Official MAL v2 Airing + AniList Fallback)
export async function getTopAiringAnimeAniList(): Promise<AniListMedia[]> {
  const tryFetch = async (url: string) => {
    try {
      const res = await fetch(`${url}/api/hero`, {
        next: { revalidate: 900 },
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          return list as AniListMedia[];
        }
      }
    } catch {}
    return null;
  };

  const primary = await tryFetch(BACKEND_BASE_URL);
  if (primary && primary.length > 0) return primary;

  if (!BACKEND_BASE_URL.includes('localhost') && !BACKEND_BASE_URL.includes('127.0.0.1')) {
    const localFallback = await tryFetch('http://localhost:5000');
    if (localFallback && localFallback.length > 0) return localFallback;
  }

  const query = `
    query {
      Page(page: 1, perPage: 25) { 
        media(sort: [TRENDING_DESC, POPULARITY_DESC], status: RELEASING, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
          trailer { id site }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query);
    const mediaList = data?.data?.Page?.media as AniListMedia[];
    if (mediaList && mediaList.length > 0) {
      const animeWithBanners = mediaList.filter((anime) => anime.bannerImage !== null);
      if (animeWithBanners.length > 0) {
        return animeWithBanners.slice(0, 10);
      }
      return mediaList.slice(0, 10);
    }
  } catch {}

  return [] as AniListMedia[];
}

// ─── AniList Extra Info Query ───────────────────────────────────────────────
export async function getAniListExtraInfo(idMalOrAniId: number): Promise<any | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title { romaji english native }
        coverImage { extraLarge large medium }
        bannerImage
        description
        averageScore
        episodes
        format
        status
        seasonYear
        genres
        trailer { id site thumbnail }
        studios(isMain: true) { nodes { name } }
        relations {
          edges {
            relationType
            node { id idMal title { english romaji } coverImage { large } format startDate { year month day } type }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { id: idMalOrAniId });
    if (data?.data?.Media) return data.data.Media;
  } catch {}
  return null;
}

// ─── Anime Episodes Fetcher (BFF Cached) ──────────────────────────────────
export async function getAnimeEpisodes(id: string | number): Promise<any[]> {
  const numId = Number(id);
  if (!numId || isNaN(numId)) return [];
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/anime/${numId}/episodes`, {
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) return json.data;
    }
  } catch {}
  return [];
}

// ৪. Details Page এর জন্য Full Info (BFF / Official MAL -> AniList -> Jikan)
export async function getAnimeFullDetails(id: string) {
  const strId = String(id).trim();
  const numId = Number(strId);
  const isAnilistPrefixed = strId.startsWith('al-');
  const isAnilistNumeric = !isNaN(numId) && numId > 65000;
  const isMalNumeric = !isNaN(numId) && numId > 0 && numId <= 65000;

  // CASE 1: Backend BFF First for MAL Numeric IDs
  if (isMalNumeric) {
    // 1. Tier 1: Backend BFF API (Official MAL v2 with 5-Key Pool)
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/api/anime/${numId}`, {
        signal: AbortSignal.timeout(3500),
        next: { revalidate: GLOBAL_CACHE_TIME }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data && isSafeContent(json.data)) {
          return json.data;
        }
      }
    } catch {}

    // 2. Direct Official MAL module fallback
    try {
      const malOfficial = await getOfficialMALAnimeDetails(numId);
      if (malOfficial && isSafeContent(malOfficial)) {
        return malOfficial;
      }
    } catch {}

    // 3. AniList Direct Query
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
          genres: (extra.genres || []).map((g: any) => ({ name: typeof g === 'string' ? g : (g.name || '') })),
          year: extra.seasonYear || null,
          trailer: extra.trailer,
          studios: extra.studios
        };
      }
    } catch {}
  }

  // CASE 2: AniList ID (al- prefix OR numeric > 65000)
  if (isAnilistPrefixed || isAnilistNumeric) {
    const anilistId = isAnilistPrefixed ? Number(strId.replace('al-', '')) : numId;
    if (!isNaN(anilistId) && anilistId > 0) {
      try {
        const extra = await getAniListExtraInfo(anilistId);
        if (extra && isSafeContent(extra)) {
          if (extra.idMal && extra.idMal <= 65000) {
            try {
              const malOfficial = await getOfficialMALAnimeDetails(extra.idMal);
              if (malOfficial && isSafeContent(malOfficial)) {
                if (extra.bannerImage && !malOfficial.bannerImage) {
                  malOfficial.bannerImage = extra.bannerImage;
                }
                return malOfficial;
              }
            } catch {}
          }

          return {
            mal_id: extra.idMal || `al-${anilistId}`,
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
            genres: (extra.genres || []).map((g: any) => ({ name: typeof g === 'string' ? g : (g.name || '') })),
            year: extra.seasonYear || null,
            trailer: extra.trailer,
            studios: extra.studios
          };
        }
      } catch {}
    }
  }

  return null;
}

// ৫. ক্যারেক্টার ও ভয়েস অ্যাক্টর (Multi-Tier: Backend/AniList)
export async function getAnimeCharacters(id: string | number, anilistId?: number): Promise<any[]> {
  const numMalId = Number(id);
  const resolvedAniListId = anilistId || numMalId;

  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/anime/${id}/characters`, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch {}

  const fallback = await fetchAniListCharactersFallback(resolvedAniListId);
  return fallback || [];
}

// ৭. নতুন রিলিজ ও ট্রেন্ডিং
export async function getLatestReleasesAniList(): Promise<AniListMedia[]> {
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
    if (data?.data?.Page?.media) return data.data.Page.media as AniListMedia[];
  } catch {}

  return [] as AniListMedia[];
}

// ৭.১ Current Season (Simulcast: Primary BFF / Official MAL v2 Airing + AniList Fallback)
export async function getCurrentSeasonAniList(): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/airing?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

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
    if (data?.data?.Page?.media) return data.data.Page.media as AniListMedia[];
  } catch {}

  return [] as AniListMedia[];
}

// ৮. Upcoming (Next Season: Primary BFF / Official MAL v2 Upcoming + AniList Fallback)
export async function getUpcomingAnimeAniList(): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/upcoming?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

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
    if (data?.data?.Page?.media) return data.data.Page.media as AniListMedia[];
  } catch {}

  return [] as AniListMedia[];
}

// ৯. Popular Dubbed (Primary BFF / Official MAL v2 bypopularity + AniList Fallback)
export async function getPopularDubbedAniList(): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>('/api/dubbed?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  try {
    const malData = await fetchBFF<any[]>('/api/anime/ranking/bypopularity?limit=24');
    if (malData && Array.isArray(malData) && malData.length > 0) {
      return malData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

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
    if (data?.data?.Page?.media) return data.data.Page.media as AniListMedia[];
  } catch {}

  return [] as AniListMedia[];
}

// ১০. Top Characters
export async function getTopCharactersAniList(page: number = 1): Promise<CharacterItem[]> {
  try {
    const bffData = await fetchBFF<any[]>(`/api/characters/top?page=${page}&limit=24`);
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map((c: any) => ({
        id: c.id || c.mal_id,
        name: { full: c.name?.full || c.name || 'Character' },
        image: { large: c.image?.large || c.images?.jpg?.image_url || '/placeholder-poster.png' },
        favourites: c.favourites || c.favorites || 10000
      }));
    }
  } catch {}

  const query = `query($page:Int){Page(page:$page,perPage:24){characters(sort:FAVOURITES_DESC){id name{full} image{large} favourites}}}`;
  try {
    const data = await fetchAniList(query, { page });
    if (data?.data?.Page?.characters?.length > 0) {
      return data.data.Page.characters as CharacterItem[];
    }
  } catch {}

  return (await getTopCharactersJikan()) as CharacterItem[];
}

// ১১. Top Staff
export async function getTopStaffAniList(page: number = 1): Promise<StaffItem[]> {
  const query = `query($page:Int){Page(page:$page,perPage:24){staff(sort:FAVOURITES_DESC){id name{full} image{large} favourites}}}`;
  try {
    const data = await fetchAniList(query, { page });
    if (data?.data?.Page?.staff?.length > 0) {
      return data.data.Page.staff as StaffItem[];
    }
  } catch {}

  return (await getTopPeopleJikan()) as StaffItem[];
}

// ১৩. Search Anime (With Pagination: Primary BFF / Official MAL v2 + AniList Fallback)
export async function searchAnimeAniList(queryText: string, page: number = 1) {
  try {
    const bffData = await fetchBFF<any[]>(`/api/anime/search/query?q=${encodeURIComponent(queryText)}&limit=24`);
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      const media = bffData.map(formatToAniListMedia).filter(Boolean);
      return {
        media,
        pageInfo: {
          total: media.length,
          currentPage: page,
          lastPage: 1,
          hasNextPage: false,
          perPage: 24
        }
      };
    }
  } catch {}

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
    if (data?.data?.Page) return data.data.Page;
  } catch (e) { 
    console.error("Search Error:", e);
  }

  return { media: [] as AniListMedia[], pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false } }; 
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

  // Try Backend BFF Browse Filter first
  try {
    const bffGenre = cleanGenres[0] || (cleanTags.length > 0 ? cleanTags[0] : '');
    const bffData = await fetchBFF<any[]>(`/api/browse/filter?genre=${encodeURIComponent(bffGenre)}&status=${status || ''}&format=${format || ''}&year=${seasonYear || ''}&sort=${sort}&page=${page}&limit=${perPage}`);
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      const media = bffData.map(formatToAniListMedia).filter(isSafeContent);
      return {
        media,
        pageInfo: {
          total: 240,
          currentPage: page,
          lastPage: 10,
          hasNextPage: page < 10,
          perPage
        }
      };
    }
  } catch {}

  // Fallback to Official MAL Search if genre is present
  if (cleanGenres.length > 0 || cleanTags.length > 0) {
    try {
      const q = cleanGenres[0] || cleanTags[0];
      const malSearch = await fetchBFF<any[]>(`/api/anime/search/query?q=${encodeURIComponent(q)}&limit=${perPage}`);
      if (malSearch && Array.isArray(malSearch) && malSearch.length > 0) {
        const media = malSearch.map(formatToAniListMedia).filter(isSafeContent);
        return {
          media,
          pageInfo: {
            total: media.length,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false,
            perPage
          }
        };
      }
    } catch {}
  }

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
    if (pageData && Array.isArray(pageData.media) && pageData.media.length > 0) {
      pageData.media = pageData.media.filter(isSafeContent);
      return pageData;
    }
  } catch (e) {
    console.warn("Filter API AniList unavailable, executing fallback:", e);
  }

  // Fallback to top rankings
  try {
    const malRank = await fetchBFF<any[]>(`/api/anime/ranking/bypopularity?limit=${perPage}`);
    if (malRank && Array.isArray(malRank) && malRank.length > 0) {
      const media = malRank.map(formatToAniListMedia).filter(isSafeContent);
      return {
        media,
        pageInfo: {
          total: media.length,
          currentPage: page,
          lastPage: 1,
          hasNextPage: false,
          perPage
        }
      };
    }
  } catch {}

  return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
}

// ??. Jikan API - Get All Genres (Hentai Filtered Out with high-reliability fallback)
export async function getJikanGenres() {
  return DEFAULT_GENRES_LIST;
}

// ??. Jikan API - Get Anime by Genre
export async function getJikanAnimeByGenre(genreId: string, page = 1) {
  try {
    const data = await getFilteredAnimeAniList({ genres: [genreId], page, perPage: 24 });
    return {
      media: data || [],
      pageInfo: {
        total: 100,
        currentPage: page,
        lastPage: 5,
        hasNextPage: page < 5
      }
    };
  } catch (error) {
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  }
}

// 15. Recommendations (Multi-Tier Fallback: Official MAL -> AniList)
export async function getAnimeRecommendations(id: string | number, anilistId?: number): Promise<any[]> {
  const numMalId = Number(id);
  const resolvedAniListId = anilistId || numMalId;

  if (!isNaN(numMalId) && numMalId > 0 && numMalId <= 65000) {
    try {
      const recs = await getOfficialMALRecommendations(numMalId);
      if (recs && recs.length > 0) return recs;
    } catch {}
  }

  const aniRecs = await fetchAniListRecommendationsFallback(resolvedAniListId);
  return aniRecs || [];
}

const DEFAULT_TOP_CHARACTERS = [
  { id: 417, name: { full: 'Lelouch Lamperouge' }, image: { large: 'https://cdn.myanimelist.net/images/characters/8/406163.jpg' }, favourites: 165000 },
  { id: 45627, name: { full: 'Levi Ackerman' }, image: { large: 'https://cdn.myanimelist.net/images/characters/2/241413.jpg' }, favourites: 142000 },
  { id: 40, name: { full: 'Monkey D. Luffy' }, image: { large: 'https://cdn.myanimelist.net/images/characters/9/310307.jpg' }, favourites: 138000 },
  { id: 71, name: { full: 'L Lawliet' }, image: { large: 'https://cdn.myanimelist.net/images/characters/10/249697.jpg' }, favourites: 125000 },
  { id: 35252, name: { full: 'Rintarou Okabe' }, image: { large: 'https://cdn.myanimelist.net/images/characters/6/123066.jpg' }, favourites: 95000 },
  { id: 62, name: { full: 'Roronoa Zoro' }, image: { large: 'https://cdn.myanimelist.net/images/characters/3/100534.jpg' }, favourites: 105000 },
  { id: 27, name: { full: 'Killua Zoldyck' }, image: { large: 'https://cdn.myanimelist.net/images/characters/2/327920.jpg' }, favourites: 93000 },
  { id: 164477, name: { full: 'Satoru Gojo' }, image: { large: 'https://cdn.myanimelist.net/images/characters/4/422810.jpg' }, favourites: 110000 },
  { id: 40882, name: { full: 'Eren Yeager' }, image: { large: 'https://cdn.myanimelist.net/images/characters/10/216895.jpg' }, favourites: 90000 },
  { id: 11, name: { full: 'Edward Elric' }, image: { large: 'https://cdn.myanimelist.net/images/characters/9/72533.jpg' }, favourites: 87000 },
  { id: 17, name: { full: 'Naruto Uzumaki' }, image: { large: 'https://cdn.myanimelist.net/images/characters/15/264417.jpg' }, favourites: 85000 },
  { id: 34470, name: { full: 'Kurisu Makise' }, image: { large: 'https://cdn.myanimelist.net/images/characters/9/131317.jpg' }, favourites: 72000 }
];

const DEFAULT_TOP_PEOPLE = [
  { id: 1880, name: { full: 'Tite Kubo' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/3/61986.jpg' }, favourites: 18000 },
  { id: 118, name: { full: 'Hiroshi Kamiya' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/3/69903.jpg' }, favourites: 105000 },
  { id: 86, name: { full: 'Mamoru Miyano' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/1/67634.jpg' }, favourites: 88000 },
  { id: 124, name: { full: 'Kana Hanazawa' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/2/70366.jpg' }, favourites: 98000 },
  { id: 145, name: { full: 'Kenjiro Tsuda' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/1/65845.jpg' }, favourites: 42000 },
  { id: 2, name: { full: 'Hayao Miyazaki' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/2/18797.jpg' }, favourites: 41000 },
  { id: 188, name: { full: 'Eiichiro Oda' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/1/70857.jpg' }, favourites: 52000 },
  { id: 5087, name: { full: 'Makoto Shinkai' }, image: { large: 'https://cdn.myanimelist.net/images/voiceactors/2/43977.jpg' }, favourites: 36000 }
];

// 16. Top Characters (Jikan with curated fallback)
export async function getTopCharactersJikan() {
  try {
    const chars = await getTopCharactersAniList(1);
    if (chars && chars.length > 0) return chars;
  } catch {}
  return DEFAULT_TOP_CHARACTERS;
}

// 17. Top People / Staff (Jikan with curated fallback)
export async function getTopPeopleJikan() {
  try {
    const staff = await getTopStaffAniList(1);
    if (staff && staff.length > 0) return staff;
  } catch {}
  return DEFAULT_TOP_PEOPLE;
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

const TOP_CHARACTERS_CACHE: Record<number, any> = {
  1: {
    mal_id: 1,
    name: 'Spike Spiegel',
    name_kanji: 'スパイク・スピーゲル',
    nicknames: ['Swimming Bird'],
    favorites: 75000,
    about: 'Spike Spiegel is a former member of the Red Dragon Crime Syndicate, who left by faking his death. He is a bounty hunter and partner of Jet Black aboard the Bebop.',
    images: {
      jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/4/50197.jpg' },
      webp: { image_url: 'https://cdn.myanimelist.net/images/characters/4/50197.webp' }
    },
    anime: [{ role: 'Main', anime: { mal_id: 1, title: 'Cowboy Bebop', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/4/19644.jpg' } } } }],
    voices: [{ language: 'Japanese', person: { mal_id: 11, name: 'Kouichi Yamadera', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/2/54823.jpg' } } } }]
  },
  40: {
    mal_id: 40,
    name: 'Monkey D. Luffy',
    name_kanji: 'モンキー・D・ルフィ',
    nicknames: ['Straw Hat', 'Lucy'],
    favorites: 140000,
    about: 'Monkey D. Luffy is the captain of the Straw Hat Pirates and aspires to become the next Pirate King by finding the legendary treasure One Piece.',
    images: {
      jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/9/310307.jpg' },
      webp: { image_url: 'https://cdn.myanimelist.net/images/characters/9/310307.webp' }
    },
    anime: [{ role: 'Main', anime: { mal_id: 21, title: 'One Piece', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' } } } }],
    voices: [{ language: 'Japanese', person: { mal_id: 79, name: 'Mayumi Tanaka', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/3/65133.jpg' } } } }]
  },
  62: {
    mal_id: 62,
    name: 'Roronoa Zoro',
    name_kanji: 'ロロノア・ゾロ',
    nicknames: ['Pirate Hunter Zoro'],
    favorites: 115000,
    about: 'Roronoa Zoro is the swordsman of the Straw Hat Pirates and aims to become the greatest swordsman in the world.',
    images: {
      jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/3/100534.jpg' },
      webp: { image_url: 'https://cdn.myanimelist.net/images/characters/3/100534.webp' }
    },
    anime: [{ role: 'Main', anime: { mal_id: 21, title: 'One Piece', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' } } } }],
    voices: [{ language: 'Japanese', person: { mal_id: 123, name: 'Kazuya Nakai', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/2/74301.jpg' } } } }]
  },
  417: {
    mal_id: 417,
    name: 'Lelouch Lamperouge',
    name_kanji: 'ルルーシュ・ランペルージ',
    nicknames: ['Zero', 'Lulu'],
    favorites: 165000,
    about: 'Lelouch Lamperouge is the former Eleventh Prince of Britannia who leads the rebellion under the alias Zero.',
    images: {
      jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/8/406163.jpg' },
      webp: { image_url: 'https://cdn.myanimelist.net/images/characters/8/406163.webp' }
    },
    anime: [{ role: 'Main', anime: { mal_id: 1575, title: 'Code Geass: Hangyaku no Lelouch', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/5/50331.jpg' } } } }],
    voices: [{ language: 'Japanese', person: { mal_id: 86, name: 'Jun Fukuyama', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/1/40964.jpg' } } } }]
  }
};

const TOP_STAFF_CACHE: Record<number, any> = {
  1880: {
    mal_id: 1880,
    name: 'Tite Kubo',
    given_name: 'Noriaki',
    family_name: 'Kubo',
    about: 'Tite Kubo is a Japanese manga artist best known for creating Bleach.',
    favorites: 12000,
    images: {
      jpg: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/2/18165.jpg' },
      webp: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/2/18165.webp' }
    },
    anime: [{ position: 'Original Creator', anime: { mal_id: 269, title: 'Bleach', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg' } } } }],
    voices: []
  },
  1870: {
    mal_id: 1870,
    name: 'Hayao Miyazaki',
    given_name: 'Hayao',
    family_name: 'Miyazaki',
    about: 'Hayao Miyazaki is an acclaimed Japanese animator, director, producer, screenwriter, and manga artist. Co-founder of Studio Ghibli.',
    favorites: 35000,
    images: {
      jpg: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/3/65134.jpg' },
      webp: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/3/65134.webp' }
    },
    anime: [{ position: 'Director', anime: { mal_id: 164, title: 'Mononoke Hime', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/7/7581.jpg' } } } }],
    voices: []
  },
  1881: {
    mal_id: 1881,
    name: 'Eiichiro Oda',
    given_name: 'Eiichiro',
    family_name: 'Oda',
    about: 'Eiichiro Oda is a Japanese manga artist, best known as the creator of the manga series One Piece.',
    favorites: 85000,
    images: {
      jpg: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/1/40965.jpg' },
      webp: { image_url: 'https://cdn.myanimelist.net/images/voiceactors/1/40965.webp' }
    },
    anime: [{ position: 'Original Creator', anime: { mal_id: 21, title: 'One Piece', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg' } } } }],
    voices: []
  }
};

export async function getCharacterDetailsJikan(id: string | number) {
  const strId = String(id).trim().replace(/^al-/, '');
  const numId = Number(strId);
  if (!isNaN(numId) && numId > 0) {
    try {
      const aniChar = await fetchAniListCharacter(numId);
      if (aniChar) return aniChar;
    } catch {}
    if (TOP_CHARACTERS_CACHE[numId]) return TOP_CHARACTERS_CACHE[numId];
  }
  return null;
}

  export async function getPersonDetailsJikan(id: string | number) {
  const strId = String(id).trim().replace(/^al-/, '');
  const numId = Number(strId);
  if (!isNaN(numId) && numId > 0) {
    try {
      const aniStaff = await fetchAniListStaff(numId);
      if (aniStaff) return aniStaff;
    } catch {}
    if (TOP_STAFF_CACHE[numId]) return TOP_STAFF_CACHE[numId];
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
  }],
  ['30013', {
    mal_id: 13,
    id: 30013,
    anilistId: 30013,
    title: 'One Piece',
    title_english: 'One Piece',
    title_japanese: 'ONE PIECE',
    synopsis: 'Gol D. Roger was known as the "Pirate King," the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world. His last words before his death revealed the existence of the greatest treasure in the world, One Piece.',
    images: {
      webp: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-ulVq0AocWbhx.png' },
      jpg: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-ulVq0AocWbhx.png' }
    },
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/30013-v04l7bZ7r2oF.jpg',
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 2, name: 'Adventure' }, { mal_id: 3, name: 'Comedy' }, { mal_id: 4, name: 'Fantasy' }],
    score: 9.2,
    type: 'Manga',
    status: 'Publishing',
    countryOfOrigin: 'JP',
    chapters: null,
    volumes: null,
    relations: [],
    characters: [],
    recommendations: []
  }],
  ['13', {
    mal_id: 13,
    id: 30013,
    anilistId: 30013,
    title: 'One Piece',
    title_english: 'One Piece',
    title_japanese: 'ONE PIECE',
    synopsis: 'Gol D. Roger was known as the "Pirate King," the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world. His last words before his death revealed the existence of the greatest treasure in the world, One Piece.',
    images: {
      webp: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-ulVq0AocWbhx.png' },
      jpg: { large_image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-ulVq0AocWbhx.png' }
    },
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/30013-v04l7bZ7r2oF.jpg',
    genres: [{ mal_id: 1, name: 'Action' }, { mal_id: 2, name: 'Adventure' }, { mal_id: 3, name: 'Comedy' }, { mal_id: 4, name: 'Fantasy' }],
    score: 9.2,
    type: 'Manga',
    status: 'Publishing',
    countryOfOrigin: 'JP',
    chapters: null,
    volumes: null,
    relations: [],
    characters: [],
    recommendations: []
  }]
]);

export async function getMangaFullDetails(id: string) {
  const strId = String(id).trim().replace(/^kitsu-/, '');

  // 1. Check in-memory persistent cache first
  if (MANGA_DETAILS_CACHE.has(strId)) {
    return MANGA_DETAILS_CACHE.get(strId);
  }

  // 2. Try Backend BFF Manga Details (Official MAL v2 + AniList Proxy)
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/manga/${strId}`, {
      signal: AbortSignal.timeout(3500),
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        MANGA_DETAILS_CACHE.set(strId, json.data);
        return json.data;
      }
    }
  } catch (err: any) {
    console.warn(`[BFF Manga Details Fail] ID ${strId}:`, err?.message);
  }

  // 3. Try AniList Direct Fetcher (primary for AniList IDs, e.g. /manga/30013)
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

  // AniList is the authoritative manga database

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

  return [];
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

  return [];
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

// 3. High-Speed Manga Search Engine (Backend BFF / MAL Official API v2)
export async function searchMangaBFF(
  queryText = '', 
  page = 1, 
  limit = 24
) {
  try {
    const url = queryText.trim()
      ? `${BACKEND_BASE_URL}/api/manga/search?q=${encodeURIComponent(queryText.trim())}&page=${page}&limit=${limit}`
      : `${BACKEND_BASE_URL}/api/manga/top?page=${page}&limit=${limit}`;

    const res = await fetch(url, { 
      signal: AbortSignal.timeout(3500), 
      next: { revalidate: queryText ? 0 : GLOBAL_CACHE_TIME } 
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return {
          media: json.data,
          pageInfo: {
            total: json.data.length,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false
          }
        };
      }
    }
  } catch (err: any) {
    console.warn('[searchMangaBFF Fail]:', err?.message);
  }
  return null;
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

// searchMangaJikan queries AniList and Backend BFF with fallback to Jikan
export async function searchMangaJikan(
  queryText: string, 
  page = 1, 
  type = '', 
  genre = '', 
  sort = 'popular',
  status = '',
  year: string | number = ''
) {
  try {
    const aniResult = await searchMangaAniList(queryText, page, type, genre, sort, status, year);
    if (aniResult && aniResult.media && aniResult.media.length > 0) {
      return aniResult;
    }
  } catch (error) {
    console.warn('[AniList Manga Search Fail]:', error);
  }

  try {
    const bffResult = await searchMangaBFF(queryText, page, 24);
    if (bffResult && bffResult.media && bffResult.media.length > 0) {
      return bffResult;
    }
  } catch (e: any) {
    console.warn('[BFF Manga Fallback Fail]:', e?.message);
  }

  return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
}

// ৭. Top Movies (For Homepage Lists: Primary BFF / Official MAL v2 movie + Backup AniList)
export async function getTopMoviesAniList(): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/movie?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

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
    if (data?.data?.Page?.media && data.data.Page.media.length > 0) {
      return data.data.Page.media as AniListMedia[];
    }
  } catch {}

  return [
    {
      id: 199,
      idMal: 199,
      title: { english: 'Spirited Away', romaji: 'Sen to Chihiro no Kamikakushi' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/6/79597.jpg', large: 'https://cdn.myanimelist.net/images/anime/6/79597.jpg' },
      averageScore: 89,
      format: 'MOVIE',
      status: 'FINISHED',
      episodes: 1,
      seasonYear: 2001
    },
    {
      id: 6682,
      idMal: 32281,
      title: { english: 'Your Name.', romaji: 'Kimi no Na wa.' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/5/87048.jpg', large: 'https://cdn.myanimelist.net/images/anime/5/87048.jpg' },
      averageScore: 88,
      format: 'MOVIE',
      status: 'FINISHED',
      episodes: 1,
      seasonYear: 2016
    },
    {
      id: 20954,
      idMal: 28851,
      title: { english: 'A Silent Voice', romaji: 'Koe no Katachi' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1122/96442.jpg', large: 'https://cdn.myanimelist.net/images/anime/1122/96442.jpg' },
      averageScore: 88,
      format: 'MOVIE',
      status: 'FINISHED',
      episodes: 1,
      seasonYear: 2016
    },
    {
      id: 164,
      idMal: 164,
      title: { english: 'Princess Mononoke', romaji: 'Mononoke Hime' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/7/75919.jpg', large: 'https://cdn.myanimelist.net/images/anime/7/75919.jpg' },
      averageScore: 87,
      format: 'MOVIE',
      status: 'FINISHED',
      episodes: 1,
      seasonYear: 1997
    }
  ] as AniListMedia[];
}

// ৮. Top TV Series (For Homepage Lists: Primary BFF / Official MAL v2 tv + Backup AniList)
export async function getTopTVSeriesAniList(): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/tv?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

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
    if (data?.data?.Page?.media && data.data.Page.media.length > 0) {
      return data.data.Page.media as AniListMedia[];
    }
  } catch {}

  return [
    {
      id: 154587,
      idMal: 52991,
      title: { english: 'Frieren: Beyond Journey\'s End', romaji: 'Sousou no Frieren' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', large: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg' },
      averageScore: 91,
      format: 'TV',
      status: 'FINISHED',
      episodes: 28,
      seasonYear: 2023
    },
    {
      id: 5114,
      idMal: 5114,
      title: { english: 'Fullmetal Alchemist: Brotherhood', romaji: 'Hagane no Renkinjutsushi' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg', large: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg' },
      averageScore: 90,
      format: 'TV',
      status: 'FINISHED',
      episodes: 64,
      seasonYear: 2009
    },
    {
      id: 9253,
      idMal: 9253,
      title: { english: 'Steins;Gate', romaji: 'Steins;Gate' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1935/127974.jpg', large: 'https://cdn.myanimelist.net/images/anime/1935/127974.jpg' },
      averageScore: 89,
      format: 'TV',
      status: 'FINISHED',
      episodes: 24,
      seasonYear: 2011
    },
    {
      id: 16498,
      idMal: 16498,
      title: { english: 'Attack on Titan', romaji: 'Shingeki no Kyojin' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg', large: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg' },
      averageScore: 89,
      format: 'TV',
      status: 'FINISHED',
      episodes: 25,
      seasonYear: 2013
    }
  ] as AniListMedia[];
}

// ৯. Year Awards/Contenders (For Homepage Lists: Primary BFF / Official MAL v2 + Backup AniList)
export async function getYearAwardsAniList(year: number): Promise<AniListMedia[]> {
  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/all?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

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
    if (data?.data?.Page?.media && data.data.Page.media.length > 0) {
      return data.data.Page.media as AniListMedia[];
    }
  } catch {}

  return [
    {
      id: 176274,
      idMal: 58567,
      title: { english: 'Solo Leveling Season 2 -Arise from the Shadow-', romaji: 'Ore dake Level Up na Ken Season 2' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg', large: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg' },
      averageScore: 88,
      format: 'TV',
      status: 'RELEASING',
      episodes: 13,
      seasonYear: 2026
    },
    {
      id: 179304,
      idMal: 59192,
      title: { english: 'Demon Slayer: Infinity Castle', romaji: 'Kimetsu no Yaiba: Mugen Jou-hen' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg', large: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' },
      averageScore: 90,
      format: 'MOVIE',
      status: 'NOT_YET_RELEASED',
      episodes: 1,
      seasonYear: 2026
    },
    {
      id: 172944,
      idMal: 57371,
      title: { english: 'Chainsaw Man Movie: Reze Arc', romaji: 'Chainsaw Man Movie: Reze-hen' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg', large: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg' },
      averageScore: 88,
      format: 'MOVIE',
      status: 'NOT_YET_RELEASED',
      episodes: 1,
      seasonYear: 2026
    },
    {
      id: 172945,
      idMal: 57372,
      title: { english: 'Jujutsu Kaisen: Culling Game', romaji: 'Jujutsu Kaisen: Shimetsu Kaiyuu' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg', large: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg' },
      averageScore: 89,
      format: 'TV',
      status: 'NOT_YET_RELEASED',
      episodes: 24,
      seasonYear: 2026
    }
  ] as AniListMedia[];
}

// Anime Not For Kids Curated List (25 Curated Mature Titles)
export async function getNotForKidsAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('not_for_kids');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  const ids = [
    33, 19, 37521, 777, 42310, 44511, 22319, 35120, 226, 22535,
    16498, 1818, 6880, 889, 37520, 38668, 384, 11111, 7724, 1292,
    10087, 34599, 13601, 22199, 40748
  ];

  const query = `
    query ($ids: [Int]) {
      Page(page: 1, perPage: 25) {
        media(idMal_in: $ids, type: ANIME) {
          id idMal title { romaji english } coverImage { extraLarge large } bannerImage description episodes format status averageScore genres seasonYear
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(query, { ids });
    const mediaList = data?.data?.Page?.media as AniListMedia[];
    if (mediaList && Array.isArray(mediaList) && mediaList.length > 0) {
      return mediaList.sort((a, b) => ids.indexOf(a.idMal || a.id) - ids.indexOf(b.idMal || b.id));
    }
  } catch {}

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/bypopularity?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// Kickstart Your Anime Journey Curated List (Loaded from Atlas with BFF Fallback)
export async function getKickstartJourneyAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('kickstart');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/bypopularity?limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// The Shounen Zone (Loaded from Atlas with BFF Fallback)
export async function getShounenZoneAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('shounen');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/search/query?q=Shounen&limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// The Sports Zone (Loaded from Atlas with BFF Fallback)
export async function getSportsZoneAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('sports');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/search/query?q=Sports&limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// Inspired by Sword Art Online (Loaded from Atlas with BFF Fallback)
export async function getSimilarToSAOAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('similar_sao');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const recs = await fetchBFF<any[]>('/api/anime/11757/recommendations');
    if (recs && Array.isArray(recs) && recs.length > 0) {
      return recs.map((r: any) => formatToAniListMedia(r.entry || r)).filter(Boolean);
    }
  } catch {}

  try {
    const searchData = await fetchBFF<any[]>('/api/anime/search/query?q=Isekai&limit=24');
    if (searchData && Array.isArray(searchData) && searchData.length > 0) {
      return searchData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// The Fantasy Zone (Loaded from Atlas with BFF Fallback)
export async function getFantasyZoneAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('fantasy');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/search/query?q=Fantasy&limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// Supernatural World (Loaded from Atlas with BFF Fallback)
export async function getSupernaturalWorldAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('supernatural');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/search/query?q=Supernatural&limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// Seasonal / Featured Romance Anime (Primary BFF /api/romance/featured)
export async function getSeasonalRomanceAnimeAniList(year?: number, season?: string): Promise<AniListMedia[]> {
  const tryFetch = async (url: string) => {
    try {
      const res = await fetch(`${url}/api/romance/featured`, {
        next: { revalidate: 1800 },
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json?.data || []);
        if (Array.isArray(list) && list.length > 0) {
          return list as AniListMedia[];
        }
      }
    } catch {}
    return null;
  };

  const primary = await tryFetch(BACKEND_BASE_URL);
  if (primary && primary.length > 0) return primary;

  if (!BACKEND_BASE_URL.includes('localhost') && !BACKEND_BASE_URL.includes('127.0.0.1')) {
    const localFallback = await tryFetch('http://localhost:5000');
    if (localFallback && localFallback.length > 0) return localFallback;
  }

  return [
    {
      id: 52578,
      idMal: 52578,
      title: { english: 'The Dangers in My Heart', romaji: 'Boku no Kokoro no Yabai Yatsu' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1545/133887l.webp', large: 'https://cdn.myanimelist.net/images/anime/1545/133887l.webp' },
      bannerImage: 'https://cdn.myanimelist.net/images/anime/1545/133887l.webp',
      description: 'Kyoutarou Ichikawa and class idol Anna Yamada develop a heartwarming and hilarious romance.',
      episodes: 12,
      format: 'TV',
      status: 'FINISHED',
      averageScore: 88,
      genres: ['Comedy', 'Romance', 'School', 'Slice of Life'],
      seasonYear: 2023,
      isDubbed: true
    },
    {
      id: 43608,
      idMal: 43608,
      title: { english: 'Kaguya-sama: Love Is War -Ultra Romantic-', romaji: 'Kaguya-sama wa Kokurasetai: Ultra Romantic' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1295/106551l.jpg', large: 'https://cdn.myanimelist.net/images/anime/1295/106551l.jpg' },
      bannerImage: 'https://cdn.myanimelist.net/images/anime/1295/106551l.jpg',
      description: 'Miyuki Shirogane and Kaguya Shinomiya lead the prestigious student council. The first to confess loses!',
      episodes: 13,
      format: 'TV',
      status: 'FINISHED',
      averageScore: 90,
      genres: ['Comedy', 'Psychological', 'Romance'],
      seasonYear: 2022,
      isDubbed: true
    },
    {
      id: 57181,
      idMal: 57181,
      title: { english: 'Blue Box', romaji: 'Ao no Hako' },
      coverImage: { extraLarge: 'https://cdn.myanimelist.net/images/anime/1744/144607l.webp', large: 'https://cdn.myanimelist.net/images/anime/1744/144607l.webp' },
      bannerImage: 'https://cdn.myanimelist.net/images/anime/1744/144607l.webp',
      description: 'Taiki Inomata practices badminton alongside Chinatsu Kano, the rising basketball star he admires from afar.',
      episodes: 25,
      format: 'TV',
      status: 'RELEASING',
      averageScore: 84,
      genres: ['Romance', 'Sports', 'School', 'Shounen'],
      seasonYear: 2024,
      isDubbed: true
    }
  ] as AniListMedia[];
}

// Sci-Fi Anime (Loaded from Atlas with BFF Fallback)
export async function getSciFiAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('scifi');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/search/query?q=Sci-Fi&limit=24');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// Evergreen Anime Curated List (Loaded from Atlas with BFF Fallback)
export async function getEvergreenAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('evergreen');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/favorite?limit=25');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// Must Watch For My Hero Academia Fans (Loaded from Atlas with BFF Fallback)
export async function getSimilarToMHAAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('similar_mha');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const recs = await fetchBFF<any[]>('/api/anime/31964/recommendations');
    if (recs && Array.isArray(recs) && recs.length > 0) {
      return recs.map((r: any) => formatToAniListMedia(r.entry || r)).filter(Boolean);
    }
  } catch {}

  try {
    const searchData = await fetchBFF<any[]>('/api/anime/search/query?q=Super%20Power&limit=24');
    if (searchData && Array.isArray(searchData) && searchData.length > 0) {
      return searchData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// Hidden Gems Curated List (Loaded from Atlas with BFF Fallback)
export async function getHiddenGemsAnimeAniList(): Promise<AniListMedia[]> {
  const cachedFromAtlas = await fetchCuratedSectionFromAtlas('hidden_gems');
  if (cachedFromAtlas && cachedFromAtlas.length > 0) return cachedFromAtlas;

  try {
    const bffData = await fetchBFF<any[]>('/api/anime/ranking/all?limit=24&offset=50');
    if (bffData && Array.isArray(bffData) && bffData.length > 0) {
      return bffData.map(formatToAniListMedia).filter(Boolean);
    }
  } catch {}

  return [] as AniListMedia[];
}

// ─── Anime Reviews Fetcher (BFF with Jikan & Memory Cache) ───────────────────
export async function getAnimeReviews(malId: number | string): Promise<any[]> {
  if (!malId) return [];
  const cleanId = String(malId).replace(/^(kitsu-|al-)/, '');
  const numId = Number(cleanId);
  if (isNaN(numId) || numId <= 0 || numId > 65000) return [];

  try {
    const bffReviews = await fetchBFF<any[]>(`/api/anime/${numId}/reviews`);
    if (bffReviews && Array.isArray(bffReviews) && bffReviews.length > 0) {
      return bffReviews.map((r: any) => ({
        id: r.mal_id || r.id,
        mal_id: r.mal_id || r.id,
        user: {
          username: r.user?.username || 'AnimeFan',
          image: r.user?.images?.jpg?.image_url || null,
        },
        score: r.score || null,
        date: r.date || new Date().toISOString(),
        review: r.review || '',
        tags: r.tags || [],
        isSpoiler: r.is_spoiler || false,
        reactions: r.reactions || { overall: 0, nice: 0, love_it: 0 },
      }));
    }
  } catch {}

  return [];
}








