/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/tmdb-api.ts
import { logError } from './logger';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2bca404e6766fc6ac7cb29ae38db027f';
const TMDB_BASE_URL = 'https://api.tmdb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface TMDBProvider {
  name: string;
  logoUrl: string;
}

export interface TMDBEpisode {
  episodeNumber: number;
  name: string;
  overview: string;
  stillUrl: string | null;
  airDate: string;
  runtime: number | null;
}

export interface TMDBAnimeData {
  tmdbId: number;
  originalLanguage: string;
  spokenLanguages: Array<{ name: string; iso: string }>;
  subtitleLanguages: Array<{ name: string; iso: string }>;
  logoUrl: string | null;
  backdropUrl: string | null;
  trailerYoutubeId: string | null;
  watchProvidersIndia: TMDBProvider[];
  watchProvidersGlobal: TMDBProvider[];
  overview?: string;
  episodes?: TMDBEpisode[];
}

// Clean title for TMDB search (remove season brackets, formats, etc.)
function cleanSearchQuery(title: string): string {
  return title
    .replace(/\s*\(TV\)/gi, '')
    .replace(/\s*Season\s*\d+/gi, '')
    .replace(/\s*Part\s*\d+/gi, '')
    .replace(/\s*2nd\s*Season/gi, '')
    .replace(/\s*3rd\s*Season/gi, '')
    .replace(/\s*4th\s*Season/gi, '')
    .replace(/\s*Final\s*Season/gi, '')
    .replace(/[:\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch season episode details with crystal-clear 1080p/720p still screencaps
 */
export async function getTMDBSeasonEpisodes(tmdbId: number, seasonNumber = 1): Promise<TMDBEpisode[]> {
  if (!tmdbId) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 86400 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.episodes || []).map((ep: any) => ({
      episodeNumber: ep.episode_number,
      name: ep.name,
      overview: ep.overview,
      stillUrl: ep.still_path ? `${IMAGE_BASE_URL}/w500${ep.still_path}` : null,
      airDate: ep.air_date,
      runtime: ep.runtime
    }));
  } catch (err) {
    logError('getTMDBSeasonEpisodes', err);
    return [];
  }
}

/**
 * Fetch comprehensive TMDB data for an anime (Audio, Subtitles, ClearArt Logo, OTT Streaming, Trailers, Episode Stills)
 */
export async function getTMDBAnimeData(title: string, year?: number): Promise<TMDBAnimeData | null> {
  if (!title || !title.trim()) return null;

  try {
    const query = cleanSearchQuery(title);
    let searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    if (year) {
      searchUrl += `&first_air_date_year=${year}`;
    }

    const searchRes = await fetch(searchUrl, {
      next: { revalidate: 86400 } // Cache 24 hours
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    let show = searchData.results?.[0];

    // Fallback: If year-specific search had 0 results, retry without year filter
    if (!show && year) {
      const retryRes = await fetch(`${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`, {
        next: { revalidate: 86400 }
      });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        show = retryData.results?.[0];
      }
    }

    // Movie fallback if TV search had 0 results
    if (!show) {
      const movieRes = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`, {
        next: { revalidate: 86400 }
      });
      if (movieRes.ok) {
        const movieData = await movieRes.json();
        show = movieData.results?.[0];
      }
    }

    if (!show || !show.id) return null;
    const tmdbId = show.id;
    const isMovie = Boolean(show.title && !show.name);
    const mediaType = isMovie ? 'movie' : 'tv';

    // Parallel fetch: Details, Translations, Images, Watch Providers, Videos, Season 1 Episodes
    const [detailsRes, transRes, imagesRes, watchRes, videosRes, season1Res] = await Promise.allSettled([
      fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`, { next: { revalidate: 86400 } }).then(r => r.json()),
      fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}/translations?api_key=${TMDB_API_KEY}`, { next: { revalidate: 86400 } }).then(r => r.json()),
      fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}/images?api_key=${TMDB_API_KEY}`, { next: { revalidate: 86400 } }).then(r => r.json()),
      fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`, { next: { revalidate: 86400 } }).then(r => r.json()),
      fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}/videos?api_key=${TMDB_API_KEY}`, { next: { revalidate: 86400 } }).then(r => r.json()),
      !isMovie ? getTMDBSeasonEpisodes(tmdbId, 1) : Promise.resolve([])
    ]);

    const details = detailsRes.status === 'fulfilled' ? detailsRes.value : null;
    const trans = transRes.status === 'fulfilled' ? transRes.value : null;
    const images = imagesRes.status === 'fulfilled' ? imagesRes.value : null;
    const watch = watchRes.status === 'fulfilled' ? watchRes.value : null;
    const videos = videosRes.status === 'fulfilled' ? videosRes.value : null;
    const season1Episodes = season1Res.status === 'fulfilled' ? season1Res.value : [];

    // 1. Spoken Languages
    const spokenLanguages = (details?.spoken_languages || []).map((l: any) => ({
      name: l.english_name || l.name,
      iso: l.iso_639_1
    }));

    // 2. Subtitle Translations
    const subtitleLanguages = (trans?.translations || []).map((t: any) => ({
      name: t.english_name || t.name,
      iso: t.iso_639_1
    }));

    // 3. ClearArt Logo (Prefer English, fallback to Japanese or first available)
    let logoUrl: string | null = null;
    if (images?.logos && Array.isArray(images.logos) && images.logos.length > 0) {
      const enLogo = images.logos.find((l: any) => l.iso_639_1 === 'en');
      const jaLogo = images.logos.find((l: any) => l.iso_639_1 === 'ja');
      const selectedLogo = enLogo || jaLogo || images.logos[0];
      if (selectedLogo?.file_path) {
        logoUrl = `${IMAGE_BASE_URL}/original${selectedLogo.file_path}`;
      }
    }

    // 4. Backdrop
    let backdropUrl: string | null = null;
    if (details?.backdrop_path) {
      backdropUrl = `${IMAGE_BASE_URL}/original${details.backdrop_path}`;
    }

    // 5. Official Trailer (YouTube)
    let trailerYoutubeId: string | null = null;
    if (videos?.results && Array.isArray(videos.results)) {
      const officialTrailer = videos.results.find((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
      const anyYoutube = videos.results.find((v: any) => v.site === 'YouTube');
      trailerYoutubeId = officialTrailer?.key || anyYoutube?.key || null;
    }

    // 6. Watch Providers (India & US)
    const inFlatrate = watch?.results?.IN?.flatrate || watch?.results?.IN?.buy || [];
    const watchProvidersIndia: TMDBProvider[] = inFlatrate.map((p: any) => ({
      name: p.provider_name,
      logoUrl: `${IMAGE_BASE_URL}/w92${p.logo_path}`
    }));

    const usFlatrate = watch?.results?.US?.flatrate || [];
    const watchProvidersGlobal: TMDBProvider[] = usFlatrate.map((p: any) => ({
      name: p.provider_name,
      logoUrl: `${IMAGE_BASE_URL}/w92${p.logo_path}`
    }));

    return {
      tmdbId,
      originalLanguage: details?.original_language || 'ja',
      spokenLanguages,
      subtitleLanguages,
      logoUrl,
      backdropUrl,
      trailerYoutubeId,
      watchProvidersIndia,
      watchProvidersGlobal,
      overview: details?.overview,
      episodes: season1Episodes
    };
  } catch (error) {
    logError('getTMDBAnimeData', error);
    return null;
  }
}
