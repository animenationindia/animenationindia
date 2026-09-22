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
  X,
  ThumbsUp,
  ThumbsDown,
  Eye,
  EyeOff,
  Users,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';
import RatingModal from './RatingModal';
import CustomListModal from './CustomListModal';
import TrailerModal from './TrailerModal';
import { resolveAnimeLanguages } from '../lib/languages';
import { TMDBAnimeData } from '../lib/tmdb-api';
import { getUserReactions, toggleUserReaction, getUserMediaRating } from '@/app/actions/catalogs';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { dispatchWatchlistUpdated } from '@/lib/catalogs-shared';

interface AnimeHeroV2Props {
  anime: any;
  extraInfo?: any;
  characters?: any[];
  tmdbData?: TMDBAnimeData | null;
}

export default function AnimeHeroV2({ anime, extraInfo, characters = [], tmdbData = null }: AnimeHeroV2Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [copiedShare, setCopiedShare] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPartyNotice, setShowPartyNotice] = useState(false);

  // ─── Reaction States ───
  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);

  const checkAuthAndPrompt = (): boolean => {
    const isAuthed = Boolean(session?.user || (typeof window !== 'undefined' && localStorage.getItem('user_id')));
    if (!isAuthed) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.push(`/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return false;
    }
    return true;
  };

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

  // ─── Dynamic Score (prefer AniList % else MAL /10) ───
  const anilistScore = extraInfo?.averageScore ? extraInfo.averageScore : null;
  const malScore = anime.score ? parseFloat(String(anime.score)) : null;
  const scoreDisplay = anilistScore
    ? `${anilistScore}% AniList Score`
    : malScore
    ? `${malScore} MAL Score`
    : null;

  const format = anime.type || extraInfo?.format || 'TV';
  const studio = anime.studios?.[0]?.name || extraInfo?.studios?.nodes?.[0]?.name || null;
  const genres = anime.genres || (extraInfo?.genres ? extraInfo.genres.map((g: string) => ({ name: g })) : []);
  const synopsis = anime.synopsis || extraInfo?.description || 'Explore episodes, characters, chronology, and official original soundtracks.';

  // ─── Season & Year Badge ───
  const anilistSeason = extraInfo?.season || null;
  const anilistYear = extraInfo?.seasonYear || anime.year || null;
  const seasonYearDisplay = anilistSeason && anilistYear
    ? `${anilistSeason} ${anilistYear}`
    : anilistYear
    ? `${anilistYear}`
    : null;

  // ─── Airing State ───
  const rawStatus = extraInfo?.status || anime.status || '';
  const isAiring = rawStatus === 'RELEASING' || rawStatus === 'Currently Airing';
  const isCompleted = rawStatus === 'FINISHED' || rawStatus === 'Finished Airing' || rawStatus === 'Completed';

  // ─── Next Airing Episode Countdown ───
  const formatNextEpisode = () => {
    if (!extraInfo?.nextAiringEpisode) return null;
    const { episode, airingAt, timeUntilAiring } = extraInfo.nextAiringEpisode;
    const days = Math.floor(timeUntilAiring / 86400);
    const hours = Math.floor((timeUntilAiring % 86400) / 3600);
    const timeString = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
    return { episode, timeString };
  };
  const nextEp = formatNextEpisode();

  // ─── Trailer ───
  const trailerId = tmdbData?.trailerYoutubeId || anime.trailer?.youtube_id || extraInfo?.trailer?.id || null;

  // ─── Load Initial States from Neon PostgreSQL + localStorage Fallback ───
  useEffect(() => {
    if (!animeId) return;
    const strId = String(animeId);

    // 1. Instant optimistic load from localStorage
    try {
      const w = JSON.parse(localStorage.getItem('ani_watched_ids') || '[]');
      const l = JSON.parse(localStorage.getItem('ani_liked_ids') || '[]');
      const d = JSON.parse(localStorage.getItem('ani_disliked_ids') || '[]');
      setIsWatched(w.map(String).includes(strId));
      setIsLiked(l.map(String).includes(strId));
      setIsDisliked(d.map(String).includes(strId));
    } catch {}

    // 2. Fetch authenticated user data from Neon PostgreSQL
    getUserReactions()
      .then((res) => {
        if (res.authenticated) {
          setIsWatched(res.watchedIds.includes(strId));
          setIsLiked(res.likedIds.includes(strId));
          setIsDisliked(res.dislikedIds.includes(strId));
        }
      })
      .catch(() => {});

    // 3. Fetch user rating from Neon PostgreSQL
    getUserMediaRating(animeId, 'anime')
      .then((res) => {
        if (res.score) {
          setUserRating(res.score);
        } else {
          // Fallback to local storage if not logged in
          try {
            const savedRev = localStorage.getItem(`ani_user_review_${animeId}`);
            if (savedRev) {
              const parsed = JSON.parse(savedRev);
              if (parsed?.score) setUserRating(parsed.score);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [animeId]);

  // ─── Reaction Toggles (Neon PostgreSQL + localStorage Sync) ───
  const toggleWatched = async () => {
    if (!checkAuthAndPrompt()) return;
    const next = !isWatched;
    setIsWatched(next);

    try {
      const arr = JSON.parse(localStorage.getItem('ani_watched_ids') || '[]');
      const updated = next ? [...arr, animeId] : arr.filter((id: any) => id !== animeId);
      localStorage.setItem('ani_watched_ids', JSON.stringify(updated));
    } catch {}

    try {
      await toggleUserReaction(animeId, 'anime', 'watched', { title: englishTitle, posterPath: posterImage });
      dispatchWatchlistUpdated();
    } catch (e) {
      console.error('Failed to toggle watched reaction:', e);
    }
  };

  const toggleLike = async () => {
    if (!checkAuthAndPrompt()) return;
    const next = !isLiked;
    setIsLiked(next);
    if (next) setIsDisliked(false);

    try {
      const liked = JSON.parse(localStorage.getItem('ani_liked_ids') || '[]');
      const updatedLiked = next ? [...liked, animeId] : liked.filter((id: any) => id !== animeId);
      localStorage.setItem('ani_liked_ids', JSON.stringify(updatedLiked));
      if (next) {
        const disliked = JSON.parse(localStorage.getItem('ani_disliked_ids') || '[]');
        localStorage.setItem('ani_disliked_ids', JSON.stringify(disliked.filter((id: any) => id !== animeId)));
      }
    } catch {}

    try {
      await toggleUserReaction(animeId, 'anime', 'liked', { title: englishTitle, posterPath: posterImage });
      dispatchWatchlistUpdated();
    } catch (e) {
      console.error('Failed to toggle like reaction:', e);
    }
  };

  const toggleDislike = async () => {
    if (!checkAuthAndPrompt()) return;
    const next = !isDisliked;
    setIsDisliked(next);
    if (next) setIsLiked(false);

    try {
      const disliked = JSON.parse(localStorage.getItem('ani_disliked_ids') || '[]');
      const updatedDisliked = next ? [...disliked, animeId] : disliked.filter((id: any) => id !== animeId);
      localStorage.setItem('ani_disliked_ids', JSON.stringify(updatedDisliked));
      if (next) {
        const liked = JSON.parse(localStorage.getItem('ani_liked_ids') || '[]');
        localStorage.setItem('ani_liked_ids', JSON.stringify(liked.filter((id: any) => id !== animeId)));
      }
    } catch {}

    try {
      await toggleUserReaction(animeId, 'anime', 'disliked', { title: englishTitle, posterPath: posterImage });
      dispatchWatchlistUpdated();
    } catch (e) {
      console.error('Failed to toggle dislike reaction:', e);
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: englishTitle, text: `Check out ${englishTitle} on Anime Nation India!`, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    } catch {}
  };

  // ─── Sanitize synopsis ───
  const cleanSynopsis = synopsis.replace(/<[^>]*>?/gm, '');

  return (
    <div className="relative w-full bg-[#040405]">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AMBIENT BACKDROP BANNER                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 h-[520px] lg:h-[600px] w-full overflow-hidden pointer-events-none">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={englishTitle}
            referrerPolicy="no-referrer"
            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
            className="w-full h-full object-cover object-top opacity-30 lg:opacity-40 filter blur-[2px] scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1b0826] via-[#090b1e] to-[#040405]" />
        )}
        {/* Cinematic vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040405] via-[#040405]/85 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040405] via-[#040405]/40 to-transparent" />
        {/* Ambient neon glow orbs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#ff4dd2]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO CONTENT CONTAINER                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative container mx-auto px-4 pt-32 lg:pt-36 pb-12 max-w-[1500px]">

        {/* Breadcrumb */}
        <nav className="text-gray-400 text-xs mb-5 flex items-center gap-2 drop-shadow-md">
          <Link href="/" className="hover:text-[#ff4dd2] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-[#ff4dd2] transition-colors">Anime</Link>
          <span>/</span>
          <span className="text-gray-200 truncate max-w-[280px] sm:max-w-md">{englishTitle}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-end">

          {/* ════════════════════════════════════════════════════════ */}
          {/* LEFT: CYBER POSTER CARD                                  */}
          {/* ════════════════════════════════════════════════════════ */}
          <div className="w-44 sm:w-52 md:w-60 lg:w-68 flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-white/15 group hover:border-[#ff4dd2]/50 transition-all duration-500">
              <img
                src={posterImage}
                alt={englishTitle}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('placeholder-poster.png')) target.src = '/placeholder-poster.png';
                }}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Format Badge — top-left */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-xl border border-[#ff4dd2]/30 text-[9px] font-black tracking-widest text-[#ff4dd2] shadow-lg">
                <Tv size={10} />
                <span>{format}</span>
              </div>

              {/* Japanese Native Title Watermark — bottom */}
              {japaneseTitle && (
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-center pointer-events-none">
                  <span className="text-[9px] font-bold text-white/70 tracking-wider bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 line-clamp-1 block">
                    {japaneseTitle}
                  </span>
                </div>
              )}

              {/* Play overlay on hover */}
              <Link
                href={`/watch/${animeId}?ep=1`}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]"
              >
                <div className="w-14 h-14 rounded-full bg-[#ff4dd2] text-black flex items-center justify-center shadow-xl shadow-[#ff4dd2]/40 transform group-hover:scale-110 transition-transform">
                  <Play size={22} className="fill-black ml-1" />
                </div>
              </Link>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════ */}
          {/* RIGHT: DETAILS INFO BLOCK                                */}
          {/* ════════════════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0">

            {/* ── TOP BADGES ROW ── */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">

              {/* Format */}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff4dd2]/40 bg-[#ff4dd2]/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.2)]">
                <Tv size={11} />
                <span>{format}</span>
              </span>

              {/* Airing State */}
              {isAiring && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-black text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Radio size={11} className="animate-pulse" />
                  <span>AIRING NOW</span>
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-zinc-300">
                  <span>COMPLETED</span>
                </span>
              )}

              {/* Dynamic Score (AniList % preferred, MAL /10 fallback) */}
              {scoreDisplay && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-[11px] font-black text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Star size={11} className="fill-amber-400" />
                  <span>{scoreDisplay}</span>
                </span>
              )}

              {/* Season & Year */}
              {seasonYearDisplay && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold text-zinc-300">
                  <Calendar size={11} className="text-zinc-400" />
                  <span className="uppercase">{seasonYearDisplay}</span>
                </span>
              )}

              {/* Lead Studio */}
              {studio && (
                <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-300">
                  <Building2 size={11} />
                  <span>{studio}</span>
                </span>
              )}

              {/* Next Episode Countdown */}
              {nextEp && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ff4dd2]/30 bg-[#ff4dd2]/10 px-3 py-1 text-[11px] font-bold text-[#ff4dd2]">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4dd2] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff4dd2]"></span>
                  </span>
                  <span>Ep {nextEp.episode} in {nextEp.timeString}</span>
                </span>
              )}
            </div>

            {/* ── SUBHEADER: Japanese • Romaji ── */}
            {(japaneseTitle || romajiTitle) && (
              <p className="text-xs sm:text-sm text-[#ff4dd2] font-bold mb-2.5 flex flex-wrap items-center justify-center md:justify-start gap-1.5 font-mono tracking-wider">
                {japaneseTitle && <span>{japaneseTitle}</span>}
                {japaneseTitle && romajiTitle && <span className="text-zinc-400">•</span>}
                {romajiTitle && romajiTitle !== englishTitle && <span className="text-zinc-300">{romajiTitle}</span>}
              </p>
            )}

            {/* ── TMDB ClearArt Logo (if available) ── */}
            {tmdbData?.logoUrl && (
              <div className="mb-2.5 max-w-[280px] sm:max-w-[360px] md:max-w-[420px] flex items-center justify-center md:justify-start">
                <img
                  src={tmdbData.logoUrl}
                  alt={englishTitle}
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  className="max-h-20 sm:max-h-24 w-auto object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            {/* ── MAIN TITLE ── */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)] leading-[1.05] mb-3">
              {englishTitle}
            </h1>

            {/* ── GENRE PILLS (Non-clickable for now) ── */}
            {/* TODO: Replace <span> with <Link href={...}> when genre discovery engine is ready */}
            {genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-4">
                {genres.slice(0, 8).map((g: any, i: number) => {
                  const genreName = typeof g === 'string' ? g : g.name;
                  return (
                    <span
                      key={`${genreName}-${i}`}
                      className="bg-white/5 text-gray-300 text-[11px] font-bold px-3 py-1 rounded-full border border-white/10 cursor-default select-none"
                    >
                      {genreName}
                    </span>
                  );
                })}
              </div>
            )}

            {/* ── SYNOPSIS ── */}
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-300 line-clamp-3 mb-5">
              {cleanSynopsis}
            </p>

            {/* ════════════════════════════════════════════════════════ */}
            {/* ACTION BUTTONS BAR (9 Buttons)                          */}
            {/* ════════════════════════════════════════════════════════ */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 w-full">

              {/* 1. Watch Now (Primary) */}
              <Link
                href={`/watch/${animeId}?ep=1`}
                className="flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#ff4dd2]/30 transition-all duration-300 active:scale-95"
              >
                <Play size={16} className="fill-black" />
                <span>Watch Now</span>
              </Link>

              {/* 2. Trailer */}
              {trailerId && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#ff4dd2]/50 text-white font-extrabold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 shadow-md cursor-pointer"
                >
                  <Film size={15} className="text-[#ff4dd2]" />
                  <span>Trailer</span>
                </button>
              )}

              {/* 3. Watch Party */}
              <button
                type="button"
                onClick={() => setShowPartyNotice(true)}
                className="flex items-center gap-2 border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/30 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-purple-300 transition-all active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.15)] cursor-pointer"
                title="Watch together with friends in real-time"
              >
                <Users size={15} />
                <span>Watch Party</span>
              </button>

              {/* 4. Add to Watchlist (Dropdown) */}
              <WatchlistDropdown
                animeId={animeId}
                title={englishTitle}
                image={posterImage}
                type="Anime"
              />

              {/* 5. Add to Custom Folder */}
              <button
                onClick={() => setIsListModalOpen(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
              >
                <ListPlus size={15} className="text-[#ff4dd2]" />
                <span className="hidden sm:inline">Add to Folder</span>
                <span className="sm:hidden">Folder</span>
              </button>

              {/* 6. Mark as Watched */}
              <button
                type="button"
                onClick={toggleWatched}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  isWatched
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={isWatched ? 'Marked as Watched' : 'Mark as Watched'}
              >
                {isWatched ? <Eye size={15} /> : <EyeOff size={15} />}
                <span>{isWatched ? 'Watched' : 'Watched?'}</span>
              </button>

              {/* 7. Like */}
              <button
                type="button"
                onClick={toggleLike}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  isLiked
                    ? 'border-[#ff4dd2] bg-[#ff4dd2]/20 text-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                    : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Like this anime"
              >
                <ThumbsUp size={15} />
              </button>

              {/* 8. Dislike */}
              <button
                type="button"
                onClick={toggleDislike}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  isDisliked
                    ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                    : 'border-white/15 bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Dislike this anime"
              >
                <ThumbsDown size={15} />
              </button>

              {/* 9. Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-95"
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

              {/* 10. Star Rating */}
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="flex items-center gap-2 bg-[#e50914]/15 hover:bg-[#e50914]/25 border border-[#e50914]/40 text-[#ff4d4d] font-extrabold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all duration-300 cursor-pointer active:scale-95"
              >
                <Star size={15} className={userRating ? 'fill-[#ff4d4d]' : ''} />
                <span>{userRating ? `${userRating}/10` : 'Rate'}</span>
              </button>
            </div>

            {/* ── Audio / Sub-Dub Language Popover (Compact, below action bar) ── */}
            <div className="relative mt-3" ref={langRef}>
              <button
                onClick={() => setShowLangModal(!showLangModal)}
                className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all duration-300 cursor-pointer active:scale-95 ${
                  langInfo.tone === 'purple'
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25'
                    : langInfo.tone === 'cyan'
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                    : langInfo.tone === 'amber'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                }`}
                title="Click to view all available audio & subtitle tracks"
              >
                <Mic size={12} className="flex-shrink-0" />
                <span className="flex items-center gap-1">
                  <span>{langInfo.originalFlag}</span>
                  <span>{langInfo.badgeLabel}</span>
                </span>
                <ChevronDown size={11} className={`transition-transform duration-300 ${showLangModal ? 'rotate-180' : 'opacity-60'}`} />
              </button>

              <AnimatePresence>
                {showLangModal && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-[#0c0d1e]/98 border border-[#ff4dd2]/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl z-[150] text-left max-h-[380px] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                        <Globe size={13} className="text-[#ff4dd2]" />
                        <span>Audio & Subtitle Tracks</span>
                      </div>
                      <button
                        onClick={() => setShowLangModal(false)}
                        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* Original Audio */}
                    <div className="mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1.5">Original Audio</span>
                      <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white">
                        <span className="text-sm">{langInfo.originalFlag}</span>
                        <span>{langInfo.originalAudio} (Original)</span>
                      </div>
                    </div>

                    {/* Dubbed Audio */}
                    <div className="mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1.5">
                        Dubbed Audio ({langInfo.dubLanguages.length})
                      </span>
                      {langInfo.dubLanguages.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {langInfo.dubLanguages.map((d, idx) => (
                            <span key={`${d.name}-${idx}`} className="inline-flex items-center gap-1.5 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 text-[#ff4dd2] px-2.5 py-1 rounded-lg text-xs font-bold">
                              <span>{d.flag}</span>
                              <span>{d.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No dubbed audio tracks available (Subtitled only).</p>
                      )}
                    </div>

                    {/* Subtitles */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1.5">
                        Subtitles Available ({langInfo.subLanguages.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {langInfo.subLanguages.map((s, idx) => (
                          <span key={`${s.name}-${idx}`} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                            <span>{s.flag}</span>
                            <span>{s.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* OTT Streaming Partners */}
                    {((tmdbData?.watchProvidersIndia && tmdbData.watchProvidersIndia.length > 0) || (tmdbData?.watchProvidersGlobal && tmdbData.watchProvidersGlobal.length > 0)) && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-1.5">
                          🇮🇳 Official Streaming Partners
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(tmdbData?.watchProvidersIndia?.length ? tmdbData.watchProvidersIndia : tmdbData?.watchProvidersGlobal || []).map((p, idx) => (
                            <div key={`${p.name}-${idx}`} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-xs font-bold text-white shadow-sm">
                              {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="w-4 h-4 rounded-md object-cover" />}
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODALS                                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
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
          score: malScore ?? undefined,
        }}
      />

      {/* ── Watch Party Coming Soon Modal ── */}
      <AnimatePresence>
        {showPartyNotice && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0c0d1e] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center overflow-hidden"
            >
              <button
                onClick={() => setShowPartyNotice(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto mb-4 shadow-lg shadow-purple-500/20">
                <Users size={32} />
              </div>

              <div className="inline-block bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/30 mb-2">
                In Development
              </div>

              <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2">
                Watch Party — Coming Soon!
              </h3>

              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                We are building real-time synchronized video playback and interactive audio chat lobbies so you can stream <span className="text-[#ff4dd2] font-bold">{englishTitle}</span> together with your friends!
              </p>

              <button
                onClick={() => setShowPartyNotice(false)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-[#ff4dd2] hover:from-purple-500 hover:to-[#ff7be0] text-black font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-lg shadow-purple-500/20 cursor-pointer active:scale-95"
              >
                Got It, Stay Tuned!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
