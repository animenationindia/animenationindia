'use client';

import { useState } from 'react';
import { Play, Film, X } from 'lucide-react';
import Link from 'next/link';
import WatchlistDropdown from './WatchlistDropdown';

interface AnimeDetailActionsProps {
  animeId: number;
  animeTitle: string;
  animeImage: string;
  trailerUrl: string | null;
}

export default function AnimeDetailActions({
  animeId,
  animeTitle,
  animeImage,
  trailerUrl,
}: AnimeDetailActionsProps) {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: animeTitle,
          text: `Check out ${animeTitle} on Anime Nation India!`,
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
    <>
      <div className="mt-6 flex flex-col gap-3 w-full">
        {/* 1. Watchlist Selector Dropdown */}
        <WatchlistDropdown 
          animeId={animeId} 
          title={animeTitle} 
          image={animeImage} 
        />
        
        {/* 2. Primary Watch Episode 1 Button */}
        <Link
          href={`/watch/${animeId}`}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#ff0055] via-[#ff0000] to-[#ff3366] hover:from-[#e6004c] hover:to-[#e60000] text-white py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(255,0,85,0.4)] hover:shadow-[0_4px_35px_rgba(255,0,85,0.6)] cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Play size={18} fill="currentColor" />
          Watch Episode 1
        </Link>

        {/* 3. Action Buttons Row (Trailer & Share) */}
        <div className="flex gap-2.5 w-full">
          {trailerUrl && (
            <button 
              onClick={() => setIsTrailerOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl font-bold text-xs border border-white/10 hover:border-white/20 transition-all duration-300 uppercase tracking-wider backdrop-blur-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Film size={16} className="text-[#ff4dd2]" />
              Trailer
            </button>
          )}
          
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl font-bold text-xs border border-white/10 hover:border-white/20 transition-all duration-300 uppercase tracking-wider backdrop-blur-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {copied ? (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1.5 animate-pulse">
                ✓ Copied!
              </span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff4dd2]"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share
              </>
            )}
          </button>
        </div>
      </div>

      {/* Trailer Modal Overlay */}
      {isTrailerOpen && trailerUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-sm transition-opacity" onClick={() => setIsTrailerOpen(false)}>
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden border border-[#2A2B30] shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 z-10 bg-black/60 p-2 rounded-full text-white hover:bg-neon-cyan hover:text-black transition-all"
            >
              <X size={24} />
            </button>
            <iframe 
              src={trailerUrl + (trailerUrl.includes('?') ? '&autoplay=1' : '?autoplay=1')}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}
