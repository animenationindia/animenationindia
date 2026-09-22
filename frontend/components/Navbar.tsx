'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bookmark, 
  User, 
  Search, 
  X, 
  LogOut, 
  Settings, 
  Home, 
  Flame, 
  CalendarDays, 
  Layers, 
  MonitorPlay, 
  Newspaper, 
  Mail, 
  Sparkles, 
  BookOpen, 
  Award,
  MessageSquare,
  Users,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { logoutAction } from '@/app/actions/auth';
import { useSession, signOut as betterSignOut } from '@/lib/auth-client';
import { useWatchlist } from '@/hooks/useWatchlist';

const ADMIN_EMAILS = [
  'shouvikdaswork@gmail.com',
  'animenationindia.global@gmail.com',
  'animenationindia.support@gmail.com'
];

const AVATAR_MAP: Record<string, string> = {
  crimson: '⚡',
  flame: '🔥',
  anime: '🔥',
  cyber: '🌌',
  director: '🎥',
  void: '🎥',
  shadow: '🕶️',
  star: '⭐',
  retro: '📼',
  binge: '🍿',
  popcorn: '🍿',
  shinobi: '🥷',
  ninja: '🥷',
  dragon: '🐉'
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Watchlist state
  const { watchlist } = useWatchlist();

  const lastScrollY = useRef(0);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // 🌟 Auto-close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // 🌟 Handle Header Reveal / Hide on Scroll
  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (currentScrollY < 10) {
        setIsNavVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 120) {
        if (!isProfileOpen) {
          setIsNavVisible(false);
        }
      } else if (currentScrollY < lastScrollY.current) {
        setIsNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isProfileOpen]);

  // 🌟 Auth Listener: Updates state immediately when user logs in/out or session updates
  useEffect(() => {
    const checkUser = () => {
      const token = localStorage.getItem('token') || localStorage.getItem('user_token');
      const userId = session?.user?.id || localStorage.getItem('user_id');
      const userName = session?.user?.name || localStorage.getItem('user_name') || localStorage.getItem('username');
      const userEmail = session?.user?.email || localStorage.getItem('user_email') || localStorage.getItem('email') || '';
      const userRole = (session?.user as any)?.role || localStorage.getItem('user_role') || '';
      const userAvatar = session?.user?.image || localStorage.getItem('user_avatar') || localStorage.getItem('ani_avatar') || null;
      
      if ((session?.user && session.user.id) || (token && userId)) {
        const emailLower = userEmail.toLowerCase();
        const checkAdmin = ADMIN_EMAILS.includes(emailLower) || userRole === 'admin';
        setIsAdmin(checkAdmin);

        setUser({
          id: userId || 'usr_active',
          email: userEmail || '',
          user_metadata: {
            full_name: userName || (checkAdmin ? 'Master Admin' : 'Otaku Explorer'),
            avatar_url: userAvatar
          }
        });
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    };

    checkUser();
    window.addEventListener('auth-change', checkUser);
    
    const handleAvatarChange = (e: any) => {
      const newAvatar = e.detail;
      setUser((prev: any) => prev ? {
        ...prev,
        user_metadata: {
          ...prev.user_metadata,
          avatar_url: newAvatar
        }
      } : null);
    };
    window.addEventListener('ani-avatar-changed', handleAvatarChange);

    return () => {
      window.removeEventListener('auth-change', checkUser);
      window.removeEventListener('ani-avatar-changed', handleAvatarChange);
    };
  }, [session]);

  // 🌟 Auto-dismiss Toast Notice
  useEffect(() => {
    if (toastNotice) {
      const timer = setTimeout(() => setToastNotice(null), 3200);
      return () => clearTimeout(timer);
    }
  }, [toastNotice]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logoutAction().catch(() => {});
      await betterSignOut().catch(() => {});
    } catch {}
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('ani_avatar');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    setIsProfileOpen(false);
    setToastNotice('Signed out successfully.');
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'New', path: '/new', icon: Sparkles },
    { name: 'Read', path: '/read', icon: BookOpen },
    { name: 'Popular', path: '/popular', icon: Flame },
    { name: 'Simulcast', path: '/simulcast', icon: MonitorPlay },
    { name: 'Genres', path: '/genres', icon: Layers },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays },
    { name: 'News', path: '/news', icon: Newspaper },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === '/home' || path === '/') {
      return pathname === '/' || pathname === '/home';
    }
    if (path === '/read') {
      return pathname.startsWith('/read') || pathname.startsWith('/manga');
    }
    return pathname.startsWith(path);
  };

  return (
    <>
      {/* 🌟 Floating Action Toast Notification */}
      {toastNotice && (
        <div 
          className="fixed bottom-6 left-1/2 z-[150] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#ff4dd2]/40 bg-[#070814]/95 px-5 py-2.5 text-xs font-bold text-white shadow-[0_10px_35px_rgba(255,77,210,0.3)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3"
          role="status"
        >
          <Sparkles size={14} className="text-[#ff4dd2] animate-spin" />
          <span>{toastNotice}</span>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Top Ambient Glow Gradient */}
      <div 
        className={`fixed top-0 left-0 w-full h-24 bg-gradient-to-b from-[#050716] via-[#050716]/60 to-transparent z-40 pointer-events-none transition-opacity duration-500 ${
          pathname === '/' ? 'md:hidden' : ''
        } ${isScrolled ? 'opacity-100' : 'opacity-0'}`} 
      />
      
      {/* ========================================================================= */}
      {/* MAIN NAVBAR (RESPONSIVE WITH SMART SCROLL UP/DOWN & BLUR)                 */}
      {/* ========================================================================= */}
      <header 
        className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ease-out ${
          pathname === '/' ? 'md:hidden' : ''
        } ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
        } ${
          isScrolled 
            ? 'bg-[#050716] md:bg-[#050716]/98 backdrop-blur-2xl border-b border-[#ff4dd2]/30 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_20px_rgba(255,77,210,0.12)]' 
            : 'bg-[#050716] md:bg-[#050716]/95 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.7)]'
        }`}
      >
        <div className="w-full px-3.5 sm:px-6 md:px-8 xl:px-12 h-[68px] sm:h-[72px] flex items-center justify-between relative">
          
          {/* Subtle Glowing Bottom Accent Line */}
          <div 
            className={`absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff4dd2]/80 to-transparent transition-opacity duration-500 ${
              isScrolled ? 'opacity-100' : 'opacity-0'
            }`} 
          />
        
          {/* 🌟 Left: Brand Logo & Desktop Nav Links */}
          <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 h-full">
            <Link 
              href="/" 
              className="flex items-center gap-2 group flex-shrink-0 touch-manipulation select-none active:scale-95 transition-transform"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-[0_0_15px_rgba(255,77,210,0.5),inset_0_2px_4px_rgba(255,255,255,0.3)] bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-xs text-center border border-[#ff4dd2]/40 group-hover:scale-105 transition-transform shrink-0">
                <Image src="/ani-logo.png" alt="Anime Nation India Logo" fill sizes="40px" priority className="object-contain" />
              </div>
              <span className="font-orbitron hidden sm:block text-base lg:text-[19px] text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-white to-[#ff4dd2] tracking-wide transition-all duration-300 drop-shadow-[0_4px_12px_rgba(255,77,210,0.5)] font-black">
                Anime Nation India
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center h-full gap-0.5 xl:gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link 
                    key={link.name} 
                    href={link.path} 
                    className={`relative px-3 xl:px-3.5 py-1.5 rounded-lg font-bold text-[14px] xl:text-[15px] transition-all select-none touch-manipulation group ${
                      active
                        ? 'bg-white/10 border border-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="relative z-10">{link.name}</span>
                    {!active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#ff4dd2] group-hover:w-3/5 transition-all duration-300 shadow-[0_0_10px_rgba(255,77,210,0.8)] opacity-0 group-hover:opacity-100 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 🌟 Right: Search, My List & 7media Profile Dynamic Popup */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 h-full">
            
            {/* Quick Search */}
            <button 
              type="button"
              onClick={() => router.push('/search')} 
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/10 border border-transparent hover:border-white/10 text-gray-300 hover:text-[#ff4dd2] hover:shadow-[0_0_15px_rgba(255,77,210,0.25)] transition-all cursor-pointer touch-manipulation active:scale-90 select-none"
              aria-label="Search"
              title="Quick Search (Press 'S')"
            >
              <Search size={19} />
            </button>
            
            {/* My List & Catalogs Quick Button */}
            <button 
              type="button"
              onClick={() => router.push('/my-list')} 
              className="relative hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-xl bg-transparent hover:bg-white/10 border border-transparent hover:border-white/10 text-gray-300 hover:text-[#ff4dd2] hover:shadow-[0_0_15px_rgba(255,77,210,0.25)] transition-all cursor-pointer touch-manipulation active:scale-90 select-none"
              title="My List & Custom Folders"
              aria-label="My List"
            >
              <Bookmark size={19} />
              {mounted && watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#ff4dd2] text-black text-[9.5px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(255,77,210,0.7)] animate-in fade-in zoom-in duration-150">
                  {watchlist.length > 99 ? '99+' : watchlist.length}
                </span>
              )}
            </button>

            {/* 🌟 UNIFIED PROFILE & POPUP MENU HUB (Desktop & Mobile, Logged-In & Guest) */}
            <div className="relative h-full flex items-center" ref={profileDropdownRef}>
              <button 
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)} 
                className={`flex items-center gap-1.5 cursor-pointer p-1 sm:p-1.5 rounded-full border transition-all touch-manipulation select-none active:scale-95 ${
                  isProfileOpen 
                    ? 'border-[#ff4dd2] bg-[#ff4dd2]/20 shadow-[0_0_20px_rgba(255,77,210,0.4)]' 
                    : mounted && user 
                      ? 'border-white/20 hover:border-[#ff4dd2]/50 hover:bg-white/5'
                      : 'border-[#ff4dd2]/40 bg-[#ff4dd2]/10 hover:border-[#ff4dd2] hover:bg-[#ff4dd2]/20 shadow-[0_0_12px_rgba(255,77,210,0.2)]'
                }`}
                aria-label="User account and navigation menu"
                aria-expanded={isProfileOpen}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#1a1b35] via-[#24264a] to-[#ff4dd2]/30 overflow-hidden flex items-center justify-center border border-white/25 shadow-inner">
                  {mounted && user ? (
                    user.user_metadata?.avatar_url && user.user_metadata.avatar_url.startsWith('http') ? (
                      <Image 
                        src={user.user_metadata.avatar_url} 
                        alt="Avatar" 
                        width={36} 
                        height={36} 
                        className="object-cover w-full h-full" 
                      />
                    ) : user.user_metadata?.avatar_url && AVATAR_MAP[user.user_metadata.avatar_url] ? (
                      <span className="text-base">{AVATAR_MAP[user.user_metadata.avatar_url]}</span>
                    ) : (
                      <User size={17} className="text-[#ff4dd2]" />
                    )
                  ) : (
                    <User size={17} className="text-[#ff4dd2]" />
                  )}
                </div>
                <ChevronDown 
                  size={13} 
                  className={`text-gray-300 transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-[#ff4dd2]' : ''}`} 
                />
              </button>
              
              {/* 🌟 Dynamic Island Style Popup */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-[calc(100%+8px)] w-[295px] sm:w-[325px] max-w-[calc(100vw-20px)] max-h-[min(520px,calc(100vh-95px))] overflow-y-auto overscroll-contain dropdown-scrollbar bg-[#070814]/95 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(255,77,210,0.18)] z-[120] text-left flex flex-col gap-2"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                  >
                    {/* 1. Header User/Guest Info Card */}
                    {mounted && user ? (
                      <>
                        <div className="flex items-center gap-3 px-1.5 py-1 border-b border-white/10 pb-3 shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-[#121326] border border-[#ff4dd2]/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,77,210,0.25)] overflow-hidden">
                            {user.user_metadata?.avatar_url && user.user_metadata.avatar_url.startsWith('http') ? (
                              <Image src={user.user_metadata.avatar_url} alt="Avatar" width={40} height={40} className="object-cover w-full h-full" />
                            ) : user.user_metadata?.avatar_url && AVATAR_MAP[user.user_metadata.avatar_url] ? (
                              <span className="text-lg">{AVATAR_MAP[user.user_metadata.avatar_url]}</span>
                            ) : (
                              <User size={20} className="text-[#ff4dd2]" />
                            )}
                          </div>
                          <div className="overflow-hidden min-w-0 flex-1">
                            <p className="text-white font-black text-[13.5px] sm:text-sm truncate tracking-tight flex items-center gap-1.5">
                              <span className="truncate">{user.user_metadata?.full_name || 'Otaku'}</span>
                              {isAdmin && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black shrink-0">
                                  ADMIN
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 font-medium truncate">
                              {user.email || 'animenationindia.global@gmail.com'}
                            </p>
                          </div>
                        </div>

                        {/* Golden Glowing ADMIN PANEL Shortcut (if Admin) */}
                        {isAdmin && (
                          <Link 
                            href="/admin" 
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border border-amber-500/50 text-amber-300 hover:text-white hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all font-black text-xs tracking-wider uppercase group shadow-sm shrink-0"
                          >
                            <ShieldCheck size={16} className="text-amber-400 fill-amber-400/30 group-hover:scale-110 transition-transform" />
                            <span>ADMIN PANEL</span>
                          </Link>
                        )}

                        {/* User Quick Links */}
                        <div className="flex flex-col gap-1 py-0.5 shrink-0">
                          <Link 
                            href="/profile" 
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                          >
                            <User size={17} className="text-[#ff4dd2] group-hover:scale-110 transition-transform" />
                            <span>My Profile</span>
                          </Link>

                          <Link 
                            href="/my-list" 
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <Bookmark size={17} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                              <span>My List &amp; Folders</span>
                            </div>
                            {mounted && watchlist.length > 0 && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30">
                                {watchlist.length}
                              </span>
                            )}
                          </Link>

                          <Link 
                            href="/profile?tab=badges" 
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all group"
                          >
                            <Award size={17} className="text-yellow-400 group-hover:scale-110 transition-transform" />
                            <span>Badges &amp; Rewards</span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      /* Guest Otaku Card */
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#121328] via-[#0d0e1f] to-[#ff4dd2]/10 border border-[#ff4dd2]/30 shadow-lg flex flex-col gap-2.5 shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 flex items-center justify-center text-[#ff4dd2]">
                              <User size={16} />
                            </div>
                            <div>
                              <p className="text-white font-black text-xs">Guest Otaku</p>
                              <p className="text-[10px] text-gray-400 font-medium">Join Anime Nation India</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30">
                            FREE
                          </span>
                        </div>
                        
                        <Link
                          href="/signin"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-[#d628ab] hover:from-[#ff60d7] hover:to-[#e034b5] text-white font-black text-xs shadow-[0_0_20px_rgba(255,77,210,0.4)] transition-all active:scale-95 cursor-pointer tracking-wider uppercase"
                        >
                          <LogIn size={15} />
                          <span>SIGN IN / JOIN CLAN</span>
                        </Link>

                        <Link
                          href="/signup"
                          onClick={() => setIsProfileOpen(false)}
                          className="text-center text-[11px] font-bold text-gray-300 hover:text-[#ff4dd2] transition-colors"
                        >
                          Don't have an account? <span className="text-[#ff4dd2] underline">Sign Up Free</span>
                        </Link>
                      </div>
                    )}

                    {/* 2. Discover & Browse Navigation Links */}
                    <div className="border-t border-white/10 pt-2 flex flex-col gap-1 shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#ff4dd2] px-3 py-1">
                        DISCOVER
                      </span>
                      
                      <Link 
                        href="/home" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <Home size={17} className="text-gray-400 group-hover:text-[#ff4dd2] transition-colors" />
                        <span>Home</span>
                      </Link>

                      <Link 
                        href="/new" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <Sparkles size={17} className="text-purple-400 group-hover:scale-110 transition-transform" />
                        <span>New Releases</span>
                      </Link>

                      <Link 
                        href="/read" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <BookOpen size={17} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Read</span>
                      </Link>

                      <Link 
                        href="/popular" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <Flame size={17} className="text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>Popular</span>
                      </Link>

                      <Link 
                        href="/simulcast" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <MonitorPlay size={17} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>Simulcast</span>
                      </Link>

                      <Link 
                        href="/genres" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <Layers size={17} className="text-pink-400 group-hover:scale-110 transition-transform" />
                        <span>Genres</span>
                      </Link>

                      <Link 
                        href="/schedule" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <CalendarDays size={17} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span>Schedule</span>
                      </Link>

                      <Link 
                        href="/news" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <Newspaper size={17} className="text-blue-400 group-hover:scale-110 transition-transform" />
                        <span>News</span>
                      </Link>
                    </div>

                    {/* 3. Community & Settings */}
                    <div className="border-t border-white/10 pt-2 flex flex-col gap-1 shrink-0">
                      <Link 
                        href="/forums" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all group"
                      >
                        <MessageSquare size={17} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span>Community &amp; Chat</span>
                      </Link>

                      <Link 
                        href="/watch-party" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all group"
                      >
                        <Users size={17} className="text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>Watch Party Room</span>
                      </Link>

                      <Link 
                        href="/contact" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <Mail size={17} className="text-gray-400 group-hover:text-white transition-colors" />
                        <span>Contact Desk</span>
                      </Link>

                      <Link 
                        href="/settings" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-200 hover:text-white hover:bg-white/10 transition-all group"
                      >
                        <Settings size={17} className="text-gray-400 group-hover:text-white transition-colors" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    {/* 4. Divider */}
                    <div className="h-[1px] bg-white/10 w-full my-0.5 shrink-0" />

                    {/* 5. Sign Out (if Logged In) & Help */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {mounted && user && (
                        <button 
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left cursor-pointer"
                        >
                          <LogOut size={17} className="text-rose-400" />
                          <span>Sign Out</span>
                        </button>
                      )}

                      <Link 
                        href="/faq" 
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <HelpCircle size={17} className="text-gray-400" />
                        <span>Help &amp; FAQ</span>
                      </Link>
                    </div>

                    {/* 6. Lead Architect Card (With full bottom scroll clearance) */}
                    <div className="mt-1 p-3 rounded-2xl bg-gradient-to-br from-[#121327]/90 to-[#0a0b16]/90 border border-white/10 relative overflow-hidden group shrink-0 mb-3 shadow-md">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={13} className="text-[#ff4dd2] animate-pulse" />
                        <span className="text-[10px] font-black tracking-widest text-[#ff4dd2] uppercase">
                          LEAD ARCHITECT
                        </span>
                      </div>
                      <p className="text-white font-extrabold text-[13.5px] mb-1.5">Shouvik Das</p>
                      
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <a 
                          href="https://shouvikdasportfolio.vercel.app/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#ff4dd2] hover:underline"
                        >
                          Portfolio
                        </a>
                        <span className="text-gray-600">•</span>
                        <a 
                          href="https://github.com/Shouvikdasprojects" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white"
                        >
                          GitHub
                        </a>
                        <span className="text-gray-600">•</span>
                        <a 
                          href="https://x.com/shouvikdas155" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white"
                        >
                          𝕏
                        </a>
                        <span className="text-gray-600">•</span>
                        <a 
                          href="https://heylink.me/ShouvikDas/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline"
                        >
                          Linktree
                        </a>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 MOBILE HORIZONTAL PILLS QUICK-BAR (TOUCH-FRIENDLY SWIPE)               */}
        {/* ========================================================================= */}
        <div className="lg:hidden border-t border-white/10 bg-[#050716] px-3 py-1.5 shadow-md">
          <div className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto scrollbar-hide touch-pan-x">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`shrink-0 rounded-full px-3 py-1 text-center text-xs font-bold transition-all select-none touch-manipulation active:scale-95 ${
                    active
                      ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.6)] font-black'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </header>
    </>
  );
}
