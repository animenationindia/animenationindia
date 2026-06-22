import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    // 🌟 এখানে 90 কোয়ালিটি অ্যাড করা হলো ওয়ার্নিং ফিক্স করার জন্য
    qualities: [25, 50, 75, 90, 100], 
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
      },
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  turbopack: {},
};

export default withPWA(nextConfig);