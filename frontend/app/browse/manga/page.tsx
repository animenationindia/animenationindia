import { Metadata } from 'next';
import { searchMangaJikan } from '../../../lib/api';
import AnimeCard from '../../../components/AnimeCard';
import Pagination from '../../../components/Pagination';
import MangaSearchFilters from '../../../components/MangaSearchFilters';
import ErrorState from '../../../components/ErrorState';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Browse Manga & Novels | Anime Nation India',
  description: 'Search and browse your favorite manga, manhwa, and light novels database.',
};

interface MangaPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
    adult?: string;
  }>;
}

const ALLOWED_MANGA_TYPES = ['manga', 'manhwa', 'manhua', 'novel', 'light novel', 'lightnovel'];

export default async function BrowseMangaPage({ searchParams }: MangaPageProps) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  const type = resolvedParams.type || '';
  const currentPage = parseInt(resolvedParams.page || '1', 10);
  const isAdult = resolvedParams.adult === 'true';

  let media: any[] = [];
  let pageInfo = { hasNextPage: false, lastPage: 1, currentPage: 1 };
  let isError = false;
  let errorMessage = 'Failed to load manga database. Please try again.';

  try {
    const data = await searchMangaJikan(query, currentPage, type, isAdult);
    media = data?.media || [];
    pageInfo = data?.pageInfo || { hasNextPage: false, lastPage: 1, currentPage };
  } catch (err: any) {
    isError = true;
    const errStr = String(err?.message || err);
    if (errStr.includes('504') || errStr.toLowerCase().includes('timeout')) {
      errorMessage = 'The server is taking too long to respond (504 Timeout). Please try again shortly.';
    }
  }

  // Filter to show only Manga, Manhwa, and Novels (excluding Doujinshi, One-shots etc.)
  const filteredMedia = media.filter((item: any) => {
    const itemFormat = (item.format || '').toLowerCase();
    return ALLOWED_MANGA_TYPES.includes(itemFormat);
  });

  return (
    <div className="w-full pb-12 relative z-10">
      {/* Search and Filter Inputs */}
      <MangaSearchFilters initialQuery={query} initialType={type} initialAdult={isAdult} />

      {/* Results Info */}
      {query && !isError && (
        <div className="max-w-4xl mx-auto mb-6 text-gray-400 text-xs md:text-sm font-semibold">
          Found results for &quot;<span className="text-[#ff4dd2]">{query}</span>&quot;
          {type && <span> in <span className="text-[#ff4dd2] uppercase">{type}</span></span>}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
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
              ...(isAdult ? { adult: 'true' } : {})
            }}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121326]/30 backdrop-blur-md rounded-2xl border border-white/5 max-w-4xl mx-auto">
          <p className="text-lg md:text-xl text-gray-400 font-medium">No results found for manga, manhwa, or novels.</p>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Try adjusting your search keywords or category filters.</p>
        </div>
      )}
    </div>
  );
}
