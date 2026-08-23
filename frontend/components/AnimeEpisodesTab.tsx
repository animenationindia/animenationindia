'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Search, Calendar, Star, Film } from 'lucide-react';

interface AnimeEpisodesTabProps {
  animeId: number;
  episodes: any[];
  totalCount?: number;
}

export default function AnimeEpisodesTab({ animeId, episodes, totalCount = 12 }: AnimeEpisodesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const episodeList = episodes.length > 0
    ? episodes
    : Array.from({ length: totalCount }).map((_, i) => ({
        mal_id: i + 1,
        title: `Episode ${i + 1}`,
        score: null,
      }));

  const filteredEpisodes = episodeList.filter((ep) => {
    const title = ep.title || `Episode ${ep.mal_id}`;
    const num = String(ep.mal_id);
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || num.includes(searchQuery);
  });

  return (
    <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Film size={20} className="text-[#ff4dd2]" /> All Episodes ({episodeList.length})
          </h3>
          <p className="text-xs text-gray-400 mt-1">Select an episode to watch in HD with Sub / Dub</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search episode or #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2]"
          />
        </div>
      </div>

      {/* Episodes Grid */}
      {filteredEpisodes.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No episodes found matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEpisodes.map((ep: any, index: number) => {
            const epNum = ep.mal_id || index + 1;
            const epTitle = ep.title || `Episode ${epNum}`;
            const epAired = ep.aired ? new Date(ep.aired).toLocaleDateString() : null;

            return (
              <Link
                key={epNum}
                href={`/watch/${animeId}?ep=${epNum}`}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/5 transition-all duration-300 shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center font-black text-xs text-[#ff4dd2] group-hover:scale-105 group-hover:border-[#ff4dd2] transition-all flex-shrink-0">
                    {epNum}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-[#ff4dd2] transition-colors">
                      {epTitle}
                    </h4>
                    {epAired && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} /> {epAired}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#ff4dd2] text-gray-400 group-hover:text-black flex items-center justify-center transition-all flex-shrink-0 shadow-sm">
                  <Play size={12} className="fill-current ml-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
