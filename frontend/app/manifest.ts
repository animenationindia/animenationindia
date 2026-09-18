import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Anime Nation India — Watch & Stream Anime Free',
    short_name: 'Anime Nation',
    description: 'Premier Anime Streaming, Schedules, News & Community Hub for Indian Otakus',
    start_url: '/home',
    display: 'standalone',
    background_color: '#030305',
    theme_color: '#ff2a5f',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['entertainment', 'multimedia', 'news', 'lifestyle'],
    lang: 'en',
    dir: 'ltr',
  };
}
