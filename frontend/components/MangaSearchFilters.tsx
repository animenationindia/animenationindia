'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  Search, X, Star, BookOpen, Filter, ArrowUpDown, Sparkles, 
  Clock, Flame, Check, SlidersHorizontal, RotateCcw, ChevronDown, 
  Layers, Globe, Calendar, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface MangaSearchFiltersProps {
  initialQuery?: string;
  initialType?: string;
  initialGenre?: string;
  initialSort?: string;
  initialStatus?: string;
  initialYear?: string;
}

const TYPE_OPTIONS = [
  { id: '', label: 'All Formats', icon: '📚' },
  { id: 'manga', label: 'Manga (JP)', icon: '🇯🇵' },
  { id: 'manhwa', label: 'Manhwa (KR)', icon: '🇰🇷' },
  { id: 'manhua', label: 'Manhua (CN)', icon: '🇨🇳' },
  { id: 'lightnovel', label: 'Light Novel', icon: '📖' },
  { id: 'novel', label: 'Web Novel', icon: '📝' },
];

const GENRE_LIST = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 
  'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 
  'Sports', 'Supernatural', 'Thriller'
];

const STATUS_OPTIONS = [
  { id: '', label: 'All Status' },
  { id: 'releasing', label: '🟢 Publishing (Ongoing)' },
  { id: 'finished', label: '🏁 Completed (Finished)' },
  { id: 'hiatus', label: '⏸️ On Hiatus' },
];

const SORT_OPTIONS = [
  { id: 'popular', label: '🔥 Most Popular' },
  { id: 'trending', label: '✨ Trending Now' },
  { id: 'score', label: '⭐ Highest Rated' },
  { id: 'newest', label: '🆕 Recently Added' },
  { id: 'chapters', label: '📖 Most Chapters' },
  { id: 'title', label: '🔤 Alphabetical (A-Z)' },
];

const YEAR_OPTIONS = [
  { id: '', label: 'All Eras' },
  { id: '2025', label: '2025 Releases' },
  { id: '2024', label: '2024 Releases' },
  { id: '2020s', label: '2020 - 2023' },
  { id: '2010s', label: '2010s Hits' },
  { id: '2000s', label: '2000s Classics' },
];

const TRENDING_SEARCHES = [
  'Solo Leveling', 'Chainsaw Man', 'Berserk', 'Jujutsu Kaisen', 
  'Omniscient Reader', 'Lookism', 'Tower of God', 'Wind Breaker'
];

export default function MangaSearchFilters({
  initialQuery = '',
  initialType = '',
  initialGenre = '',
  initialSort = 'popular',
  initialStatus = '',
  initialYear = '',
}: MangaSearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // Advanced Filters Drawer Toggle
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Live Instant Search Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ani_manga_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
    } catch {}
  }, []);

  // Save query to recent searches
  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    try {
      const updated = [term.trim(), ...recentSearches.filter(s => s.toLowerCase() !== term.trim().toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('ani_manga_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem('ani_manga_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  // Keyboard shortcut (Ctrl + K or / to focus search bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSuggestions(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize state if URL params change externally
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedType(searchParams.get('type') || '');
    setSelectedGenre(searchParams.get('genre') || '');
    setSelectedSort(searchParams.get('sort') || 'popular');
    setSelectedStatus(searchParams.get('status') || '');
    setSelectedYear(searchParams.get('year') || '');
  }, [searchParams]);

  // Handle click outside to close autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live autocomplete suggestions
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setFocusedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query.trim())}&type=${selectedType}&genre=${selectedGenre}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedType, selectedGenre]);

  const updateQueryParams = useCallback((
    q: string, 
    type: string, 
    genre: string, 
    sort: string, 
    status: string, 
    year: string
  ) => {
    const params = new URLSearchParams();
    
    if (q.trim()) params.set('q', q.trim());
    if (type) params.set('type', type);
    if (genre) params.set('genre', genre);
    if (sort && sort !== 'popular') params.set('sort', sort);
    if (status) params.set('status', status);
    if (year) params.set('year', year);
    
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router]);

  // Keyboard navigation inside autocomplete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        e.preventDefault();
        const selected = suggestions[focusedIndex];
        saveRecentSearch(selected.title);
        setShowSuggestions(false);
        router.push(`/manga/${selected.id}`);
      } else {
        saveRecentSearch(query);
        setShowSuggestions(false);
        updateQueryParams(query, selectedType, selectedGenre, selectedSort, selectedStatus, selectedYear);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRecentSearch(query);
    setShowSuggestions(false);
    updateQueryParams(query, selectedType, selectedGenre, selectedSort, selectedStatus, selectedYear);
  };

  const handleSelectTrending = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    setShowSuggestions(false);
    updateQueryParams(term, selectedType, selectedGenre, selectedSort, selectedStatus, selectedYear);
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    updateQueryParams(query, typeId, selectedGenre, selectedSort, selectedStatus, selectedYear);
  };

  const handleGenreToggle = (genreName: string) => {
    let newGenre = '';
    const currentGenres = selectedGenre ? selectedGenre.split(',').map(g => g.trim()) : [];
    
    if (currentGenres.includes(genreName)) {
      newGenre = currentGenres.filter(g => g !== genreName).join(',');
    } else {
      newGenre = [...currentGenres, genreName].join(',');
    }
    
    setSelectedGenre(newGenre);
    updateQueryParams(query, selectedType, newGenre, selectedSort, selectedStatus, selectedYear);
  };

  const handleSortChange = (sortId: string) => {
    setSelectedSort(sortId);
    updateQueryParams(query, selectedType, selectedGenre, sortId, selectedStatus, selectedYear);
  };

  const handleStatusChange = (statusId: string) => {
    setSelectedStatus(statusId);
    updateQueryParams(query, selectedType, selectedGenre, selectedSort, statusId, selectedYear);
  };

  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    updateQueryParams(query, selectedType, selectedGenre, selectedSort, selectedStatus, yearId);
  };

  const handleClearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    updateQueryParams('', selectedType, selectedGenre, selectedSort, selectedStatus, selectedYear);
  };

  const handleResetAll = () => {
    setQuery('');
    setSelectedType('');
    setSelectedGenre('');
    setSelectedSort('popular');
    setSelectedStatus('');
    setSelectedYear('');
    setSuggestions([]);
    setShowSuggestions(false);
    router.push(pathname);
  };

  const activeGenreList = selectedGenre ? selectedGenre.split(',').map(g => g.trim()).filter(Boolean) : [];
  const activeFilterCount = (query.trim() ? 1 : 0) + (selectedType ? 1 : 0) + activeGenreList.length + (selectedStatus ? 1 : 0) + (selectedYear ? 1 : 0) + (selectedSort !== 'popular' ? 1 : 0);

  return (
    <div className="w-full max-w-5xl mx-auto mb-10 relative z-30">
      
      {/* 🔍 Search Omnibar with Live Autocomplete & Shortcuts */}
      <div ref={searchContainerRef} className="relative mb-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center group">
            
            {/* Search Icon */}
            <span className="absolute left-4.5 text-gray-400 group-focus-within:text-[#ff4dd2] transition-colors pointer-events-none">
              <Search size={22} className={isLoadingSuggestions ? 'animate-spin text-[#ff4dd2]' : ''} />
            </span>

            {/* Search Input Field */}
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search manga, manhwa, webtoons, light novels... (e.g. Solo Leveling, Berserk)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="w-full bg-[#0d0e24]/80 backdrop-blur-2xl border-2 border-[#ff4dd2]/30 hover:border-[#ff4dd2]/60 focus:border-[#ff4dd2] text-white placeholder-gray-500 rounded-2xl py-4.5 pl-13 pr-40 focus:outline-none focus:shadow-[0_0_35px_rgba(255,77,210,0.3)] focus:bg-[#0d0e24]/95 transition-all duration-300 shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)] text-sm sm:text-base font-medium"
            />
            
            {/* Keyboard Shortcut Badge */}
            <div className="hidden sm:flex items-center gap-1 absolute right-24 pointer-events-none">
              <kbd className="bg-white/10 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                Ctrl
              </kbd>
              <span className="text-gray-500 text-xs">+</span>
              <kbd className="bg-white/10 text-gray-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                K
              </kbd>
            </div>

            {/* Clear button */}
            {query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-20 text-gray-400 hover:text-[#ff4dd2] transition-colors p-2 cursor-pointer"
                title="Clear query"
              >
                <X size={18} />
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="absolute right-2.5 px-5 py-2.5 bg-[#ff4dd2] hover:bg-[#ff7be0] text-[#050716] font-black rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(255,77,210,0.4)] hover:shadow-[0_4px_30px_rgba(255,77,210,0.6)] cursor-pointer text-xs uppercase tracking-wider hover:scale-105 active:scale-95"
            >
              Search
            </button>
          </div>
        </form>

        {/* ⚡ Dynamic Dropdown (Suggestions OR Trending / Recent Searches) */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#090a1c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 divide-y divide-white/5">
            
            {/* If user is typing: Show Instant Matching Results */}
            {suggestions.length > 0 ? (
              <div>
                <div className="px-4 py-2 bg-white/[0.02] flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-[#ff4dd2]">
                    <Sparkles size={12} /> Top Matching Titles
                  </span>
                  <span className="text-[10px] text-gray-500">Navigate with ↑ ↓ and Enter</span>
                </div>
                <div className="p-2 space-y-1">
                  {suggestions.map((item, idx) => {
                    const isFocused = focusedIndex === idx;
                    return (
                      <Link
                        key={item.id}
                        href={`/manga/${item.id}`}
                        onClick={() => {
                          saveRecentSearch(item.title);
                          setShowSuggestions(false);
                        }}
                        onMouseEnter={() => setFocusedIndex(idx)}
                        className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all ${
                          isFocused ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 shadow-md' : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded-lg flex-shrink-0 border border-white/10 shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#ff4dd2] transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                            <span className="bg-[#ff4dd2]/20 text-[#ff4dd2] font-black px-1.5 py-0.5 rounded uppercase text-[9px]">
                              {item.format}
                            </span>
                            {item.score && (
                              <span className="flex items-center gap-1 text-amber-400 font-bold">
                                <Star size={11} className="fill-amber-400" /> {item.score}
                              </span>
                            )}
                            {item.year && (
                              <span className="text-gray-400 font-medium">({item.year})</span>
                            )}
                          </div>
                          {item.genres && item.genres.length > 0 && (
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              {item.genres.join(' • ')}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleSearchSubmit}
                  className="w-full py-3 bg-white/5 hover:bg-[#ff4dd2]/20 text-center text-xs font-black text-[#ff4dd2] uppercase tracking-wider transition-all cursor-pointer border-t border-white/5"
                >
                  View All Search Results for &quot;{query}&quot; →
                </button>
              </div>
            ) : query.trim().length >= 2 && !isLoadingSuggestions ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                <p className="font-semibold text-white mb-1">No instant results found for &quot;{query}&quot;</p>
                <p className="text-xs text-gray-500">Press Enter to search the full manga database.</p>
              </div>
            ) : (
              /* Empty Query: Show Trending & Recent Searches */
              <div className="p-4 space-y-4">
                
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <Clock size={12} className="text-[#ff4dd2]" /> Recent Searches
                      </span>
                      <button
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem('ani_manga_recent_searches');
                        }}
                        className="text-[10px] text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, i) => (
                        <div
                          key={i}
                          onClick={() => handleSelectTrending(term)}
                          className="group flex items-center gap-1.5 bg-white/5 hover:bg-[#ff4dd2]/20 border border-white/10 hover:border-[#ff4dd2]/40 rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:text-white cursor-pointer transition-all"
                        >
                          <span>{term}</span>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(e, term)}
                            className="text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Suggestions */}
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Flame size={13} className="text-amber-400" /> Trending Manga & Manhwa
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectTrending(term)}
                        className="bg-white/5 hover:bg-[#ff4dd2]/20 border border-white/5 hover:border-[#ff4dd2]/50 text-xs font-semibold text-gray-300 hover:text-[#ff4dd2] rounded-lg px-3 py-1.5 transition-all cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>

      {/* 🏷️ Format Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        
        {/* Format Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const isActive = selectedType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleTypeChange(opt.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 border cursor-pointer hover:scale-[1.02] active:scale-95 ${
                  isActive
                    ? 'bg-[#ff4dd2] text-[#050716] border-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.4)]'
                    : 'bg-[#121326]/60 text-gray-300 hover:text-white border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Toggle Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            showAdvancedFilters || activeFilterCount > 0
              ? 'bg-[#ff4dd2]/15 text-[#ff4dd2] border-[#ff4dd2]/40 shadow-sm'
              : 'bg-[#121326]/60 text-gray-400 border-white/10 hover:text-white hover:border-white/20'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Filters & Sort</span>
          {activeFilterCount > 0 && (
            <span className="bg-[#ff4dd2] text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown size={14} className={`transform transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
        </button>

      </div>

      {/* 🎛️ Expandable Advanced Filters Drawer */}
      {showAdvancedFilters && (
        <div className="bg-[#0b0c20]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 mb-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
          
          {/* 1. Quick Genre Tags Grid (Multi-Select) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#ff4dd2] rounded-full"></span> Select Genres ({activeGenreList.length} Selected)
              </label>
              {activeGenreList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGenre('');
                    updateQueryParams(query, selectedType, '', selectedSort, selectedStatus, selectedYear);
                  }}
                  className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors font-semibold cursor-pointer"
                >
                  Clear Genres
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {GENRE_LIST.map((g) => {
                const isSelected = activeGenreList.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGenreToggle(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-[#ff4dd2] text-black border-[#ff4dd2] shadow-[0_0_12px_rgba(255,77,210,0.4)]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {isSelected && <Check size={12} className="stroke-[3]" />}
                    <span>{g}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Secondary Dropdowns Grid (Status, Sort, Year) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
            
            {/* Status Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={13} className="text-[#ff4dd2]" /> Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-[#121326] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#ff4dd2] cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0f1026] text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown size={13} className="text-[#ff4dd2]" /> Sort By
              </label>
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full bg-[#121326] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#ff4dd2] cursor-pointer"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0f1026] text-white">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Release Era / Year */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={13} className="text-[#ff4dd2]" /> Release Era
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full bg-[#121326] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#ff4dd2] cursor-pointer"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y.id} value={y.id} className="bg-[#0f1026] text-white">
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Drawer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 text-gray-400 hover:text-rose-400 transition-colors font-bold cursor-pointer"
            >
              <RotateCcw size={13} /> Reset All Filters
            </button>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(false)}
              className="bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
            >
              Apply & Close
            </button>
          </div>

        </div>
      )}

      {/* 🏷️ Active Filter Tag Chips Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-gray-500 font-semibold">Active:</span>
          
          {query.trim() && (
            <span className="inline-flex items-center gap-1 bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/30 px-2.5 py-1 rounded-lg text-xs font-bold">
              Search: &quot;{query}&quot;
              <button onClick={handleClearSearch} className="hover:text-white"><X size={12} /></button>
            </span>
          )}

          {selectedType && (
            <span className="inline-flex items-center gap-1 bg-white/5 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase">
              {selectedType}
              <button onClick={() => handleTypeChange('')} className="hover:text-white"><X size={12} /></button>
            </span>
          )}

          {activeGenreList.map(g => (
            <span key={g} className="inline-flex items-center gap-1 bg-[#ff4dd2]/10 text-white border border-[#ff4dd2]/30 px-2.5 py-1 rounded-lg text-xs font-medium">
              {g}
              <button onClick={() => handleGenreToggle(g)} className="hover:text-[#ff4dd2]"><X size={12} /></button>
            </span>
          ))}

          {selectedStatus && (
            <span className="inline-flex items-center gap-1 bg-white/5 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-medium">
              Status: {selectedStatus}
              <button onClick={() => handleStatusChange('')} className="hover:text-white"><X size={12} /></button>
            </span>
          )}

          {selectedYear && (
            <span className="inline-flex items-center gap-1 bg-white/5 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-medium">
              Year: {selectedYear}
              <button onClick={() => handleYearChange('')} className="hover:text-white"><X size={12} /></button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold underline underline-offset-4 ml-1 cursor-pointer transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

    </div>
  );
}


