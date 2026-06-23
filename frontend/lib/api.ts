/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts

const ANILIST_API_URL = 'https://graphql.anilist.co';
const JIKAN_API_URL = 'https://api.jikan.moe/v4';

export const GLOBAL_CACHE_TIME = 21600; // 6 hours in seconds

export async function fetchAniList(query: string, variables: any = {}, revalidate = GLOBAL_CACHE_TIME) {
  let retries = 3;
  let delay = 1000;
  
  const fetchOptions: any = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  };

  if (revalidate === 0) {
    fetchOptions.cache = 'no-store';
  } else {
    fetchOptions.next = { revalidate };
  }

  while (retries > 0) {
    try {
      const res = await fetch(ANILIST_API_URL, fetchOptions);
      
      if (res.status === 429) {
        console.warn(`AniList API 429 Rate Limit hit. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
        continue;
      }
      
      const data = await res.json();
      if (data.errors && data.errors.some((err: any) => err.status === 429 || err.message === "Too Many Requests.")) {
        console.warn(`AniList API returned 429 error in body. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
        continue;
      }
      
      return data;
    } catch (error) {
      console.error("Error in fetchAniList:", error);
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("AniList request failed after maximum retries due to rate limit.");
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
  bannerImage: string | null;
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
      const response = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { page: currentPage, start, end } }),
        next: { revalidate: GLOBAL_CACHE_TIME } 
      });
      const data = await response.json();
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
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { page, start: startOfDay, end: endOfDay } }),
      next: { revalidate: GLOBAL_CACHE_TIME } 
    });
    const data = await response.json();
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
    const response = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { page, start, end } }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await response.json();
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
    const response = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { page, start, end } }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await response.json();
    return data.data.Page; 
  } catch { return { airingSchedules: [] as AiringSchedule[] }; }
}

// ২. Top Rated Anime
export async function getTopAnimeAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 10) {
        media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
          id idMal title { romaji english } coverImage { large } averageScore format status episodes seasonYear genres description
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
    const res = await fetch(ANILIST_API_URL, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ query, variables: { page } }), 
      next: { revalidate: GLOBAL_CACHE_TIME } 
    });
    const data = await res.json();
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
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
    const res = await fetch(`${JIKAN_API_URL}/anime/${id}/full`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return data.data;
  } catch { 
    return null; 
  }
}

// ৫. ক্যারেক্টার ও ভয়েস অ্যাক্টর (Jikan)
export async function getAnimeCharacters(id: string) {
  try {
    const res = await fetch(`${JIKAN_API_URL}/anime/${id}/characters`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return data.data || []; 
  } catch { 
    return []; 
  }
}

// ৫.১ Episodes (Jikan)
export async function getAnimeEpisodes(id: string) {
  try {
    const res = await fetch(`${JIKAN_API_URL}/anime/${id}/episodes`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return data.data || []; 
  } catch { 
    return []; 
  }
}

// ৬. AniList থেকে ব্যানার ও ফ্র্যাঞ্চাইজি (Relations)
export async function getAniListExtraInfo(idMal: number): Promise<AniListExtra | null> {
  const query = `
    query ($id: Int) {
      Media(idMal: $id, type: ANIME) {
        bannerImage
        nextAiringEpisode { airingAt timeUntilAiring episode }
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
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: idMal } }),
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large } bannerImage format status averageScore genres description episodes seasonYear
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large } format status episodes genres seasonYear description
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large } format status episodes genres seasonYear description
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large } format status episodes genres seasonYear description
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return data.data.Page.media as AniListMedia[];
  } catch { 
    return [] as AniListMedia[]; 
  }
}

// ১০. Top Characters
export async function getTopCharactersAniList(page: number = 1): Promise<CharacterItem[]> {
  const query = `query($page:Int){Page(page:$page,perPage:24){characters(sort:FAVOURITES_DESC){id name{full} image{large} favourites}}}`;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { page } }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return data.data.Page.characters as CharacterItem[];
  } catch { 
    return [] as CharacterItem[]; 
  }
}

// ১১. Top Staff
export async function getTopStaffAniList(page: number = 1): Promise<StaffItem[]> {
  const query = `query($page:Int){Page(page:$page,perPage:24){staff(sort:FAVOURITES_DESC){id name{full} image{large} favourites}}}`;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables: { page } }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large } averageScore format status episodes seasonYear startDate { year } genres description
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: queryText, page: page } }),
      cache: 'no-store'
    });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large extraLarge } bannerImage averageScore format status episodes seasonYear genres description startDate { year }
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    const data = await res.json();
    return data.data.Page;
  } catch (e) {
    console.error("Filter API Error:", e);
    return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  }
}
// ??. Jikan API - Get All Genres
export async function getJikanGenres() {
  try {
    const res = await fetch('https://api.jikan.moe/v4/genres/anime', {
      next: { revalidate: GLOBAL_CACHE_TIME } // Cache for 1 hour
    });
    if (!res.ok) throw new Error('Failed to fetch Jikan genres');
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

// ??. Jikan API - Get Anime by Genre
export async function getJikanAnimeByGenre(genreId: string, page = 1, orderBy = 'start_date', sort = 'desc') {
  try {
    const url = `https://api.jikan.moe/v4/anime?genres=${genreId}&page=${page}&limit=24&order_by=${orderBy}&sort=${sort}`;
    const res = await fetch(url, {
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    if (!res.ok) throw new Error('Failed to fetch anime by genre from Jikan');
    const data = await res.json();
    
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

// 15. Recommendations (Jikan)
export async function getAnimeRecommendations(id: string) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/recommendations`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return (data.data || []).map((rec: any) => ({
      id: rec.entry.mal_id,
      idMal: rec.entry.mal_id,
      title: {
        romaji: rec.entry.title,
        english: rec.entry.title,
      },
      coverImage: {
        large: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url,
      },
      format: 'TV', // Fallback, Jikan recommendation endpoint doesn't provide type
    }));
  } catch (error) {
    console.error("Recommendations API Error:", error);
    return [];
  }
}

// 16. Top Characters (Jikan)
export async function getTopCharactersJikan() {
  try {
    const res = await fetch('https://api.jikan.moe/v4/top/characters?limit=15', { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return (data.data || []).map((char: any) => ({
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
    const res = await fetch('https://api.jikan.moe/v4/top/people?limit=15', { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return (data.data || []).map((person: any) => ({
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
    const res = await fetch(`https://api.jikan.moe/v4/people/${id}/full`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error("getPersonDetailsJikan Error:", error);
    return null;
  }
}

// --- MANGA / LIGHT NOVEL FUNCTIONS ---

export async function getMangaFullDetails(id: string) {
  try {
    const res = await fetch(`${JIKAN_API_URL}/manga/${id}/full`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return data.data;
  } catch { 
    return null; 
  }
}

export async function getMangaCharacters(id: string) {
  try {
    const res = await fetch(`${JIKAN_API_URL}/manga/${id}/characters`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return data.data || []; 
  } catch { 
    return []; 
  }
}

export async function getMangaRecommendations(id: string) {
  try {
    const res = await fetch(`${JIKAN_API_URL}/manga/${id}/recommendations`, { next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
    return (data.data || []).map((rec: any) => ({
      id: rec.entry.mal_id,
      idMal: rec.entry.mal_id,
      title: {
        romaji: rec.entry.title,
        english: rec.entry.title,
      },
      coverImage: {
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
            node { id idMal title { english romaji } coverImage { large } format startDate { year month day } type }
          }
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: idMal } }),
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    const data = await res.json();
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

  const url = `https://api.jikan.moe/v4/manga?${queryParams.toString()}`;
  
  let retries = 3;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      const fetchOptions: any = {};
      if (queryText.trim()) {
        fetchOptions.cache = 'no-store';
      } else {
        fetchOptions.next = { revalidate: GLOBAL_CACHE_TIME };
      }
      const res = await fetch(url, fetchOptions);
      
      if (res.status === 429) {
        console.warn(`Jikan API 429 Rate Limit hit in searchMangaJikan. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
        continue;
      }
      
      if (!res.ok) throw new Error(`Jikan API returned status ${res.status}`);
      
      const data = await res.json();
      
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
      retries--;
      if (retries === 0) break;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  
  return { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
}

// ৭. Top Movies (For Homepage Lists)
export async function getTopMoviesAniList(): Promise<AniListMedia[]> {
  const query = `
    query {
      Page(page: 1, perPage: 4) {
        media(sort: SCORE_DESC, type: ANIME, format: MOVIE, isAdult: false) {
          id idMal title { romaji english } coverImage { large } averageScore format status episodes seasonYear
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large } averageScore format status episodes seasonYear
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), next: { revalidate: GLOBAL_CACHE_TIME } });
    const data = await res.json();
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
          id idMal title { romaji english } coverImage { large } averageScore format status episodes seasonYear
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_API_URL, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ query, variables: { year } }), 
      next: { revalidate: GLOBAL_CACHE_TIME } 
    });
    const data = await res.json();
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
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { ids } }),
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    const data = await res.json();
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
    const res = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { ids } }),
      next: { revalidate: GLOBAL_CACHE_TIME }
    });
    const data = await res.json();
    return data.data.Page.media as AniListMedia[];
  } catch {
    return [] as AniListMedia[];
  }
}



