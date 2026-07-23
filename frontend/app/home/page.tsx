import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Hero from '../../components/Hero';
import InstallAppButton from '../../components/InstallAppButton';
import SectionSlider from '../../components/SectionSlider'; 
import AnimeCard from '../../components/AnimeCard';
import NewEpisodesList from '../../components/NewEpisodesList';
import HomeTrendingBanner from '../../components/HomeTrendingBanner';
import HomeTopLists from '../../components/HomeTopLists';
import TrailerSlider from '../../components/TrailerSlider';
import HomeNewsSection from '../../components/HomeNewsSection';
import HomeRecommendations from '../../components/HomeRecommendations';
import HomeReviews from '../../components/HomeReviews';
import HomeAnnouncementBanner from '../../components/HomeAnnouncementBanner';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SliderSkeleton } from '../../components/SkeletonLoaders';
import { sanitizeDescription } from '../../lib/sanitize';
import { 
  getTodayReleasesAniList, 
  getTopAnimeAniList,     
  getUpcomingAnimeAniList,   
  getPopularDubbedAniList,   
  getTopAiringAnimeAniList,
  getTrendingAnimeAniList,
  getTopCharactersJikan,
  getTopPeopleJikan,
  getTopMoviesAniList,
  getTopTVSeriesAniList,
  getYearAwardsAniList,
  getNotForKidsAnimeAniList,
  getKickstartJourneyAnimeAniList,
  getShounenZoneAnimeAniList,
  getSportsZoneAnimeAniList,
  getSimilarToSAOAnimeAniList,
  getFantasyZoneAnimeAniList,
  getSupernaturalWorldAnimeAniList,
  getSeasonalRomanceAnimeAniList,
  getSciFiAnimeAniList,
  getEvergreenAnimeAniList,
  getSimilarToMHAAnimeAniList,
  getHiddenGemsAnimeAniList,
  fetchInBatches,
  type AiringSchedule
} from '../../lib/api';
import { getNews, getNewsByCategory } from '../../lib/getNews';
import type { Metadata } from 'next';

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

// ─── Below-the-fold Async Streamed Sections ─────────────────────────────────

async function ThemeZonesSection({
  currentYear,
  currentSeason,
  latestAnnouncement,
}: {
  currentYear: number;
  currentSeason: string;
  latestAnnouncement: any;
}) {
  /* 
    [DEV TEST INSTRUCTION]: To simulate an ErrorBoundary failure in dev mode, 
    uncomment the line below:
    // throw new Error("Simulated ThemeZonesSection Stream Error!");
  */

  const tasks = [
    () => getKickstartJourneyAnimeAniList(),
    () => getShounenZoneAnimeAniList(),
    () => getPopularDubbedAniList(),
    () => getSportsZoneAnimeAniList(),
    () => getSimilarToSAOAnimeAniList(),
    () => getFantasyZoneAnimeAniList(),
    () => getSupernaturalWorldAnimeAniList(),
    () => getSeasonalRomanceAnimeAniList(currentYear, currentSeason),
    () => getSciFiAnimeAniList(),
    () => getEvergreenAnimeAniList(),
    () => getSimilarToMHAAnimeAniList(),
    () => getHiddenGemsAnimeAniList(),
  ];

  const results = await fetchInBatches(tasks, 3, 100);

  const safeKickstartAnime = dedupe(results[0] || []);
  const safeShounenAnime = dedupe(results[1] || []).slice(0, 20);
  const safePopularDubbed = dedupe(results[2] || []).slice(0, 20);
  const safeSportsAnime = dedupe(results[3] || []).slice(0, 20);
  const safeSaoSimilarAnime = dedupe(results[4] || []).slice(0, 20);
  const safeFantasyAnime = dedupe(results[5] || []).slice(0, 20);
  const safeSupernaturalAnime = dedupe(results[6] || []).slice(0, 20);
  const romanceList = (results[7] as any[]) || [];
  const safeSciFiAnime = dedupe(results[8] || []).slice(0, 20);
  const safeEvergreenAnime = dedupe(results[9] || []).slice(0, 25);
  const safeMhaSimilarAnime = dedupe(results[10] || []).slice(0, 20);
  const safeHiddenGemsAnime = dedupe(results[11] || []).slice(0, 20);

  const romanceSeasonalAnime = romanceList?.find((anime: any) => anime.bannerImage) || romanceList?.[0] || null;

  return (
    <div className="flex flex-col gap-14">
      <SectionSlider title="Kickstart Your Anime Journey" data={safeKickstartAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="Shounen Zone" data={safeShounenAnime as any} type="anime" viewAllLink="" />

      {/* Announcement Banner placed under Shounen Zone */}
      {latestAnnouncement && <HomeAnnouncementBanner announcement={latestAnnouncement} />}

      {/* Popular Dubbed Anime with View All Link */}
      <SectionSlider title="Popular Dubbed Anime" data={safePopularDubbed as any} type="anime" viewAllLink="/popular" />

      <SectionSlider title="Sports & Competition" data={safeSportsAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="If You Liked Sword Art Online" data={safeSaoSimilarAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="Fantasy Worlds" data={safeFantasyAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="Supernatural & Mystery" data={safeSupernaturalAnime as any} type="anime" viewAllLink="" />

      {romanceSeasonalAnime && (
        <div className="relative w-full h-[250px] md:h-[350px] rounded-3xl overflow-hidden my-4 border border-white/10 group shadow-2xl">
          <Image
            src={romanceSeasonalAnime.bannerImage || romanceSeasonalAnime.coverImage?.extraLarge || romanceSeasonalAnime.coverImage?.large}
            alt={romanceSeasonalAnime.title.english || romanceSeasonalAnime.title.romaji}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050716] via-[#050716]/80 to-transparent flex flex-col justify-center px-6 md:px-12">
            <span className="text-[#ff4dd2] text-xs font-bold uppercase tracking-widest mb-2">Featured Seasonal Romance</span>
            <h3 className="text-2xl md:text-4xl font-extrabold text-white max-w-xl line-clamp-2">
              {romanceSeasonalAnime.title.english || romanceSeasonalAnime.title.romaji}
            </h3>
            <p className="text-gray-400 text-xs md:text-sm max-w-md line-clamp-2 mt-2">
              {sanitizeDescription(romanceSeasonalAnime.description)}
            </p>
            <div className="mt-4">
              <Link
                href={`/series/${romanceSeasonalAnime.idMal || romanceSeasonalAnime.id}`}
                className="inline-block px-6 py-2.5 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Explore Details
              </Link>
            </div>
          </div>
        </div>
      )}

      <SectionSlider title="Sci-Fi & Cyberpunk" data={safeSciFiAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="Evergreen Classics" data={safeEvergreenAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="If You Liked My Hero Academia" data={safeMhaSimilarAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="Hidden Gems You Might Have Missed" data={safeHiddenGemsAnime as any} type="anime" viewAllLink="" />
    </div>
  );
}

async function TopCharactersSection() {
  const results = await fetchInBatches(
    [() => getTopCharactersJikan(), () => getTopPeopleJikan()],
    2,
    200
  );

  const safeTopCharacters = dedupe(results[0] || []);
  const safeTopPeople = dedupe(results[1] || []);

  if (safeTopCharacters.length === 0 && safeTopPeople.length === 0) return null;

  return (
    <div className="flex flex-col gap-14">
      {safeTopCharacters.length > 0 && (
        <SectionSlider title="Most Popular Anime Characters" data={safeTopCharacters as any} type="person" viewAllLink="/staff" />
      )}
      {safeTopPeople.length > 0 && (
        <SectionSlider title="Top Anime Voice Actors & Creators" data={safeTopPeople as any} type="person" viewAllLink="/staff" />
      )}
    </div>
  );
}

async function NewsAndReviewsSection({ news }: { news: any[] }) {
  return (
    <div className="flex flex-col gap-14">
      <HomeNewsSection news={news} />
      <HomeRecommendations />
      <HomeReviews />
    </div>
  );
}

// ─── Main Home Server Component ──────────────────────────────────────────────
export default async function Home() {
  const startTime = Date.now();

  const allNews = await getNews();
  const announcements = getNewsByCategory(allNews, 'Announcements');
  const latestAnnouncement = announcements[0] || allNews[0] || null;

  const currentYear = new Date().getFullYear();
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'SPRING';
    if (month >= 5 && month <= 7) return 'SUMMER';
    if (month >= 8 && month <= 10) return 'FALL';
    return 'WINTER';
  };
  const currentSeason = getCurrentSeason();

  // Trailer query
  const trailerQuery = `
    query {
      Page(page: 1, perPage: 25) {
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
          id
          title { romaji english }
          trailer { id site thumbnail }
        }
      }
    }
  `;

  // Above-the-fold Tasks (Batch 1 & 2 for instant TTFB)
  const aboveTheFoldTasks = [
    () => getTodayReleasesAniList(1),
    () => getTopAiringAnimeAniList(),
    () => getTrendingAnimeAniList(12),
    () => getUpcomingAnimeAniList(),
    () => getNotForKidsAnimeAniList(),
    () => getTopAnimeAniList(),
    () => getTopMoviesAniList(),
    () => getTopTVSeriesAniList(),
    () => getYearAwardsAniList(currentYear),
    () =>
      fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trailerQuery }),
        next: { revalidate: 3600 },
      })
        .then((res) => res.json())
        .catch(() => null),
  ];

  const results = await fetchInBatches(aboveTheFoldTasks, 4, 100);

  const todayData = results[0];
  const heroAnimeList = results[1] || [];
  const trendingIndia = results[2] || [];
  const upcomingAnime = results[3] || [];
  const notForKidsAnime = results[4] || [];
  const topAnime = results[5] || [];
  const topMovies = results[6] || [];
  const topTVSeries = results[7] || [];
  const yearAwards = results[8] || [];
  const trailersRes = results[9];

  const duration = Date.now() - startTime;
  const succeededCount = results.filter(Boolean).length;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Home Server Fetch] Initial Above-the-fold loaded in ${duration}ms | Succeeded: ${succeededCount}/${results.length} calls | Rate limit safe!`);
  }

  // Deduplicate initial lists
  const trailersData = dedupe(
    trailersRes?.data?.Page?.media?.filter((a: any) => a.trailer && a.trailer.site === 'youtube') || []
  ).slice(0, 15);

  const todayReleases = dedupe(
    (todayData?.airingSchedules || []).map((schedule: AiringSchedule) => ({
      ...schedule.media,
      airingEpisode: schedule.episode,
      airingAt: schedule.airingAt,
    }))
  );

  const safeHeroAnimeList = dedupe(heroAnimeList);
  const safeTopAnime = dedupe(topAnime);
  const safeUpcomingAnime = dedupe(upcomingAnime);
  const safeTrendingIndia = dedupe(trendingIndia);
  const safeTopMovies = dedupe(topMovies);
  const safeTopTVSeries = dedupe(topTVSeries);
  const safeYearAwards = dedupe(yearAwards);
  const safeNotForKidsAnime = dedupe(notForKidsAnime);

  return (
    <div className="pb-12 bg-[#050716] min-h-screen">
      <InstallAppButton />
      <Hero animeList={safeHeroAnimeList} />

      <main className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] mt-12">
        <div className="flex flex-col gap-14">
          {/* Official Anime Trailers */}
          <TrailerSlider trailers={trailersData} />

          {/* 1. Trending Anime in India */}
          <SectionSlider title="Trending Anime in India" data={safeTrendingIndia as any} type="anime" viewAllLink="/trending" />

          {/* 2. Just Updated (Slider) */}
          <SectionSlider title="Just Updated" data={todayReleases as any} type="anime" viewAllLink="/newest" />

          {/* 3. New Episodes (Crunchyroll Style List) */}
          <NewEpisodesList episodes={todayReleases as any} />

          {/* 4. Upcoming Seasonal Anime */}
          <SectionSlider title="Upcoming Seasonal Anime" data={safeUpcomingAnime as any} type="anime" viewAllLink="/upcoming" />

          {/* Anime Not For Kids */}
          <SectionSlider title="Anime Not For Kids" data={safeNotForKidsAnime as any} type="anime" viewAllLink="" />

          {/* 5. Top Picks for You */}
          <SectionSlider title="Top Picks for You" data={safeHeroAnimeList as any} type="anime" viewAllLink="/trending" />

          {/* Dynamic Trending/Seasonal Banner */}
          {safeHeroAnimeList.length > 0 && <HomeTrendingBanner anime={safeHeroAnimeList[0]} />}

          {/* 6. Trending Anime */}
          <SectionSlider title="Trending Anime" data={safeTopAnime as any} type="anime" viewAllLink="/popular" />

          {/* Top Movies, TV Series, and Year Awards */}
          <HomeTopLists topMovies={safeTopMovies} topTV={safeTopTVSeries} awards={safeYearAwards} year={currentYear} />

          {/* ── Below-the-fold Async Streamed Components Wrapped in ErrorBoundary ── */}
          <ErrorBoundary sectionName="Theme Zones">
            <Suspense fallback={<SliderSkeleton title="Theme Zones Loading..." />}>
              <ThemeZonesSection currentYear={currentYear} currentSeason={currentSeason} latestAnnouncement={latestAnnouncement} />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary sectionName="Top Characters & Creators">
            <Suspense fallback={<SliderSkeleton title="Top Characters Loading..." />}>
              <TopCharactersSection />
            </Suspense>
          </ErrorBoundary>

          <ErrorBoundary sectionName="News & Community Reviews">
            <Suspense fallback={<SliderSkeleton title="News & Community Reviews..." />}>
              <NewsAndReviewsSection news={allNews} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
