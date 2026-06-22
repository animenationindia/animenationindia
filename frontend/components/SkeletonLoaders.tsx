import { Newspaper, Loader2 } from 'lucide-react';

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="w-full aspect-[2/3] bg-[#2A2B30]/30 rounded-lg border border-white/5"></div>
          <div className="flex flex-col gap-2 px-1">
            <div className="h-4 bg-[#2A2B30]/30 rounded w-3/4"></div>
            <div className="h-3 bg-[#2A2B30]/30 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4 bg-[#121326]/30 border border-[#2A2B30]/20 rounded-xl overflow-hidden p-4">
          <div className="w-full aspect-[16/9] bg-[#2A2B30]/30 rounded-lg"></div>
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-[#2A2B30]/30 rounded w-full"></div>
            <div className="h-4 bg-[#2A2B30]/30 rounded w-5/6"></div>
            <div className="h-3 bg-[#2A2B30]/30 rounded w-1/3 mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoader({ type = 'anime' }: { type?: 'anime' | 'news' | 'generic' }) {
  return (
    <div className="min-h-screen bg-[#050716] pt-24 pb-20 w-full flex flex-col">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] flex-1">
        {/* Header Skeleton */}
        <div className="mb-10 border-b border-white/5 pb-8 animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2A2B30]/30 rounded-xl"></div>
          <div className="flex flex-col gap-3">
            <div className="h-8 bg-[#2A2B30]/30 rounded w-48 md:w-64"></div>
            <div className="h-4 bg-[#2A2B30]/30 rounded w-32 md:w-48"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        {type === 'news' ? <NewsGridSkeleton /> : <GridSkeleton />}
      </div>
    </div>
  );
}
