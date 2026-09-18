'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Sparkles, Flame, BookMarked, Layers } from 'lucide-react';

interface ReadNavTab {
  id: string;
  href: string;
  label: string;
  sublabel: string;
  badge?: string;
  flag?: string;
  icon: any;
  color: string;
}

const READ_TABS: ReadNavTab[] = [
  {
    id: 'all',
    href: '/read',
    label: 'All Hub',
    sublabel: 'Universal Showcase',
    icon: Layers,
    color: '#ff4dd2',
  },
  {
    id: 'manga',
    href: '/read/manga',
    label: 'Manga',
    sublabel: 'Japanese Classics',
    flag: '🇯🇵',
    badge: 'JP',
    icon: BookOpen,
    color: '#38bdf8',
  },
  {
    id: 'manhwa',
    href: '/read/manhwa',
    label: 'Manhwa',
    sublabel: 'Korean Webtoons',
    flag: '🇰🇷',
    badge: 'KR',
    icon: Flame,
    color: '#34d399',
  },
  {
    id: 'manhua',
    href: '/read/manhua',
    label: 'Manhua',
    sublabel: 'Chinese Cultivation',
    flag: '🇨🇳',
    badge: 'CN',
    icon: Sparkles,
    color: '#fbbf24',
  },
  {
    id: 'novels',
    href: '/read/novels',
    label: 'Light Novels',
    sublabel: 'Web Fiction & Lore',
    flag: '📖',
    badge: 'LN / WN',
    icon: BookMarked,
    color: '#c084fc',
  },
];

export default function ReadHubNavigation() {
  const pathname = usePathname();

  const isActive = (tabHref: string) => {
    if (tabHref === '/read') {
      return pathname === '/read';
    }
    return pathname.startsWith(tabHref);
  };

  return (
    <div className="sticky top-16 sm:top-20 z-30 w-full bg-[#070814]/90 backdrop-blur-xl border-y border-white/8 py-2.5 px-4 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Horizontal Tab Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto">
          {READ_TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#ff4dd2] text-black shadow-[0_0_20px_rgba(255,77,210,0.5)] scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 hover:border-white/15'
                }`}
              >
                <Icon
                  size={15}
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active ? 'text-black' : ''
                  }`}
                  style={{ color: active ? '#000' : tab.color }}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      active
                        ? 'bg-black/20 text-black'
                        : 'bg-white/10 text-gray-400 group-hover:text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Label (Hidden on small mobile) */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-gray-400 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>CYBER READING LOUNGE</span>
        </div>
      </div>
    </div>
  );
}
