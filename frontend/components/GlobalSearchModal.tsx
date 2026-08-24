'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, Star, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAnimeAniList } from '../lib/api';

interface SearchResultItem {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage: {
    extraLarge?: string;
    large: string;
  };
  averageScore: number | null;
  format: string | null;
  status: string | null;
  episodes?: number | null;
  seasonYear?: number | null;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live search debounced fetch
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const pageData = await searchAnimeAniList(query.trim(), 1);
        const list = (pageData?.media || []).slice(0, 8);
        setResults(list);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Handle Keyboard Arrows Navigation & Enter Selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        const selected = results[selectedIndex];
        const targetId = selected.idMal || selected.id;
        onClose();
        router.push(`/series/${targetId}`);
      } else if (query.trim()) {
        onClose();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const getFormatBadge = (fmt?: string | null) => {
    const f = (fmt || 'TV').toUpperCase();
    if (f === 'MOVIE') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    if (f === 'MANGA') return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
    if (f === 'OVA' || f === 'SPECIAL') return 'bg-sky-500/20 text-sky-300 border border-sky-500/40';
    return 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-24 px-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Search Card Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-[#0c0d1e] border border-[#ff4dd2]/40 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col"
          >
            {/* 🔍 Search Input Bar */}
            <div className="flex items-center gap-3.5 px-6 py-4.5 border-b border-white/10 bg-white/5">
              <Search size={22} className="text-[#ff4dd2] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search anime by title, character, or studio..."
                className="w-full bg-transparent text-white text-base md:text-lg font-bold placeholder-gray-500 outline-none"
              />
              {loading && <Loader2 size={20} className="animate-spin text-[#ff4dd2] shrink-0" />}
              {query && !loading && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* 📋 Live Results List */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar p-2">
              {results.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {results.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    const title = item.title.english || item.title.romaji || 'Anime Title';
                    const targetId = item.idMal || item.id;
                    const cover = item.coverImage.extraLarge || item.coverImage.large || '/placeholder-poster.png';

                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => {
                          onClose();
                          router.push(`/series/${targetId}`);
                        }}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2]/60 shadow-[0_4px_20px_rgba(255,77,210,0.2)]'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 pr-3">
                          <div className="w-12 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                            <img src={cover} alt={title} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getFormatBadge(item.format)}`}>
                                {item.format || 'TV'}
                              </span>
                              {item.averageScore && (
                                <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5">
                                  <Star size={11} className="fill-amber-400" /> {(item.averageScore / 10).toFixed(1)}
                                </span>
                              )}
                              {item.seasonYear && (
                                <span className="text-[10px] text-gray-400 font-semibold">
                                  {item.seasonYear}
                                </span>
                              )}
                            </div>
                            <p className={`text-sm font-extrabold truncate ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                              {title}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 pr-2">
                          <ArrowRight size={16} className={`transition-transform ${isSelected ? 'text-[#ff4dd2] translate-x-1' : 'text-gray-600'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query.trim() && !loading ? (
                <div className="py-12 text-center text-gray-400">
                  <p className="text-sm font-bold text-gray-300">No instant results for &quot;{query}&quot;</p>
                  <p className="text-xs text-gray-500 mt-1">Press Enter to search all database filters</p>
                </div>
              ) : (
                <div className="py-8 px-6 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 mb-2">
                    <Sparkles size={14} className="text-[#ff4dd2]" /> Quick Navigation
                  </div>
                  <p className="text-xs text-gray-500">
                    Type any title to instantly find anime, seasons, movies, and manga.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Shortcuts Info */}
            <div className="px-6 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-gray-400 font-semibold">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>Esc Close</span>
              </div>
              {query.trim() && (
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                  }}
                  className="text-[#ff4dd2] hover:underline font-bold cursor-pointer"
                >
                  View full search results →
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
