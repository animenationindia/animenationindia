/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Mousewheel } from 'swiper/modules';
import { Play, X, Film, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { toEnglishTitle } from '../lib/titleCleaner';
import 'swiper/css';
import 'swiper/css/navigation';

export interface TrailerData {
  id: number | string;
  title: {
    english?: string;
    romaji?: string;
  };
  trailer: {
    id: string;
    site: string;
    thumbnail?: string;
  };
  status?: string;
  coverImage?: {
    large?: string;
    medium?: string;
  };
  genres?: string[];
}

export default function TrailerSlider({ trailers }: { trailers: any[] }) {
  const [selectedTrailer, setSelectedTrailer] = useState<TrailerData | null>(null);

  // Close modal with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTrailer(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!trailers || trailers.length === 0) return null;

  const formatStatus = (status?: string) => {
    if (!status) return 'Official';
    if (status === 'RELEASING') return 'Airing';
    if (status === 'NOT_YET_RELEASED') return 'Upcoming';
    if (status === 'FINISHED') return 'Completed';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <section className="mb-14 relative group/trailer-section">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff4dd2]/20 to-[#00f7ff]/20 border border-[#ff4dd2]/40 flex items-center justify-center text-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.3)]">
            <Film size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-[#00f7ff]">
              <Sparkles size={11} />
              <span>Official Video Highlights</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              Official Anime <span className="text-[#ff4dd2] drop-shadow-[0_0_12px_rgba(255,77,210,0.6)]">Trailers</span>
            </h2>
          </div>
        </div>

        <Link 
          href="/trailers" 
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#a0a0a0] hover:text-[#ff4dd2] transition-all px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-[#ff4dd2]/10 border border-white/10 hover:border-[#ff4dd2]/40 group cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-[#ff4dd2]" />
        </Link>
      </div>

      <Swiper
        modules={[Navigation, Autoplay, Mousewheel]}
        spaceBetween={16}
        slidesPerView={1.2}
        grabCursor={true}
        mousewheel={{
          forceToAxis: true,
          releaseOnEdges: true,
        }}
        navigation={{
          prevEl: '.trailer-prev',
          nextEl: '.trailer-next',
        }}
        autoplay={{
          delay: 4500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          480: { slidesPerView: 2.2, spaceBetween: 20 },
          768: { slidesPerView: 3.2, spaceBetween: 24 },
          1024: { slidesPerView: 4.2, spaceBetween: 24 },
          1280: { slidesPerView: 5.2, spaceBetween: 24 },
        }}
        className="w-full pb-6 pt-2"
      >
        {trailers.map((anime: any, idx: number) => {
          if (!anime.trailer?.id) return null;
          const rawTitle = anime.title?.english || anime.title?.romaji || (typeof anime.title === 'string' ? anime.title : 'Anime Trailer');
          const title = toEnglishTitle(rawTitle);
          const thumbnailUrl = anime.trailer?.thumbnail || `https://i.ytimg.com/vi/${anime.trailer.id}/hqdefault.jpg`;

          return (
            <SwiperSlide key={`slide-${anime.id || idx}-${anime.trailer.id}`}>
              <div 
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group/card bg-[#0a0c1a] border border-white/10 hover:border-[#ff4dd2]/60 hover:shadow-[0_0_25px_rgba(255,77,210,0.3)] transition-all duration-300 flex flex-col"
                onClick={() => setSelectedTrailer(anime)}
              >
                {/* Thumbnail Image */}
                <img 
                  src={thumbnailUrl} 
                  alt={title} 
                  loading="lazy"
                  onError={(e) => {
                    const fallback = anime.coverImage?.large || anime.coverImage?.medium || '/placeholder-poster.png';
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" 
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 group-hover/card:via-black/20 transition-colors" />

                {/* Status Badge */}
                {anime.status && (
                  <span className="absolute top-2.5 left-2.5 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[#00f7ff] shadow">
                    {formatStatus(anime.status)}
                  </span>
                )}

                {/* HD Badge */}
                <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600/90 text-white shadow">
                  HD
                </span>

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white group-hover/card:bg-[#ff4dd2] group-hover/card:scale-110 group-hover/card:shadow-[0_0_15px_rgba(255,77,210,0.8)] transition-all border border-white/20 group-hover/card:border-[#ff4dd2]">
                    <Play size={20} className="ml-1 fill-white" />
                  </div>
                </div>

                {/* Title and Bottom Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <h3 className="text-white font-semibold text-xs md:text-sm line-clamp-1 group-hover/card:text-[#ff4dd2] transition-colors">
                    {title}
                  </h3>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Navigation Arrows */}
      <button 
        aria-label="Previous trailer" 
        className="trailer-prev absolute top-[55%] -left-3 md:-left-5 z-10 w-9 h-9 md:w-10 md:h-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover/trailer-section:opacity-100 transition-all hover:bg-[#ff4dd2] hover:border-[#ff4dd2] shadow-lg hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button 
        aria-label="Next trailer" 
        className="trailer-next absolute top-[55%] -right-3 md:-right-5 z-10 w-9 h-9 md:w-10 md:h-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover/trailer-section:opacity-100 transition-all hover:bg-[#ff4dd2] hover:border-[#ff4dd2] shadow-lg hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* Cinema Grade Trailer Modal */}
      {selectedTrailer && selectedTrailer.trailer?.id && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-md animate-in fade-in duration-200" 
          onClick={() => setSelectedTrailer(null)}
        >
          <div 
            className="relative w-full max-w-5xl bg-[#0a0c18] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,77,210,0.25)] border border-[#ff4dd2]/30 flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#0e1124] border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff4dd2] animate-pulse flex-shrink-0" />
                <h3 className="text-white font-bold text-sm sm:text-base md:text-lg truncate">
                  {selectedTrailer.title?.english || selectedTrailer.title?.romaji || 'Official Anime Trailer'}
                </h3>
              </div>
              <button 
                aria-label="Close trailer modal"
                onClick={() => setSelectedTrailer(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-[#ff4dd2] text-white transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player 16:9 */}
            <div className="relative aspect-video w-full bg-black">
              <iframe 
                src={`https://www.youtube-nocookie.com/embed/${selectedTrailer.trailer.id}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedTrailer.title?.english || 'Anime Trailer'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0a0c18] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#a0a0a0]">
                  Official YouTube Player • 1080p HD
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${selectedTrailer.trailer.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors flex items-center gap-1"
                >
                  <span>Open on YouTube</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {selectedTrailer.id && (
                <Link
                  href={`/series/${selectedTrailer.id}`}
                  className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#ff4dd2] hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-[#ff4dd2]/10 hover:bg-[#ff4dd2] border border-[#ff4dd2]/30"
                >
                  <span>View Anime Details</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
