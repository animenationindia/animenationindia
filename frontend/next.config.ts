import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dns = require("node:dns");
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Edge runtime or browser fallback
}

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: [],
  compress: true,
  reactStrictMode: true,
  turbopack: {},
  images: {
    unoptimized: true,
    qualities: [25, 50, 75, 90, 100], 
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'anilist.co',
      },
      {
        protocol: 'https',
        hostname: '*.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: '*.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: '*.tmdb.org',
      },

      {
        protocol: 'https',
        hostname: 'animecorner.me',
      },
      {
        protocol: 'https',
        hostname: '*.animecorner.me',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
          ],
        },
      ];
    }
    return [
      {
        source: '/api/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/(.*).(png|jpg|jpeg|gif|svg|ico|webp|woff2|json|txt|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path(settings|profile|my-list|watchlist|admin)/:subpath*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/:path(settings|profile|my-list|watchlist|admin)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/:path(home|popular|upcoming|trending|ongoing|new|newest|schedule|browse|characters|character|genres|genre|top-movies|top-tv|trailers|news|read|manga|dubbed|simulcast|types)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1800, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path(home|series|watch|popular|upcoming|trending|ongoing|new|newest|schedule|browse|characters|character|genres|genre|top-movies|top-tv|trailers|news|read|manga|dubbed|simulcast|types)/:subpath*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);