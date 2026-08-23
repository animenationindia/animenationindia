'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';

interface MangaDetailActionsProps {
  mangaId: number | string;
  mangaTitle: string;
  mangaImage: string;
}

export default function MangaDetailActions({
  mangaId,
  mangaTitle,
  mangaImage,
}: MangaDetailActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: mangaTitle,
          text: `Check out ${mangaTitle} on Anime Nation India!`,
          url: url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="mt-6 flex flex-col gap-3 w-full">
      {/* 1. Watchlist Selector Dropdown */}
      <WatchlistDropdown 
        animeId={mangaId} 
        title={mangaTitle} 
        image={mangaImage} 
        type="Manga"
      />

      {/* 2. Action Buttons Row (Share) */}
      <div className="flex gap-2.5 w-full">
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl font-bold text-xs border border-white/10 hover:border-white/20 transition-all duration-300 uppercase tracking-wider backdrop-blur-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
        >
          {copied ? (
            <span className="text-emerald-400 font-extrabold flex items-center gap-1.5 animate-pulse">
              <Check size={16} /> Copied Link!
            </span>
          ) : (
            <>
              <Share2 size={16} className="text-[#ff4dd2]" />
              Share Manga
            </>
          )}
        </button>
      </div>
    </div>
  );
}
