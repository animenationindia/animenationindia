'use client';

import { useState, useEffect } from 'react';
import SectionSlider from './SectionSlider';
import { SliderSkeleton } from './SkeletonLoaders';
import { getUpcomingAnimeAniList, getNotForKidsAnimeAniList } from '../lib/api';

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

export default function HomeUpcomingSlidersClient() {
  const [data, setData] = useState<{
    upcoming: any[];
    notForKids: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [upcomingResult, notForKidsResult] = await Promise.all([
          getUpcomingAnimeAniList().catch(() => []),
          getNotForKidsAnimeAniList().catch(() => []),
        ]);

        if (!isMounted) return;

        setData({
          upcoming: dedupe(upcomingResult),
          notForKids: dedupe(notForKidsResult),
        });
      } catch (err) {
        console.warn('[HomeUpcomingSlidersClient] Error loading upcoming anime:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-14">
        <SliderSkeleton title="Upcoming Seasonal Anime" />
        <SliderSkeleton title="Anime Not For Kids" />
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
    </>
  );
}
