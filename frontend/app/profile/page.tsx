/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Settings, 
  Bookmark, 
  Clock, 
  Star, 
  PlayCircle, 
  Shield, 
  LogOut, 
  ChevronRight, 
  HelpCircle, 
  Loader2, 
  Heart, 
  ListPlus,
  Plus, 
  Trash2, 
  FolderPlus, 
  Play, 
  Film, 
  Sparkles, 
  Layers, 
  Award,
  Share2,
  Check,
  Search,
  Zap,
  Flame,
  BookOpen
} from 'lucide-react';
import { BACKEND_URL } from '../../lib/config';

interface WatchlistItem {
  id: number;
  anime_id: number;
  anime_title: string;
  anime_image: string;
  status: string;
  created_at: string;
  type?: string;
}

interface FavoriteItem {
  mal_id: number;
  title: string;
  title_english?: string;
  images?: any;
  type?: string;
  score?: number;
}

interface CustomList {
  _id: string;
  name: string;
  description: string;
  items: Array<{
    mal_id: number;
    title: string;
    image: string;
    format: string;
    score?: number;
  }>;
  createdAt: string;
}

interface RatingItem {
  animeId: number;
  score: number;
  animeTitle: string;
  animeImage: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  // User Library Data
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [ratings, setRatings] = useState<RatingItem[]>([]);

  // Active Tab in Profile
  const [activeTab, setActiveTab] = useState<'activity' | 'watchlist' | 'favorites' | 'ratings' | 'lists' | 'achievements'>('activity');

  // Search & Filters inside Profile Watchlist
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('user_token');
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('user_name') || localStorage.getItem('username');

        if (!token || !userId) {
          router.push('/auth');
          return;
        }

        setUser({
          id: userId,
          email: '',
          user_metadata: {
            full_name: username || 'Otaku',
            avatar_url: null,
          },
        });

        // Parallel fetch of all user data
        const [wlRes, favRes, listsRes, rateRes] = await Promise.allSettled([
          fetch(`${BACKEND_URL}/api/watchlist/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/favorites/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/lists/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/ratings/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        // 1. Watchlist
        if (wlRes.status === 'fulfilled' && wlRes.value.ok) {
          const data = await wlRes.value.json();
          setWatchlist(
            data.map((item: any) => ({
              id: item.mal_id || item.anime_id,
              anime_id: item.mal_id || item.anime_id,
              anime_title: item.title_english || item.title || item.anime_title || 'Unknown Anime',
              anime_image: item.images?.webp?.large_image_url || item.anime_image || '',
              status: item.status || 'PLAN_TO_WATCH',
              created_at: item.addedAt || item.created_at || new Date().toISOString(),
              type: item.type || 'Anime',
            }))
          );
        }

        // 2. Favorites
        if (favRes.status === 'fulfilled' && favRes.value.ok) {
          const data = await favRes.value.json();
          setFavorites(data);
        }

        // 3. Custom Lists
        if (listsRes.status === 'fulfilled' && listsRes.value.ok) {
          const data = await listsRes.value.json();
          setCustomLists(data);
        }

        // 4. Ratings
        if (rateRes.status === 'fulfilled' && rateRes.value.ok) {
          const data = await rateRes.value.json();
          setRatings(data);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/auth');
  };

  const handleShareProfile = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {}
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-[#ff4dd2] bg-[#040405]">
        <div className="w-12 h-12 border-4 border-[#ff4dd2]/30 border-t-[#ff4dd2] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(255,77,210,0.5)]" />
        <h2 className="tracking-widest text-lg font-bold text-white animate-pulse">Loading Your Otaku Profile...</h2>
      </div>
    );
  }

  // Stats Calculations
  const completedCount = watchlist.filter((i) => i.status === 'COMPLETED').length;
  const watchingCount = watchlist.filter((i) => i.status === 'WATCHING').length;
  const planCount = watchlist.filter((i) => i.status === 'PLAN_TO_WATCH').length;
  const totalSaved = watchlist.length;
  const totalFavorites = favorites.length;
  const totalLists = customLists.length;
  const totalRated = ratings.length;
  const averageRating = totalRated > 0
    ? (ratings.reduce((acc, curr) => acc + curr.score, 0) / totalRated).toFixed(1)
    : 'N/A';

  // Watch Time Estimator (~24 min per completed/watching)
  const totalEpisodesEstimated = completedCount * 12 + watchingCount * 4;
  const totalMinutes = totalEpisodesEstimated * 24;
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalDays = (totalMinutes / (60 * 24)).toFixed(1);

  // Otaku Level & Rank System
  const rawXp = completedCount * 50 + watchingCount * 20 + totalFavorites * 15 + totalRated * 25 + totalSaved * 10;
  const currentLevel = Math.floor(rawXp / 100) + 1;
  const xpInLevel = rawXp % 100;
  
  const getRankTitle = (lvl: number) => {
    if (lvl >= 20) return 'Legendary Anime Sage 🌌';
    if (lvl >= 10) return 'Grandmaster Otaku 👑';
    if (lvl >= 5) return 'Anime Connoisseur ⚡';
    if (lvl >= 2) return 'Dedicated Binge Watcher 🍿';
    return 'Apprentice Otaku 🌱';
  };

  const username = user?.user_metadata?.full_name || 'Otaku';

  // Filtered Watchlist in Tab
  const filteredWatchlist = watchlist.filter((item) => {
    const matchesSearch = item.anime_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-[#040405] min-h-screen pt-24 lg:pt-32 pb-24 relative overflow-hidden text-white selection:bg-[#ff4dd2] selection:text-white">
      {/* 🌌 Ambient Gradient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[450px] bg-gradient-to-b from-[#ff4dd2]/15 via-[#6366f1]/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1440px] relative z-10">
        
        {/* 🌟 Top Hero Profile Banner Card */}
        <div className="relative bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-10 shadow-2xl shadow-black/90 overflow-hidden">
          
          {/* Header Action Buttons (Top Right) */}
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              {copiedShare ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Share</span>
                </>
              )}
            </button>

            <Link
              href="/settings"
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all"
            >
              <Settings size={14} className="text-[#ff4dd2]" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 pt-4 sm:pt-2">
            
            {/* Left: Avatar & Rank Progress */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="relative group flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[#ff4dd2]/60 shadow-[0_0_40px_rgba(255,77,210,0.5)] bg-gradient-to-br from-[#15162c] to-[#0b0c20] flex items-center justify-center">
                  <div className="text-transparent bg-clip-text bg-gradient-to-br from-white to-[#ff4dd2] text-5xl font-black uppercase">
                    {username.substring(0, 2)}
                  </div>
                </div>
                {/* Level Badge */}
                <div className="absolute -bottom-2 -right-1 bg-[#ff4dd2] text-black text-xs font-black px-2.5 py-0.5 rounded-full shadow-lg border-2 border-[#040405]">
                  LVL {currentLevel}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#ff4dd2] bg-[#ff4dd2]/10 px-3 py-0.5 rounded-full border border-[#ff4dd2]/30 flex items-center gap-1">
                    <Flame size={12} className="fill-[#ff4dd2]" /> {getRankTitle(currentLevel)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                    {rawXp} Total XP
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {username}
                </h1>

                {/* Level Progress Bar */}
                <div className="mt-3 w-full max-w-xs">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                    <span>Level Progress</span>
                    <span className="text-[#ff4dd2]">{xpInLevel}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-[#ff4dd2] to-amber-400 transition-all duration-700"
                      style={{ width: `${xpInLevel}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: 4 Quick Stats Hero Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[95px]">
                <Clock size={16} className="text-indigo-400 mx-auto mb-1" />
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Watch Time</span>
                <span className="text-base font-black text-white">~{totalHours} hrs</span>
                <span className="text-[9px] text-gray-500 block">({totalDays} days)</span>
              </div>

              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[95px]">
                <Bookmark size={16} className="text-[#ff4dd2] mx-auto mb-1" />
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Watchlist</span>
                <span className="text-base font-black text-white">{totalSaved}</span>
                <span className="text-[9px] text-gray-500 block">{completedCount} completed</span>
              </div>

              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[95px]">
                <Heart size={16} className="text-rose-400 mx-auto mb-1 fill-rose-400" />
                <span className="text-[10px] text-rose-400 uppercase font-bold block">Favorites</span>
                <span className="text-base font-black text-rose-400">{totalFavorites}</span>
                <span className="text-[9px] text-gray-500 block">Curated</span>
              </div>

              <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center min-w-[95px]">
                <Star size={16} className="text-amber-400 mx-auto mb-1 fill-amber-400" />
                <span className="text-[10px] text-amber-400 uppercase font-bold block">Mean Score</span>
                <span className="text-base font-black text-amber-400">{averageRating}</span>
                <span className="text-[9px] text-gray-500 block">{totalRated} rated</span>
              </div>
            </div>

          </div>
        </div>

        {/* 🗂️ Main 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 👈 Left Column: Library Stats Breakdown & Navigation */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Library Breakdown */}
            <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full" /> Anime & Manga Status
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
                  <PlayCircle size={20} className="text-emerald-400 mx-auto mb-1" />
                  <p className="text-xl font-black text-white">{completedCount}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Completed</p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
                  <Play size={20} className="text-indigo-400 mx-auto mb-1 fill-indigo-400" />
                  <p className="text-xl font-black text-white">{watchingCount}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Watching</p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
                  <Clock size={20} className="text-amber-400 mx-auto mb-1" />
                  <p className="text-xl font-black text-white">{planCount}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Plan to Watch</p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
                  <ListPlus size={20} className="text-[#ff4dd2] mx-auto mb-1" />
                  <p className="text-xl font-black text-white">{totalLists}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-0.5">Custom Lists</p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Menu Box */}
            <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-xl flex flex-col gap-1">
              <Link
                href="/watchlist?tab=watchlist"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3 font-bold text-xs">
                  <Bookmark size={18} className="text-[#ff4dd2] group-hover:scale-110 transition-transform" />
                  My Watchlist
                </div>
                <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/watchlist?tab=favorites"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3 font-bold text-xs">
                  <Heart size={18} className="text-rose-400 group-hover:scale-110 transition-transform" />
                  My Favorites
                </div>
                <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/watchlist?tab=custom-lists"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3 font-bold text-xs">
                  <ListPlus size={18} className="text-[#ff4dd2] group-hover:scale-110 transition-transform" />
                  My Animenation Lists
                </div>
                <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/settings"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-3 font-bold text-xs">
                  <Settings size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                  Account Settings
                </div>
                <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>

              <div className="h-px w-full bg-white/5 my-1" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-rose-500/10 text-rose-400 font-bold text-xs transition-colors cursor-pointer w-full text-left group"
              >
                <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                Sign Out
              </button>
            </div>

          </div>

          {/* 👉 Right Column: Interactive Profile Tabs & Detailed Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-xl">
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'activity'
                    ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={14} /> Activity
              </button>

              <button
                onClick={() => setActiveTab('watchlist')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'watchlist'
                    ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bookmark size={14} /> Watchlist ({totalSaved})
              </button>

              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Heart size={14} /> Favorites ({totalFavorites})
              </button>

              <button
                onClick={() => setActiveTab('ratings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'ratings'
                    ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Star size={14} /> Rated ({totalRated})
              </button>

              <button
                onClick={() => setActiveTab('lists')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'lists'
                    ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListPlus size={14} /> My Lists ({totalLists})
              </button>

              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'achievements'
                    ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Award size={14} /> Badges
              </button>
            </div>

            {/* TAB 1: Recent Activity */}
            {activeTab === 'activity' && (
              <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full" /> Continue Watching & Recent Saves
                  </h3>
                  <Link href="/watchlist" className="text-xs font-bold text-[#ff4dd2] hover:text-white transition-colors">
                    Open Manager →
                  </Link>
                </div>

                {watchlist.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    You haven't added any titles yet. Explore anime to build your library!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {watchlist.slice(0, 6).map((item) => (
                      <Link
                        key={item.anime_id}
                        href={`/series/${item.anime_id}`}
                        className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3.5 rounded-2xl border border-white/5 hover:border-[#ff4dd2]/40 transition-all group"
                      >
                        <div className="w-14 h-18 rounded-xl overflow-hidden shrink-0 relative bg-black">
                          <img
                            src={item.anime_image || '/placeholder-poster.png'}
                            alt={item.anime_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute top-1 left-1 bg-black/80 text-[8px] font-black text-[#ff4dd2] px-1.5 py-0.5 rounded-md uppercase">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff4dd2] transition-colors">
                            {item.anime_title}
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-1">
                            Added on {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#ff4dd2] group-hover:text-black text-gray-400 flex items-center justify-center transition-all flex-shrink-0">
                          <Play size={16} className="fill-current ml-0.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Watchlist Grid with Live Search & Status Pills */}
            {activeTab === 'watchlist' && (
              <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                  <div className="relative w-full sm:w-64">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Filter by title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {['ALL', 'WATCHING', 'PLAN_TO_WATCH', 'COMPLETED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                          statusFilter === st
                            ? 'bg-[#ff4dd2] text-black shadow-sm'
                            : 'bg-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {st.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredWatchlist.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    No matching titles found in your library.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {filteredWatchlist.map((item) => (
                      <Link
                        key={item.anime_id}
                        href={`/series/${item.anime_id}`}
                        className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-[#ff4dd2]/40 transition-all block"
                      >
                        <div className="aspect-[2/3] w-full overflow-hidden bg-black relative">
                          <img
                            src={item.anime_image || '/placeholder-poster.png'}
                            alt={item.anime_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute top-2 left-2 bg-[#ff4dd2] text-black text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#ff4dd2]">
                            {item.anime_title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Favorites Grid */}
            {activeTab === 'favorites' && (
              <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Heart size={18} className="text-rose-400 fill-rose-400" /> Favorite Titles ({favorites.length})
                </h3>

                {favorites.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    No favorites added yet. Click the heart icon on any anime details page!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {favorites.map((fav: any) => {
                      const id = fav.mal_id || fav.id;
                      const title = fav.title_english || fav.title || 'Anime';
                      const img = fav.images?.webp?.large_image_url || fav.images?.jpg?.large_image_url || fav.image || '/placeholder-poster.png';

                      return (
                        <Link
                          key={id}
                          href={`/series/${id}`}
                          className="group bg-white/5 rounded-2xl overflow-hidden border border-white/5 hover:border-rose-500/50 transition-all block"
                        >
                          <div className="aspect-[2/3] w-full overflow-hidden bg-black relative">
                            <img
                              src={img}
                              alt={title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded-full shadow-md">
                              <Heart size={12} className="fill-white" />
                            </span>
                          </div>
                          <div className="p-3">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400">
                              {title}
                            </h4>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: User Star Ratings Grid */}
            {activeTab === 'ratings' && (
              <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Star size={18} className="text-amber-400 fill-amber-400" /> Rated Titles ({ratings.length})
                </h3>

                {ratings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    You haven't rated any anime yet. Click "Rate" on an anime details page to score it from 1-10 stars!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {ratings.map((rate) => (
                      <Link
                        key={rate.animeId}
                        href={`/series/${rate.animeId}`}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-400/40 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <img
                            src={rate.animeImage || '/placeholder-poster.png'}
                            alt={rate.animeTitle}
                            className="w-12 h-16 rounded-xl object-cover"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                              {rate.animeTitle || `Anime #${rate.animeId}`}
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-1">
                              Rated on {new Date(rate.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 flex-shrink-0">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          <span className="text-sm font-black text-white">{rate.score}/10</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Custom Lists */}
            {activeTab === 'lists' && (
              <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ListPlus size={18} className="text-[#ff4dd2]" /> Custom Animenation Lists ({customLists.length})
                  </h3>
                  <Link href="/watchlist?tab=custom-lists" className="text-xs font-bold text-[#ff4dd2] hover:text-white">
                    Manage & Create Lists →
                  </Link>
                </div>

                {customLists.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    No custom lists created yet. Create curated lists on the Watchlist page!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customLists.map((list) => (
                      <div key={list._id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <h4 className="text-sm font-bold text-white">{list.name}</h4>
                        {list.description && <p className="text-xs text-gray-400 mt-0.5">{list.description}</p>}
                        <span className="text-[10px] text-[#ff4dd2] font-semibold mt-1 block">
                          {list.items.length} items
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: Badges & Achievements */}
            {activeTab === 'achievements' && (
              <div className="bg-[#0b0c20]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Award size={20} className="text-amber-400" /> Otaku Achievements & Badges
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Badge 1 */}
                  <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-black">
                      🌱
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Pioneer Explorer</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Joined the Anime Nation India community</p>
                      <span className="text-[9px] text-emerald-400 font-extrabold uppercase mt-1 block">Unlocked ✅</span>
                    </div>
                  </div>

                  {/* Badge 2 */}
                  <div className={`flex items-center gap-3.5 p-4 rounded-2xl border ${
                    completedCount >= 1 ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 opacity-50'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl font-black">
                      🍿
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">First Anime Master</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Completed at least 1 full anime series</p>
                      <span className={`text-[9px] font-extrabold uppercase mt-1 block ${
                        completedCount >= 1 ? 'text-indigo-400' : 'text-gray-600'
                      }`}>
                        {completedCount >= 1 ? 'Unlocked ✅' : 'Locked 🔒'}
                      </span>
                    </div>
                  </div>

                  {/* Badge 3 */}
                  <div className={`flex items-center gap-3.5 p-4 rounded-2xl border ${
                    totalFavorites >= 3 ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 opacity-50'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl font-black">
                      ❤️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Heartfelt Connoisseur</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Favorited 3 or more anime masterpieces</p>
                      <span className={`text-[9px] font-extrabold uppercase mt-1 block ${
                        totalFavorites >= 3 ? 'text-rose-400' : 'text-gray-600'
                      }`}>
                        {totalFavorites >= 3 ? 'Unlocked ✅' : 'Locked 🔒'}
                      </span>
                    </div>
                  </div>

                  {/* Badge 4 */}
                  <div className={`flex items-center gap-3.5 p-4 rounded-2xl border ${
                    totalRated >= 5 ? 'bg-white/5 border-white/10' : 'bg-black/40 border-white/5 opacity-50'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xl font-black">
                      ⭐
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Elite Anime Critic</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Rated 5 or more series from 1 to 10 stars</p>
                      <span className={`text-[9px] font-extrabold uppercase mt-1 block ${
                        totalRated >= 5 ? 'text-amber-400' : 'text-gray-600'
                      }`}>
                        {totalRated >= 5 ? 'Unlocked ✅' : 'Locked 🔒'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
