'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Minus, CheckCircle, RotateCcw, Bookmark } from 'lucide-react';

interface MangaReadingTrackerProps {
  mangaId: number | string;
  mangaTitle: string;
  totalChapters?: number | null;
}

export default function MangaReadingTracker({
  mangaId,
  mangaTitle,
  totalChapters,
}: MangaReadingTrackerProps) {
  const [currentChapter, setCurrentChapter] = useState<number>(0);

  useEffect(() => {
    if (!mangaId) return;
    try {
      const saved = localStorage.getItem(`ani_manga_progress_${mangaId}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          setCurrentChapter(parsed);
        }
      }
    } catch {}
  }, [mangaId]);

  const updateProgress = (val: number) => {
    const clamped = Math.max(0, totalChapters ? Math.min(val, totalChapters) : val);
    setCurrentChapter(clamped);
    try {
      localStorage.setItem(`ani_manga_progress_${mangaId}`, String(clamped));
    } catch {}
  };

  const percentage = totalChapters && totalChapters > 0
    ? Math.min(100, Math.round((currentChapter / totalChapters) * 100))
    : null;

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-4">
      <div className="bg-[#0b0c20]/80 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Info */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#ff4dd2]/15 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2] flex-shrink-0">
            <Bookmark size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
                Reading Progress Tracker
              </h3>
              {percentage !== null && (
                <span className="text-[10px] bg-[#ff4dd2]/20 text-[#ff4dd2] px-2.5 py-0.5 rounded-full font-bold border border-[#ff4dd2]/30">
                  {percentage}% Completed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Saved strictly in your browser (LocalStorage). Track your reading pace.
            </p>
          </div>
        </div>

        {/* Center Progress Bar (if total chapters known) */}
        {totalChapters && totalChapters > 0 && (
          <div className="w-full md:max-w-xs flex-col gap-1 hidden sm:flex">
            <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
              <span>Chapter {currentChapter}</span>
              <span>{totalChapters} Total Chs</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff4dd2] to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateProgress(currentChapter - 1)}
              disabled={currentChapter <= 0}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Previous Chapter"
            >
              <Minus size={15} />
            </button>

            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white font-mono font-bold text-sm min-w-[100px] justify-center">
              <span className="text-gray-400 text-xs font-sans">Ch.</span>
              <input
                type="number"
                min={0}
                max={totalChapters || 9999}
                value={currentChapter}
                onChange={(e) => updateProgress(parseInt(e.target.value, 10) || 0)}
                className="w-12 bg-transparent text-center text-white focus:outline-none focus:text-[#ff4dd2]"
              />
              {totalChapters && <span className="text-gray-500 text-xs">/ {totalChapters}</span>}
            </div>

            <button
              onClick={() => updateProgress(currentChapter + 1)}
              disabled={Boolean(totalChapters && currentChapter >= totalChapters)}
              className="p-2.5 rounded-xl bg-[#ff4dd2]/20 hover:bg-[#ff4dd2]/30 border border-[#ff4dd2]/50 text-[#ff4dd2] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer font-bold"
              title="Next Chapter (+1)"
            >
              <Plus size={15} />
            </button>
          </div>

          {totalChapters && currentChapter < totalChapters && (
            <button
              onClick={() => updateProgress(totalChapters)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer flex items-center gap-1"
              title="Mark All Chapters as Read"
            >
              <CheckCircle size={13} />
              <span className="hidden lg:inline">All Done</span>
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
