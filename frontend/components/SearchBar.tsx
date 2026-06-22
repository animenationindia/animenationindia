// components/SearchBar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // 🌟 ইউজার সার্চ করলে তাকে /search?q=নাম এই পেজে নিয়ে যাবে
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-sm group">
      <input
        type="text"
        placeholder="Search anime..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-[#161616] border border-white/10 text-white text-sm rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:border-[#cae962]/50 focus:bg-[#1a1a1a] transition-all placeholder-gray-500 shadow-inner"
      />
      <button 
        type="submit" 
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#cae962] transition-colors rounded-full"
      >
        <Search size={18} strokeWidth={2.5} />
      </button>
    </form>
  );
}