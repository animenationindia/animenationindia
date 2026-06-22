'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

export default function GenreSortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentSort = searchParams.get('sort') || 'popular';
  const genreId = searchParams.get('genreId');

  if (!genreId) return null;

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    params.set('page', '1'); // Reset to page 1 on sort change
    router.push(`/genres?${params.toString()}#results-section`);
  };

  return (
    <div className="relative inline-block ml-4">
      <select
        value={currentSort}
        onChange={handleSortChange}
        className="appearance-none bg-[#141519] border border-[#2A2B30] text-[#e0e0e0] py-2 pl-4 pr-10 rounded-md font-medium text-sm focus:outline-none focus:border-[#ff4dd2] cursor-pointer"
      >
        <option value="newest">Newest to Oldest</option>
        <option value="oldest">Oldest to Newest</option>
        <option value="popular">Most Popular</option>
        <option value="score">Highest Rated</option>
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff4dd2] pointer-events-none" />
    </div>
  );
}
