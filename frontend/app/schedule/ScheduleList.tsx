/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { getScheduleAniList, type AiringSchedule } from '../../lib/api';
import { 
  Clock, Play, Radio, Sparkles, Search, Flame, Zap, CalendarDays, 
  CheckCircle2, ChevronRight, ChevronLeft, LayoutGrid, ListFilter, Globe, Star, 
  Bookmark, Check, Bell, Tv2, Share2, Heart, Compass, RotateCcw, Loader2,
  Info, X, Sun, Moon, Sunrise, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeDescription } from '../../lib/sanitize';
import { useWatchlist } from '../../hooks/useWatchlist';

// ─── iCalendar (.ics) Generator Helper ─────────────────────────────────────────
function downloadIcsReminder(item: AiringSchedule) {
  const title = item.media.title.english || item.media.title.romaji || 'Anime Episode';
  const ep = item.episode;
  const startDate = new Date(item.airingAt * 1000);
  const endDate = new Date((item.airingAt + 1800) * 1000);

  const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Anime Nation India//Schedule Reminder//EN',
    'BEGIN:VEVENT',
    `SUMMARY:📺 ${title} - Episode ${ep} Airing`,
    `DESCRIPTION:Watch ${title} Episode ${ep} on Anime Nation India!`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_')}_EP${ep}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── 🎴 GRID ANIME CARD WITH 3D HOVER & QUICK PREVIEW ───────────────────────
function ScheduleAnimeCard({ 
  item, 
  index, 
  timezoneOffsetHours,
  onOpenPreview 
}: { 
  item: AiringSchedule; 
  index: number; 
  timezoneOffsetHours: number;
  onOpenPreview: (item: AiringSchedule) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  const title = item.media.title.english || item.media.title.romaji || 'Unknown Anime';
  const linkId = item.media.idMal || item.media.id;
  const coverImage = item.media.coverImage?.extraLarge || item.media.coverImage?.large || '';
  const score = item.media.averageScore ? (item.media.averageScore / 10).toFixed(1) : null;
  const studio = item.media.studios?.nodes?.[0]?.name;
  const format = item.media.format ? item.media.format.replace('_', ' ') : 'TV';

  // Calculate Time
  const date = new Date((item.airingAt + timezoneOffsetHours * 3600) * 1000);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isAired, setIsAired] = useState<boolean>(false);
  const [reminded, setReminded] = useState(false);

  const isSaved = mounted ? isInWatchlist(linkId) : false;

  useEffect(() => {
    setMounted(true);
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = item.airingAt * 1000 - now;

      if (distance < 0) {
        setIsAired(true);
        setTimeLeft('Aired');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        setTimeLeft(`${Math.floor(hours / 24)}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);
    return () => clearInterval(interval);
  }, [item.airingAt]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist({
      animeId: linkId,
      title,
      image: coverImage,
    });
  };

  const handleReminder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadIcsReminder(item);
    setReminded(true);
    setTimeout(() => setReminded(false), 3000);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenPreview(item);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.25) }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="card-3d group relative w-full flex flex-col cursor-pointer bg-transparent cv-auto gpu-accelerate"
    >
      <Link href={`/series/${linkId}`} prefetch={false} className="block w-full h-full relative">
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#090a18] rounded-2xl border border-white/10 group-hover:border-[#ff4dd2]/60 group-hover:shadow-[0_0_35px_rgba(255,77,210,0.4)] transition-all duration-300">
          
          {coverImage && (
            <img 
              src={coverImage} 
              alt={title} 
              loading="lazy" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
          )}

          {/* Dark Shader Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-transparent to-black/75 pointer-events-none" />

          {/* Top Row: EP Badge & Countdown Badge */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
             <div className="bg-[#ff4dd2] text-white text-[10px] md:text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg border border-white/20 uppercase tracking-wider flex items-center gap-1">
                <Zap size={10} className="fill-white" /> EP {item.episode}
             </div>
             
             <div className={`backdrop-blur-md text-[10px] md:text-[11px] font-black px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 border border-white/10 ${
               isAired 
                 ? 'bg-black/75 text-gray-400' 
                 : 'bg-gradient-to-r from-[#ff6400] to-[#ff4dd2] text-white'
             }`}>
                {isAired ? <CheckCircle2 size={11} /> : <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                {timeLeft}
             </div>
          </div>

          {/* Studio Tag */}
          {studio && (
            <div className="absolute top-10 left-2.5 z-20 pointer-events-none">
              <span className="bg-black/80 backdrop-blur-md text-gray-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-wider">
                {studio}
              </span>
            </div>
          )}

          {/* Bottom Floating Info Bar */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 pointer-events-none">
            <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
              <span className="text-[#ff4dd2] text-[11px] font-extrabold flex items-center gap-1">
                <Clock size={11} /> {timeStr}
              </span>
              
              <div className="flex items-center gap-1.5">
                {score && (
                  <span className="text-yellow-400 text-[10px] font-bold flex items-center gap-0.5">
                    <Star size={10} className="fill-yellow-400" /> {score}
                  </span>
                )}
                <span className="text-[9px] font-bold text-gray-400 uppercase bg-white/10 px-1.5 py-0.5 rounded">
                  {format}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Actions Overlay */}
          <div className="absolute inset-0 bg-[#050716]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 backdrop-blur-[2px] z-30">
            
            {/* Top Action Icons (Save, Reminder & Info Preview) */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handlePreviewClick}
                title="Quick Info Preview"
                className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md bg-black/60 text-white border border-white/20 hover:bg-[#ff4dd2] hover:border-[#ff4dd2] transition-all cursor-pointer"
              >
                <Info size={14} />
              </button>

              <button
                type="button"
                onClick={handleSave}
                title="Add to Watchlist"
                className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all border ${
                  isSaved 
                    ? 'bg-[#ff4dd2] text-white border-[#ff4dd2]' 
                    : 'bg-black/60 text-white border-white/20 hover:bg-[#ff4dd2] hover:border-[#ff4dd2]'
                }`}
              >
                {isSaved ? <Check size={14} strokeWidth={3} /> : <Bookmark size={14} />}
              </button>

              <button
                type="button"
                onClick={handleReminder}
                title="Add to Google/Apple Calendar"
                className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all border ${
                  reminded 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-black/60 text-white border-white/20 hover:bg-[#ff6400] hover:border-[#ff6400]'
                }`}
              >
                <Bell size={14} />
              </button>
            </div>

            {/* Center Play Button */}
            <div className="flex flex-col items-center justify-center flex-1 gap-1">
              <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 border-[#ff4dd2] bg-[#050716]/90 text-[#ff4dd2] group-hover:bg-[#ff4dd2] group-hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,77,210,0.6)] group-hover:scale-110">
                <Play size={20} fill="currentColor" className="ml-0.5" />
              </div>
              <span className="text-[10px] font-extrabold text-[#ff4dd2] uppercase tracking-widest group-hover:text-white transition-colors mt-1">
                VIEW DETAILS
              </span>
            </div>

            {/* Bottom Status */}
            {reminded && (
              <div className="bg-emerald-500 text-white text-[10px] font-bold text-center py-1 rounded-lg">
                Reminder Downloaded!
              </div>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="mt-2.5 px-0.5">
          <h3 className="text-white text-xs md:text-sm font-bold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors">
            {title}
          </h3>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 font-medium">
            <span className="text-gray-400 capitalize">{format.toLowerCase()}</span>
            {studio && <><span className="text-gray-700">•</span><span className="text-[#ff4dd2]/70 truncate">{studio}</span></>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── ⏱️ TIMELINE CHRONOLOGICAL VIEW ITEM ──────────────────────────────────────
function ScheduleTimelineRow({ item, timezoneOffsetHours }: { item: AiringSchedule; timezoneOffsetHours: number }) {
  const title = item.media.title.english || item.media.title.romaji || 'Unknown Anime';
  const linkId = item.media.idMal || item.media.id;
  const coverImage = item.media.coverImage?.large || '';
  const format = item.media.format ? item.media.format.replace('_', ' ') : 'TV';
  const studio = item.media.studios?.nodes?.[0]?.name;
  const score = item.media.averageScore ? (item.media.averageScore / 10).toFixed(1) : null;
  const desc = sanitizeDescription(item.media.description);

  const date = new Date((item.airingAt + timezoneOffsetHours * 3600) * 1000);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const isAired = item.airingAt * 1000 <= Date.now();

  return (
    <Link 
      href={`/series/${linkId}`}
      className="group flex items-center gap-4 md:gap-6 p-3 md:p-4 rounded-2xl bg-[#0c0d1e]/80 border border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#12132e] transition-all duration-300 cursor-pointer shadow-lg"
    >
      {/* Time Slot Pillar */}
      <div className="flex flex-col items-center justify-center min-w-[75px] md:min-w-[90px] py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-center flex-shrink-0">
        <Clock size={14} className="text-[#ff4dd2] mb-1" />
        <span className="text-xs md:text-sm font-black text-white whitespace-nowrap">{timeStr}</span>
        <span className={`text-[9px] font-bold uppercase mt-1 px-1.5 py-0.2 rounded ${isAired ? 'text-gray-500 bg-white/5' : 'text-[#ff6400] bg-[#ff6400]/10'}`}>
          {isAired ? 'AIRED' : 'UPCOMING'}
        </span>
      </div>

      {/* Poster */}
      <div className="w-14 h-20 md:w-16 md:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1b2e] border border-white/10 relative">
        {coverImage && (
          <img src={coverImage} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#ff4dd2] text-white uppercase tracking-wider">
            EP {item.episode}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-300 bg-white/10 border border-white/10">
            {format}
          </span>
          {studio && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-400 bg-white/5 border border-white/5">
              {studio}
            </span>
          )}
          {score && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 flex items-center gap-1">
              <Star size={10} className="fill-yellow-400" /> {score}
            </span>
          )}
        </div>

        <h4 className="text-white text-sm md:text-base font-bold truncate leading-tight group-hover:text-[#ff4dd2] transition-colors">
          {title}
        </h4>
        {desc && <p className="text-[11px] text-gray-400 line-clamp-1 mt-1">{desc}</p>}
      </div>

      <ChevronRight size={20} className="text-gray-500 group-hover:text-[#ff4dd2] group-hover:translate-x-1 transition-all flex-shrink-0" />
    </Link>
  );
}

// ─── 🌅☀️🌙 SECTIONED TIME SLOT CONTAINER COMPONENT ────────────────────────
function ScheduleSection({
  title,
  icon,
  timeRange,
  items,
  badgeColor,
  timezoneOffsetHours,
  onOpenPreview,
  viewMode
}: {
  title: string;
  icon: React.ReactNode;
  timeRange: string;
  items: AiringSchedule[];
  badgeColor: string;
  timezoneOffsetHours: number;
  onOpenPreview: (item: AiringSchedule) => void;
  viewMode: 'GRID' | 'TIMELINE';
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border flex items-center justify-center ${badgeColor}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-white text-base md:text-lg font-black uppercase tracking-wider flex items-center gap-2">
              {title}
            </h2>
            <span className="text-[11px] font-semibold text-gray-400">
              Broadcast Slot: <strong className="text-gray-200">{timeRange}</strong>
            </span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
          {items.length} {items.length === 1 ? 'Anime' : 'Animes'}
        </span>
      </div>

      {/* Grid or Timeline */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-5">
          {items.map((item, idx) => (
            <ScheduleAnimeCard 
              key={`${item.id}-${idx}`} 
              item={item} 
              index={idx}
              timezoneOffsetHours={timezoneOffsetHours}
              onOpenPreview={onOpenPreview}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ScheduleTimelineRow 
              key={item.id} 
              item={item} 
              timezoneOffsetHours={timezoneOffsetHours} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function ScheduleList({ initialSchedule }: { initialSchedule: AiringSchedule[] }) {
  const [schedule, setSchedule] = useState<AiringSchedule[]>(initialSchedule);
  const [mounted, setMounted] = useState(false);
  const { isInWatchlist } = useWatchlist();
  
  const [todayIdx, setTodayIdx] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'AIRED'>('ALL');
  const [timeSlotFilter, setTimeSlotFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT'>('ALL');
  const [sortOrder, setSortOrder] = useState<'TIME_ASC' | 'TIME_DESC' | 'SCORE_DESC' | 'TITLE_ASC'>('TIME_ASC');

  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [onlyMyWatchlist, setOnlyMyWatchlist] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'GRID' | 'TIMELINE'>('GRID');

  // Preview Modal Item
  const [previewItem, setPreviewItem] = useState<AiringSchedule | null>(null);

  // Week Navigation State
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [weekLoading, setWeekLoading] = useState<boolean>(false);

  // Timezone Switcher: LOCAL vs JST vs UTC
  const [tzMode, setTzMode] = useState<'LOCAL' | 'JST' | 'UTC'>('LOCAL');

  // Live Clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Drag Scroll Ref
  const dayStripRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const currentDay = now.getDay();
    setTodayIdx(currentDay);
    setSelectedDay(currentDay);
    setSchedule([...initialSchedule].sort((a, b) => a.airingAt - b.airingAt));

    const updateClock = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [initialSchedule]);

  // Compute Timezone Offset
  const timezoneOffsetHours = useMemo(() => {
    if (tzMode === 'JST') {
      const localTzOffsetHours = new Date().getTimezoneOffset() / -60;
      return 9 - localTzOffsetHours;
    }
    if (tzMode === 'UTC') {
      const localTzOffsetHours = new Date().getTimezoneOffset() / -60;
      return -localTzOffsetHours;
    }
    return 0;
  }, [tzMode]);

  // 🚀 Dynamic Week Navigation Logic
  const changeWeek = async (newOffset: number) => {
    setWeekOffset(newOffset);
    setWeekLoading(true);

    try {
      const now = new Date();
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      
      const mondayDate = new Date(now);
      mondayDate.setDate(now.getDate() - distanceToMonday + (newOffset * 7));
      mondayDate.setHours(0, 0, 0, 0);
      
      const start = Math.floor(mondayDate.getTime() / 1000);
      const end = start + 7 * 24 * 60 * 60 - 1;

      const newSchedule = await getScheduleAniList(start, end);
      setSchedule((newSchedule || []).sort((a, b) => a.airingAt - b.airingAt));
    } catch (err) {
      console.error('Error switching week:', err);
    } finally {
      setWeekLoading(false);
    }
  };

  // Days of Week Map
  const daysOfWeek = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const mondayDate = new Date(now);
    mondayDate.setDate(now.getDate() - distanceToMonday + (weekOffset * 7));

    const days = [
      { id: 1, name: 'Mon', fullName: 'Monday' },
      { id: 2, name: 'Tue', fullName: 'Tuesday' },
      { id: 3, name: 'Wed', fullName: 'Wednesday' },
      { id: 4, name: 'Thu', fullName: 'Thursday' },
      { id: 5, name: 'Fri', fullName: 'Friday' },
      { id: 6, name: 'Sat', fullName: 'Saturday' },
      { id: 0, name: 'Sun', fullName: 'Sunday' },
    ];

    return days.map((day, idx) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + idx);
      const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const isRealToday = d.toDateString() === new Date().toDateString();
      return { ...day, dateStr, isRealToday };
    });
  }, [weekOffset]);

  // Compute Unique Genres
  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    schedule.forEach(item => {
      item.media.genres?.forEach(g => set.add(g));
    });
    return Array.from(set).sort();
  }, [schedule]);

  // Group by Day of Week
  const groupedSchedule = useMemo(() => {
    const map: Record<number, AiringSchedule[]> = { 0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[] };
    schedule.forEach(item => {
      const date = new Date(item.airingAt * 1000);
      const dayOfWeek = date.getDay();
      map[dayOfWeek].push(item);
    });
    return map;
  }, [schedule]);

  // Spotlight Item
  const nextAiringItem = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);
    return schedule.find(item => item.airingAt > nowSec) || null;
  }, [schedule]);

  // Filter & Sort items for selected day
  const currentDayItems = useMemo(() => {
    const dayItems = groupedSchedule[selectedDay] || [];
    const nowSec = Math.floor(Date.now() / 1000);

    const filtered = dayItems.filter(item => {
      const linkId = item.media.idMal || item.media.id;

      // Watchlist filter
      if (onlyMyWatchlist && !isInWatchlist(linkId)) return false;

      // Title Search
      const title = (item.media.title.english || item.media.title.romaji || '').toLowerCase();
      if (searchQuery.trim() && !title.includes(searchQuery.trim().toLowerCase())) return false;

      // Format filter
      const format = (item.media.format || '').toUpperCase();
      if (formatFilter !== 'ALL' && !format.includes(formatFilter)) return false;

      // Genre Filter
      if (selectedGenre !== 'ALL' && (!item.media.genres || !item.media.genres.includes(selectedGenre))) return false;

      // Status filter
      const isAired = item.airingAt <= nowSec;
      if (statusFilter === 'UPCOMING' && isAired) return false;
      if (statusFilter === 'AIRED' && !isAired) return false;

      return true;
    });

    // Sort Order
    return filtered.sort((a, b) => {
      if (sortOrder === 'TIME_DESC') return b.airingAt - a.airingAt;
      if (sortOrder === 'SCORE_DESC') return (b.media.averageScore || 0) - (a.media.averageScore || 0);
      if (sortOrder === 'TITLE_ASC') {
        const titleA = a.media.title.english || a.media.title.romaji || '';
        const titleB = b.media.title.english || b.media.title.romaji || '';
        return titleA.localeCompare(titleB);
      }
      return a.airingAt - b.airingAt; // Default TIME_ASC
    });
  }, [groupedSchedule, selectedDay, searchQuery, formatFilter, selectedGenre, statusFilter, sortOrder, onlyMyWatchlist, isInWatchlist]);

  // 🌅☀️🌙 Split Day Items into 3 Time-of-Day Slots
  const sectionedItems = useMemo(() => {
    const morning: AiringSchedule[] = [];
    const afternoon: AiringSchedule[] = [];
    const night: AiringSchedule[] = [];

    currentDayItems.forEach(item => {
      const date = new Date((item.airingAt + timezoneOffsetHours * 3600) * 1000);
      const hour = date.getHours();

      if (hour < 12) {
        morning.push(item);
      } else if (hour < 18) {
        afternoon.push(item);
      } else {
        night.push(item);
      }
    });

    return { morning, afternoon, night };
  }, [currentDayItems, timezoneOffsetHours]);

  // Drag Scroll Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dayStripRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - dayStripRef.current.offsetLeft);
    setScrollLeft(dayStripRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dayStripRef.current) return;
    e.preventDefault();
    const x = e.pageX - dayStripRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    dayStripRef.current.scrollLeft = scrollLeft - walk;
  };

  // Share Day's Schedule Text Generator
  const shareDaySchedule = () => {
    const dayName = daysOfWeek.find(d => d.id === selectedDay)?.fullName || 'Today';
    const text = [
      `📅 Anime Nation India Schedule (${dayName}):`,
      ...currentDayItems.map((item, i) => {
        const title = item.media.title.english || item.media.title.romaji || 'Unknown Anime';
        const date = new Date((item.airingAt + timezoneOffsetHours * 3600) * 1000);
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${i + 1}. EP ${item.episode} - ${title} (${time})`;
      }),
      '',
      '✨ Watch live at: https://www.animenationindia.online/schedule'
    ].join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-44 bg-[#0c0d1e] rounded-3xl" />
        <div className="flex gap-3 overflow-hidden">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="w-28 h-12 bg-[#0c0d1e] rounded-2xl flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="w-full aspect-[2/3] bg-[#0c0d1e] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalAiringWeek = schedule.length;
  const todayAiringCount = (groupedSchedule[todayIdx] || []).length;

  return (
    <div className="space-y-8 relative">

      {/* ─── 💮 JAPANESE WATERMARK & HUD HEADER ─── */}
      <div className="relative rounded-3xl bg-[#0c0d1e]/90 border border-white/10 p-6 md:p-8 backdrop-blur-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.85)]">
        
        {/* Japanese Otaku Typography Watermark */}
        <div className="absolute right-4 bottom-[-10px] text-white/[0.03] text-7xl md:text-9xl font-black select-none pointer-events-none tracking-widest">
          放送スケジュール
        </div>

        {/* Ambient Neon Blobs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ff4dd2]/15 blur-[110px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#ff6400]/15 blur-[110px] rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          {/* Title Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/30">
                <Radio size={12} className="animate-pulse text-[#ff4dd2]" /> BROADCAST COMMAND CENTER
              </span>
              
              {/* Live Clock Badge */}
              {currentTimeStr && (
                <span className="text-[11px] font-mono font-bold text-gray-300 bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {currentTimeStr}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
              SIMULCAST <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] via-[#ff6400] to-[#ff4dd2]">SCHEDULE</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-xl leading-relaxed">
              Official Japanese TV & Global Streaming release timetable. Track new episodes synchronized to your local timezone.
            </p>
          </div>

          {/* Telemetry Quick Cards + Timezone Switcher */}
          <div className="flex flex-col gap-3">
            
            {/* Timezone Switcher */}
            <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 p-1.5 rounded-2xl self-start lg:self-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2.5 flex items-center gap-1">
                <Globe size={12} className="text-[#ff4dd2]" /> TZ:
              </span>
              {(['LOCAL', 'JST', 'UTC'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTzMode(mode)}
                  className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                    tzMode === mode 
                      ? 'bg-[#ff4dd2] text-white shadow-[0_0_10px_rgba(255,77,210,0.5)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {mode === 'LOCAL' ? 'LOCAL' : mode === 'JST' ? 'JST (TOKYO)' : 'UTC'}
                </button>
              ))}
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <CalendarDays size={11} className="text-[#ff4dd2]" /> THIS WEEK
                </span>
                <span className="text-xl font-black text-white mt-0.5">{totalAiringWeek}</span>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Flame size={11} className="text-[#ff6400]" /> TODAY
                </span>
                <span className="text-xl font-black text-[#ff4dd2] mt-0.5">{todayAiringCount}</span>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 rounded-2xl p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-[#ff4dd2] uppercase tracking-wider flex items-center gap-1">
                  <Zap size={11} className="fill-[#ff4dd2]" /> NEXT UP
                </span>
                <span className="text-xs font-bold text-white truncate mt-0.5">
                  {nextAiringItem ? `EP ${nextAiringItem.episode}` : 'Completed'}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ─── 🌟 2. OTAKU SPOTLIGHT: NEXT AIRING BROADCAST BANNER ─── */}
      {nextAiringItem && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl bg-[#0c0d1e] border border-[#ff4dd2]/40 p-5 md:p-6 overflow-hidden shadow-[0_15px_50px_rgba(255,77,210,0.18)] group"
        >
          {/* Background Banner */}
          {nextAiringItem.media.bannerImage && (
            <div className="absolute inset-0 z-0 opacity-20">
              <img src={nextAiringItem.media.bannerImage} alt="Banner" className="w-full h-full object-cover blur-md" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d1e] via-[#0c0d1e]/80 to-[#0c0d1e]" />
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Poster Thumbnail */}
            <div className="w-24 h-36 md:w-28 md:h-40 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-2xl relative">
              {nextAiringItem.media.coverImage?.large && (
                <img 
                  src={nextAiringItem.media.coverImage.large} 
                  alt="Next Up" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              )}
              <div className="absolute top-2 left-2 bg-[#ff4dd2] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase shadow">
                SPOTLIGHT
              </div>
            </div>

            {/* Info Body */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#ff6400] text-white shadow-md">
                  <Sparkles size={11} /> NEXT IMMEDIATE AIRING
                </span>
                {nextAiringItem.media.studios?.nodes?.[0]?.name && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-gray-300 bg-white/10 border border-white/10">
                    Studio: {nextAiringItem.media.studios.nodes[0].name}
                  </span>
                )}
                {nextAiringItem.media.averageScore && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 flex items-center gap-1">
                    <Star size={10} className="fill-yellow-400" /> {(nextAiringItem.media.averageScore / 10).toFixed(1)}
                  </span>
                )}
              </div>

              <h3 className="text-white text-xl md:text-2xl font-black truncate leading-tight">
                {nextAiringItem.media.title.english || nextAiringItem.media.title.romaji}
              </h3>

              <p className="text-gray-300 text-xs md:text-sm mt-1.5 flex items-center justify-center md:justify-start gap-2">
                <span>Episode <strong className="text-[#ff4dd2]">{nextAiringItem.episode}</strong></span>
                <span className="text-gray-600">•</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <Clock size={12} className="text-[#ff4dd2]" />
                  {new Date((nextAiringItem.airingAt + timezoneOffsetHours * 3600) * 1000).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                </span>
              </p>

              {nextAiringItem.media.genres && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mt-3">
                  {nextAiringItem.media.genres.slice(0, 4).map((g, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-400 bg-white/5 border border-white/5">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
              <Link 
                href={`/series/${nextAiringItem.media.idMal || nextAiringItem.media.id}`}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#ff4dd2] to-[#ff6400] text-white font-black text-xs uppercase tracking-wider hover:shadow-[0_0_30px_rgba(255,77,210,0.6)] transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                Watch Series <ChevronRight size={16} />
              </Link>
              
              <button
                type="button"
                onClick={() => downloadIcsReminder(nextAiringItem)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Bell size={14} className="text-[#ff4dd2]" /> Add Calendar Reminder
              </button>
            </div>

          </div>
        </motion.div>
      )}

      {/* ─── 📅 3. HIANIME-STYLE DYNAMIC WEEK & DAY CONTROLLER ─── */}
      <div className="flex flex-col gap-4">
        
        {/* Days Tab Bar Container with Left/Right Navigation & Touch Drag */}
        <div className="relative flex items-center gap-2">

          {/* 👈 PREVIOUS WEEK BUTTON (<) */}
          <button
            type="button"
            onClick={() => changeWeek(weekOffset - 1)}
            disabled={weekLoading}
            title="Previous Week Schedule"
            className="w-12 h-14 rounded-2xl bg-[#0c0d1e]/90 hover:bg-[#ff4dd2] border border-white/10 hover:border-[#ff4dd2] text-white flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-lg cursor-pointer hover:scale-105 disabled:opacity-50 group"
          >
            <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Scrollable & Touch-Draggable Day Strip */}
          <div 
            ref={dayStripRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex-1 p-1.5 bg-[#0c0d1e]/90 backdrop-blur-xl border border-white/10 rounded-2xl flex overflow-x-auto custom-scrollbar gap-1.5 select-none touch-pan-x cursor-grab active:cursor-grabbing relative"
          >
            {weekLoading ? (
              <div className="w-full py-5 flex items-center justify-center gap-2 text-[#ff4dd2] font-bold text-xs">
                <Loader2 size={18} className="animate-spin" />
                <span>Loading Week Schedule...</span>
              </div>
            ) : (
              daysOfWeek.map(day => {
                const isSelected = selectedDay === day.id;
                const releaseCount = (groupedSchedule[day.id] || []).length;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDay(day.id)}
                    className={`relative flex-1 min-w-[105px] md:min-w-[125px] py-3 px-3 rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none ${
                      isSelected ? 'text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeScheduleDay"
                        className="absolute inset-0 bg-gradient-to-br from-[#ff4dd2] to-[#ff6400] rounded-xl shadow-[0_0_25px_rgba(255,77,210,0.4)] z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    <div className="relative z-10 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black uppercase tracking-wider">
                          {day.isRealToday ? 'TODAY' : day.name}
                        </span>
                        {day.isRealToday && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4dd2] animate-ping" />
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                        {day.dateStr}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                        isSelected ? 'bg-black/35 text-white' : 'bg-white/5 text-gray-400'
                      }`}>
                        {releaseCount} Releases
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* 👉 NEXT WEEK BUTTON (>) */}
          <button
            type="button"
            onClick={() => changeWeek(weekOffset + 1)}
            disabled={weekLoading}
            title="Next Week Schedule"
            className="w-12 h-14 rounded-2xl bg-[#0c0d1e]/90 hover:bg-[#ff4dd2] border border-white/10 hover:border-[#ff4dd2] text-white flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-lg cursor-pointer hover:scale-105 disabled:opacity-50 group"
          >
            <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

        </div>

        {/* Header indicator when navigated away from current week */}
        {weekOffset !== 0 && (
          <div className="flex items-center justify-between bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 px-4 py-2.5 rounded-2xl">
            <span className="text-xs font-bold text-[#ff4dd2] flex items-center gap-2">
              <CalendarDays size={14} />
              Viewing {weekOffset < 0 ? `${Math.abs(weekOffset)} week(s) past` : `${weekOffset} week(s) future`} schedule
            </span>
            <button
              type="button"
              onClick={() => changeWeek(0)}
              className="flex items-center gap-1.5 text-xs font-black uppercase text-white bg-[#ff4dd2] hover:bg-[#ff6400] px-3 py-1 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw size={12} /> Reset to Today
            </button>
          </div>
        )}

        {/* 🎛️ EXTENDED FILTERS & COMMAND BAR */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Search Box with Clear Button */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search schedule by anime title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0d1e]/90 border border-white/10 text-white placeholder-gray-500 text-xs rounded-xl py-2.5 pl-10 pr-9 focus:outline-none focus:border-[#ff4dd2]/60 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right Controls Row */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            
            {/* 🌅 TIME-OF-DAY AIRING SLOT FILTER */}
            <div className="flex items-center gap-1 bg-[#0c0d1e]/90 border border-white/10 p-1 rounded-xl">
              {(['ALL', 'MORNING', 'AFTERNOON', 'NIGHT'] as const).map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlotFilter(slot)}
                  title={`Filter ${slot} Airings`}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                    timeSlotFilter === slot ? 'bg-[#ff4dd2] text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {slot === 'MORNING' && <Sunrise size={11} />}
                  {slot === 'AFTERNOON' && <Sun size={11} />}
                  {slot === 'NIGHT' && <Moon size={11} />}
                  <span>{slot === 'ALL' ? 'ALL SLOTS' : slot}</span>
                </button>
              ))}
            </div>

            {/* 🌟 MY WATCHLIST ONLY FILTER TOGGLE */}
            <button
              type="button"
              onClick={() => setOnlyMyWatchlist(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer border ${
                onlyMyWatchlist 
                  ? 'bg-[#ff4dd2] text-white border-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.5)]' 
                  : 'bg-[#0c0d1e]/90 text-gray-400 border-white/10 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart size={14} className={onlyMyWatchlist ? 'fill-white' : 'text-[#ff4dd2]'} />
              <span className="hidden sm:inline">MY WATCHLIST</span>
            </button>

            {/* 🏷️ GENRE DROPDOWN */}
            {availableGenres.length > 0 && (
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={e => setSelectedGenre(e.target.value)}
                  className="bg-[#0c0d1e]/90 border border-white/10 text-white text-[11px] font-bold rounded-xl py-2 px-3 focus:outline-none focus:border-[#ff4dd2]/60 cursor-pointer appearance-none pr-7"
                >
                  <option value="ALL">All Genres</option>
                  {availableGenres.map(g => (
                    <option key={g} value={g} className="bg-[#0c0d1e] text-white">{g}</option>
                  ))}
                </select>
                <Compass size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            )}

            {/* 🔀 SORT DROPDOWN */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="bg-[#0c0d1e]/90 border border-white/10 text-white text-[11px] font-bold rounded-xl py-2 px-3 focus:outline-none focus:border-[#ff4dd2]/60 cursor-pointer appearance-none pr-7"
              >
                <option value="TIME_ASC" className="bg-[#0c0d1e]">Sort: Time ⬆</option>
                <option value="TIME_DESC" className="bg-[#0c0d1e]">Sort: Time ⬇</option>
                <option value="SCORE_DESC" className="bg-[#0c0d1e]">Sort: Score ⭐</option>
                <option value="TITLE_ASC" className="bg-[#0c0d1e]">Sort: Title A-Z</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            {/* 🔗 SHARE TIMETABLE */}
            <button
              type="button"
              onClick={shareDaySchedule}
              title="Copy Today's Schedule for Social Media / Discord"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              {copiedShare ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} className="text-[#ff4dd2]" />}
              <span className="hidden sm:inline">{copiedShare ? 'Copied!' : 'Share'}</span>
            </button>

            {/* 🎛️ VIEW MODE SWITCHER */}
            <div className="flex items-center gap-1 bg-black/60 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('GRID')}
                title="Grid View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'GRID' ? 'bg-[#ff4dd2] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TIMELINE')}
                title="Timeline View"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'TIMELINE' ? 'bg-[#ff4dd2] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListFilter size={15} />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ─── 📱 4. MAIN DISPLAY (SPLIT BY MORNING, AFTERNOON, & NIGHT SECTIONS) ─── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`sections-${weekOffset}-${selectedDay}-${statusFilter}-${formatFilter}-${selectedGenre}-${timeSlotFilter}-${sortOrder}-${onlyMyWatchlist}-${searchQuery}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-10"
        >
          {/* 🌅 MORNING SECTION (00:00 - 11:59) */}
          {(timeSlotFilter === 'ALL' || timeSlotFilter === 'MORNING') && (
            <ScheduleSection 
              title="Morning Broadcasts"
              icon={<Sunrise size={20} className="text-amber-400" />}
              timeRange="00:00 AM - 11:59 AM"
              items={sectionedItems.morning}
              badgeColor="bg-amber-400/10 border-amber-400/30 text-amber-400"
              timezoneOffsetHours={timezoneOffsetHours}
              onOpenPreview={setPreviewItem}
              viewMode={viewMode}
            />
          )}

          {/* ☀️ AFTERNOON SECTION (12:00 - 17:59) */}
          {(timeSlotFilter === 'ALL' || timeSlotFilter === 'AFTERNOON') && (
            <ScheduleSection 
              title="Afternoon Broadcasts"
              icon={<Sun size={20} className="text-[#ff6400]" />}
              timeRange="12:00 PM - 05:59 PM"
              items={sectionedItems.afternoon}
              badgeColor="bg-[#ff6400]/10 border-[#ff6400]/30 text-[#ff6400]"
              timezoneOffsetHours={timezoneOffsetHours}
              onOpenPreview={setPreviewItem}
              viewMode={viewMode}
            />
          )}

          {/* 🌙 NIGHT SECTION (18:00 - 23:59) */}
          {(timeSlotFilter === 'ALL' || timeSlotFilter === 'NIGHT') && (
            <ScheduleSection 
              title="Prime Night Broadcasts"
              icon={<Moon size={20} className="text-[#ff4dd2]" />}
              timeRange="06:00 PM - 11:59 PM"
              items={sectionedItems.night}
              badgeColor="bg-[#ff4dd2]/10 border-[#ff4dd2]/30 text-[#ff4dd2]"
              timezoneOffsetHours={timezoneOffsetHours}
              onOpenPreview={setPreviewItem}
              viewMode={viewMode}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {currentDayItems.length === 0 && !weekLoading && (
        <div className="py-20 text-center bg-[#0c0d1e]/50 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 backdrop-blur-md">
          <Tv2 size={40} className="text-gray-600" />
          <h3 className="text-white text-base font-bold">No Scheduled Releases Found</h3>
          <p className="text-gray-500 text-xs max-w-md">
            {onlyMyWatchlist 
              ? 'No anime from your Watchlist is scheduled for release on this day.'
              : searchQuery 
              ? `No anime matching "${searchQuery}" found for this day.` 
              : 'No upcoming episodes broadcast scheduled for this selected date.'}
          </p>
        </div>
      )}

      {/* ─── 🔮 5. QUICK SYNOPSIS PREVIEW MODAL ─── */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewItem(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0c0d1e] border border-[#ff4dd2]/40 rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] z-10 p-6"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-20 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex gap-4">
                {/* Poster */}
                <div className="w-24 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-[#1a1b2e] border border-white/10 relative">
                  {previewItem.media.coverImage?.large && (
                    <img src={previewItem.media.coverImage.large} alt="Poster" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#ff4dd2] text-white px-2 py-0.5 rounded">
                    EPISODE {previewItem.episode}
                  </span>
                  <h3 className="text-white text-lg font-bold line-clamp-2 mt-1 leading-tight">
                    {previewItem.media.title.english || previewItem.media.title.romaji}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">
                    Format: <span className="text-white font-bold">{previewItem.media.format}</span>
                    {previewItem.media.studios?.nodes?.[0]?.name && (
                      <span> • Studio: <span className="text-[#ff4dd2] font-bold">{previewItem.media.studios.nodes[0].name}</span></span>
                    )}
                  </p>
                  {previewItem.media.genres && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {previewItem.media.genres.slice(0, 3).map((g, i) => (
                        <span key={i} className="text-[9px] font-medium text-gray-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Synopsis */}
              {previewItem.media.description && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-300 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                    {sanitizeDescription(previewItem.media.description)}
                  </p>
                </div>
              )}

              {/* Modal Action */}
              <div className="mt-5 flex gap-2">
                <Link
                  href={`/series/${previewItem.media.idMal || previewItem.media.id}`}
                  onClick={() => setPreviewItem(null)}
                  className="flex-1 text-center py-3 bg-gradient-to-r from-[#ff4dd2] to-[#ff6400] text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_0_20px_rgba(255,77,210,0.5)] transition-all"
                >
                  Go to Series Page
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
