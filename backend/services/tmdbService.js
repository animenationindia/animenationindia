// backend/services/tmdbService.js
// TMDB API Service for 4K Backdrops & Logo Images

const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const TMDB_KEY = process.env.TMDB_API_KEY || '2bca404e6766fc6ac7cb29ae38db027f';
const memoryCache = new Map();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

async function getHeroBackdrop(title) {
  if (!title) return null;
  const cleanTitle = title.replace(/(.*?)/g, '').replace(/[.*?]/g, '').replace(/Season d+/i, '').trim();
  const cacheKey = `tmdb:${cleanTitle.toLowerCase()}`;

  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_KEY}&query=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;

    const data = await res.json();
    const show = data?.results?.[0];
    if (!show) return null;

    let logoUrl = null;
    try {
      const imgRes = await fetch(`${TMDB_BASE_URL}/tv/${show.id}/images?api_key=${TMDB_KEY}&include_image_language=en,ja,null`, { signal: AbortSignal.timeout(2000) });
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        const logo = (imgData.logos || []).find(l => l.iso_639_1 === 'en') || imgData.logos?.[0];
        if (logo) logoUrl = `https://image.tmdb.org/t/p/original${logo.file_path}`;
      }
    } catch {}

    const result = {
      tmdbId: show.id,
      backdropUrl: show.backdrop_path ? `https://image.tmdb.org/t/p/original${show.backdrop_path}` : null,
      logoUrl,
      overview: show.overview || null,
      voteAverage: show.vote_average || null
    };

    memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    return null;
  }
}

module.exports = {
  getHeroBackdrop
};
