import { NextResponse } from 'next/server';
import { getTMDBAnimeTrailers } from '@/lib/tmdb-api';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '16', 10);
    const trailers = await getTMDBAnimeTrailers(limit);
    return NextResponse.json({ success: true, trailers });
  } catch (error: any) {
    return NextResponse.json({ success: false, trailers: [], error: error.message }, { status: 500 });
  }
}
