import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  turbopack: {},
  images: {
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
        hostname: 'kitsu.io',
      },
      {
        protocol: 'https',
        hostname: '*.kitsu.io',
      },
      {
        protocol: 'https',
        hostname: 'media.kitsu.io',
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
    return [
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
    ];
  },
};

export default withPWA(nextConfig);