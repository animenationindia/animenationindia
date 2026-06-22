import { Metadata } from 'next';
import GenresContent from '../../components/GenresContent';

export const metadata: Metadata = {
  title: 'Anime Genres | Anime Nation India',
  description: 'Browse anime by your favorite genres.',
};

export default async function GenresPage({ searchParams }: { searchParams: Promise<{ genreId?: string; sort?: string; page?: string }> }) {
  const resolvedParams = await searchParams;
  
  return (
    <div className="bg-[#110c22] min-h-screen pt-32 lg:pt-36 pb-12 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[65%] h-[45%] bg-[#ff4dd2]/5 blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] relative z-10">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-3">
            Explore <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Genres</span>
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base leading-relaxed">
            Discover new anime based on your favorite categories. From action-packed Shounen to heartwarming Romance.
          </p>
        </div>
        <GenresContent searchParams={resolvedParams} basePath="/genres" />
      </div>
    </div>
  );
}
