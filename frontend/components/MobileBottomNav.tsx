'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bookmark, Grid, CalendarDays, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileBottomNav() {
  const pathname = usePathname();
  
  const isRoot = pathname === '/';

  const navItems = [
    { name: 'Home', path: '/home', icon: Home, matchRoot: true },
    { name: 'My Lists', path: '/watchlist', icon: Bookmark },
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
          
          return (
            <Link 
              key={idx} 
              href={item.path}
              className={`flex flex-col items-center justify-center w-[20%] gap-1 transition-colors duration-200 ${active ? 'text-[#f47521]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <div className="relative">
                <Icon size={22} className={active ? 'stroke-[2.5px]' : 'stroke-2'} />
                {active && (
                  <motion.div 
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#f47521] rounded-full"
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-[#f47521]' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
