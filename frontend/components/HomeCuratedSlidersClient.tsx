'use client';

import { useState, useEffect } from 'react';
import SectionSlider from './SectionSlider';
import HomeTopLists from './HomeTopLists';
import { SliderSkeleton } from './SkeletonLoaders';
import {
  getUpcomingAnimeAniList,
  getNotForKidsAnimeAniList,
  getTopAnimeAniList,
  getTopMoviesAniList,
  getTopTVSeriesAniList,
  getYearAwardsAniList,
} from '../lib/api';

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

interface HomeCuratedSlidersClientProps {
  currentYear: number;
}

export default function HomeCuratedSlidersClient({ currentYear }: HomeCuratedSlidersClientProps) {
  const [data, setData] = useState<{
    upcoming: any[];
    notForKids: any[];
    topAnime: any[];
    topMovies: any[];
    topTVSeries: any[];
    yearAwards: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCurated() {
      try {
        const [
          upcomingResult,
          notForKidsResult,
          topAnimeResult,
          topMoviesResult,
          topTVResult,
          awardsResult,
        ] = await Promise.all([
          getUpcomingAnimeAniList().catch(() => []),
          getNotForKidsAnimeAniList().catch(() => []),
          getTopAnimeAniList().catch(() => []),
          getTopMoviesAniList().catch(() => []),
          getTopTVSeriesAniList().catch(() => []),
          getYearAwardsAniList(currentYear).catch(() => []),
        ]);

        if (!isMounted) return;

        setData({
          upcoming: dedupe(upcomingResult),
          notForKids: dedupe(notForKidsResult),
          topAnime: dedupe(topAnimeResult),
          topMovies: dedupe(topMoviesResult),
          topTVSeries: dedupe(topTVResult),
          yearAwards: dedupe(awardsResult),
        });
      } catch (err) {
        console.warn('[HomeCuratedSlidersClient] Error loading curated data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCurated();

    return () => {
      isMounted = false;
    };
  }, [currentYear]);

  if (loading) {
    return (
      <div className="flex flex-col gap-14">
        <SliderSkeleton title="Loading Upcoming Seasonal Anime..." />
        <SliderSkeleton title="Loading All-Time Popular Anime..." />
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* 4. Upcoming Seasonal Anime */}
      {data.upcoming.length > 0 && (
        <SectionSlider
          title="Upcoming Seasonal Anime"
          data={data.upcoming as any}
          type="anime"
          viewAllLink="/upcoming"
        />
      )}

      {/* Anime Not For Kids */}
      {data.notForKids.length > 0 && (
        <SectionSlider
          title="Anime Not For Kids"
          data={data.notForKids as any}
          type="anime"
          viewAllLink=""
        />
      )}

      {/* 6. All-Time Popular Anime */}
      {data.topAnime.length > 0 && (
        <SectionSlider
          title="All-Time Popular Anime"
          data={data.topAnime as any}
          type="anime"
          viewAllLink="/popular"
        />
      )}

      {/* Top Movies, TV Series, and Year Awards */}
      <HomeTopLists
        topMovies={data.topMovies}
        topTV={data.topTVSeries}
        awards={data.yearAwards}
        year={currentYear}
      />
    </>
  );
}
