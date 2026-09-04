export const runtime = 'edge';
import { Metadata } from 'next';
import { searchMangaJikan, getTrendingMangaSpotlight } from '../../../lib/api';
import AnimeCard from '../../../components/AnimeCard';
import Pagination from '../../../components/Pagination';
import MangaSearchFilters from '../../../components/MangaSearchFilters';
import MangaSpotlightHero from '../../../components/MangaSpotlightHero';
import ErrorState from '../../../components/ErrorState';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Browse Manga, Manhwa & Novels | Anime Nation India',
  description: 'Explore the ultimate database of Japanese Manga, Korean Manhwa, and Light Novels on Anime Nation India.',
};

interface MangaPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    genre?: string;
    sort?: string;
    status?: string;
    year?: string;
    page?: string;
  }>;
}

const ALLOWED_MANGA_TYPES = ['manga', 'manhwa', 'manhua', 'novel', 'light novel', 'lightnovel', 'one shot', 'one_shot'];

export default async function BrowseMangaPage({ searchParams }: MangaPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const type = resolvedParams.type || '';
  const genre = resolvedParams.genre || '';
  const sort = resolvedParams.sort || 'popular';
  const status = resolvedParams.status || '';
  const year = resolvedParams.year || '';
  const currentPage = parseInt(resolvedParams.page || '1', 10);

  let media: any[] = [];
  let spotlights: any[] = [];
  let pageInfo = { hasNextPage: false, lastPage: 1, currentPage: 1, total: 0 };
  let isError = false;
  let errorMessage = 'Failed to load manga database. Please try again.';

  try {
    const isMainLanding = !query && currentPage === 1 && !type && !genre && !status && !year && sort === 'popular';
    const [data, spotlightData] = await Promise.all([
      searchMangaJikan(query, currentPage, type, genre, sort, status, year),
      isMainLanding ? getTrendingMangaSpotlight() : Promise.resolve([])
    ]);
    media = data?.media || [];
    spotlights = spotlightData || [];
    pageInfo = data?.pageInfo || { hasNextPage: false, lastPage: 1, currentPage, total: 0 };
  } catch (err: any) {
    isError = true;
    const errStr = String(err?.message || err);
    if (errStr.includes('504') || errStr.toLowerCase().includes('timeout')) {
      errorMessage = 'The server is taking too long to respond (504 Timeout). Please try again shortly.';
    }
  }

  // Filter to show valid, non-hentai Manga, Manhwa, Manhua, and Novels
  const filteredMedia = media.filter((item: any) => {
    if (!item.format) return true;
    const itemFormat = (item.format || '').toLowerCase();
    return ALLOWED_MANGA_TYPES.some(t => itemFormat.includes(t)) || itemFormat === 'manga' || itemFormat === 'novel';
  });

  const activeHeadingTitle = genre
    ? `${genre.replace(/,/g, ' & ')} ${type ? type.toUpperCase() : 'Manga & Novels'}`
    : query
    ? `Results for "${query}"`
    : type
    ? `Top ${type.toUpperCase()}`
    : 'Browse All Manga & Novels';

  return (
    <div className="w-full pb-12 relative z-10">
      
      {/* 🌟 Spotlight Hero Carousel (Shown on Main Landing) */}
      {spotlights && spotlights.length > 0 && (
        <MangaSpotlightHero spotlights={spotlights} />
      )}

      {/* 🔍 Advanced Search Omnibar, Formats, Multi-Genres & Filter Drawer */}
      <MangaSearchFilters 
        initialQuery={query} 
        initialType={type} 
        initialGenre={genre} 
        initialSort={sort} 
        initialStatus={status}
        initialYear={year}
      />

      {/* 🏷️ Dynamic Active Filter Header */}
      {(query || genre || type || status || year) && !isError && (
        <div className="max-w-7xl mx-auto mb-6 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-5 bg-[#ff4dd2] rounded-full"></span>
            <h2 className="text-lg md:text-xl font-black text-white">
              {activeHeadingTitle}
            </h2>
          </div>
          {pageInfo.total ? (
            <span className="text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {pageInfo.total.toLocaleString()} titles found
            </span>
          ) : null}
        </div>
      )}

      {/* Error State */}
      {isError ? (
        <div className="max-w-3xl mx-auto">
          <ErrorState message={errorMessage} />
          <div className="text-center mt-4">
            <Link
              href="/browse/manga"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#121326] border border-white/10 text-[#ff4dd2] font-bold text-sm hover:bg-white/5 transition-all"
            >
              Reload Page
            </Link>
          </div>
        </div>
      ) : filteredMedia.length > 0 ? (
        <>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredMedia.map((manga: any, index: number) => (
              <AnimeCard 
                key={manga.id} 
                anime={manga} 
                isManga={true}
                priority={index < 12}
              />
            ))}
          </div>
          
          {/* Pagination */}
          <Pagination 
            currentPage={pageInfo.currentPage || currentPage} 
            lastPage={pageInfo.lastPage || 1} 
            basePath="/browse/manga"
            queryParams={{
              ...(query ? { q: query } : {}),
              ...(type ? { type: type } : {}),
              ...(genre ? { genre: genre } : {}),
              ...(status ? { status: status } : {}),
              ...(year ? { year: year } : {}),
              ...(sort && sort !== 'popular' ? { sort: sort } : {})
            }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121326]/30 backdrop-blur-md rounded-3xl border border-white/5 max-w-4xl mx-auto p-8">
          <p className="text-lg md:text-xl text-gray-300 font-bold mb-1">No results found for your filter combination.</p>
          <p className="text-xs md:text-sm text-gray-500 mb-6">Try adjusting your genre, keywords, or format filters.</p>
          <Link
            href="/browse/manga"
            className="bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff4dd2]/20"
          >
            Reset Filters
          </Link>
        </div>
      )}
    </div>
  );
}
