import { Metadata } from 'next';
import { searchMangaJikan } from '../../../lib/api';
import AnimeCard from '../../../components/AnimeCard';
import Pagination from '../../../components/Pagination';
import MangaSearchFilters from '../../../components/MangaSearchFilters';

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

  // Fetch manga data from Jikan
  const data = await searchMangaJikan(query, currentPage, type, isAdult);
  const media = data.media || [];
  const pageInfo = data.pageInfo || { hasNextPage: false, lastPage: 1 };

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
      {query && (
        <div className="max-w-4xl mx-auto mb-6 text-gray-400 text-xs md:text-sm font-semibold">
          Found results for &quot;<span className="text-[#ff4dd2]">{query}</span>&quot;
          {type && <span> in <span className="text-[#ff4dd2] uppercase">{type}</span></span>}
        </div>
      )}

      {/* Results Grid */}
      {filteredMedia.length > 0 ? (
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
