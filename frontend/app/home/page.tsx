export const revalidate = 1800; // 30 minute edge cache
import nextDynamic from 'next/dynamic';
import Hero from '../../components/Hero';
import SectionSlider from '../../components/SectionSlider';
import NewEpisodesList from '../../components/NewEpisodesList';
import HomeTrendingBanner from '../../components/HomeTrendingBanner';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SliderSkeleton } from '../../components/SkeletonLoaders';
import {
  getTodayReleasesAniList,
  getTopAiringAnimeAniList,
  getTrendingAnimeAniList,
  type AiringSchedule
} from '../../lib/api';
import type { Metadata } from 'next';

// Dynamic client components for Below-the-fold sections to prevent Cloudflare Worker CPU & subrequest limit exhaustion
const HomeTrailersClient = nextDynamic(() => import('../../components/HomeTrailersClient'), {
  loading: () => <SliderSkeleton title="Loading Official Trailers..." />,
});

const HomeCuratedSlidersClient = nextDynamic(() => import('../../components/HomeCuratedSlidersClient'), {
  loading: () => <SliderSkeleton title="Loading Curated Anime..." />,
});

const ThemeZonesClient = nextDynamic(() => import('../../components/ThemeZonesClient'), {
  loading: () => <SliderSkeleton title="Loading Theme Zones..." />,
});

const TopCharactersClient = nextDynamic(() => import('../../components/TopCharactersClient'), {
  loading: () => <SliderSkeleton title="Loading Top Characters..." />,
});

const HomeNewsClient = nextDynamic(() => import('../../components/HomeNewsClient'), {
  loading: () => null,
});

export const metadata: Metadata = {
  title: 'Home - Anime Nation India',
  description: 'Stream anime, check live schedule, discover trending series, and read news on Anime Nation India.',
};

const dedupe = (arr: any[]) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.filter((item) => {
    const id = item?.id || item?.idMal || item?.media?.id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export default async function Home() {
  const currentYear = new Date().getFullYear();
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'SPRING';
    if (month >= 5 && month <= 7) return 'SUMMER';
    if (month >= 8 && month <= 10) return 'FALL';
    return 'WINTER';
  };
  const currentSeason = getCurrentSeason();

  // ONLY fetch above-the-fold critical data during SSR (3 fast queries max)
  const [
    todayDataResult,
    heroAnimeListResult,
    trendingIndiaResult
  ] = await Promise.all([
    getTodayReleasesAniList(1).catch(() => null),
    getTopAiringAnimeAniList().catch(() => []),
    getTrendingAnimeAniList(12).catch(() => [])
  ]);

  const todayData = todayDataResult;
  const heroAnimeList = Array.isArray(heroAnimeListResult) ? heroAnimeListResult : [];
  const trendingIndia = Array.isArray(trendingIndiaResult) ? trendingIndiaResult : [];

  const safeHeroAnimeList = dedupe(heroAnimeList);
  const safeTrendingIndia = dedupe(trendingIndia);

  // Today releases calculation with fallback
  let todayReleases = dedupe(
    (todayData?.airingSchedules || []).map((schedule: AiringSchedule) => {
      const m = schedule.media || ({} as any);
      const titleStr = typeof m.title === 'string'
        ? m.title
        : (m.title?.english || m.title?.romaji || 'New Episode');
      return {
        ...m,
        title: typeof m.title === 'object' && m.title !== null
          ? {
              english: typeof m.title.english === 'string' ? m.title.english : titleStr,
              romaji: typeof m.title.romaji === 'string' ? m.title.romaji : titleStr
            }
          : { english: titleStr, romaji: titleStr },
        airingEpisode: schedule.episode,
        airingAt: schedule.airingAt,
      };
    })
  );

  if (todayReleases.length === 0 && safeHeroAnimeList.length > 0) {
    const baseNow = Math.floor(Date.now() / 1000);
    todayReleases = safeHeroAnimeList.map((anime: any, idx: number) => {
      const titleStr = typeof anime.title === 'string'
        ? anime.title
        : (anime.title?.english || anime.title?.romaji || 'New Episode');
      return {
        ...anime,
        title: typeof anime.title === 'object' && anime.title !== null
          ? {
              english: typeof anime.title.english === 'string' ? anime.title.english : titleStr,
              romaji: typeof anime.title.romaji === 'string' ? anime.title.romaji : titleStr
            }
          : { english: titleStr, romaji: titleStr },
        airingEpisode: anime.episodes || (idx + 1),
        airingAt: baseNow - idx * 3600,
      };
    });
  }

  return (
    <div className="pb-12 bg-[#050716] min-h-screen">
      <Hero animeList={safeHeroAnimeList} />

      <main className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] mt-12">
        <div className="flex flex-col gap-14">
          {/* Official Anime Trailers (Client Streamed) */}
          <HomeTrailersClient heroAnimeList={safeHeroAnimeList} />

          {/* 1. Trending Anime in India (Above-the-fold SSR) */}
          {safeTrendingIndia.length > 0 && (
            <SectionSlider title="Trending Anime in India" data={safeTrendingIndia as any} type="anime" viewAllLink="/trending" />
          )}

          {/* 2. Just Updated (Slider) */}
          {todayReleases.length > 0 && (
            <SectionSlider title="Just Updated" data={todayReleases as any} type="anime" viewAllLink="/newest" />
          )}

          {/* 3. New Episodes (Crunchyroll Style List) */}
          {todayReleases.length > 0 && <NewEpisodesList episodes={todayReleases as any} />}

          {/* 4. Top Picks for You */}
          {safeHeroAnimeList.length > 0 && (
            <SectionSlider title="Top Picks for You" data={safeHeroAnimeList as any} type="anime" viewAllLink="/trending" />
          )}

          {/* Dynamic Trending/Seasonal Banner */}
          {safeHeroAnimeList.length > 0 && <HomeTrendingBanner anime={safeHeroAnimeList[0]} />}

          {/* Curated Sliders + Top Lists (Client Streamed) */}
          <ErrorBoundary sectionName="Curated Sliders">
            <HomeCuratedSlidersClient currentYear={currentYear} />
          </ErrorBoundary>

          {/* ── Below-the-fold Async Streamed Sections with Client Fetching to Protect Edge Runtime Limits ── */}
          <ErrorBoundary sectionName="Theme Zones">
            <ThemeZonesClient
              currentYear={currentYear}
              currentSeason={currentSeason}
              latestAnnouncement={null}
            />
          </ErrorBoundary>

          <ErrorBoundary sectionName="Top Characters & Creators">
            <TopCharactersClient />
          </ErrorBoundary>

          <ErrorBoundary sectionName="News & Articles">
            <HomeNewsClient />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
