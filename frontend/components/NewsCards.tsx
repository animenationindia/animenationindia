'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, User } from 'lucide-react';

interface NewsCardProps {
  id: string;
  title: string;
  date: string;
  dateFormatted: string;
  snippet: string;
  image: string;
  source: string;
  categories: string[];
  author: string;
  index?: number;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function CategoryBadges({ categories, variant = 'default' }: { categories: string[]; variant?: 'default' | 'light' }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat, i) => (
        <span
          key={i}
          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${
            variant === 'light'
              ? 'bg-[#ff4dd2] text-white'
              : 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30'
          }`}
        >
          {cat}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SPOTLIGHT HERO CARD (Big featured card)
// ═══════════════════════════════════════════════════════
export function SpotlightCard({ id, title, date, snippet, image, source, categories, author }: NewsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="group relative w-full h-full min-h-[380px] lg:min-h-[460px] rounded-xl overflow-hidden border border-[#2A2B30]/60 hover:border-[#ff4dd2]/60 transition-all duration-300"
    >
      <Link href={`/news/${id}`} className="block w-full h-full">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050716]/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 z-10">
          <CategoryBadges categories={categories} variant="light" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight line-clamp-3 mt-3 mb-2 group-hover:text-[#ffd54a] transition-colors duration-300 drop-shadow-lg">
            {title}
          </h2>
          <p className="text-sm text-[#b0b0b0] line-clamp-2 leading-relaxed mb-3 hidden md:block">{snippet}</p>
          <div className="flex items-center gap-3 text-[11px] text-[#888]">
            <span className="font-semibold text-[#ff4dd2]">{source}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(date)}</span>
            {author && <><span>•</span><span className="flex items-center gap-1"><User size={10} />{author}</span></>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// TOP STORIES / SIDEBAR CARD (Small horizontal card)
// ═══════════════════════════════════════════════════════
export function SidebarCard({ id, title, date, image, source, categories }: NewsCardProps) {
  return (
    <Link href={`/news/${id}`} className="group flex gap-4 py-3.5 border-b border-[#2A2B30]/30 last:border-0 hover:bg-[#121326]/40 px-2 -mx-2 rounded-lg transition-colors">
      {/* Thumbnail */}
      <div className="relative w-[100px] h-[70px] md:w-[110px] md:h-[75px] rounded-lg overflow-hidden flex-shrink-0 border border-[#2A2B30]/40">
        <Image src={image} alt={title} fill sizes="110px" className="object-cover" unoptimized />
      </div>
      {/* Text */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <CategoryBadges categories={categories} />
        <h3 className="text-[13px] md:text-sm font-semibold text-white line-clamp-2 leading-snug mt-1.5 group-hover:text-[#ffd54a] transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#666]">
          <span className="font-bold text-[#ff4dd2] uppercase tracking-wider">{source}</span>
          <span>•</span>
          <span>{timeAgo(date)}</span>
        </div>
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════
// SECTION CARD (Medium card for Latest News / Features / Announcements grids)
// ═══════════════════════════════════════════════════════
export function SectionHeroCard({ id, title, date, snippet, image, categories, author }: NewsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="group relative block rounded-xl overflow-hidden border border-[#2A2B30]/40 hover:border-[#ff4dd2]/50 transition-all duration-300"
    >
      <Link href={`/news/${id}`} className="block">
        <div className="relative w-full aspect-[16/10] overflow-hidden">
          <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-transparent opacity-80" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          <CategoryBadges categories={categories} variant="light" />
          <h3 className="text-base md:text-lg font-bold text-white line-clamp-2 leading-snug mt-2 mb-1 group-hover:text-[#ffd54a] transition-colors">
            {title}
          </h3>
          <p className="text-xs text-[#999] line-clamp-2 hidden md:block mb-2">{snippet}</p>
          <div className="flex items-center gap-2 text-[10px] text-[#777]">
            <span>{timeAgo(date)}</span>
            {author && <><span>•</span><span className="flex items-center gap-1"><User size={9} />{author}</span></>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function SectionSmallCard({ id, title, date, image, categories, author }: NewsCardProps) {
  return (
    <Link href={`/news/${id}`} className="group block">
      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden mb-2 border border-[#2A2B30]/30">
        <Image src={image} alt={title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
      </div>
      <CategoryBadges categories={categories} variant="light" />
      <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mt-1.5 group-hover:text-[#ffd54a] transition-colors">
        {title}
      </h3>
      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#777]">
        <span>{timeAgo(date)}</span>
        {author && <><span>•</span><span className="flex items-center gap-1"><User size={9} />{author}</span></>}
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════
// GRID CARD (For "More Stories" bottom section)
// ═══════════════════════════════════════════════════════
export function GridCard({ id, title, date, snippet, image, source, categories, author, index = 0 }: NewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ y: -6, rotateX: 2, rotateY: -1 }}
      className="group relative block rounded-xl overflow-hidden border border-[#2A2B30]/40 hover:border-[#ff4dd2]/50 bg-[#121326]/30 backdrop-blur-lg transition-all duration-300 hover:shadow-[0_0_25px_rgba(255, 77, 210,0.15)]"
      style={{ perspective: 800 }}
    >
      <Link href={`/news/${id}`} className="block">
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121326] to-transparent opacity-50" />
          <div className="absolute top-3 left-3">
            <CategoryBadges categories={categories} variant="light" />
          </div>
        </div>
        <div className="p-4 md:p-5">
          <h3 className="text-sm md:text-[15px] font-bold text-white line-clamp-2 leading-snug mb-2 group-hover:text-[#ffd54a] transition-colors">{title}</h3>
          <p className="text-xs text-[#888] line-clamp-2 leading-relaxed mb-3">{snippet}</p>
          <div className="flex items-center gap-2 text-[10px] text-[#666]">
            <span className="font-bold text-[#ff4dd2]">{source}</span>
            <span>•</span>
            <span>{timeAgo(date)}</span>
            {author && <><span>•</span><span>{author}</span></>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
