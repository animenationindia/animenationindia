import { NextResponse } from 'next/server';
import { searchOfficialMAL } from '@/lib/mal-api';
import { fetchJikan, isSafeContent, GLOBAL_CACHE_TIME } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const format = searchParams.get('format') || '';
  const genre = searchParams.get('genre') || '';

  // 1. Primary: Official MAL API v2 via Backend BFF (5-Key Load Balanced Pool)
  if (q.trim() && !genre && !format) {
    try {
      const malResults = await searchOfficialMAL(q.trim(), 24);
      if (malResults && Array.isArray(malResults) && malResults.length > 0) {
        const media = malResults.map((anime: any) => ({
          id: anime.id,
          idMal: anime.id,
          idSystem: 'mal',
          title: {
            english: anime.title?.english || anime.title?.romaji || anime.title,
            romaji: anime.title?.romaji || anime.title
          },
          coverImage: {
            large: anime.coverImage?.large || '/placeholder-poster.png',
            extraLarge: anime.coverImage?.extraLarge || anime.coverImage?.large || '/placeholder-poster.png'
          },
          averageScore: anime.averageScore || (anime.score ? Math.round(anime.score * 10) : null),
          format: anime.format || 'TV',
          status: anime.status === 'finished_airing' ? 'FINISHED' : anime.status === 'currently_airing' ? 'RELEASING' : 'NOT_YET_RELEASED',
          episodes: anime.episodes || null,
          seasonYear: anime.seasonYear || anime.startDate?.year || null,
          startDate: anime.startDate || null,
          genres: anime.genres || [],
          description: anime.synopsis || anime.description || ''
        }));

        return NextResponse.json({
          media,
          pageInfo: {
            total: media.length,
            currentPage: page,
            lastPage: 1,
            hasNextPage: false
          }
        });
      }
    } catch (err: any) {
      console.warn('[Search API] MAL Official search failed, falling back to Jikan:', err?.message);
    }
  }

  // 2. Secondary: Jikan Fallback for advanced query combinations (genre/format/pagination)
  try {
    let endpoint = `/anime?page=${page}&limit=24&sfw=true`;
    if (q.trim()) endpoint += `&q=${encodeURIComponent(q.trim())}`;
    if (format) endpoint += `&type=${encodeURIComponent(format.toLowerCase())}`;
    if (genre) endpoint += `&genres=${encodeURIComponent(genre)}`;
    if (!q.trim()) endpoint += `&order_by=popularity&sort=asc`;

    const jikanRes = await fetchJikan(endpoint, GLOBAL_CACHE_TIME, 2500);
    if (jikanRes?.data && Array.isArray(jikanRes.data) && jikanRes.data.length > 0) {
      const safeData = jikanRes.data.filter((item: any) => isSafeContent(item));
      const media = safeData.map((anime: any) => ({
        id: anime.mal_id,
        idMal: anime.mal_id,
        idSystem: 'mal',
        title: {
          english: anime.title_english || anime.title,
          romaji: anime.title
        },
        coverImage: {
          large: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '/placeholder-poster.png',
          extraLarge: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/placeholder-poster.png'
        },
        averageScore: anime.score ? Math.round(anime.score * 10) : null,
        format: anime.type || 'TV',
        status: anime.status === 'Currently Airing' ? 'RELEASING' : anime.status === 'Finished Airing' ? 'FINISHED' : 'NOT_YET_RELEASED',
        episodes: anime.episodes || null,
        seasonYear: anime.year || (anime.aired?.prop?.from?.year) || null,
        startDate: { year: anime.year || (anime.aired?.prop?.from?.year) || null },
        genres: (anime.genres || []).map((g: any) => g.name),
        description: anime.synopsis || ''
      }));

      return NextResponse.json({
        media,
        pageInfo: {
          total: jikanRes.pagination?.items?.total || media.length,
          currentPage: page,
          lastPage: jikanRes.pagination?.last_visible_page || 1,
          hasNextPage: jikanRes.pagination?.has_next_page || false
        }
      });
    }
  } catch (err: any) {
    console.warn('[Search API] Jikan search fallback failed:', err?.message);
  }

  return NextResponse.json({
    media: [],
    pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false }
  });
}