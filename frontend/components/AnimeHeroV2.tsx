'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Radio
} from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';
import RatingModal from './RatingModal';
import CustomListModal from './CustomListModal';

interface AnimeHeroV2Props {
  anime: any;
  extraInfo?: any;
}

export default function AnimeHeroV2({ anime, extraInfo }: AnimeHeroV2Props) {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

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

  // Fetch initial Favorite and Rating from backend
  useEffect(() => {
    if (!animeId) return;

    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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

  return (
    <div className="relative w-full overflow-hidden bg-[#040405]">
      {/* 🖼️ High-Impact Ambient Backdrop Banner */}
      <div className="absolute inset-0 h-[480px] lg:h-[560px] w-full overflow-hidden">
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
      <div className="relative container mx-auto px-4 pt-24 lg:pt-32 pb-6 max-w-[1500px]">
        
        {/* 🧭 Breadcrumb */}
        <nav className="text-gray-400 text-xs mb-4 flex items-center gap-2 drop-shadow-md">
          <Link href="/" className="hover:text-[#ff4dd2] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-[#ff4dd2] transition-colors">Anime</Link>
          <span>/</span>
          <span className="text-gray-200 truncate max-w-[280px] sm:max-w-md">{englishTitle}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-start">
          
          {/* 👈 Floating Left Poster Card */}
          <div className="w-[200px] sm:w-[240px] lg:w-[270px] flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden border-2 border-white/20 hover:border-[#ff4dd2]/80 shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-[#0d0e20] group transition-all duration-500">
              <img
                src={posterImage}
                alt={englishTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 block"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <span className="absolute top-3 left-3 bg-[#ff4dd2] text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider z-10">
                {format}
              </span>

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

              {/* Sub / Dub Badge */}
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                <Mic size={13} />
                <span>English Dubbed & Sub</span>
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
