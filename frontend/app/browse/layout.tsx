'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: 'ALL ANIME', path: '/browse/all' },
    { name: 'MANGA', path: '/browse/manga' },
    { name: 'RELEASE CALENDAR', path: '/browse/calendar' },
    { name: 'ANIME GENRES', path: '/browse/genres' },
    { name: 'NEWS', path: '/browse/news' }
  ];

  return (
    <div className="bg-[#050716] min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 lg:px-12 max-w-[1600px]">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Browse</h1>
        </div>

        {/* Scrollable Tabs */}
        <div className="w-full overflow-x-auto scrollbar-hide border-b border-[#2A2B30] mb-8">
          <div className="flex items-center gap-8 min-w-max pb-1">
            {tabs.map((tab, idx) => {
              const active = pathname === tab.path;
              return (
                <Link
                  key={idx}
                  href={tab.path}
                  className={`relative py-3 font-semibold text-sm tracking-widest transition-colors ${active ? 'text-[#f47521]' : 'text-gray-400 hover:text-white'}`}
                >
                  {tab.name}
                  {active && (
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#f47521] rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
