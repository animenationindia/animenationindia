'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Tv,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  PenLine,
  Sparkles,
  Tag
} from 'lucide-react';
import ReadMoreText from './ReadMoreText';
import AnimeThemeSongs from './AnimeThemeSongs';
import NextEpisodeCountdown from './NextEpisodeCountdown';
import RatingModal from './RatingModal';
import { NormalizedTheme } from '../lib/animethemes-api';
import { TMDBAnimeData } from '../lib/tmdb-api';

interface AnimeOverviewTabProps {
  anime: any;
  extraInfo?: any;
  characters?: any[];
  themes?: NormalizedTheme[];
  tmdbData?: TMDBAnimeData | null;
  reviews?: any[];
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

export default function AnimeOverviewTab({ 
  anime, 
  extraInfo, 
  characters = [], 
  themes = [], 
  tmdbData = null, 
  reviews = []
}: AnimeOverviewTabProps) {
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<number | string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const animeId = anime.mal_id || anime.id || extraInfo?.idMal || extraInfo?.id;
  const englishTitle = anime.title_english || anime.title || 'Anime';
  const posterImage = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/placeholder-poster.png';

  // 1. Manage Combined Reviews List (API reviews + User published reviews from localStorage)
  const [reviewsList, setReviewsList] = useState<any[]>(reviews);

  useEffect(() => {
    let combined = [...reviews];
    try {
      const savedUserReview = JSON.parse(localStorage.getItem(`ani_user_review_${animeId}`) || 'null');
      if (savedUserReview) {
        combined = [savedUserReview, ...combined.filter((r: any) => r.id !== savedUserReview.id)];
      }
    } catch {}
    setReviewsList(combined);

    const handleNewReview = (e: any) => {
      if (e.detail && e.detail.animeId === animeId) {
        setReviewsList((prev) => [e.detail, ...prev.filter((r: any) => r.id !== e.detail.id)]);
      }
    };

    window.addEventListener('ani-new-review', handleNewReview);
    return () => window.removeEventListener('ani-new-review', handleNewReview);
  }, [animeId, reviews]);

  // 2. Interactive Like / Dislike State per review
  const [votes, setVotes] = useState<Record<string, { userVote: 'like' | 'dislike' | null; likes: number; dislikes: number }>>({});

  useEffect(() => {
    const initialVotes: Record<string, { userVote: 'like' | 'dislike' | null; likes: number; dislikes: number }> = {};
    reviewsList.forEach((rev, idx) => {
      const key = String(rev.id || idx);
      const savedVote = localStorage.getItem(`ani_review_vote_${key}`);
      const baseLikes = rev.likes || Math.floor(Math.random() * 12) + 2;
      const baseDislikes = rev.dislikes || (Math.random() > 0.7 ? 1 : 0);

      initialVotes[key] = {
        userVote: savedVote === 'like' || savedVote === 'dislike' ? savedVote : null,
        likes: savedVote === 'like' ? baseLikes + 1 : baseLikes,
        dislikes: savedVote === 'dislike' ? baseDislikes + 1 : baseDislikes,
      };
    });
    setVotes(initialVotes);
  }, [reviewsList]);

  const handleVote = (revId: string | number, type: 'like' | 'dislike') => {
    const key = String(revId);
    setVotes((prev) => {
      const current = prev[key] || { userVote: null, likes: 0, dislikes: 0 };
      let newVote: 'like' | 'dislike' | null = type;
      let newLikes = current.likes;
      let newDislikes = current.dislikes;

      if (current.userVote === type) {
        // Toggle OFF
        newVote = null;
        if (type === 'like') newLikes = Math.max(0, newLikes - 1);
        if (type === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
        localStorage.removeItem(`ani_review_vote_${key}`);
      } else {
        // Switch Vote
        if (current.userVote === 'like') newLikes = Math.max(0, newLikes - 1);
        if (current.userVote === 'dislike') newDislikes = Math.max(0, newDislikes - 1);

        if (type === 'like') newLikes += 1;
        if (type === 'dislike') newDislikes += 1;
        localStorage.setItem(`ani_review_vote_${key}`, type);
      }

      return {
        ...prev,
        [key]: {
          userVote: newVote,
          likes: newLikes,
          dislikes: newDislikes,
        },
      };
    });
  };

  const synopsis = anime.synopsis || extraInfo?.description || 'No detailed synopsis available.';

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
      
      {/* 👈 Left Column: Main Content (Synopsis, Characters, Reviews) */}
      <div className="lg:col-span-8 space-y-8">
        
        {/* 📖 Synopsis Card */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Info size={18} />
            </div>
            <h3 className="text-xl font-bold text-white">Synopsis &amp; Storyline</h3>
          </div>
          
          <div className="text-gray-300 text-sm sm:text-base leading-relaxed font-normal">
            <ReadMoreText text={synopsis} maxLength={380} />
          </div>
        </div>

        {/* 👥 Characters & Voice Actors Section */}
        {characters.length > 0 && (
          <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Characters &amp; Voice Actors</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Main cast and Japanese Seiyuu mappings</p>
                </div>
              </div>

              {characters.length > 6 && (
                <button
                  onClick={() => setShowAllCharacters(!showAllCharacters)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#ff4dd2] hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer"
                >
                  {showAllCharacters ? <Minus size={14} /> : <Plus size={14} />}
                  <span>{showAllCharacters ? 'Show Less' : `View All (${characters.length})`}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {displayCharacters.map((c: any, index: number) => {
                const charId = c.character?.mal_id || c.id || c.character?.id;
                const charName = c.character?.name || c.name || 'Character';
                const charImage = 
                  c.character?.images?.webp?.image_url || 
                  c.character?.images?.jpg?.image_url || 
                  c.image?.large ||
                  '/placeholder-avatar.png';

                const japaneseVA = c.voice_actors?.find((va: any) => va.language === 'Japanese') || c.voiceActors?.[0];
                const vaId = japaneseVA?.person?.mal_id || japaneseVA?.id;
                const vaName = japaneseVA?.person?.name || japaneseVA?.name?.full || japaneseVA?.name;
                const vaImage = 
                  japaneseVA?.person?.images?.jpg?.image_url || 
                  japaneseVA?.image?.large || 
                  '/placeholder-avatar.png';

                return (
                  <div
                    key={`${charId}-${index}`}
                    className="bg-[#0e0f1d] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-white/15 transition-all group"
                  >
                    {/* Character Column */}
                    <Link
                      href={charId ? `/character/${charId}` : '#'}
                      className="flex items-center gap-3 min-w-0 flex-1 group/char"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-[#121326] group-hover/char:border-[#ff4dd2]/50 transition-colors">
                        <img
                          src={charImage}
                          alt={charName}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover group-hover/char:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white truncate group-hover/char:text-[#ff4dd2] transition-colors">
                          {charName}
                        </p>
                        <span className="text-[10px] text-gray-400 capitalize block">
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
                        <div className="min-w-0 max-w-[85px]">
                          <p className="text-xs font-bold text-gray-300 truncate group-hover/va:text-[#ff4dd2] transition-colors">
                            {vaName}
                          </p>
                          <span className="text-[9px] text-[#ff4dd2] font-semibold block">
                            Japanese VA
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#121326] group-hover/va:border-[#ff4dd2]/50 transition-colors">
                          <img
                            src={vaImage}
                            alt={vaName || 'Voice Actor'}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                            className="w-full h-full object-cover group-hover/va:scale-110 transition-transform duration-500"
                          />
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 💬 Community Reviews & Critiques Section */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-wide">Community Reviews &amp; Critiques</h3>
                <p className="text-xs text-gray-400 mt-0.5">Honest ratings, headlines, and detailed thoughts from otakus</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                <PenLine size={14} />
                <span>Write a Review</span>
              </button>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300">
                {reviewsList.length} {reviewsList.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
          </div>

          {reviewsList.length === 0 ? (
            <div className="text-center py-10 px-4 bg-[#0e0f1d] border border-white/5 rounded-2xl">
              <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto mb-2.5 animate-pulse" />
              <p className="text-sm font-bold text-white mb-1">No reviews yet for this anime</p>
              <p className="text-xs text-gray-400 mb-4">Be the first otaku to share your score, headline, and thoughts!</p>
              <button
                onClick={() => setIsRateModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Rate &amp; Write Review
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(showAllReviews ? reviewsList : reviewsList.slice(0, 4)).map((rev: any, idx: number) => {
                const key = String(rev.id || idx);
                const isExpanded = expandedReviewId === key;
                const headlineText = rev.headline || '';
                const reviewText = rev.detailedThoughts || rev.review || '';
                const isLong = reviewText.length > 280;
                const displayText = isExpanded || !isLong ? reviewText : reviewText.slice(0, 280) + '...';

                const voteState = votes[key] || { userVote: null, likes: 0, dislikes: 0 };

                return (
                  <div 
                    key={key} 
                    className="bg-[#0e0f1d] border border-white/5 rounded-2xl p-5 hover:border-white/15 transition-all space-y-3.5 shadow-sm"
                  >
                    {/* Header: User Profile + Score Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-[#ff2a5f]/20 border border-white/10 flex-shrink-0 flex items-center justify-center">
                          {rev.user?.image ? (
                            <img src={rev.user.image} alt={rev.user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-sm text-amber-400">
                              {rev.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate">
                            {rev.user?.username || 'Anime Critic'}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">
                            {rev.date ? new Date(rev.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Verified Critic'}
                          </span>
                        </div>
                      </div>

                      {rev.score && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-sm flex-shrink-0 shadow-sm">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          <span>{rev.score}/10</span>
                        </div>
                      )}
                    </div>

                    {/* Review Headline */}
                    {headlineText && (
                      <h4 className="text-base font-black text-white leading-snug tracking-tight">
                        &ldquo;{headlineText}&rdquo;
                      </h4>
                    )}

                    {/* Detailed Thoughts */}
                    {reviewText && (
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {displayText}
                      </p>
                    )}

                    {/* Read More Button */}
                    {isLong && (
                      <button
                        onClick={() => setExpandedReviewId(isExpanded ? null : key)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                      >
                        {isExpanded ? 'Read Less' : 'Read Full Review'}
                      </button>
                    )}

                    {/* Tags Pills */}
                    {rev.tags && Array.isArray(rev.tags) && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rev.tags.map((tag: string, tIdx: number) => (
                          <span 
                            key={`${tag}-${tIdx}`} 
                            className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/5 text-amber-300/90 border border-amber-500/20 shadow-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Like & Dislike Interactive Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        {/* 👍 Like Button */}
                        <button
                          onClick={() => handleVote(key, 'like')}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                            voteState.userVote === 'like'
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold shadow-sm shadow-emerald-500/20'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                          }`}
                        >
                          <ThumbsUp size={13} className={voteState.userVote === 'like' ? 'fill-emerald-400' : ''} />
                          <span>{voteState.likes}</span>
                        </button>

                        {/* 👎 Dislike Button */}
                        <button
                          onClick={() => handleVote(key, 'dislike')}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border transition-all cursor-pointer ${
                            voteState.userVote === 'dislike'
                              ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold shadow-sm shadow-rose-500/20'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                          }`}
                        >
                          <ThumbsDown size={13} className={voteState.userVote === 'dislike' ? 'fill-rose-400' : ''} />
                          <span>{voteState.dislikes}</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-gray-500 font-medium">
                        Helpful critique
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {reviewsList.length > 4 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              {showAllReviews ? 'Show Fewer Reviews' : `Show All ${reviewsList.length} Reviews`}
            </button>
          )}
        </div>

      </div>

      {/* 👉 Right Column: Sidebar Widgets (Live Next Airing, Where to Watch, Stats Info) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* ⏰ Live Next Episode Countdown Card */}
        {nextAiring && (
          <NextEpisodeCountdown nextAiring={nextAiring} variant="card" />
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

      {/* Rate & Review Modal */}
      <RatingModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        animeId={animeId}
        animeTitle={englishTitle}
        animeImage={posterImage}
        onRatingUpdated={(newScore, newReview) => {
          if (newReview) {
            setReviewsList((prev) => [newReview, ...prev.filter((r) => r.id !== newReview.id)]);
          }
        }}
      />

    </div>
  );
}
