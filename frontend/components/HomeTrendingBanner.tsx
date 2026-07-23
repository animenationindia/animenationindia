'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, Info } from 'lucide-react';
import { sanitizeHTML } from '../lib/sanitize';
import { motion } from 'framer-motion';

interface TrendingBannerProps {
  anime: {
    id: number;
    idMal: number | null;
    title: {
      romaji: string;
      english: string | null;
    };
    bannerImage: string | null;
    coverImage?: {
      extraLarge?: string;
      large: string;
    };
    description: string | null;
  } | null;
  subtitle?: string;
}

export default function HomeTrendingBanner({ anime, subtitle }: TrendingBannerProps) {
  if (!anime) return null;

  const title = anime.title.english || anime.title.romaji;
  const backgroundImage = anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large || '';
  const linkId = anime.idMal || anime.id;

  return (
    <section className="relative w-full overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-r from-[#050716] via-[#050716]/80 to-transparent my-10 group shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer hover:border-white/10 transition-colors">
      {/* Clickable Overlay Link to Details Page */}
      <Link
        href={`/series/${linkId}`}
        className="absolute inset-0 z-10"
        aria-label={`View details for ${title}`}
      />

      {/* Ornate Gold Border Corners (matching the screenshot theme) */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#ff4dd2]/30 pointer-events-none z-20 rounded-tl-md"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#ff4dd2]/30 pointer-events-none z-20 rounded-br-md"></div>

      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover object-center opacity-40 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        )}
        {/* Dark overlays to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050716] via-[#050716]/85 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-transparent z-10" />
      </div>

      {/* Content Container (pointer-events-none allows clicks to pass through to the overlay link) */}
      <div className="relative z-20 px-8 py-10 md:py-16 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8 w-full pointer-events-none">
        {/* Left Side: Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-2xl">
          <span className="text-[#ff4dd2] text-xs font-black tracking-[0.25em] uppercase mb-3 drop-shadow-md">
            {subtitle || "★ Trending This Season"}
          </span>
          <h2 className="text-3xl md:text-5xl font-bebas text-white tracking-wide leading-none uppercase mb-4 drop-shadow-lg">
            {title}
          </h2>
          <p
            className="text-gray-400 text-xs md:text-sm line-clamp-3 leading-relaxed mb-6 max-w-xl"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(anime.description) || 'Watch the latest episodes of this season\'s most popular trending series.' }}
          />

          {/* Action Buttons (pointer-events-auto overrides container setting to make buttons clickable) */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start pointer-events-auto">
            <Link
              href={`/watch/${linkId}`}
              className="relative z-30 inline-flex items-center gap-2 bg-[#ff0000] hover:bg-[#cc0000] text-white font-extrabold py-3 px-8 rounded-full text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_20px_rgba(255,0,0,0.4)] hover:shadow-[0_4px_30px_rgba(255,0,0,0.6)] cursor-pointer"
            >
              <Play size={16} fill="currentColor" />
              Watch Now
            </Link>
            <Link
              href={`/series/${linkId}`}
              className="relative z-30 inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-extrabold py-3 px-8 rounded-full text-sm uppercase tracking-wider transition-all duration-300 backdrop-blur-md cursor-pointer"
            >
              <Info size={16} />
              View Details
            </Link>
          </div>
        </div>

        {/* Right Side: Floating Character Artwork Cover Card */}
        {(anime.coverImage?.extraLarge || anime.coverImage?.large) && (
          <div className="hidden lg:block relative w-[180px] h-[260px] flex-shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] transform rotate-2 hover:rotate-0 transition-transform duration-500">
            <Image
              src={anime.coverImage.extraLarge || anime.coverImage.large}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
