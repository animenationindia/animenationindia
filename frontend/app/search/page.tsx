import { searchAnimeAniList, getTopAnimeAniList, getFilteredAnimeAniList } from '../../lib/api';
import AnimeCard from '../../components/AnimeCard';
import AnimeSearchFilters from '../../components/AnimeSearchFilters';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, Tv2, SearchX } from 'lucide-react';
import type { AniListMedia } from '../../lib/api';

interface SearchSearchParams {
  q?: string;
  page?: string;
  genres?: string;
  format?: string;
  status?: string;
  year?: string;
  sort?: string;
}

// Map format string to a color tag
function formatBadgeColor(format: string | null) {
  if (!format) return 'bg-[#1a1b2e] text-gray-400';
  switch (format.toUpperCase()) {
    case 'TV': return 'bg-blue-500/20 text-blue-300';
    case 'MOVIE': return 'bg-yellow-500/20 text-yellow-300';
    case 'OVA': return 'bg-green-500/20 text-green-300';
    case 'ONA': return 'bg-purple-500/20 text-purple-300';
    case 'SPECIAL': return 'bg-pink-500/20 text-pink-300';
    default: return 'bg-[#1a1b2e] text-gray-400';
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchSearchParams> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const currentPage = parseInt(resolvedParams.page || '1', 10);
  const genres = resolvedParams.genres || '';
  const format = resolvedParams.format || '';
  const status = resolvedParams.status || '';
  const year = resolvedParams.year || '';
  const sort = resolvedParams.sort || 'POPULARITY_DESC';

  const hasFilters = !!(genres || format || status || year || (sort && sort !== 'POPULARITY_DESC'));

  let results: AniListMedia[] = [];
  let pageInfo = { hasNextPage: false, lastPage: 1, total: 0 };
  let isSuggestion = false;

  if (query.trim() || hasFilters) {
    if (hasFilters) {
      // Use advanced filtered query
      const data = await getFilteredAnimeAniList({
        page: currentPage,
        season: undefined,
        seasonYear: year ? parseInt(year) : undefined,
        format: format || undefined,
        status: status || undefined,
        genres: genres ? genres.split(',') : undefined,
        sort: sort,
        perPage: 24,
      });
      // If there is also a text query, additionally filter by search
      if (query.trim()) {
        const searchData = await searchAnimeAniList(query, currentPage);
        results = searchData.media || [];
        pageInfo = searchData.pageInfo || { hasNextPage: false, lastPage: 1, total: 0 };
      } else {
        results = data.media || [];
        pageInfo = data.pageInfo || { hasNextPage: false, lastPage: 1, total: 0 };
      }
    } else {
      // Plain text search
      const data = await searchAnimeAniList(query, currentPage);
      results = data.media || [];
      pageInfo = data.pageInfo || { hasNextPage: false, lastPage: 1, total: 0 };
    }
  } else {
    // No query, no filters → show suggestions
    results = await getTopAnimeAniList();
    isSuggestion = true;
  }

  // Pagination logic
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pageInfo.lastPage, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // Build URL helper for pagination (preserves all filters)
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (genres) params.set('genres', genres);
    if (format) params.set('format', format);
    if (status) params.set('status', status);
    if (year) params.set('year', year);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    return `/search?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 selection:bg-[#ff6400] selection:text-white relative overflow-hidden">
      {/* Ambient Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff6400]/5 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[65%] h-[45%] bg-[#ff4dd2]/4 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-[#4d79ff]/4 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] relative z-10">

        {/* Search Filters Component */}
        <AnimeSearchFilters
          initialQuery={query}
          initialGenres={genres}
          initialFormat={format}
          initialStatus={status}
          initialYear={year}
          initialSort={sort}
        />

        {/* ─── Header / Stats Bar ─── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-widest uppercase">
              {isSuggestion ? 'Trending Suggestions' : query ? 'Search Results' : 'Browse Anime'}
            </h1>
            <p className="text-gray-400 mt-1.5 text-sm md:text-base font-medium">
              {isSuggestion
                ? 'Start typing to search, or use filters to explore:'
                : query
                  ? <>Results for <span className="text-[#ff6400] font-bold">"{query}"</span></>
                  : 'Filtered results based on your selection'
              }
            </p>
          </div>

          {/* Result count badge */}
          {!isSuggestion && results.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#121326]/60 border border-white/8 rounded-xl px-4 py-2 self-start sm:self-auto">
              <Tv2 size={15} className="text-[#ff4dd2]" />
              <span>
                {pageInfo.total ? (
                  <><span className="text-white font-bold">{pageInfo.total.toLocaleString()}</span> anime found</>
                ) : (
                  <><span className="text-white font-bold">{results.length}</span> results</>
                )}
              </span>
            </div>
          )}
        </div>

        {/* ─── Results Grid ─── */}
        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6 mb-16">
              {results.map((anime, idx) => (
                <div key={anime.id} className="relative">
                  {/* Score badge */}
                  {anime.averageScore && (
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 pointer-events-none">
                      <Star size={10} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      <span className="text-[10px] font-bold text-white">{(anime.averageScore / 10).toFixed(1)}</span>
                    </div>
                  )}
                  {/* Format badge */}
                  {anime.format && (
                    <div className={`absolute bottom-[88px] left-2 z-20 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider pointer-events-none ${formatBadgeColor(anime.format)}`}>
                      {anime.format.replace('_', ' ')}
                    </div>
                  )}
                  <AnimeCard anime={anime} priority={idx < 8} />
                </div>
              ))}
            </div>

            {/* ─── Pagination ─── */}
            {!isSuggestion && pageInfo.lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {/* First page shortcut */}
                {currentPage > 3 && (
                  <Link href={buildPageUrl(1)} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold bg-[#121326]/80 text-gray-400 hover:bg-[#333] border border-white/5 transition-colors">1</Link>
                )}
                {currentPage > 4 && (
                  <span className="text-gray-600 px-1">…</span>
                )}

                {/* Prev */}
                {currentPage > 1 && (
                  <Link href={buildPageUrl(currentPage - 1)} className="flex items-center gap-1 px-4 py-2 bg-[#121326]/80 hover:bg-[#ff6400] text-white rounded-lg font-bold border border-white/5 transition-colors">
                    <ChevronLeft size={18} /> Prev
                  </Link>
                )}

                {/* Page numbers */}
                {getPageNumbers().map(pageNum => (
                  <Link
                    key={pageNum}
                    href={buildPageUrl(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all text-sm ${
                      currentPage === pageNum
                        ? 'bg-[#ff6400] text-white shadow-[0_0_15px_rgba(255,100,0,0.4)]'
                        : 'bg-[#121326]/80 text-white hover:bg-[#333] border border-white/5'
                    }`}
                  >
                    {pageNum}
                  </Link>
                ))}

                {/* Next */}
                {pageInfo.hasNextPage && (
                  <Link href={buildPageUrl(currentPage + 1)} className="flex items-center gap-1 px-4 py-2 bg-[#121326]/80 hover:bg-[#ff6400] text-white rounded-lg font-bold border border-white/5 transition-colors">
                    Next <ChevronRight size={18} />
                  </Link>
                )}

                {currentPage < pageInfo.lastPage - 3 && (
                  <span className="text-gray-600 px-1">…</span>
                )}
                {currentPage < pageInfo.lastPage - 2 && (
                  <Link href={buildPageUrl(pageInfo.lastPage)} className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold bg-[#121326]/80 text-gray-400 hover:bg-[#333] border border-white/5 transition-colors">{pageInfo.lastPage}</Link>
                )}
              </div>
            )}
          </>
        ) : (
          /* ─── Empty State ─── */
          <div className="text-center py-24 px-4 bg-[#0d0e1f]/60 rounded-3xl border border-white/5 mt-4">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-[#1a1b2e] flex items-center justify-center">
                <SearchX size={36} className="text-gray-600" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bebas text-white tracking-widest uppercase mb-2">
              No Results Found
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
              We couldn&apos;t find any anime matching <span className="text-[#ff6400] font-semibold">"{query}"</span>. Try a different spelling, or explore the suggestions below.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Naruto', 'One Piece', 'Attack on Titan', 'Demon Slayer', 'Solo Leveling'].map(s => (
                <Link
                  key={s}
                  href={`/search?q=${encodeURIComponent(s)}`}
                  className="px-4 py-2 bg-[#1a1b2e] border border-white/8 rounded-xl text-sm text-gray-300 hover:border-[#ff6400]/50 hover:text-[#ff6400] transition-all"
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}