/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getScheduleAniList, type AiringSchedule } from '../../lib/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Star,
  ChevronRight,
  ChevronLeft,
  Search,
  RefreshCw,
  LayoutGrid,
  List,
  Globe,
  Play,
  Heart,
  Zap,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useWatchlist } from '../../hooks/useWatchlist';
import { toEnglishTitle } from '../../lib/titleCleaner';
import './schedule.css';

// ─── Weekday labels ──────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Format YYYY-MM-DD from a local Date object ──────────────────────────────
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Dynamic Live Countdown (7media & Otaku Insider inspired) ────────────────
function formatCountdown(targetTimestamp: number, currentTimestamp: number): { text: string; isPast: boolean; isNow: boolean } {
  const diffSec = targetTimestamp - currentTimestamp;
  if (diffSec <= 0 && diffSec > -86400) {
    const hoursAgo = Math.floor(Math.abs(diffSec) / 3600);
    if (hoursAgo === 0) {
      const minsAgo = Math.floor(Math.abs(diffSec) / 60);
      return { text: minsAgo <= 2 ? 'Airing Now 🔴' : `Aired ${minsAgo}m ago`, isPast: true, isNow: minsAgo <= 2 };
    }
    return { text: `Aired ${hoursAgo}h ago`, isPast: true, isNow: false };
  }
  if (diffSec <= -86400) {
    return { text: 'Aired', isPast: true, isNow: false };
  }

  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);

  if (days > 0) return { text: `In ${days}d ${hours}h`, isPast: false, isNow: false };
  if (hours > 0) return { text: `In ${hours}h ${mins}m`, isPast: false, isNow: false };
  return { text: `In ${mins}m`, isPast: false, isNow: diffSec < 900 };
}

// ─── 1-Click Google Calendar Reminder Link (7media feature) ───────────────────
function getGoogleCalendarLink(title: string, episode?: number, date?: Date) {
  const eventDate = date || new Date(Date.now() + 3600000);
  const start = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endDate = new Date(eventDate.getTime() + 30 * 60000);
  const end = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const eventTitle = `Anime Nation India: ${title} ${episode ? `(Ep ${episode})` : ''}`;
  const details = `Watch the official broadcast premiere on Anime Nation India: https://animenationindia.com/schedule`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${start}/${end}&details=${encodeURIComponent(details)}`;
}

// ─── Deterministic Airing Time Formatter (Prevents SSR Hydration Mismatch) ───
function formatAiringTime(epochSec: number, tzMode: 'local' | 'jst'): string {
  const date = new Date(epochSec * 1000);
  if (tzMode === 'jst') {
    return (
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
        .format(date)
        .toUpperCase() + ' JST'
    );
  }
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .toUpperCase();
}

export default function ScheduleList({ initialSchedule }: { initialSchedule: AiringSchedule[] }) {
  // Core state
  const [schedule, setSchedule] = useState<AiringSchedule[]>(initialSchedule || []);
  const [mounted, setMounted] = useState(false);
  const [userTz, setUserTz] = useState('Local Time');
  const [timezoneMode, setTimezoneMode] = useState<'local' | 'jst'>('local');
  const [nowSec, setNowSec] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Date navigation
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [dayOffsetWindow, setDayOffsetWindow] = useState<number>(0); // 7-day ribbon offset
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & layout
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'anime' | 'tv' | 'movie' | 'watchlist'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  // Client-side initialization: timezone & 5-second ticking clock
  useEffect(() => {
    setMounted(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setUserTz(tz || 'Local Time');
    } catch {}

    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Group anime by local calendar date (YYYY-MM-DD)
  const groupedSchedule = useMemo(() => {
    const map: Record<string, AiringSchedule[]> = {};
    for (const item of schedule) {
      if (!item.airingAt) continue;
      const date = new Date(item.airingAt * 1000);
      const key = toDateKey(date);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    for (const k in map) {
      map[k].sort((a, b) => a.airingAt - b.airingAt);
    }
    return map;
  }, [schedule]);

  // Generate 7-day ribbon window
  const ribbonDays = useMemo(() => {
    const days = [];
    const base = new Date();
    base.setDate(base.getDate() + dayOffsetWindow * 7 - 3);

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const key = toDateKey(d);
      const isToday = key === todayKey;
      const dayName = DAYS[d.getDay()];
      const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const showCount = groupedSchedule[key]?.length || 0;
      days.push({
        key,
        date: d,
        dayName,
        dateStr,
        isToday,
        count: showCount,
      });
    }
    return days;
  }, [dayOffsetWindow, todayKey, groupedSchedule]);

  // Ensure a specific date's data is loaded
  const ensureDateLoaded = useCallback(async (targetKey: string) => {
    if (groupedSchedule[targetKey] && groupedSchedule[targetKey].length > 0) return;

    setLoadingSchedule(true);
    try {
      const [y, m, d] = targetKey.split('-').map(Number);
      const start = Math.floor(new Date(y, m - 1, d, 0, 0, 0).getTime() / 1000) - 86400;
      const end = Math.floor(new Date(y, m - 1, d, 23, 59, 59).getTime() / 1000) + 86400;
      const newItems = await getScheduleAniList(start, end);
      if (newItems && newItems.length > 0) {
        setSchedule(prev => {
          const map = new Map<number, AiringSchedule>();
          prev.forEach(x => map.set(x.id, x));
          newItems.forEach(x => map.set(x.id, x));
          return Array.from(map.values()).sort((a, b) => a.airingAt - b.airingAt);
        });
      }
    } catch (err) {
      console.error('Error fetching date schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }
  }, [groupedSchedule]);

  const selectDay = (key: string) => {
    setSelectedDateKey(key);
    ensureDateLoaded(key);
  };

  const jumpToToday = () => {
    setDayOffsetWindow(0);
    setSelectedDateKey(todayKey);
    ensureDateLoaded(todayKey);
  };

  // 1-Click Manual Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now - 3 * 86400;
      const end = now + 8 * 86400;
      const fresh = await getScheduleAniList(start, end);
      if (fresh && fresh.length > 0) {
        setSchedule(fresh);
      }
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to refresh schedule:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter items for chosen date
  const activeDayItems = useMemo(() => {
    const raw = groupedSchedule[selectedDateKey] || [];
    return raw.filter(item => {
      const linkId = item.media.idMal || item.media.id;

      // Watchlist category filter
      if (filter === 'watchlist' && !isInWatchlist(linkId)) return false;

      // Format category filter
      if (filter === 'movie') {
        const fmt = (item.media.format || '').toUpperCase();
        if (!fmt.includes('MOVIE') && !fmt.includes('SPECIAL')) return false;
      }
      if (filter === 'tv') {
        const fmt = (item.media.format || '').toUpperCase();
        if (fmt !== 'TV') return false;
      }

      // Title search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const eng = (item.media.title?.english || '').toLowerCase();
        const rom = (item.media.title?.romaji || '').toLowerCase();
        if (!eng.includes(q) && !rom.includes(q)) return false;
      }

      return true;
    });
  }, [groupedSchedule, selectedDateKey, filter, isInWatchlist, searchQuery]);

  // Spotlight Next Airing Show
  const spotlightItem = useMemo(() => {
    return schedule.find(x => x.airingAt > nowSec) || null;
  }, [schedule, nowSec]);

  // Header date label
  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (selectedDateKey === todayKey) return 'Today';
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }, [selectedDateKey, todayKey]);

  return (
    <div className="w-full space-y-7">
      {/* ─── 🌟 TOP HEADER (7media inspired) ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08] pl-10 sm:pl-12 lg:pl-0">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-[#ff4dd2] mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Broadcast &amp; Airing Schedule</span>
            {lastSyncTime && (
              <span className="text-[11px] text-zinc-500 font-mono normal-case tracking-normal pl-1" suppressHydrationWarning>
                · Synced at {lastSyncTime}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-display">
            Release Calendar
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Real-time synchronized broadcast timetable for live weekly anime episodes and simulcast premieres across Tokyo networks.
          </p>
        </div>

        {/* Quick Actions & Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Search Bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search this week..."
              className="rounded-2xl border border-white/10 bg-zinc-900/90 pl-9 pr-7 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff4dd2]/60 focus:bg-zinc-900 transition-all w-44 sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Timezone Switcher Toggle */}
          <button
            type="button"
            onClick={() => setTimezoneMode(timezoneMode === 'local' ? 'jst' : 'local')}
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-200 transition-all shadow-md active:scale-95"
            title="Toggle Timezone between Local Time and Tokyo JST"
          >
            <Globe size={13} className="text-[#ff4dd2]" />
            <span suppressHydrationWarning>{timezoneMode === 'local' ? 'Local Time' : 'Tokyo (JST)'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-2xl border border-white/10 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'grid' ? 'bg-[#ff4dd2] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="2-Column Cards Grid"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-xl transition-all ${
                viewMode === 'timeline' ? 'bg-[#ff4dd2] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Compact Timeline View"
            >
              <List size={14} />
            </button>
          </div>

          {/* 1-Click Sync Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Refresh Live Schedule"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#ff4dd2]' : 'text-zinc-400'} />
            <span className="hidden sm:inline">Sync Live</span>
          </button>
        </div>
      </div>

      {/* ─── 🚀 NEXT BROADCAST SPOTLIGHT (Cinematic Glass Showcase) ──────────── */}
      {spotlightItem && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900/95 via-zinc-900/70 to-zinc-950 p-4 sm:p-5 backdrop-blur-xl shadow-2xl group">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#ff4dd2]/15 to-[#9333ea]/15 blur-3xl pointer-events-none rounded-full" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            {/* Poster Thumbnail */}
            <Link
              href={`/anime/${spotlightItem.media.idMal || spotlightItem.media.id}`}
              className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-[#ff4dd2]/60 transition-all shadow-xl ring-1 ring-white/10"
            >
              {spotlightItem.media.coverImage?.extraLarge || spotlightItem.media.coverImage?.large ? (
                <img
                  src={spotlightItem.media.coverImage.extraLarge || spotlightItem.media.coverImage.large}
                  alt={spotlightItem.media.title?.english || 'Anime'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
                  No Cover
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#ff4dd2]/80 flex items-center justify-center text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={13} fill="currentColor" className="ml-0.5" />
                </div>
              </div>
            </Link>

            {/* Content Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30">
                  <Zap size={11} className="fill-[#ff4dd2]" />
                  NEXT BROADCAST
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Clock size={12} />
                  <span suppressHydrationWarning>{formatCountdown(spotlightItem.airingAt, nowSec).text}</span>
                </span>
                <span className="text-xs text-zinc-400">• Episode {spotlightItem.episode}</span>
              </div>

              <Link
                href={`/anime/${spotlightItem.media.idMal || spotlightItem.media.id}`}
                className="block text-base sm:text-xl font-bold uppercase tracking-tight text-white hover:text-[#ff4dd2] transition-colors truncate font-display"
              >
                {toEnglishTitle(spotlightItem.media.title?.english || spotlightItem.media.title?.romaji || 'Upcoming Anime')}
              </Link>

              <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
                <span>
                  Airing at{' '}
                  <span className="text-white font-semibold" suppressHydrationWarning>
                    {formatAiringTime(spotlightItem.airingAt, timezoneMode)}
                  </span>
                </span>
                {spotlightItem.media.format && (
                  <span className="border-l border-white/10 pl-3 uppercase">
                    {spotlightItem.media.format}
                  </span>
                )}
                {spotlightItem.media.studios?.nodes?.[0]?.name && (
                  <span className="border-l border-white/10 pl-3 text-zinc-300">
                    {spotlightItem.media.studios.nodes[0].name}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 sm:self-center w-full sm:w-auto">
              <Link
                href={`/anime/${spotlightItem.media.idMal || spotlightItem.media.id}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-[#ff6400] text-white text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-95 transition-opacity"
              >
                <Play size={13} fill="currentColor" />
                View Anime
              </Link>

              {/* 1-Click Google Calendar */}
              <a
                href={getGoogleCalendarLink(
                  spotlightItem.media.title?.english || spotlightItem.media.title?.romaji || 'Anime',
                  spotlightItem.episode,
                  new Date(spotlightItem.airingAt * 1000)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-white/10 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shadow-sm"
                title="Add to Google Calendar"
              >
                <CalendarIcon size={14} />
              </a>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  const linkId = spotlightItem.media.idMal || spotlightItem.media.id;
                  const title = spotlightItem.media.title?.english || spotlightItem.media.title?.romaji || 'Anime';
                  const img = spotlightItem.media.coverImage?.extraLarge || spotlightItem.media.coverImage?.large;
                  toggleWatchlist({ animeId: linkId, title, image: img });
                }}
                className={`p-2 rounded-xl border border-white/10 transition-colors ${
                  isInWatchlist(spotlightItem.media.idMal || spotlightItem.media.id)
                    ? 'bg-pink-500/20 text-[#ff4dd2] border-pink-500/40'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                }`}
                title="Add to Watchlist"
              >
                <Heart
                  size={16}
                  fill={isInWatchlist(spotlightItem.media.idMal || spotlightItem.media.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 🏷️ CATEGORY FILTER TABS (7media style) ─────────────────────────── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-white/10 self-start overflow-x-auto scrollbar-hide">
        {[
          { key: 'all', label: 'All Broadcasts' },
          { key: 'anime', label: '🌸 TV Anime' },
          { key: 'movie', label: '🎬 Movies & Specials' },
          { key: 'watchlist', label: '⭐ My Watchlist' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as any)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-[#ff4dd2] text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 📅 WEEKDAY SELECTOR WITH FLOATING TODAY (7media Grid Style) ─────── */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-3 justify-between">
          <button
            onClick={() => setDayOffsetWindow(w => w - 1)}
            title="Previous Week"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-all"
          >
            <ChevronLeft size={14} />
            <span>Prev Week</span>
          </button>

          {selectedDateKey !== todayKey && (
            <button
              onClick={jumpToToday}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ff4dd2]/20 hover:bg-[#ff4dd2]/30 text-[#ff4dd2] border border-[#ff4dd2]/40 transition-colors shadow-sm animate-pulse"
            >
              <CalendarIcon size={12} />
              Jump to Today
            </button>
          )}

          <button
            onClick={() => setDayOffsetWindow(w => w + 1)}
            title="Next Week"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-all"
          >
            <span>Next Week</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {ribbonDays.map(day => {
            const isSelected = selectedDateKey === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => selectDay(day.key)}
                className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 md:p-4 rounded-2xl md:rounded-3xl border transition-all text-center group cursor-pointer ${
                  isSelected
                    ? 'border-[#ff4dd2] bg-[#ff4dd2]/15 shadow-[0_0_25px_rgba(255,77,210,0.25)] ring-1 ring-[#ff4dd2]'
                    : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-white/20'
                }`}
              >
                {/* Floating TODAY Badge */}
                {day.isToday && (
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md animate-pulse">
                    TODAY
                  </span>
                )}

                <span
                  className={`text-xs md:text-sm font-bold uppercase tracking-wider mt-1 ${
                    isSelected ? 'text-[#ff4dd2]' : 'text-zinc-400 group-hover:text-white'
                  }`}
                >
                  {day.dayName}
                </span>

                <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                  {day.dateStr}
                </span>

                <span className="text-[10px] text-zinc-500 font-semibold mt-1">
                  {day.count} Titles
                </span>

                {/* Bottom Active Dash */}
                {isSelected && (
                  <div className="absolute -bottom-1 w-6 h-1 bg-[#ff4dd2] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 📋 DAY INFO BAR ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 px-1">
        <div>
          Showing <span className="text-white font-bold">{activeDayItems.length}</span> broadcasts for{' '}
          <span className="text-[#ff4dd2] font-semibold">{selectedDateLabel}</span>
        </div>
        {loadingSchedule && (
          <div className="flex items-center gap-1.5 text-[#ff4dd2]">
            <RefreshCw size={12} className="animate-spin" />
            <span>Syncing broadcasts...</span>
          </div>
        )}
      </div>

      {/* ─── 📺 SCHEDULE DISPLAY: 2-COLUMN CARDS OR TIMELINE ─────────────────── */}
      {activeDayItems.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-white/10 bg-zinc-900/40 p-8">
          <Radio size={32} className="mx-auto text-zinc-500 mb-3" />
          <p className="text-sm font-bold text-white">No broadcasts found for {selectedDateLabel}.</p>
          <p className="text-xs text-zinc-400 mt-1">
            {searchQuery
              ? `No anime matching "${searchQuery}". Try selecting another category or day.`
              : 'Try selecting "All Broadcasts" or another day of the week.'}
          </p>
          {(searchQuery || filter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilter('all');
              }}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30 hover:bg-[#ff4dd2]/30 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── 2-COLUMN HORIZONTAL GLASS CARDS (True 7media Style) ────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDayItems.map(item => {
            const linkId = item.media.idMal || item.media.id;
            const inWatch = isInWatchlist(linkId);
            const title = toEnglishTitle(item.media.title?.english || item.media.title?.romaji || 'Anime');
            const coverImage = item.media.coverImage?.extraLarge || item.media.coverImage?.large || '';
            const countdownInfo = formatCountdown(item.airingAt, nowSec);
            const airingDate = new Date(item.airingAt * 1000);
            const score = item.media.averageScore ? (item.media.averageScore / 10).toFixed(1) : null;
            const studio = item.media.studios?.nodes?.[0]?.name || 'TV Broadcast';
            const genres = item.media.genres?.slice(0, 2).join(', ') || 'Animation';
            const gCalUrl = getGoogleCalendarLink(title, item.episode, airingDate);

            // Display time based on Local Time vs Tokyo JST
            const displayTime = formatAiringTime(item.airingAt, timezoneMode);

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950 hover:border-white/25 transition-all shadow-lg group relative overflow-hidden"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Poster Thumbnail */}
                  <Link
                    href={`/anime/${linkId}`}
                    className="relative w-16 h-24 sm:w-18 sm:h-26 rounded-2xl overflow-hidden shadow-md flex-shrink-0 ring-1 ring-white/10 bg-zinc-800"
                  >
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
                        No Cover
                      </div>
                    )}
                  </Link>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-[#ff4dd2]/15 border-[#ff4dd2]/30 text-[#ff4dd2]">
                        {item.media.format || 'TV'}
                      </span>
                      {item.episode && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          Ep {item.episode}
                        </span>
                      )}
                      {score && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1 font-semibold">
                          <Star size={11} className="text-yellow-400 fill-yellow-400" />
                          <span>{score}</span>
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/anime/${linkId}`}
                      title={title}
                      className="block text-base font-bold uppercase tracking-tight text-white group-hover:text-[#ff4dd2] transition-colors truncate font-display"
                    >
                      {title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                      <span className="font-semibold text-zinc-300 truncate max-w-[140px]">{studio}</span>
                      <span className="flex items-center gap-1 text-[#ff4dd2] font-semibold">
                        <Clock size={12} />
                        <span suppressHydrationWarning>{displayTime}</span>
                      </span>
                      <span className="truncate max-w-[100px] hidden sm:inline">{genres}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Live Countdown Bar */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-0 border-white/5 flex-shrink-0">
                  {/* Countdown Badge */}
                  <span
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold font-mono whitespace-nowrap shadow-inner border ${
                      countdownInfo.isNow
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                        : countdownInfo.isPast
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-white/5 border-white/10 text-[#ff4dd2]'
                    }`}
                    suppressHydrationWarning
                  >
                    {countdownInfo.text}
                  </span>

                  {/* 1-Click Google Calendar */}
                  <a
                    href={gCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shadow-sm"
                    title="Add to Google Calendar"
                  >
                    <CalendarIcon size={14} />
                  </a>

                  {/* Watchlist Toggle */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWatchlist({ animeId: linkId, title, image: coverImage });
                    }}
                    className={`p-2 rounded-xl border transition-colors ${
                      inWatch
                        ? 'bg-pink-500/20 text-[#ff4dd2] border-pink-500/40'
                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white border-white/10'
                    }`}
                    title={inWatch ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    <Heart size={14} fill={inWatch ? 'currentColor' : 'none'} />
                  </button>

                  {/* Details Link */}
                  <Link
                    href={`/anime/${linkId}`}
                    className="flex items-center gap-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 whitespace-nowrap"
                  >
                    <span>Details</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── COMPACT TIMELINE VIEW (7media Timeline Style) ──────────────────── */
        <div className="space-y-3">
          {activeDayItems.map(item => {
            const linkId = item.media.idMal || item.media.id;
            const inWatch = isInWatchlist(linkId);
            const title = toEnglishTitle(item.media.title?.english || item.media.title?.romaji || 'Anime');
            const coverImage = item.media.coverImage?.large || item.media.coverImage?.extraLarge || '';
            const countdownInfo = formatCountdown(item.airingAt, nowSec);
            const airingDate = new Date(item.airingAt * 1000);
            const gCalUrl = getGoogleCalendarLink(title, item.episode, airingDate);

            const displayTime = formatAiringTime(item.airingAt, timezoneMode);

            return (
              <div
                key={`timeline-${item.id}`}
                className="flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-white/10 bg-zinc-900/70 hover:bg-zinc-900 transition-all shadow-md group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Time Badge */}
                  <div className="w-24 shrink-0 text-xs font-bold text-[#ff4dd2] font-mono flex items-center gap-1.5">
                    <Clock size={13} />
                    <span suppressHydrationWarning>{displayTime}</span>
                  </div>

                  <div className="h-6 w-px bg-white/10 shrink-0 hidden sm:block" />

                  {/* Thumbnail Poster */}
                  <Link
                    href={`/anime/${linkId}`}
                    className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 border border-white/10 hidden sm:block"
                  >
                    {coverImage && (
                      <img src={coverImage} alt={title} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </Link>

                  {/* Title & Episode */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/anime/${linkId}`}
                        className="text-sm font-bold text-white group-hover:text-[#ff4dd2] transition-colors truncate"
                      >
                        {title}
                      </Link>
                      {item.episode && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md shrink-0">
                          Ep {item.episode}
                        </span>
                      )}
                    </div>
                    {item.media.studios?.nodes?.[0]?.name && (
                      <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                        {item.media.studios.nodes[0].name} · {item.media.format || 'TV'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-xs font-bold text-[#ff4dd2] font-mono hidden md:inline-block"
                    suppressHydrationWarning
                  >
                    {countdownInfo.text}
                  </span>

                  <a
                    href={gCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shadow-sm"
                    title="Add to Google Calendar"
                  >
                    <CalendarIcon size={13} />
                  </a>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWatchlist({ animeId: linkId, title, image: coverImage });
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      inWatch
                        ? 'bg-pink-500/20 text-[#ff4dd2] border-pink-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white border-white/10'
                    }`}
                    title="Watchlist"
                  >
                    <Heart size={13} fill={inWatch ? 'currentColor' : 'none'} />
                  </button>

                  <Link
                    href={`/anime/${linkId}`}
                    className="flex items-center gap-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <span>Details</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
