'use client';

import React from 'react';
import { Search, X, RotateCcw, SlidersHorizontal, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterState {
  search: string;
  genre: string;
  year: string;
  season: string;
  format: string;
  status: string;
  minScore: string;
  length: string;
  sort: string;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  genre: '',
  year: '',
  season: '',
  format: 'ALL',
  status: '',
  minScore: '',
  length: '',
  sort: 'POPULARITY_DESC',
};

export const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

export const POPULAR_QUICK_GENRES = [
  { name: 'Action', emoji: '🔥' },
  { name: 'Romance', emoji: '🌸' },
  { name: 'Fantasy', emoji: '⚔️' },
  { name: 'Comedy', emoji: '🎭' },
  { name: 'Sci-Fi', emoji: '🚀' },
  { name: 'Supernatural', emoji: '👻' },
  { name: 'Mystery', emoji: '🔍' },
  { name: 'Sports', emoji: '⚽' },
];

export const YEARS = Array.from({ length: 45 }, (_, i) => String(new Date().getFullYear() + 1 - i));

export const SEASONS = [
  { value: 'WINTER', label: 'Winter' },
  { value: 'SPRING', label: 'Spring' },
  { value: 'SUMMER', label: 'Summer' },
  { value: 'FALL', label: 'Fall' },
];

export const FORMATS = [
  { value: 'ALL', label: 'All Formats' },
  { value: 'TV', label: 'TV Series' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Special' },
];

export const STATUSES = [
  { value: 'RELEASING', label: 'Airing' },
  { value: 'FINISHED', label: 'Finished' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
];

export const SCORES = [
  { value: '90', label: '90%+ (Masterpiece)' },
  { value: '80', label: '80%+ (Superhit)' },
  { value: '70', label: '70%+ (Good)' },
  { value: '60', label: '60%+ (Above Avg)' },
];

export const LENGTHS = [
  { value: 'short', label: 'Short (<13 eps)' },
  { value: 'medium', label: 'Medium (13-26 eps)' },
  { value: 'long', label: 'Long (26+ eps)' },
];

export const SORTS = [
  { value: 'POPULARITY_DESC', label: 'Popularity' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'SCORE_DESC', label: 'Highest Rated' },
  { value: 'START_DATE_DESC', label: 'Newest' },
  { value: 'TITLE_ENGLISH_DESC', label: 'Title (A-Z)' },
];

const selectClass =
  'h-10 rounded-xl border border-white/10 bg-zinc-950/80 px-3.5 text-xs font-semibold text-zinc-200 outline-none transition-all hover:border-white/20 focus:border-[#ff4dd2] focus:ring-1 focus:ring-[#ff4dd2]/40 cursor-pointer';

interface BrowseFilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onReset: () => void;
  totalCount?: number;
  isFallbackMAL?: boolean;
}

export default function BrowseFilterBar({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  isFallbackMAL = false,
}: BrowseFilterBarProps) {
  // ── Local Search State (Instant 0ms typing response without UI thread lag) ──
  const [localSearch, setLocalSearch] = React.useState(filters.search);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Sync from props if filters.search changes externally (e.g. Reset or Chip Removal)
  React.useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounce search update to parent (300ms)
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange('search', localSearch);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, filters.search, onFilterChange]);

  // Prevent background scroll when mobile drawer is open
  React.useEffect(() => {
    if (isDrawerOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isDrawerOpen]);

  const handleClearSearch = () => {
    setLocalSearch('');
    onFilterChange('search', '');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFilterChange('search', localSearch);
    }
  };

  // Count active filters (ignoring default format ALL and default sort POPULARITY_DESC)
  const activeCount = [
    Boolean(filters.search.trim()),
    Boolean(filters.genre),
    Boolean(filters.year),
    Boolean(filters.season),
    Boolean(filters.format && filters.format !== 'ALL'),
    Boolean(filters.status),
    Boolean(filters.minScore),
    Boolean(filters.length),
    Boolean(filters.sort && filters.sort !== 'POPULARITY_DESC'),
  ].filter(Boolean).length;

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl p-4 sm:p-6 shadow-2xl mb-8 space-y-4">
        {/* ── 🔍 Top Row: Full-Width Search Input ── */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            size={16}
            aria-hidden="true"
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anime by title (e.g. Solo Leveling, Demon Slayer, Jujutsu Kaisen)..."
            aria-label="Search anime by title"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950/80 pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff4dd2]/60 focus:ring-1 focus:ring-[#ff4dd2]/40 transition-all shadow-inner"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* ── 🏷️ Quick Trending Genre Pills (Horizontal Scroll) ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Popular:
          </span>
          {POPULAR_QUICK_GENRES.map((g) => {
            const isSelected = filters.genre === g.name;
            return (
              <button
                key={g.name}
                type="button"
                onClick={() => onFilterChange('genre', isSelected ? '' : g.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.4)]'
                    : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{g.emoji}</span>
                <span>{g.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── 📱 MOBILE CONTROL BAR (< lg): Compact 1-Row Refine & Sort ── */}
        <div className="flex lg:hidden items-center justify-between gap-2 pt-1">
          {/* Open Filter Drawer Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex-1 h-10 inline-flex items-center justify-center gap-2 px-3.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all active:scale-98 cursor-pointer"
          >
            <SlidersHorizontal size={14} className="text-[#ff4dd2]" />
            <span>Filters & Refine</span>
            {activeCount > 0 && (
              <span className="bg-[#ff4dd2] text-black text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight">
                {activeCount}
              </span>
            )}
          </button>

          {/* Quick Sort Dropdown on Mobile */}
          <select
            id="mobile-quick-sort"
            className="h-10 rounded-xl border border-[#ff4dd2]/30 bg-zinc-950/80 px-2.5 text-xs font-semibold text-[#ff4dd2] outline-none max-w-[140px] truncate cursor-pointer"
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            aria-label="Sort by"
          >
            {SORTS.map((so) => (
              <option key={so.value} value={so.value}>
                {so.label}
              </option>
            ))}
          </select>

          {/* Quick Reset on Mobile if filters active */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/40 active:scale-95 transition-all cursor-pointer"
              title="Reset all filters"
              aria-label="Reset all filters"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* ── 💻 DESKTOP FILTER ROW (≥ lg): Inline 8 Dropdowns (Otaku Insider Style) ── */}
        <div className="hidden lg:flex flex-wrap items-center gap-2.5 pt-1">
          {/* Genre */}
          <select
            id="filter-genre"
            className={selectClass}
            value={filters.genre}
            onChange={(e) => onFilterChange('genre', e.target.value)}
            aria-label="Filter by genre"
          >
            <option value="">All Genres</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            id="filter-year"
            className={selectClass}
            value={filters.year}
            onChange={(e) => onFilterChange('year', e.target.value)}
            aria-label="Filter by year"
          >
            <option value="">Any Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Season */}
          <select
            id="filter-season"
            className={selectClass}
            value={filters.season}
            onChange={(e) => onFilterChange('season', e.target.value)}
            aria-label="Filter by season"
          >
            <option value="">Any Season</option>
            {SEASONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Format */}
          <select
            id="filter-format"
            className={selectClass}
            value={filters.format}
            onChange={(e) => onFilterChange('format', e.target.value)}
            aria-label="Filter by format"
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            id="filter-status"
            className={selectClass}
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">Any Status</option>
            {STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Score */}
          <select
            id="filter-score"
            className={selectClass}
            value={filters.minScore}
            onChange={(e) => onFilterChange('minScore', e.target.value)}
            aria-label="Filter by minimum score"
          >
            <option value="">Any Score</option>
            {SCORES.map((sc) => (
              <option key={sc.value} value={sc.value}>
                {sc.label}
              </option>
            ))}
          </select>

          {/* Length */}
          <select
            id="filter-length"
            className={selectClass}
            value={filters.length}
            onChange={(e) => onFilterChange('length', e.target.value)}
            aria-label="Filter by episode length"
          >
            <option value="">Any Length</option>
            {LENGTHS.map((len) => (
              <option key={len.value} value={len.value}>
                {len.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            id="filter-sort"
            className={`${selectClass} border-[#ff4dd2]/30 text-[#ff4dd2]`}
            value={filters.sort}
            onChange={(e) => onFilterChange('sort', e.target.value)}
            aria-label="Sort by"
          >
            {SORTS.map((so) => (
              <option key={so.value} value={so.value}>
                Sort: {so.label}
              </option>
            ))}
          </select>

          {/* Desktop Reset Button */}
          <button
            type="button"
            onClick={onReset}
            disabled={activeCount === 0}
            className={`h-10 inline-flex items-center gap-1.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ml-auto ${
              activeCount > 0
                ? 'bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/40 hover:bg-[#ff4dd2]/25 shadow-sm active:scale-95'
                : 'bg-white/5 border border-white/5 text-zinc-500 cursor-not-allowed opacity-50'
            }`}
            title="Reset all filters"
          >
            <RotateCcw size={13} className={activeCount > 0 ? 'text-[#ff4dd2]' : 'text-zinc-500'} />
            <span>Reset</span>
          </button>
        </div>

        {/* ── 🏷️ Active Filter Badges (Quick Removal) ── */}
        {activeCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
            <span className="text-[11px] font-semibold text-zinc-400">Active Filters:</span>
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white/10 text-white border border-white/15">
                <span>&ldquo;{filters.search}&rdquo;</span>
                <button onClick={handleClearSearch} className="hover:text-[#ff4dd2] cursor-pointer" aria-label="Clear search">
                  <X size={11} />
                </button>
              </span>
            )}
            {filters.genre && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30 font-medium">
                <span>{filters.genre}</span>
                <button onClick={() => onFilterChange('genre', '')} className="hover:text-white cursor-pointer" aria-label="Clear genre">
                  <X size={11} />
                </button>
              </span>
            )}
            {filters.year && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white/10 text-white border border-white/15">
                <span>{filters.year}</span>
                <button onClick={() => onFilterChange('year', '')} className="hover:text-[#ff4dd2] cursor-pointer" aria-label="Clear year">
                  <X size={11} />
                </button>
              </span>
            )}
            {filters.season && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white/10 text-white border border-white/15">
                <span>{SEASONS.find((s) => s.value === filters.season)?.label || filters.season}</span>
                <button onClick={() => onFilterChange('season', '')} className="hover:text-[#ff4dd2] cursor-pointer" aria-label="Clear season">
                  <X size={11} />
                </button>
              </span>
            )}
            {filters.format && filters.format !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white/10 text-white border border-white/15">
                <span>{FORMATS.find((f) => f.value === filters.format)?.label || filters.format}</span>
                <button onClick={() => onFilterChange('format', 'ALL')} className="hover:text-[#ff4dd2] cursor-pointer" aria-label="Clear format">
                  <X size={11} />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white/10 text-white border border-white/15">
                <span>{STATUSES.find((s) => s.value === filters.status)?.label || filters.status}</span>
                <button onClick={() => onFilterChange('status', '')} className="hover:text-[#ff4dd2] cursor-pointer" aria-label="Clear status">
                  <X size={11} />
                </button>
              </span>
            )}
            {filters.minScore && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <span>Score: {filters.minScore}%+</span>
                <button onClick={() => onFilterChange('minScore', '')} className="hover:text-white cursor-pointer" aria-label="Clear score">
                  <X size={11} />
                </button>
              </span>
            )}
            {filters.length && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-white/10 text-white border border-white/15">
                <span>{LENGTHS.find((l) => l.value === filters.length)?.label || filters.length}</span>
                <button onClick={() => onFilterChange('length', '')} className="hover:text-[#ff4dd2] cursor-pointer" aria-label="Clear length">
                  <X size={11} />
                </button>
              </span>
            )}

            {isFallbackMAL && (
              <span className="ml-auto text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                ● Serving via MAL Backup
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── 📱 SLIDE-UP BOTTOM DRAWER FOR MOBILE & TABLET (< lg) ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Slide-up Sheet */}
            <motion.div
              key="drawer-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col rounded-t-3xl border-t border-white/15 bg-[#090b1a] shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Filter Options"
            >
              {/* Drag Handle & Header */}
              <div className="pt-3 pb-2 px-5 border-b border-white/10 shrink-0">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={18} className="text-[#ff4dd2]" />
                    <h3 className="text-base font-bold text-white tracking-wide">Filters & Refine</h3>
                    {activeCount > 0 && (
                      <span className="bg-[#ff4dd2] text-black text-[11px] font-black px-2 py-0.5 rounded-full">
                        {activeCount} active
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close filters"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 overscroll-contain">
                {/* 1. Format */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Format
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FORMATS.map((f) => {
                      const isSelected = filters.format === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => onFilterChange('format', f.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Sort By */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Sort By
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SORTS.map((s) => {
                      const isSelected = filters.sort === s.value;
                      return (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => onFilterChange('sort', s.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Airing Status */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Airing Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onFilterChange('status', '')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        !filters.status
                          ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                          : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      Any Status
                    </button>
                    {STATUSES.map((st) => {
                      const isSelected = filters.status === st.value;
                      return (
                        <button
                          key={st.value}
                          type="button"
                          onClick={() => onFilterChange('status', st.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Minimum Score */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Community Score
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onFilterChange('minScore', '')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        !filters.minScore
                          ? 'bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                          : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      Any Score
                    </button>
                    {SCORES.map((sc) => {
                      const isSelected = filters.minScore === sc.value;
                      return (
                        <button
                          key={sc.value}
                          type="button"
                          onClick={() => onFilterChange('minScore', sc.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Episode Length */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Episode Length
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onFilterChange('length', '')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        !filters.length
                          ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                          : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      Any Length
                    </button>
                    {LENGTHS.map((len) => {
                      const isSelected = filters.length === len.value;
                      return (
                        <button
                          key={len.value}
                          type="button"
                          onClick={() => onFilterChange('length', len.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {len.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Release Year & Season */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="drawer-year" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Release Year
                    </label>
                    <select
                      id="drawer-year"
                      value={filters.year}
                      onChange={(e) => onFilterChange('year', e.target.value)}
                      className="w-full h-11 rounded-xl border border-white/10 bg-zinc-950/90 px-3 text-xs font-semibold text-zinc-200 outline-none focus:border-[#ff4dd2] cursor-pointer"
                    >
                      <option value="">Any Year</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="drawer-season" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Season
                    </label>
                    <select
                      id="drawer-season"
                      value={filters.season}
                      onChange={(e) => onFilterChange('season', e.target.value)}
                      className="w-full h-11 rounded-xl border border-white/10 bg-zinc-950/90 px-3 text-xs font-semibold text-zinc-200 outline-none focus:border-[#ff4dd2] cursor-pointer"
                    >
                      <option value="">Any Season</option>
                      {SEASONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 7. All Genres */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Genre
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onFilterChange('genre', '')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        !filters.genre
                          ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                          : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      All Genres
                    </button>
                    {GENRES.map((g) => {
                      const isSelected = filters.genre === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => onFilterChange('genre', isSelected ? '' : g)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.35)]'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sticky Footer Action Bar */}
              <div className="p-4 border-t border-white/10 bg-[#070814] flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onReset}
                  disabled={activeCount === 0}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeCount > 0
                      ? 'bg-white/10 text-white border border-white/15 hover:bg-white/20 active:scale-95'
                      : 'bg-white/5 text-zinc-600 border border-white/5 cursor-not-allowed opacity-50'
                  }`}
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-[#ff4dd2] to-[#b829e3] hover:opacity-90 active:scale-98 transition-all shadow-lg shadow-[#ff4dd2]/25 text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>
                    {totalCount !== undefined && totalCount > 0
                      ? `Show Results (${totalCount})`
                      : 'Apply Filters'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
