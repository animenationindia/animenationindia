import Link from 'next/link';
import { ArrowRight, Megaphone } from 'lucide-react';
import type { NewsItem } from '../lib/getNews';

export default function HomeAnnouncementBanner({ announcement }: { announcement: NewsItem | null }) {
  if (!announcement) return null;

  return (
    <div className="w-full mb-10 group/section relative mt-14">
      <Link href={`/news/${announcement.id}`} className="block relative w-full h-[250px] md:h-[350px] rounded-2xl overflow-hidden group shadow-2xl border border-white/10 hover:border-[#ffd54a]/50 transition-colors">
        <div className="absolute inset-0 bg-[#121326]">
          <img 
            src={announcement.image} 
            alt={announcement.title}
            className="w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050716] via-[#050716]/60 to-transparent" />

        <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-[#ff4dd2]/20 border border-[#ff4dd2]/30 text-[#ff4dd2] text-xs font-bold rounded-lg flex items-center gap-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(255, 77, 210,0.2)]">
              <Megaphone size={14} /> LATEST ANNOUNCEMENT
            </span>
            <span className="text-gray-400 text-xs font-medium">{announcement.dateFormatted}</span>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3 md:w-3/4 lg:w-2/3 group-hover:text-[#ffd54a] transition-colors line-clamp-2 drop-shadow-md">
            {announcement.title}
          </h2>
          
          <p className="text-gray-300 text-sm md:text-base mb-6 md:w-2/3 line-clamp-2 leading-relaxed">
            {announcement.snippet}
          </p>

          <div className="flex items-center gap-2 text-[#ffd54a] font-bold text-sm tracking-wide">
            Read Full Announcement <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
          </div>
        </div>
      </Link>
    </div>
  );
}
