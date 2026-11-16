import { BACKEND_URL } from '../../lib/config';

export const revalidate = 600; // 10 minutes

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/news/feed.xml`, {
      headers: { 'Accept': 'application/xml' },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const xml = await res.text();
      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
        },
      });
    }
    throw new Error(`Upstream returned ${res.status}`);
  } catch (error) {
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Anime Nation India News</title>
    <link>https://www.animenationindia.online</link>
    <description>Latest Anime News, Trailers &amp; Updates</description>
  </channel>
</rss>`;
    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
