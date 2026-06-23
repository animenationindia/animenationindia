import Link from 'next/link';
import Hero from '../../components/Hero';
import InstallAppButton from '../../components/InstallAppButton';
import SectionSlider from '../../components/SectionSlider'; 
import AnimeCard from '../../components/AnimeCard';
import NewEpisodesList from '../../components/NewEpisodesList';
import HomeTrendingBanner from '../../components/HomeTrendingBanner';
import HomeTopLists from '../../components/HomeTopLists';
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
  type AiringSchedule
} from '../../lib/api';
import TrailerSlider from '../../components/TrailerSlider';
import HomeRecommendations from '../../components/HomeRecommendations';
import HomeReviews from '../../components/HomeReviews';
import HomeAnnouncementBanner from '../../components/HomeAnnouncementBanner';
import { getNews, getNewsByCategory } from '../../lib/getNews';

export default async function Home() {
  const allNews = await getNews();
  const announcements = getNewsByCategory(allNews, 'Announcements');
  const latestAnnouncement = announcements[0] || allNews[0] || null;

  // Fetch trailers query
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

  // Fetch all required data in parallel
  const currentYear = new Date().getFullYear();
  const getCurrentSeason = () => {
    const month = new Date().getMonth(); // 0-indexed: 0 = Jan, 11 = Dec
    if (month >= 2 && month <= 4) return 'SPRING';
    if (month >= 5 && month <= 7) return 'SUMMER';
    if (month >= 8 && month <= 10) return 'FALL';
    return 'WINTER';
  };
  const currentSeason = getCurrentSeason();

  const [
    todayData, 
    heroAnimeList, 
    topAnime,
    upcomingAnime,
    popularDubbed,
    trendingIndia,
    topCharacters,
    topPeople,
    trailersRes,
    topMovies,
    topTVSeries,
    yearAwards,
    notForKidsAnime,
    kickstartAnime,
    shounenAnime,
    sportsAnime,
    saoSimilarAnime,
    fantasyAnime,
    supernaturalAnime,
    romanceSeasonalAnimeList,
    sciFiAnime,
    evergreenAnime,
    mhaSimilarAnime,
    hiddenGemsAnime
  ] = await Promise.all([
    getTodayReleasesAniList(1),
    getTopAiringAnimeAniList(),
    getTopAnimeAniList(),
    getUpcomingAnimeAniList(),
    getPopularDubbedAniList(),
    getTrendingAnimeAniList(12), // 12 items for the grid
    getTopCharactersJikan(),
    getTopPeopleJikan(),
    fetch('https://graphql.anilist.co', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ query: trailerQuery }), 
      next: { revalidate: 3600 } 
    }).then(res => res.json()).catch(() => null),
    getTopMoviesAniList(),
    getTopTVSeriesAniList(),
    getYearAwardsAniList(currentYear),
    getNotForKidsAnimeAniList(),
    getKickstartJourneyAnimeAniList(),
    getShounenZoneAnimeAniList(),
    getSportsZoneAnimeAniList(),
    getSimilarToSAOAnimeAniList(),
    getFantasyZoneAnimeAniList(),
    getSupernaturalWorldAnimeAniList(),
    getSeasonalRomanceAnimeAniList(currentYear, currentSeason),
    getSciFiAnimeAniList(),
    getEvergreenAnimeAniList(),
    getSimilarToMHAAnimeAniList(),
    getHiddenGemsAnimeAniList()
  ]);

  const dedupe = (arr: any[]) => {
    const seen = new Set();
    return arr.filter(item => {
      const id = item?.id || item?.idMal || item?.media?.id;
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const trailersData = dedupe(trailersRes?.data?.Page?.media?.filter((a: any) => a.trailer && a.trailer.site === 'youtube') || []).slice(0, 15);

  // Transform schedule data for sliders and the New Episodes list and dedupe
  const todayReleases = dedupe((todayData?.airingSchedules || []).map((schedule: AiringSchedule) => ({
    ...schedule.media,
    airingEpisode: schedule.episode,
    airingAt: schedule.airingAt
  })));

  // Dedupe other lists just in case the API returned duplicates
  const safeHeroAnimeList = dedupe(heroAnimeList || []);
  const safeTopAnime = dedupe(topAnime || []);
  const safeUpcomingAnime = dedupe(upcomingAnime || []);
  const safePopularDubbed = dedupe(popularDubbed || []);
  const safeTrendingIndia = dedupe(trendingIndia || []);
  const safeTopMovies = dedupe(topMovies || []);
  const safeTopTVSeries = dedupe(topTVSeries || []);
  const safeYearAwards = dedupe(yearAwards || []);
  const safeNotForKidsAnime = dedupe(notForKidsAnime || []);
  const safeKickstartAnime = dedupe(kickstartAnime || []);
  const safeShounenAnime = dedupe(shounenAnime || []).slice(0, 20);
  const safeSportsAnime = dedupe(sportsAnime || []).slice(0, 20);
  const safeSaoSimilarAnime = dedupe(saoSimilarAnime || []).slice(0, 20);
  const safeFantasyAnime = dedupe(fantasyAnime || []).slice(0, 20);
  const safeSupernaturalAnime = dedupe(supernaturalAnime || []).slice(0, 20);
  const safeSciFiAnime = dedupe(sciFiAnime || []).slice(0, 20);
  const safeEvergreenAnime = dedupe(evergreenAnime || []).slice(0, 25);
  const safeMhaSimilarAnime = dedupe(mhaSimilarAnime || []).slice(0, 20);
  const safeHiddenGemsAnime = dedupe(hiddenGemsAnime || []).slice(0, 20);

  // Find a Romance anime with a banner image from this season, or fall back
  const romanceSeasonalAnime = romanceSeasonalAnimeList?.find(anime => anime.bannerImage) || romanceSeasonalAnimeList?.[0] || null;


  return (
    <div className="pb-12 bg-[#050716] min-h-screen">
      <InstallAppButton />
      <Hero animeList={safeHeroAnimeList} />

      <main className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] mt-12">
        <div className="flex flex-col gap-14">
          
          {/* Official Anime Trailers */}
          <TrailerSlider trailers={trailersData} />

          {/* 1. Trending Anime in India */}
          <SectionSlider 
            title="Trending Anime in India" 
            data={safeTrendingIndia as any}
            type="anime" 
            viewAllLink="/trending" 
          />

          {/* 2. Just Updated (Slider) */}
          <SectionSlider 
            title="Just Updated" 
            data={todayReleases as any}
            type="anime" 
            viewAllLink="/newest" 
          />

          {/* 3. New Episodes (Crunchyroll Style List) */}
          <NewEpisodesList episodes={todayReleases as any} />

          {/* 4. Upcoming Seasonal Anime */}
          <SectionSlider 
            title="Upcoming Seasonal Anime" 
            data={safeUpcomingAnime as any} 
            type="anime" 
            viewAllLink="/upcoming" 
          />

          {/* Anime Not For Kids */}
          <SectionSlider 
            title="Anime Not For Kids" 
            data={safeNotForKidsAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* 5. Top Picks for You */}
          <SectionSlider 
            title="Top Picks for You" 
            data={safeHeroAnimeList as any}
            type="anime" 
            viewAllLink="/trending" 
          />

          {/* Dynamic Trending/Seasonal Banner */}
          <HomeTrendingBanner anime={safeHeroAnimeList[0]} />

          {/* 6. Trending Anime */}
          <SectionSlider 
            title="Trending Anime" 
            data={safeTopAnime as any} 
            type="anime" 
            viewAllLink="/popular" 
          />

          {/* Top Movies, TV Series, and Year Awards */}
          <HomeTopLists 
            topMovies={safeTopMovies}
            topTV={safeTopTVSeries}
            awards={safeYearAwards}
            year={currentYear}
          />

          {/* Kickstart Your Anime Journey */}
          <SectionSlider 
            title="Kickstart Your Anime Journey" 
            data={safeKickstartAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* The Shounen Zone */}
          <SectionSlider 
            title="The Shounen Zone" 
            data={safeShounenAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* Announcement Banner */}
          <HomeAnnouncementBanner announcement={latestAnnouncement} />

          {/* 7. Popular Dubbed */}
          <SectionSlider 
            title="Popular Dubbed" 
            data={safePopularDubbed as any} 
            type="anime" 
            viewAllLink="/dubbed" 
          />

          {/* The Sports Zone */}
          <SectionSlider 
            title="The Sports Zone" 
            data={safeSportsAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* Inspired by Sword Art Online */}
          <SectionSlider 
            title="Inspired by Sword Art Online" 
            data={safeSaoSimilarAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* The Fantasy Zone */}
          <SectionSlider 
            title="The Fantasy Zone" 
            data={safeFantasyAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* Supernatural World */}
          <SectionSlider 
            title="Supernatural World" 
            data={safeSupernaturalAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* Seasonal Romance Banner */}
          {romanceSeasonalAnime && (
            <HomeTrendingBanner 
              anime={romanceSeasonalAnime} 
              subtitle="★ Romance Pick of the Season" 
            />
          )}

          {/* When Science Meets Fiction! */}
          <SectionSlider 
            title="When Science Meets Fiction!" 
            data={safeSciFiAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* Evergreen Anime on Anime Nation India */}
          <SectionSlider 
            title="Evergreen Anime on Anime Nation India" 
            data={safeEvergreenAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* Must Watch For My Hero Academia Fans */}
          <SectionSlider 
            title="Must Watch For My Hero Academia Fans" 
            data={safeMhaSimilarAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* Hidden Gems */}
          <SectionSlider 
            title="Hidden Gems" 
            data={safeHiddenGemsAnime as any} 
            type="anime" 
            viewAllLink="" 
          />

          {/* User Recommendations */}
          <HomeRecommendations />

          {/* 8. Top Characters */}
          <SectionSlider 
            title="Top Characters" 
            data={topCharacters as any} 
            type="person" 
            viewAllLink="/characters" 
          />

          {/* 9. Behind the Scenes */}
          <SectionSlider 
            title="Behind the Scenes" 
            data={topPeople as any} 
            type="person" 
            viewAllLink="/staff" 
          />

          {/* 10. Community Reviews */}
          <HomeReviews />

        </div>
      </main>
    </div>
  );
}
