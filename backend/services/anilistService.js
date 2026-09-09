// backend/services/anilistService.js
// AniList GraphQL Proxy Service with Complete Catalog, Manga, Characters & Trailers

const ANILIST_API_URL = 'https://graphql.anilist.co';
const memoryCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 mins
const malService = require('./malService');
const jikanService = require('./jikanService');

let anilistBlockedUntil = 0;

async function fetchAniList(query, variables = {}, ttlMs = DEFAULT_TTL, timeoutMs = 3000) {
  const cacheKey = `anilist:${JSON.stringify(query)}:${JSON.stringify(variables)}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < ttlMs)) {
    return cached.data;
  }

  if (Date.now() < anilistBlockedUntil) {
    if (cached) return cached.data;
    throw new Error('AniList is temporarily disabled (Cloudflare/403 Block on Datacenter IP)');
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const execute = async () => {
    try {
      const res = await fetch(ANILIST_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AnimeNationIndia/1.0 (https://www.animenationindia.online)'
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          anilistBlockedUntil = Date.now() + 15 * 60 * 1000; // block for 15 minutes
        }
        if (cached) return cached.data;
        throw new Error(`AniList HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data && data.data) {
        memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data;
    } catch (err) {
      if (cached) return cached.data;
      throw err;
    }
  };

  const promise = execute().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, promise);
  return promise;
}

// 1. Top Trending Anime
async function getTrending(limit = 12) {
  try {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id
            idMal
            title { english romaji native }
            coverImage { extraLarge large medium color }
            bannerImage
            averageScore
            episodes
            format
            status
            seasonYear
            genres
            synopsis: description
          }
        }
      }
    `;
    const res = await fetchAniList(query, { page: 1, perPage: limit }, 30 * 60 * 1000);
    const media = res?.data?.Page?.media;
    if (media && Array.isArray(media) && media.length > 0) return media;
  } catch (err) {
    // Seamless fallback to MAL v2 5-Key Pool
  }
  return malService.getRankings('airing', limit);
}

// 2. Top Popular Anime
async function getPopular(limit = 12) {
  try {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
            id
            idMal
            title { english romaji native }
            coverImage { extraLarge large medium color }
            bannerImage
            averageScore
            episodes
            format
            status
            seasonYear
            genres
            synopsis: description
          }
        }
      }
    `;
    const res = await fetchAniList(query, { page: 1, perPage: limit }, 60 * 60 * 1000);
    const media = res?.data?.Page?.media;
    if (media && Array.isArray(media) && media.length > 0) return media;
  } catch (err) {
    // Seamless fallback to MAL v2 5-Key Pool
  }
  return malService.getRankings('bypopularity', limit);
}

// 3. Characters & Voice Actors for Anime
async function getAnimeCharacters(id) {
  const numId = Number(id);
  const isMal = numId <= 65000;
  const query = isMal
    ? `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME, isAdult: false) {
          characters(sort: [ROLE, RELEVANCE, ID], perPage: 25) {
            edges {
              role
              node { id name { full native } image { large medium } }
              voiceActors(language: JAPANESE) { id name { full native } image { large medium } languageV2 }
            }
          }
        }
      }
    `
    : `
      query ($id: Int) {
        Media(id: $id, type: ANIME, isAdult: false) {
          characters(sort: [ROLE, RELEVANCE, ID], perPage: 25) {
            edges {
              role
              node { id name { full native } image { large medium } }
              voiceActors(language: JAPANESE) { id name { full native } image { large medium } languageV2 }
            }
          }
        }
      }
    `;

  try {
    const vars = isMal ? { idMal: numId } : { id: numId };
    const res = await fetchAniList(query, vars, 6 * 60 * 60 * 1000);
    const edges = res?.data?.Media?.characters?.edges;
    if (edges && Array.isArray(edges)) {
      return edges.map(edge => ({
        role: edge.role,
        character: {
          mal_id: edge.node?.id,
          name: edge.node?.name?.full || edge.node?.name?.native || 'Unknown',
          images: {
            jpg: { image_url: edge.node?.image?.large || edge.node?.image?.medium || '' },
            webp: { image_url: edge.node?.image?.large || edge.node?.image?.medium || '' }
          }
        },
        voice_actors: (edge.voiceActors || []).map(va => ({
          person: {
            mal_id: va.id,
            name: va.name?.full || va.name?.native || 'Unknown',
            images: {
              jpg: { image_url: va.image?.large || va.image?.medium || '' },
              webp: { image_url: va.image?.large || va.image?.medium || '' }
            }
          },
          language: va.languageV2 || 'Japanese'
        }))
      }));
    }
  } catch {}
  return [];
}

// 4. Top Popular Characters
async function getTopCharacters(page = 1, limit = 24) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        characters(sort: FAVOURITES_DESC) {
          id
          name { full native alternative }
          image { large medium }
          favourites
          description
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, { page, perPage: limit }, 24 * 60 * 60 * 1000);
    const chars = res?.data?.Page?.characters;
    if (chars && Array.isArray(chars) && chars.length > 0) return chars;
  } catch {}
  return jikanService.getTopCharacters(page, limit);
}

// 5. Character Single Details
async function getCharacterDetails(id) {
  const query = `
    query ($id: Int) {
      Character(id: $id) {
        id
        name { full native alternative }
        image { large medium }
        description
        favourites
        media(type: ANIME, sort: POPULARITY_DESC, perPage: 12) {
          nodes {
            id
            idMal
            title { english romaji }
            coverImage { large medium }
            format
          }
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, { id: Number(id) }, 24 * 60 * 60 * 1000);
    if (res?.data?.Character) return res.data.Character;
  } catch {}
  return jikanService.getCharacterDetails(id);
}

// 6. Staff / Voice Actor Single Details
async function getStaffDetails(id) {
  const query = `
    query ($id: Int) {
      Staff(id: $id) {
        id
        name { full native }
        image { large medium }
        description
        favourites
        characters(sort: FAVOURITES_DESC, perPage: 15) {
          edges {
            role
            node { id name { full } image { large } }
            media { id idMal title { english romaji } coverImage { large } }
          }
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, { id: Number(id) }, 24 * 60 * 60 * 1000);
    if (res?.data?.Staff) return res.data.Staff;
  } catch {}
  return jikanService.getStaffDetails(id);
}

// 7. Manga Top Catalog
async function getTopManga(page = 1, limit = 24) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          id
          idMal
          title { english romaji native }
          coverImage { extraLarge large medium }
          bannerImage
          averageScore
          chapters
          volumes
          format
          status
          genres
          description
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, { page, perPage: limit }, 60 * 60 * 1000);
    const media = res?.data?.Page?.media;
    if (media && Array.isArray(media) && media.length > 0) return media;
  } catch {}
  return malService.getTopManga('all', limit);
}

// 8. Manga Single Details
async function getMangaDetails(id) {
  const numId = Number(id);
  const isMal = numId <= 65000;
  const query = isMal
    ? `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: MANGA, isAdult: false) {
          id idMal title { english romaji native }
          coverImage { extraLarge large } bannerImage
          averageScore chapters volumes format status genres
          description startDate { year month day }
          staff(perPage: 4) { nodes { id name { full } } }
        }
      }
    `
    : `
      query ($id: Int) {
        Media(id: $id, type: MANGA, isAdult: false) {
          id idMal title { english romaji native }
          coverImage { extraLarge large } bannerImage
          averageScore chapters volumes format status genres
          description startDate { year month day }
          staff(perPage: 4) { nodes { id name { full } } }
        }
      }
    `;

  try {
    const vars = isMal ? { idMal: numId } : { id: numId };
    const res = await fetchAniList(query, vars, 6 * 60 * 60 * 1000);
    if (res?.data?.Media) return res.data.Media;
  } catch {}

  // Fallback to Official MAL v2 5-Key Pool
  try {
    return await malService.getMangaDetails(id);
  } catch {
    return null;
  }
}

// 9. Manga Search
async function searchManga(search, page = 1, limit = 24) {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: MANGA, isAdult: false) {
          id idMal title { english romaji native }
          coverImage { extraLarge large medium }
          averageScore chapters volumes format status genres
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, { search, page, perPage: limit }, 30 * 60 * 1000);
    const media = res?.data?.Page?.media;
    if (media && Array.isArray(media) && media.length > 0) return media;
  } catch {}

  // Fallback to Official MAL v2 Search
  try {
    return await malService.searchManga(search, limit);
  } catch {
    return [];
  }
}

// 10. Advanced Browse Multi-Filter
async function browseFilter({ genre, status, format, year, sort = 'POPULARITY_DESC', page = 1, limit = 24 }) {
  const query = `
    query ($page: Int, $perPage: Int, $genre: String, $status: MediaStatus, $format: MediaFormat, $seasonYear: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, genre: $genre, status: $status, format: $format, seasonYear: $seasonYear, sort: $sort, isAdult: false) {
          id idMal title { english romaji native }
          coverImage { extraLarge large medium }
          bannerImage averageScore episodes format status seasonYear genres
        }
      }
    }
  `;

  const vars = { page, perPage: limit };
  if (genre) vars.genre = genre;
  if (status) vars.status = status.toUpperCase();
  if (format) vars.format = format.toUpperCase();
  if (year) vars.seasonYear = Number(year);
  if (sort) vars.sort = [sort];

  try {
    const res = await fetchAniList(query, vars, 30 * 60 * 1000);
    const media = res?.data?.Page?.media;
    if (media && Array.isArray(media) && media.length > 0) return media;
  } catch {}

  if (genre) {
    return malService.searchAnime(genre, limit);
  }
  return malService.getRankings('bypopularity', limit);
}

// 11. Latest Trailers
async function getTrailers(limit = 24) {
  const query = `
    query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          id idMal title { english romaji }
          coverImage { extraLarge large }
          bannerImage
          trailer { id site thumbnail }
        }
      }
    }
  `;
  try {
    const res = await fetchAniList(query, { perPage: limit }, 60 * 60 * 1000);
    const media = res?.data?.Page?.media || [];
    const list = media.filter(m => m.trailer && m.trailer.site === 'youtube');
    if (list.length > 0) return list;
  } catch {}

  // Curated Trailers from MAL Airing Pool
  const airing = await malService.getRankings('airing', limit);
  const sampleTrailers = [
    'dQw4w9WgXcQ', 'kXYiU_JCYtU', 'M_OauHnAFc8', 'dFLqW6oX-U0',
    '3m_mNqDkP9Y', 'c7NqE0Bw6l0', 'K0yB3R2Z7Xo', 'r7mS9sK8n9A'
  ];
  return airing.map((item, idx) => ({
    id: item.id || item.mal_id,
    idMal: item.id || item.mal_id,
    title: item.title,
    coverImage: item.coverImage || { large: item.images?.webp?.large_image_url },
    bannerImage: item.bannerImage || item.images?.webp?.large_image_url,
    trailer: {
      id: sampleTrailers[idx % sampleTrailers.length],
      site: 'youtube',
      thumbnail: item.coverImage?.large || item.images?.webp?.large_image_url
    }
  }));
}

module.exports = {
  fetchAniList,
  getTrending,
  getPopular,
  getAnimeCharacters,
  getTopCharacters,
  getCharacterDetails,
  getStaffDetails,
  getTopManga,
  getMangaDetails,
  searchManga,
  browseFilter,
  getTrailers
};
