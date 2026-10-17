/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import SectionSlider from './SectionSlider';
import HomeAnnouncementBanner from './HomeAnnouncementBanner';
import SeasonalRomanceBanner from './SeasonalRomanceBanner';
import { SliderSkeleton } from './SkeletonLoaders';
import {
  getKickstartJourneyAnimeAniList,
  getShounenZoneAnimeAniList,
  getPopularDubbedAniList,
  getSportsZoneAnimeAniList,
  getSimilarToSAOAnimeAniList,
  getFantasyZoneAnimeAniList,
  getSupernaturalWorldAnimeAniList,
  getSeasonalRomanceAnimeAniList,
  getSciFiAnimeAniList,
  getEvergreenAnimeAniList,
  getSimilarToMHAAnimeAniList,
  getHiddenGemsAnimeAniList,
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

interface ThemeZonesClientProps {
  currentYear: number;
  currentSeason: string;
  latestAnnouncement: any;
}

export default function ThemeZonesClient({
  currentYear,
  currentSeason,
  latestAnnouncement,
}: ThemeZonesClientProps) {
  const [data, setData] = useState<{
    kickstart: any[];
    shounen: any[];
    popularDubbed: any[];
    sports: any[];
    saoSimilar: any[];
    fantasy: any[];
    supernatural: any[];
    romance: any[];
    sciFi: any[];
    evergreen: any[];
    mhaSimilar: any[];
    hiddenGems: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadThemeZones() {
      try {
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

        if (!isMounted) return;

        setData({
          kickstart: dedupe(results[0] || []),
          shounen: dedupe(results[1] || []).slice(0, 20),
          popularDubbed: dedupe(results[2] || []).slice(0, 20),
          sports: dedupe(results[3] || []).slice(0, 20),
          saoSimilar: dedupe(results[4] || []).slice(0, 20),
          fantasy: dedupe(results[5] || []).slice(0, 20),
          supernatural: dedupe(results[6] || []).slice(0, 20),
          romance: dedupe(results[7] || []),
          sciFi: dedupe(results[8] || []).slice(0, 20),
          evergreen: dedupe(results[9] || []).slice(0, 25),
          mhaSimilar: dedupe(results[10] || []).slice(0, 20),
          hiddenGems: dedupe(results[11] || []).slice(0, 20),
        });
      } catch (err) {
        console.warn('[ThemeZonesClient] Error loading theme zones:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadThemeZones();

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentSeason]);

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-14">
        <SliderSkeleton title="Kickstart Your Anime Journey" />
        <SliderSkeleton title="Shounen Zone" />
        <SliderSkeleton title="Popular Dubbed Anime" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      {data.kickstart.length > 0 && (
        <SectionSlider title="Kickstart Your Anime Journey" data={data.kickstart} type="anime" viewAllLink="" />
      )}
      {data.shounen.length > 0 && (
        <SectionSlider title="Shounen Zone" data={data.shounen} type="anime" viewAllLink="" />
      )}

      {/* Announcement Banner placed under Shounen Zone */}
      {latestAnnouncement && <HomeAnnouncementBanner announcement={latestAnnouncement} />}

      {/* Popular Dubbed Anime with View All Link */}
      {data.popularDubbed.length > 0 && (
        <SectionSlider title="Popular Dubbed Anime" data={data.popularDubbed} type="anime" viewAllLink="/popular" />
      )}

      {data.sports.length > 0 && (
        <SectionSlider title="Sports & Competition" data={data.sports} type="anime" viewAllLink="" />
      )}
      {data.saoSimilar.length > 0 && (
        <SectionSlider title="If You Liked Sword Art Online" data={data.saoSimilar} type="anime" viewAllLink="" />
      )}
      {data.fantasy.length > 0 && (
        <SectionSlider title="Fantasy Worlds" data={data.fantasy} type="anime" viewAllLink="" />
      )}
      {data.supernatural.length > 0 && (
        <SectionSlider title="Supernatural & Mystery" data={data.supernatural} type="anime" viewAllLink="" />
      )}

      {/* 💖 Auto-Updating Featured Romance Spotlight Banner */}
      {data.romance.length > 0 && <SeasonalRomanceBanner animeList={data.romance} />}

      {data.sciFi.length > 0 && (
        <SectionSlider title="Sci-Fi & Cyberpunk" data={data.sciFi} type="anime" viewAllLink="" />
      )}
      {data.evergreen.length > 0 && (
        <SectionSlider title="Evergreen Classics" data={data.evergreen} type="anime" viewAllLink="" />
      )}
      {data.mhaSimilar.length > 0 && (
        <SectionSlider title="If You Liked My Hero Academia" data={data.mhaSimilar} type="anime" viewAllLink="" />
      )}
      {data.hiddenGems.length > 0 && (
        <SectionSlider title="Hidden Gems You Might Have Missed" data={data.hiddenGems} type="anime" viewAllLink="" />
      )}
    </div>
  );
}
