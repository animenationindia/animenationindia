'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Megaphone, ChevronRight } from 'lucide-react';
import type { NewsItem } from '../lib/getNews';

interface HomeNewsSectionProps {
  news: NewsItem[];
}

export default function HomeNewsSection({ news }: HomeNewsSectionProps) {
  if (!news || news.length === 0) return null;

  // Format date like: "Jun 22, 2026 9:23 AM"
  const formatNewsDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        timeZone: 'Asia/Kolkata',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) + ' GMT+5:30'; // Static display to match screenshot style
    } catch {
      return dateStr;
    }
  };

  // Slice news items as shown in the screenshot:
  // Top News: first 2 items
  // Latest: next 6 items
  const topNews = news.slice(0, 2);
  const latestNews = news.slice(2, 8);

  return (
    <section className="w-full my-8 text-white">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-[#ff4dd2]" />
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider font-bebas text-white">
            Anime Nation News
          </h2>
        </div>
        <Link 
          href="/news" 
          className="flex items-center gap-1 text-xs md:text-sm font-bold text-gray-400 hover:text-[#ff4dd2] transition-colors uppercase tracking-wider"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Column 1: Top News (5/12 width) */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <h3 className="text-sm font-extrabold uppercase text-gray-400 tracking-wider border-l-2 border-[#ff4dd2] pl-3">
            Top News
          </h3>
          
          <div className="flex flex-col gap-6">
            {topNews.map((item) => (
              <div key={item.id} className="group relative flex flex-col gap-3">
                <Link href={`/news/${item.id}`} className="block relative aspect-video w-full overflow-hidden rounded-xl border border-white/5 bg-white/5">
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </Link>
                <div className="flex flex-col gap-1">
                  <Link href={`/news/${item.id}`}>
                    <h4 className="text-base font-bold leading-snug text-white group-hover:text-[#ff4dd2] transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </Link>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {formatNewsDate(item.date)}
                  </span>
                  {item.author && (
                    <span className="text-[11px] text-gray-400">
                      by {item.author}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Latest News (7/12 width) */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <h3 className="text-sm font-extrabold uppercase text-gray-400 tracking-wider border-l-2 border-[#ff4dd2] pl-3">
            Latest
          </h3>
          
          <div className="flex flex-col divide-y divide-white/5">
            {latestNews.map((item) => (
              <div key={item.id} className="group flex gap-4 py-4 first:pt-0 last:pb-0 items-start">
                {/* Thumbnail */}
                <Link href={`/news/${item.id}`} className="block relative w-[100px] h-[56px] md:w-[130px] md:h-[73px] flex-shrink-0 overflow-hidden rounded-lg border border-white/5 bg-white/5">
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100px, 130px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Text Content */}
                <div className="flex flex-col gap-1 min-w-0">
                  <Link href={`/news/${item.id}`}>
                    <h4 className="text-sm font-bold leading-tight text-white group-hover:text-[#ff4dd2] transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-gray-500">
                    <span>{formatNewsDate(item.date)}</span>
                    {item.author && (
                      <>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">by {item.author}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
