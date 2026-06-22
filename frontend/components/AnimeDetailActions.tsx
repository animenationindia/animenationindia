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
      <div className="mt-6 space-y-3 relative w-full">
        {/* 1. Watchlist Selector Dropdown */}
        <WatchlistDropdown 
          animeId={animeId} 
          title={animeTitle} 
          image={animeImage} 
        />
        
        {/* 2. Flat "Watch Episode 1" button */}
        <Link
          href={`/watch/${animeId}`}
          className="w-full flex items-center justify-center gap-2 bg-neon-cyan hover:bg-neon-cyan/80 text-[#000000] py-3 rounded-sm font-bold cursor-pointer transition-colors uppercase tracking-wider"
        >
          <Play size={20} fill="currentColor" className="text-[#000000]" />
          Watch Episode 1
        </Link>

        {/* 3. Trailer Button */}
        {trailerUrl && (
          <button 
            onClick={() => setIsTrailerOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#141519] hover:bg-gray-800 text-white py-3 rounded-sm font-semibold border border-gray-800 transition-colors uppercase tracking-wider"
          >
            <Film size={18} />
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
