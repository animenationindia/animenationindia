'use client';

import { useState, useEffect } from 'react';
import { Star, X, Check, Trash2 } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeId: number;
  animeTitle: string;
  animeImage: string;
  currentRating?: number | null;
  onRatingUpdated: (newScore: number | null) => void;
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
  const [selectedScore, setSelectedScore] = useState<number | null>(currentRating);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedScore(currentRating);
  }, [currentRating]);

  if (!isOpen) return null;

  const displayScore = hoveredScore !== null ? hoveredScore : selectedScore;

  const handleSave = async (scoreToSave: number) => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');

    if (!token || !userId) {
      setMessage('Please log in to rate this anime!');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          animeId,
          score: scoreToSave,
          animeTitle,
          animeImage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSelectedScore(scoreToSave);
        onRatingUpdated(scoreToSave);
        setMessage(`Saved: ${scoreToSave}/10!`);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setMessage(data.message || 'Failed to save rating');
      }
    } catch {
      setMessage('Network error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/ratings/${animeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSelectedScore(null);
        onRatingUpdated(null);
        setMessage('Rating removed.');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch {
      setMessage('Error removing rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e0f1d] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Glow Ambient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff4dd2]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#6366f1]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header with Poster & Title */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src={animeImage || '/placeholder-poster.png'}
            alt={animeTitle}
            className="w-16 h-22 object-cover rounded-xl border border-white/10 shadow-lg"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff4dd2] bg-[#ff4dd2]/10 px-2 py-0.5 rounded-md">
              Rate Anime
            </span>
            <h3 className="text-base font-bold text-white truncate mt-1">{animeTitle}</h3>
            <p className="text-xs text-gray-400 mt-0.5">How would you rate this anime?</p>
          </div>
        </div>

        {/* Score Display Banner */}
        <div className="bg-[#15162c] border border-white/5 rounded-2xl p-4 text-center mb-6">
          <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
            <Star
              size={28}
              className={`${
                displayScore ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
              } transition-colors`}
            />
            <span>{displayScore ? `${displayScore} / 10` : 'Select a Score'}</span>
          </div>
          <p className="text-xs font-semibold text-[#ff4dd2] mt-1 tracking-wide">
            {displayScore ? SCORE_LABELS[displayScore] : 'Hover or tap a star below'}
          </p>
        </div>

        {/* 10 Stars Row */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-6 py-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
            const isFilled = displayScore !== null && star <= displayScore;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredScore(star)}
                onMouseLeave={() => setHoveredScore(null)}
                onClick={() => handleSave(star)}
                disabled={loading}
                className="group relative p-1 transition-transform hover:scale-125 active:scale-95 focus:outline-none"
              >
                <Star
                  size={24}
                  className={`transition-all duration-150 ${
                    isFilled
                      ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'text-gray-600 group-hover:text-amber-300'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Status Message */}
        {message && (
          <div className="mb-4 text-center text-xs font-bold py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center gap-2">
            <Check size={14} className="text-emerald-400" />
            {message}
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
          {selectedScore !== null && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-colors"
            >
              <Trash2 size={14} /> Remove Rating
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
