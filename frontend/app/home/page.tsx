/* eslint-disable @next/next/no-img-element */
export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import Hero from '../../components/Hero';
import SectionSlider from '../../components/SectionSlider'; 
import AnimeCard from '../../components/AnimeCard';
import NewEpisodesList from '../../components/NewEpisodesList';
import HomeTrendingBanner from '../../components/HomeTrendingBanner';
import HomeTopLists from '../../components/HomeTopLists';
import TrailerSlider from '../../components/TrailerSlider';
import HomeNewsSection from '../../components/HomeNewsSection';
import HomeAnnouncementBanner from '../../components/HomeAnnouncementBanner';
import SeasonalRomanceBanner from '../../components/SeasonalRomanceBanner';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SliderSkeleton } from '../../components/SkeletonLoaders';
import { sanitizeDescription } from '../../lib/sanitize';
import { toEnglishTitle } from '../../lib/titleCleaner';
import { 
  getTodayReleasesAniList, 
  getTopAnimeAniList,     
  getUpcomingAnimeAniList,   
  getPopularDubbedAniList,   
  getTopAiringAnimeAniList,
  getTrendingAnimeAniList,
  getTopCharactersAniList,
  getTopStaffAniList,
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
  fetchAniList,
  fetchInBatches,
  type AiringSchedule
} from '../../lib/api';
import { getNews, getNewsByCategory } from '../../lib/getNews';
import { getTMDBAnimeTrailers } from '../../lib/tmdb-api';
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

  const results = await Promise.all(tasks.map((fn) => fn().catch(() => [])));

  const safeKickstartAnime = dedupe(results[0] || []);
  const safeShounenAnime = dedupe(results[1] || []).slice(0, 20);
  const safePopularDubbed = dedupe(results[2] || []).slice(0, 20);
  const safeSportsAnime = dedupe(results[3] || []).slice(0, 20);
  const safeSaoSimilarAnime = dedupe(results[4] || []).slice(0, 20);
  const safeFantasyAnime = dedupe(results[5] || []).slice(0, 20);
  const safeSupernaturalAnime = dedupe(results[6] || []).slice(0, 20);
  const safeRomanceAnime = dedupe(results[7] || []);
  const safeSciFiAnime = dedupe(results[8] || []).slice(0, 20);
  const safeEvergreenAnime = dedupe(results[9] || []).slice(0, 25);
  const safeMhaSimilarAnime = dedupe(results[10] || []).slice(0, 20);
  const safeHiddenGemsAnime = dedupe(results[11] || []).slice(0, 20);

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

      {/* 💖 Auto-Updating Featured Romance Spotlight Banner */}
      {safeRomanceAnime.length > 0 && <SeasonalRomanceBanner animeList={safeRomanceAnime} />}

      <SectionSlider title="Sci-Fi & Cyberpunk" data={safeSciFiAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="Evergreen Classics" data={safeEvergreenAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="If You Liked My Hero Academia" data={safeMhaSimilarAnime as any} type="anime" viewAllLink="" />
      <SectionSlider title="Hidden Gems You Might Have Missed" data={safeHiddenGemsAnime as any} type="anime" viewAllLink="" />
    </div>
  );
}

async function TopCharactersSection() {
  const results = await fetchInBatches(
    [() => getTopCharactersAniList(1), () => getTopStaffAniList(1)],
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

async function NewsSection({ news }: { news: any[] }) {
  return (
    <div className="flex flex-col gap-14">
      <HomeNewsSection news={news} />
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
    () => fetchAniList(trailerQuery, {}, 3600),
  ];

  const results = await Promise.all(aboveTheFoldTasks.map((fn) => fn().catch(() => null)));

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

  const safeHeroAnimeList = dedupe(heroAnimeList);
  const safeTopAnime = dedupe(topAnime);
  const safeUpcomingAnime = dedupe(upcomingAnime);
  const safeTrendingIndia = dedupe(trendingIndia);
  const safeTopMovies = dedupe(topMovies);
  const safeTopTVSeries = dedupe(topTVSeries);
  const safeYearAwards = dedupe(yearAwards);
  const safeNotForKidsAnime = dedupe(notForKidsAnime);

  // Deduplicate initial lists
  let trailersData = dedupe(
    trailersRes?.data?.Page?.media?.filter((a: any) => a.trailer && a.trailer.site === 'youtube') || []
  ).slice(0, 15);

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

  // Backup fallback: TMDB Anime Trailers API
  if (trailersData.length === 0) {
    try {
      const tmdbTrailers = await getTMDBAnimeTrailers(8);
      if (tmdbTrailers && tmdbTrailers.length > 0) {
        trailersData = tmdbTrailers;
      }
    } catch {}
  }

  if (trailersData.length === 0) {
    trailersData = [
      { id: 38000, title: { english: 'Demon Slayer: Infinity Castle', romaji: 'Kimetsu no Yaiba' }, trailer: { id: 'VQGCKyvzIM4', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/VQGCKyvzIM4/hqdefault.jpg' } },
      { id: 16498, title: { english: 'Attack on Titan Final Season', romaji: 'Shingeki no Kyojin' }, trailer: { id: 'M_OauHnAFc8', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/M_OauHnAFc8/hqdefault.jpg' } },
      { id: 40748, title: { english: 'Jujutsu Kaisen Season 2 (Shibuya Incident)', romaji: 'Jujutsu Kaisen' }, trailer: { id: 'O6qVieflwqs', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/O6qVieflwqs/hqdefault.jpg' } },
      { id: 41467, title: { english: 'Bleach: Thousand-Year Blood War Part 3', romaji: 'Bleach TYBW' }, trailer: { id: 'e8YBesRKq_U', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/e8YBesRKq_U/hqdefault.jpg' } },
      { id: 44511, title: { english: 'Chainsaw Man Movie: Reze Arc', romaji: 'Chainsaw Man' }, trailer: { id: 'v4yLeNt-kCU', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/v4yLeNt-kCU/hqdefault.jpg' } },
      { id: 50265, title: { english: 'Spy x Family Code: White', romaji: 'Spy x Family' }, trailer: { id: 'ofXigq9aIpo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/ofXigq9aIpo/hqdefault.jpg' } },
      { id: 5114, title: { english: 'Fullmetal Alchemist: Brotherhood', romaji: 'Hagane no Renkinjutsushi' }, trailer: { id: 'yb2R1l0O9Zs', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/yb2R1l0O9Zs/hqdefault.jpg' } },
      { id: 21087, title: { english: 'One Punch Man', romaji: 'One Punch Man' }, trailer: { id: 'tMblzsXwAKo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/tMblzsXwAKo/hqdefault.jpg' } },
      { id: 32281, title: { english: 'Your Name.', romaji: 'Kimi no Na wa.' }, trailer: { id: '3KR8_igDs1Y', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/3KR8_igDs1Y/hqdefault.jpg' } },
      { id: 1535, title: { english: 'Death Note', romaji: 'Death Note' }, trailer: { id: 'NlJZ-YgAt-c', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/NlJZ-YgAt-c/hqdefault.jpg' } }
    ];
  }

  let todayReleases = dedupe(
    (todayData?.airingSchedules || []).map((schedule: AiringSchedule) => ({
      ...schedule.media,
      airingEpisode: schedule.episode,
      airingAt: schedule.airingAt,
    }))
  );

  if (todayReleases.length === 0 && safeHeroAnimeList.length > 0) {
    todayReleases = safeHeroAnimeList.map((anime: any, idx: number) => ({
      ...anime,
      airingEpisode: anime.episodes || (idx + 1),
      airingAt: Math.floor(Date.now() / 1000) - idx * 3600,
    }));
  }

  return (
    <div className="pb-12 bg-[#050716] min-h-screen">
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

          {/* 6. All-Time Popular Anime */}
          <SectionSlider title="All-Time Popular Anime" data={safeTopAnime as any} type="anime" viewAllLink="/popular" />

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

          <ErrorBoundary sectionName="News & Articles">
            <Suspense fallback={<SliderSkeleton title="News & Articles..." />}>
              <NewsSection news={allNews} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
