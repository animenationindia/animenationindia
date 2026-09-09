// backend/services/malService.js
// Official MyAnimeList API v2 Service with 5-Key Round-Robin & Deduplication
const { toEnglishTitle, normalizeTitleObject } = require('./titleCleaner');

const MAL_API_BASE = 'https://api.myanimelist.net/v2';

const getClientIds = () => {
  const keys = [
    process.env.MAL_CLIENT_ID_1,
    process.env.MAL_CLIENT_ID_2,
    process.env.MAL_CLIENT_ID_3,
    process.env.MAL_CLIENT_ID_4,
    process.env.MAL_CLIENT_ID_5,
    process.env.MAL_CLIENT_ID
  ].filter(Boolean);
  return Array.from(new Set(keys));
};

let keyIndex = 0;
const getNextClientId = () => {
  const keys = getClientIds();
  if (keys.length === 0) return 'f6cd787eb297c144b5cebd2ef50026c3';
  const selected = keys[keyIndex % keys.length];
  keyIndex = (keyIndex + 1) % keys.length;
  return selected;
};

const memoryCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchMAL(endpoint, ttlMs = DEFAULT_CACHE_TTL, timeoutMs = 5000) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cacheKey = `mal:${cleanEndpoint}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < ttlMs)) {
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const execute = async () => {
    const clientId = getNextClientId();
    const targetUrl = `${MAL_API_BASE}${cleanEndpoint}`;

    const res = await fetch(targetUrl, {
      headers: {
        'X-MAL-CLIENT-ID': clientId,
        'User-Agent': 'AnimeNationIndia/2.0 (https://www.animenationindia.online)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) {
      if (cached) return cached.data;
      const errText = await res.text().catch(() => '');
      throw new Error(`MAL API HTTP ${res.status}: ${errText || res.statusText}`);
    }

    const data = await res.json();
    if (data) {
      memoryCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data;
  };

  const promise = execute().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

async function getAnimeDetails(id) {
  const numId = Number(id);
  if (!numId || isNaN(numId) || numId > 65000) return null;

  const fields = 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics';
  
  const raw = await fetchMAL(`/anime/${numId}?fields=${encodeURIComponent(fields)}`, 6 * 60 * 60 * 1000);
  if (!raw || !raw.id) return null;

  const formatMap = { tv: 'TV', movie: 'Movie', ova: 'OVA', ona: 'ONA', special: 'Special', music: 'Music' };
  const statusMap = { finished_airing: 'Finished Airing', currently_airing: 'Currently Airing', not_yet_aired: 'Not yet aired' };
  const largePic = raw.main_picture?.large || raw.main_picture?.medium || '';
  const alt = raw.alternative_titles || {};

  return {
    mal_id: raw.id,
    id: raw.id,
    title: toEnglishTitle(alt.en || raw.title),
    title_english: toEnglishTitle(alt.en || raw.title),
    title_japanese: alt.ja || '',
    synopsis: raw.synopsis || '',
    images: {
      webp: { image_url: largePic, small_image_url: raw.main_picture?.medium || largePic, large_image_url: largePic },
      jpg: { image_url: largePic, small_image_url: raw.main_picture?.medium || largePic, large_image_url: largePic }
    },
    trailer: null,
    score: typeof raw.mean === 'number' ? raw.mean : null,
    scored_by: raw.num_scoring_users || null,
    rank: raw.rank || null,
    popularity: raw.popularity || null,
    members: raw.num_list_users || null,
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
    genres: (raw.genres || []).map(g => ({ mal_id: g.id, name: g.name })),
    studios: (raw.studios || []).map(s => ({ mal_id: s.id, name: s.name })),
    relations: Array.isArray(raw.related_anime) ? raw.related_anime.map(rel => ({
      relation: rel.relation_type_formatted || 'Related',
      entry: [{
        mal_id: rel.node?.id,
        type: 'anime',
        name: toEnglishTitle(rel.node?.title),
        url: `https://myanimelist.net/anime/${rel.node?.id}`
      }]
    })) : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map(rec => ({
      entry: {
        mal_id: rec.node?.id,
        title: toEnglishTitle(rec.node?.alternative_titles?.en || rec.node?.title),
        images: {
          jpg: { image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium, large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium },
          webp: { image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium, large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium }
        }
      },
      votes: rec.num_recommendations || 1
    })) : []
  };
}

async function getRankings(rankingType = 'all', limit = 24, offset = 0) {
  const fields = 'id,title,alternative_titles,main_picture,mean,rank,popularity,genres,media_type,num_episodes,start_season';
  const raw = await fetchMAL(`/anime/ranking?ranking_type=${rankingType}&limit=${limit}&offset=${offset}&fields=${encodeURIComponent(fields)}`, 60 * 60 * 1000);
  
  if (!raw || !Array.isArray(raw.data)) return [];

  return raw.data.map(item => {
    const node = item.node || {};
    const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
    const alt = node.alternative_titles || {};
    const titles = normalizeTitleObject({ english: alt.en, romaji: node.title, native: alt.ja });
    return {
      id: node.id,
      idMal: node.id,
      title: titles,
      coverImage: { large: cover, extraLarge: cover },
      format: (node.media_type || 'TV').toUpperCase(),
      averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : null,
      seasonYear: node.start_season?.year || null,
      genres: (node.genres || []).map(g => g.name),
      episodes: node.num_episodes || null
    };
  });
}

async function searchAnime(query, limit = 20) {
  if (!query || !query.trim()) return [];
  const fields = 'id,title,alternative_titles,main_picture,mean,rank,popularity,genres,media_type,num_episodes,start_season';
  const raw = await fetchMAL(`/anime?q=${encodeURIComponent(query.trim())}&limit=${limit}&fields=${encodeURIComponent(fields)}`, 30 * 60 * 1000);

  if (!raw || !Array.isArray(raw.data)) return [];

  return raw.data.map(item => {
    const node = item.node || {};
    const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
    const alt = node.alternative_titles || {};
    const titles = normalizeTitleObject({ english: alt.en, romaji: node.title, native: alt.ja });
    return {
      id: node.id,
      idMal: node.id,
      title: titles,
      coverImage: { large: cover, extraLarge: cover },
      format: (node.media_type || 'TV').toUpperCase(),
      averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : null,
      seasonYear: node.start_season?.year || null,
      genres: (node.genres || []).map(g => g.name)
    };
  });
}

async function getRecommendations(id) {
  const numId = Number(id);
  if (!numId || isNaN(numId) || numId > 65000) return [];

  const raw = await fetchMAL(`/anime/${numId}?fields=recommendations{num_recommendations,node{id,title,alternative_titles,main_picture}}`, 12 * 60 * 60 * 1000);
  if (!raw || !Array.isArray(raw.recommendations)) return [];

  return raw.recommendations.map(rec => ({
    entry: {
      mal_id: rec.node?.id,
      title: toEnglishTitle(rec.node?.alternative_titles?.en || rec.node?.title),
      images: {
        jpg: { image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium, large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium },
        webp: { image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium, large_image_url: rec.node?.main_picture?.large || rec.node?.main_picture?.medium }
      }
    },
    votes: rec.num_recommendations || 1
  }));
}

async function getSearchSuggestions(query, limit = 5) {
  if (!query || !query.trim()) return [];
  const fields = 'id,title,alternative_titles,main_picture,mean,media_type,start_season';
  const raw = await fetchMAL(`/anime?q=${encodeURIComponent(query.trim())}&limit=${limit}&fields=${encodeURIComponent(fields)}`, 15 * 60 * 1000);

  if (!raw || !Array.isArray(raw.data)) return [];

  return raw.data.map(item => {
    const node = item.node || {};
    const alt = node.alternative_titles || {};
    return {
      id: node.id,
      title: toEnglishTitle(alt.en || node.title),
      coverImage: node.main_picture?.medium || node.main_picture?.large || '/placeholder-poster.png',
      format: (node.media_type || 'TV').toUpperCase(),
      score: node.mean || null,
      year: node.start_season?.year || null
    };
  });
}

async function getTopManga(rankingType = 'all', limit = 24, offset = 0) {
  let type = rankingType;
  let lim = limit;
  let off = offset;

  if (typeof rankingType === 'number') {
    lim = rankingType;
    type = 'all';
    off = limit || 0;
  }

  const fields = 'id,title,alternative_titles,main_picture,mean,rank,popularity,genres,media_type,num_chapters,num_volumes,authors{node{first_name,last_name}}';
  const raw = await fetchMAL(`/manga/ranking?ranking_type=${type}&limit=${lim}&offset=${off}&fields=${encodeURIComponent(fields)}`, 60 * 60 * 1000);
  
  if (!raw || !Array.isArray(raw.data)) return [];

  return raw.data.map(item => {
    const node = item.node || {};
    const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
    const alt = node.alternative_titles || {};
    const authors = (node.authors || []).map(a => `${a.node?.first_name || ''} ${a.node?.last_name || ''}`.trim()).filter(Boolean);
    const titles = normalizeTitleObject({ english: alt.en, romaji: node.title });
    return {
      id: node.id,
      idMal: node.id,
      title: titles,
      coverImage: { large: cover, extraLarge: cover },
      format: (node.media_type || 'MANGA').toUpperCase(),
      averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : null,
      genres: (node.genres || []).map(g => g.name),
      chapters: node.num_chapters || null,
      volumes: node.num_volumes || null,
      authors
    };
  });
}

async function searchManga(query, limit = 20) {
  if (!query || !query.trim()) return [];
  const fields = 'id,title,alternative_titles,main_picture,mean,rank,popularity,genres,media_type,num_chapters,num_volumes,authors{node{first_name,last_name}}';
  const raw = await fetchMAL(`/manga?q=${encodeURIComponent(query.trim())}&limit=${limit}&fields=${encodeURIComponent(fields)}`, 30 * 60 * 1000);

  if (!raw || !Array.isArray(raw.data)) return [];

  return raw.data.map(item => {
    const node = item.node || {};
    const cover = node.main_picture?.large || node.main_picture?.medium || '/placeholder-poster.png';
    const alt = node.alternative_titles || {};
    const authors = (node.authors || []).map(a => `${a.node?.first_name || ''} ${a.node?.last_name || ''}`.trim()).filter(Boolean);
    const titles = normalizeTitleObject({ english: alt.en, romaji: node.title });
    return {
      id: node.id,
      idMal: node.id,
      title: titles,
      coverImage: { large: cover, extraLarge: cover },
      format: (node.media_type || 'MANGA').toUpperCase(),
      averageScore: typeof node.mean === 'number' ? Math.round(node.mean * 10) : null,
      genres: (node.genres || []).map(g => g.name),
      chapters: node.num_chapters || null,
      volumes: node.num_volumes || null,
      authors
    };
  });
}

async function getMangaDetails(id) {
  const numId = Number(id);
  if (!numId || isNaN(numId)) return null;

  const fields = 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,genres,media_type,status,num_volumes,num_chapters,authors{node{first_name,last_name}},pictures,background,related_anime,related_manga,recommendations';
  const raw = await fetchMAL(`/manga/${numId}?fields=${encodeURIComponent(fields)}`, 6 * 60 * 60 * 1000);
  if (!raw || !raw.id) return null;

  const largePic = raw.main_picture?.large || raw.main_picture?.medium || '';
  const alt = raw.alternative_titles || {};
  const authors = (raw.authors || []).map(a => `${a.node?.first_name || ''} ${a.node?.last_name || ''}`.trim()).filter(Boolean);
  const titles = normalizeTitleObject({ english: alt.en, romaji: raw.title, native: alt.ja });

  return {
    id: raw.id,
    idMal: raw.id,
    title: titles,
    synopsis: raw.synopsis || '',
    description: raw.synopsis || '',
    coverImage: { large: largePic, extraLarge: largePic },
    bannerImage: null,
    averageScore: typeof raw.mean === 'number' ? Math.round(raw.mean * 10) : null,
    score: raw.mean || null,
    chapters: raw.num_chapters || null,
    volumes: raw.num_volumes || null,
    format: (raw.media_type || 'MANGA').toUpperCase(),
    status: raw.status === 'finished' ? 'FINISHED' : 'RELEASING',
    genres: (raw.genres || []).map(g => g.name),
    startDate: raw.start_date ? { year: new Date(raw.start_date).getFullYear() } : null,
    authors,
    staff: { nodes: authors.map(name => ({ id: null, name: { full: name } })) }
  };
}

module.exports = {
  fetchMAL,
  getAnimeDetails,
  getRankings,
  searchAnime,
  getSearchSuggestions,
  getRecommendations,
  getTopManga,
  searchManga,
  getMangaDetails,
  getClientCount: () => getClientIds().length
};
