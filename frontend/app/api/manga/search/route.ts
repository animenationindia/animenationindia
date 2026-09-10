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
    const query = `
      query ($search: String, $genre: String, $format: MediaFormat) {
        Page(page: 1, perPage: 12) {
          media(search: $search, genre: $genre, format: $format, type: MANGA, countryOfOrigin: "JP", isAdult: false, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
            id
            title { english romaji }
            coverImage { extraLarge large medium }
            format
            averageScore
            status
            seasonYear
            startDate { year }
            genres
          }
        }
      }
    `;

    const variables: any = {
      search: q.trim() || undefined,
      genre: genre.trim() || undefined,
      format: type ? (type.toUpperCase() === 'MANGA' ? 'MANGA' : (type.toUpperCase() === 'NOVEL' ? 'NOVEL' : undefined)) : undefined
    };

    const res = await fetchAniList(query, variables);
    const media = res?.data?.Page?.media || [];

    const results = media.slice(0, 8).map((m: any) => ({
      id: m.id,
      title: m.title?.english || m.title?.romaji || 'Unknown Title',
      coverImage: m.coverImage?.large || m.coverImage?.extraLarge || '/placeholder-poster.png',
      format: m.format || 'MANGA',
      score: m.averageScore ? (m.averageScore > 10 ? (m.averageScore / 10).toFixed(1) : Number(m.averageScore).toFixed(1)) : null,
      status: m.status,
      year: m.seasonYear || m.startDate?.year,
      genres: Array.isArray(m.genres) ? m.genres.slice(0, 3) : []
    }));

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
