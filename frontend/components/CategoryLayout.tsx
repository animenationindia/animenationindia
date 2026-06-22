import FilterSidebar from './FilterSidebar';
import AnimeCard from './AnimeCard';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AniListMedia } from '../lib/api';

interface CategoryLayoutProps {
  title: string;
  description: string;
  results: AniListMedia[];
  pageInfo: {
    total?: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
  };
  basePath: string;
  queryParams: string;
  hideFilter?: boolean;
}

export default function CategoryLayout({ title, description, results, pageInfo, basePath, queryParams, hideFilter = false }: CategoryLayoutProps) {
  
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pageInfo.currentPage - 2);
    const endPage = Math.min(pageInfo.lastPage, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const getPageUrl = (pageNum: number) => {
    const divider = queryParams ? '&' : '?';
    return `${basePath}${queryParams ? '?' + queryParams : ''}${divider}page=${pageNum}`;
  };

  return (
    <main className="min-h-screen bg-[#050716] pt-24 pb-20 selection:bg-[#ff4dd2] selection:text-white">
      <div className="container mx-auto px-4 max-w-[1400px]">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-widest uppercase">
            {title}
          </h1>
          <p className="text-gray-400 mt-2 font-medium">
            {description}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 relative items-start">
          
          {/* Main Content Grid */}
          <div className="flex-1 w-full order-2 lg:order-1">
            {results.length > 0 ? (
              <>
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${hideFilter ? 'lg:grid-cols-5 xl:grid-cols-6' : 'xl:grid-cols-5'} gap-3 sm:gap-4 md:gap-6 mb-16`}>
                  {results.map(anime => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>

                {/* Pagination */}
                {pageInfo.lastPage > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-10">
                    {pageInfo.currentPage > 1 && (
                      <Link href={getPageUrl(pageInfo.currentPage - 1)} className="flex items-center gap-1 px-4 py-2 bg-[#121214] hover:bg-[#ff4dd2] text-white hover:text-white rounded-lg font-bold border border-white/5 transition-colors cursor-pointer shadow-none hover:shadow-[0_0_15px_rgba(255, 77, 210,0.3)]">
                        <ChevronLeft size={18} /> Prev
                      </Link>
                    )}

                    {getPageNumbers().map(pageNum => (
                      <Link 
                        key={pageNum} 
                        href={getPageUrl(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all cursor-pointer ${
                          pageInfo.currentPage === pageNum ? 'bg-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210,0.4)]' : 'bg-[#121214] text-white hover:bg-[#333] border border-white/5 hover:border-[#ff4dd2]/50'
                        }`}
                      >
                        {pageNum}
                      </Link>
                    ))}

                    {pageInfo.hasNextPage && (
                      <Link href={getPageUrl(pageInfo.currentPage + 1)} className="flex items-center gap-1 px-4 py-2 bg-[#121214] hover:bg-[#ff4dd2] text-white hover:text-white rounded-lg font-bold border border-white/5 transition-colors cursor-pointer shadow-none hover:shadow-[0_0_15px_rgba(255, 77, 210,0.3)]">
                        Next <ChevronRight size={18} />
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-[#121214] rounded-2xl border border-white/5 w-full">
                <h2 className="text-2xl font-bold text-white mb-2 uppercase">No Anime Found</h2>
                <p className="text-gray-400 text-sm">Try adjusting your filters.</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          {!hideFilter && (
            <div className="w-full lg:w-[280px] xl:w-[320px] order-1 lg:order-2 flex-shrink-0 relative">
              <FilterSidebar />
            </div>
          )}
          
        </div>
      </div>
    </main>
  );
}
