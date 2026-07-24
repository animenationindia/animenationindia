/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts
import { logError } from './logger';
import { fetchKitsuCharacters } from './kitsu-api';

const ANILIST_API_URL = 'https://graphql.anilist.co';
const JIKAN_API_URL = 'https://api.jikan.moe/v4';

export const GLOBAL_CACHE_TIME = 21600; // 6 hours in seconds

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

export async function fetchAniList(query: string, variables: any = {}, revalidate = GLOBAL_CACHE_TIME, timeoutMs = 3000) {
  let retries = 2;
  let delay = 500;

  while (retries > 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions: any = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal
    };

    if (revalidate === 0) {
      fetchOptions.cache = 'no-store';
    } else {
      fetchOptions.next = { revalidate };
    }

    try {
      const res = await fetch(ANILIST_API_URL, fetchOptions);
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
}

export async function fetchJikan(endpoint: string, revalidate = GLOBAL_CACHE_TIME, timeoutMs = 2000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: any = { signal: controller.signal };
  if (revalidate === 0) {
    fetchOptions.cache = 'no-store';
  } else {
    fetchOptions.next = { revalidate };
  }

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

// AniList Recommendation Fallback
export async function fetchAniListRecommendationsFallback(anilistId: number): Promise<any[] | null> {
  if (!anilistId || isNaN(anilistId)) return null;

  const queryRec = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        recommendations(perPage: 12, sort: [RATING_DESC]) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              format
              averageScore
            }
          }
        }
      }
    }
  `;

  try {
    const data = await fetchAniList(queryRec, { id: anilistId }, GLOBAL_CACHE_TIME, 2500);
    const nodes = data?.data?.Media?.recommendations?.nodes;
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) return null;

    const validRecs = nodes
      .map((n: any) => n.mediaRecommendation)
      .filter((rec: any) => rec && (rec.idMal || rec.id));

    if (validRecs.length === 0) return null;

    return validRecs.map((rec: any) => ({
      entry: {
        mal_id: rec.idMal || rec.id,
        title: rec.title?.english || rec.title?.romaji || 'Unknown Anime',
        images: {
          jpg: {
            large_image_url: rec.coverImage?.extraLarge || rec.coverImage?.large || '/placeholder.png'
          }
        }
      }
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
    episodes?: number | null;
    format?: string | null;
    status?: string | null;
    genres?: string[] | null;
    seasonYear?: number | null;
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
        pageInfo { hasNextPage }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          airingAt
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
    let allSchedules: AiringSchedule[] = [];
    let hasNextPage = true;
    let currentPage = page;

    // Fetch up to 4 pages to ensure we get a good amount of the week's schedule
    while (hasNextPage && currentPage <= 4) {
      const data = await fetchAniList(query, { page: currentPage, start, end });
      if (data.data?.Page?.airingSchedules) {
        allSchedules = allSchedules.concat(data.data.Page.airingSchedules);
        hasNextPage = data.data.Page.pageInfo.hasNextPage;
      } else {
        hasNextPage = false;
      }
      currentPage++;
    }
    
    return allSchedules;
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

// ৪. Details Page এর জন্য Jikan Full Info
export async function getAnimeFullDetails(id: string) {
  try {
    const res = await fetchJikan(`/anime/${id}/full`);
    return res?.data || null;
  } catch { 
    return null; 
  }
}

// ৫. ক্যারেক্টার ও ভয়েস অ্যাক্টর (Multi-Tier Fallback: Jikan -> Kitsu -> AniList)
export async function getAnimeCharacters(id: string | number, anilistId?: number): Promise<any[]> {
  const numMalId = Number(id);
  const resolvedAniListId = anilistId || numMalId;

  const providers = [
    {
      name: 'Jikan Characters (Primary)',
      fn: async () => {
        const res = await fetchJikan(`/anime/${id}/characters`, GLOBAL_CACHE_TIME, 2000);
        return res?.data && Array.isArray(res.data) && res.data.length > 0 ? res.data : null;
      }
    },
    {
      name: 'Kitsu Characters (Secondary)',
      fn: async () => fetchKitsuCharacters(numMalId)
    },
    {
      name: 'AniList Characters (Tertiary Fallback)',
      fn: async () => fetchAniListCharactersFallback(resolvedAniListId)
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
  const query = `
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
        trailer { id site thumbnail }
        nextAiringEpisode { airingAt timeUntilAiring episode }
        relations {
          edges {
            relationType
            node { id idMal title { english romaji } coverImage { extraLarge large } format startDate { year month day } type }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { id: idMal });
    return (data.data?.Media as AniListExtra) || null;
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

// ১৪. Advanced Filter Anime
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
  const { page = 1, season, seasonYear, format, status, genres, tags, sort = 'POPULARITY_DESC', perPage = 24, isAdult } = params;
  
  // Determine if this is an adult content query based on genres/tags or explicit param
  const hasAdultGenre = (genres && genres.some(g => g.toLowerCase() === 'hentai' || g.toLowerCase() === 'erotica')) ||
                        (tags && tags.some(t => t.toLowerCase() === 'hentai' || t.toLowerCase() === 'erotica'));
  const isAdultValue = isAdult !== undefined ? isAdult : (hasAdultGenre ? true : false);

  // Build dynamic filters
  let queryArgs = `$page: Int, $perPage: Int, $isAdult: Boolean`;
  let mediaArgs = `type: ANIME, isAdult: $isAdult, sort: [$sort]`;
  const variables: Record<string, any> = { page, perPage, sort, isAdult: isAdultValue };

  if (season) { queryArgs += `, $season: MediaSeason`; mediaArgs += `, season: $season`; variables.season = season; }
  if (seasonYear) { queryArgs += `, $seasonYear: Int`; mediaArgs += `, seasonYear: $seasonYear`; variables.seasonYear = seasonYear; }
  if (format) { queryArgs += `, $format: MediaFormat`; mediaArgs += `, format: $format`; variables.format = format; }
  if (status) { queryArgs += `, $status: MediaStatus`; mediaArgs += `, status: $status`; variables.status = status; }
  if (genres && genres.length > 0) { queryArgs += `, $genres: [String]`; mediaArgs += `, genre_in: $genres`; variables.genres = genres; }
  if (tags && tags.length > 0) { queryArgs += `, $tags: [String]`; mediaArgs += `, tag_in: $tags`; variables.tags = tags; }
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
    return data.data.Page;
  } catch (e) {
    console.error("Filter API Error:", e);
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  }
}
// ??. Jikan API - Get All Genres
export async function getJikanGenres() {
  try {
    const data = await fetchJikan('/genres/anime');
    return data?.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
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
      averageScore: anime.score ? Math.round(anime.score * 10) : null,
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

// 15. Recommendations (Multi-Tier Fallback: Jikan -> AniList)
export async function getAnimeRecommendations(id: string | number, anilistId?: number): Promise<any[]> {
  const numMalId = Number(id);
  const resolvedAniListId = anilistId || numMalId;

  const providers = [
    {
      name: 'Jikan Recommendations (Primary)',
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
    },
    {
      name: 'AniList Recommendations (Secondary Fallback)',
      fn: async () => fetchAniListRecommendationsFallback(resolvedAniListId)
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

export async function getCharacterDetailsJikan(id: string) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/characters/${id}/full`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("getCharacterDetailsJikan Error:", error);
    return null;
  }
}

export async function getPersonDetailsJikan(id: string) {
  try {
    const data = await fetchJikan(`/people/${id}/full`);
    return data?.data || null;
  } catch (error) {
    console.error("getPersonDetailsJikan Error:", error);
    return null;
  }
}

// --- MANGA / LIGHT NOVEL FUNCTIONS ---

export async function getMangaFullDetails(id: string) {
  try {
    const data = await fetchJikan(`/manga/${id}/full`);
    return data?.data || null;
  } catch { 
    return null; 
  }
}

export async function getMangaCharacters(id: string) {
  try {
    const data = await fetchJikan(`/manga/${id}/characters`);
    return data?.data || []; 
  } catch { 
    return []; 
  }
}

export async function getMangaRecommendations(id: string) {
  try {
    const data = await fetchJikan(`/manga/${id}/recommendations`);
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
      Media(idMal: $id, type: MANGA) {
        bannerImage
        relations {
          edges {
            relationType
            node { id idMal title { english romaji } coverImage { extraLarge large } format startDate { year month day } type }
          }
        }
      }
    }
  `;
  try {
    const data = await fetchAniList(query, { id: idMal });
    return (data.data?.Media as AniListExtra) || null;
  } catch { 
    return null; 
  }
}

// searchMangaJikan queries Jikan Manga Search endpoint with 429 retries
export async function searchMangaJikan(queryText: string, page = 1, type = '', isAdult = false) {
  const queryParams = new URLSearchParams();
  if (queryText.trim()) {
    queryParams.append('q', queryText.trim());
  } else {
    queryParams.append('order_by', 'popularity');
    queryParams.append('sort', 'desc');
  }
  queryParams.append('page', page.toString());
  queryParams.append('limit', '24');
  
  if (!isAdult) {
    queryParams.append('sfw', 'true');
  }
  
  if (type) {
    queryParams.append('type', type);
  }

  const endpoint = `/manga?${queryParams.toString()}`;
  const revalidate = queryText.trim() ? 0 : GLOBAL_CACHE_TIME;
  
  try {
    const data = await fetchJikan(endpoint, revalidate);
    if (!data) return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
    
    const transformedMedia = (data.data || []).map((manga: any) => ({
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
      averageScore: manga.score ? Math.round(manga.score * 10) : null,
      format: manga.type,
      type: 'MANGA',
      status: manga.publishing ? 'RELEASING' : 'FINISHED',
      seasonYear: manga.published?.prop?.from?.year || null,
      genres: manga.genres?.map((g: any) => g.name) || [],
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







