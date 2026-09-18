'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, Grid, CalendarDays, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWatchlist } from '@/hooks/useWatchlist';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { watchlist } = useWatchlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isRoot = pathname === '/';

  const navItems = [
    { name: 'Home', path: '/home', icon: Home, matchRoot: true },
    { name: 'My List', path: '/my-list', icon: Bookmark },
    { name: 'Browse', path: '/browse/all', icon: Grid, activePrefix: '/browse' },
    { name: 'Simulcasts', path: '/simulcast', icon: CalendarDays },
    { name: 'Account', path: '/profile', icon: User },
  ];

  // Helper to determine if a tab is active
  const isActive = (item: any) => {
    if (item.matchRoot && (pathname === '/' || pathname === '/home')) return true;
    if (item.activePrefix && pathname?.startsWith(item.activePrefix)) return true;
    return pathname === item.path;
  };

  return (
    <div className={`md:hidden fixed bottom-0 left-0 w-full bg-[#121326] border-t border-[#2A2B30] z-50 px-2 py-2 pb-safe-bottom safe-area-padding ${isRoot ? 'hidden' : ''}`}>
      <div className="flex justify-between items-center w-full max-w-md mx-auto">
        {navItems.map((item, idx) => {
          const active = isActive(item);
          const Icon = item.icon;
          const isMyList = item.path === '/my-list';
          
          return (
            <Link 
              key={idx} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-[20%] gap-1 transition-colors duration-200 ${active ? 'text-[#ff4dd2]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <div className="relative">
                <Icon size={22} className={active ? 'stroke-[2.5px]' : 'stroke-2'} />
                {isMyList && mounted && watchlist.length > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#ff4dd2] text-black text-[8.5px] font-black flex items-center justify-center shadow-md">
                    {watchlist.length > 99 ? '99+' : watchlist.length}
                  </span>
                )}
                {active && (
                  <motion.div 
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#ff4dd2] rounded-full shadow-[0_0_8px_#ff4dd2]"
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-[#ff4dd2] font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
