'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Flame } from 'lucide-react';

interface HomeTopListsProps {
  topMovies: any[];
  topTV: any[];
  awards: any[];
  year: number;
}

export default function HomeTopLists({ topMovies, topTV, awards, year }: HomeTopListsProps) {
  const getRating = (score: number | null) => {
    if (!score) return '8.20';
    return (score / 10).toFixed(2);
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="absolute -top-1.5 -left-1.5 z-10 bg-[#ff4dd2] text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-black/10 shadow-md">
          #1
        </span>
      );
    }
    return (
      <span className="absolute -top-1.5 -left-1.5 z-10 bg-[#1e2030] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white/10 shadow-md">
        #{rank}
      </span>
    );
  };

  return (
    <section className="w-full my-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Top Movies */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 items-start">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              🎬 Top Movies
            </h3>
            <Link 
              href="/browse/all?format=MOVIE" 
              className="bg-[#121328] hover:bg-[#1a1c38] text-white/85 hover:text-white border border-white/5 rounded-full px-4 py-1 text-xs font-bold transition-all"
            >
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {topMovies.slice(0, 4).map((anime) => {
              const linkId = anime.idMal || anime.id;
              const title = anime.title.english || anime.title.romaji;
              return (
                <div key={anime.id} className="flex items-center gap-4 group/item">
                  <Link href={`/series/${linkId}`} className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 hover:scale-105 transition-transform duration-300">
                    <Image
                      src={anime.coverImage.large}
                      alt={title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex flex-col gap-1 min-w-0">
                    <Link href={`/series/${linkId}`} className="text-sm font-bold text-white hover:text-[#ff4dd2] transition-colors line-clamp-1">
                      {title}
                    </Link>
                    <span className="text-xs text-[#ff4dd2] font-bold flex items-center gap-1">
                      ★ {getRating(anime.averageScore)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Top TV Series */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 items-start">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              📺 Top TV Series
            </h3>
            <Link 
              href="/browse/all?format=TV" 
              className="bg-[#121328] hover:bg-[#1a1c38] text-white/85 hover:text-white border border-white/5 rounded-full px-4 py-1 text-xs font-bold transition-all"
            >
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {topTV.slice(0, 4).map((anime) => {
              const linkId = anime.idMal || anime.id;
              const title = anime.title.english || anime.title.romaji;
              return (
                <div key={anime.id} className="flex items-center gap-4 group/item">
                  <Link href={`/series/${linkId}`} className="relative w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 hover:scale-105 transition-transform duration-300">
                    <Image
                      src={anime.coverImage.large}
                      alt={title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex flex-col gap-1 min-w-0">
                    <Link href={`/series/${linkId}`} className="text-sm font-bold text-white hover:text-[#ff4dd2] transition-colors line-clamp-1">
                      {title}
                    </Link>
                    <span className="text-xs text-[#ff4dd2] font-bold flex items-center gap-1">
                      ★ {getRating(anime.averageScore)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Awards */}
        <div className="bg-[#0b0c20]/60 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col gap-5">
          <div className="flex flex-col gap-2.5 items-start">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              🏆 {year} Awards
            </h3>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {awards.slice(0, 4).map((anime, index) => {
              const linkId = anime.idMal || anime.id;
              const title = anime.title.english || anime.title.romaji;
              return (
                <div key={anime.id} className="flex items-center gap-4 group/item">
                  <div className="relative flex-shrink-0">
                    {renderRankBadge(index + 1)}
                    <Link href={`/series/${linkId}`} className="relative block w-12 h-16 rounded-xl overflow-hidden border border-white/10 hover:scale-105 transition-transform duration-300">
                      <Image
                        src={anime.coverImage.large}
                        alt={title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </Link>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <Link href={`/series/${linkId}`} className="text-sm font-bold text-white hover:text-[#ff4dd2] transition-colors line-clamp-1">
                      {title}
                    </Link>
                    <span className="text-xs text-[#ff4dd2] font-bold flex items-center gap-1">
                      Contender <Flame size={12} fill="currentColor" className="text-[#ff4dd2]" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
