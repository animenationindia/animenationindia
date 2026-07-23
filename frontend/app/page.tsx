import { fetchAniList } from '../lib/api';
import LandingPageClient from '../components/LandingPageClient';
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
