'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Mousewheel } from 'swiper/modules';
import { Play, X } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';

export default function TrailerSlider({ trailers }: { trailers: any[] }) {
  const [selectedTrailerId, setSelectedTrailerId] = useState<string | null>(null);

  if (!trailers || trailers.length === 0) return null;

  return (
    <section className="mb-14 relative group/trailer-section">
      <div className="flex items-end gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide">Official Anime Trailers</h2>
        <Link href="/trailers" className="text-xs md:text-sm font-bold text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors mb-1 uppercase tracking-wider">
          View All
        </Link>
      </div>

      <Swiper
        modules={[Navigation, Autoplay, Mousewheel]}
        spaceBetween={16}
        slidesPerView={1.2}
        grabCursor={true}
        mousewheel={{
          forceToAxis: true,
        }}
        navigation={{
          prevEl: '.trailer-prev',
          nextEl: '.trailer-next',
        }}
        autoplay={{
          delay: 4000,
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
        {trailers.map((anime: any) => {
          const title = anime.title.english || anime.title.romaji;
          const thumbnailUrl = anime.trailer.thumbnail || `https://i.ytimg.com/vi/${anime.trailer.id}/hqdefault.jpg`;

          return (
            <SwiperSlide key={anime.id}>
              <div 
                className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-[#121214] border border-white/5"
                onClick={() => setSelectedTrailerId(anime.trailer.id)}
              >
                <Image 
                  src={thumbnailUrl} 
                  alt={title} 
                  fill 
                  sizes="(max-width: 768px) 80vw, (max-width: 1200px) 40vw, 20vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white group-hover:text-[#f47521] group-hover:scale-110 transition-all border border-white/10 group-hover:border-[#f47521]/50">
                    <Play size={24} className="ml-1 fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <h3 className="text-white font-semibold text-sm md:text-base line-clamp-1">{title}</h3>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      <button aria-label="Previous trailer" className="trailer-prev absolute top-[55%] -left-4 md:-left-6 z-10 w-10 h-10 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover/trailer-section:opacity-100 transition-opacity hover:bg-[#ff4dd2] hover:border-[#ff4dd2] shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button aria-label="Next trailer" className="trailer-next absolute top-[55%] -right-4 md:-right-6 z-10 w-10 h-10 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover/trailer-section:opacity-100 transition-opacity hover:bg-[#ff4dd2] hover:border-[#ff4dd2] shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* Trailer Modal */}
      {selectedTrailerId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-sm" onClick={() => setSelectedTrailerId(null)}>
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-[#2A2B30]" onClick={e => e.stopPropagation()}>
            <button 
              aria-label="Close trailer"
              onClick={() => setSelectedTrailerId(null)}
              className="absolute top-4 right-4 z-10 bg-black/60 p-2 rounded-full text-white hover:bg-[#f47521] transition-all"
            >
              <X size={24} />
            </button>
            <iframe 
              src={`https://www.youtube.com/embed/${selectedTrailerId}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
}
