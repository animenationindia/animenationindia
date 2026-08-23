'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Star, 
  Radio, 
  ExternalLink, 
  Music, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Info,
  CheckCircle2,
  Plus,
  Minus
} from 'lucide-react';
import ReadMoreText from './ReadMoreText';
import AnimeThemeSongs from './AnimeThemeSongs';
import { NormalizedTheme } from '../lib/animethemes-api';

interface AnimeOverviewTabProps {
  anime: any;
  extraInfo?: any;
  characters?: any[];
  themes?: NormalizedTheme[];
}

export default function AnimeOverviewTab({ anime, extraInfo, characters = [], themes = [] }: AnimeOverviewTabProps) {
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [progressEp, setProgressEp] = useState(1);

  const synopsis = anime.synopsis || extraInfo?.description || 'No detailed synopsis available.';
  const trailerId = anime.trailer?.youtube_id || extraInfo?.trailer?.id;
  const englishTitle = anime.title_english || anime.title || 'Anime';

  // Sidebar info
  const nextAiring = extraInfo?.nextAiringEpisode;
  const score = anime.score || (extraInfo?.averageScore ? (extraInfo.averageScore / 10).toFixed(2) : 'N/A');
  const ranked = anime.rank ? `#${anime.rank}` : 'N/A';
  const popularity = anime.popularity ? `#${anime.popularity.toLocaleString()}` : (extraInfo?.popularity ? `#${extraInfo.popularity}` : 'N/A');
  const members = anime.members ? anime.members.toLocaleString() : 'N/A';
  const type = anime.type || extraInfo?.format || 'TV';
  const episodes = anime.episodes || extraInfo?.episodes || '?';
  const duration = anime.duration || (extraInfo?.duration ? `${extraInfo.duration} min` : '24 min');
  const status = anime.status || (extraInfo?.status === 'RELEASING' ? 'Currently Airing' : 'Finished Airing');
  const aired = anime.aired?.string || (extraInfo?.seasonYear ? `${extraInfo.seasonYear}` : 'N/A');
  const season = anime.season ? `${anime.season} ${anime.year || ''}` : (extraInfo?.seasonYear ? `${extraInfo.seasonYear}` : 'N/A');
  const studio = anime.studios?.[0]?.name || extraInfo?.studios?.nodes?.[0]?.name || 'N/A';
  const ratingAge = anime.rating || 'PG-13 - Teens 13 or older';
  const broadcast = anime.broadcast?.string || 'N/A';
  const favorites = anime.favorites ? anime.favorites.toLocaleString() : 'N/A';

  // Fallback theme text from Jikan
  const openings = anime.theme?.openings || [];
  const endings = anime.theme?.endings || [];

  const displayCharacters = showAllCharacters ? characters : characters.slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
      
      {/* 👈 Left Column: Main Content (Synopsis, Trailer, AnimeThemes, Characters) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* 📖 Synopsis Card */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-7 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full"></span> Synopsis
          </h3>
          <ReadMoreText text={synopsis} maxChars={360} />
          <p className="text-[11px] text-gray-500 mt-3 font-semibold">
            Source: MyAnimeList / AniList
          </p>
        </div>

        {/* 🎥 Official Trailer Player */}
        {trailerId && (
          <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-red-500 rounded-full"></span> Official Trailer
            </h3>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerId}?rel=0`}
                title="Anime Official Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        {/* 🎵 AnimeThemes.moe Playable OP/ED Section */}
        {themes.length > 0 && (
          <AnimeThemeSongs themes={themes} animeTitle={englishTitle} />
        )}

        {/* 👥 Main Characters & Japanese Voice Actors */}
        {characters.length > 0 && (
          <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full"></span> Main Characters & Voice Actors
              </h3>
              {characters.length > 6 && (
                <button
                  onClick={() => setShowAllCharacters(!showAllCharacters)}
                  className="text-xs font-bold text-[#ff4dd2] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {showAllCharacters ? (
                    <>Show Less <ChevronUp size={14} /></>
                  ) : (
                    <>View All ({characters.length}) <ChevronDown size={14} /></>
                  )}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {displayCharacters.map((c: any, index: number) => {
                const charId = c.character?.mal_id || c.character?.id;
                const charName = c.character?.name || 'Character';
                const charImage = c.character?.images?.webp?.image_url || c.character?.images?.jpg?.image_url || '/placeholder.png';
                
                const japaneseVA = c.voice_actors?.find((va: any) => va.language === 'Japanese') || c.voice_actors?.[0];
                const vaId = japaneseVA?.person?.mal_id || japaneseVA?.person?.id;
                const vaName = japaneseVA?.person?.name;
                const vaImage = japaneseVA?.person?.images?.jpg?.image_url;

                return (
                  <div
                    key={charId || index}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
                  >
                    {/* Character Column */}
                    <Link
                      href={charId ? `/character/${charId}` : '#'}
                      className="flex items-center gap-3 min-w-0 flex-1 group/char"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#121326]">
                        <img
                          src={charImage}
                          alt={charName}
                          className="w-full h-full object-cover group-hover/char:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0 pr-1">
                        <p className="text-xs font-bold text-white truncate group-hover/char:text-[#ff4dd2] transition-colors">
                          {charName}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider block">
                          {c.role || 'Main'}
                        </span>
                      </div>
                    </Link>

                    {/* Japanese Voice Actor Column */}
                    {japaneseVA && (
                      <Link
                        href={vaId ? `/staff/${vaId}` : '#'}
                        className="flex items-center gap-2.5 text-right flex-shrink-0 pl-2 border-l border-white/5 group/va"
                      >
                        <div className="min-w-0 max-w-[80px]">
                          <p className="text-xs font-bold text-gray-300 truncate group-hover/va:text-[#ff4dd2] transition-colors">
                            {vaName}
                          </p>
                          <span className="text-[9px] text-[#ff4dd2] font-semibold block">
                            Japanese VA
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#121326] group-hover/va:border-[#ff4dd2]/50 transition-colors">
                          {vaImage ? (
                            <img
                              src={vaImage}
                              alt={vaName || 'Voice Actor'}
                              className="w-full h-full object-cover group-hover/va:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] text-gray-500">
                              VA
                            </div>
                          )}
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 👉 Right Column: Sidebar Widgets (Next Airing, Track Progress, Where to Watch, Theme Songs, Stats Info) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* 🔴 Next Airing Episode Banner */}
        {nextAiring && (
          <div className="bg-gradient-to-r from-rose-950/40 via-[#150a1b] to-black/60 border border-rose-500/30 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-extrabold uppercase tracking-wider mb-1">
              <Radio size={14} className="animate-pulse" />
              <span>Next Airing Episode</span>
            </div>
            <h4 className="text-base font-bold text-white">
              Episode {nextAiring.episode}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(nextAiring.airingAt * 1000).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* 📊 Track Progress Card */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full"></span> Track Progress
          </h4>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-3 mb-3">
            <span className="text-xs text-gray-300 font-semibold">Watched Episode</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setProgressEp(Math.max(1, progressEp - 1))}
                className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-extrabold text-white w-10 text-center">
                {progressEp} {episodes !== '?' ? `/ ${episodes}` : ''}
              </span>
              <button
                onClick={() => setProgressEp(progressEp + 1)}
                className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <Link
            href={`/watch/${anime.mal_id || anime.id}?ep=${progressEp}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold text-xs transition-all shadow-md shadow-[#ff4dd2]/20"
          >
            <Play size={14} className="fill-black" /> Continue Episode {progressEp}
          </Link>
        </div>

        {/* 📺 Where to Watch Widget */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-500 rounded-full"></span> Where to Watch
            </h4>
            <span className="text-[10px] text-gray-500">Official / Streaming</span>
          </div>

          <div className="space-y-2">
            <a
              href="https://www.crunchyroll.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-[#ff6400]/10 border border-[#ff6400]/30 hover:border-[#ff6400]/60 text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ff6400] flex items-center justify-center text-black font-black text-xs">
                  CR
                </div>
                <span className="text-xs font-bold">Crunchyroll</span>
              </div>
              <ExternalLink size={14} className="text-gray-400 group-hover:text-white transition-colors" />
            </a>

            <Link
              href={`/watch/${anime.mal_id || anime.id}?ep=1`}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 hover:border-[#ff4dd2]/60 text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ff4dd2] flex items-center justify-center text-black font-black text-xs">
                  AN
                </div>
                <span className="text-xs font-bold">Anime Nation HD Player</span>
              </div>
              <Play size={14} className="text-gray-400 group-hover:text-white transition-colors fill-current" />
            </Link>
          </div>
        </div>

        {/* 📋 Stats Box Grid & Details Information Table */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info size={14} className="text-indigo-400" /> Anime Information
          </h4>

          {/* Quick 4 Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Score</span>
              <span className="text-base font-extrabold text-amber-400">⭐ {score}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Ranked</span>
              <span className="text-base font-extrabold text-white">{ranked}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Popularity</span>
              <span className="text-base font-extrabold text-white">{popularity}</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5">
              <span className="text-[10px] text-gray-400 font-bold uppercase block">Members</span>
              <span className="text-base font-extrabold text-white">{members}</span>
            </div>
          </div>

          {/* Detailed Info Rows */}
          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Type</span>
              <span className="text-white font-bold">{type}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Episodes</span>
              <span className="text-white font-bold">{episodes}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Duration</span>
              <span className="text-white font-bold">{duration}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Status</span>
              <span className="text-white font-bold">{status}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Aired</span>
              <span className="text-white font-bold truncate max-w-[180px] text-right">{aired}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Season</span>
              <span className="text-white font-bold capitalize">{season}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Studio</span>
              <span className="text-white font-bold">{studio}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Rating</span>
              <span className="text-white font-bold truncate max-w-[180px] text-right">{ratingAge}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Favorites</span>
              <span className="text-white font-bold">{favorites}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
