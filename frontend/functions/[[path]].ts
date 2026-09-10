/* eslint-disable @typescript-eslint/no-explicit-any */
// Cloudflare Pages Edge Gateway & Global Reverse Proxy
// High-Speed Edge Caching (1-Year Static Assets) + Full Dynamic Pass-Through

export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);

  // 1. Google Site Verification / Search Console Pass-through (if any)
  if (url.pathname.startsWith('/google') && url.pathname.endsWith('.html')) {
    return context.next();
  }

  // 2. Robots.txt and Sitemap.xml Edge Acceleration
  if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
    // Pass through to upstream
  }

  // 3. Upstream Host Configuration (Render Fullstack Production Server)
  const backendHost = 'animenationindia.onrender.com';
  url.hostname = backendHost;
  url.protocol = 'https:';
  url.port = '';

  const modifiedHeaders = new Headers(context.request.headers);
  const clientHost = context.request.headers.get('host') || url.hostname;
  modifiedHeaders.set('x-forwarded-host', clientHost);
  modifiedHeaders.set('x-forwarded-proto', 'https');
  modifiedHeaders.set('x-real-ip', context.request.headers.get('cf-connecting-ip') || '');

  const proxyRequest = new Request(url.toString(), {
    method: context.request.method,
    headers: modifiedHeaders,
    body: context.request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);
    const responseHeaders = new Headers(response.headers);

    // 4. Ultra-Fast Global Static Caching (100% Free CDN offloading)
    if (
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff2')
    ) {
      responseHeaders.set('cache-control', 'public, max-age=31536000, immutable');
      responseHeaders.set('cdn-cache-control', 'public, max-age=31536000, immutable');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(
      '🌟 Anime Nation India Edge Gateway Connecting to Server... Please reload in 5 seconds.',
      {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      }
    );
  }
};
