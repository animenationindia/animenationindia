'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Bookmark, Check, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { sanitizeDescription } from '../lib/sanitize';
import { useWatchlist } from '../hooks/useWatchlist';

interface AnimeCardProps {
  anime: {
    id: number;
    idMal?: number | null;
    title?: {
      english?: string | null;
      romaji?: string | null;
    } | null;
    averageScore?: number | null;
    seasonYear?: number | null;
    startDate?: {
      year?: number | null;
    } | null;
    type?: string | null;
    format?: string | null;
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
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const title = anime.title?.english || anime.title?.romaji || 'Unknown Title';
  const linkId = anime.idMal || anime.id;
  const year = anime.seasonYear || (anime.startDate ? anime.startDate.year : null);
  const format = anime.format ? anime.format.replace('_', ' ') : 'TV';
  const coverImage = anime.coverImage?.extraLarge || anime.coverImage?.large || '';
  const description = sanitizeDescription(anime.description);
  
  const isActuallyManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL' || anime.format === 'ONE_SHOT' || isManga;
  const isSaved = isInWatchlist(linkId);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
      alert("Please login first to save anime to your Watchlist!");
      router.push('/auth');
      return;
    }

    await toggleWatchlist({
      animeId: linkId,
      title,
      image: coverImage,
    });
  };

  if (!isMounted) return null;

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative w-full mb-4 flex flex-col bg-transparent cv-auto gpu-accelerate"
    >
      {/* 🖼️ Image & Overlay Container */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#050716] rounded-lg border border-[#ff4dd2]/20 group-hover:border-[#ff4dd2]/50 group-hover:shadow-[0_0_20px_rgba(255,77,210,0.4)] transition-all duration-300">
        
        {/* Link wraps image and hover overlay */}
        <Link href={isActuallyManga ? `/manga/${linkId}` : `/series/${linkId}`} prefetch={false} className="block w-full h-full relative z-10">
          {coverImage && (
            <Image 
              src={coverImage} 
              alt={title} 
              fill
              priority={priority}
              quality={90}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}

          {anime.badgeText && (
            <div className="absolute top-0 left-0 bg-[#000000]/80 px-2 py-1 text-[10px] font-bold text-[#a0a0a0] uppercase tracking-wider z-20 rounded-br-lg border-b border-r border-[#2A2B30]/50 shadow-md">
              {anime.badgeText}
            </div>
          )}

          {/* 🌟 Deep Space Neon Hover Overlay */}
          <div className="absolute inset-0 bg-[#121326]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2 md:p-3 backdrop-blur-[2px]">
            
            {/* Empty space at top so the play button stays centered */}
            <div className="flex justify-end h-8 md:h-10"></div>

            {/* Center: Play / Read Button */}
            <div className="flex flex-col items-center justify-center flex-1 gap-2">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 border-[#ff4dd2] bg-[#050716]/60 text-[#ff4dd2] hover:bg-[#ff4dd2] hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,77,210,0.5)] group-hover:scale-110">
                {isActuallyManga ? (
                  <BookOpen size={24} className="stroke-[2.5px]" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </div>
              <span className="text-[11px] md:text-xs font-bold text-[#ff4dd2] uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255,77,210,0.5)]">
                {isActuallyManga ? "READ NOW" : "WATCH NOW"}
              </span>
            </div>

            {/* Bottom: Synopsis snippet or tags */}
            <div className="text-white relative z-10">
              {description ? (
                <p className="text-[11px] md:text-xs leading-tight line-clamp-3 text-gray-300 drop-shadow-md">
                  {description}
                </p>
              ) : (
                <p className="text-xs font-bold text-[#ff4dd2] uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255,77,210,0.5)]">{isManga ? "Read Now" : "Watch Now"}</p>
              )}
            </div>
            
            {/* Bottom Gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#050716] to-transparent pointer-events-none"></div>

          </div>
        </Link>

        {/* Top Right: Watchlist Button (Positioned above Link with z-30) */}
        <div className={`absolute top-2 right-2 md:top-3 md:right-3 z-30 transition-opacity duration-300 ${isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            type="button"
            onClick={toggleSave}
            className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-colors backdrop-blur-md shadow-[0_0_10px_rgba(255,77,210,0.3)] hover:shadow-[0_0_15px_rgba(255,77,210,0.8)] cursor-pointer ${
              isSaved 
                ? 'bg-[#ff4dd2] text-white border border-transparent' 
                : 'bg-[#050716]/80 hover:bg-[#ff4dd2] text-white border border-[#ff4dd2]/50'
            }`}
          >
            {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
          </button>
        </div>

      </div>

      {/* 📝 Text Information below card */}
      <Link href={isActuallyManga ? `/manga/${linkId}` : `/series/${linkId}`} prefetch={false} className="mt-3 flex flex-col px-1 block">
        <h3 className="text-white text-[14px] font-semibold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
          {title}
        </h3>
        <div className="text-[12px] text-[#ff4dd2] mt-1 flex items-center gap-1 font-medium capitalize opacity-80">
          {format.toLowerCase()} {year && <span className="text-[#a0a0a0]">• {year}</span>}
        </div>
      </Link>
    </motion.div>
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