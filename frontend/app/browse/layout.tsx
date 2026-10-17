import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Anime | Anime Nation India',
  description: 'Explore, filter, and discover thousands of anime series, movies, and trending releases on Anime Nation India.',
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#050716] min-h-screen pt-28 sm:pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff4dd2]/[0.03] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] left-[-5%] w-[45%] h-[45%] bg-[#ff6400]/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-12 max-w-[1600px] relative z-10">
        {/* Page Header with BackButton clearance */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08] pl-10 sm:pl-12 lg:pl-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff4dd2] mb-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4dd2] animate-pulse" />
              <span>Catalog &amp; Discovery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-display">
              Browse Anime
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
              Explore, filter, and discover thousands of anime series, movies, and trending releases with live filters.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
