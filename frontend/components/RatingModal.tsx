'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
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

const AVAILABLE_TAGS = [
  'Masterpiece',
  'Great Cinematography',
  'Mind Bending',
  'Emotional Rollercoaster',
  'Binge-Worthy',
  'Must Watch',
  'Great Soundtrack',
  'Underrated Gem',
  'Incredible Animation',
  'Epic Fights',
  'Peak Fiction',
];

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
  const [selectedScore, setSelectedScore] = useState<number | null>(currentRating || 9);
  const [headline, setHeadline] = useState('');
  const [detailedThoughts, setDetailedThoughts] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentRating) {
      setSelectedScore(currentRating);
    }
    // Load existing user review for this anime from localStorage if available
    try {
      const savedReviews = JSON.parse(localStorage.getItem(`ani_user_review_${animeId}`) || 'null');
      if (savedReviews) {
        if (savedReviews.score) setSelectedScore(savedReviews.score);
        if (savedReviews.headline) setHeadline(savedReviews.headline);
        if (savedReviews.detailedThoughts) setDetailedThoughts(savedReviews.detailedThoughts);
        if (savedReviews.tags) setSelectedTags(savedReviews.tags);
      }
    } catch {}
  }, [animeId, currentRating]);

  if (!isOpen) return null;

  const displayScore = hoveredScore !== null ? hoveredScore : selectedScore;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePublish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedScore) {
      setMessage({ type: 'error', text: 'Please select a star rating (1 - 10)!' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const userName = localStorage.getItem('user_name') || 'Otaku Critic';
    const userAvatar = localStorage.getItem('user_avatar') || '';
    const token = localStorage.getItem('user_token') || localStorage.getItem('token');

    const reviewPayload = {
      id: Date.now(),
      animeId,
      animeTitle,
      animeImage,
      score: selectedScore,
      headline: headline.trim(),
      detailedThoughts: detailedThoughts.trim(),
      review: detailedThoughts.trim() || headline.trim(),
      tags: selectedTags,
      date: new Date().toISOString(),
      user: {
        username: userName,
        image: userAvatar,
      },
      likes: 0,
      dislikes: 0,
    };

    try {
      // 1. Save in localStorage for immediate optimistic UI & persistence
      localStorage.setItem(`ani_user_review_${animeId}`, JSON.stringify(reviewPayload));
      
      // Also maintain user reviews list in localStorage
      const allUserReviews = JSON.parse(localStorage.getItem('ani_my_reviews') || '[]');
      const filtered = allUserReviews.filter((r: any) => r.animeId !== animeId);
      filtered.unshift(reviewPayload);
      localStorage.setItem('ani_my_reviews', JSON.stringify(filtered));

      // 2. Dispatch custom event so overview tab updates reviews instantly
      window.dispatchEvent(new CustomEvent('ani-new-review', { detail: reviewPayload }));

      // 3. Submit directly to Neon PostgreSQL via Server Action
      try {
        await submitUserReview({
          mediaId: animeId,
          mediaType: 'anime',
          score: selectedScore,
          title: headline.trim() || `${animeTitle} Review`,
          content: detailedThoughts.trim() || headline.trim() || `Rated ${selectedScore}/10`,
          tags: selectedTags,
        });
      } catch (neonErr) {
        console.warn('Neon DB review submission note:', neonErr);
      }

      onRatingUpdated(selectedScore, reviewPayload);
      setMessage({ type: 'success', text: 'Review published successfully! 🎉' });

      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      setMessage({ type: 'error', text: 'Failed to publish review. Saved locally!' });
      onRatingUpdated(selectedScore, reviewPayload);
      setTimeout(() => onClose(), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container (7media Exact Layout with Anime Cyberpunk Polish) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#0e0f14] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-10 text-white my-8 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#ff2a5f]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black tracking-wide text-white flex items-center gap-2">
                  <span>RATE &amp; REVIEW</span>
                </h3>
                <p className="text-xs text-gray-400 truncate max-w-[280px] sm:max-w-xs">
                  {animeTitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message Alert */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold mb-4 animate-in fade-in ${
                message.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handlePublish} className="space-y-5">
            {/* 1. ⭐ YOUR SCORE (10 Stars Interactive) */}
            <div className="text-center py-2 bg-white/[0.02] border border-white/5 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                YOUR SCORE
              </span>
              
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                  const isFilled = displayScore !== null && star <= displayScore;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredScore(star)}
                      onMouseLeave={() => setHoveredScore(null)}
                      onClick={() => setSelectedScore(star)}
                      className="p-1 hover:scale-125 transition-transform duration-150 cursor-pointer focus:outline-none"
                    >
                      <Star
                        size={22}
                        className={`transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="text-sm font-extrabold text-amber-400">
                {displayScore ? (
                  <span>
                    <strong className="text-base text-white">{displayScore}</strong> / 10{' '}
                    <span className="text-xs text-gray-400 font-semibold ml-1">
                      ({SCORE_LABELS[displayScore]?.split(' - ')[1] || ''})
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Tap a star to rate</span>
                )}
              </div>
            </div>

            {/* 2. 📝 REVIEW HEADLINE */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                REVIEW HEADLINE
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. An absolute masterpiece with stunning visuals"
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-[#141520] text-white text-xs outline-none focus:border-amber-400 focus:bg-[#181a28] transition placeholder-gray-500"
              />
            </div>

            {/* 3. 💭 DETAILED THOUGHTS */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                DETAILED THOUGHTS
              </label>
              <textarea
                rows={4}
                value={detailedThoughts}
                onChange={(e) => setDetailedThoughts(e.target.value)}
                placeholder="What did you love about the story, acting, direction, or music?"
                className="w-full p-3.5 rounded-xl border border-white/10 bg-[#141520] text-white text-xs outline-none focus:border-amber-400 focus:bg-[#181a28] transition placeholder-gray-500 resize-none leading-relaxed"
              />
            </div>

            {/* 4. 🏷️ ADD TAGS */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-2">
                ADD TAGS
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer select-none border ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20 scale-105'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Action Buttons (Cancel + Publish Review) */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-black" />
                    <span>PUBLISHING...</span>
                  </>
                ) : (
                  <>
                    <span>PUBLISH REVIEW</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
