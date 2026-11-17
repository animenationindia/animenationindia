'use client';

import { useState, useEffect } from 'react';
import SectionSlider from './SectionSlider';
import HomeTopLists from './HomeTopLists';
import { SliderSkeleton } from './SkeletonLoaders';
import {
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

interface HomePopularSlidersClientProps {
  currentYear: number;
}

export default function HomePopularSlidersClient({ currentYear }: HomePopularSlidersClientProps) {
  const [data, setData] = useState<{
    topAnime: any[];
    topMovies: any[];
    topTVSeries: any[];
    yearAwards: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [
          topAnimeResult,
          topMoviesResult,
          topTVResult,
          awardsResult,
        ] = await Promise.all([
          getTopAnimeAniList().catch(() => []),
          getTopMoviesAniList().catch(() => []),
          getTopTVSeriesAniList().catch(() => []),
          getYearAwardsAniList(currentYear).catch(() => []),
        ]);

        if (!isMounted) return;

        setData({
          topAnime: dedupe(topAnimeResult),
          topMovies: dedupe(topMoviesResult),
          topTVSeries: dedupe(topTVResult),
          yearAwards: dedupe(awardsResult),
        });
      } catch (err) {
        console.warn('[HomePopularSlidersClient] Error loading popular anime:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [currentYear]);

  if (loading) {
    return (
      <div className="flex flex-col gap-14">
        <SliderSkeleton title="All-Time Popular Anime" />
        <SliderSkeleton title="Top Movies & TV Series" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
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
