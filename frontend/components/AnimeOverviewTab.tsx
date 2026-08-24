'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Star, 
  ExternalLink, 
  Users, 
  Info,
  CheckCircle2,
  Plus,
  Minus,
  Tv
} from 'lucide-react';
import ReadMoreText from './ReadMoreText';
import AnimeThemeSongs from './AnimeThemeSongs';
import { NormalizedTheme } from '../lib/animethemes-api';
import { TMDBAnimeData } from '../lib/tmdb-api';

interface AnimeOverviewTabProps {
  anime: any;
  extraInfo?: any;
  characters?: any[];
  themes?: NormalizedTheme[];
  tmdbData?: TMDBAnimeData | null;
}

function getStreamingSearchUrl(providerName: string, animeTitle: string): string {
  const p = providerName.toLowerCase();
  const encTitle = encodeURIComponent(animeTitle);
  if (p.includes('crunchyroll')) return `https://www.crunchyroll.com/search?q=${encTitle}`;
  if (p.includes('netflix')) return `https://www.netflix.com/search?q=${encTitle}`;
  if (p.includes('hotstar') || p.includes('disney')) return `https://www.hotstar.com/in/explore?search_query=${encTitle}`;
  if (p.includes('prime') || p.includes('amazon')) return `https://www.amazon.com/s?k=${encTitle}&i=instant-video`;
  if (p.includes('jio')) return `https://www.jiocinema.com/search/${encTitle}`;
  if (p.includes('hulu')) return `https://www.hulu.com/search?q=${encTitle}`;
  if (p.includes('bilibili')) return `https://www.bilibili.tv/en/search-result?q=${encTitle}`;
  if (p.includes('youtube')) return `https://www.youtube.com/results?search_query=${encTitle}+official+anime`;
  return `https://www.google.com/search?q=watch+${encTitle}+${encodeURIComponent(providerName)}`;
}

function getBrandColor(name: string): { bg: string; border: string; text: string; initialBg: string } {
  const lower = name.toLowerCase();
  if (lower.includes('crunchyroll')) return { bg: 'bg-[#ff6400]/10', border: 'border-[#ff6400]/40 hover:border-[#ff6400]/80', text: 'text-[#ff6400]', initialBg: 'bg-[#ff6400]' };
  if (lower.includes('netflix')) return { bg: 'bg-[#e50914]/10', border: 'border-[#e50914]/40 hover:border-[#e50914]/80', text: 'text-[#e50914]', initialBg: 'bg-[#e50914]' };
  if (lower.includes('hotstar') || lower.includes('disney')) return { bg: 'bg-[#113ccf]/15', border: 'border-[#113ccf]/50 hover:border-[#113ccf]/80', text: 'text-[#3880ff]', initialBg: 'bg-[#113ccf]' };
  if (lower.includes('prime') || lower.includes('amazon')) return { bg: 'bg-[#00a8e1]/10', border: 'border-[#00a8e1]/40 hover:border-[#00a8e1]/80', text: 'text-[#00a8e1]', initialBg: 'bg-[#00a8e1]' };
  if (lower.includes('jio')) return { bg: 'bg-[#990033]/15', border: 'border-[#990033]/50 hover:border-[#990033]/80', text: 'text-[#ff1a75]', initialBg: 'bg-[#990033]' };
  if (lower.includes('hulu')) return { bg: 'bg-[#1ce783]/10', border: 'border-[#1ce783]/40 hover:border-[#1ce783]/80', text: 'text-[#1ce783]', initialBg: 'bg-[#1ce783]' };
  if (lower.includes('bilibili')) return { bg: 'bg-[#00a1d6]/10', border: 'border-[#00a1d6]/40 hover:border-[#00a1d6]/80', text: 'text-[#00a1d6]', initialBg: 'bg-[#00a1d6]' };
  if (lower.includes('youtube') || lower.includes('muse') || lower.includes('ani-one')) return { bg: 'bg-[#ff0000]/10', border: 'border-[#ff0000]/40 hover:border-[#ff0000]/80', text: 'text-[#ff4d4d]', initialBg: 'bg-[#ff0000]' };
  return { bg: 'bg-white/5', border: 'border-white/10 hover:border-white/30', text: 'text-white', initialBg: 'bg-indigo-600' };
}

export default function AnimeOverviewTab({ anime, extraInfo, characters = [], themes = [], tmdbData = null }: AnimeOverviewTabProps) {
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [progressEp, setProgressEp] = useState(1);

  const synopsis = anime.synopsis || extraInfo?.description || 'No detailed synopsis available.';
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
  const favorites = anime.favorites ? anime.favorites.toLocaleString() : 'N/A';

  const displayCharacters = showAllCharacters ? characters : characters.slice(0, 6);

  // Dynamic real official streaming platforms from TMDB, AniList & Jikan
  const streamingPlatforms = useMemo(() => {
    const list: Array<{ name: string; url: string; logoUrl?: string; region: string }> = [];
    const seen = new Set<string>();

    // 1. TMDB Indian Watch Providers
    if (tmdbData?.watchProvidersIndia && Array.isArray(tmdbData.watchProvidersIndia)) {
      for (const p of tmdbData.watchProvidersIndia) {
        const key = p.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            name: p.name,
            url: getStreamingSearchUrl(p.name, englishTitle),
            logoUrl: p.logoUrl,
            region: '🇮🇳 India'
          });
        }
      }
    }

    // 2. AniList External Official Streaming Links
    if (Array.isArray(extraInfo?.externalLinks)) {
      for (const l of extraInfo.externalLinks) {
        const site = (l.site || '').toLowerCase();
        const isStream = l.type === 'STREAMING' || ['crunchyroll', 'netflix', 'hulu', 'disney', 'bilibili', 'youtube', 'hidive', 'iqiyi'].some(s => site.includes(s));
        if (isStream && !seen.has(site)) {
          seen.add(site);
          list.push({
            name: l.site,
            url: l.url,
            logoUrl: l.icon || undefined,
            region: 'Official'
          });
        }
      }
    }

    // 3. Jikan Streaming Links
    if (Array.isArray(anime?.streaming)) {
      for (const s of anime.streaming) {
        const key = (s.name || '').toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            name: s.name,
            url: s.url,
            region: 'Official'
          });
        }
      }
    }

    // 4. TMDB Global Watch Providers Fallback
    if (list.length === 0 && tmdbData?.watchProvidersGlobal) {
      for (const p of tmdbData.watchProvidersGlobal) {
        const key = p.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            name: p.name,
            url: getStreamingSearchUrl(p.name, englishTitle),
            logoUrl: p.logoUrl,
            region: '🌐 Global'
          });
        }
      }
    }

    // Fallback: If no streaming platforms returned from APIs, provide default official Crunchyroll
    if (list.length === 0) {
      list.push({
        name: 'Crunchyroll',
        url: getStreamingSearchUrl('Crunchyroll', englishTitle),
        region: 'Official'
      });
    }

    return list;
  }, [tmdbData, extraInfo, anime, englishTitle]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
      
      {/* 👈 Left Column: Main Content (Synopsis, AnimeThemes, Characters) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* 📖 Synopsis Card */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-7 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full"></span> Synopsis
          </h3>
          <ReadMoreText text={synopsis} maxChars={360} />
        </div>

        {/* 🎵 AnimeThemes.moe Playable OP/ED Section */}
        {themes.length > 0 && (
          <AnimeThemeSongs themes={themes} animeTitle={englishTitle} />
        )}

        {/* 👥 Characters & Cast Section */}
        {characters.length > 0 && (
          <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-[#ff4dd2]" />
                <h3 className="text-lg font-bold text-white">Characters & Voice Actors</h3>
              </div>
              {characters.length > 6 && (
                <button
                  onClick={() => setShowAllCharacters(!showAllCharacters)}
                  className="text-xs font-bold text-[#ff4dd2] hover:underline cursor-pointer"
                >
                  {showAllCharacters ? 'Show Less' : `View All (${characters.length})`}
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

      {/* 👉 Right Column: Sidebar Widgets (Next Airing, Where to Watch, Stats Info) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* ⏰ Next Episode Countdown Card */}
        {nextAiring && (
          <div className="bg-gradient-to-br from-[#ff4dd2]/20 via-[#0b0c20] to-[#0b0c20] border border-[#ff4dd2]/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ff4dd2] mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4dd2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4dd2]"></span>
              </span>
              Next Episode Airing
            </div>
            <h4 className="text-xl font-extrabold text-white mb-1">
              Episode {nextAiring.episode}
            </h4>
            <p className="text-xs text-gray-300">
              Airs in {Math.floor(nextAiring.timeUntilAiring / 86400)} days {Math.floor((nextAiring.timeUntilAiring % 86400) / 3600)} hours
            </p>
          </div>
        )}

        {/* 📺 Where to Watch Widget (Real Official Platforms) */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-500 rounded-full"></span> Where to Watch
            </h4>
            <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/10 font-semibold">
              Official Streaming
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Official Global & Indian Streaming Platforms */}
            {streamingPlatforms.map((platform) => {
              const brand = getBrandColor(platform.name);
              return (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between p-3 rounded-2xl ${brand.bg} border ${brand.border} text-white transition-all group shadow-sm`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {platform.logoUrl ? (
                      <img
                        src={platform.logoUrl}
                        alt={platform.name}
                        className="w-8 h-8 rounded-xl object-cover bg-black border border-white/10 flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-xl ${brand.initialBg} flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-sm`}>
                        {platform.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-bold truncate block group-hover:text-[#ff4dd2] transition-colors">
                        {platform.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {platform.region}
                      </span>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                </a>
              );
            })}

            {/* 2. Anime Nation Native Player */}
            <Link
              href={`/watch/${anime.mal_id || anime.id}?ep=1`}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 hover:border-[#ff4dd2]/60 text-white transition-all group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#ff4dd2] flex items-center justify-center text-black font-black text-xs shadow-md shadow-[#ff4dd2]/30">
                  AN
                </div>
                <div>
                  <span className="text-xs font-bold block">Anime Nation HD Player</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Free HD Streaming</span>
                </div>
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
