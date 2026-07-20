'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

interface Suggestion {
  id: number;
  idMal: number | null;
  title: { english: string | null; romaji: string | null };
  coverImage: { large: string | null };
  format: string | null;
  seasonYear: number | null;
}

interface AnimeSearchFiltersProps {
  initialQuery?: string;
  initialGenres?: string;
  initialFormat?: string;
  initialStatus?: string;
  initialYear?: string;
  initialSort?: string;
}

const FORMATS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];
const STATUSES = [
  { label: 'Airing', value: 'RELEASING' },
  { label: 'Finished', value: 'FINISHED' },
  { label: 'Upcoming', value: 'NOT_YET_RELEASED' },
];
const SORTS = [
  { label: 'Popularity', value: 'POPULARITY_DESC' },
  { label: 'Top Rated', value: 'SCORE_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
  { label: 'Oldest', value: 'START_DATE' },
];
const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Music',
  'Psychological', 'Historical', 'Ecchi', 'Isekai',
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

export default function AnimeSearchFilters({
  initialQuery = '',
  initialGenres = '',
  initialFormat = '',
  initialStatus = '',
  initialYear = '',
  initialSort = 'POPULARITY_DESC',
}: AnimeSearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [showFilters, setShowFilters] = useState(
    !!(initialGenres || initialFormat || initialStatus || initialYear)
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    initialGenres ? initialGenres.split(',') : []
  );
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedSort, setSelectedSort] = useState(initialSort || 'POPULARITY_DESC');

  // Live suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state with URL on back/forward navigation
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedGenres(searchParams.get('genres') ? searchParams.get('genres')!.split(',') : []);
    setSelectedFormat(searchParams.get('format') || '');
    setSelectedStatus(searchParams.get('status') || '');
    setSelectedYear(searchParams.get('year') || '');
    setSelectedSort(searchParams.get('sort') || 'POPULARITY_DESC');
  }, [searchParams]);

  // Close suggestion box on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Live suggestions fetch (debounced 350ms)
  useEffect(() => {
    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionLoading(true);
    suggestionDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query ($search: String) {
                Page(page: 1, perPage: 6) {
                  media(search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
                    id idMal title { english romaji } coverImage { large } format seasonYear
                  }
                }
              }
            `,
            variables: { search: query.trim() },
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const media = data?.data?.Page?.media || [];
        setSuggestions(media);
        setShowSuggestions(media.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    }, 350);
    return () => {
      if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
    };
  }, [query]);

  // Debounced page navigation (600ms after typing stops)
  const pushSearch = useCallback(
    (q: string, params?: Record<string, string>) => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        const url = new URLSearchParams(searchParams.toString());
        if (q.trim()) url.set('q', q.trim()); else url.delete('q');
        url.set('page', '1');
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v) url.set(k, v); else url.delete(k);
          });
        }
        startTransition(() => router.push(`${pathname}?${url.toString()}`));
      }, 600);
    },
    [searchParams, pathname, router]
  );

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setActiveSuggestion(-1);
    pushSearch(val, {
      genres: selectedGenres.join(','),
      format: selectedFormat,
      status: selectedStatus,
      year: selectedYear,
      sort: selectedSort,
    });
  };

  const applyFilters = useCallback(
    (overrides?: Partial<{ genres: string[]; format: string; status: string; year: string; sort: string }>) => {
      const g = overrides?.genres ?? selectedGenres;
      const f = overrides?.format ?? selectedFormat;
      const s = overrides?.status ?? selectedStatus;
      const y = overrides?.year ?? selectedYear;
      const so = overrides?.sort ?? selectedSort;
      const url = new URLSearchParams();
      if (query.trim()) url.set('q', query.trim());
      if (g.length) url.set('genres', g.join(','));
      if (f) url.set('format', f);
      if (s) url.set('status', s);
      if (y) url.set('year', y);
      if (so) url.set('sort', so);
      url.set('page', '1');
      startTransition(() => router.push(`${pathname}?${url.toString()}`));
    },
    [selectedGenres, selectedFormat, selectedStatus, selectedYear, selectedSort, query, pathname, router]
  );

  const handleSuggestionClick = (anime: Suggestion) => {
    const title = anime.title.english || anime.title.romaji || '';
    setQuery(title);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    const url = new URLSearchParams(searchParams.toString());
    url.set('q', title);
    url.set('page', '1');
    startTransition(() => router.push(`${pathname}?${url.toString()}`));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeSuggestion >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestion]);
      } else {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const toggleGenre = (genre: string) => {
    const next = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(next);
    applyFilters({ genres: next });
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    const url = new URLSearchParams(searchParams.toString());
    url.delete('q');
    url.set('page', '1');
    startTransition(() => router.push(`${pathname}?${url.toString()}`));
  };

  const activeFilterCount = [
    selectedGenres.length > 0,
    !!selectedFormat,
    !!selectedStatus,
    !!selectedYear,
    selectedSort !== 'POPULARITY_DESC',
  ].filter(Boolean).length;

  return (
    <div className="w-full max-w-5xl mx-auto mb-8 relative z-20" ref={containerRef}>

      {/* ─── Search Bar ─── */}
      <form
        onSubmit={e => { e.preventDefault(); setShowSuggestions(false); applyFilters(); }}
        className="relative"
      >
        <div className="relative flex items-center gap-2">

          {/* Input */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              <Search size={20} />
            </span>
            <input
              ref={inputRef}
              type="text"
              id="anime-search-input"
              autoComplete="off"
              placeholder="Search anime… (e.g. Naruto, Solo Leveling)"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#121326]/60 backdrop-blur-md border border-[#ff6400]/30 text-white placeholder-gray-500 rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-[#ff6400] focus:shadow-[0_0_25px_rgba(255,100,0,0.2)] transition-all duration-300 text-sm md:text-base"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff6400] transition-colors p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Search Button — hidden on very small, shown md+ */}
          <button
            type="submit"
            className="hidden sm:flex items-center gap-2 px-5 py-3.5 bg-[#ff6400] hover:bg-[#ff8533] text-white font-extrabold rounded-2xl transition-all duration-300 shadow-[0_4px_15px_rgba(255,100,0,0.35)] hover:shadow-[0_4px_25px_rgba(255,100,0,0.55)] text-sm uppercase tracking-wider whitespace-nowrap cursor-pointer"
          >
            <Search size={16} /> Search
          </button>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(p => !p)}
            className={`relative flex items-center gap-1.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer border whitespace-nowrap ${
              showFilters || activeFilterCount > 0
                ? 'bg-[#ff4dd2]/20 border-[#ff4dd2]/50 text-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.2)]'
                : 'bg-[#121326]/60 border-white/10 text-gray-300 hover:border-[#ff4dd2]/40 hover:text-[#ff4dd2]'
            }`}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-[#ff4dd2] text-white text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* ─── Live Suggestions Dropdown ─── */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0e0f20]/95 backdrop-blur-xl border border-[#ff6400]/20 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50">
            {suggestionLoading && suggestions.length === 0 ? (
              <div className="flex items-center gap-3 px-4 py-4 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-[#ff6400]/40 border-t-[#ff6400] rounded-full animate-spin" />
                Searching…
              </div>
            ) : (
              suggestions.map((anime, idx) => {
                const title = anime.title.english || anime.title.romaji || 'Unknown';
                return (
                  <button
                    key={anime.id}
                    type="button"
                    onClick={() => handleSuggestionClick(anime)}
                    onMouseEnter={() => setActiveSuggestion(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 cursor-pointer ${
                      activeSuggestion === idx
                        ? 'bg-[#ff6400]/15 border-l-2 border-[#ff6400]'
                        : 'border-l-2 border-transparent hover:bg-white/5'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1b2e]">
                      {anime.coverImage?.large && (
                        <Image
                          src={anime.coverImage.large}
                          alt={title}
                          width={40}
                          height={56}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {anime.format && (
                          <span className="text-[10px] text-[#ff6400] uppercase font-bold tracking-wider">
                            {anime.format.replace('_', ' ')}
                          </span>
                        )}
                        {anime.seasonYear && (
                          <span className="text-[10px] text-gray-500">{anime.seasonYear}</span>
                        )}
                      </div>
                    </div>
                    <Search size={14} className="text-gray-600 flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </form>

      {/* ─── Advanced Filters Panel ─── */}
      {showFilters && (
        <div className="mt-3 p-4 md:p-5 bg-[#0e0f20]/90 backdrop-blur-xl border border-white/8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-4">

          {/* Row 1: Format / Status / Year / Sort */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            {/* Format */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5">Format</label>
              <div className="flex flex-wrap gap-1.5">
                {FORMATS.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => { const next = selectedFormat === f ? '' : f; setSelectedFormat(next); applyFilters({ format: next }); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                      selectedFormat === f
                        ? 'bg-[#ff6400] text-white shadow-[0_0_10px_rgba(255,100,0,0.4)]'
                        : 'bg-[#1a1b2e] text-gray-400 hover:bg-[#ff6400]/20 hover:text-[#ff6400] border border-white/8'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => { const next = selectedStatus === s.value ? '' : s.value; setSelectedStatus(next); applyFilters({ status: next }); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                      selectedStatus === s.value
                        ? 'bg-[#ff4dd2] text-white shadow-[0_0_10px_rgba(255,77,210,0.4)]'
                        : 'bg-[#1a1b2e] text-gray-400 hover:bg-[#ff4dd2]/20 hover:text-[#ff4dd2] border border-white/8'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5">Year</label>
              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); applyFilters({ year: e.target.value }); }}
                className="w-full bg-[#1a1b2e] border border-white/8 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff6400] transition-colors cursor-pointer appearance-none"
              >
                <option value="">Any Year</option>
                {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5">Sort By</label>
              <select
                value={selectedSort}
                onChange={e => { setSelectedSort(e.target.value); applyFilters({ sort: e.target.value }); }}
                className="w-full bg-[#1a1b2e] border border-white/8 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff6400] transition-colors cursor-pointer appearance-none"
              >
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Genres */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Genres</label>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                    selectedGenres.includes(genre)
                      ? 'bg-[#ff4dd2] text-white shadow-[0_0_8px_rgba(255,77,210,0.5)]'
                      : 'bg-[#1a1b2e] text-gray-400 hover:bg-[#ff4dd2]/20 hover:text-[#ff4dd2] border border-white/8'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedGenres([]);
                  setSelectedFormat('');
                  setSelectedStatus('');
                  setSelectedYear('');
                  setSelectedSort('POPULARITY_DESC');
                  applyFilters({ genres: [], format: '', status: '', year: '', sort: 'POPULARITY_DESC' });
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff4dd2] transition-colors cursor-pointer"
              >
                <X size={13} /> Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
