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
          className="w-full flex items-center justify-center gap-2.5 bg-[#ff0000] hover:bg-[#cc0000] text-white py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(255,0,0,0.4)] hover:shadow-[0_4px_30px_rgba(255,0,0,0.6)] cursor-pointer transition-all duration-300"
        >
          <Play size={18} fill="currentColor" />
          Watch Episode 1
        </Link>

        {/* 3. Trailer Button */}
        {trailerUrl && (
          <button 
            onClick={() => setIsTrailerOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 px-6 rounded-xl font-bold text-sm border border-white/10 hover:border-white/20 transition-all duration-300 uppercase tracking-wider backdrop-blur-md cursor-pointer"
          >
            <Film size={18} className="text-[#ff4dd2]" />
            Watch Trailer
          </button>
        )}
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
