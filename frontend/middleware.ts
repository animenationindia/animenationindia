import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const match = pathname.match(/^\/series\/(\d+)/);
  const id = match ? match[1] : null;

  const requestHeaders = new Headers(request.headers);

  if (id) {
    let isAdult = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`, {
        signal: controller.signal,
        next: { revalidate: 3600 },
      } as any);
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const genres = [
          ...(json?.data?.genres || []),
          ...(json?.data?.explicit_genres || []),
          ...(json?.data?.themes || [])
        ];

        const adultKeywords = ['hentai', 'erotica', 'ecchi'];
        isAdult = genres.some((g: any) =>
          g?.name && adultKeywords.includes(g.name.toLowerCase().trim())
        );
      } else {
        // Fail-safe: Non-200 response -> treat as adult content to safely suppress RRM
        isAdult = true;
      }
    } catch (error) {
      // Fail-safe: Network error or timeout -> treat as adult content to safely suppress RRM
      console.warn(`[Middleware] Jikan fetch failed for series ID ${id}, applying adult fail-safe:`, error);
      isAdult = true;
    }

    requestHeaders.set('x-is-adult-content', isAdult ? '1' : '0');
  } else {
    // Fail-safe: Non-numeric / slug series path -> default to adult fail-safe ('1') to suppress RRM
    requestHeaders.set('x-is-adult-content', '1');
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/series/:path*'],
};
