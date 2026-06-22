import { searchAnimeAniList, getTopAnimeAniList } from '../../lib/api';
import AnimeCard from '../../components/AnimeCard';
import AnimeSearchFilters from '../../components/AnimeSearchFilters';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SearchSearchParams {
  q?: string;
  page?: string;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchSearchParams> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const currentPage = parseInt(resolvedParams.page || '1', 10);

  let results = [];
  let pageInfo = { hasNextPage: false, lastPage: 1 };
  let isSuggestion = false;

  if (query.trim()) {
    // API Call for query
    const data = await searchAnimeAniList(query, currentPage);
    results = data.media || [];
    pageInfo = data.pageInfo || { hasNextPage: false, lastPage: 1 };
  } else {
    // Fetch suggestions when query is empty
    results = await getTopAnimeAniList();
    isSuggestion = true;
  }

  // 🌟 Pagination Logic
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pageInfo.lastPage, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 selection:bg-[#ff6400] selection:text-white relative overflow-hidden">
      {/* Background Pink/Blue Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff6400]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[65%] h-[45%] bg-[#ffd54a]/5 blur-[140px] rounded-full pointer-events-none z-0"></div>
      
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] relative z-10">
        
        {/* Render Search Filters Input */}
        <AnimeSearchFilters initialQuery={query} />

        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-widest uppercase">
            {isSuggestion ? 'Trending Suggestions' : 'Search Results'}
          </h1>
          <p className="text-gray-400 mt-2 font-medium">
            {isSuggestion 
              ? 'Start typing above to search your favorite anime, or explore trending titles:' 
              : <>Found results for &quot;<span className="text-[#ff6400] font-bold">{query}</span>&quot;</>
            }
          </p>
        </div>

        {/* Results Grid */}
        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6 mb-16">
              {results.map((anime: Parameters<typeof AnimeCard>[0]['anime']) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>

            {/* 🌟 Pagination Controls */}
            {!isSuggestion && pageInfo.lastPage > 1 && (
              <div className="flex items-center justify-center gap-2">
                {/* Prev Button */}
                {currentPage > 1 && (
                  <Link href={`/search?q=${query}&page=${currentPage - 1}`} className="flex items-center gap-1 px-4 py-2 bg-[#121214] hover:bg-[#ff6400] text-white hover:text-white rounded-lg font-bold border border-white/5 transition-colors cursor-pointer">
                    <ChevronLeft size={18} /> Prev
                  </Link>
                )}

                {/* Page Numbers */}
                {getPageNumbers().map(pageNum => (
                  <Link 
                    key={pageNum} 
                    href={`/search?q=${query}&page=${pageNum}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${
                      currentPage === pageNum ? 'bg-[#ff6400] text-white shadow-[0_0_15px_rgba(255,100,0,0.4)]' : 'bg-[#121214] text-white hover:bg-[#333] border border-white/5'
                    }`}
                  >
                    {pageNum}
                  </Link>
                ))}

                {/* Next Button */}
                {pageInfo.hasNextPage && (
                  <Link href={`/search?q=${query}&page=${currentPage + 1}`} className="flex items-center gap-1 px-4 py-2 bg-[#121214] hover:bg-[#ff6400] text-white hover:text-white rounded-lg font-bold border border-white/5 transition-colors cursor-pointer">
                    Next <ChevronRight size={18} />
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-[#121214] rounded-2xl border border-white/5 mt-10">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase">No Results Found</h2>
          </div>
        )}

      </div>
    </main>
  );
}