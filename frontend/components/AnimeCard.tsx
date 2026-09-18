/* eslint-disable @next/next/no-img-element */
'use client';

import { memo } from 'react';
import Link from 'next/link';
import { toEnglishTitle } from '../lib/titleCleaner';

interface AnimeCardProps {
  anime: {
    id: number | string;
    idMal?: number | null;
    title?: {
      english?: string | null;
      romaji?: string | null;
    } | string | null;
    averageScore?: number | null;
    seasonYear?: number | null;
    startDate?: {
      year?: number | null;
    } | null;
    type?: string | null;
    format?: string | null;
    countryOfOrigin?: string | null;
    coverImage?: {
      extraLarge?: string | null;
      large?: string | null;
    } | null;
    description?: string | null;
    status?: string | null;
    genres?: string[] | null;
    badgeText?: string;
  };
  priority?: boolean;
  isManga?: boolean;
}

function AnimeCard({ anime, priority = false, isManga = false }: AnimeCardProps) {
  const rawTitle = typeof anime.title === 'string' ? anime.title : (anime.title?.english || anime.title?.romaji || '');
  const title = toEnglishTitle(rawTitle, 'Unknown Title');
  const linkId = anime.idMal 
    ? anime.idMal 
    : (typeof anime.id === 'string' && anime.id.startsWith('al-')
        ? anime.id
        : (typeof anime.id === 'number' && anime.id > 65000 ? `al-${anime.id}` : anime.id));
  const year = anime.seasonYear || (anime.startDate ? anime.startDate.year : null);
  const coverImage = anime.coverImage?.extraLarge || anime.coverImage?.large || '';
  
  const origin = (anime.countryOfOrigin || '').toUpperCase();
  const rawFormat = (anime.format || '').replace(/_/g, ' ').toUpperCase();
  const rawType = (anime.type || '').toUpperCase();

  const isActuallyManga = rawType === 'MANGA' || 
    rawType === 'MANHWA' || 
    rawType === 'MANHUA' || 
    rawType === 'NOVEL' || 
    rawFormat === 'MANGA' || 
    rawFormat === 'MANHWA' || 
    rawFormat === 'MANHUA' || 
    rawFormat === 'NOVEL' || 
    rawFormat === 'LIGHT NOVEL' || 
    rawFormat === 'ONE SHOT' || 
    rawFormat === 'ONE-SHOT' || 
    isManga;

  let displayFormat = rawFormat || (isActuallyManga ? 'MANGA' : 'TV');

  if (origin === 'KR' || rawFormat === 'MANHWA' || rawType === 'MANHWA') {
    displayFormat = 'MANHWA';
  } else if (origin === 'CN' || rawFormat === 'MANHUA' || rawType === 'MANHUA') {
    displayFormat = 'MANHUA';
  } else if (rawFormat === 'NOVEL' || rawFormat === 'LIGHT NOVEL' || rawType === 'NOVEL') {
    displayFormat = 'LIGHT NOVEL';
  } else if (rawFormat === 'ONE SHOT' || rawFormat === 'ONE-SHOT') {
    displayFormat = 'ONE-SHOT';
  } else if (isActuallyManga && (displayFormat === 'MANGA' || !displayFormat)) {
    displayFormat = 'MANGA';
  }

  const getFormatBadgeStyle = (fmt: string) => {
    switch (fmt) {
      case 'MANHWA':
        return 'text-emerald-400 font-extrabold';
      case 'MANHUA':
        return 'text-amber-400 font-extrabold';
      case 'LIGHT NOVEL':
        return 'text-purple-400 font-extrabold';
      case 'MANGA':
        return 'text-sky-400 font-extrabold';
      case 'ONE-SHOT':
        return 'text-rose-400 font-extrabold';
      default:
        return 'text-[#ff4dd2] font-bold';
    }
  };

  let targetHref = `/series/${linkId}`;
  if (isActuallyManga) {
    if (displayFormat === 'MANHWA') {
      targetHref = `/read/manhwa/${linkId}`;
    } else if (displayFormat === 'MANHUA') {
      targetHref = `/read/manhua/${linkId}`;
    } else if (displayFormat === 'LIGHT NOVEL' || rawFormat.includes('NOVEL')) {
      targetHref = `/read/novels/${linkId}`;
    } else {
      targetHref = `/read/manga/${linkId}`;
    }
  }

  return (
    <Link 
      href={targetHref} 
      prefetch={false}
      className="group relative w-full mb-4 flex flex-col bg-transparent cursor-pointer select-none touch-manipulation transition-transform duration-300 ease-out hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.97]"
    >
      {/* 🖼️ Poster Image Container (7media Smooth Card Style) */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#0a0b1c] rounded-xl sm:rounded-2xl border border-white/10 group-hover:border-[#ff4dd2]/60 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.85),0_0_22px_rgba(255,77,210,0.35)] transition-all duration-300">
        <img 
          src={coverImage || '/placeholder-poster.png'} 
          alt={title} 
          loading={priority ? "eager" : "lazy"}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('placeholder-poster.png')) {
              target.src = '/placeholder-poster.png';
            }
          }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108 group-hover:brightness-105"
        />

        {/* Subtle Ambient Bottom Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716]/80 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none" />

        {/* Floating Custom Badge (if available or category badge) */}
        {anime.badgeText ? (
          <div className="absolute top-2 left-2 bg-[#050716]/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-black text-gray-200 uppercase tracking-wider rounded-md border border-white/15 shadow-md z-20">
            {anime.badgeText}
          </div>
        ) : isActuallyManga && (displayFormat === 'MANHWA' || displayFormat === 'MANHUA' || displayFormat === 'LIGHT NOVEL') ? (
          <div className={`absolute top-2 left-2 backdrop-blur-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border shadow-md z-20 ${
            displayFormat === 'MANHWA' 
              ? 'bg-emerald-950/85 text-emerald-400 border-emerald-500/40' 
              : displayFormat === 'MANHUA' 
              ? 'bg-amber-950/85 text-amber-400 border-amber-500/40' 
              : 'bg-purple-950/85 text-purple-400 border-purple-500/40'
          }`}>
            {displayFormat}
          </div>
        ) : null}
      </div>

      {/* 📝 Clean Metadata & Title Below Poster */}
      <div className="mt-2.5 flex flex-col px-0.5">
        <h3 className="text-white text-[13.5px] sm:text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors duration-200">
          {title}
        </h3>
        <div className="text-[12px] text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
          <span className={`uppercase text-[11px] ${getFormatBadgeStyle(displayFormat)}`}>
            {displayFormat}
          </span>
          {year && <span className="text-gray-500">• {year}</span>}
          {typeof anime.averageScore === 'number' && !isNaN(anime.averageScore) && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-amber-400 font-bold text-[11px] flex items-center gap-0.5">
                ★ {(anime.averageScore / 10).toFixed(1)}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default memo(AnimeCard, (prev, next) => {
  return (
    prev.anime.id === next.anime.id &&
    prev.anime.averageScore === next.anime.averageScore &&
    prev.priority === next.priority &&
    prev.isManga === next.isManga
  );
});