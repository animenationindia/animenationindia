import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { GridCard } from './NewsCards';
import type { NewsItem } from '../lib/getNews';

interface NewsCategoryLayoutProps {
  title: string;
  description: string;
  news: NewsItem[];
}

export default function NewsCategoryLayout({ title, description, news }: NewsCategoryLayoutProps) {
  return (
    <main className="min-h-screen bg-[#050716] pt-24 pb-20 selection:bg-[#ff4dd2] selection:text-white">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px]">
        
        {/* Header */}
        <div className="mb-10 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 p-2.5 rounded-xl">
              <Newspaper size={24} className="text-[#ff4dd2]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bebas text-white uppercase tracking-wider">
              {title}
            </h1>
          </div>
          <p className="text-gray-400 mt-2 font-medium max-w-2xl">
            {description}
          </p>
        </div>

        {/* Content Grid */}
        {news.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {news.map((item, index) => (
              <GridCard key={item.id} {...item} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-[#121326]/30 rounded-2xl border border-dashed border-[#2A2B30] w-full">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">No News Found</h2>
            <p className="text-gray-400 text-sm">Check back later for more updates.</p>
          </div>
        )}
        
      </div>
    </main>
  );
}
