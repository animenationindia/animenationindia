'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Star, SearchX, Tv2, Bookmark, Check, Play, BookOpen,
  Sparkles, TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '../lib/config';
import ErrorState from './ErrorState';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnimeMedia {
  id: number;
  idMal: number | null;
  title: { english: string | null; romaji: string | null };
  coverImage: { large: string | null; extraLarge?: string | null };
  averageScore: number | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  seasonYear: number | null;
  startDate?: { year: number | null } | null;
  genres: string[] | null;
  description: string | null;
  type?: string | null;
}
interface PageInfo { total: number; currentPage: number; lastPage: number; hasNextPage: boolean; }

// ─── Constants ───────────────────────────────────────────────────────────────
const ANILIST = 'https://graphql.anilist.co';
const FORMATS = ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'];
const STATUSES = [
  { label: 'Airing', value: 'RELEASING' },
  { label: 'Finished', value: 'FINISHED' },
  { label: 'Upcoming', value: 'NOT_YET_RELEASED' },
];
const SORTS = [
  { label: 'Popularity', value: 'POPULARITY_DESC' },
  { label: 'Top Rated', value: 'SCORE_DESC' },
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Newest', value: 'START_DATE_DESC' },
  { label: 'Oldest', value: 'START_DATE' },
];
const GENRES = [
  'Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery',
  'Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller',
  'Mecha','Music','Psychological','Historical','Ecchi','Isekai',
];
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CUR_YEAR - 1989 }, (_, i) => CUR_YEAR - i);

const QUICK_TAGS = ['Naruto', 'One Piece', 'Solo Leveling', 'Demon Slayer', 'Bleach', 'Attack on Titan', 'Jujutsu Kaisen', 'Dragon Ball'];

function formatBadgeColor(f: string | null) {
  switch ((f || '').toUpperCase()) {
    case 'TV': return 'bg-blue-500/25 text-blue-300 border-blue-500/30';
    case 'MOVIE': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'OVA': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'ONA': return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    case 'SPECIAL': return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    default: return 'bg-white/8 text-gray-400 border-white/10';
  }
}

// ─── AniList API ─────────────────────────────────────────────────────────────
async function anilistFetch(query: string, variables: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(ANILIST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message || 'AniList error');
    return json.data;
  } finally { clearTimeout(timeout); }
}

const SEARCH_Q = `
  query ($page: Int, $format: MediaFormat, $status: MediaStatus, $seasonYear: Int, $genres: [String], $sort: [MediaSort]) {
    Page(page: $page, perPage: 24) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(type: ANIME, isAdult: false, sort: $sort, format: $format, status: $status, seasonYear: $seasonYear, genre_in: $genres) {
        id idMal title { english romaji } coverImage { large extraLarge }
        averageScore format status episodes seasonYear startDate { year } genres description
      }
    }
  }
`;
const SEARCH_Q_TEXT = `
  query ($search: String, $page: Int, $format: MediaFormat, $status: MediaStatus, $seasonYear: Int, $genres: [String], $sort: [MediaSort]) {
    Page(page: $page, perPage: 24) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(search: $search, type: ANIME, isAdult: false, sort: $sort, format: $format, status: $status, seasonYear: $seasonYear, genre_in: $genres) {
        id idMal title { english romaji } coverImage { large extraLarge }
        averageScore format status episodes seasonYear startDate { year } genres description
      }
    }
  }
`;
const SUGGEST_Q = `
  query ($search: String) {
    Page(page: 1, perPage: 7) {
      media(search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
        id idMal title { english romaji } coverImage { large } format seasonYear averageScore
      }
    }
  }
`;
const TRENDING_Q = `
  query {
    Page(page: 1, perPage: 24) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id idMal title { english romaji } coverImage { large extraLarge }
        averageScore format status episodes seasonYear genres description
      }
    }
  }
`;

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5" style={{ animationDelay: `${i * 40}ms` }}>
          <div className="w-full aspect-[2/3] rounded-xl bg-gradient-to-b from-[#1a1b2e] to-[#0d0e1f] animate-pulse" />
          <div className="h-3 rounded-full bg-[#1a1b2e] w-4/5 animate-pulse" style={{ animationDelay: `${i * 40 + 100}ms` }} />
          <div className="h-2.5 rounded-full bg-[#1a1b2e] w-2/5 animate-pulse" style={{ animationDelay: `${i * 40 + 200}ms` }} />
        </div>
      ))}
    </div>
  );
}

// ─── Result Card ─────────────────────────────────────────────────────────────
let wlCache: unknown[] | null = null;
let wlPromise: Promise<unknown[]> | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('auth-change', () => { wlCache = null; wlPromise = null; });
}

import { sanitizeDescription } from '../lib/sanitize';

function ResultCard({ anime, priority = false, index = 0 }: { anime: AnimeMedia; priority?: boolean; index?: number }) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const title = anime.title?.english || anime.title?.romaji || 'Unknown';
  const linkId = anime.idMal || anime.id;
  const isManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL';
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || '';
  const desc = sanitizeDescription(anime.description);
  const year = anime.seasonYear || anime.startDate?.year;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    const checkWL = async () => {
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');
      if (!token || !userId) return;
      try {
        if (!wlCache && !wlPromise) {
          wlPromise = fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
            headers: { Authorization: 'Bearer ' + token },
          }).then(r => r.ok ? r.json() : []).then(d => { wlCache = d; return d; }).catch(() => []);
        }
        const list = (wlCache || await wlPromise) as { mal_id?: number; anime_id?: number }[];
        if (list.some(item => Number(item.mal_id || item.anime_id) === Number(linkId))) setSaved(true);
      } catch { /* */ }
    };
    checkWL();
    return () => cancelAnimationFrame(frame);
  }, [linkId]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const token = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    if (!token || !userId) { alert('Please login first!'); router.push('/auth'); return; }
    const next = !saved; setSaved(next);
    try {
      if (next) {
        const p = { mal_id: Number(linkId), title, title_english: title, type: isManga ? 'Manga' : 'Anime', images: { webp: { large_image_url: cover } }, score: anime.averageScore ? anime.averageScore / 10 : null, anime_id: Number(linkId), anime_title: title, anime_image: cover, status: 'PLAN_TO_WATCH' };
        await fetch(`${BACKEND_URL}/api/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ anime: p, userId }) });
        if (wlCache) (wlCache as unknown[]).push(p);
      } else {
        await fetch(`${BACKEND_URL}/api/watchlist/${userId}/${linkId}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
        if (wlCache) wlCache = (wlCache as { mal_id?: number; anime_id?: number }[]).filter(i => Number(i.mal_id || i.anime_id) !== Number(linkId));
      }
    } catch { setSaved(!next); }
  };

  if (!mounted) return (
    <div className="flex flex-col gap-2.5 animate-pulse">
      <div className="w-full aspect-[2/3] rounded-xl bg-[#1a1b2e]" />
      <div className="h-3 rounded-full bg-[#1a1b2e] w-4/5" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.5) }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="group relative w-full flex flex-col cursor-pointer"
    >
      <Link href={isManga ? `/manga/${linkId}` : `/series/${linkId}`} prefetch={false} className="block relative">
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#0d0e1f] rounded-xl border border-white/10 group-hover:border-[#ff4dd2]/50 group-hover:shadow-[0_8px_30px_rgba(255,77,210,0.2)] transition-all duration-300">
          {cover && (
            <Image src={cover} alt={title} fill priority={priority} sizes="(max-width:640px)33vw,(max-width:1024px)20vw,14vw" className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
          )}

          {/* Score */}
          {anime.averageScore && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-lg px-2 py-0.5 pointer-events-none border border-white/5">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[11px] font-bold text-white leading-none">{(anime.averageScore / 10).toFixed(1)}</span>
            </div>
          )}

          {/* Format */}
          {anime.format && (
            <div className={`absolute top-2 right-2 z-20 rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider pointer-events-none border ${formatBadgeColor(anime.format)}`}>
              {anime.format.replace('_', ' ')}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 backdrop-blur-[1px]">
            <div className="flex flex-col items-center justify-center flex-1 gap-2 pb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 border-[#ff4dd2] bg-[#050716]/70 text-[#ff4dd2] hover:bg-[#ff4dd2] hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,77,210,0.4)]">
                {isManga ? <BookOpen size={20} strokeWidth={2.5} /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </div>
              <span className="text-[10px] font-bold text-[#ff4dd2] uppercase tracking-widest">{isManga ? 'READ' : 'WATCH'}</span>
            </div>
            {desc && <p className="text-[10px] leading-relaxed line-clamp-3 text-gray-300/90 relative z-10">{desc}</p>}
          </div>

          {/* Watchlist */}
          <div className={`absolute bottom-2 right-2 z-30 transition-all duration-300 ${saved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button onClick={toggleSave} className={`w-8 h-8 flex items-center justify-center rounded-full transition-all backdrop-blur-md shadow-lg ${saved ? 'bg-[#ff4dd2] text-white scale-110' : 'bg-black/60 hover:bg-[#ff4dd2] text-white border border-white/20'}`}>
              {saved ? <Check size={14} strokeWidth={3} /> : <Bookmark size={14} />}
            </button>
          </div>
        </div>

        {/* Text */}
        <div className="mt-2.5 px-0.5">
          <h3 className="text-white text-[13px] font-semibold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors duration-200">{title}</h3>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
            <span className="text-[#ff4dd2]/70 capitalize">{(anime.format || 'tv').toLowerCase().replace('_', ' ')}</span>
            {year && <><span className="text-gray-700">•</span><span>{year}</span></>}
            {anime.episodes && <><span className="text-gray-700">•</span><span>{anime.episodes} ep</span></>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface Props {
  initialQuery: string;
  initialGenres: string;
  initialFormat: string;
  initialStatus: string;
  initialYear: string;
  initialSort: string;
  initialPage: number;
}

export default function SearchPageClient({ initialQuery, initialGenres, initialFormat, initialStatus, initialYear, initialSort, initialPage }: Props) {

  // ── State ──
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<AnimeMedia[]>([]);
  const [showSugg, setShowSugg] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);
  const [activeSugg, setActiveSugg] = useState(-1);
  const [inputFocused, setInputFocused] = useState(false);

  const [showFilters, setShowFilters] = useState(!!(initialGenres || initialFormat || initialStatus || initialYear));
  const [genres, setGenres] = useState<string[]>(initialGenres ? initialGenres.split(',') : []);
  const [format, setFormat] = useState(initialFormat);
  const [status, setStatus] = useState(initialStatus);
  const [year, setYear] = useState(initialYear);
  const [sort, setSort] = useState(initialSort || 'POPULARITY_DESC');

  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ total: 0, currentPage: initialPage, lastPage: 1, hasNextPage: false });
  const [loading, setLoading] = useState(true);
  const [softLoading, setSoftLoading] = useState(false); // Subtle loading bar instead of replacing grid
  const [isSuggestion, setIsSuggestion] = useState(false);
  const [hasError, setHasError] = useState(false);

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  // ── URL Update (silent) ──
  const syncURL = useCallback((q: string, g: string[], f: string, s: string, y: string, so: string, pg: number) => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (g.length) p.set('genres', g.join(','));
    if (f) p.set('format', f);
    if (s) p.set('status', s);
    if (y) p.set('year', y);
    if (so && so !== 'POPULARITY_DESC') p.set('sort', so);
    if (pg > 1) p.set('page', String(pg));
    const qs = p.toString();
    window.history.replaceState({}, '', `/search${qs ? '?' + qs : ''}`);
  }, []);

  // ── Fetch Results ──
  const doSearch = useCallback(async (q: string, g: string[], f: string, s: string, y: string, so: string, pg: number, isHardLoad = false) => {
    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setHasError(false);
    if (isHardLoad) setLoading(true);
    else setSoftLoading(true);

    try {
      const hasFilter = q.trim() || g.length || f || s || y;
      if (!hasFilter) {
        const data = await anilistFetch(TRENDING_Q, {});
        setResults(data.Page.media || []);
        setPageInfo(data.Page.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false });
        setIsSuggestion(true);
      } else {
        const vars: Record<string, unknown> = {
          page: pg,
          sort: [so],
          format: f || undefined,
          status: s || undefined,
          seasonYear: y ? parseInt(y) : undefined,
          genres: g.length ? g : undefined,
        };
        if (q.trim()) vars.search = q.trim();
        const data = await anilistFetch(q.trim() ? SEARCH_Q_TEXT : SEARCH_Q, vars);
        setResults(data.Page.media || []);
        setPageInfo(data.Page.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false });
        setIsSuggestion(false);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // Aborted, ignore
      setResults([]);
      setIsSuggestion(false);
      setHasError(true);
    } finally {
      setLoading(false);
      setSoftLoading(false);
    }
  }, []);

  // ── Fetch Suggestions (only suggestions, does NOT touch results) ──
  const fetchSugg = useCallback((q: string) => {
    if (suggTimer.current) clearTimeout(suggTimer.current);
    if (!q.trim() || q.length < 2) { setSuggestions([]); setShowSugg(false); setSuggLoading(false); return; }
    setSuggLoading(true);
    suggTimer.current = setTimeout(async () => {
      try {
        const data = await anilistFetch(SUGGEST_Q, { search: q.trim() });
        const items = data.Page?.media || [];
        setSuggestions(items);
        if (items.length > 0) setShowSugg(true);
      } catch { /* */ }
      finally { setSuggLoading(false); }
    }, 300);
  }, []);

  // ── Debounced search (does NOT hide suggestions) ──
  const debouncedSearch = useCallback((q: string, g: string[], f: string, s: string, y: string, so: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      doSearch(q, g, f, s, y, so, 1, false);
      syncURL(q, g, f, s, y, so, 1);
    }, 800);
  }, [doSearch, syncURL]);

  // ── Initial load ──
  useEffect(() => {
    doSearch(initialQuery, initialGenres ? initialGenres.split(',') : [], initialFormat, initialStatus, initialYear, initialSort || 'POPULARITY_DESC', initialPage, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close suggestions on outside click ──
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSugg(false); setActiveSugg(-1); setInputFocused(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Input change (ONLY sets local state + fetches suggestions + debounced search) ──
  const onInputChange = (val: string) => {
    setQuery(val);
    setActiveSugg(-1);
    fetchSugg(val);
    debouncedSearch(val, genres, format, status, year, sort);
  };

  const onClear = () => {
    setQuery('');
    setSuggestions([]); setShowSugg(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    doSearch('', genres, format, status, year, sort, 1, false);
    syncURL('', genres, format, status, year, sort, 1);
    inputRef.current?.focus();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setShowSugg(false);
    doSearch(query, genres, format, status, year, sort, 1, false);
    syncURL(query, genres, format, status, year, sort, 1);
  };

  const onSuggClick = (a: AnimeMedia) => {
    const t = a.title?.english || a.title?.romaji || '';
    setQuery(t);
    setShowSugg(false); setActiveSugg(-1);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    doSearch(t, genres, format, status, year, sort, 1, false);
    syncURL(t, genres, format, status, year, sort, 1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showSugg || !suggestions.length) {
      if (e.key === 'Escape') { setShowSugg(false); inputRef.current?.blur(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSugg(p => Math.min(p + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSugg(p => Math.max(p - 1, -1)); }
    else if (e.key === 'Enter' && activeSugg >= 0) { e.preventDefault(); onSuggClick(suggestions[activeSugg]); }
    else if (e.key === 'Escape') { setShowSugg(false); setActiveSugg(-1); }
  };

  const applyFilter = (g: string[], f: string, s: string, y: string, so: string) => {
    setGenres(g); setFormat(f); setStatus(s); setYear(y); setSort(so);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    doSearch(query, g, f, s, y, so, 1, false);
    syncURL(query, g, f, s, y, so, 1);
  };

  const toggleGenre = (g: string) => {
    const next = genres.includes(g) ? genres.filter(x => x !== g) : [...genres, g];
    applyFilter(next, format, status, year, sort);
  };

  const goToPage = (pg: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    doSearch(query, genres, format, status, year, sort, pg, true);
    syncURL(query, genres, format, status, year, sort, pg);
  };

  const onQuickTag = (tag: string) => {
    setQuery(tag);
    setShowSugg(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    doSearch(tag, [], '', '', '', 'POPULARITY_DESC', 1, false);
    syncURL(tag, [], '', '', '', 'POPULARITY_DESC', 1);
  };

  const clearAllFilters = () => applyFilter([], '', '', '', 'POPULARITY_DESC');
  const activeFilterCount = [genres.length > 0, !!format, !!status, !!year, sort !== 'POPULARITY_DESC'].filter(Boolean).length;

  const getPageNums = () => {
    const max = 5;
    let start = Math.max(1, pageInfo.currentPage - 2);
    const end = Math.min(pageInfo.lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    const a: number[] = [];
    for (let i = start; i <= end; i++) a.push(i);
    return a;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#050716] pt-28 lg:pt-32 pb-24 relative overflow-hidden selection:bg-[#ff6400] selection:text-white">

      {/* Ambient decorative blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] bg-[#ff6400]/[0.04] blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-[15%] right-[-10%] w-[50%] h-[50%] bg-[#ff4dd2]/[0.03] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] left-[10%] w-[35%] h-[35%] bg-[#4d79ff]/[0.03] blur-[140px] rounded-full pointer-events-none" />

      {/* Soft loading bar at top */}
      <AnimatePresence>
        {softLoading && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff6400] via-[#ff4dd2] to-[#ff6400] z-[9999] origin-left"
          />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] relative z-10">

        {/* ─────────────── SEARCH BAR ─────────────── */}
        <div className="w-full max-w-4xl mx-auto mb-6 relative z-20" ref={containerRef}>

          {/* Glow effect behind input */}
          <div className={`absolute inset-0 rounded-[20px] transition-opacity duration-500 pointer-events-none ${inputFocused ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-r from-[#ff6400]/20 via-[#ff4dd2]/15 to-[#ff6400]/20 blur-xl" />
          </div>

          <form onSubmit={onSubmit} className="relative">
            <div className="flex items-center gap-2.5">

              {/* Input field */}
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
                  <Search size={20} strokeWidth={2.5} />
                </span>
                <input
                  ref={inputRef}
                  id="anime-search-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search anime… e.g. Naruto, Solo Leveling"
                  value={query}
                  onChange={e => onInputChange(e.target.value)}
                  onFocus={() => { setInputFocused(true); if (suggestions.length) setShowSugg(true); }}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={onKeyDown}
                  className="w-full bg-[#0d0e1f]/90 backdrop-blur-xl border-2 border-white/[0.08] text-white placeholder-gray-600 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#ff6400]/60 transition-all duration-300 text-sm md:text-base font-medium tracking-wide"
                />
                {query && (
                  <button type="button" onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#ff6400] transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-white/5" aria-label="Clear">
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Search button */}
              <button type="submit" className="hidden sm:flex items-center gap-2 px-6 py-4 bg-gradient-to-br from-[#ff6400] to-[#e85600] hover:from-[#ff7a1a] hover:to-[#ff6400] text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(255,100,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,100,0,0.5)] hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-wider whitespace-nowrap cursor-pointer">
                <Search size={16} strokeWidth={2.5} /> Search
              </button>

              {/* Filter toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(p => !p)}
                className={`relative flex items-center gap-1.5 px-4 py-4 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer border-2 whitespace-nowrap ${showFilters || activeFilterCount > 0 ? 'bg-[#ff4dd2]/15 border-[#ff4dd2]/40 text-[#ff4dd2]' : 'bg-[#0d0e1f]/90 border-white/[0.08] text-gray-400 hover:border-[#ff4dd2]/30 hover:text-[#ff4dd2]'}`}
              >
                <SlidersHorizontal size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-[#ff4dd2] text-white text-[10px] font-bold rounded-full shadow-[0_0_10px_rgba(255,77,210,0.6)]">{activeFilterCount}</span>}
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* ── Backdrop overlay when suggestions visible ── */}
            <AnimatePresence>
              {showSugg && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => { setShowSugg(false); setActiveSugg(-1); }}
                />
              )}
            </AnimatePresence>

            {/* ── Live Suggestions ── */}
            <AnimatePresence>
              {showSugg && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0c0d1e]/98 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.9)] z-50"
                >
                  {/* Header */}
                  <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-white/5">
                    <Sparkles size={12} className="text-[#ff6400]" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Quick Results</span>
                    {suggLoading && <div className="w-3 h-3 border-2 border-[#ff6400]/30 border-t-[#ff6400] rounded-full animate-spin ml-auto" />}
                  </div>

                  {suggestions.map((a, idx) => {
                    const t = a.title?.english || a.title?.romaji || 'Unknown';
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onSuggClick(a)}
                        onMouseEnter={() => setActiveSugg(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100 cursor-pointer ${activeSugg === idx ? 'bg-[#ff6400]/10' : 'hover:bg-white/[0.03]'}`}
                      >
                        <div className="w-9 h-13 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1b2e] border border-white/5">
                          {a.coverImage?.large && <Image src={a.coverImage.large} alt={t} width={36} height={52} className="object-cover w-full h-full" unoptimized />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{t}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.format && <span className="text-[10px] text-[#ff6400] uppercase font-bold tracking-wide">{a.format.replace('_', ' ')}</span>}
                            {a.seasonYear && <span className="text-[10px] text-gray-600">{a.seasonYear}</span>}
                            {a.averageScore && (
                              <span className="text-[10px] text-yellow-500/80 flex items-center gap-0.5">
                                <Star size={8} className="fill-yellow-500" />{(a.averageScore / 10).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-gray-700 flex-shrink-0" />
                      </button>
                    );
                  })}

                  {/* View all */}
                  {suggestions.length > 0 && (
                    <button type="submit" className="w-full px-4 py-3 text-center text-xs font-bold text-[#ff6400] hover:bg-[#ff6400]/10 transition-colors border-t border-white/5 cursor-pointer uppercase tracking-wider">
                      View all results for &quot;{query}&quot;
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* ── Quick Tags (when no query and no filters active) ── */}
          {!query && !activeFilterCount && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-2 mt-4 justify-center"
            >
              <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mr-1">Popular:</span>
              {QUICK_TAGS.map(tag => (
                <button key={tag} onClick={() => onQuickTag(tag)} className="px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[11px] text-gray-400 hover:border-[#ff6400]/40 hover:text-[#ff6400] hover:bg-[#ff6400]/5 transition-all cursor-pointer font-medium">
                  {tag}
                </button>
              ))}
            </motion.div>
          )}

          {/* ── Filter Panel ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-5 md:p-6 bg-[#0c0d1e]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl space-y-5">

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    {/* Format */}
                    <div>
                      <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2.5">Format</label>
                      <div className="flex flex-wrap gap-1.5">
                        {FORMATS.map(f => (
                          <button key={f} type="button" onClick={() => applyFilter(genres, format === f ? '' : f, status, year, sort)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer border ${format === f ? 'bg-[#ff6400] text-white border-[#ff6400] shadow-[0_0_12px_rgba(255,100,0,0.4)]' : 'bg-white/[0.03] text-gray-500 border-white/[0.08] hover:border-[#ff6400]/40 hover:text-[#ff6400]'}`}>{f}</button>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2.5">Status</label>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map(s => (
                          <button key={s.value} type="button" onClick={() => applyFilter(genres, format, status === s.value ? '' : s.value, year, sort)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer border ${status === s.value ? 'bg-[#ff4dd2] text-white border-[#ff4dd2] shadow-[0_0_12px_rgba(255,77,210,0.4)]' : 'bg-white/[0.03] text-gray-500 border-white/[0.08] hover:border-[#ff4dd2]/40 hover:text-[#ff4dd2]'}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2.5">Year</label>
                      <select value={year} onChange={e => applyFilter(genres, format, status, e.target.value, sort)} className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff6400]/50 transition-colors cursor-pointer appearance-none">
                        <option value="">Any Year</option>
                        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2.5">Sort By</label>
                      <select value={sort} onChange={e => applyFilter(genres, format, status, year, e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#ff6400]/50 transition-colors cursor-pointer appearance-none">
                        {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Genres */}
                  <div>
                    <label className="block text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-2.5">Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(g => (
                        <button key={g} type="button" onClick={() => toggleGenre(g)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${genres.includes(g) ? 'bg-[#ff4dd2] text-white border-[#ff4dd2] shadow-[0_0_10px_rgba(255,77,210,0.4)]' : 'bg-white/[0.03] text-gray-500 border-white/[0.08] hover:border-[#ff4dd2]/40 hover:text-[#ff4dd2]'}`}>{g}</button>
                      ))}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <div className="flex justify-end">
                      <button type="button" onClick={clearAllFilters} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#ff4dd2] transition-colors cursor-pointer font-medium">
                        <X size={13} strokeWidth={2.5} /> Clear all
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─────────────── HEADER / STATS ─────────────── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 max-w-[1600px]">
          <div>
            <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-widest uppercase flex items-center gap-3">
              {isSuggestion ? (
                <><TrendingUp size={28} className="text-[#ff6400]" />Trending Now</>
              ) : query ? 'Search Results' : 'Browse Anime'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm font-medium">
              {isSuggestion ? 'Start typing to search, or explore with filters' : query ? <>Showing results for <span className="text-[#ff6400] font-bold">&quot;{query}&quot;</span></> : 'Filtered results'}
            </p>
          </div>
          {!isSuggestion && !loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-gray-500 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 self-start sm:self-auto"
            >
              <Tv2 size={15} className="text-[#ff4dd2]" />
              <span className="text-white font-bold">{(pageInfo.total || results.length).toLocaleString()}</span>
              <span>anime found</span>
            </motion.div>
          )}
        </div>

        {/* ─────────────── RESULTS ─────────────── */}
        {loading ? (
          <SkeletonGrid />
        ) : hasError ? (
          <ErrorState 
            message="Failed to fetch search results. Please check your internet connection or server status and try again."
            onRetry={() => doSearch(query, genres, format, status, year, sort, pageInfo.currentPage, true)}
          />
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-5 mb-16">
              {results.map((anime, idx) => (
                <ResultCard key={anime.id} anime={anime} priority={idx < 8} index={idx} />
              ))}
            </div>

            {/* Pagination */}
            {!isSuggestion && pageInfo.lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {pageInfo.currentPage > 4 && (
                  <>
                    <button onClick={() => goToPage(1)} className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold bg-white/[0.03] text-gray-500 hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer">1</button>
                    <span className="text-gray-700 px-0.5">…</span>
                  </>
                )}
                {pageInfo.currentPage > 1 && (
                  <button onClick={() => goToPage(pageInfo.currentPage - 1)} className="flex items-center gap-1 px-4 py-2.5 bg-white/[0.03] hover:bg-[#ff6400] text-white rounded-xl font-bold border border-white/[0.08] hover:border-[#ff6400] transition-all cursor-pointer text-sm">
                    <ChevronLeft size={16} /> Prev
                  </button>
                )}
                {getPageNums().map(p => (
                  <button key={p} onClick={() => goToPage(p)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all text-sm cursor-pointer ${pageInfo.currentPage === p ? 'bg-[#ff6400] text-white shadow-[0_0_20px_rgba(255,100,0,0.4)] border border-[#ff6400]' : 'bg-white/[0.03] text-white hover:bg-white/[0.08] border border-white/[0.08]'}`}>{p}</button>
                ))}
                {pageInfo.hasNextPage && (
                  <button onClick={() => goToPage(pageInfo.currentPage + 1)} className="flex items-center gap-1 px-4 py-2.5 bg-white/[0.03] hover:bg-[#ff6400] text-white rounded-xl font-bold border border-white/[0.08] hover:border-[#ff6400] transition-all cursor-pointer text-sm">
                    Next <ChevronRight size={16} />
                  </button>
                )}
                {pageInfo.currentPage < pageInfo.lastPage - 3 && (
                  <>
                    <span className="text-gray-700 px-0.5">…</span>
                    <button onClick={() => goToPage(pageInfo.lastPage)} className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold bg-white/[0.03] text-gray-500 hover:bg-white/[0.08] border border-white/[0.08] transition-colors cursor-pointer">{pageInfo.lastPage}</button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ── */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 px-6 bg-white/[0.02] rounded-3xl border border-white/[0.06]"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <SearchX size={36} className="text-gray-700" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bebas text-white tracking-widest uppercase mb-3">No Results Found</h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-8">
              {query ? <>No anime matched <span className="text-[#ff6400] font-semibold">&quot;{query}&quot;</span>. Try a different search or explore popular titles below.</> : 'Try adjusting your filters or search for something specific.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {QUICK_TAGS.slice(0, 6).map(s => (
                <button key={s} onClick={() => onQuickTag(s)} className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-400 hover:border-[#ff6400]/40 hover:text-[#ff6400] hover:bg-[#ff6400]/5 transition-all cursor-pointer font-medium">{s}</button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
