import { getAnimeFullDetails, getAnimeEpisodes } from '../../../lib/api';
import Link from 'next/link';
import WatchPageContent from '../../../components/WatchPageContent';

interface Params {
  id: string;
}

export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  
  const [anime, episodesData] = await Promise.all([
    getAnimeFullDetails(id),
    getAnimeEpisodes(id)
  ]);

  if (!anime) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-400 bg-[#070708]">
        <h1 className="text-3xl font-bebas text-white mb-4 tracking-widest">Video Not Found</h1>
        <Link href="/" className="text-[#ff6400] hover:underline bg-[#ff6400]/10 px-6 py-2 rounded-full transition-all">Go back home</Link>
      </div>
    );
  }

  // Handle Jikan episode format which might be an array or paginated
  const episodes = Array.isArray(episodesData) ? episodesData : (episodesData?.data || []);
  
  // Fallback to generating mock episodes if API doesn't return list but we know the count
  const episodeCount = anime.episodes || 12;
  const displayEpisodes = episodes.length > 0 
    ? episodes 
    : Array.from({ length: episodeCount }).map((_, i) => ({
        mal_id: i + 1,
        title: `Episode ${i + 1}`,
        score: null,
      }));

  return (
    <main className="min-h-screen bg-[#040405] pt-32 lg:pt-36 pb-16 selection:bg-[#ff4dd2] selection:text-white">
      <WatchPageContent anime={anime} episodes={displayEpisodes} />
    </main>
  );
}
