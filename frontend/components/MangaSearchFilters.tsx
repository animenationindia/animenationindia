'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface MangaSearchFiltersProps {
  initialQuery?: string;
  initialType?: string;
  initialAdult?: boolean;
}

const TYPE_OPTIONS = [
  { id: '', label: 'All Types' },
  { id: 'manga', label: 'Manga' },
  { id: 'manhwa', label: 'Manhwa' },
  { id: 'lightnovel', label: 'Light Novel' },
  { id: 'novel', label: 'Novel' },
];

export default function MangaSearchFilters({ initialQuery = '', initialType = '', initialAdult = false }: MangaSearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const [isAdult, setIsAdult] = useState(initialAdult);

  const updateQueryParams = (q: string, type: string, adult: boolean) => {
    const params = new URLSearchParams(searchParams.toString());

    if (q.trim()) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }

    if (type) {
      params.set('type', type);
    } else {
      params.delete('type');
    }

    if (adult) {
      params.set('adult', 'true');
    } else {
      params.delete('adult');
    }

    params.set('page', '1'); // Reset to page 1 on new search or filter change

    router.push(`${pathname}?${params.toString()}`);
  };

  // Synchronize state if URL params change externally (e.g. back navigation)
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setSelectedType(searchParams.get('type') || '');
    setIsAdult(searchParams.get('adult') === 'true');
  }, [searchParams]);

  // Debounced live search query update
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentQuery = searchParams.get('q') || '';
      if (query.trim() !== currentQuery.trim()) {
        updateQueryParams(query, selectedType, isAdult);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams(query, selectedType, isAdult);
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    updateQueryParams(query, typeId, isAdult);
  };

  const handleClearSearch = () => {
    setQuery('');
    updateQueryParams('', selectedType, isAdult);
  };

  const handleAdultToggle = () => {
    const newState = !isAdult;
    setIsAdult(newState);
    updateQueryParams(query, selectedType, newState);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 relative z-20">
      {/* 🔍 Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="relative mb-6">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-gray-400">
            <Search size={22} />
          </span>
          <input
            type="text"
            placeholder="Search manga, manhwa, or novels (e.g. Berserk, Solo Leveling)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#121326]/50 backdrop-blur-md border border-[#ff4dd2]/30 text-white placeholder-gray-500 rounded-2xl py-4 pl-12 pr-32 focus:outline-none focus:border-[#ff4dd2] focus:shadow-[0_0_25px_rgba(255,77,210,0.25)] focus:bg-[#121326]/80 transition-all duration-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-sm md:text-base"
          />
          
          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-28 text-gray-400 hover:text-[#ff4dd2] transition-colors p-2 cursor-pointer"
            >
              <X size={20} />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 md:py-2.5 bg-[#ff4dd2] hover:bg-[#ff7be0] text-[#050716] font-extrabold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(255,77,210,0.4)] hover:shadow-[0_4px_25px_rgba(255,77,210,0.6)] cursor-pointer text-xs md:text-sm uppercase tracking-wider"
          >
            Search
          </button>
        </div>
      </form>

      {/* 🏷️ Type Filters Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        <span className="text-gray-400 text-xs md:text-sm font-semibold uppercase tracking-wider mr-2">Filter Type:</span>
        {TYPE_OPTIONS.map((opt) => {
          const isActive = selectedType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleTypeChange(opt.id)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border cursor-pointer hover:scale-[1.02] ${
                isActive
                  ? 'bg-[#ff4dd2] text-[#050716] border-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.4)]'
                  : 'bg-[#121326]/50 text-gray-300 hover:text-white border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/5'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 🔞 Adult Content Toggle */}
      <div className="flex items-center justify-center mt-6 gap-3">
        <span className="text-gray-400 text-xs md:text-sm font-semibold uppercase tracking-wider">
          Show Adult Manga/Novel/Light Novel/Manhwa
        </span>
        <button
          type="button"
          onClick={handleAdultToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4dd2] focus:ring-offset-2 focus:ring-offset-[#050716] ${
            isAdult ? 'bg-[#ff4dd2]' : 'bg-gray-600'
          }`}
          role="switch"
          aria-checked={isAdult}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isAdult ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
