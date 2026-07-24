'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Info, ListVideo, Search, ExternalLink, Play } from 'lucide-react';
import WatchVideoPlayer from './WatchVideoPlayer';

interface WatchPageContentProps {
  anime: any;
  episodes: any[];
}

export default function WatchPageContent({ anime, episodes }: WatchPageContentProps) {
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [lightsOff, setLightsOff] = useState(false);

  const displayTitle = anime.title_english || anime.title;
  const bannerImage = anime.images?.jpg?.large_image_url || '';
  const coverImage = anime.images?.jpg?.image_url || '';
  const studios = anime.studios?.map((s: any) => s.name).join(', ') || 'Toei Animation';
  const status = anime.status || 'Airing';
  const type = anime.type || 'TV';

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
              href={`/series/${anime.mal_id}`} 
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

          {/* Episodes Selector Box (styled exactly like Screenshot 2) */}
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

              {/* Controls: Search and Range select */}
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

            {/* Episode List Layout with Titles and Thumbnails */}
            {visibleEpisodes.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {visibleEpisodes.map((ep, idx) => {
                  // Resolve real episode index
                  const realIndex = searchQuery ? episodes.indexOf(ep) : (selectedRangeIndex * rangeSize) + idx;
                  const isActive = activeEpisodeIndex === realIndex;
                  return (
                    <button
                      key={ep.mal_id || realIndex}
                      onClick={() => handleEpisodeChange(realIndex)}
                      className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-4 transition-all group border cursor-pointer ${
                        isActive
                          ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                          : 'bg-[#121328]/60 text-white border-white/5 hover:border-[#ff4dd2]/30'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className={`w-24 h-14 bg-[#1c1c1f] rounded-xl overflow-hidden relative ${
                          isActive ? 'ring-2 ring-black' : 'group-hover:ring-2 group-hover:ring-[#ff4dd2]'
                        } transition-all`}>
                          <Image 
                            src={coverImage} 
                            alt={ep.title || `Episode ${realIndex + 1}`} 
                            fill
                            sizes="96px"
                            className="object-cover opacity-50 group-hover:opacity-85 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play 
                              size={16} 
                              className={isActive ? 'text-black' : 'text-white opacity-0 group-hover:opacity-100 transition-opacity'} 
                              fill="currentColor" 
                            />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
                            24:00
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className={`font-extrabold text-sm line-clamp-1 transition-colors leading-snug ${
                          isActive ? 'text-black' : 'text-gray-200 group-hover:text-[#ff4dd2]'
                        }`}>
                          {ep.mal_id || realIndex + 1}. {ep.title || `Episode ${realIndex + 1}`}
                        </p>
                        <p className={`text-[10px] font-bold mt-1 ${isActive ? 'text-black/60' : 'text-gray-400'}`}>
                          Duration: 24:00 min
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 font-medium">
                No episodes matching &quot;{searchQuery}&quot; found.
              </div>
            )}
          </div>
          
        </div>

        {/* Right Side: Details Card (styled exactly like Screenshot 1) */}
        <div className="w-full xl:w-[420px] flex-shrink-0 flex flex-col gap-6">
          
          <div className="bg-[#0b0c20]/80 border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 sticky top-28">
            
            {/* Banner & Cover Art overlay section */}
            <div className="relative w-full rounded-2xl overflow-hidden h-44 border border-white/10 shadow-lg select-none">
              <Image 
                src={bannerImage}
                alt={displayTitle}
                fill
                sizes="(max-width: 1280px) 100vw, 420px"
                className="object-cover opacity-60 filter blur-[1px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c20] via-[#0b0c20]/30 to-black/25 z-10" />
              
              {/* Floating Info inside Banner */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex gap-4 items-end">
                <div className="relative w-16 h-24 rounded-lg overflow-hidden border border-white/20 shadow-md shrink-0">
                  <Image 
                    src={coverImage}
                    alt={displayTitle}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0 pb-1">
                  <h2 className="text-white font-bold text-base md:text-lg line-clamp-1 uppercase tracking-tight drop-shadow-md">
                    {displayTitle}
                  </h2>
                  <p className="text-[#ff4dd2] text-xs font-black drop-shadow-sm">
                    Episode {activeEpisodeIndex + 1}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-[9px] font-black uppercase tracking-wider">
                    <span className="bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30 px-1.5 py-0.5 rounded">
                      {status}
                    </span>
                    <span className="bg-white/10 text-white border border-white/15 px-1.5 py-0.5 rounded">
                      {type}
                    </span>
                    <span className="bg-white/10 text-white border border-white/15 px-1.5 py-0.5 rounded">
                      {anime.year || anime.season_year || '1999'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Genre Pills */}
            <div className="flex flex-wrap gap-2 my-1">
              {anime.genres?.map((genre: any) => (
                <span 
                  key={genre.mal_id || genre.name} 
                  className="bg-white text-black font-bold text-xs px-3.5 py-1.5 rounded-full shadow-md hover:scale-102 transition-transform select-none"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Synopsis Description */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Info size={14} className="text-[#ff4dd2]" /> Synopsis
              </h4>
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed line-clamp-4 overflow-y-auto pr-1">
                {anime.synopsis || 'Synopsis not available.'}
              </p>
            </div>

            {/* Metadata Table */}
            <div className="flex flex-col gap-3.5 pt-4 border-t border-white/5 text-xs md:text-sm select-none">
              <div className="flex justify-between items-center text-gray-400">
                <span>Studio</span>
                <span className="text-white font-bold">{studios}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Status</span>
                <span className="text-white font-bold">{status}</span>
              </div>
              <div className="flex justify-between items-center text-gray-400">
                <span>Type</span>
                <span className="text-white font-bold">{type}</span>
              </div>
            </div>

            {/* Official streaming platforms */}
            {anime.streaming && anime.streaming.length > 0 && (
              <div className="flex flex-col gap-2.5 pt-4 border-t border-white/5 text-xs md:text-sm">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink size={14} className="text-green-400" /> Watch On
                </span>
                <div className="flex flex-wrap gap-2">
                  {anime.streaming.slice(0, 3).map((stream: any, index: number) => (
                    <a 
                      key={index}
                      href={stream.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white/5 hover:bg-[#ff4dd2]/10 border border-white/5 hover:border-[#ff4dd2]/30 text-white hover:text-[#ff4dd2] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      {stream.name} <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
          
        </div>
      </div>
    </div>
  );
}
