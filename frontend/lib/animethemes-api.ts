export interface NormalizedTheme {
  id: string;
  type: 'OP' | 'ED';
  sequence: number;
  slug: string;
  songTitle: string;
  artists: string[];
  videoUrl: string;
  audioUrl?: string;
  animeId?: number;
  animeTitle?: string;
  animeImage?: string;
}

const ANIMETHEMES_API_BASE = 'https://api.animethemes.moe';

/**
 * Fetches all Opening (OP) and Ending (ED) theme songs with audio/video links from AnimeThemes.moe API
 * Using MAL ID resources mapping filter.
 */
export async function fetchAnimeThemes(
  malId: number | string,
  meta?: { title?: string; image?: string }
): Promise<NormalizedTheme[]> {
  if (!malId) return [];

  const numericMalId = Number(malId);
  if (isNaN(numericMalId) || numericMalId <= 0) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const url = `${ANIMETHEMES_API_BASE}/anime?filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${numericMalId}&include=animethemes.song.artists,animethemes.animethemeentries.videos.audio`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AnimeNationIndia/1.0 (https://animenation.india)',
        Accept: 'application/json',
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404 || res.status === 422) return [];
      console.warn(`[AnimeThemes API] Received HTTP status ${res.status} for MAL ID: ${numericMalId}`);
      return [];
    }

    const data = await res.json();
    const animeData = data?.anime?.[0];
    if (!animeData || !Array.isArray(animeData.animethemes)) {
      return [];
    }

    const animeName = meta?.title || animeData.name || 'Anime';
    const animeImg = meta?.image || '';

    const normalizedThemes: NormalizedTheme[] = [];

    for (const theme of animeData.animethemes) {
      const type: 'OP' | 'ED' = theme.type === 'ED' ? 'ED' : 'OP';
      const sequence = typeof theme.sequence === 'number' ? theme.sequence : 1;
      const slug = theme.slug || `${type}${sequence}`;
      const songTitle = theme.song?.title || `${type} ${sequence}`;
      
      const artists: string[] = Array.isArray(theme.song?.artists)
        ? theme.song.artists.map((a: any) => a.name).filter(Boolean)
        : [];

      // Extract best video/audio links from animethemeentries
      let videoUrl = '';
      let audioUrl = '';

      if (Array.isArray(theme.animethemeentries) && theme.animethemeentries.length > 0) {
        for (const entry of theme.animethemeentries) {
          if (Array.isArray(entry.videos) && entry.videos.length > 0) {
            const vid = entry.videos[0];
            if (vid.link) {
              videoUrl = vid.link;
            }
            if (vid.audio?.link) {
              audioUrl = vid.audio.link;
            }
            if (videoUrl || audioUrl) break;
          }
        }
      }

      if (videoUrl || audioUrl) {
        normalizedThemes.push({
          id: `theme-${theme.id || `${numericMalId}-${slug}`}`,
          type,
          sequence,
          slug,
          songTitle,
          artists,
          videoUrl,
          audioUrl: audioUrl || videoUrl,
          animeId: numericMalId,
          animeTitle: animeName,
          animeImage: animeImg,
        });
      }
    }

    // Sort themes: OP1, OP2, ... ED1, ED2, ...
    normalizedThemes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'OP' ? -1 : 1;
      }
      return a.sequence - b.sequence;
    });

    return normalizedThemes;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name !== 'AbortError') {
      console.error(`[AnimeThemes API] Error fetching themes for MAL ID ${numericMalId}:`, error?.message);
    }
    return [];
  }
}
