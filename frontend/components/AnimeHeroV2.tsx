'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, 
  Heart, 
  ListPlus, 
  Share2, 
  Check, 
  Copy, 
  Tv, 
  Calendar, 
  Clock, 
  Building2, 
  Mic, 
  Play,
  Film,
  Radio,
  Globe,
  ChevronDown,
  X
} from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';
import RatingModal from './RatingModal';
import CustomListModal from './CustomListModal';
import TrailerModal from './TrailerModal';
import { resolveAnimeLanguages } from '../lib/languages';
import { TMDBAnimeData } from '../lib/tmdb-api';

interface AnimeHeroV2Props {
  anime: any;
  extraInfo?: any;
  characters?: any[];
  tmdbData?: TMDBAnimeData | null;
}

export default function AnimeHeroV2({ anime, extraInfo, characters = [], tmdbData = null }: AnimeHeroV2Props) {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const langInfo = useMemo(() => {
    return resolveAnimeLanguages(anime, extraInfo, characters, tmdbData);
  }, [anime, extraInfo, characters, tmdbData]);

  // Close language popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const animeId = anime.mal_id || anime.id || extraInfo?.idMal || extraInfo?.id;
  const englishTitle = anime.title_english || extraInfo?.title?.english || anime.title || 'Unknown Title';
  const romajiTitle = anime.title || extraInfo?.title?.romaji || '';
  const japaneseTitle = anime.title_japanese || extraInfo?.title?.native || '';

  const posterImage = 
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    extraInfo?.coverImage?.extraLarge ||
    extraInfo?.coverImage?.large ||
    '/placeholder-poster.png';

  const bannerImage = 
    extraInfo?.bannerImage || 
    anime.images?.webp?.large_image_url || 
    anime.images?.jpg?.large_image_url || 
    null;

  const score = anime.score || (extraInfo?.averageScore ? (extraInfo.averageScore / 10).toFixed(2) : null);
  const scoredBy = anime.scored_by ? anime.scored_by.toLocaleString() : (extraInfo?.popularity ? extraInfo.popularity.toLocaleString() : null);
  const format = anime.type || extraInfo?.format || 'TV';
  const airedDate = anime.aired?.string || (extraInfo?.seasonYear ? `${extraInfo.seasonYear}` : null);
  const episodes = anime.episodes || extraInfo?.episodes || null;
  const duration = anime.duration ? anime.duration.replace('per ep', '').trim() : (extraInfo?.duration ? `${extraInfo.duration} min` : null);
  const studio = anime.studios?.[0]?.name || extraInfo?.studios?.nodes?.[0]?.name || 'Anime Studio';
  const genres = anime.genres || (extraInfo?.genres ? extraInfo.genres.map((g: string) => ({ name: g })) : []);

  // Format Next Airing Episode
  const formatNextEpisode = () => {
    if (!extraInfo?.nextAiringEpisode) return null;
    const { episode, airingAt, timeUntilAiring } = extraInfo.nextAiringEpisode;
    const date = new Date(airingAt * 1000).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    
    const days = Math.floor(timeUntilAiring / 86400);
    const hours = Math.floor((timeUntilAiring % 86400) / 3600);
    const timeString = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

    return { episode, date, timeString };
  };
  const nextEp = formatNextEpisode();

  // Fetch initial Favorite and Rating from backend with multi-event sync
  useEffect(() => {
    if (!animeId) return;

    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    const checkDetails = () => {
      // Check favorite
      fetch(`${backendUrl}/api/favorites/check/${animeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.isFavorite === 'boolean') {
            setIsFavorite(data.isFavorite);
          }
        })
        .catch(() => {});

      // Check rating
      fetch(`${backendUrl}/api/ratings/anime/${animeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.userRating) {
            setUserRating(data.userRating);
          }
        })
        .catch(() => {});
    };

    checkDetails();

    window.addEventListener('favorites-updated', checkDetails);
    window.addEventListener('popstate', checkDetails);
    window.addEventListener('pageshow', checkDetails);
    window.addEventListener('focus', checkDetails);

    return () => {
      window.removeEventListener('favorites-updated', checkDetails);
      window.removeEventListener('popstate', checkDetails);
      window.removeEventListener('pageshow', checkDetails);
      window.removeEventListener('focus', checkDetails);
    };
  }, [animeId]);

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(englishTitle);
      setCopiedTitle(true);
      setTimeout(() => setCopiedTitle(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: englishTitle,
          text: `Check out ${englishTitle} on Anime Nation India!`,
          url,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {}
  };

  const toggleFavorite = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) {
      alert('Please log in to add to your Favorites list!');
      return;
    }
    setFavLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          anime: {
            mal_id: animeId,
            title: englishTitle,
            title_english: englishTitle,
            images: {
              webp: { large_image_url: posterImage },
              jpg: { large_image_url: posterImage }
            },
            type: format,
            score: score ? parseFloat(String(score)) : null,
          }
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsFavorite(data.isFavorite);
      }
    } catch {
      console.error('Favorite toggle failed');
    } finally {
      setFavLoading(false);
    }
  };

  const trailerId = tmdbData?.trailerYoutubeId || anime.trailer?.youtube_id || extraInfo?.trailer?.id || null;

  return (
    <div className="relative w-full bg-[#040405]">
      {/* 🖼️ High-Impact Ambient Backdrop Banner */}
      <div className="absolute inset-0 h-[480px] lg:h-[560px] w-full overflow-hidden pointer-events-none">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={englishTitle}
            className="w-full h-full object-cover object-center opacity-30 lg:opacity-40 filter blur-[1px] scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1b0826] via-[#090b1e] to-[#040405]" />
        )}
        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040405] via-[#040405]/80 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040405] via-transparent to-[#040405]" />
      </div>

      {/* Hero Content Container */}
      <div className="relative container mx-auto px-4 pt-24 lg:pt-32 pb-10 max-w-[1500px]">
        
        {/* 🧭 Breadcrumb */}
        <nav className="text-gray-400 text-xs mb-4 flex items-center gap-2 drop-shadow-md">
          <Link href="/" className="hover:text-[#ff4dd2] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-[#ff4dd2] transition-colors">Anime</Link>
          <span>/</span>
          <span className="text-gray-200 truncate max-w-[280px] sm:max-w-md">{englishTitle}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-start">
          
          {/* 👈 Left Poster Card Container */}
          <div className="w-48 sm:w-56 md:w-64 lg:w-72 flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-[#ff4dd2]/10 border-2 border-white/10 group">
              <img
                src={posterImage}
                alt={englishTitle}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
              {/* Quick Watch Link Floating on Poster */}
              <Link
                href={`/watch/${animeId}?ep=1`}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]"
              >
                <div className="w-14 h-14 rounded-full bg-[#ff4dd2] text-black flex items-center justify-center shadow-xl shadow-[#ff4dd2]/40 transform group-hover:scale-110 transition-transform">
                  <Play size={24} className="fill-black ml-1" />
                </div>
              </Link>
            </div>
          </div>

          {/* 👉 Right Details Info Block */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0">
            
            {/* Official TMDB ClearArt Transparent PNG Logo */}
            {tmdbData?.logoUrl && (
              <div className="mb-2 max-w-[280px] sm:max-w-[340px] md:max-w-[380px] flex items-center justify-center md:justify-start">
                <img
                  src={tmdbData.logoUrl}
                  alt={englishTitle}
                  className="max-h-20 sm:max-h-24 w-auto object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)] hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            {/* Title & Copy Button */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1.5 w-full">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {englishTitle}
              </h1>
              <button
                onClick={handleCopyTitle}
                title="Copy Title"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors flex-shrink-0 cursor-pointer"
              >
                {copiedTitle ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Subtitles: Japanese & Romaji */}
            <p className="text-xs sm:text-sm text-gray-400 font-medium mb-3 flex flex-wrap items-center justify-center md:justify-start gap-2">
              {japaneseTitle && <span>{japaneseTitle}</span>}
              {japaneseTitle && romajiTitle && <span>•</span>}
              {romajiTitle && <span>{romajiTitle}</span>}
            </p>

            {/* Next Airing Episode Banner (Hero) */}
            {nextEp && (
              <div className="mb-3.5 inline-flex items-center gap-2 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 px-3.5 py-1.5 rounded-xl text-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4dd2] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4dd2]"></span>
                </span>
                <span className="font-semibold text-white">
                  Episode {nextEp.episode}: <span className="text-[#ff4dd2] font-bold">{nextEp.timeString}</span>
                </span>
                <span className="text-gray-400">({nextEp.date})</span>
              </div>
            )}

            {/* Stats & Dub Badge Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-4">
              {/* Star Rating Badge */}
              <div className="flex items-center gap-1.5 bg-[#15172e] border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-md">
                <Star size={15} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-extrabold text-white">{score || 'N/A'}</span>
                {scoredBy && (
                  <span className="text-[11px] text-gray-400 font-medium ml-1">
                    {scoredBy} users
                  </span>
                )}
              </div>

              {/* Dynamic Real Audio & Sub/Dub Badge */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setShowLangModal(!showLangModal)}
                  className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all duration-300 cursor-pointer active:scale-95 ${
                    langInfo.tone === 'purple'
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25 shadow-purple-500/10'
                      : langInfo.tone === 'cyan'
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 shadow-cyan-500/10'
                      : langInfo.tone === 'amber'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-amber-500/10'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 shadow-emerald-500/10'
                  }`}
                  title="Click to view all available audio & subtitle tracks"
                >
                  <Mic size={13} className="flex-shrink-0" />
                  <span className="flex items-center gap-1.5">
                    <span>{langInfo.originalFlag}</span>
                    <span>{langInfo.badgeLabel}</span>
                  </span>
                  <ChevronDown size={12} className={`transition-transform duration-300 ${showLangModal ? 'rotate-180 text-white' : 'opacity-60'}`} />
                </button>

                {/* 🌐 Language Breakdown Popover */}
                <AnimatePresence>
                  {showLangModal && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 sm:left-auto sm:right-0 md:left-0 mt-2 w-72 sm:w-80 bg-[#0c0d1e]/98 border border-[#ff4dd2]/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-[150] text-left max-h-[420px] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                          <Globe size={14} className="text-[#ff4dd2]" />
                          <span>Audio & Subtitle Tracks</span>
                        </div>
                        <button 
                          onClick={() => setShowLangModal(false)}
                          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* 1. Original Audio Track */}
                      <div className="mb-3">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1.5">
                          Original Audio
                        </span>
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
                          <span className="text-sm">{langInfo.originalFlag}</span>
                          <span>{langInfo.originalAudio} (Original)</span>
                        </div>
                      </div>

                      {/* 2. Dubbed Audio Tracks */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                            Dubbed Audio ({langInfo.dubLanguages.length})
                          </span>
                        </div>
                        {langInfo.dubLanguages.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                            {langInfo.dubLanguages.map((d) => (
                              <span
                                key={d.name}
                                className="inline-flex items-center gap-1.5 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 text-[#ff4dd2] px-2.5 py-1 rounded-lg text-xs font-bold"
                              >
                                <span>{d.flag}</span>
                                <span>{d.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No dubbed audio tracks available (Subtitled only).</p>
                        )}
                      </div>

                      {/* 3. Subtitles */}
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1.5">
                          Subtitles Available ({langInfo.subLanguages.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {langInfo.subLanguages.map((s) => (
                            <span
                              key={s.name}
                              className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            >
                              <span>{s.flag}</span>
                              <span>{s.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 4. Stream in India / OTT Partners */}
                      {((tmdbData?.watchProvidersIndia && tmdbData.watchProvidersIndia.length > 0) || (tmdbData?.watchProvidersGlobal && tmdbData.watchProvidersGlobal.length > 0)) && (
                        <div className="mt-3.5 pt-3 border-t border-white/10">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-1.5">
                            🇮🇳 Official Streaming Partners
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(tmdbData?.watchProvidersIndia?.length ? tmdbData.watchProvidersIndia : tmdbData?.watchProvidersGlobal || []).map((p) => (
                              <div
                                key={p.name}
                                className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-sm"
                              >
                                {p.logoUrl && (
                                  <img src={p.logoUrl} alt={p.name} className="w-4 h-4 rounded-md object-cover" />
                                )}
                                <span>{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Metadata Icons Line */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-5 text-xs text-gray-300 font-semibold mb-4 py-2 border-y border-white/5 w-full">
              <span className="flex items-center gap-1.5 text-white">
                <Tv size={14} className="text-[#ff4dd2]" /> {format}
              </span>
              {airedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-400" /> {airedDate}
                </span>
              )}
              {episodes && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" /> {episodes} Episodes {duration ? `• ${duration}` : ''}
                </span>
              )}
              {studio && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-sky-400" /> {studio}
                </span>
              )}
            </div>

            {/* Genre Pills */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-6">
              {genres.slice(0, 8).map((g: any, i: number) => {
                const genreName = typeof g === 'string' ? g : g.name;
                return (
                  <Link
                    key={i}
                    href={`/browse?genre=${encodeURIComponent(genreName)}`}
                    className="bg-white/5 hover:bg-white/10 hover:border-[#ff4dd2]/40 text-gray-300 hover:text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/10 transition-all duration-300 shadow-sm"
                  >
                    {genreName}
                  </Link>
                );
              })}
            </div>

            {/* 🎯 Primary Watch Now & Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 w-full pt-1">
              
              {/* 🚀 Primary Watch Now Button */}
              <Link
                href={`/watch/${animeId}?ep=1`}
                className="flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-black px-6 py-2.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#ff4dd2]/30 transition-all duration-300 active:scale-95"
              >
                <Play size={16} className="fill-black" />
                <span>Watch Now</span>
              </Link>

              {/* 🎬 4K Official Trailer Button */}
              {trailerId && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#ff4dd2]/50 text-white font-extrabold px-4 sm:px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md cursor-pointer"
                >
                  <Film size={15} className="text-[#ff4dd2]" />
                  <span>Trailer</span>
                </button>
              )}

              {/* 1. ⭐ Rate Button */}
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="flex items-center gap-2 bg-[#e50914] hover:bg-[#ff1f2d] text-white font-extrabold px-4 sm:px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#e50914]/25 transition-all duration-300 cursor-pointer active:scale-95"
              >
                <Star size={15} className="fill-white" />
                <span>{userRating ? `Rated ${userRating}/10` : 'Rate'}</span>
              </button>

              {/* 2. 🤍 Favorite Button */}
              <button
                onClick={toggleFavorite}
                disabled={favLoading}
                className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider border transition-all duration-300 cursor-pointer active:scale-95 ${
                  isFavorite
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 shadow-lg shadow-rose-500/20'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
              >
                <Heart
                  size={15}
                  className={`${isFavorite ? 'fill-rose-500 text-rose-500 animate-pulse' : 'text-gray-300'}`}
                />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>

              {/* 3. 📑 Add to Animenation List */}
              <button
                onClick={() => setIsListModalOpen(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
              >
                <ListPlus size={15} className="text-[#ff4dd2]" />
                <span className="hidden sm:inline">Add to List</span>
                <span className="sm:hidden">List</span>
              </button>

              {/* 4. 🔗 Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
              >
                {copiedShare ? (
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1.5 animate-pulse">
                    <Check size={15} /> Copied!
                  </span>
                ) : (
                  <>
                    <Share2 size={15} className="text-indigo-400" />
                    <span>Share</span>
                  </>
                )}
              </button>

              {/* 5. 📌 Watchlist Selector */}
              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                <WatchlistDropdown
                  animeId={animeId}
                  title={englishTitle}
                  image={posterImage}
                  type="Anime"
                />
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Modals */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        youtubeId={trailerId}
        title={englishTitle}
      />

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        animeId={animeId}
        animeTitle={englishTitle}
        animeImage={posterImage}
        currentRating={userRating}
        onRatingUpdated={(newScore) => setUserRating(newScore)}
      />

      <CustomListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        anime={{
          mal_id: animeId,
          title: englishTitle,
          image: posterImage,
          format,
          score: score ? parseFloat(String(score)) : undefined,
        }}
      />
    </div>
  );
}
