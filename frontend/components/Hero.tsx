/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { Play, Film, Flame, Sparkles, Radio, Volume2, Info } from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';
import TrailerModal from './TrailerModal';
import { sanitizeHTML } from '../lib/sanitize';
import { toEnglishTitle } from '../lib/titleCleaner';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface HeroAnime {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
    native?: string | null;
  };
  coverImage?: {
    extraLarge?: string;
    large: string;
  };
  bannerImage: string | null;
  description: string | null;
  status: string | null;
  format: string | null;
  averageScore: number | null;
  seasonYear?: number | null;
  genres?: string[] | null;
  episodes?: number | null;
  broadcast?: {
    day_of_the_week?: string;
    start_time?: string;
  } | null;
  isAiringToday?: boolean;
  airingDay?: string | null;
  airingTime?: string | null;
  isDubbed?: boolean;
  trailer?: {
    id: string | null;
    site: string | null;
  } | null;
}

export default function Hero({ animeList }: { animeList: HeroAnime[] }) {
  const [mounted, setMounted] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTrailer, setActiveTrailer] = useState<{ id: string; title: string } | null>(null);
  const [logosMap, setLogosMap] = useState<Record<number, string>>({});
  const [backdropsMap, setBackdropsMap] = useState<Record<number, string>>({});
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const scrollSetting = localStorage.getItem('autoScrollEnabled');
    if (scrollSetting === 'false') {
      setAutoScroll(false);
    }
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Fetch TMDB ClearArt 4K logos and Ultra HD Cinema Backdrops
  useEffect(() => {
    if (!animeList || animeList.length === 0) return;

    let isMounted = true;
    const fetchLogosAndBackdrops = async () => {
      const topItems = animeList.slice(0, 10);
      const newLogoMap: Record<number, string> = {};
      const newBackdropMap: Record<number, string> = {};

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://animenationindia.onrender.com');

      await Promise.all(topItems.map(async (anime) => {
        const title = toEnglishTitle(anime.title.english || anime.title.romaji);
        const cleanTitle = encodeURIComponent(title.replace(/\s*\(TV\)/gi, '').replace(/[:\-_]/g, ' ').trim());
        try {
          const res = await fetch(`${backendUrl}/api/tmdb/hero?title=${cleanTitle}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data?.backdropUrl) {
              newBackdropMap[anime.id] = json.data.backdropUrl;
            }
            if (json.data?.logoUrl) {
              newLogoMap[anime.id] = json.data.logoUrl;
            }
          }
        } catch {}
      }));

      if (isMounted) {
        if (Object.keys(newLogoMap).length > 0) {
          setLogosMap(prev => ({ ...prev, ...newLogoMap }));
        }
        if (Object.keys(newBackdropMap).length > 0) {
          setBackdropsMap(prev => ({ ...prev, ...newBackdropMap }));
        }
      }
    };

    fetchLogosAndBackdrops();
    return () => { isMounted = false; };
  }, [animeList]);

  if (!animeList || animeList.length === 0) return null;

  const handleThumbnailClick = (idx: number) => {
    if (swiperInstance) {
      swiperInstance.slideToLoop(idx);
      setActiveIndex(idx);
    }
  };

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentTodayDay = days[new Date().getDay()];

  return (
    <section className="relative w-full overflow-hidden bg-[#050716] group select-none">
      {/* 🌟 Custom Keyframe Styles for Crunchyroll Progress & Live Pulse */}
      <style>{`
        @keyframes crProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .cr-progress-active {
          animation: crProgress 6.5s linear infinite;
        }
        .swiper-pagination-bullet {
          width: 20px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.25);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          width: 32px;
          background: #ff4dd2;
          box-shadow: 0 0 10px rgba(255, 77, 210, 0.9);
        }
      `}</style>

      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        onSwiper={setSwiperInstance}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        navigation={{ nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }}
        pagination={{ clickable: true, el: '.cr-mobile-pagination' }}
        autoplay={autoScroll ? { delay: 6500, disableOnInteraction: false } : false}
        loop={animeList.length > 1}
        className="w-full h-[64vh] sm:h-[68vh] md:h-[640px] lg:h-[680px] xl:h-[720px]" 
      >
        {animeList.map((anime, index) => {
          const title = toEnglishTitle(anime.title.english || anime.title.romaji);
          const rawBg = backdropsMap[anime.id] || anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large;
          const backgroundImage = rawBg;
          const linkId = anime.idMal || anime.id;
          const logoUrl = logosMap[anime.id];
          const trailerId = anime.trailer?.id && anime.trailer?.site === 'youtube' ? anime.trailer.id : null;

          // Real-time Simulcast & Airing Detection
          const broadcastDay = anime.airingDay?.toLowerCase() || anime.broadcast?.day_of_the_week?.toLowerCase();
          const isAiringToday = anime.isAiringToday ?? (broadcastDay === currentTodayDay);
          const broadcastTime = anime.airingTime || anime.broadcast?.start_time;

          return (
            <SwiperSlide key={`hero-${anime.id}-${index}`}>
              <div className="relative w-full h-full">
                
                {/* 🌟 Full Width Ultra HD 4K Backdrop Image with Smooth Vignette */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  {backgroundImage && (
                    <img 
                      src={backgroundImage} 
                      alt={title} 
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover object-top md:object-[center_20%] filter contrast-[1.08] brightness-[0.88] saturate-[1.15] scale-100 group-hover:scale-[1.01] transition-transform duration-1000 ease-out" 
                    />
                  )}
                  {/* Multi-layered Cinematic Gradients for 100% Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050716] via-[#050716]/90 md:via-[#050716]/75 lg:via-[#050716]/55 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/40 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#050716]/70 via-transparent to-transparent z-10"></div>
                </div>

                {/* Content Container */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-12 w-full max-w-[1600px] h-full relative z-20">
                  <div className="w-full md:w-3/5 lg:w-[55%] flex flex-col justify-end md:justify-center h-full pb-20 md:pb-12 pt-16">
                    
                    {/* 🔴 Crunchyroll Real-time Simulcast & Spotlight Badge Bar */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3">
                      {isAiringToday ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] backdrop-blur-md animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                          <Radio size={12} className="text-rose-400" />
                          STREAMING TODAY {broadcastTime ? `• ${broadcastTime} JST` : ''}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#ff6400]/30 via-[#ff4dd2]/25 to-[#ff4dd2]/30 text-white border border-[#ff4dd2]/40 shadow-[0_0_15px_rgba(255,77,210,0.35)] backdrop-blur-md">
                          <Flame size={13} className="text-[#ff6400] fill-[#ff6400]" />
                          #{index + 1} SIMULCAST SPOTLIGHT {broadcastDay ? `• EVERY ${broadcastDay.toUpperCase()}` : ''}
                        </div>
                      )}

                      {/* 🎙️ Audio & Language Badges */}
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-sky-300 bg-sky-500/20 border border-sky-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        🎌 JAPANESE SIMULCAST
                      </span>

                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        <Volume2 size={11} />
                        HINDI & ENGLISH DUB
                      </span>

                      <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
                        4K ULTRA HD
                      </span>
                    </div>

                    {/* 🌟 Official TMDB ClearArt 4K Logo or Stylized Title */}
                    {logoUrl ? (
                      <div className="mb-3 max-w-[280px] sm:max-w-[380px] md:max-w-[460px] lg:max-w-[500px] h-16 sm:h-24 md:h-28 lg:h-32 flex items-center">
                        <img
                          src={logoUrl}
                          alt={title}
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]"
                        />
                      </div>
                    ) : (
                      <h1 className="font-bebas text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-2 line-clamp-2 leading-none uppercase tracking-wide drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]">
                        {title}
                      </h1>
                    )}

                    {/* 📊 Crunchyroll Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3 text-[12px] sm:text-[13px] font-semibold text-gray-300">
                      <span className="text-[#050716] bg-[#ff4dd2] px-2.5 py-0.5 rounded-md font-black text-xs uppercase shadow-md shadow-[#ff4dd2]/40">
                        {anime.format || 'TV'}
                      </span>
                      {anime.averageScore && (
                        <span className="text-amber-400 font-extrabold flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-amber-400/20">
                          ★ {(anime.averageScore / 10).toFixed(1)}
                        </span>
                      )}
                      {anime.seasonYear && (
                        <span className="text-gray-300 font-bold bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                          {anime.seasonYear}
                        </span>
                      )}
                      {anime.episodes && (
                        <span className="text-gray-300 text-xs font-semibold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          {anime.episodes} Episodes
                        </span>
                      )}
                      {anime.status && (
                        <span className="text-xs text-gray-300 font-medium uppercase tracking-wider">
                          • {anime.status.replace(/_/g, ' ')}
                        </span>
                      )}

                      {/* 🏷️ Clickable Genre Pills */}
                      {anime.genres && anime.genres.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 ml-1">
                          {anime.genres.slice(0, 3).map((g) => (
                            <Link
                              key={g}
                              href={`/genre/${encodeURIComponent(g.toLowerCase())}`}
                              className="inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-[#ff4dd2] text-gray-200 hover:text-black border border-white/15 hover:border-[#ff4dd2] transition-all duration-300 backdrop-blur-md cursor-pointer hover:scale-105"
                            >
                              {g}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 📝 Crunchyroll Storyline Synopsis */}
                    <div 
                      className="text-gray-200/95 text-[12px] sm:text-[13px] md:text-[14px] mb-5 sm:mb-6 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(anime.description) || 'Stream the latest episodes in full HD and Hindi Dub on Anime Nation India.' }}
                    ></div>

                    {/* 🕹️ Call to Action Buttons */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3.5">
                      {/* 1. Watch Now */}
                      <Link 
                        href={`/watch/${linkId}`} 
                        className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 bg-gradient-to-r from-[#ff4dd2] to-[#ff7be0] hover:from-[#ff6ee0] hover:to-[#ff99ec] text-black font-extrabold py-2.5 sm:py-3 px-6 sm:px-8 text-xs sm:text-sm transition-all uppercase tracking-wider shadow-lg shadow-[#ff4dd2]/40 rounded-xl cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Play size={16} fill="currentColor" />
                        WATCH NOW
                      </Link>

                      {/* 2. Official Trailer Modal Trigger */}
                      {trailerId && (
                        <button
                          onClick={() => setActiveTrailer({ id: trailerId, title })}
                          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 font-bold py-2.5 sm:py-3 px-4 sm:px-5 text-xs sm:text-sm transition-all uppercase tracking-wider rounded-xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <Film size={16} className="text-[#ff4dd2]" />
                          TRAILER
                        </button>
                      )}

                      {/* 3. View Details */}
                      <Link 
                        href={`/series/${linkId}`} 
                        className="inline-flex items-center justify-center gap-2 bg-black/40 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 font-bold py-2.5 sm:py-3 px-4 sm:px-5 text-xs sm:text-sm transition-all uppercase tracking-wider rounded-xl backdrop-blur-md hover:scale-105 active:scale-95"
                      >
                        <Info size={16} />
                        DETAILS
                      </Link>

                      {/* 4. Watchlist Toggle */}
                      <WatchlistDropdown 
                        animeId={linkId} 
                        title={title} 
                        image={backgroundImage || ''} 
                        variant="icon" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        {/* 🎮 Swiper Navigation Arrow Controls */}
        <div className="swiper-button-prev !text-[#ff4dd2] drop-shadow-[0_0_12px_rgba(255,77,210,0.9)] !left-3 md:!left-6 opacity-0 group-hover:opacity-100 transition-all duration-300 after:!text-2xl md:after:!text-3xl hover:scale-125"></div>
        <div className="swiper-button-next !text-[#ff4dd2] drop-shadow-[0_0_12px_rgba(255,77,210,0.9)] !right-3 md:!right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 after:!text-2xl md:after:!text-3xl hover:scale-125"></div>
      </Swiper>

      {/* 🌟 Crunchyroll-Style Interactive Bottom Thumbnail Switcher (Desktop & Laptop) */}
      <div className="hidden md:flex absolute bottom-6 right-6 lg:right-12 z-30 items-center gap-2.5 max-w-[45%] xl:max-w-[50%] overflow-x-auto py-2 px-3 rounded-2xl bg-black/50 backdrop-blur-lg border border-white/10 shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#ff4dd2] pr-1 flex items-center gap-1">
          <Sparkles size={12} /> UP NEXT:
        </span>
        {animeList.slice(0, 6).map((anime, idx) => {
          const isActive = activeIndex === idx;
          const thumbTitle = toEnglishTitle(anime.title.english || anime.title.romaji);
          const thumbImg = backdropsMap[anime.id] || anime.bannerImage || anime.coverImage?.large || anime.coverImage?.extraLarge;

          return (
            <button
              key={`thumb-${anime.id}-${idx}`}
              onClick={() => handleThumbnailClick(idx)}
              className={`relative flex-shrink-0 w-24 lg:w-28 h-14 rounded-lg overflow-hidden border transition-all duration-300 text-left group/card cursor-pointer ${
                isActive 
                  ? 'border-[#ff4dd2] shadow-[0_0_16px_rgba(255,77,210,0.8)] scale-105 ring-2 ring-[#ff4dd2]/50' 
                  : 'border-white/15 opacity-60 hover:opacity-100 hover:border-white/40 hover:scale-102'
              }`}
            >
              {thumbImg && (
                <img
                  src={thumbImg}
                  alt={thumbTitle}
                  className="w-full h-full object-cover object-center filter brightness-[0.8] group-hover/card:brightness-100 transition-all"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
              
              {/* Rank & Title Overlay */}
              <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
                <span className="text-[9px] font-black text-white line-clamp-1 drop-shadow">
                  #{idx + 1} {thumbTitle}
                </span>
              </div>

              {/* Crunchyroll Active Animated Progress Indicator */}
              {isActive && autoScroll && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 overflow-hidden">
                  <div className="h-full bg-[#ff4dd2] shadow-[0_0_8px_#ff4dd2] cr-progress-active"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 📱 Mobile Pagination Indicator (Dots for small screens) */}
      <div className="md:hidden cr-mobile-pagination flex justify-center items-center gap-1.5 absolute bottom-4 left-0 right-0 z-30"></div>

      {/* 🎬 4K Official Trailer Modal */}
      {activeTrailer && (
        <TrailerModal
          youtubeId={activeTrailer.id}
          title={activeTrailer.title}
          isOpen={true}
          onClose={() => setActiveTrailer(null)}
        />
      )}
    </section>
  );
}
