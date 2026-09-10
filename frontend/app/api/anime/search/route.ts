import { NextResponse } from 'next/server';
import { searchOfficialMAL } from '@/lib/mal-api';
import { fetchAniList } from '@/lib/api';

export const dynamic = 'force-dynamic';

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
      console.warn('[Search API] MAL Official search failed, falling back to AniList:', err?.message);
    }
  }

  // 2. Secondary: AniList GraphQL Search via Backend Proxy
  try {
    const graphqlQuery = `
      query ($page: Int, $perPage: Int, $search: String, $genre: String, $format: MediaFormat) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage lastPage hasNextPage }
          media(search: $search, genre: $genre, format: $format, type: ANIME, countryOfOrigin: "JP", isAdult: false, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
            id
            idMal
            title { english romaji }
            coverImage { extraLarge large medium }
            averageScore
            format
            status
            episodes
            seasonYear
            startDate { year }
            genres
            description
          }
        }
      }
    `;

    const variables: any = {
      page,
      perPage: 24,
      search: q.trim() || undefined,
      genre: genre.trim() || undefined,
      format: format.trim() ? format.toUpperCase() : undefined
    };

    const res = await fetchAniList(graphqlQuery, variables);
    const media = res?.data?.Page?.media;
    const pageInfo = res?.data?.Page?.pageInfo;

    if (media && Array.isArray(media) && media.length > 0) {
      return NextResponse.json({
        media: media.map((anime: any) => ({
          id: anime.id,
          idMal: anime.idMal || anime.id,
          idSystem: 'anilist',
          title: anime.title,
          coverImage: {
            large: anime.coverImage?.large || '/placeholder-poster.png',
            extraLarge: anime.coverImage?.extraLarge || anime.coverImage?.large || '/placeholder-poster.png'
          },
          averageScore: anime.averageScore,
          format: anime.format,
          status: anime.status,
          episodes: anime.episodes,
          seasonYear: anime.seasonYear || anime.startDate?.year,
          startDate: anime.startDate,
          genres: anime.genres || [],
          description: anime.description || ''
        })),
        pageInfo: pageInfo || { total: media.length, currentPage: page, lastPage: 1, hasNextPage: false }
      });
    }
  } catch (err: any) {
    console.warn('[Search API] AniList search fallback error:', err?.message);
  }

  return NextResponse.json({
    media: [],
    pageInfo: { total: 0, currentPage: page, lastPage: 1, hasNextPage: false }
  });
}