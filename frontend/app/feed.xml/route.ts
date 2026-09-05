import { BACKEND_URL } from '../../lib/config';

export const revalidate = 600; // 10 minutes

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/feed.xml`, {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 }
    });
    const xml = await res.text();
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('Error proxying feed.xml:', error);
    return new Response('Error loading feed', { status: 500 });
  }
}
