/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Play, Tv, Film } from 'lucide-react';
import WatchlistDropdown from './WatchlistDropdown';
import TrailerModal from './TrailerModal';
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
  seasonYear?: number | null;
  trailer?: {
    id: string | null;
    site: string | null;
  } | null;
}

export default function Hero({ animeList }: { animeList: HeroAnime[] }) {
  const [mounted, setMounted] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeTrailer, setActiveTrailer] = useState<{ id: string; title: string } | null>(null);
  const [logosMap, setLogosMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const scrollSetting = localStorage.getItem('autoScrollEnabled');
    if (scrollSetting === 'false') {
      setAutoScroll(false);
    }
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Fetch TMDB ClearArt logos for the top hero anime
  useEffect(() => {
    if (!animeList || animeList.length === 0) return;

    let isMounted = true;
    const fetchLogos = async () => {
      const topItems = animeList.slice(0, 8);
      const newMap: Record<number, string> = {};

      await Promise.all(topItems.map(async (anime) => {
        const title = anime.title.english || anime.title.romaji;
        const cleanTitle = encodeURIComponent(title.replace(/\s*\(TV\)/gi, '').replace(/[:\-_]/g, ' ').trim());
        try {
          const res = await fetch(`https://api.tmdb.org/3/search/tv?api_key=2bca404e6766fc6ac7cb29ae38db027f&query=${cleanTitle}`);
          if (res.ok) {
            const data = await res.json();
            const tmdbId = data.results?.[0]?.id;
            if (tmdbId) {
              const imgRes = await fetch(`https://api.tmdb.org/3/tv/${tmdbId}/images?api_key=2bca404e6766fc6ac7cb29ae38db027f&include_image_language=en,ja,null`);
              if (imgRes.ok) {
                const imgData = await imgRes.json();
                const logo = (imgData.logos || []).find((l: any) => l.iso_639_1 === 'en' || !l.iso_639_1) || imgData.logos?.[0];
                if (logo?.file_path) {
                  newMap[anime.id] = `https://image.tmdb.org/t/p/original${logo.file_path}`;
                }
              }
            }
          }
        } catch {}
      }));

      if (isMounted && Object.keys(newMap).length > 0) {
        setLogosMap(prev => ({ ...prev, ...newMap }));
      }
    };

    fetchLogos();
    return () => { isMounted = false; };
  }, [animeList]);

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
          const logoUrl = logosMap[anime.id];
          const trailerId = anime.trailer?.id && anime.trailer?.site === 'youtube' ? anime.trailer.id : null;

          return (
            <SwiperSlide key={`hero-${anime.id}-${index}`}>
              <div className="relative w-full h-full">
                
                {/* Full Width Background Image */}
                <div className="absolute inset-0 w-full h-full">
                  {backgroundImage && (
                    <img 
                      src={backgroundImage} 
                      alt={title} 
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      className="absolute inset-0 w-full h-full object-cover object-center md:object-[center_20%]" 
                    />
                  )}
                  {/* Deep Space Dark Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050716]/98 via-[#050716]/70 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-transparent z-10"></div>
                </div>

                <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] h-full relative z-20">
                  <div className="w-full md:w-3/5 lg:w-1/2 flex flex-col justify-end md:justify-center h-full pb-16 md:pb-0">
                    
                    {/* Official ClearArt Logo or Stylized Title */}
                    {logoUrl ? (
                      <div className="mb-4 max-w-[320px] sm:max-w-[400px] md:max-w-[460px] h-16 sm:h-24 md:h-28 flex items-center">
                        <img
                          src={logoUrl}
                          alt={title}
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)]"
                        />
                      </div>
                    ) : (
                      <h1 className="font-bebas text-4xl md:text-6xl lg:text-7xl text-white mb-3 line-clamp-2 leading-none uppercase drop-shadow-2xl">
                        {title}
                      </h1>
                    )}

                    <div className="flex items-center gap-3 mb-3 text-[13px] font-semibold text-[#a0a0a0]">
                      <span className="text-[#050716] bg-[#ff4dd2] px-2 py-0.5 rounded-md font-black text-xs uppercase shadow-md shadow-[#ff4dd2]/30">
                        {anime.format || 'TV'}
                      </span>
                      {anime.averageScore && (
                        <span className="text-amber-400 font-extrabold flex items-center gap-1">
                          ★ {(anime.averageScore / 10).toFixed(1)}
                        </span>
                      )}
                      {anime.status && (
                        <span className="text-xs text-gray-300 font-semibold uppercase tracking-wider">
                          • {anime.status.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>

                    <div 
                      className="text-gray-300/90 text-[12px] md:text-[13px] mb-6 line-clamp-3 leading-relaxed max-w-lg"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(anime.description) || 'No description available.' }}
                    ></div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 md:gap-4">
                      {/* 1. Watch Now */}
                      <Link href={`/watch/${linkId}`} className="inline-flex flex-1 items-center justify-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold py-2.5 md:py-3 px-6 md:px-8 text-xs md:text-sm transition-all uppercase tracking-wider shadow-lg shadow-[#ff4dd2]/30 rounded-xl cursor-pointer">
                        <Play size={16} fill="currentColor" />
                        WATCH NOW
                      </Link>

                      {/* 2. Official Trailer Modal Trigger */}
                      {trailerId && (
                        <button
                          onClick={() => setActiveTrailer({ id: trailerId, title })}
                          className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 font-bold py-2.5 md:py-3 px-5 md:px-6 text-xs md:text-sm transition-all uppercase tracking-wider rounded-xl backdrop-blur-md cursor-pointer"
                        >
                          <Film size={16} className="text-[#ff4dd2]" />
                          TRAILER
                        </button>
                      )}

                      {/* 3. View Details */}
                      <Link href={`/series/${linkId}`} className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white border border-white/20 font-bold py-2.5 md:py-3 px-5 md:px-6 text-xs md:text-sm transition-all uppercase tracking-wider rounded-xl backdrop-blur-md">
                        DETAILS
                      </Link>

                      {/* 4. Watchlist Toggle */}
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

      {/* 4K Official Trailer Modal */}
      {activeTrailer && (
        <TrailerModal
          youtubeId={activeTrailer.id}
          title={activeTrailer.title}
          isOpen={true}
          onClose={() => setActiveTrailer(null)}
        />
      )}
    </section>
  );
}
