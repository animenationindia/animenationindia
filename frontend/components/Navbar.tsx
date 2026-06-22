'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bookmark, User, Search, X, Loader2, LogOut, Settings, Menu, Home, Flame, CalendarDays, Layers, MonitorPlay, Newspaper, Mail, Sparkles, Play, BookOpen } from 'lucide-react';
import { Orbitron } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['800', '900'] });

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
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);

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

  // 🌟 ইউজারের লগইন স্টেট চেক করার জন্য
  const [user, setUser] = useState<any>(null);

  // 🌟 Scroll Event Listener for Dynamic Glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search is handled on the dedicated search page (/search)

  // 🌟 Auth Listener: ইউজার লগইন/লগআউট করলে সাথে সাথে আপডেট হবে
  useEffect(() => {
    const checkUser = () => {
      const token = localStorage.getItem('user_token');
      if (token) {
        setUser({
          id: localStorage.getItem('user_id') || '',
          email: '',
          user_metadata: {
            full_name: localStorage.getItem('user_name') || 'Otaku',
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

  // 🌟 লগআউট ফাংশন
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
      <div className={`fixed top-0 left-0 w-full h-24 bg-gradient-to-b from-[#050716] to-transparent z-40 pointer-events-none transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
        isScrolled 
          ? 'bg-[#050716]/95 backdrop-blur-2xl border-b border-[#ff4dd2]/40 shadow-[0_4px_30px_rgba(255,77,210,0.15)]' 
          : 'bg-[#121326]/60 backdrop-blur-xl border-b border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
      }`}>
        <div className="w-full px-4 md:px-8 xl:px-12 h-[72px] flex items-center justify-between relative">
          {/* Subtle glowing bottom border when scrolled */}
          <div className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ffd54a]/80 to-transparent transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
        
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 h-full">
          <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-full overflow-hidden shadow-[0_0_15px_rgba(255, 77, 210,0.5),inset_0_2px_4px_rgba(255,255,255,0.3)] bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-xs text-center border border-[#ff4dd2]/30 group-hover:scale-105 transition-transform shrink-0">
              <img src="/ani-logo.png" alt="Logo" className="absolute inset-0 w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <span className={`${orbitron.className} hidden sm:block text-base lg:text-[20px] text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] to-[#ff4dd2] tracking-wide transition-all duration-300 drop-shadow-[0_4px_10px_rgba(255, 77, 210,0.6)] font-black`}>
              Anime Nation India
            </span>
          </Link>

          <nav className="hidden md:flex items-center h-full gap-0 xl:gap-1">
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
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#ffd54a] group-hover:w-1/2 transition-all duration-300 shadow-[0_0_10px_rgba(255, 213, 74,0.8)] opacity-0 group-hover:opacity-100" />
                )}
              </Link>
            )})}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4 h-full">
          <button onClick={() => router.push('/search')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-300 hover:text-[#ffd54a] hover:shadow-[0_5px_15px_rgba(255, 213, 74,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all cursor-pointer">
            <Search size={20} />
          </button>
          

          
          <button 
            onClick={() => router.push('/watchlist')} 
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-300 hover:text-[#ff4dd2] hover:shadow-[0_5px_15px_rgba(255, 77, 210,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all cursor-pointer"
          >
            <Bookmark size={20} />
          </button>

          {/* 🌟 Conditional Auth Button */}
          {user ? (
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
              <div className={`absolute right-0 top-full mt-4 w-48 bg-[#121326] border border-[#ff4dd2]/40 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,1)] transition-all duration-300 z-[100] rounded-xl transform origin-top ${isProfileOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                
                <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-gradient-to-b from-white/5 to-transparent">
                  <div className="w-10 h-10 rounded-full bg-gray-900 overflow-hidden flex items-center justify-center shrink-0 border border-[#ffd54a]/50 shadow-[0_0_10px_rgba(255, 213, 74,0.3)]">
                    {user.user_metadata?.avatar_url ? (
                      <Image src={user.user_metadata.avatar_url} alt="Avatar" width={40} height={40} />
                    ) : (
                      <User size={20} className="text-[#ffd54a]" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white font-bold text-sm truncate drop-shadow-md">{user.user_metadata?.full_name || 'Space Voyager'}</p>
                  </div>
                </div>

                <div className="py-2">
                  <Link href="/settings" className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                    <Settings size={18} className="text-gray-400 group-hover:text-white" /> Settings
                  </Link>
                  
                  <Link href="/watchlist" className="flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                    <Bookmark size={18} className="text-gray-400 group-hover:text-white" /> Watchlist
                  </Link>
                  
                  <div className="h-px bg-white/10 w-full my-2" />

                  <button 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-4 px-5 py-2.5 text-[13px] font-bold text-gray-300 hover:text-[#ef4444] hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={18} className="text-gray-400 group-hover:text-[#ef4444]" /> Log Out
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
            className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer ml-1 active:scale-90 ${
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
              className="fixed inset-0 bg-[#050716]/90 backdrop-blur-md z-[80]"
            />
            {/* 3D Drawer */}
            <motion.div 
              ref={menuRef}
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-[100px] bottom-4 right-4 w-[calc(100%-32px)] sm:w-[350px] max-w-[85vw] bg-[#121326] border border-[#ff4dd2]/40 shadow-[0_0_60px_rgba(255, 77, 210,0.3)] z-[90] flex flex-col rounded-2xl overflow-hidden"
            >
              <div className="p-6 pt-8 flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar relative">
                <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5 cursor-pointer z-[100]">
                  <X size={20} />
                </button>
                
                <h3 className="text-[#ff4dd2] text-xs font-black tracking-widest uppercase mb-4 drop-shadow-[0_0_10px_rgba(255, 77, 210,0.5)] flex items-center gap-3">
                  <span className="w-6 h-[2px] bg-[#ffd54a] inline-block shadow-[0_0_8px_rgba(255, 213, 74,0.8)]"></span> NAVIGATION
                </h3>
                
                <div className="flex flex-col gap-3">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.path;
                    const Icon = link.icon;
                    return (
                    <Link 
                      key={link.name} 
                      href={link.path} 
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-[16px] md:text-[18px] font-bold p-4 rounded-xl transition-all duration-300 flex items-center gap-4 group relative overflow-hidden ${
                        isActive ? 'text-white bg-[#ff4dd2]/10' : 'text-gray-300 hover:text-white hover:bg-[#ff4dd2]/5'
                      }`}
                    >
                      {/* Active Indicator Line */}
                      <span className={`absolute left-0 top-0 bottom-0 w-1 bg-[#ff4dd2] transition-transform duration-300 origin-top shadow-[0_0_15px_rgba(255, 77, 210,0.8)] ${isActive ? 'scale-y-100' : 'scale-y-0 group-hover:scale-y-50'}`}></span>
                      
                      <Icon size={24} className={`relative z-10 transition-colors ${isActive ? 'text-[#ff4dd2]' : 'text-gray-500 group-hover:text-[#ff4dd2]'}`} />
                      <span className="relative z-10 drop-shadow-md tracking-wide group-hover:text-[#ff4dd2] transition-colors">{link.name}</span>
                    </Link>
                  )})}
                </div>
                
                {/* Extra Links in Drawer */}
                <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3 pb-6">
                  <Link href="/watchlist" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0)] hover:shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] group">
                    <Bookmark size={22} className="text-[#ff4dd2] group-hover:text-[#ffd54a] transition-colors" /> My Watchlist
                  </Link>
                  {!user && (
                    <Link href="/auth" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0)] hover:shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] group">
                      <User size={22} className="text-[#ffd54a] group-hover:text-[#ff4dd2] transition-colors" /> Login / Register
                    </Link>
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