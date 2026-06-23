'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, PlaySquare } from 'lucide-react';

interface EpisodeData {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage?: {
    large?: string;
  };
  airingEpisode?: number;
  airingAt?: number;
  format?: string;
}

export default function NewEpisodesList({ episodes }: { episodes: EpisodeData[] }) {
  const [showCount, setShowCount] = useState(12); // Show 12 by default (4 rows of 3)

  // Format timestamp to 12-hour time
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'TBA';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const visibleEpisodes = episodes.slice(0, showCount);
  const hasMore = showCount < episodes.length;

  if (!episodes || episodes.length === 0) return null;

  return (
    <div className="w-full mb-12">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <PlaySquare className="text-white" size={28} />
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
            New Episodes
          </h2>
        </div>
        <Link href="/schedule" className="hidden md:flex items-center gap-1 text-xs md:text-sm font-semibold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
          View Release Calendar <ChevronRight size={16} />
        </Link>
      </div>

      {/* Subheader */}
      <h3 className="text-lg md:text-xl font-bold text-white mb-6">Today</h3>

      {/* Grid of List Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {visibleEpisodes.map((ep, idx) => {
          const title = ep.title.english || ep.title.romaji;
          const isDub = title.toLowerCase().includes('dub');
          const formattedTitle = isDub ? title : `(Sub) ${title}`;
          const type = ep.format === 'TV' ? 'Sub | Dub' : 'Subtitled';

          return (
            <Link 
              href={`/series/${ep.idMal || ep.id}`} 
              key={`${ep.id}-${idx}`}
              className="flex items-center gap-4 group p-2 rounded hover:bg-white/5 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative w-32 h-20 md:w-36 md:h-20 shrink-0 rounded overflow-hidden shadow-lg border border-gray-800">
                <Image 
                  src={ep.coverImage?.large || '/placeholder.png'} 
                  alt={title} 
                  fill 
                  sizes="(max-width: 768px) 150px, 150px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-orange-500/80 flex items-center justify-center pl-1">
                    <PlaySquare size={16} className="text-white" />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col justify-between h-full py-1 flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-200 group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                  {formattedTitle}
                </h4>
                <div className="mt-auto flex justify-between items-end">
                  <div className="flex flex-col text-xs text-gray-400 mt-2">
                    {ep.airingEpisode ? `Episode ${ep.airingEpisode}` : 'Latest Episode'}
                    <span className="text-gray-500 mt-0.5">{type}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#ff4dd2]">
                    {formatTime(ep.airingAt)}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <button 
          onClick={() => setShowCount(prev => prev + 12)}
          className="w-full mt-6 py-3 bg-[#1A1A24] hover:bg-[#252533] text-gray-300 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors rounded shadow"
        >
          Show More
        </button>
      )}

      {/* Bottom Release Calendar Banner */}
      <Link href="/schedule" className="block w-full mt-6 py-4 bg-[#1e293b] hover:bg-[#334155] border border-gray-700 text-center text-gray-200 hover:text-white text-xs md:text-sm font-bold uppercase tracking-widest transition-colors rounded shadow-lg">
        View Release Calendar
      </Link>
    </div>
  );
}
