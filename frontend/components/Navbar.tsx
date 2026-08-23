'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bookmark, User, Search, X, Loader2, LogOut, Settings, Menu, Home, Flame, CalendarDays, Layers, MonitorPlay, Newspaper, Mail, Sparkles, Play, BookOpen, Heart, ListPlus, Music, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LiveSearchResult {
  id: number;
  idMal: number | null;
  title: {
    english: string | null;
    romaji: string;
  };
  coverImage: {
    large: string;
  };
  format: string;
  seasonYear: number | null;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);

  // 🌟 Mounted State for Hydration Mismatch Fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🌟 Click outside to close profile dropdown & mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        hamburgerBtnRef.current &&
        !hamburgerBtnRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // User Authentication State
  const [user, setUser] = useState<any>(null);

  // Scroll Event Listener for Dynamic Glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search is handled on the dedicated search page (/search)

  // Auth Listener: Updates state immediately when user logs in/out
  useEffect(() => {
    const checkUser = () => {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');
      const userName = localStorage.getItem('user_name') || localStorage.getItem('username');
      
      if (token && userId) {
        setUser({
          id: userId,
          email: '',
          user_metadata: {
            full_name: userName || 'Otaku',
            avatar_url: null
          }
        });
      } else {
        setUser(null);
      }
    };

    checkUser();

    window.addEventListener('auth-change', checkUser);
    return () => {
      window.removeEventListener('auth-change', checkUser);
    };
  }, []);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  const navLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'New', path: '/new', icon: Sparkles },
    { name: 'Manga', path: '/manga', icon: BookOpen },
    { name: 'Popular', path: '/popular', icon: Flame },
    { name: 'Simulcast', path: '/simulcast', icon: MonitorPlay },
    { name: 'Genres', path: '/genres', icon: Layers },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays },
    { name: 'Trailers', path: '/trailers', icon: Play },
    { name: 'News', path: '/news', icon: Newspaper },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  // Search navigation is handled directly via router.push('/search')

  return (
    <>
      <div className={`fixed top-0 left-0 w-full h-24 bg-gradient-to-b from-[#050716] to-transparent z-40 pointer-events-none transition-opacity duration-500 ${pathname === '/' ? 'md:hidden' : ''} ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${pathname === '/' ? 'md:hidden' : ''} ${
        isScrolled 
          ? 'bg-[#050716]/95 backdrop-blur-2xl border-b border-[#ff4dd2]/40 shadow-[0_4px_30px_rgba(255,77,210,0.15)]' 
          : 'bg-[#121326]/60 backdrop-blur-xl border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
      }`}>
        <div className="w-full px-4 md:px-8 xl:px-12 h-[72px] flex items-center justify-between relative">
          {/* Subtle glowing bottom border when scrolled */}
          <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff4dd2]/80 to-transparent transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 h-full">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-full overflow-hidden shadow-[0_0_15px_rgba(255, 77, 210,0.5),inset_0_2px_4px_rgba(255,255,255,0.3)] bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-xs text-center border border-[#ff4dd2]/30 group-hover:scale-105 transition-transform shrink-0">
              <Image src="/ani-logo.png" alt="Logo" fill sizes="40px" priority className="object-contain" />
            </div>
            <span className="font-orbitron hidden sm:block text-base lg:text-[20px] text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] to-[#ff4dd2] tracking-wide transition-all duration-300 drop-shadow-[0_4px_10px_rgba(255, 77, 210,0.6)] font-black">
              Anime Nation India
            </span>
          </Link>

          <nav className="hidden xl:flex items-center h-full gap-0 xl:gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
              <Link 
                key={link.name} 
                href={link.path} 
                className="relative px-2.5 xl:px-3.5 py-2 group overflow-hidden rounded-lg transition-all"
              >
                {isActive && (
                  <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/5 border border-white/10 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />
                )}
                <span className={`relative text-[15px] font-bold z-10 transition-colors duration-300 ${
                  isActive ? 'text-white text-shadow-sm' : 'text-gray-400 group-hover:text-white'
                }`}>
                  {link.name}
                </span>
                {/* 3D Bottom Glow on Hover */}
                {!isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#ff4dd2] group-hover:w-1/2 transition-all duration-300 shadow-[0_0_10px_rgba(255, 77, 210,0.8)] opacity-0 group-hover:opacity-100" />
                )}
              </Link>
            )})}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4 h-full">
          <button onClick={() => router.push('/search')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-300 hover:text-[#ff4dd2] hover:shadow-[0_5px_15px_rgba(255, 77, 210,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all cursor-pointer">
            <Search size={20} />
          </button>
          

          
          <button 
            onClick={() => router.push('/watchlist')} 
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-300 hover:text-[#ff4dd2] hover:shadow-[0_5px_15px_rgba(255, 77, 210,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all cursor-pointer"
          >
            <Bookmark size={20} />
          </button>

          {/* 🌟 Conditional Auth Button */}
          {mounted && user ? (
            <div className="relative h-full flex items-center ml-2" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-9 h-9 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 overflow-hidden flex items-center justify-center border border-white/20 shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.2)]">
                  {user.user_metadata?.avatar_url ? (
                    <Image src={user.user_metadata.avatar_url} alt="Avatar" width={36} height={36} />
                  ) : (
                    <User size={18} className="text-gray-300" />
                  )}
                </div>
              </button>
              
              {/* 3D Dropdown Menu */}
              <div className={`absolute right-0 top-full mt-4 w-52 bg-[#121326] border border-[#ff4dd2]/40 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,1)] transition-all duration-300 z-[100] rounded-2xl transform origin-top ${isProfileOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                
                {/* Clickable Profile Header */}
                <Link 
                  href="/profile" 
                  onClick={() => setIsProfileOpen(false)} 
                  className="p-4 border-b border-white/10 flex items-center gap-3 bg-gradient-to-b from-white/5 to-transparent hover:bg-white/10 transition-colors group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden flex items-center justify-center shrink-0 border border-[#ff4dd2]/50 shadow-[0_0_10px_rgba(255, 77, 210,0.3)] group-hover:scale-105 transition-transform">
                    {user.user_metadata?.avatar_url ? (
                      <Image src={user.user_metadata.avatar_url} alt="Avatar" width={40} height={40} />
                    ) : (
                      <User size={20} className="text-[#ff4dd2]" />
                    )}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className="text-white font-bold text-sm truncate group-hover:text-[#ff4dd2] transition-colors">{user.user_metadata?.full_name || 'Space Voyager'}</p>
                    <p className="text-[11px] text-gray-400">View Profile →</p>
                  </div>
                </Link>

                <div className="py-2">
                  <Link 
                    href="/profile" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <User size={18} className="text-[#ff4dd2]" /> Profile
                  </Link>

                  <Link 
                    href="/settings" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Settings size={18} className="text-gray-400" /> Settings
                  </Link>
                  
                  <Link 
                    href="/watchlist?tab=watchlist" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Bookmark size={18} className="text-indigo-400" /> Watchlist
                  </Link>

                  <Link 
                    href="/watchlist?tab=favorites" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Heart size={18} className="text-rose-400" /> Favorites
                  </Link>

                  <Link 
                    href="/watchlist?tab=custom-lists" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <ListPlus size={18} className="text-amber-400" /> My Lists
                  </Link>

                  <Link 
                    href="/watchlist?tab=playlists" 
                    onClick={() => setIsProfileOpen(false)} 
                    className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Music size={18} className="text-[#ff4dd2]" /> My Playlists 🎵
                  </Link>
                  
                  <div className="h-px bg-white/10 w-full my-2" />

                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }} 
                    className="w-full flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-[#ef4444] hover:bg-white/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut size={18} className="text-gray-400 hover:text-[#ef4444]" /> Log Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => router.push('/auth')} 
              className="hidden md:flex items-center gap-2 text-gray-300 hover:text-white font-bold text-[14px] cursor-pointer transition-all px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 hover:shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] ml-2"
            >
              <User size={18} />
              <span className="hidden lg:inline-block tracking-wide">LOG IN</span>
            </button>
          )}

          <button 
            ref={hamburgerBtnRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className={`xl:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer ml-1 active:scale-90 ${
              isMenuOpen 
                ? 'bg-[#ff4dd2] border border-[#ff4dd2] text-[#050716] shadow-[0_0_20px_rgba(255, 77, 210,0.8)]' 
                : 'bg-transparent hover:bg-white/5 active:bg-[#1A1A24] border border-transparent hover:border-white/10 text-gray-300 hover:text-white'
            }`}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

        </div>
      </div>
    </header>

      {/* Search overlay removed - search button directs straight to dedicated search route */}

      {/* 🌟 Side Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-[#050716]/90 backdrop-blur-md z-[80]"
            />
            {/* 3D Drawer */}
            <motion.div 
              ref={menuRef}
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-[80px] sm:top-[90px] bottom-3 right-3 w-[calc(100%-24px)] sm:w-[360px] max-w-[90vw] bg-[#0c0d1e] border border-[#ff4dd2]/40 shadow-[0_0_60px_rgba(255, 77, 210,0.3)] z-[90] flex flex-col rounded-3xl overflow-hidden"
            >
              <div className="p-5 sm:p-6 flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar relative">
                
                {/* Close Button */}
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 cursor-pointer z-[100]"
                >
                  <X size={18} />
                </button>

                {/* 🌟 User Profile Card at Top of Drawer */}
                {user ? (
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10 transition-all group mt-1"
                  >
                    <div className="w-11 h-11 rounded-full bg-gray-900 overflow-hidden flex items-center justify-center shrink-0 border border-[#ff4dd2]/50 shadow-[0_0_10px_rgba(255, 77, 210,0.3)] group-hover:scale-105 transition-transform">
                      {user.user_metadata?.avatar_url ? (
                        <Image src={user.user_metadata.avatar_url} alt="Avatar" width={44} height={44} />
                      ) : (
                        <User size={22} className="text-[#ff4dd2]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-extrabold text-sm truncate group-hover:text-[#ff4dd2] transition-colors">
                        {user.user_metadata?.full_name || 'Space Voyager'}
                      </p>
                      <span className="text-[10px] text-gray-400 block font-semibold">
                        View Profile & Library →
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#ff4dd2]/20 to-indigo-600/20 border border-[#ff4dd2]/40 hover:border-[#ff4dd2] transition-all group mt-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#ff4dd2] flex items-center justify-center text-black font-black">
                        <User size={20} className="fill-black" />
                      </div>
                      <div>
                        <p className="text-white font-extrabold text-xs">Join Anime Nation</p>
                        <p className="text-[10px] text-gray-300">Login or Create Account</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-[#ff4dd2] group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                {/* Section: Main Navigation */}
                <div>
                  <h3 className="text-[#ff4dd2] text-[11px] font-black tracking-widest uppercase mb-3 flex items-center gap-2">
                    <span className="w-4 h-[2px] bg-[#ff4dd2] inline-block shadow-[0_0_8px_rgba(255, 77, 210,0.8)]"></span> NAVIGATION
                  </h3>
                  
                  <div className="flex flex-col gap-1.5">
                    {navLinks.map((link) => {
                      const isActive = pathname === link.path;
                      const Icon = link.icon;
                      return (
                        <Link 
                          key={link.name} 
                          href={link.path} 
                          onClick={() => setIsMenuOpen(false)}
                          className={`text-[14px] font-bold px-3.5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-3.5 group relative overflow-hidden ${
                            isActive ? 'text-white bg-[#ff4dd2]/15 border border-[#ff4dd2]/30' : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <Icon size={18} className={`${isActive ? 'text-[#ff4dd2]' : 'text-gray-400 group-hover:text-[#ff4dd2]'}`} />
                          <span className="tracking-wide group-hover:text-[#ff4dd2] transition-colors">{link.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Section: User Library & Lists */}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-1.5">
                  <h3 className="text-indigo-400 text-[11px] font-black tracking-widest uppercase mb-2 flex items-center gap-2">
                    <span className="w-4 h-[2px] bg-indigo-400 inline-block"></span> MY COLLECTIONS
                  </h3>

                  <Link 
                    href="/watchlist?tab=watchlist" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-bold text-xs transition-all group"
                  >
                    <Bookmark size={17} className="text-indigo-400" /> Watchlist
                  </Link>

                  <Link 
                    href="/watchlist?tab=favorites" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-bold text-xs transition-all group"
                  >
                    <Heart size={17} className="text-rose-400" /> Favorites
                  </Link>

                  <Link 
                    href="/watchlist?tab=custom-lists" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-bold text-xs transition-all group"
                  >
                    <ListPlus size={17} className="text-amber-400" /> My Custom Lists
                  </Link>

                  <Link 
                    href="/watchlist?tab=playlists" 
                    onClick={() => setIsMenuOpen(false)} 
                    className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-bold text-xs transition-all group"
                  >
                    <Music size={17} className="text-[#ff4dd2]" /> My Playlists 🎵
                  </Link>

                  {user && (
                    <>
                      <Link 
                        href="/settings" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-bold text-xs transition-all group"
                      >
                        <Settings size={17} className="text-gray-400" /> Account Settings
                      </Link>

                      <div className="h-px bg-white/10 my-1" />

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition-all cursor-pointer text-left"
                      >
                        <LogOut size={17} /> Sign Out
                      </button>
                    </>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}