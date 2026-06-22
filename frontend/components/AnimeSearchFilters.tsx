'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface AnimeSearchFiltersProps {
  initialQuery?: string;
}

export default function AnimeSearchFilters({ initialQuery = '' }: AnimeSearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);

  // Synchronize state if URL params change externally (e.g. back navigation)
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Debounced live search query update
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const currentQuery = searchParams.get('q') || '';
      if (query.trim() !== currentQuery.trim()) {
        updateQueryParams(query);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams(query);
  };

  const handleClearSearch = () => {
    setQuery('');
    updateQueryParams('');
  };

  const updateQueryParams = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (q.trim()) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }
    
    params.set('page', '1'); // Reset to page 1 on new search
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 relative z-20">
      {/* 🔍 Search Input Form */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-gray-400">
            <Search size={22} />
          </span>
          <input
            type="text"
            placeholder="Search for anime (e.g. Naruto, Attack on Titan, Solo Leveling)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#121326]/50 backdrop-blur-md border border-[#ff6400]/30 text-white placeholder-gray-500 rounded-2xl py-4 pl-12 pr-32 focus:outline-none focus:border-[#ff6400] focus:shadow-[0_0_25px_rgba(255,100,0,0.25)] focus:bg-[#121326]/80 transition-all duration-300 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] text-sm md:text-base"
          />
          
          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-28 text-gray-400 hover:text-[#ff6400] transition-colors p-2 cursor-pointer"
            >
              <X size={20} />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 md:py-2.5 bg-[#ff6400] hover:bg-[#ff8533] text-white font-extrabold rounded-xl transition-all duration-300 shadow-[0_4px_15px_rgba(255,100,0,0.4)] hover:shadow-[0_4px_25px_rgba(255,100,0,0.6)] cursor-pointer text-xs md:text-sm uppercase tracking-wider"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
