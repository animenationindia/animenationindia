'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Film, Sparkles, Layers, Music } from 'lucide-react';
import AnimeHeroV2 from './AnimeHeroV2';
import AnimeOverviewTab from './AnimeOverviewTab';
import AnimeEpisodesTab from './AnimeEpisodesTab';
import AnimeThemeSongs from './AnimeThemeSongs';
import SectionSlider from './SectionSlider';
import { NormalizedTheme } from '../lib/animethemes-api';

interface AnimeDetailsContainerProps {
  anime: any;
  extraInfo?: any;
  characters?: any[];
  episodes?: any[];
  recommendations?: any[];
  relations?: any[];
  themes?: NormalizedTheme[];
}

export default function AnimeDetailsContainer({
  anime,
  extraInfo,
  characters = [],
  episodes = [],
  recommendations = [],
  relations = [],
  themes = [],
}: AnimeDetailsContainerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'themes'>('overview');

  const animeId = anime.mal_id || anime.id || extraInfo?.idMal || extraInfo?.id;
  const episodeCount = anime.episodes || extraInfo?.episodes || episodes.length || 12;
  const englishTitle = anime.title_english || anime.title || 'Anime';

  // Format recommendations for SectionSlider with full fallback support
  const formattedRecommendations = recommendations.map((r: any) => {
    const titleEng = r.entry?.title || (typeof r.title === 'object' ? r.title?.english || r.title?.romaji : r.title) || 'Anime';
    const titleRom = r.entry?.title || (typeof r.title === 'object' ? r.title?.romaji || r.title?.english : r.title) || 'Anime';
    const cover = 
      r.entry?.images?.webp?.large_image_url ||
      r.entry?.images?.jpg?.large_image_url ||
      r.entry?.images?.jpg?.image_url ||
      r.coverImage?.extraLarge ||
      r.coverImage?.large ||
      '/placeholder-poster.png';

    return {
      id: r.entry?.mal_id || r.idMal || r.id || 0,
      idMal: r.entry?.mal_id || r.idMal || r.id || 0,
      title: { english: titleEng, romaji: titleRom },
      coverImage: {
        large: cover,
        extraLarge: cover,
      },
      format: r.format || r.entry?.format || 'TV',
      averageScore: typeof r.averageScore === 'number' ? r.averageScore : null
    };
  });

  return (
    <div className="min-h-screen bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white pb-20">
      {/* 1. 🌟 Hero Banner Section */}
      <AnimeHeroV2 anime={anime} extraInfo={extraInfo} />

      {/* 2. 🗂️ Sticky Tab Navigation Bar */}
      <div className="sticky top-20 z-30 bg-[#040405]/95 backdrop-blur-xl border-y border-white/5 shadow-lg">
        <div className="container mx-auto px-4 max-w-[1500px]">
          <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <LayoutGrid size={15} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('episodes')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === 'episodes'
                  ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <Film size={15} />
              <span>Episodes</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'episodes' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'
                }`}
              >
                {episodeCount}
              </span>
            </button>

            {themes.length > 0 && (
              <button
                onClick={() => setActiveTab('themes')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeTab === 'themes'
                    ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                }`}
              >
                <Music size={15} />
                <span>Themes & Music</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'themes' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'
                  }`}
                >
                  {themes.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. 📑 Tab Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-[1500px]">
        {activeTab === 'overview' ? (
          <div className="space-y-12">
            {/* Overview Tab Content */}
            <AnimeOverviewTab
              anime={anime}
              extraInfo={extraInfo}
              characters={characters}
              themes={themes}
            />

            {/* Franchise & Related Media Grid */}
            {relations.length > 0 && (
              <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Franchise & Related Seasons</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Prequels, sequels, spin-offs & adaptations</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {relations.map((edge: any, index: number) => {
                    const node = edge.node;
                    const isMangaNode = node.type === 'MANGA';
                    const linkUrl = isMangaNode ? `/manga/${node.idMal || node.id}` : `/series/${node.idMal || node.id}`;
                    const title = node.title?.english || node.title?.romaji || 'Related Title';
                    const cover = node.coverImage?.large || '/placeholder-poster.png';
                    const relType = edge.relationType ? edge.relationType.replace(/_/g, ' ') : 'RELATION';
                    const formatText = node.format ? node.format.replace(/_/g, ' ') : (isMangaNode ? 'MANGA' : 'ANIME');
                    const yearText = node.startDate?.year ? `• ${node.startDate.year}` : '';

                    return (
                      <Link 
                        key={node.idMal || node.id || index} 
                        href={linkUrl}
                        className="bg-[#0e0f1d] border border-white/5 rounded-2xl p-3 flex flex-col gap-2.5 hover:border-[#ff4dd2]/50 hover:shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition-all group"
                      >
                        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121326]">
                          <img 
                            src={cover} 
                            alt={title} 
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-[#ff4dd2] text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                            {relType}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white truncate group-hover:text-[#ff4dd2] transition-colors">
                            {title}
                          </span>
                          <span className="text-[10px] text-gray-400 capitalize mt-0.5">
                            {formatText} {yearText}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations Carousel */}
            {formattedRecommendations.length > 0 && (
              <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
                <SectionSlider
                  title="You Might Also Like"
                  data={formattedRecommendations}
                  type="anime"
                  viewAllLink=""
                />
              </div>
            )}
          </div>
        ) : activeTab === 'episodes' ? (
          /* Episodes Tab Content */
          <AnimeEpisodesTab
            animeId={animeId}
            episodes={episodes}
            totalCount={episodeCount}
          />
        ) : (
          /* Dedicated Themes & Music Tab Content */
          <div className="max-w-4xl mx-auto">
            <AnimeThemeSongs
              themes={themes}
              animeTitle={englishTitle}
            />
          </div>
        )}
      </div>
    </div>
  );
}
