'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Play, Bookmark } from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';
import { sanitizeHTML } from '../lib/sanitize';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface HeroAnime {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage?: {
    extraLarge?: string;
    large: string;
  };
  bannerImage: string | null;
  description: string | null;
  status: string | null;
  format: string | null;
  averageScore: number | null;
}

export default function Hero({ animeList }: { animeList: HeroAnime[] }) {
  const [mounted, setMounted] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const scrollSetting = localStorage.getItem('autoScrollEnabled');
    if (scrollSetting === 'false') {
      setAutoScroll(false);
    }
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) return <div className="h-[55vh] lg:h-[600px] w-full bg-[#000000] animate-pulse"></div>;
  if (!animeList || animeList.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-[#050716] group">
      {/* 🌟 Custom Swiper Pagination Styles for Neon Dashes */}
      <style>{`
        .swiper-pagination-bullet {
          width: 24px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.3);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .swiper-pagination-bullet-active {
          width: 32px;
          background: #ff4dd2;
          box-shadow: 0 0 10px rgba(255, 77, 210, 0.8);
        }
      `}</style>
      <Swiper
        modules={[Autoplay, Navigation, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{ nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }}
        pagination={{ clickable: true }}
        autoplay={autoScroll ? { delay: 6000, disableOnInteraction: false } : false}
        loop={true}
        className="w-full h-[55vh] md:h-[60vh] lg:h-[600px]" 
      >
        {animeList.map((anime, index) => {
          const title = anime.title.english || anime.title.romaji;
          const backgroundImage = anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large;
          const linkId = anime.idMal || anime.id;

          return (
            <SwiperSlide key={`hero-${anime.id}-${index}`}>
              <div className="relative w-full h-full">
                
                {/* Full Width Background Image */}
                <div className="absolute inset-0 w-full h-full">
                  {backgroundImage && (
                    <Image 
                      src={backgroundImage} 
                      alt={title} 
                      fill 
                      priority 
                      quality={100}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw" 
                      className="object-cover object-center md:object-[center_20%]" 
                    />
                  )}
                  {/* Deep Space Dark Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050716]/95 via-[#050716]/60 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-transparent z-10"></div>
                </div>

                <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] h-full relative z-20">
                  <div className="w-full md:w-3/5 lg:w-1/2 flex flex-col justify-end md:justify-center h-full pb-16 md:pb-0">
                    <h1 className="font-bebas text-4xl md:text-6xl lg:text-7xl text-white mb-3 line-clamp-2 leading-none uppercase drop-shadow-2xl">
                      {title}
                    </h1>

                    <div className="flex items-center gap-3 mb-4 text-[13px] font-semibold text-[#a0a0a0]">
                      <span className="text-[#050716] bg-[#ff4dd2] px-1.5 rounded font-bold uppercase glow-purple">{anime.format || 'TV'}</span>
                      {anime.averageScore && <span>★ {(anime.averageScore / 10).toFixed(1)}</span>}
                    </div>

                    <div 
                      className="text-gray-400 text-[12px] md:text-[13px] mb-6 line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(anime.description) || 'No description available.' }}
                    ></div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 md:gap-4">
                      <Link href={`/watch/${linkId}`} className="inline-flex flex-1 items-center justify-center gap-2 bg-[#ff4dd2] hover:bg-[#ff4dd2] text-white font-bold py-2.5 md:py-3 px-6 md:px-8 text-sm md:text-base transition-colors uppercase tracking-wider glow-purple rounded-sm">
                        <Play size={18} fill="currentColor" className="md:w-5 md:h-5" />
                        WATCH NOW
                      </Link>
                      <Link href={`/series/${linkId}`} className="inline-flex flex-1 items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white border border-[#ff4dd2]/50 font-bold py-2.5 md:py-3 px-6 md:px-8 text-sm md:text-base transition-colors uppercase tracking-wider rounded-sm backdrop-blur-md">
                        VIEW DETAILS
                      </Link>
                      <WatchlistDropdown 
                        animeId={linkId} 
                        title={title} 
                        image={backgroundImage || ''} 
                        variant="icon" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}

        <div className="swiper-button-prev !text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.8)] !left-4 md:!left-8 opacity-0 group-hover:opacity-100 transition-opacity after:!text-2xl md:after:!text-4xl hover:scale-110"></div>
        <div className="swiper-button-next !text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.8)] !right-4 md:!right-8 opacity-0 group-hover:opacity-100 transition-opacity after:!text-2xl md:after:!text-4xl hover:scale-110"></div>
      </Swiper>
    </section>
  );
}
