/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Metadata } from 'next';
import { getPopularAnimePageAniList } from '../../lib/api';
import AnimeCard from '../../components/AnimeCard';
import Pagination from '../../components/Pagination';

export const metadata: Metadata = {
  title: 'Popular Anime | Anime Nation India',
  description: 'Explore the most popular, trending, and top-rated anime right now.',
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PopularAnimePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;
  const { media, pageInfo } = await getPopularAnimePageAniList(currentPage);

  return (
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 lg:pt-36 pb-12">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px]">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
            Popular & <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Trending</span>
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
            Explore the most celebrated anime of the season. Dive into current trending sensations and legendary all-time masterpieces.
          </p>
        </div>

        {media.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
              {media.map((anime: any, index: number) => (
                <AnimeCard 
                  key={anime.id} 
                  anime={anime} 
                  priority={index < 12} 
                />
              ))}
            </div>
            
            <Pagination 
              currentPage={pageInfo.currentPage || currentPage} 
              lastPage={pageInfo.lastPage || 1} 
              basePath="/popular" 
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-xl text-gray-400 mb-4">No anime found</p>
          </div>
        )}
      </div>
    </div>
  );
}

