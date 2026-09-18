import Link from 'next/link';
import { searchMangaJikan } from '@/lib/api';
import AnimeCard from '@/components/AnimeCard';
import Pagination from '@/components/Pagination';
import MangaSearchFilters from '@/components/MangaSearchFilters';
import ReadHubNavigation from '@/components/ReadHubNavigation';
import ErrorState from '@/components/ErrorState';
import { Sparkles, Layers, RotateCcw } from 'lucide-react';

export interface ReadCategoryConfig {
  key: 'manga' | 'manhwa' | 'manhua' | 'novel';
  basePath: string;
  title: string;
  subtitle: string;
  flag: string;
  badge: string;
  badgeColor: string;
  description: string;
  placeholder: string;
  trending: string[];
}

interface ReadCategoryPageProps {
  config: ReadCategoryConfig;
  searchParams: {
    q?: string;
    genre?: string;
    sort?: string;
    status?: string;
    year?: string;
    page?: string;
  };
}

export default async function ReadCategoryPage({ config, searchParams }: ReadCategoryPageProps) {
  const query = searchParams.q || '';
  const genre = searchParams.genre || '';
  const sort = searchParams.sort || 'popular';
  const status = searchParams.status || '';
  const year = searchParams.year || '';
  const currentPage = parseInt(searchParams.page || '1', 10);

  let media: any[] = [];
  let pageInfo = { hasNextPage: false, lastPage: 1, currentPage: 1, total: 0 };
  let isError = false;
  let errorMessage = `Failed to load ${config.title}. Please try again shortly.`;

  try {
    const data = await searchMangaJikan(query, currentPage, config.key, genre, sort, status, year);
    media = data?.media || [];
    pageInfo = data?.pageInfo || { hasNextPage: false, lastPage: 1, currentPage, total: 0 };
  } catch (err: any) {
    isError = true;
    const errStr = String(err?.message || err);
    if (errStr.includes('504') || errStr.toLowerCase().includes('timeout')) {
      errorMessage = 'The server took too long to respond (504 Timeout). Please try again in a few seconds.';
    }
  }

  const activeHeadingTitle = genre
    ? `${genre.replace(/,/g, ' & ')} ${config.title}`
    : query
    ? `Results for "${query}" in ${config.title}`
    : `${config.title}`;

  return (
    <div className="min-h-screen bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white pb-24">
      {/* 1. Global Read Hub Sticky Sub-Nav */}
      <ReadHubNavigation />

      {/* 2. Hero Category Header */}
      <div className="relative overflow-hidden border-b border-white/8 bg-gradient-to-b from-[#0e0f26]/80 via-[#070814]/80 to-[#040405] py-10 sm:py-14 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ff4dd2]/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col items-center">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#090a1e]/80 backdrop-blur-md mb-4 shadow-lg text-xs font-black uppercase tracking-wider">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
              config.key === 'manhwa' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
              config.key === 'manhua' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
              config.key === 'novel' ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
              'bg-sky-500/15 border-sky-500/30 text-sky-400'
            }`}>
              {config.key === 'manhwa' ? 'KR' : config.key === 'manhua' ? 'CN' : config.key === 'novel' ? 'LN' : 'JP'}
            </span>
            <span className={config.badgeColor}>{config.badge}</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">{config.subtitle}</span>
          </div>

          {/* Big Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white mb-3">
            {config.title}
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-xs sm:text-sm text-gray-400 font-medium leading-relaxed mb-6">
            {config.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* 3. Scoped Search & Filter Component */}
        <MangaSearchFilters
          initialQuery={query}
          initialGenre={genre}
          initialSort={sort}
          initialStatus={status}
          initialYear={year}
          lockedType={config.key}
          customPlaceholder={config.placeholder}
          customTrending={config.trending}
          hideFormatTabs={true}
        />

        {/* 4. Active Heading and Total Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-6 bg-[#ff4dd2] rounded-full shadow-[0_0_12px_rgba(255,77,210,0.8)]" />
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">
              {activeHeadingTitle}
            </h2>
          </div>

          {pageInfo.total ? (
            <span className="text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl shadow-inner">
              {pageInfo.total.toLocaleString()} Titles Indexed
            </span>
          ) : null}
        </div>

        {/* 5. Results Grid or Fallbacks */}
        {isError ? (
          <div className="max-w-2xl mx-auto py-12">
            <ErrorState message={errorMessage} />
            <div className="text-center mt-6">
              <Link
                href={config.basePath}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff4dd2]/30"
              >
                <RotateCcw size={14} />
                <span>Reload {config.title}</span>
              </Link>
            </div>
          </div>
        ) : media.length > 0 ? (
          <>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
              {media.map((item: any, index: number) => (
                <AnimeCard
                  key={`${item.id}-${index}`}
                  anime={item}
                  isManga={true}
                  priority={index < 12}
                />
              ))}
            </div>

            {/* Pagination preserving all active filters */}
            <div className="mt-10">
              <Pagination
                currentPage={pageInfo.currentPage || currentPage}
                lastPage={pageInfo.lastPage || 1}
                basePath={config.basePath}
                queryParams={{
                  ...(query ? { q: query } : {}),
                  ...(genre ? { genre: genre } : {}),
                  ...(status ? { status: status } : {}),
                  ...(year ? { year: year } : {}),
                  ...(sort && sort !== 'popular' ? { sort: sort } : {}),
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#0d0e24]/60 backdrop-blur-xl rounded-3xl border border-white/8 p-8 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2] mb-4 shadow-[0_0_30px_rgba(255,77,210,0.2)]">
              <Layers size={28} />
            </div>
            <h3 className="text-lg font-black text-white mb-1">
              No matching titles found
            </h3>
            <p className="text-xs text-gray-400 mb-6 max-w-sm">
              We couldn&apos;t find any titles in {config.title} matching your current search or genre filters.
            </p>
            <Link
              href={config.basePath}
              className="px-6 py-2.5 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-105"
            >
              Reset Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
