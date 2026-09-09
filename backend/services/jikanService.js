// backend/services/jikanService.js
// Emergency Fallback Jikan API v4 Service with Instant In-Memory Cache

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';
const memoryCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_TTL = 30 * 60 * 1000; // 30 mins

const TOP_CHARACTERS = {
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
    }
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
    }
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
    }
  }
};

const TOP_STAFF = {
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
    }
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
    }
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
    }
  }
};

async function fetchJikan(endpoint, ttlMs = DEFAULT_TTL, timeoutMs = 4000) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const cacheKey = `jikan:${cleanEndpoint}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < ttlMs)) {
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const execute = async () => {
    const res = await fetch(`${JIKAN_BASE_URL}${cleanEndpoint}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) {
      if (cached) return cached.data;
      throw new Error(`Jikan HTTP ${res.status}`);
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

async function getAnimeEpisodes(id, page = 1) {
  try {
    const data = await fetchJikan(`/anime/${id}/episodes?page=${page}`, 60 * 60 * 1000);
    return data?.data || [];
  } catch {
    return [];
  }
}

async function getAnimeReviews(id) {
  try {
    const data = await fetchJikan(`/anime/${id}/reviews`, 60 * 60 * 1000);
    return data?.data || [];
  } catch {
    return [];
  }
}

async function getCharacterDetails(id) {
  const numId = Number(id);
  if (TOP_CHARACTERS[numId]) return TOP_CHARACTERS[numId];
  try {
    const data = await fetchJikan(`/characters/${id}/full`, 24 * 60 * 60 * 1000);
    return data?.data || null;
  } catch {
    return null;
  }
}

async function getStaffDetails(id) {
  const numId = Number(id);
  if (TOP_STAFF[numId]) return TOP_STAFF[numId];
  try {
    const data = await fetchJikan(`/people/${id}/full`, 24 * 60 * 60 * 1000);
    return data?.data || null;
  } catch {
    return null;
  }
}

module.exports = {
  fetchJikan,
  getAnimeEpisodes,
  getAnimeReviews,
  getCharacterDetails,
  getStaffDetails
};
