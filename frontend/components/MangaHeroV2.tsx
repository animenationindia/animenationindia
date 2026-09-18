'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Star,
  Check,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Eye,
  ListPlus,
  Radio,
  Calendar,
  Layers,
  Sparkles,
  Users,
  PenTool,
  ArrowDown,
} from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';
import CustomListModal from './CustomListModal';
import RatingModal from './RatingModal';
import { getUserReactions, toggleUserReaction, getUserMediaRating } from '@/app/actions/catalogs';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { dispatchWatchlistUpdated } from '@/lib/catalogs-shared';

interface MangaHeroV2Props {
  manga: any;
  extraInfo?: any;
}

export default function MangaHeroV2({ manga, extraInfo }: MangaHeroV2Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [copiedShare, setCopiedShare] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  const checkAuthAndPrompt = (): boolean => {
    const isAuthed = Boolean(session?.user || (typeof window !== 'undefined' && localStorage.getItem('user_id')));
    if (!isAuthed) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.push(`/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return false;
    }
    return true;
  };

  // ─── Reaction States (Neon PostgreSQL + LocalStorage) ───
  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const mangaId = manga.mal_id || manga.id || extraInfo?.idMal || extraInfo?.id;

  // Safe string title extractions (never render raw title objects)
  const rawEnglish =
    manga.title_english ||
    extraInfo?.title?.english ||
    (typeof manga.title === 'object' ? manga.title?.english || manga.title?.romaji : manga.title) ||
    'Manga Title';
  const englishTitle = typeof rawEnglish === 'string' ? rawEnglish : (rawEnglish?.english || rawEnglish?.romaji || 'Manga Title');

  const rawRomaji =
    (typeof manga.title === 'object' ? manga.title?.romaji : manga.title) ||
    extraInfo?.title?.romaji ||
    englishTitle;
  const romajiTitle = typeof rawRomaji === 'string' ? rawRomaji : (rawRomaji?.romaji || '');

  const rawNative =
    manga.title_japanese ||
    (typeof manga.title === 'object' ? manga.title?.native : '') ||
    extraInfo?.title?.native ||
    '';
  const nativeTitle = typeof rawNative === 'string' ? rawNative : (rawNative?.native || '');

  const posterImage =
    manga.images?.webp?.large_image_url ||
    manga.images?.jpg?.large_image_url ||
    extraInfo?.coverImage?.extraLarge ||
    extraInfo?.coverImage?.large ||
    '/placeholder-poster.png';

  const bannerImage =
    extraInfo?.bannerImage ||
    manga.bannerImage ||
    posterImage;

  // ─── Format & Origin ───
  const rawCountry = (extraInfo?.countryOfOrigin || manga.countryOfOrigin || (manga.type === 'MANHWA' ? 'KR' : 'JP')).toUpperCase();
  const rawFormat = (extraInfo?.format || manga.format || manga.type || '').toUpperCase();
  const isManhwa = rawCountry === 'KR' || rawFormat === 'MANHWA' || (manga.type && manga.type.toLowerCase().includes('manhwa'));
  const isManhua = rawCountry === 'CN' || rawFormat === 'MANHUA' || (manga.type && manga.type.toLowerCase().includes('manhua'));
  const isNovel = rawFormat === 'NOVEL' || rawFormat === 'LIGHT NOVEL' || (manga.type && manga.type.toLowerCase().includes('novel'));

  let typeBadge = 'MANGA';
  let badgeColor = 'bg-sky-500/15 border-sky-500/30 text-sky-400';
  let countryCode = 'JP';
  let categoryHref = '/read/manga';
  let categoryLabel = 'Japanese Manga';

  if (isManhwa) {
    typeBadge = 'MANHWA';
    badgeColor = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
    countryCode = 'KR';
    categoryHref = '/read/manhwa';
    categoryLabel = 'Korean Manhwa';
  } else if (isManhua) {
    typeBadge = 'MANHUA';
    badgeColor = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
    countryCode = 'CN';
    categoryHref = '/read/manhua';
    categoryLabel = 'Chinese Manhua';
  } else if (isNovel) {
    typeBadge = 'LIGHT NOVEL';
    badgeColor = 'bg-purple-500/15 border-purple-500/30 text-purple-400';
    countryCode = 'LN';
    categoryHref = '/read/novels';
    categoryLabel = 'Light Novels';
  }

  // ─── Dynamic Score ───
  const anilistScore = extraInfo?.averageScore ? extraInfo.averageScore : null;
  const malScore = manga.score ? parseFloat(String(manga.score)) : null;
  const scoreDisplay = anilistScore
    ? `${anilistScore}% AniList Score`
    : malScore
    ? `${malScore <= 10 ? malScore.toFixed(1) : (malScore / 10).toFixed(1)} MAL Score`
    : null;

  // ─── Status ───
  const rawStatus = manga.status || extraInfo?.status || 'Publishing';
  const isPublishing =
    rawStatus.toLowerCase().includes('publishing') ||
    rawStatus.toLowerCase().includes('releasing');

  const chapters = manga.chapters || extraInfo?.chapters || null;
  const yearPublished =
    manga.published?.prop?.from?.year ||
    extraInfo?.seasonYear ||
    (manga.published?.from ? new Date(manga.published.from).getFullYear() : null);

  const authorName =
    manga.authors?.[0]?.name ||
    extraInfo?.staff?.edges?.[0]?.node?.name?.full ||
    null;

  const genres = manga.genres || (extraInfo?.genres ? extraInfo.genres.map((g: string) => ({ name: g })) : []);
  const synopsis = manga.synopsis || extraInfo?.description || 'Read official manga, manhwa, and light novel chapters with full character profiles and franchise adaptations.';

  // ─── Load Initial States from Neon PostgreSQL + LocalStorage Fallback ───
  useEffect(() => {
    if (!mangaId) return;
    const strId = String(mangaId);

    // 1. Instant optimistic load from localStorage
    try {
      const w = JSON.parse(localStorage.getItem('ani_manga_watched_ids') || '[]');
      const l = JSON.parse(localStorage.getItem('ani_manga_liked_ids') || '[]');
      const d = JSON.parse(localStorage.getItem('ani_manga_disliked_ids') || '[]');
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
    getUserMediaRating(mangaId, 'manga')
      .then((res) => {
        if (res.score) {
          setUserRating(res.score);
        } else {
          try {
            const savedRev = localStorage.getItem(`ani_user_review_${mangaId}`);
            if (savedRev) {
              const parsed = JSON.parse(savedRev);
              if (parsed?.score) setUserRating(parsed.score);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, [mangaId]);

  // ─── Toggles (Neon PostgreSQL + LocalStorage Sync) ───
  const currentMediaType = isNovel ? 'novel' : isManhwa ? 'manhwa' : 'manga';

  const toggleWatched = async () => {
    if (!checkAuthAndPrompt()) return;
    const next = !isWatched;
    setIsWatched(next);

    try {
      const arr = JSON.parse(localStorage.getItem('ani_manga_watched_ids') || '[]');
      const updated = next ? [...arr, mangaId] : arr.filter((id: any) => id !== mangaId);
      localStorage.setItem('ani_manga_watched_ids', JSON.stringify(updated));
    } catch {}

    try {
      await toggleUserReaction(mangaId, currentMediaType, 'watched', { title: englishTitle, posterPath: posterImage });
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
      const liked = JSON.parse(localStorage.getItem('ani_manga_liked_ids') || '[]');
      const updatedLiked = next ? [...liked, mangaId] : liked.filter((id: any) => id !== mangaId);
      localStorage.setItem('ani_manga_liked_ids', JSON.stringify(updatedLiked));
      if (next) {
        const disliked = JSON.parse(localStorage.getItem('ani_manga_disliked_ids') || '[]');
        localStorage.setItem('ani_manga_disliked_ids', JSON.stringify(disliked.filter((id: any) => id !== mangaId)));
      }
    } catch {}

    try {
      await toggleUserReaction(mangaId, currentMediaType, 'liked', { title: englishTitle, posterPath: posterImage });
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
      const disliked = JSON.parse(localStorage.getItem('ani_manga_disliked_ids') || '[]');
      const updatedDisliked = next ? [...disliked, mangaId] : disliked.filter((id: any) => id !== mangaId);
      localStorage.setItem('ani_manga_disliked_ids', JSON.stringify(updatedDisliked));
      if (next) {
        const liked = JSON.parse(localStorage.getItem('ani_manga_liked_ids') || '[]');
        localStorage.setItem('ani_manga_liked_ids', JSON.stringify(liked.filter((id: any) => id !== mangaId)));
      }
    } catch {}

    try {
      await toggleUserReaction(mangaId, currentMediaType, 'disliked', { title: englishTitle, posterPath: posterImage });
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

  const scrollToChapters = () => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById('chapters-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="relative w-full pt-20 sm:pt-24 pb-12 overflow-hidden">
      {/* Dynamic Background Banner Backdrop */}
      <div className="absolute inset-0 z-0 h-[650px] w-full overflow-hidden">
        <img
          src={bannerImage}
          alt={englishTitle}
          className="w-full h-full object-cover object-center filter blur-3xl opacity-20 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040405]/60 via-[#040405]/90 to-[#040405]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-[1500px] px-4">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-6 flex-wrap">
          <Link href="/read" className="hover:text-[#ff4dd2] transition-colors flex items-center gap-1.5">
            <Layers size={13} className="text-[#ff4dd2]" />
            <span>Reading Hub</span>
          </Link>
          <span className="text-gray-600">/</span>
          <Link href={categoryHref} className={`hover:underline transition-colors font-extrabold ${
            countryCode === 'KR' ? 'text-emerald-400' :
            countryCode === 'CN' ? 'text-amber-400' :
            countryCode === 'LN' ? 'text-purple-400' :
            'text-sky-400'
          }`}>
            {categoryLabel}
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300 truncate max-w-[200px] sm:max-w-xs">{englishTitle}</span>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12">
          
          {/* ── COVER POSTER ── */}
          <div className="relative w-56 sm:w-64 md:w-72 lg:w-80 flex-shrink-0">
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] group">
              <img
                src={posterImage}
                alt={englishTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Format Badge (Top-Left) */}
              <div className={`absolute top-3 left-3 backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-lg ${badgeColor}`}>
                <span className="bg-black/40 px-1 py-0.2 rounded text-[9px] font-black">{countryCode}</span>
                <span>{typeBadge}</span>
              </div>

              {/* Native Title Watermark (Bottom) */}
              {nativeTitle && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6">
                  <p className="text-[11px] font-mono text-gray-300 font-bold truncate">
                    {nativeTitle}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── INFO & ACTION DETAILS ── */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0">
            
            {/* Top Badges Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <span className={`text-[11px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${badgeColor}`}>
                <span className="bg-black/30 px-1.5 py-0.2 rounded text-[9px] font-black">{countryCode}</span>
                <span>{typeBadge}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
                  isPublishing
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                }`}
              >
                {isPublishing && <Radio size={12} className="animate-pulse" />}
                <span>{isPublishing ? 'PUBLISHING' : 'COMPLETED'}</span>
              </span>

              {scoreDisplay && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span>{scoreDisplay}</span>
                </span>
              )}

              {yearPublished && (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-300">
                  <Calendar size={11} />
                  <span>{yearPublished}</span>
                </span>
              )}

              {authorName && (
                <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] font-bold text-purple-300">
                  <PenTool size={11} />
                  <span>{authorName}</span>
                </span>
              )}

              {chapters && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-bold text-gray-300">
                  <BookOpen size={11} />
                  <span>{chapters} Chapters</span>
                </span>
              )}
            </div>

            {/* Subheader: Native • Romaji */}
            {(nativeTitle || romajiTitle) && (
              <p className="text-xs sm:text-sm text-[#ff4dd2] font-bold mb-2 flex flex-wrap items-center justify-center md:justify-start gap-1.5 font-mono">
                {nativeTitle && <span>{nativeTitle}</span>}
                {nativeTitle && romajiTitle && <span className="text-zinc-500">•</span>}
                {romajiTitle && romajiTitle !== englishTitle && <span className="text-zinc-400">{romajiTitle}</span>}
              </p>
            )}

            {/* Main Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.8)] leading-[1.05] mb-3">
              {englishTitle}
            </h1>

            {/* Genre Pills */}
            {genres.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-4">
                {genres.slice(0, 8).map((g: any, i: number) => {
                  const name = typeof g === 'string' ? g : g.name;
                  return (
                    <span
                      key={`${name}-${i}`}
                      className="bg-white/5 text-gray-300 text-[11px] font-bold px-3 py-1 rounded-full border border-white/10 cursor-default select-none"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Synopsis */}
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-zinc-300 line-clamp-3 mb-6">
              {synopsis}
            </p>

            {/* Action Bar (8 Buttons) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 w-full">
              
              {/* 1. Read Chapters */}
              <button
                onClick={scrollToChapters}
                className="flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-[#ff4dd2]/30 transition-all active:scale-95 cursor-pointer"
              >
                <BookOpen size={16} />
                <span>Read Chapters</span>
              </button>

              {/* 2. Add to Reading List (Watchlist) */}
              <WatchlistDropdown
                animeId={mangaId}
                title={englishTitle}
                image={posterImage}
                type={isNovel ? 'Novel' : isManhwa ? 'Manhwa' : 'Manga'}
              />

              {/* 3. Add to Custom Folder */}
              <button
                onClick={() => setIsListModalOpen(true)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold px-4 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                <ListPlus size={15} className="text-[#ff4dd2]" />
                <span className="hidden sm:inline">Add to Folder</span>
                <span className="sm:hidden">Folder</span>
              </button>

              {/* 4. Mark as Read Toggle */}
              <button
                onClick={toggleWatched}
                className={`flex items-center gap-2 border px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  isWatched
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                }`}
                title={isWatched ? 'Marked as Read' : 'Mark as Read'}
              >
                <Eye size={15} className={isWatched ? 'text-emerald-400' : ''} />
                <span className="hidden sm:inline">{isWatched ? 'Read' : 'Mark Read'}</span>
              </button>

              {/* 5. Like */}
              <button
                onClick={toggleLike}
                className={`p-3 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                  isLiked
                    ? 'border-[#ff4dd2]/60 bg-[#ff4dd2]/20 text-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="Like this title"
              >
                <ThumbsUp size={15} className={isLiked ? 'fill-[#ff4dd2]' : ''} />
              </button>

              {/* 6. Dislike */}
              <button
                onClick={toggleDislike}
                className={`p-3 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                  isDisliked
                    ? 'border-rose-500/60 bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
                title="Dislike this title"
              >
                <ThumbsDown size={15} className={isDisliked ? 'fill-rose-400' : ''} />
              </button>

              {/* 7. Share */}
              <button
                onClick={handleShare}
                className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                title="Share this title"
              >
                {copiedShare ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
              </button>

              {/* 8. Rating Modal */}
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                  userRating
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                }`}
                title="Rate this title"
              >
                <Star size={15} className={userRating ? 'fill-amber-400 text-amber-400' : 'text-amber-400'} />
                <span>{userRating ? `${userRating}/10` : 'Rate'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        animeId={mangaId}
        animeTitle={englishTitle}
        animeImage={posterImage}
        currentRating={userRating}
        onRatingUpdated={(newScore) => setUserRating(newScore)}
      />

      <CustomListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        anime={{
          mal_id: mangaId,
          title: englishTitle,
          image: posterImage,
          format: typeBadge,
          score: malScore ?? undefined,
        }}
      />
    </div>
  );
}
