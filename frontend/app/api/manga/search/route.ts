import { NextResponse } from 'next/server';
import { fetchAniList } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const genre = searchParams.get('genre') || '';

  if (!q.trim() && !genre.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    let country: string | undefined = undefined;
    let format: string | undefined = undefined;

    const cleanType = (type || '').toLowerCase();
    if (cleanType === 'manhwa') {
      country = 'KR';
    } else if (cleanType === 'manhua') {
      country = 'CN';
    } else if (cleanType === 'manga') {
      country = 'JP';
      format = 'MANGA';
    } else if (cleanType === 'novel' || cleanType === 'lightnovel') {
      format = 'NOVEL';
    }

    let queryArgs = `$search: String, $genre: String`;
    let mediaArgs = `search: $search, genre: $genre, type: MANGA, isAdult: false, sort: [SEARCH_MATCH, POPULARITY_DESC]`;

    const variables: any = {
      search: q.trim() || undefined,
      genre: genre.trim() || undefined,
    };

    if (format) {
      queryArgs += `, $format: MediaFormat`;
      mediaArgs += `, format: $format`;
      variables.format = format;
    }

    if (country) {
      queryArgs += `, $country: CountryCode`;
      mediaArgs += `, countryOfOrigin: $country`;
      variables.country = country;
    }

    const query = `
      query (${queryArgs}) {
        Page(page: 1, perPage: 12) {
          media(${mediaArgs}) {
            id
            title { english romaji native }
            coverImage { extraLarge large medium }
            format
            averageScore
            status
            seasonYear
            countryOfOrigin
            startDate { year }
            genres
          }
        }
      }
    `;

    const res = await fetchAniList(query, variables);
    const media = res?.data?.Page?.media || [];

    const results = media.slice(0, 8).map((m: any) => {
      let displayFormat = m.format ? m.format.replace(/_/g, ' ') : 'MANGA';
      if (m.countryOfOrigin === 'KR') displayFormat = 'MANHWA';
      else if (m.countryOfOrigin === 'CN') displayFormat = 'MANHUA';
      else if (m.format === 'NOVEL') displayFormat = 'NOVEL';

      return {
        id: m.id,
        title: m.title?.english || m.title?.romaji || 'Unknown Title',
        coverImage: m.coverImage?.large || m.coverImage?.extraLarge || '/placeholder-poster.png',
        format: displayFormat,
        score: m.averageScore ? (m.averageScore > 10 ? (m.averageScore / 10).toFixed(1) : Number(m.averageScore).toFixed(1)) : null,
        status: m.status,
        year: m.seasonYear || m.startDate?.year,
        genres: Array.isArray(m.genres) ? m.genres.slice(0, 3) : [],
        countryOfOrigin: m.countryOfOrigin || 'JP'
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
