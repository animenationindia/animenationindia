'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, Loader2, CheckCircle2, AlertCircle, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitUserReview } from '@/app/actions/catalogs';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeId: number;
  animeTitle: string;
  animeImage: string;
  currentRating?: number | null;
  onRatingUpdated: (newScore: number | null, reviewData?: any) => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: '1 - Appalling',
  2: '2 - Horrible',
  3: '3 - Very Bad',
  4: '4 - Bad',
  5: '5 - Average',
  6: '6 - Fine',
  7: '7 - Good',
  8: '8 - Very Good',
  9: '9 - Great',
  10: '10 - Masterpiece',
};

export default function RatingModal({
  isOpen,
  onClose,
  animeId,
  animeTitle,
  animeImage,
  currentRating = null,
  onRatingUpdated,
}: RatingModalProps) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  // Default to empty (null) if no existing rating
  const [selectedScore, setSelectedScore] = useState<number | null>(currentRating || null);
  const [showOptionalReview, setShowOptionalReview] = useState(false);
  const [headline, setHeadline] = useState('');
  const [detailedThoughts, setDetailedThoughts] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentRating) {
      setSelectedScore(currentRating);
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(`ani_user_review_${animeId}`) || 'null');
        if (saved?.score) {
          setSelectedScore(saved.score);
          if (saved.headline) setHeadline(saved.headline);
          if (saved.detailedThoughts) setDetailedThoughts(saved.detailedThoughts);
        } else {
          setSelectedScore(null);
        }
      } catch {
        setSelectedScore(null);
      }
    }
  }, [animeId, currentRating]);

  if (!isOpen) return null;

  const displayScore = hoveredScore !== null ? hoveredScore : selectedScore;

  const handleSaveRating = async (scoreToSave: number) => {
    setLoading(true);
    setMessage(null);

    const userName = (typeof window !== 'undefined' && localStorage.getItem('user_name')) || 'Otaku Critic';
    const userAvatar = (typeof window !== 'undefined' && localStorage.getItem('user_avatar')) || '';

    const reviewPayload = {
      id: Date.now(),
      animeId,
      animeTitle,
      animeImage,
      score: scoreToSave,
      headline: headline.trim(),
      detailedThoughts: detailedThoughts.trim(),
      review: detailedThoughts.trim() || headline.trim() || `Rated ${scoreToSave}/10`,
      tags: [],
      date: new Date().toISOString(),
      user: {
        username: userName,
        image: userAvatar,
      },
      likes: 0,
      dislikes: 0,
    };

    try {
      // 1. Optimistic persistence in localStorage
      localStorage.setItem(`ani_user_review_${animeId}`, JSON.stringify(reviewPayload));

      const allUserReviews = JSON.parse(localStorage.getItem('ani_my_reviews') || '[]');
      const filtered = allUserReviews.filter((r: any) => r.animeId !== animeId);
      filtered.unshift(reviewPayload);
      localStorage.setItem('ani_my_reviews', JSON.stringify(filtered));

      window.dispatchEvent(new CustomEvent('ani-new-review', { detail: reviewPayload }));

      // 2. Submit directly to Neon PostgreSQL
      try {
        await submitUserReview({
          mediaId: animeId,
          mediaType: 'anime',
          score: scoreToSave,
          title: headline.trim() || `${animeTitle} Rating`,
          content: detailedThoughts.trim() || `Rated ${scoreToSave}/10`,
          tags: [],
        });
      } catch (neonErr) {
        console.warn('Neon DB rating note:', neonErr);
      }

      onRatingUpdated(scoreToSave, reviewPayload);
      setMessage({ type: 'success', text: `Rated ${scoreToSave}/10! Saved successfully 🎉` });

      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      setMessage({ type: 'error', text: 'Saved locally!' });
      onRatingUpdated(scoreToSave, reviewPayload);
      setTimeout(() => onClose(), 800);
    } finally {
      setLoading(false);
    }
  };

  const handleClearRating = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(`ani_user_review_${animeId}`);
      setSelectedScore(null);
      onRatingUpdated(null, null);
      setMessage({ type: 'success', text: 'Rating cleared' });
      setTimeout(() => onClose(), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-[#0a0b16] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10 text-white my-8 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-[#ff4dd2]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black tracking-wide text-white uppercase">
                  Rate This Anime
                </h3>
                <p className="text-xs text-gray-400 truncate max-w-[260px]">
                  {animeTitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Message */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold mb-4 animate-in fade-in ${
                message.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* ── 10 EMPTY STARS SECTION ── */}
          <div className="text-center py-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3">
              Tap a star to rate
            </span>

            {/* Stars Row (1 to 10) */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-3 px-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => {
                const isFilled = displayScore !== null && score <= displayScore;
                return (
                  <button
                    key={score}
                    type="button"
                    onMouseEnter={() => setHoveredScore(score)}
                    onMouseLeave={() => setHoveredScore(null)}
                    onClick={() => {
                      setSelectedScore(score);
                      handleSaveRating(score);
                    }}
                    className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                    title={`${score}/10`}
                  >
                    <Star
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-150 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'text-zinc-600 hover:text-amber-400/60'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Score Label Display */}
            <div className="h-6 flex items-center justify-center">
              {displayScore !== null ? (
                <span className="text-sm font-extrabold text-amber-400 font-mono tracking-wide animate-in fade-in">
                  {SCORE_LABELS[displayScore] || `${displayScore}/10`}
                </span>
              ) : (
                <span className="text-xs text-zinc-500 italic">
                  Not rated yet (0/10)
                </span>
              )}
            </div>
          </div>

          {/* Optional Thoughts / Review Collapsible */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowOptionalReview((prev) => !prev)}
              className="text-[11px] font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Add a review headline or thoughts (optional)</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${showOptionalReview ? 'rotate-180' : ''}`}
              />
            </button>

            {showOptionalReview && (
              <div className="mt-3 space-y-3 pt-3 border-t border-white/5 animate-in fade-in duration-200">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. An absolute masterpiece!"
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff4dd2]/60"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Your Thoughts
                  </label>
                  <textarea
                    rows={2}
                    value={detailedThoughts}
                    onChange={(e) => setDetailedThoughts(e.target.value)}
                    placeholder="What did you love about this anime?"
                    className="w-full bg-zinc-950/80 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff4dd2]/60 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            {selectedScore !== null && (
              <button
                type="button"
                onClick={handleClearRating}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Remove rating"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer ml-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => selectedScore && handleSaveRating(selectedScore)}
              disabled={loading || selectedScore === null}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer ${
                selectedScore !== null && !loading
                  ? 'bg-gradient-to-r from-amber-500 to-[#ff4dd2] text-black shadow-amber-500/20 hover:opacity-90 active:scale-95'
                  : 'bg-white/5 border border-white/5 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              <span>{selectedScore ? `Save (${selectedScore}/10)` : 'Select Rating'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
