'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export default function BrowseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentGenre = searchParams.get('genre') || '';
  const currentSort = searchParams.get('sort') || 'POPULARITY_DESC';

  const genresList = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 
    'Horror', 'Mecha', 'Music', 'Mystery', 'Psychological', 
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
  ];

  const sorts = [
    { label: 'Popularity', value: 'POPULARITY_DESC' },
    { label: 'Trending', value: 'TRENDING_DESC' },
    { label: 'Score', value: 'SCORE_DESC' },
    { label: 'Newest', value: 'START_DATE_DESC' },
  ];

  const handleFilterChange = (type: 'genre' | 'sort', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    
    // Reset to page 1 on filter change
    params.set('page', '1');
    
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold text-[#a0a0a0] uppercase tracking-wider">Genre</span>
        <div className="relative">
          <select 
            className="appearance-none bg-[#141519] border border-gray-800 text-white text-[13px] font-semibold py-2.5 px-4 pr-10 rounded focus:outline-none focus:border-[#f47521] focus:ring-1 focus:ring-[#f47521] cursor-pointer transition-colors"
            value={currentGenre}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
          >
            <option value="">All Genres</option>
            {genresList.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold text-[#a0a0a0] uppercase tracking-wider">Sort By</span>
        <div className="relative">
          <select 
            className="appearance-none bg-[#141519] border border-gray-800 text-white text-[13px] font-semibold py-2.5 px-4 pr-10 rounded focus:outline-none focus:border-[#f47521] focus:ring-1 focus:ring-[#f47521] cursor-pointer transition-colors"
            value={currentSort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            {sorts.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
