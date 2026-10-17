/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useSession } from '@/lib/auth-client';
import { getUserProfileDetails } from '@/app/actions/profile';
import {
  getWatchlist,
  addToWatchlist,
  updateWatchlistStatus,
  removeFromWatchlist,
  WatchlistItem,
} from '@/app/actions/watchlist';
import { getUserCatalogs } from '@/app/actions/catalogs';
import { CatalogData } from '@/lib/catalogs-shared';
import {
  User,
  Settings as SettingsIcon,
  Bookmark,
  CheckCircle2,
  Clock,
  Star,
  Play,
  Plus,
  Trash2,
  Share2,
  Search,
  Filter,
  Grid3X3,
  List as ListIcon,
  Shield,
  Sparkles,
  Award,
  Zap,
  Flame,
  Folder,
  Eye,
  Tv,
  Film,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Loader2,
  Calendar,
  Layers,
  Heart,
  Compass,
} from 'lucide-react';

const AVATAR_PRESETS: Record<string, { name: string; emoji: string; bg: string }> = {
  crimson: { name: 'Crimson Thunder', emoji: '⚡', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  flame: { name: 'Flame Hashira', emoji: '🔥', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cyber: { name: 'Cyber Sage', emoji: '🌌', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  void: { name: 'Void Director', emoji: '🎥', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  shadow: { name: 'Shadow Monarch', emoji: '🕶️', bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  star: { name: 'Star Connoisseur', emoji: '⭐', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  binge: { name: 'Binge Titan', emoji: '🍿', bg: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  shinobi: { name: 'Shinobi Sage', emoji: '🥷', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  dragon: { name: 'Dragon Ruler', emoji: '🐉', bg: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' },
};

export default function ProfilePage() {
  const { data: session, isPending: isSessionLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [localUser, setLocalUser] = useState<any>(null);
  const [userBio, setUserBio] = useState('');

  // Watchlist & Catalogs
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogData[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'watching' | 'completed' | 'plan_to_watch' | 'dropped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'rating' | 'progress'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Status updating state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedLinkNotice, setCopiedLinkNotice] = useState(false);

  // Active Tab: Watchlist or Passport
  const [mainTab, setMainTab] = useState<'watchlist' | 'passport' | 'catalogs'>('watchlist');

  // Load local user & preferences
  useEffect(() => {
    try {
      const uId = localStorage.getItem('user_id');
      const uName = localStorage.getItem('user_name');
      const uEmail = localStorage.getItem('user_email');
      const uRole = localStorage.getItem('user_role');
      const uAvatar = localStorage.getItem('user_avatar') || localStorage.getItem('ani_avatar');
      const bio = localStorage.getItem('ani_user_bio');

      if (uId && uEmail) {
        setLocalUser({ id: uId, name: uName || 'Otaku Sovereign', email: uEmail, role: uRole || 'user', image: uAvatar });
      }
      if (bio) setUserBio(bio);
    } catch {}
  }, []);

  // Fetch Profile, Watchlist & Catalogs
  useEffect(() => {
    Promise.all([getUserProfileDetails(), getWatchlist(), getUserCatalogs()]).then(([pRes, wRes, cRes]) => {
      if (pRes?.authenticated && pRes.user) {
        setProfileData(pRes);
      }
      if (wRes?.success && Array.isArray(wRes.items)) {
        setWatchlistItems(wRes.items);
      }
      if (cRes?.authenticated && Array.isArray(cRes.catalogs)) {
        setCatalogs(cRes.catalogs);
      }
      setLoading(false);
    });
  }, [session?.user]);

  useEffect(() => {
    document.title = 'Otaku Profile & Portfolio | Anime Nation India';
  }, []);

  // Copy Profile Link
  const handleShareProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLinkNotice(true);
      setTimeout(() => setCopiedLinkNotice(false), 3000);
    }
  };

  // Quick increment episode progress
  const handleIncrementProgress = async (item: WatchlistItem) => {
    const newProgress = (item.progress || 0) + 1;
    setUpdatingId(item.mediaId);

    // Optimistic UI update
    setWatchlistItems((prev) =>
      prev.map((w) => (w.mediaId === item.mediaId ? { ...w, progress: newProgress } : w))
    );

    await addToWatchlist({
      mediaId: item.mediaId,
      mediaType: item.mediaType || 'anime',
      title: item.title,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      rating: item.rating,
      year: item.year,
      status: item.status,
      progress: newProgress,
    });

    setUpdatingId(null);
  };

  // Quick change status
  const handleChangeStatus = async (item: WatchlistItem, newStatus: string) => {
    setUpdatingId(item.mediaId);

    // Optimistic UI update
    setWatchlistItems((prev) =>
      prev.map((w) => (w.mediaId === item.mediaId ? { ...w, status: newStatus } : w))
    );

    await updateWatchlistStatus(item.mediaId, item.mediaType || 'anime', newStatus);
    setUpdatingId(null);
  };

  // Quick remove
  const handleRemove = async (item: WatchlistItem) => {
    if (!window.confirm(`Remove "${item.title}" from your watchlist?`)) return;

    setWatchlistItems((prev) => prev.filter((w) => w.mediaId !== item.mediaId));
    await removeFromWatchlist(item.mediaId, item.mediaType || 'anime');
  };

  // Computed Stats
  const stats = useMemo(() => {
    const total = watchlistItems.length;
    const watching = watchlistItems.filter((i) => i.status === 'watching').length;
    const completed = watchlistItems.filter((i) => i.status === 'completed').length;
    const planToWatch = watchlistItems.filter((i) => i.status === 'plan_to_watch').length;
    const dropped = watchlistItems.filter((i) => i.status === 'dropped').length;

    const totalEpisodes = watchlistItems.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    const daysSpent = ((totalEpisodes * 24) / 1440).toFixed(1);

    const ratedItems = watchlistItems.filter((i) => i.rating && !isNaN(Number(i.rating)));
    const meanScore =
      ratedItems.length > 0
        ? (ratedItems.reduce((acc, curr) => acc + Number(curr.rating), 0) / ratedItems.length).toFixed(1)
        : '0.0';

    return {
      total,
      watching,
      completed,
      planToWatch,
      dropped,
      totalEpisodes,
      daysSpent,
      meanScore,
    };
  }, [watchlistItems]);

  // Filtered & Sorted Watchlist
  const displayedWatchlist = useMemo(() => {
    let list = [...watchlistItems];

    if (activeFilter !== 'all') {
      list = list.filter((i) => (i.status || 'plan_to_watch').toLowerCase() === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0);
      // default 'date'
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return list;
  }, [watchlistItems, activeFilter, searchQuery, sortBy]);

  const userObject = profileData?.user || session?.user || localUser;

  if (isSessionLoading && loading && !localUser) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-[#ff4dd2]" />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading Otaku Profile...</p>
        </div>
      </div>
    );
  }

  if (!userObject && !profileData?.authenticated) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center mx-auto text-[#ff4dd2] shadow-[0_0_30px_rgba(255,77,210,0.2)]">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-black font-display uppercase tracking-tight text-white">Sign In Required</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Sign in to view your anime portfolio, track episode progress, earn otaku passport badges, and manage your watchlist.
          </p>
          <Link
            href="/signin?callbackUrl=/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-purple-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 transition shadow-lg shadow-[#ff4dd2]/25 cursor-pointer"
          >
            <span>Sign In to Anime Nation</span>
          </Link>
        </div>
      </div>
    );
  }

  const avatarKey = userObject?.image && AVATAR_PRESETS[userObject.image] ? userObject.image : 'cyber';
  const avatarPreset = AVATAR_PRESETS[avatarKey];
  const isCustomPhoto = userObject?.image?.startsWith('http') || userObject?.image?.startsWith('data:');

  // Badges Calculation
  const badges = [
    {
      id: 'shonen_master',
      title: 'Shonen Master',
      icon: '⚡',
      desc: 'Track 5 or more series in your watchlist',
      unlocked: stats.total >= 5,
      progressText: `${stats.total} / 5 series`,
    },
    {
      id: 'night_owl',
      title: 'Night Owl Binger',
      icon: '🌙',
      desc: 'Watch 25 or more episodes',
      unlocked: stats.totalEpisodes >= 25,
      progressText: `${stats.totalEpisodes} / 25 episodes`,
    },
    {
      id: 'otaku_elite',
      title: 'Otaku Elite',
      icon: '👑',
      desc: 'Complete 5 or more full anime series',
      unlocked: stats.completed >= 5,
      progressText: `${stats.completed} / 5 completed`,
    },
    {
      id: 'top_reviewer',
      title: 'Master Critic',
      icon: '✍️',
      desc: 'Rate and score anime in your library',
      unlocked: stats.meanScore !== '0.0' || (profileData?.stats?.reviewsCount || 0) > 0,
      progressText: stats.meanScore !== '0.0' ? `Mean score: ${stats.meanScore}` : '0 reviews',
    },
    {
      id: 'collector',
      title: 'Collector Supreme',
      icon: '🌟',
      desc: 'Build an anime library of 15+ titles',
      unlocked: stats.total >= 15,
      progressText: `${stats.total} / 15 saved`,
    },
    {
      id: 'dragon_ruler',
      title: 'Dragon Ruler',
      icon: '🐉',
      desc: 'VIP Otaku status or 30+ series saved',
      unlocked: userObject?.role === 'admin' || userObject?.role === 'vip' || stats.total >= 30,
      progressText: userObject?.role === 'admin' ? 'VIP Admin' : `${stats.total} / 30 series`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#050716] text-white flex flex-col selection:bg-[#ff4dd2] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* ── HERO BANNER & IDENTITY SHOWCASE ── */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-[#0a0f26] to-zinc-950 p-6 sm:p-10 mb-8 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#ff4dd2]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 z-10">
            {/* Avatar Badge */}
            <div className="relative group shrink-0">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center text-5xl border-2 shadow-2xl transition-transform duration-300 group-hover:scale-105 overflow-hidden ${
                  isCustomPhoto
                    ? 'border-[#ff4dd2] bg-zinc-900 shadow-[0_0_25px_rgba(255,77,210,0.3)]'
                    : `${avatarPreset.bg} border-white/20 shadow-[0_0_25px_rgba(255,77,210,0.2)]`
                }`}
              >
                {isCustomPhoto ? (
                  <img
                    src={userObject.image}
                    alt={userObject.name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{avatarPreset.emoji}</span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
                  {userObject?.name || 'Otaku Sovereign'}
                </h1>
                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#ff4dd2] bg-[#ff4dd2]/15 border border-[#ff4dd2]/30 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(255,77,210,0.2)]">
                  <Sparkles size={12} />
                  <span>{userObject?.role === 'admin' ? 'Super Admin' : 'VIP Otaku'}</span>
                </span>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-2xl leading-relaxed">
                {userBio ||
                  'Passionate anime explorer & manga enthusiast. Tracking seasonal shows, rating masterpieces, and cataloging the multiverse.'}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-zinc-400 mt-3">
                <span className="flex items-center gap-1.5 font-mono text-zinc-300">
                  <User size={13} className="text-zinc-500" />
                  <span>{userObject?.email || 'otaku@animenationindia.online'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-zinc-500" />
                  <span>Member since 2026</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-[#ff4dd2] hover:text-black border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95 shadow-sm cursor-pointer"
                >
                  <SettingsIcon size={14} />
                  <span>Settings &amp; Security</span>
                </Link>

                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="flex items-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>{copiedLinkNotice ? 'Copied Link!' : 'Share Profile'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── LIVE STATS METRICS COUNTERS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <Bookmark size={13} className="text-[#ff4dd2]" />
                <span>Total Anime</span>
              </div>
              <p className="text-2xl font-black text-white mt-1 font-display tracking-tight">{stats.total}</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <Play size={13} className="text-cyan-400" />
                <span>Episodes</span>
              </div>
              <p className="text-2xl font-black text-white mt-1 font-display tracking-tight">{stats.totalEpisodes}</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <Clock size={13} className="text-amber-400" />
                <span>Days Spent</span>
              </div>
              <p className="text-2xl font-black text-white mt-1 font-display tracking-tight">{stats.daysSpent}d</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <Star size={13} className="text-yellow-400" />
                <span>Mean Score</span>
              </div>
              <p className="text-2xl font-black text-white mt-1 font-display tracking-tight">{stats.meanScore}</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Completed</span>
              </div>
              <p className="text-2xl font-black text-white mt-1 font-display tracking-tight">{stats.completed}</p>
            </div>

            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                <Flame size={13} className="text-rose-400" />
                <span>Watching</span>
              </div>
              <p className="text-2xl font-black text-white mt-1 font-display tracking-tight">{stats.watching}</p>
            </div>
          </div>
        </div>

        {/* ── NAVIGATION TABS: WATCHLIST / PASSPORT / CUSTOM CATALOGS ── */}
        <div className="flex items-center justify-between border-b border-white/10 mb-8 overflow-x-auto pb-2 scrollbar-none gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMainTab('watchlist')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                mainTab === 'watchlist'
                  ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark size={15} />
              <span>Anime Watchlist ({stats.total})</span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('passport')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                mainTab === 'passport'
                  ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award size={15} />
              <span>Otaku Passport &amp; Badges</span>
            </button>

            <button
              type="button"
              onClick={() => setMainTab('catalogs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                mainTab === 'catalogs'
                  ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 font-black'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Folder size={15} />
              <span>Custom Folders ({catalogs.length})</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN TAB 1: ANIME WATCHLIST                                               */}
        {/* ========================================================================= */}
        {mainTab === 'watchlist' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Filter Pills & Search Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#0a0b1a]/60 border border-white/10 p-4 rounded-3xl">
              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All', count: stats.total },
                  { id: 'watching', label: 'Watching', count: stats.watching },
                  { id: 'completed', label: 'Completed', count: stats.completed },
                  { id: 'plan_to_watch', label: 'Plan to Watch', count: stats.planToWatch },
                  { id: 'dropped', label: 'Dropped', count: stats.dropped },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeFilter === f.id
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="ml-1.5 text-[10px] opacity-60">({f.count})</span>
                  </button>
                ))}
              </div>

              {/* Right Controls: Search, Sort & View Mode */}
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in list..."
                    className="h-9 w-full rounded-xl border border-white/10 bg-black/40 pl-8 pr-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff4dd2]"
                  />
                </div>

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="h-9 rounded-xl border border-white/10 bg-black/40 px-3 text-xs text-zinc-300 outline-none focus:border-[#ff4dd2] cursor-pointer"
                >
                  <option value="date">Recently Added</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="rating">Highest Rating</option>
                  <option value="progress">Most Episodes</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-black/40">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#ff4dd2] text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#ff4dd2] text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="List View"
                  >
                    <ListIcon size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Watchlist Grid */}
            {displayedWatchlist.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {displayedWatchlist.map((item) => {
                    const statusColor =
                      item.status === 'watching'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : item.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : item.status === 'dropped'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

                    return (
                      <div
                        key={item.mediaId}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b1a]/80 hover:border-[#ff4dd2]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        {/* Poster Link */}
                        <Link
                          href={`/series/${item.mediaId}`}
                          className="relative w-full aspect-[2/3] overflow-hidden bg-white/5 block"
                        >
                          <img
                            src={item.posterPath || '/placeholder-poster.png'}
                            alt={item.title}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.png';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                          {/* Status Badge */}
                          <span
                            className={`absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border backdrop-blur-md ${statusColor}`}
                          >
                            {(item.status || 'plan_to_watch').replace(/_/g, ' ')}
                          </span>

                          {/* Rating Badge */}
                          {item.rating && (
                            <span className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md">
                              <Star size={10} fill="currentColor" />
                              <span>{item.rating}</span>
                            </span>
                          )}

                          {/* Bottom Hover Title */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="text-[10px] text-zinc-400 capitalize block">
                              {item.mediaType || 'anime'} {item.year ? `• ${item.year}` : ''}
                            </span>
                          </div>
                        </Link>

                        {/* Card Details & Actions */}
                        <div className="p-3 flex flex-col justify-between flex-1 gap-2.5">
                          <Link
                            href={`/series/${item.mediaId}`}
                            className="line-clamp-1 text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors"
                            title={item.title}
                          >
                            {item.title}
                          </Link>

                          {/* Progress Controls */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-zinc-400">Ep:</span>
                              <span className="text-xs font-mono font-black text-cyan-400">
                                {item.progress || 0}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleIncrementProgress(item)}
                              disabled={updatingId === item.mediaId}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-[#ff4dd2] hover:text-black text-[10px] font-black uppercase tracking-wider text-white transition active:scale-95 disabled:opacity-50 cursor-pointer"
                              title="Increment watched episode by 1"
                            >
                              <Plus size={12} />
                              <span>+1</span>
                            </button>
                          </div>

                          {/* Quick Status & Delete row */}
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                            <select
                              value={item.status || 'plan_to_watch'}
                              onChange={(e) => handleChangeStatus(item, e.target.value)}
                              className="bg-transparent text-zinc-400 hover:text-white outline-none cursor-pointer capitalize text-[10px]"
                            >
                              <option value="watching" className="bg-zinc-950 text-white">Watching</option>
                              <option value="completed" className="bg-zinc-950 text-white">Completed</option>
                              <option value="plan_to_watch" className="bg-zinc-950 text-white">Plan to Watch</option>
                              <option value="dropped" className="bg-zinc-950 text-white">Dropped</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemove(item)}
                              className="text-zinc-500 hover:text-rose-400 transition p-1 cursor-pointer"
                              title="Remove from list"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Compact List View */
                <div className="rounded-2xl border border-white/10 bg-[#0a0b1a]/80 overflow-hidden divide-y divide-white/5">
                  {displayedWatchlist.map((item) => (
                    <div
                      key={item.mediaId}
                      className="flex items-center justify-between p-3 sm:p-4 hover:bg-white/[0.02] transition gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Link
                          href={`/series/${item.mediaId}`}
                          className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-white/5"
                        >
                          <img
                            src={item.posterPath || '/placeholder-poster.png'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/series/${item.mediaId}`}
                            className="text-xs font-bold text-white hover:text-[#ff4dd2] truncate block"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                            <span className="capitalize">{item.mediaType || 'anime'}</span>
                            {item.year && <span>• {item.year}</span>}
                            {item.rating && <span className="text-amber-400 font-bold">★ {item.rating}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            Ep {item.progress || 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleIncrementProgress(item)}
                            className="p-1 rounded-md bg-white/10 hover:bg-[#ff4dd2] hover:text-black transition"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <select
                          value={item.status || 'plan_to_watch'}
                          onChange={(e) => handleChangeStatus(item, e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-lg text-[10px] px-2 py-1 text-zinc-300 outline-none"
                        >
                          <option value="watching">Watching</option>
                          <option value="completed">Completed</option>
                          <option value="plan_to_watch">Plan to Watch</option>
                          <option value="dropped">Dropped</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          className="text-zinc-500 hover:text-rose-400 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Empty Watchlist State */
              <div className="text-center py-16 px-4 rounded-3xl border border-white/10 bg-[#0a0b1a]/40 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/20 flex items-center justify-center mx-auto text-[#ff4dd2]">
                  <Bookmark size={28} />
                </div>
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white">
                  No anime found in this filter
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Start adding trending and classic anime to your watchlist to track your progress and earn badges.
                </p>
                <Link
                  href="/browse/all"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ff4dd2] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition shadow-lg shadow-[#ff4dd2]/20"
                >
                  <Compass size={14} />
                  <span>Explore Anime Catalog</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN TAB 2: OTAKU PASSPORT & BADGES                                       */}
        {/* ========================================================================= */}
        {mainTab === 'passport' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-[#0a0b1a]/60 border border-white/10 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-2">
                <Award size={24} className="text-[#ff4dd2]" />
                <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">
                  Otaku Achievement Passport
                </h2>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                Earn milestone badges as you watch series, log episode progress, submit reviews, and expand your anime knowledge across genres.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    b.unlocked
                      ? 'border-[#ff4dd2]/50 bg-gradient-to-br from-[#0e1026] to-[#ff4dd2]/10 shadow-[0_0_20px_rgba(255,77,210,0.15)]'
                      : 'border-white/10 bg-[#0a0b1a]/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-3xl p-2 rounded-xl bg-white/5 border border-white/10">{b.icon}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        b.unlocked
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-900 text-zinc-500 border-white/10'
                      }`}
                    >
                      {b.unlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-white">{b.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{b.desc}</p>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Progress:</span>
                    <span className={b.unlocked ? 'text-[#ff4dd2] font-bold' : 'text-zinc-400'}>
                      {b.progressText}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN TAB 3: CUSTOM FOLDERS & PLAYLISTS                                    */}
        {/* ========================================================================= */}
        {mainTab === 'catalogs' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-[#0a0b1a]/60 border border-white/10 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Folder size={22} className="text-[#ff4dd2]" />
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-white">
                    Custom Catalogs &amp; Playlists
                  </h2>
                </div>
                <p className="text-xs text-zinc-400">
                  Organize your personal collections, theme playlists, and rewatch lists.
                </p>
              </div>

              <Link
                href="/catalogs"
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-[#ff4dd2] hover:text-black border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition cursor-pointer"
              >
                <Layers size={14} />
                <span>Open Catalogs Hub</span>
              </Link>
            </div>

            {catalogs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {catalogs.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/catalogs?active=${cat.id}`}
                    className="p-5 rounded-2xl border border-white/10 bg-[#0a0b1a]/80 hover:border-[#ff4dd2]/50 hover:-translate-y-1 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/20 flex items-center justify-center text-[#ff4dd2]">
                        <Folder size={20} />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
                        {cat.itemIds?.length || 0} items
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#ff4dd2] transition-colors truncate">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1">Custom collection</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-3xl border border-white/10 bg-[#0a0b1a]/40 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/20 flex items-center justify-center mx-auto text-[#ff4dd2]">
                  <Folder size={24} />
                </div>
                <h3 className="text-base font-bold text-white">No custom catalogs created yet</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Create themed playlists like &ldquo;Peak Isekai&rdquo; or &ldquo;Studio Mappa Best&rdquo; to group your favorite shows.
                </p>
                <Link
                  href="/catalogs"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ff4dd2] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:opacity-90 transition"
                >
                  <Plus size={14} />
                  <span>Create New Catalog</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
