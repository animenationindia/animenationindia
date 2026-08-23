'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, BookOpen, ChevronRight, Sparkles } from 'lucide-react';

interface SpotlightManga {
  id: number;
  idMal?: number;
  title: {
    english?: string;
    romaji?: string;
    native?: string;
  };
  coverImage: {
    large: string;
    extraLarge: string;
  };
  bannerImage?: string | null;
  averageScore?: number | null;
  format?: string;
  status?: string;
  genres?: string[];
  description?: string;
  chapters?: number | null;
  volumes?: number | null;
  countryOfOrigin?: string;
}

interface MangaSpotlightHeroProps {
  spotlights: SpotlightManga[];
}

export default function MangaSpotlightHero({ spotlights }: MangaSpotlightHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!spotlights || spotlights.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % spotlights.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [spotlights]);

  if (!spotlights || spotlights.length === 0) return null;

  const current = spotlights[activeIndex] || spotlights[0];
  const title = current.title.english || current.title.romaji || 'Unknown Title';
  const score = current.averageScore ? (current.averageScore / 10).toFixed(1) : null;
  const banner = current.bannerImage || current.coverImage.extraLarge || current.coverImage.large;
  const format = current.format || 'MANGA';
  const origin = current.countryOfOrigin === 'KR' ? 'South Korea' : current.countryOfOrigin === 'CN' ? 'China' : 'Japan';

  return (
    <div className="relative w-full rounded-3xl overflow-hidden mb-12 border border-white/10 shadow-2xl bg-[#090a18] group">
      
      {/* 🌌 Background Banner with Ambient Blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={banner}
          alt={title}
          className="w-full h-full object-cover object-center filter blur-lg scale-110 opacity-30 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050716] via-[#050716]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-transparent" />
      </div>

      {/* 🌟 Spotlight Content Container */}
      <div className="relative z-10 p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center md:items-stretch gap-8 min-h-[360px] md:min-h-[420px]">
        
        {/* Floating Poster */}
        <div className="w-[180px] sm:w-[220px] md:w-[240px] aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden border border-white/15 shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative group-hover:scale-[1.02] transition-transform duration-500 bg-[#121326]">
          <img
            src={current.coverImage.extraLarge || current.coverImage.large}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2.5 left-2.5 bg-[#ff4dd2] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
            {format}
          </div>
        </div>

        {/* Info Column */}
        <div className="flex flex-col justify-between flex-1 text-center md:text-left min-w-0">
          <div>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <span className="bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Sparkles size={13} /> Spotlight #{activeIndex + 1}
              </span>
              <span className="bg-white/10 text-gray-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                {origin}
              </span>
              {current.status && (
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  {current.status}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-3 line-clamp-2">
              {title}
            </h2>

            {/* Metadata (Score, Chapters, Genres) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 text-xs sm:text-sm text-gray-300">
              {score && (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
                  <Star size={15} className="fill-amber-400" />
                  {score}
                </span>
              )}
              {current.chapters && (
                <span className="flex items-center gap-1.5 text-gray-300 font-medium bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                  <BookOpen size={14} className="text-[#ff4dd2]" />
                  {current.chapters} Chapters
                </span>
              )}
              {current.genres && current.genres.length > 0 && (
                <div className="hidden sm:flex flex-wrap gap-1.5">
                  {current.genres.slice(0, 3).map((g, idx) => (
                    <span key={idx} className="bg-white/5 text-gray-400 text-xs px-2 py-0.5 rounded border border-white/5">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description Snippet */}
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-6 max-w-2xl">
              {current.description?.replace(/<[^>]*>?/gm, '') || 'Discover this popular title on Anime Nation India.'}
            </p>
          </div>

          {/* Action Button & Carousel Dots */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Link
              href={`/manga/${current.id}`}
              className="inline-flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-[#050716] font-black px-6 py-3 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(255,77,210,0.4)] hover:shadow-[0_4px_30px_rgba(255,77,210,0.6)] cursor-pointer hover:scale-105"
            >
              Read Details <ChevronRight size={16} />
            </Link>

            {/* Selector Thumbnails / Dots */}
            <div className="flex items-center gap-2">
              {spotlights.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === idx ? 'w-8 bg-[#ff4dd2] shadow-[0_0_10px_rgba(255,77,210,0.8)]' : 'w-2.5 bg-white/20 hover:bg-white/50'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
