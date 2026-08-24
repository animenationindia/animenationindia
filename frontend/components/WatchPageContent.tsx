/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, ListVideo, Search, ExternalLink, Play, LayoutGrid, List, Film } from 'lucide-react';
import WatchVideoPlayer from './WatchVideoPlayer';
import ReadMoreText from './ReadMoreText';
import TrailerModal from './TrailerModal';
import { TMDBAnimeData } from '../lib/tmdb-api';

interface WatchPageContentProps {
  anime: any;
  episodes: any[];
  tmdbData?: TMDBAnimeData | null;
}

export default function WatchPageContent({ anime, episodes, tmdbData = null }: WatchPageContentProps) {
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [lightsOff, setLightsOff] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const displayTitle = anime.title_english || anime.title?.english || anime.title?.romaji || (typeof anime.title === 'string' ? anime.title : '') || 'Anime';
  const bannerImage = anime.bannerImage || anime.images?.jpg?.large_image_url || anime.coverImage?.extraLarge || anime.coverImage?.large || '';
  const coverImage = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.coverImage?.large || '/placeholder-poster.png';
  const studios = Array.isArray(anime.studios)
    ? anime.studios.map((s: any) => s.name || s).join(', ')
    : Array.isArray(anime.studios?.nodes)
    ? anime.studios.nodes.map((s: any) => s.name).join(', ')
    : typeof anime.studios === 'string'
    ? anime.studios
    : 'Studio';
  const status = anime.status || 'Airing';
  const type = anime.type || anime.format || 'TV';
  const synopsis = anime.synopsis || anime.description || 'No description available.';

  // Map TMDB season episodes for HD still screencaps
  const tmdbEpisodesMap = useMemo(() => {
    const map = new Map<number, any>();
    if (tmdbData?.episodes && Array.isArray(tmdbData.episodes)) {
      for (const ep of tmdbData.episodes) {
        map.set(ep.episodeNumber, ep);
      }
    }
    return map;
  }, [tmdbData]);

  // Calculate range pagination (100 episodes per range)
  const rangeSize = 100;
  const totalEpisodes = episodes.length;
  const rangeCount = Math.ceil(totalEpisodes / rangeSize);
  
  const ranges = useMemo(() => {
    return Array.from({ length: rangeCount }).map((_, idx) => {
      const start = idx * rangeSize + 1;
      const end = Math.min((idx + 1) * rangeSize, totalEpisodes);
      return { label: `${start}-${end}`, start, end, idx };
    });
  }, [totalEpisodes, rangeCount]);

  // Filter episodes based on range selection and search query
  const visibleEpisodes = useMemo(() => {
    const activeRange = ranges[selectedRangeIndex];
    
    // If there is a search query, search all episodes (ignore range filter)
    if (searchQuery.trim()) {
      return episodes.filter((ep, idx) => {
        const epNum = (ep.mal_id || idx + 1).toString();
        const epTitle = (ep.title || '').toLowerCase();
        const search = searchQuery.toLowerCase().trim();
        return epNum.includes(search) || epTitle.includes(search);
      });
    }

    // Otherwise filter by active range
    if (!activeRange) return episodes.slice(0, 100);
    return episodes.slice(activeRange.start - 1, activeRange.end);
  }, [episodes, selectedRangeIndex, ranges, searchQuery]);

  const handleEpisodeChange = (index: number) => {
    setActiveEpisodeIndex(index);
    
    // Auto-update range index if the selected episode is in a different range
    const targetRangeIdx = Math.floor(index / rangeSize);
    if (targetRangeIdx !== selectedRangeIndex && targetRangeIdx < rangeCount) {
      setSelectedRangeIndex(targetRangeIdx);
    }
  };

  const handleNextEpisode = () => {
    if (activeEpisodeIndex < episodes.length - 1) {
      handleEpisodeChange(activeEpisodeIndex + 1);
    }
  };

  return (
    <div className="relative w-full min-h-screen pb-16">
      {/* 💡 Cinema Mode (Lights Off) Dark Backdrop Overlay */}
      {lightsOff && (
        <div 
          className="fixed inset-0 bg-black/95 z-40 transition-opacity duration-500 cursor-pointer"
          onClick={() => setLightsOff(false)}
          title="Click to turn lights back on"
        />
      )}

      {/* Main Layout Grid */}
      <div className="container mx-auto px-4 max-w-[1600px] flex flex-col xl:flex-row gap-6 relative z-10">
        
        {/* Left Side: Video Player & Episodes Selection Grid */}
        <div className="flex-1 w-full flex flex-col gap-6">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-400 mb-2">
            <Link 
              href={`/series/${anime.mal_id || anime.id}`} 
              className="hover:text-[#ff4dd2] transition-colors flex items-center gap-1 bg-[#121326]/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-md group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Details
            </Link>
            <span className="hidden sm:inline">/</span>
            <span className="text-white hidden sm:inline line-clamp-1 max-w-[200px] md:max-w-[400px]">{displayTitle}</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-[#ff4dd2] drop-shadow-[0_0_8px_rgba(255,77,210,0.4)]">
              Episode {activeEpisodeIndex + 1}
            </span>
          </nav>

          {/* Video Player */}
          <WatchVideoPlayer 
            title={displayTitle}
            episodeNumber={activeEpisodeIndex + 1}
            onEnded={handleNextEpisode}
            lightsOff={lightsOff}
            setLightsOff={setLightsOff}
          />

          {/* Episodes Selector Box */}
          <div className="bg-[#0b0c20]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ListVideo size={20} className="text-[#ff4dd2]" />
                  Episodes
                </h3>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
                  {totalEpisodes} episodes total
                </span>
              </div>

              {/* Controls: Search, Range select, and View Mode Toggle */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                
                {/* Search box */}
                <div className="relative flex items-center flex-1 sm:flex-none">
                  <input 
                    type="text" 
                    placeholder="Find episode..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#121328] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#ff4dd2] focus:shadow-[0_0_15px_rgba(255,77,210,0.2)] w-full sm:w-44 transition-all"
                  />
                  <Search size={14} className="absolute left-3 text-gray-400" />
                </div>

                {/* View Mode Toggle: Cards vs Compact Grid */}
                <div className="flex items-center bg-[#121328] border border-white/5 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'cards' ? 'bg-[#ff4dd2] text-black shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                    title="Detailed Card View"
                  >
                    <List size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#ff4dd2] text-black shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                    title="Compact Number Grid"
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>

                {/* Range Dropdown Selector */}
                {rangeCount > 1 && !searchQuery && (
                  <div className="relative shrink-0">
                    <select 
                      value={selectedRangeIndex}
                      onChange={(e) => setSelectedRangeIndex(parseInt(e.target.value))}
                      className="bg-[#121328] border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none cursor-pointer focus:border-[#ff4dd2] appearance-none pr-8 min-w-[90px]"
                    >
                      {ranges.map((r) => (
                        <option key={r.idx} value={r.idx}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 scale-90">▼</div>
                  </div>
                )}
              </div>
            </div>

            {/* Episode List Rendering */}
            {visibleEpisodes.length > 0 ? (
              viewMode === 'cards' ? (
                /* 1. Detailed Cards View (with HD Stills & Previews) */
                <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {visibleEpisodes.map((ep, idx) => {
                    const realIndex = searchQuery ? episodes.indexOf(ep) : (selectedRangeIndex * rangeSize) + idx;
                    const epNum = realIndex + 1;
                    const isActive = activeEpisodeIndex === realIndex;
                    const tmdbEp = tmdbEpisodesMap.get(epNum);
                    const epImage = tmdbEp?.stillUrl || coverImage;
                    const runtime = tmdbEp?.runtime ? `${tmdbEp.runtime}m` : '24m';

                    return (
                      <button
                        key={ep.mal_id || realIndex}
                        onClick={() => handleEpisodeChange(realIndex)}
                        className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-4 transition-all group border cursor-pointer ${
                          isActive
                            ? 'bg-[#ff4dd2]/15 text-white border-[#ff4dd2]/60 shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                            : 'bg-[#121328]/60 text-white border-white/5 hover:border-[#ff4dd2]/30 hover:bg-[#121328]'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-24 sm:w-28 h-16 bg-[#1c1c1f] rounded-xl overflow-hidden relative ${
                            isActive ? 'ring-2 ring-[#ff4dd2]' : 'group-hover:ring-1 group-hover:ring-white/40'
                          } transition-all`}>
                            <img 
                              src={epImage} 
                              alt={ep.title || `Episode ${epNum}`} 
                              loading="lazy" 
                              className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity duration-300" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-transparent transition-colors">
                              <Play 
                                size={18} 
                                className={isActive ? 'text-[#ff4dd2] fill-current' : 'text-white opacity-0 group-hover:opacity-100 transition-opacity'} 
                              />
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-extrabold text-white">
                              {runtime}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 overflow-hidden min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-[#ff4dd2] text-black' : 'bg-white/10 text-gray-300'
                            }`}>
                              EP {epNum}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold text-[#ff4dd2] animate-pulse">
                                Playing Now
                              </span>
                            )}
                          </div>
                          <p className={`font-bold text-xs sm:text-sm line-clamp-1 transition-colors mt-1 ${
                            isActive ? 'text-white font-extrabold' : 'text-gray-200 group-hover:text-[#ff4dd2]'
                          }`}>
                            {ep.title && ep.title !== `Episode ${epNum}` ? ep.title : (tmdbEp?.name || `Episode ${epNum}`)}
                          </p>
                          {tmdbEp?.overview && (
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                              {tmdbEp.overview}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* 2. Compact Grid View (Responsive 8-10 numbers per row) */
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {visibleEpisodes.map((ep, idx) => {
                    const realIndex = searchQuery ? episodes.indexOf(ep) : (selectedRangeIndex * rangeSize) + idx;
                    const epNum = realIndex + 1;
                    const isActive = activeEpisodeIndex === realIndex;

                    return (
                      <button
                        key={ep.mal_id || realIndex}
                        onClick={() => handleEpisodeChange(realIndex)}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl font-extrabold text-xs transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[#ff4dd2] text-black border-[#ff4dd2] shadow-lg shadow-[#ff4dd2]/30 scale-105'
                            : 'bg-[#121328] text-gray-300 border-white/5 hover:border-[#ff4dd2]/50 hover:text-white'
                        }`}
                      >
                        <span>{epNum}</span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="text-center py-10 text-gray-500 font-medium">
                No episodes matching &quot;{searchQuery}&quot; found.
              </div>
            )}
          </div>
          
        </div>

        {/* Right Side: Details Card */}
        <div className="w-full xl:w-[420px] flex-shrink-0 flex flex-col gap-6">
          
          <div className="bg-[#0b0c20]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 sticky top-28">
            
            {/* Banner & Cover Art overlay section with ClearArt Logo */}
            <div className="relative w-full rounded-2xl overflow-hidden h-48 border border-white/10 shadow-lg select-none">
              <img src={bannerImage || coverImage} alt={displayTitle} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-60 filter blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c20] via-[#0b0c20]/40 to-black/30 z-10" />
              
              {/* ClearArt Logo or Cover in Corner */}
              <div className="absolute bottom-3 left-4 right-4 z-20 flex items-end gap-3">
                <div className="w-16 h-22 rounded-xl overflow-hidden border border-white/20 shadow-2xl flex-shrink-0 bg-black">
                  <img src={coverImage} alt={displayTitle} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  {tmdbData?.logoUrl ? (
                    <img
                      src={tmdbData.logoUrl}
                      alt={displayTitle}
                      className="max-h-12 max-w-[200px] object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] mb-1"
                    />
                  ) : (
                    <h2 className="text-base font-extrabold text-white line-clamp-2 leading-tight">
                      {displayTitle}
                    </h2>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-[#ff4dd2] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {type}
                    </span>
                    <span className="text-[11px] text-gray-300 font-semibold">
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions (Watch Details & Trailer) */}
            <div className="flex items-center gap-3">
              <Link
                href={`/series/${anime.mal_id || anime.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs transition-all"
              >
                <Info size={14} className="text-[#ff4dd2]" /> Full Details Page
              </Link>

              {tmdbData?.trailerYoutubeId && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff4dd2]/15 hover:bg-[#ff4dd2]/25 border border-[#ff4dd2]/40 text-[#ff4dd2] font-bold text-xs transition-all cursor-pointer"
                >
                  <Film size={14} /> Trailer
                </button>
              )}
            </div>

            {/* Clean Synopsis with ReadMore */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Synopsis
              </h4>
              <ReadMoreText text={synopsis} maxChars={220} />
            </div>

            {/* Metadata Info Grid */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Studio</span>
                <span className="text-white font-bold">{studios}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Format</span>
                <span className="text-white font-bold">{type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Episodes</span>
                <span className="text-white font-bold">{totalEpisodes}</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Trailer Modal */}
      {isTrailerOpen && tmdbData?.trailerYoutubeId && (
        <TrailerModal
          youtubeId={tmdbData.trailerYoutubeId}
          title={displayTitle}
          isOpen={true}
          onClose={() => setIsTrailerOpen(false)}
        />
      )}
    </div>
  );
}
