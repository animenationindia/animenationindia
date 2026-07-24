// components/SectionSlider.tsx
'use client';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel } from 'swiper/modules';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import AnimeCard from './AnimeCard';
import PersonCard from './PersonCard';

type SectionItem = 
  | Parameters<typeof AnimeCard>[0]['anime']
  | Parameters<typeof PersonCard>[0]['person'];

interface Props {
  title: string;
  data: SectionItem[];
  type: 'anime' | 'person';
  viewAllLink: string;
  isManga?: boolean;
}

export default function SectionSlider({ title, data, type, viewAllLink, isManga = false }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full mb-10 group/section relative">
      {/* Section Header with Title & View All */}
      <div className="flex items-end gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{title}</h2>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-xs md:text-sm font-bold text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors mb-1 uppercase tracking-wider drop-shadow-md">
            View All
          </Link>
        )}
      </div>

      {/* Slider */}
      <div className="relative">
        <Swiper
          modules={[Navigation, Mousewheel]}
          spaceBetween={16}
          slidesPerView={3}
          grabCursor={true}
          mousewheel={{
            forceToAxis: true,
            releaseOnEdges: true,
          }}
          breakpoints={{
            640: { slidesPerView: 4 },
            768: { slidesPerView: 5 },
            1024: { slidesPerView: 6 },
            1280: { slidesPerView: 7 },
            1536: { slidesPerView: 8 },
          }}
          navigation={{
            nextEl: `.swiper-next-${title.replace(/[^a-zA-Z0-9]/g, '')}`,
            prevEl: `.swiper-prev-${title.replace(/[^a-zA-Z0-9]/g, '')}`,
          }}
          className="w-full pb-6 pt-2"
        >
          {data.map((item, index) => {
            const personLinkType = viewAllLink?.includes('character') ? 'character' : 'staff';
            return (
              <SwiperSlide key={`${item.id}-${index}`}>
                {type === 'anime' ? (
                  <AnimeCard anime={item as Parameters<typeof AnimeCard>[0]['anime']} priority={index < 5} isManga={isManga} />
                ) : (
                  <PersonCard person={item as Parameters<typeof PersonCard>[0]['person']} linkType={personLinkType} />
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
        
        {/* Navigation Overlays */}
        <button aria-label={`Previous slide for ${title}`} className={`swiper-prev-${title.replace(/[^a-zA-Z0-9]/g, '')} absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#050716] via-[#050716]/80 to-transparent z-10 flex items-center justify-start opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 cursor-pointer pointer-events-none disabled:pointer-events-none`}>
          <div className="bg-[#121326]/80 backdrop-blur p-2 rounded-r-md text-[#ff4dd2] hover:text-[#ff4dd2] hover:bg-[#050716] transition-colors shadow-[0_0_15px_rgba(255, 77, 210,0.3)] pointer-events-auto">
            <ChevronLeft size={24} />
          </div>
        </button>
        <button aria-label={`Next slide for ${title}`} className={`swiper-next-${title.replace(/[^a-zA-Z0-9]/g, '')} absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#050716] via-[#050716]/80 to-transparent z-10 flex items-center justify-end opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 cursor-pointer pointer-events-none disabled:pointer-events-none`}>
          <div className="bg-[#121326]/80 backdrop-blur p-2 rounded-l-md text-[#ff4dd2] hover:text-[#ff4dd2] hover:bg-[#050716] transition-colors shadow-[0_0_15px_rgba(255, 77, 210,0.3)] pointer-events-auto">
            <ChevronRight size={24} />
          </div>
        </button>
      </div>
    </div>
  );
}
