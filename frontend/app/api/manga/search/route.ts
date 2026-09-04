export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { searchMangaJikan } from '../../../../lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || '';
  const genre = searchParams.get('genre') || '';

  if (!q.trim() && !genre.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await searchMangaJikan(q, 1, type, genre);
    const results = (data?.media || []).slice(0, 6).map((m: any) => ({
      id: m.id,
      title: m.title.english || m.title.romaji || 'Unknown Title',
      coverImage: m.coverImage?.large || m.coverImage?.extraLarge || '/placeholder-poster.png',
      format: m.format || 'MANGA',
      score: m.averageScore ? (m.averageScore > 10 ? (m.averageScore / 10).toFixed(1) : Number(m.averageScore).toFixed(1)) : null,
      status: m.status,
      year: m.seasonYear,
      genres: Array.isArray(m.genres) ? m.genres.slice(0, 3) : []
    }));

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
