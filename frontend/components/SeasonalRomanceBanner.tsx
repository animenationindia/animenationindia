/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Play, Info, Sparkles, Heart, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { sanitizeHTML } from '../lib/sanitize';
import { toEnglishTitle } from '../lib/titleCleaner';
import WatchlistDropdown from './WatchlistDropdown';
import type { AniListMedia } from '../lib/api';

interface Props {
  animeList: AniListMedia[];
}

export default function SeasonalRomanceBanner({ animeList }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [logosMap, setLogosMap] = useState<Record<number, string>>({});
  const [backdropsMap, setBackdropsMap] = useState<Record<number, string>>({});

  const list = Array.isArray(animeList) && animeList.length > 0 ? animeList.slice(0, 8) : [];
  const currentAnime = list[currentIndex] || list[0] || null;

  // Auto-cycle through top romance anime every 8 seconds
  useEffect(() => {
    if (list.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [list.length, isPaused]);

  // Fetch TMDB 4K Logos and Cinema Backdrops for featured romance anime
  useEffect(() => {
    if (list.length === 0) return;

    let isMounted = true;
    const fetchVisuals = async () => {
      const newLogos: Record<number, string> = {};
      const newBackdrops: Record<number, string> = {};
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://animenationindia.onrender.com');

      await Promise.all(
        list.map(async (anime) => {
          const title = toEnglishTitle(anime.title.english || anime.title.romaji);
          const cleanTitle = encodeURIComponent(title.replace(/\s*\(TV\)/gi, '').replace(/[:\-_]/g, ' ').trim());
          try {
            const res = await fetch(`${backendUrl}/api/tmdb/hero?title=${cleanTitle}`);
            if (res.ok) {
              const json = await res.json();
              if (json.data?.backdropUrl) newBackdrops[anime.id] = json.data.backdropUrl;
              if (json.data?.logoUrl) newLogos[anime.id] = json.data.logoUrl;
            }
          } catch {}
        })
      );

      if (isMounted) {
        if (Object.keys(newLogos).length > 0) setLogosMap((prev) => ({ ...prev, ...newLogos }));
        if (Object.keys(newBackdrops).length > 0) setBackdropsMap((prev) => ({ ...prev, ...newBackdrops }));
      }
    };

    fetchVisuals();
    return () => { isMounted = false; };
  }, [list]);

  if (!currentAnime) return null;

  const title = toEnglishTitle(currentAnime.title.english || currentAnime.title.romaji);
  const backgroundImage = backdropsMap[currentAnime.id] || currentAnime.bannerImage || currentAnime.coverImage?.extraLarge || currentAnime.coverImage?.large || '';
  const coverImage = currentAnime.coverImage?.extraLarge || currentAnime.coverImage?.large || backgroundImage;
  const linkId = currentAnime.idMal || currentAnime.id;
  const logoUrl = logosMap[currentAnime.id];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  return (
    <section 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden rounded-3xl border border-[#ff4dd2]/25 bg-gradient-to-r from-[#050716] via-[#050716]/90 to-transparent my-6 group shadow-[0_20px_50px_rgba(255,77,210,0.18)] hover:border-[#ff4dd2]/50 transition-all duration-500 select-none"
    >
      {/* 🌟 Ornate Pink Border Corners */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#ff4dd2]/40 pointer-events-none z-20 rounded-tl-md"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#ff4dd2]/40 pointer-events-none z-20 rounded-br-md"></div>

      {/* 🌟 Background Backdrop Image with Smooth Vignette */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        {backgroundImage && (
          <img
            key={`romance-bg-${currentAnime.id}`}
            src={backgroundImage}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center md:object-[center_25%] opacity-35 group-hover:scale-105 group-hover:opacity-45 transition-all duration-1000 ease-out filter contrast-[1.05] brightness-[0.9]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050716] via-[#050716]/90 md:via-[#050716]/75 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/30 to-transparent z-10" />
      </div>

      {/* 🌟 Content Layout */}
      <div className="relative z-20 px-6 sm:px-10 md:px-14 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-between gap-8 w-full">
        {/* Left Column: Info, Badges & Buttons */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl w-full">
          
          {/* 💖 Header Badges Bar */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5 mb-3.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500/25 via-[#ff4dd2]/20 to-[#ff4dd2]/25 border border-[#ff4dd2]/40 text-[#ff4dd2] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] rounded-full shadow-[0_0_15px_rgba(255,77,210,0.35)] backdrop-blur-md">
              <Heart size={12} className="fill-[#ff4dd2] text-[#ff4dd2] animate-pulse" />
              FEATURED ROMANCE SPOTLIGHT
            </span>

            {currentAnime.averageScore && (
              <span className="px-2.5 py-0.5 bg-black/40 text-amber-400 text-xs font-black rounded-full flex items-center gap-1 border border-amber-400/30 backdrop-blur-md">
                ★ {(currentAnime.averageScore / 10).toFixed(1)}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
              <Volume2 size={11} />
              HINDI DUBBED
            </span>

            <span className="text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-md">
              4K UHD
            </span>
          </div>

          {/* 🌟 ClearArt 4K Logo or Stylized Title */}
          {logoUrl ? (
            <div className="mb-3 max-w-[280px] sm:max-w-[360px] md:max-w-[420px] h-16 sm:h-20 md:h-24 flex items-center justify-center lg:justify-start">
              <img
                src={logoUrl}
                alt={title}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)]"
              />
            </div>
          ) : (
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-wide uppercase leading-tight mb-2.5 drop-shadow-lg group-hover:text-[#ff7be0] transition-colors">
              {title}
            </h3>
          )}

          {/* 🏷️ Genre Pills & Year */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3.5">
            {currentAnime.seasonYear && (
              <span className="text-xs font-bold text-gray-300 bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
                {currentAnime.seasonYear}
              </span>
            )}
            {currentAnime.episodes && (
              <span className="text-xs font-semibold text-gray-300 bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
                {currentAnime.episodes} Episodes
              </span>
            )}
            {currentAnime.genres && currentAnime.genres.slice(0, 3).map((g) => (
              <Link
                key={g}
                href={`/genre/${encodeURIComponent(g.toLowerCase())}`}
                className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-[#ff4dd2] text-gray-200 hover:text-black border border-white/15 hover:border-[#ff4dd2] transition-all backdrop-blur-md"
              >
                {g}
              </Link>
            ))}
          </div>

          {/* 📝 Storyline Description */}
          <p 
            className="text-gray-200/95 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-6 max-w-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentAnime.description) || 'Experience unforgettable love stories and heartwarming moments on Anime Nation India.' }}
          ></p>

          {/* 🕹️ Action Buttons */}
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start items-center">
            <Link
              href={`/watch/${linkId}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff4dd2] to-[#ff7be0] hover:from-[#ff6ee0] hover:to-[#ff99ec] text-black font-extrabold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(255,77,210,0.4)] hover:shadow-[0_4px_30px_rgba(255,77,210,0.6)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              Watch Now
            </Link>

            <Link
              href={`/series/${linkId}`}
              className="inline-flex items-center gap-2 bg-black/40 hover:bg-white/15 text-white border border-white/20 hover:border-white/40 font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 backdrop-blur-md hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Info size={16} />
              Explore Details
            </Link>

            <WatchlistDropdown
              animeId={linkId}
              title={title}
              image={coverImage}
              variant="icon"
            />
          </div>
        </div>

        {/* Right Column: Floating 3D Artwork Cover Card with Controls */}
        <div className="hidden lg:flex flex-col items-center gap-4 flex-shrink-0">
          <div className="relative w-[190px] h-[270px] rounded-2xl overflow-hidden border-2 border-[#ff4dd2]/40 shadow-[0_20px_45px_rgba(255,77,210,0.3)] transform rotate-2 group-hover:rotate-0 transition-all duration-500 group/poster">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-black/70 border border-[#ff4dd2]/40 text-[#ff4dd2] text-[10px] font-black rounded-full backdrop-blur-md">
              #{currentIndex + 1}
            </div>
            <div className="absolute bottom-2.5 left-2.5 right-2.5 text-center">
              <p className="text-[11px] font-black text-white line-clamp-1 drop-shadow-md">
                {title}
              </p>
            </div>
          </div>

          {/* 🎮 Interactive Navigation Switcher Controls */}
          {list.length > 1 && (
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/10 shadow-lg">
              <button
                onClick={handlePrev}
                aria-label="Previous romance anime"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#ff4dd2] hover:text-black text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 px-1">
                {list.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to romance slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentIndex === idx ? 'w-5 bg-[#ff4dd2] shadow-[0_0_8px_#ff4dd2]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                aria-label="Next romance anime"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#ff4dd2] hover:text-black text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 📱 Mobile Progress & Dot Bar */}
      {list.length > 1 && (
        <div className="lg:hidden flex justify-center items-center gap-1.5 pb-4 pt-1">
          {list.map((_, idx) => (
            <button
              key={`mob-dot-${idx}`}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? 'w-5 bg-[#ff4dd2]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
