'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronDown, Check, Loader2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWatchlist } from '../hooks/useWatchlist';

interface WatchlistDropdownProps {
  animeId: number | string;
  title: string;
  image: string;
  variant?: 'default' | 'icon';
  type?: string;
}

export default function WatchlistDropdown({ animeId, title, image, variant = 'default', type = 'Anime' }: WatchlistDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { getItemStatus, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const status = getItemStatus(animeId);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    setIsOpen(false);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id') || localStorage.getItem('userId');
      
      if (!token || !userId) {
        alert("Please login first to manage your Watchlist!");
        router.push('/auth');
        return;
      }

      if (newStatus === 'REMOVE') {
        await removeFromWatchlist(animeId);
      } else {
        await addToWatchlist({
          animeId,
          title,
          image,
          status: newStatus,
          type,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const isBook = ['manga', 'novel', 'light novel', 'lightnovel', 'manhwa', 'manhua'].includes((type || '').toLowerCase());

  const STATUS_CONFIG: Record<string, { label: string; bookLabel: string; dot: string; bg: string }> = {
    WATCHING: { label: 'Watching', bookLabel: 'Reading', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]', bg: 'hover:bg-emerald-500/10' },
    PLAN_TO_WATCH: { label: 'Plan to Watch', bookLabel: 'Plan to Read', dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]', bg: 'hover:bg-sky-500/10' },
    COMPLETED: { label: 'Completed', bookLabel: 'Completed', dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]', bg: 'hover:bg-purple-500/10' },
    ON_HOLD: { label: 'On Hold', bookLabel: 'On Hold', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]', bg: 'hover:bg-amber-500/10' },
    DROPPED: { label: 'Dropped', bookLabel: 'Dropped', dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]', bg: 'hover:bg-rose-500/10' },
  };

  const getStatusLabel = (statusKey: string) => {
    const config = STATUS_CONFIG[statusKey];
    if (config) return isBook ? config.bookLabel : config.label;
    return statusKey.replace(/_/g, ' ');
  };

  const STATUS_OPTIONS = ['WATCHING', 'PLAN_TO_WATCH', 'COMPLETED', 'ON_HOLD', 'DROPPED'];

  const getButtonContent = () => {
    if (variant === 'icon') {
      if (isUpdating) return <Loader2 size={18} className="animate-spin text-[#ff4dd2]" />;
      return <Bookmark size={18} className={`md:w-5 md:h-5 ${status !== 'ADD' ? 'fill-current text-[#ff4dd2]' : 'text-[#ff4dd2] group-hover/btn:fill-current'}`} />;
    }

    if (isUpdating) return <><Loader2 size={15} className="animate-spin" /> Updating...</>;
    if (status === 'ADD') return <><Plus size={16} /> {isBook ? 'Add to List' : 'Add to Watchlist'}</>;
    return <><Check size={15} className="text-[#ff4dd2]" /> {getStatusLabel(status)}</>;
  };

  const isInList = Boolean(status && status.toUpperCase() !== 'ADD');

  return (
    <div className={`relative ${variant === 'icon' ? 'w-auto' : 'w-full sm:w-auto'}`} ref={dropdownRef}>
      {/* 🔴 Main Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={variant === 'icon'
          ? `w-[44px] h-[44px] md:w-[48px] md:h-[48px] flex-shrink-0 flex items-center justify-center border transition-colors group/btn rounded-2xl disabled:opacity-70 cursor-pointer ${
              isInList
                ? 'border-[#ff4dd2] bg-[#ff4dd2]/10 text-[#ff4dd2] hover:bg-[#ff4dd2]/20'
                : 'border-[#ff4dd2] hover:bg-[#ff4dd2] hover:text-white'
            }`
          : `w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg disabled:opacity-70 cursor-pointer ${
              !isInList
                ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-white' 
                : 'bg-[#ff4dd2]/15 border border-[#ff4dd2]/60 text-white shadow-[#ff4dd2]/20'
            }`
        }
      >
        {getButtonContent()}
        {variant !== 'icon' && <ChevronDown size={14} className={`ml-0.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#ff4dd2]' : 'opacity-70'}`} />}
      </motion.button>

      {/* 🔽 Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${
              variant === 'icon' 
                ? 'bottom-full left-0 mb-2 w-56' 
                : 'top-full left-0 sm:left-auto sm:right-0 mt-2 w-full sm:w-60'
            } bg-[#0c0d1e]/98 border border-[#ff4dd2]/30 rounded-2xl overflow-hidden z-[200] shadow-[0_15px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl p-1.5`}
          >
            <div className="flex flex-col gap-0.5">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt;
                const cfg = STATUS_CONFIG[opt];
                return (
                  <button
                    key={opt}
                    onClick={() => updateStatus(opt)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-bold transition-all flex items-center justify-between group cursor-pointer rounded-xl ${
                      isSelected ? 'bg-[#ff4dd2]/20 text-white font-black' : 'text-gray-300 hover:text-white ' + (cfg?.bg || 'hover:bg-white/5')
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg?.dot || 'bg-gray-400'}`} />
                      <span className="truncate">{getStatusLabel(opt)}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-[#ff4dd2] flex-shrink-0" />}
                  </button>
                );
              })}
              
              {/* ❌ Remove Option */}
              {isInList && (
                <div className="pt-1 mt-1 border-t border-white/10">
                  <button
                    onClick={() => updateStatus('REMOVE')}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-black text-rose-400 hover:text-rose-100 hover:bg-rose-500/20 transition-all flex items-center gap-2.5 cursor-pointer rounded-xl group"
                  >
                    <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 border border-rose-500/40 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <X size={12} strokeWidth={3} />
                    </div>
                    <span>{isBook ? 'Remove from List' : 'Remove from Watchlist'}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}