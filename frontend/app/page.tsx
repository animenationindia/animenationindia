import dynamic from 'next/dynamic';
import { fetchAniList } from '../lib/api';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Anime Nation India - Watch Anime, Live Schedule, Reviews & Watchlist",
  description: "Anime Nation India is your ultimate free anime database and discovery platform. Track live schedules, read news, watch official trailers, and discover trending anime.",
  openGraph: {
    title: "Anime Nation India - Ultimate Free Anime Database & Discovery",
    description: "Track live release schedules, read news, watch trailers, and manage your watchlist on Anime Nation India.",
    images: [{ url: "/ani-logo.png", width: 800, height: 600, alt: "Anime Nation India Logo" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anime Nation India - Ultimate Free Anime Database & Discovery",
    description: "Track live release schedules, read news, watch trailers, and manage your watchlist on Anime Nation India.",
    images: ["/ani-logo.png"],
  },
};

// 🚀 Dynamic Import to split heavy motion bundles away from the initial critical HTML path
const LandingPageClient = dynamic(() => import('../components/LandingPageClient'), {
  loading: () => (
    <div className="relative w-full min-h-screen bg-[#0a0510] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-16 animate-pulse">
        <div className="w-48 h-8 rounded-full bg-white/10 mb-6" />
        <div className="w-full max-w-lg h-12 rounded-xl bg-white/10 mb-4" />
        <div className="w-3/4 max-w-md h-6 rounded-lg bg-white/5 mb-8" />
        <div className="flex gap-4">
          <div className="w-36 h-12 rounded-2xl bg-[#ff007f]/40" />
          <div className="w-32 h-12 rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  ),
});

const TRENDING_QUERY = `
  query {
    Page(page: 1, perPage: 8) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        averageScore
      }
    }
  }
`;

export default async function RootPage() {
  let trendingAnime = [];
  try {
    const data = await fetchAniList(TRENDING_QUERY);
    trendingAnime = data?.data?.Page?.media || data?.Page?.media || [];
  } catch (error) {
    console.error("Failed to fetch trending anime for landing page", error);
  }

  return <LandingPageClient initialAnime={trendingAnime} />;
}
