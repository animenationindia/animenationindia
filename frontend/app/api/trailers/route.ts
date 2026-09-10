import { NextResponse } from 'next/server';
import { getLiveAnimeTrailers, searchLiveAnimeTrailers } from '@/lib/trailers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    if (q && q.trim().length > 0) {
      const trailers = await searchLiveAnimeTrailers(q.trim());
      return NextResponse.json({ success: true, trailers });
    }

    const filter = (searchParams.get('filter') as 'all' | 'airing' | 'upcoming') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);

    const trailers = await getLiveAnimeTrailers({ filter, page, limit });
    return NextResponse.json({ success: true, trailers, page, limit });
  } catch (error: any) {
    return NextResponse.json({ success: false, trailers: [], error: error.message }, { status: 500 });
  }
}
