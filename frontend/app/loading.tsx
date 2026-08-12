import React from 'react';

export default function Loading() {
  return (
    <div className="w-full min-h-[100dvh] bg-[#050716] pt-24 pb-20 px-4 md:px-8 lg:px-12">
      <div className="container mx-auto max-w-[1600px] w-full space-y-10">
        
        {/* ── 1. Hero Carousel Skeleton (Matched Aspect Ratio) ── */}
        <div className="relative w-full h-[45vh] md:h-[55vh] lg:h-[500px] rounded-3xl overflow-hidden bg-white/[0.03] border border-white/5 p-6 md:p-12 flex flex-col justify-end animate-pulse">
          <div className="w-24 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/30 mb-4" />
          <div className="w-3/4 max-w-xl h-10 md:h-14 rounded-2xl bg-white/10 mb-4" />
          <div className="w-1/2 max-w-md h-4 rounded-lg bg-white/5 mb-8 hidden sm:block" />
          <div className="flex gap-4">
            <div className="w-36 h-11 rounded-xl bg-[#ff4dd2]/30" />
            <div className="w-36 h-11 rounded-xl bg-white/10 border border-white/10" />
          </div>
        </div>

        {/* ── 2. Section Header Skeleton ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 rounded-full bg-[#ff4dd2]" />
              <div className="w-48 h-6 rounded-lg bg-white/10 animate-pulse" />
            </div>
            <div className="w-20 h-4 rounded-md bg-white/5 animate-pulse" />
          </div>

          {/* ── 3. Aspect-[2/3] Card Poster Skeleton Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-5">
            {[...Array(14)].map((_, i) => (
              <div 
                key={i} 
                className={`flex flex-col gap-2.5 ${i >= 6 ? 'hidden md:flex' : ''} ${i >= 10 ? 'hidden xl:flex' : ''}`}
              >
                {/* Poster Box */}
                <div className="w-full aspect-[2/3] rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden relative animate-pulse">
                  <div className="absolute top-2.5 left-2.5 w-12 h-4 rounded-md bg-white/10" />
                  <div className="absolute bottom-2.5 right-2.5 w-10 h-3 rounded bg-white/10" />
                </div>
                {/* Title Line */}
                <div className="w-4/5 h-4 rounded-md bg-white/10 animate-pulse mt-1" />
                {/* Subtitle Line */}
                <div className="w-1/2 h-3 rounded-md bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
