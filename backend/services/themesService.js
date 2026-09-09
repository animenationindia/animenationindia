// backend/services/themesService.js
// AnimeThemes API Service for OP/ED Songs & Video Streams

const ANIMETHEMES_API_URL = 'https://api.animethemes.moe';
const memoryCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getAnimeThemes(animeTitle, malId = null) {
  if (!animeTitle && !malId) return [];
  const queryKey = malId ? `mal:${malId}` : `title:${animeTitle.toLowerCase().trim()}`;
  const cacheKey = `themes:${queryKey}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const searchParam = malId 
      ? `filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${malId}`
      : `q=${encodeURIComponent(animeTitle)}&include=animethemes.song.artists,animethemes.animethemeentries.videos`;

    const url = `${ANIMETHEMES_API_URL}/anime?${searchParam}&include=animethemes.song.artists,animethemes.animethemeentries.videos`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'AnimeNationIndia/2.0' },
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) return [];

    const json = await res.json();
    const anime = json.anime?.[0];
    if (!anime || !Array.isArray(anime.animethemes)) return [];

    const themes = anime.animethemes.map(t => {
      const song = t.song || {};
      const artists = (song.artists || []).map(a => a.name).join(', ');
      const video = t.animethemeentries?.[0]?.videos?.[0];

      return {
        id: t.id,
        type: t.type, // 'OP' or 'ED'
        sequence: t.sequence || 1,
        title: song.title || `${t.type}${t.sequence || 1}`,
        artist: artists || 'Unknown Artist',
        videoUrl: video?.link || null,
        audioUrl: video?.audio?.link || null,
        resolution: video?.resolution || 720
      };
    });

    memoryCache.set(cacheKey, { data: themes, timestamp: Date.now() });
    return themes;
  } catch {
    return [];
  }
}

module.exports = {
  getAnimeThemes
};
