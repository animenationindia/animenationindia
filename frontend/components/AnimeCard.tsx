'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Bookmark, Check, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../lib/config';

let watchlistCache: any[] | null = null;
let watchlistCachePromise: Promise<any[]> | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('auth-change', () => {
    watchlistCache = null;
    watchlistCachePromise = null;
  });
}

import { motion } from 'framer-motion';

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

export default function AnimeCard({ anime, priority = false, isManga = false }: AnimeCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  const title = anime.title?.english || anime.title?.romaji || 'Unknown Title';
  const linkId = anime.idMal || anime.id;
  const year = anime.seasonYear || (anime.startDate ? anime.startDate.year : null);
  const format = anime.format ? anime.format.replace('_', ' ') : 'TV';
  const coverImage = anime.coverImage?.large || '';
  const description = anime.description?.replace(/<[^>]+>/g, '') || '';
  
  const isActuallyManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL' || anime.format === 'ONE_SHOT' || isManga;

  // Hydration checks and Real-time saved status fetching
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));

    const checkWatchlistStatus = async () => {
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');
      if (!token || !userId) return;

      try {
        if (!watchlistCache && !watchlistCachePromise) {
          watchlistCachePromise = fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          }).then(res => res.ok ? res.json() : []).then(data => {
            watchlistCache = data;
            return data;
          }).catch(() => []);
        }
        
        const list = (watchlistCache || await watchlistCachePromise) || [];
        const exists = list.some((item: any) => Number(item.mal_id || item.anime_id) === Number(linkId));
        if (exists) setIsSaved(true);
      } catch {
        // ignore silent fail
      }
    };
    checkWatchlistStatus();

    return () => cancelAnimationFrame(frame);
  }, [linkId]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    
    if (!token || !userId) {
      alert("Please login first to save anime to your Watchlist!");
      router.push('/auth');
      return;
    }

    const newState = !isSaved;
    setIsSaved(newState);

    try {
      if (newState) {
        const animePayload = {
          mal_id: Number(linkId),
          title: title,
          title_english: title,
          type: isActuallyManga ? 'Manga' : 'Anime',
          images: {
            webp: {
              large_image_url: coverImage
            }
          },
          score: anime.averageScore ? (anime.averageScore / 10) : null,
          episodes: null,
          anime_id: Number(linkId),
          anime_title: title,
          anime_image: coverImage,
          status: 'PLAN_TO_WATCH'
        };

        const res = await fetch(`${BACKEND_URL}/api/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ anime: animePayload, userId })
        });
        
        if (!res.ok) throw new Error('Failed to save');
        
        if (watchlistCache) {
          watchlistCache.push(animePayload);
        }
      } else {
        const res = await fetch(`${BACKEND_URL}/api/watchlist/${userId}/${linkId}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (!res.ok) throw new Error('Failed to delete');

        if (watchlistCache) {
          watchlistCache = watchlistCache.filter((item: any) => Number(item.mal_id || item.anime_id) !== Number(linkId));
        }
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
      setIsSaved(!newState); // Rollback on failure
    }
  };

  if (!isMounted) return null;

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative w-full mb-4 flex flex-col cursor-pointer bg-transparent"
    >
      <Link href={isActuallyManga ? `/manga/${linkId}` : `/series/${linkId}`} className="block w-full h-full relative">
        
        {/* 🖼️ Image Container */}
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#050716] rounded-lg border border-[#ff4dd2]/20 group-hover:border-[#ffd54a]/50 group-hover:shadow-[0_0_20px_rgba(255, 213, 74,0.4)] transition-all duration-300">
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
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 border-[#ffd54a] bg-[#050716]/60 text-[#ffd54a] hover:bg-[#ffd54a] hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(255, 213, 74,0.5)] group-hover:scale-110">
                {isActuallyManga ? (
                  <BookOpen size={24} className="stroke-[2.5px]" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </div>
              <span className="text-[11px] md:text-xs font-bold text-[#ffd54a] uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255, 213, 74,0.5)]">
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
                <p className="text-xs font-bold text-[#ffd54a] uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255, 213, 74,0.5)]">{isManga ? "Read Now" : "Watch Now"}</p>
              )}
            </div>
            
            {/* Bottom Gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#050716] to-transparent pointer-events-none"></div>

          </div>

          {/* Top Right: Watchlist Button (Moved outside hover overlay to be permanent when saved) */}
          <div className={`absolute top-2 right-2 md:top-3 md:right-3 z-30 transition-opacity duration-300 ${isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button 
              onClick={toggleSave}
              className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-colors backdrop-blur-md shadow-[0_0_10px_rgba(255, 77, 210,0.3)] hover:shadow-[0_0_15px_rgba(255, 77, 210,0.8)] ${
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
        <div className="mt-3 flex flex-col px-1">
          <h3 className="text-white text-[14px] font-semibold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]">
            {title}
          </h3>
          <div className="text-[12px] text-[#ffd54a] mt-1 flex items-center gap-1 font-medium capitalize opacity-80">
            {format.toLowerCase()} {year && <span className="text-[#a0a0a0]">• {year}</span>}
          </div>
        </div>

      </Link>
    </motion.div>
  );
}