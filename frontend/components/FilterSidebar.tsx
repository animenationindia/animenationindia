'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';

const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
const FORMATS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'];
const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const selectedSeason = searchParams.get('season') || '';
  const selectedFormat = searchParams.get('format') || '';
  const selectedGenres = searchParams.get('genres')?.split(',').filter(Boolean) || [];

  const applyFilters = (season: string, format: string, genres: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (season) params.set('season', season);
    else params.delete('season');

    if (format) params.set('format', format);
    else params.delete('format');

    if (genres.length > 0) params.set('genres', genres.join(','));
    else params.delete('genres');

    params.set('page', '1'); // Reset to page 1 on filter change
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleGenre = (genre: string) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    applyFilters(selectedSeason, selectedFormat, newGenres);
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    applyFilters(val, selectedFormat, selectedGenres);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    applyFilters(selectedSeason, val, selectedGenres);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="lg:hidden w-full mb-4 flex items-center justify-center gap-2 bg-[#121214] text-white py-3 rounded-xl border border-white/5 font-bold hover:bg-[#ff6400] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter size={18} /> Filters
      </button>

      {/* Sidebar Content */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block w-full lg:w-[280px] xl:w-[320px] flex-shrink-0 bg-[#070708]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 sticky top-24 shadow-2xl h-fit`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <h3 className="text-xl font-bebas tracking-widest text-white uppercase flex items-center gap-2">
            <Filter size={20} className="text-[#ff6400]" /> Filter
          </h3>
          {(selectedSeason || selectedFormat || selectedGenres.length > 0) && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-[#ff6400] transition-colors font-bold uppercase tracking-wider flex items-center gap-1">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Season Filter */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Season</label>
          <div className="relative">
            <select 
              value={selectedSeason} 
              onChange={handleSeasonChange}
              className="w-full bg-[#121214] text-white text-sm font-semibold p-3 rounded-lg border border-white/5 appearance-none focus:outline-none focus:border-[#ff6400]/50 cursor-pointer"
            >
              <option value="">All Seasons</option>
              {SEASONS.map(s => <option key={s} value={s}>{s} 2026</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Format Filter */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Format</label>
          <div className="relative">
            <select 
              value={selectedFormat} 
              onChange={handleFormatChange}
              className="w-full bg-[#121214] text-white text-sm font-semibold p-3 rounded-lg border border-white/5 appearance-none focus:outline-none focus:border-[#ff6400]/50 cursor-pointer"
            >
              <option value="">All Formats</option>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Genres Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Genres</label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedGenres.includes(genre)
                    ? 'bg-[#ff6400] text-white shadow-[0_0_10px_rgba(255,100,0,0.4)]'
                    : 'bg-[#121214] text-gray-300 border border-white/5 hover:border-white/20'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
