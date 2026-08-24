'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Search, Calendar, Film, Clock, Eye } from 'lucide-react';
import { TMDBEpisode } from '../lib/tmdb-api';

interface AnimeEpisodesTabProps {
  animeId: number;
  episodes: any[];
  totalCount?: number;
  tmdbEpisodes?: TMDBEpisode[];
  posterFallback?: string;
}

export default function AnimeEpisodesTab({
  animeId,
  episodes,
  totalCount = 12,
  tmdbEpisodes = [],
  posterFallback = '/placeholder-poster.png'
}: AnimeEpisodesTabProps) {
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
          <p className="text-xs text-gray-400 mt-1">Select an episode to watch in HD with Sub / Dub & TMDB Still Previews</p>
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

      {/* Episodes Grid with HD Screencaps */}
      {filteredEpisodes.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No episodes found matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEpisodes.map((ep: any, index: number) => {
            const epNum = ep.mal_id || index + 1;
            const tmdbEp = tmdbEpisodes.find((t) => t.episodeNumber === epNum);
            const epTitle = tmdbEp?.name || ep.title || `Episode ${epNum}`;
            const epAired = tmdbEp?.airDate || (ep.aired ? new Date(ep.aired).toLocaleDateString() : null);
            const stillImage = tmdbEp?.stillUrl || ep.images?.jpg?.image_url || posterFallback;
            const runtime = tmdbEp?.runtime ? `${tmdbEp.runtime}m` : null;

            return (
              <Link
                key={epNum}
                href={`/watch/${animeId}?ep=${epNum}`}
                className="group flex flex-col rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/5 overflow-hidden transition-all duration-300 shadow-md"
              >
                {/* 16:9 HD Screencap Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-[#121326]">
                  <img
                    src={stillImage}
                    alt={epTitle}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Episode Number Pill */}
                  <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-md border border-white/15 text-[#ff4dd2] text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                    EP {epNum}
                  </span>

                  {/* Runtime */}
                  {runtime && (
                    <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-md border border-white/15 text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                      {runtime}
                    </span>
                  )}

                  {/* Play Button Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-[#ff4dd2] text-black flex items-center justify-center shadow-lg shadow-[#ff4dd2]/50 transform group-hover:scale-110 transition-transform">
                      <Play size={16} className="fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff4dd2] transition-colors">
                      {epTitle}
                    </h4>
                    {tmdbEp?.overview && (
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {tmdbEp.overview}
                      </p>
                    )}
                  </div>

                  {epAired && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2 pt-2 border-t border-white/5">
                      <Calendar size={10} className="text-indigo-400" />
                      <span>{epAired}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
