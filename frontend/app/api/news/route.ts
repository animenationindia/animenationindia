import { NextResponse } from 'next/server';
import { getNews } from '@/lib/getNews';
import { getArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [newsResult, articlesResult] = await Promise.allSettled([
      getNews().catch(() => []),
      getArticles({ limit: 8 }).catch(() => [])
    ]);

    const news = newsResult.status === 'fulfilled' && Array.isArray(newsResult.value) ? newsResult.value : [];
    const articles = articlesResult.status === 'fulfilled' && Array.isArray(articlesResult.value) ? articlesResult.value : [];

    return NextResponse.json(
      { success: true, news, articles },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, news: [], articles: [], error: error.message }, { status: 500 });
  }
}
