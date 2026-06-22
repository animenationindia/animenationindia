'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, X, Search, ArrowRight, Loader2 } from 'lucide-react';

export default function TrailersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  
  const [gridTrailers, setGridTrailers] = useState<any[]>([]);
  const [dropdownTrailers, setDropdownTrailers] = useState<any[]>([]);
  
  const [isGridLoading, setIsGridLoading] = useState(true);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [selectedTrailerId, setSelectedTrailerId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [hasNextPage, setHasNextPage] = useState(false);
  const [lastPage, setLastPage] = useState(1);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial grid data (Trending)
  useEffect(() => {
    const fetchInitialTrailers = async () => {
      setIsGridLoading(true);
      const graphqlQuery = `
        query ($page: Int) {
          Page(page: $page, perPage: 50) {
            pageInfo { hasNextPage lastPage }
            media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
              id
              title { romaji english }
              trailer { id site thumbnail }
              status
              coverImage { medium }
            }
          }
        }
      `;
      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphqlQuery, variables: { page } }),
        });
        const data = await res.json();
        const pageInfo = data?.data?.Page?.pageInfo;
        const media = data?.data?.Page?.media;
        if (media) {
          const animeWithTrailers = media.filter((a: any) => a.trailer && a.trailer.site === 'youtube');
          setGridTrailers(animeWithTrailers);
        }
        if (pageInfo) {
          setHasNextPage(pageInfo.hasNextPage);
          setLastPage(pageInfo.lastPage);
        }
      } catch (error) {
        console.error("Failed to fetch initial trailers:", error);
      } finally {
        setIsGridLoading(false);
      }
    };
    fetchInitialTrailers();
  }, [page]);

  // Live Search Dropdown logic
  useEffect(() => {
    if (!query.trim()) {
      setDropdownTrailers([]);
      setIsDropdownLoading(false);
      return;
    }

    const fetchSearchTrailers = async () => {
      setIsDropdownLoading(true);
      const graphqlQuery = `
        query ($search: String) {
          Page(page: 1, perPage: 25) {
            media(sort: SEARCH_MATCH, type: ANIME, isAdult: false, search: $search) {
              id
              title { romaji english }
              trailer { id site thumbnail }
              status
              coverImage { large }
            }
          }
        }
      `;
      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphqlQuery, variables: { search: query } }),
        });
        const data = await res.json();
        const media = data?.data?.Page?.media;
        if (media) {
          const animeWithTrailers = media.filter((a: any) => a.trailer && a.trailer.site === 'youtube');
          setDropdownTrailers(animeWithTrailers);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsDropdownLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchTrailers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    // If we wanted to update the grid based on search, we could do it here
    // but the user's screenshot implies the live dropdown IS the search result view
  };

  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Pagination Logic
  const renderPagination = () => {
    const maxPagesToShow = 7;
    const pages: (number | string)[] = [];
    if (lastPage <= 1) return null;

    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(lastPage, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    if (endPage < lastPage) {
      if (endPage < lastPage - 1) pages.push('...');
      pages.push(lastPage);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-12 mb-8 flex-wrap">
        {page > 1 && (
          <button 
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 md:px-4 md:py-2 text-sm bg-[#141519] text-[#a0a0a0] rounded hover:bg-[#ff4dd2] hover:text-white transition-colors cursor-pointer"
          >
            Prev
          </button>
        )}
        {pages.map((p, i) => (
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="text-[#a0a0a0] px-2">...</span>
          ) : (
            <button
              key={`page-${p}`}
              onClick={() => setPage(p as number)}
              className={`px-3 py-1 md:px-4 md:py-2 text-sm rounded transition-colors cursor-pointer ${
                p === page 
                  ? 'bg-[#ff4dd2] text-white shadow-[0_0_10px_rgba(255, 77, 210,0.5)]' 
                  : 'bg-[#141519] text-[#a0a0a0] hover:bg-[#ff4dd2]/50 hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        ))}
        {page < lastPage && (
          <button 
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 md:px-4 md:py-2 text-sm bg-[#141519] text-[#a0a0a0] rounded hover:bg-[#ff4dd2] hover:text-white transition-colors cursor-pointer"
          >
            Next
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 pb-12 relative">
      <div className="container mx-auto px-4 lg:px-12 max-w-[1600px]">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 relative z-20">
          <div>
            <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
              Official <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Trailers</span>
            </h1>
            <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
              Experience the hype. Watch the latest, most anticipated official trailers straight from Japan.
            </p>
          </div>
          
          <div className="w-full md:w-[600px] relative" ref={dropdownRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-[#0d0b14] border border-[#2d2a3d] rounded-full overflow-hidden focus-within:border-[#ff98a2] transition-colors shadow-lg">
              <Search className="absolute left-4 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search trailers by anime name..."
                value={query}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-transparent text-white py-3.5 pl-12 pr-28 focus:outline-none placeholder:text-gray-500 font-medium"
              />
              <button 
                type="submit" 
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#ffb6b9] hover:bg-[#ffa1a5] text-black font-bold text-sm px-5 py-2 rounded-full flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowRight size={16} /> Search
              </button>
            </form>

            {/* Live Search Dropdown Menu */}
            {showDropdown && query.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-[#0d0b14] border border-[#2d2a3d] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-[60vh] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-4 duration-200 custom-scrollbar">
                {isDropdownLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ffb6b9]" />
                  </div>
                ) : dropdownTrailers.length > 0 ? (
                  <div className="flex flex-col">
                    {dropdownTrailers.map((anime) => {
                      const title = anime.title.english || anime.title.romaji;
                      const imageUrl = anime.coverImage?.large || `https://i.ytimg.com/vi/${anime.trailer.id}/hqdefault.jpg`;
                      return (
                        <div 
                          key={anime.id}
                          className="flex items-center gap-4 p-4 hover:bg-[#1a1726] border-b border-[#2d2a3d]/50 cursor-pointer transition-colors group"
                          onClick={() => {
                            setSelectedTrailerId(anime.trailer.id);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="relative w-14 h-20 rounded-md overflow-hidden flex-shrink-0 bg-[#2d2a3d]">
                            <Image src={imageUrl} alt={title} fill sizes="56px" className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Play size={20} className="text-white fill-current" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="text-white font-bold text-base line-clamp-1 group-hover:text-[#ffb6b9] transition-colors">{title}</h4>
                            <span className="inline-block w-fit text-xs font-semibold px-2 py-0.5 rounded-full border border-[#f47521]/40 text-[#f47521] bg-[#f47521]/10">
                              {formatStatus(anime.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-400 font-medium">No trailers found for "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading State for Grid */}
        {isGridLoading && gridTrailers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#ff4dd2] mb-4" />
            <p className="text-gray-400 font-medium">Loading trailers...</p>
          </div>
        ) : null}

        {/* Trailers Grid (Background) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 transition-opacity duration-300 ${showDropdown && query.trim() ? 'opacity-30' : 'opacity-100'}`}>
          {gridTrailers.map((anime: any) => {
            const title = anime.title.english || anime.title.romaji;
            const thumbnailUrl = anime.trailer.thumbnail || `https://i.ytimg.com/vi/${anime.trailer.id}/hqdefault.jpg`;

            return (
              <div 
                key={`grid-${anime.id}`}
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-[#121214] border border-white/5"
                onClick={() => setSelectedTrailerId(anime.trailer.id)}
              >
                <Image 
                  src={thumbnailUrl} 
                  alt={title} 
                  fill 
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white group-hover:text-[#f47521] group-hover:scale-110 transition-all border border-white/10 group-hover:border-[#f47521]/50">
                    <Play size={24} className="ml-1 fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <h3 className="text-white font-semibold text-sm line-clamp-1">{title}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bottom */}
        {renderPagination()}

      </div>

      {/* Trailer Modal */}
      {selectedTrailerId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-sm" onClick={() => setSelectedTrailerId(null)}>
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#2A2B30]" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedTrailerId(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 p-2 rounded-full text-white hover:bg-[#f47521] transition-all"
            >
              <X size={24} />
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${selectedTrailerId}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}
