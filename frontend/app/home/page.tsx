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
        <section className="relative w-full overflow-hidden rounded-3xl border border-[#ff4dd2]/20 bg-gradient-to-r from-[#050716] via-[#050716]/85 to-transparent my-4 group shadow-[0_20px_50px_rgba(255,77,210,0.15)] hover:border-[#ff4dd2]/40 transition-all duration-500">
          {/* Ornate Pink Border Corners */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#ff4dd2]/40 pointer-events-none z-20 rounded-tl-md"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#ff4dd2]/40 pointer-events-none z-20 rounded-br-md"></div>

          {/* Background Backdrop Image */}
          <div className="absolute inset-0 w-full h-full z-0">
            <img
              src={romanceSeasonalAnime.bannerImage || romanceSeasonalAnime.coverImage?.extraLarge || romanceSeasonalAnime.coverImage?.large}
              alt={romanceSeasonalAnime.title.english || romanceSeasonalAnime.title.romaji}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050716] via-[#050716]/85 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-transparent z-10" />
          </div>

          {/* Content Layout */}
          <div className="relative z-20 px-8 py-10 md:py-14 md:px-14 flex flex-col md:flex-row items-center justify-between gap-8 w-full">
            {/* Left Column: Info & Buttons */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_15px_rgba(255,77,210,0.3)]">
                  💖 FEATURED SEASONAL ROMANCE
                </span>
                {romanceSeasonalAnime.averageScore && (
                  <span className="px-2.5 py-1 bg-white/10 text-yellow-300 text-xs font-bold rounded-full flex items-center gap-1 border border-white/10">
                    ★ {Math.round(romanceSeasonalAnime.averageScore / 10 * 10) / 10 || (romanceSeasonalAnime.averageScore / 10).toFixed(1)}
                  </span>
                )}
              </div>

              <h3 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-wide uppercase leading-tight mb-3 drop-shadow-lg group-hover:text-[#ff7be0] transition-colors">
                {romanceSeasonalAnime.title.english || romanceSeasonalAnime.title.romaji}
              </h3>

              <p className="text-gray-300 text-xs md:text-sm line-clamp-3 leading-relaxed mb-6 max-w-xl">
                {sanitizeDescription(romanceSeasonalAnime.description)}
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link
                  href={`/watch/${romanceSeasonalAnime.idMal || romanceSeasonalAnime.id}`}
                  className="inline-flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold py-2.5 px-7 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(255,77,210,0.4)] hover:shadow-[0_4px_30px_rgba(255,77,210,0.6)] cursor-pointer"
                >
                  Watch Now
                </Link>
                <Link
                  href={`/series/${romanceSeasonalAnime.idMal || romanceSeasonalAnime.id}`}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-extrabold py-2.5 px-7 rounded-full text-xs md:text-sm uppercase tracking-wider transition-all duration-300 backdrop-blur-md cursor-pointer"
                >
                  Explore Details
                </Link>
              </div>
            </div>

            {/* Right Column: Floating 3D Artwork Cover Card */}
            {(romanceSeasonalAnime.coverImage?.extraLarge || romanceSeasonalAnime.coverImage?.large) && (
              <div className="hidden lg:block relative w-[170px] h-[245px] flex-shrink-0 rounded-2xl overflow-hidden border border-[#ff4dd2]/30 shadow-[0_20px_40px_rgba(255,77,210,0.2)] transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
                <img
                  src={romanceSeasonalAnime.coverImage.extraLarge || romanceSeasonalAnime.coverImage.large}
                  alt={romanceSeasonalAnime.title.english || romanceSeasonalAnime.title.romaji}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            )}
          </div>
        </section>
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
      { id: 52299, title: { english: 'Solo Leveling Season 2 -Arise from the Shadow-', romaji: 'Ore dake Level Up na Ken' }, trailer: { id: 'gFl_P6d7q5M', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/gFl_P6d7q5M/hqdefault.jpg' } },
      { id: 40748, title: { english: 'Jujutsu Kaisen Season 2 (Shibuya Incident)', romaji: 'Jujutsu Kaisen' }, trailer: { id: 'O6qVieflwqs', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/O6qVieflwqs/hqdefault.jpg' } },
      { id: 41467, title: { english: 'Bleach: Thousand-Year Blood War Part 3', romaji: 'Bleach TYBW' }, trailer: { id: 'e8YBesRKq_U', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/e8YBesRKq_U/hqdefault.jpg' } },
      { id: 52991, title: { english: 'Frieren: Beyond Journey\'s End', romaji: 'Sousou no Frieren' }, trailer: { id: 'qgQunxD0qMo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/qgQunxD0qMo/hqdefault.jpg' } },
      { id: 52588, title: { english: 'Kaiju No. 8', romaji: 'Kaijuu 8-gou' }, trailer: { id: 'c3ISn_k_bZ8', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/c3ISn_k_bZ8/hqdefault.jpg' } },
      { id: 50265, title: { english: 'Spy x Family Code: White', romaji: 'Spy x Family' }, trailer: { id: 'ofXigq9aIpo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/ofXigq9aIpo/hqdefault.jpg' } },
      { id: 44511, title: { english: 'Chainsaw Man Movie: Reze Arc', romaji: 'Chainsaw Man' }, trailer: { id: 'v4yLeNt-kCU', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/v4yLeNt-kCU/hqdefault.jpg' } }
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
