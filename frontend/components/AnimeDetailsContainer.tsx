'use client';

import { useMemo, useState } from 'react';
import AnimeHeroV2 from './AnimeHeroV2';
import AnimeHUDStats from './AnimeHUDStats';
import SoundtrackSection from './SoundtrackSection';
import AnimeEpisodeGuide from './AnimeEpisodeGuide';
import AnimeCharactersCast from './AnimeCharactersCast';
import AnimeFranchiseUniverse from './AnimeFranchiseUniverse';
import CommunityDiscussion from './CommunityDiscussion';
import AnimeRecommendations from './AnimeRecommendations';
import AnimeThemeSongs from './AnimeThemeSongs';
import { NormalizedTheme } from '../lib/animethemes-api';
import { TMDBAnimeData } from '../lib/tmdb-api';
import { LayoutGrid, Tv, Music2 } from 'lucide-react';

type TabKey = 'overview' | 'episodes' | 'music';

interface AnimeDetailsContainerProps {
  anime: any;
  extraInfo?: any;
  characters?: any[];
  episodes?: any[];
  recommendations?: any[];
  relations?: any[];
  themes?: NormalizedTheme[];
  tmdbData?: TMDBAnimeData | null;
  reviews?: any[];
}

export default function AnimeDetailsContainer({
  anime,
  extraInfo,
  characters = [],
  episodes = [],
  recommendations = [],
  relations = [],
  themes = [],
  tmdbData = null,
  reviews = [],
}: AnimeDetailsContainerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const animeId = anime.mal_id || anime.id || extraInfo?.idMal || extraInfo?.id;
  const englishTitle =
    anime.title_english || extraInfo?.title?.english || anime.title || 'Anime';
  const posterImage =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    '/placeholder-poster.png';

  const episodeCount: number | null =
    episodes.length > 0
      ? episodes.length
      : typeof anime.episodes === 'number'
      ? anime.episodes
      : typeof extraInfo?.episodes === 'number'
      ? extraInfo.episodes
      : null;

  const hasMusicContent = themes.length > 0;

  const formattedRecommendations = useMemo(() => {
    return recommendations.map((r: any) => {
      const titleEng =
        r.entry?.title ||
        (typeof r.title === 'object'
          ? r.title?.english || r.title?.romaji
          : r.title) ||
        'Anime';
      const cover =
        r.entry?.images?.webp?.large_image_url ||
        r.entry?.images?.jpg?.large_image_url ||
        r.coverImage?.extraLarge ||
        r.coverImage?.large ||
        '/placeholder-poster.png';

      return {
        id: r.entry?.mal_id || r.idMal || r.id || 0,
        idMal: r.entry?.mal_id || r.idMal || r.id || 0,
        title: {
          english: titleEng,
          romaji:
            r.entry?.title ||
            (typeof r.title === 'object' ? r.title?.romaji : r.title) ||
            titleEng,
        },
        coverImage: { large: cover, extraLarge: cover },
        format: r.format || r.entry?.type || 'TV',
        averageScore: typeof r.averageScore === 'number' ? r.averageScore : null,
      };
    });
  }, [recommendations]);

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode; badge?: number | null }> = [
    { key: 'overview', label: 'Overview', icon: <LayoutGrid size={14} /> },
    { key: 'episodes', label: 'Episodes', icon: <Tv size={14} />, badge: episodeCount },
    ...(hasMusicContent
      ? [{ key: 'music' as TabKey, label: 'Music', icon: <Music2 size={14} /> }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white pb-24">

      {/* 1. HERO BANNER */}
      <AnimeHeroV2
        anime={anime}
        extraInfo={extraInfo}
        characters={characters}
        tmdbData={tmdbData}
      />

      {/* 2. HUD STATS */}
      <AnimeHUDStats anime={anime} extraInfo={extraInfo} />

      {/* 3. STICKY TAB NAV BAR */}
      <div className="sticky top-[108px] lg:top-[72px] z-40 bg-[#040405]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="container mx-auto max-w-[1500px] px-4">
          <div className="flex items-center gap-1 py-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#ff4dd2] text-black shadow-[0_0_18px_rgba(255,77,210,0.4)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge != null && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                        isActive
                          ? 'bg-black/20 text-black'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <AnimeCharactersCast characters={characters} />
          <AnimeFranchiseUniverse relations={relations} />
          {false && (
            <CommunityDiscussion
              titleId={`anime-${animeId}`}
              mediaType="anime"
              titleName={englishTitle}
            />
          )}
          <AnimeRecommendations
            recommendations={formattedRecommendations}
            relations={relations}
          />
        </>
      )}

      {/* 5. EPISODES TAB */}
      {activeTab === 'episodes' && (
        <AnimeEpisodeGuide
          anime={anime}
          extraInfo={extraInfo}
          episodes={episodes}
          tmdbEpisodes={tmdbData?.episodes || []}
          relations={relations}
          posterFallback={posterImage}
        />
      )}

      {/* 6. MUSIC TAB */}
      {activeTab === 'music' && (
        <>
          <SoundtrackSection mediaTitle={englishTitle} themes={themes} />
          {themes.length > 0 && (
            <div className="container mx-auto max-w-[1500px] px-4 pb-4">
              <AnimeThemeSongs themes={themes} animeTitle={englishTitle} />
            </div>
          )}
        </>
      )}

    </div>
  );
}
