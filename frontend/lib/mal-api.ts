/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/mal-api.ts
// Official MyAnimeList (MAL) API v2 Integration

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://animenationindia.onrender.com');
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID || 'f6cd787eb297c144b5cebd2ef50026c3';
const MAL_API_BASE = 'https://api.myanimelist.net/v2';

const malClientMemoryCache = new Map<string, { data: any; timestamp: number }>();
const inFlightMalPromises = new Map<string, Promise<any>>();
const MAL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Generic fetcher for Official MyAnimeList API v2 with backend proxy and direct fallback
 */
export async function fetchOfficialMAL(endpoint: string, timeoutMs = 5000): Promise<any> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cacheKey = `mal:${cleanEndpoint}`;

  // 1. In-memory cache check
  const cached = malClientMemoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < MAL_CACHE_TTL)) {
    return cached.data;
  }

  // 2. In-flight promise reuse
  if (inFlightMalPromises.has(cacheKey)) {
    return inFlightMalPromises.get(cacheKey);
  }

  const executeFetch = async () => {
    // A. Try Backend Proxy First (Fast In-Memory Cache on Port 5000)
    try {
      const proxyUrl = `${BACKEND_BASE_URL}/api/mal/proxy?endpoint=${encodeURIComponent(cleanEndpoint)}`;
      const proxyRes = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store'
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data && (data.id || data.data || data.title)) {
          malClientMemoryCache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      }
    } catch {}

    // B. Direct Official MAL API call with X-MAL-CLIENT-ID
    try {
      const targetUrl = `${MAL_API_BASE}${cleanEndpoint}`;
      const directRes = await fetch(targetUrl, {
        headers: {
          'X-MAL-CLIENT-ID': MAL_CLIENT_ID,
          'User-Agent': 'AnimeNationIndia/1.0 (https://www.animenationindia.online)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store'
      });

      if (directRes.ok) {
        const data = await directRes.json();
        if (data && (data.id || data.data || data.title)) {
          malClientMemoryCache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      }
    } catch (err: any) {
      console.warn(`[Official MAL API] Fetch failed for ${cleanEndpoint}:`, err.message);
    }

    return null;
  };

  const promise = executeFetch().finally(() => {
    inFlightMalPromises.delete(cacheKey);
  });

  inFlightMalPromises.set(cacheKey, promise);
  return promise;
}

/**
 * 1. Fetch Anime Full Details from Official MAL API v2
 */
export async function getOfficialMALAnimeDetails(id: number | string): Promise<any | null> {
  const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) : id;
  if (!numId || isNaN(numId) || numId > 65000) return null;

  const fields = 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics';
  
  const raw = await fetchOfficialMAL(`/anime/${numId}?fields=${encodeURIComponent(fields)}`);
  if (!raw || !raw.id) return null;

  // Format to unified Anime object (compatible with Jikan/AniList structure)
  const formatMap: Record<string, string> = {
    tv: 'TV',
    movie: 'Movie',
    ova: 'OVA',
    ona: 'ONA',
    special: 'Special',
    music: 'Music'
  };

  const statusMap: Record<string, string> = {
    finished_airing: 'Finished Airing',
    currently_airing: 'Currently Airing',
    not_yet_aired: 'Not yet aired'
  };

  const largePic = raw.main_picture?.large || raw.main_picture?.medium || '';
  const alt = raw.alternative_titles || {};

  return {
    mal_id: raw.id,
    id: raw.id,
    title: raw.title,
    title_english: alt.en || raw.title,
    title_japanese: alt.ja || '',
    synopsis: raw.synopsis || '',
    images: {
      webp: {
        image_url: largePic,
        small_image_url: raw.main_picture?.medium || largePic,
        large_image_url: largePic
      },
      jpg: {
        image_url: largePic,
        small_image_url: raw.main_picture?.medium || largePic,
        large_image_url: largePic
      }
    },
    trailer: null,
    score: typeof raw.mean === 'number' ? raw.mean : null,
    scored_by: raw.num_scoring_users || null,
    rank: raw.rank || null,
    popularity: raw.popularity || null,
    members: raw.num_list_users || null,
    favorites: null,
    type: formatMap[raw.media_type] || raw.media_type?.toUpperCase() || 'TV',
    status: statusMap[raw.status] || raw.status || 'Finished Airing',
    episodes: raw.num_episodes || null,
    duration: raw.average_episode_duration ? `${Math.round(raw.average_episode_duration / 60)} min` : null,
    rating: raw.rating ? raw.rating.toUpperCase() : 'PG-13',
    season: raw.start_season?.season ? `${raw.start_season.season.toUpperCase()} ${raw.start_season.year || ''}`.trim() : null,
    year: raw.start_season?.year || (raw.start_date ? new Date(raw.start_date).getFullYear() : null),
    aired: {
      from: raw.start_date || null,
      to: raw.end_date || null,
      string: raw.start_date ? (raw.end_date ? `${raw.start_date} to ${raw.end_date}` : raw.start_date) : null
    },
    broadcast: raw.broadcast ? {
      day: raw.broadcast.day_of_the_week || null,
      time: raw.broadcast.start_time || null
    } : null,
    genres: (raw.genres || []).map((g: any) => ({ mal_id: g.id, name: g.name })),
    studios: (raw.studios || []).map((s: any) => ({ mal_id: s.id, name: s.name })),
    relations: Array.isArray(raw.related_anime) ? raw.related_anime.map((rel: any) => ({
      relation: rel.relation_type_formatted || 'Related',
      entry: [{
        mal_id: rel.node?.id,
        type: 'anime',
        name: rel.node?.title,
        url: `https://myanimelist.net/anime/${rel.node?.id}`
      }]
    })) : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map((rec: any) => ({
      entry: {
        mal_id: rec.node?.id,
        title: rec.node?.title,
        images: {
          jpg: {
            image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium,
            large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium
          },
          webp: {
            image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium,
            large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium
          }
        }
      },
      votes: rec.num_recommendations || 1
    })) : []
  };
}

/**
 * 2. Fetch Anime Recommendations from Official MAL API v2
 */
export async function getOfficialMALRecommendations(id: number | string): Promise<any[]> {
  const numId = typeof id === 'string' ? parseInt(id.replace(/\D/g, ''), 10) : id;
  if (!numId || isNaN(numId) || numId > 65000) return [];

  const raw = await fetchOfficialMAL(`/anime/${numId}?fields=recommendations{num_recommendations,node{id,title,main_picture}}`);
  if (!raw || !Array.isArray(raw.recommendations)) return [];

  return raw.recommendations.map((rec: any) => ({
    entry: {
      mal_id: rec.node?.id,
      title: rec.node?.title,
      images: {
        jpg: {
          image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium,
          large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium
        },
        webp: {
          image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium,
          large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium
        }
      }
    },
    votes: rec.num_recommendations || 1
  }));
}

/**
 * 3. Fetch Top Ranking Anime from Official MAL API v2
 */
export async function getOfficialMALRankings(rankingType = 'all', limit = 24, offset = 0): Promise<any[]> {
  const validRankings = ['all', 'airing', 'upcoming', 'tv', 'movie', 'ova', 'special', 'bypopularity', 'favorite'];
  const type = validRankings.includes(rankingType) ? rankingType : 'all';

  const fields = 'id,title,main_picture,mean,rank,popularity,genres,media_type,num_episodes,start_season';
  const raw = await fetchOfficialMAL(`/anime/ranking?ranking_type=${type}&limit=${limit}&offset=${offset}&fields=${encodeURIComponent(fields)}`);
  
  if (!raw || !Array.isArray(raw.data)) return [];

  return raw.data.map((item: any) => {
    const node = item.node || {};
    const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
    return {
      id: node.id,
      idMal: node.id,
      title: {
        english: node.title,
        romaji: node.title
      },
      coverImage: {
        large: cover,
        extraLarge: cover
      },
      format: (node.media_type || 'TV').toUpperCase(),
      averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : null,
      seasonYear: node.start_season?.year || null,
      genres: (node.genres || []).map((g: any) => g.name),
      episodes: node.num_episodes || null
    };
  });
}

/**
 * 4. Search Anime using Official MAL API v2
 */
export async function searchOfficialMAL(query: string, limit = 10): Promise<any[]> {
  if (!query || !query.trim()) return [];

  const fields = 'id,title,main_picture,mean,rank,popularity,genres,media_type,num_episodes,start_season';
  const raw = await fetchOfficialMAL(`/anime?q=${encodeURIComponent(query.trim())}&limit=${limit}&fields=${encodeURIComponent(fields)}`);

  if (!raw || !Array.isArray(raw.data)) return [];

  return raw.data.map((item: any) => {
    const node = item.node || {};
    const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
    return {
      id: node.id,
      idMal: node.id,
      title: {
        english: node.title,
        romaji: node.title
      },
      coverImage: {
        large: cover,
        extraLarge: cover
      },
      format: (node.media_type || 'TV').toUpperCase(),
      averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : null,
      seasonYear: node.start_season?.year || null,
      genres: (node.genres || []).map((g: any) => g.name)
    };
  });
}
