/* eslint-disable @typescript-eslint/no-explicit-any */
export const revalidate = 1800; // 30 minute edge cache
import nextDynamic from 'next/dynamic';
import Hero from '../../components/Hero';
import SectionSlider from '../../components/SectionSlider';
import NewEpisodesList from '../../components/NewEpisodesList';
import HomeTrendingBanner from '../../components/HomeTrendingBanner';
import HomeTopLists from '../../components/HomeTopLists';
import TrailerSlider from '../../components/TrailerSlider';
import HomeNewsSection from '../../components/HomeNewsSection';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SliderSkeleton } from '../../components/SkeletonLoaders';
import {
  getTodayReleasesAniList,
  getTopAnimeAniList,
  getUpcomingAnimeAniList,
  getTopAiringAnimeAniList,
  getTrendingAnimeAniList,
  getTopMoviesAniList,
  getTopTVSeriesAniList,
  getYearAwardsAniList,
  getNotForKidsAnimeAniList,
  type AiringSchedule
} from '../../lib/api';
import { getNews, getNewsByCategory } from '../../lib/getNews';
import { getLiveAnimeTrailers } from '../../lib/trailers';
import type { Metadata } from 'next';

// Dynamic import for Below-the-fold sections to prevent Cloudflare Worker CPU & 50-subrequest limit exhaustion
const ThemeZonesClient = nextDynamic(() => import('../../components/ThemeZonesClient'), {
  loading: () => <SliderSkeleton title="Loading Theme Zones..." />,
});

const TopCharactersClient = nextDynamic(() => import('../../components/TopCharactersClient'), {
  loading: () => <SliderSkeleton title="Loading Top Characters..." />,
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

  // Safely fetch above-the-fold data with individual error handling
  const [
    allNewsResult,
    todayDataResult,
    heroAnimeListResult,
    trendingIndiaResult,
    upcomingAnimeResult,
    notForKidsAnimeResult,
    topAnimeResult,
    topMoviesResult,
    topTVSeriesResult,
    yearAwardsResult,
    liveTrailersResult
  ] = await Promise.all([
    getNews().catch(() => []),
    getTodayReleasesAniList(1).catch(() => null),
    getTopAiringAnimeAniList().catch(() => []),
    getTrendingAnimeAniList(12).catch(() => []),
    getUpcomingAnimeAniList().catch(() => []),
    getNotForKidsAnimeAniList().catch(() => []),
    getTopAnimeAniList().catch(() => []),
    getTopMoviesAniList().catch(() => []),
    getTopTVSeriesAniList().catch(() => []),
    getYearAwardsAniList(currentYear).catch(() => []),
    getLiveAnimeTrailers({ filter: 'all', limit: 16 }).catch(() => [])
  ]);

  const allNews = Array.isArray(allNewsResult) ? allNewsResult : [];
  const announcements = getNewsByCategory(allNews, 'Announcements');
  const latestAnnouncement = announcements[0] || allNews[0] || null;

  const todayData = todayDataResult;
  const heroAnimeList = Array.isArray(heroAnimeListResult) ? heroAnimeListResult : [];
  const trendingIndia = Array.isArray(trendingIndiaResult) ? trendingIndiaResult : [];
  const upcomingAnime = Array.isArray(upcomingAnimeResult) ? upcomingAnimeResult : [];
  const notForKidsAnime = Array.isArray(notForKidsAnimeResult) ? notForKidsAnimeResult : [];
  const topAnime = Array.isArray(topAnimeResult) ? topAnimeResult : [];
  const topMovies = Array.isArray(topMoviesResult) ? topMoviesResult : [];
  const topTVSeries = Array.isArray(topTVSeriesResult) ? topTVSeriesResult : [];
  const yearAwards = Array.isArray(yearAwardsResult) ? yearAwardsResult : [];
  const liveTrailers = Array.isArray(liveTrailersResult) ? liveTrailersResult : [];

  const safeHeroAnimeList = dedupe(heroAnimeList);
  const safeTopAnime = dedupe(topAnime);
  const safeUpcomingAnime = dedupe(upcomingAnime);
  const safeTrendingIndia = dedupe(trendingIndia);
  const safeTopMovies = dedupe(topMovies);
  const safeTopTVSeries = dedupe(topTVSeries);
  const safeYearAwards = dedupe(yearAwards);
  const safeNotForKidsAnime = dedupe(notForKidsAnime);

  // Live Auto-Updating Trailers with fallback
  let trailersData = dedupe(liveTrailers);
  if (trailersData.length === 0 && safeHeroAnimeList.length > 0) {
    const listWithTrailers = safeHeroAnimeList
      .filter((a: any) => a.trailer && a.trailer.id)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        trailer: { id: a.trailer.id, site: 'youtube', thumbnail: a.coverImage?.large || a.coverImage?.extraLarge }
      }));
    if (listWithTrailers.length > 0) {
      trailersData = listWithTrailers;
    }
  }

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
          {/* Official Anime Trailers */}
          {trailersData.length > 0 && <TrailerSlider trailers={trailersData} />}

          {/* 1. Trending Anime in India */}
          {safeTrendingIndia.length > 0 && (
            <SectionSlider title="Trending Anime in India" data={safeTrendingIndia as any} type="anime" viewAllLink="/trending" />
          )}

          {/* 2. Just Updated (Slider) */}
          {todayReleases.length > 0 && (
            <SectionSlider title="Just Updated" data={todayReleases as any} type="anime" viewAllLink="/newest" />
          )}

          {/* 3. New Episodes (Crunchyroll Style List) */}
          {todayReleases.length > 0 && <NewEpisodesList episodes={todayReleases as any} />}

          {/* 4. Upcoming Seasonal Anime */}
          {safeUpcomingAnime.length > 0 && (
            <SectionSlider title="Upcoming Seasonal Anime" data={safeUpcomingAnime as any} type="anime" viewAllLink="/upcoming" />
          )}

          {/* Anime Not For Kids */}
          {safeNotForKidsAnime.length > 0 && (
            <SectionSlider title="Anime Not For Kids" data={safeNotForKidsAnime as any} type="anime" viewAllLink="" />
          )}

          {/* 5. Top Picks for You */}
          {safeHeroAnimeList.length > 0 && (
            <SectionSlider title="Top Picks for You" data={safeHeroAnimeList as any} type="anime" viewAllLink="/trending" />
          )}

          {/* Dynamic Trending/Seasonal Banner */}
          {safeHeroAnimeList.length > 0 && <HomeTrendingBanner anime={safeHeroAnimeList[0]} />}

          {/* 6. All-Time Popular Anime */}
          {safeTopAnime.length > 0 && (
            <SectionSlider title="All-Time Popular Anime" data={safeTopAnime as any} type="anime" viewAllLink="/popular" />
          )}

          {/* Top Movies, TV Series, and Year Awards */}
          <HomeTopLists topMovies={safeTopMovies} topTV={safeTopTVSeries} awards={safeYearAwards} year={currentYear} />

          {/* ── Below-the-fold Async Streamed Sections with Client Fetching to Protect Edge Runtime Limits ── */}
          <ErrorBoundary sectionName="Theme Zones">
            <ThemeZonesClient
              currentYear={currentYear}
              currentSeason={currentSeason}
              latestAnnouncement={latestAnnouncement}
            />
          </ErrorBoundary>

          <ErrorBoundary sectionName="Top Characters & Creators">
            <TopCharactersClient />
          </ErrorBoundary>

          {allNews.length > 0 && (
            <ErrorBoundary sectionName="News & Articles">
              <div className="flex flex-col gap-14">
                <HomeNewsSection news={allNews} />
              </div>
            </ErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
}
