'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, SlidersHorizontal, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Star, SearchX, Tv2, Bookmark, Check, Play, BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '../lib/config';


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
const STATUSES = [{ label: 'Airing', value: 'RELEASING' }, { label: 'Finished', value: 'FINISHED' }, { label: 'Upcoming', value: 'NOT_YET_RELEASED' }];
const SORTS = [{ label: 'Popularity', value: 'POPULARITY_DESC' }, { label: 'Top Rated', value: 'SCORE_DESC' }, { label: 'Trending', value: 'TRENDING_DESC' }, { label: 'Newest', value: 'START_DATE_DESC' }, { label: 'Oldest', value: 'START_DATE' }];
const GENRES = ['Action','Adventure','Comedy','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller','Mecha','Music','Psychological','Historical','Ecchi','Isekai'];
const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CUR_YEAR - 1989 }, (_, i) => CUR_YEAR - i);

function formatBadgeColor(f: string | null) {
  switch ((f || '').toUpperCase()) {
    case 'TV': return 'bg-blue-500/25 text-blue-300';
    case 'MOVIE': return 'bg-yellow-500/25 text-yellow-300';
    case 'OVA': return 'bg-green-500/25 text-green-300';
    case 'ONA': return 'bg-purple-500/25 text-purple-300';
    case 'SPECIAL': return 'bg-pink-500/25 text-pink-300';
    default: return 'bg-white/10 text-gray-400';
  }
}

// ─── AniList API helpers ──────────────────────────────────────────────────────
async function fetchAniList(query: string, variables: Record<string, unknown>) {
  const res = await fetch(ANILIST, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error('AniList error');
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'AniList error');
  return json.data;
}

const SEARCH_QUERY = `
  query ($search: String, $page: Int, $format: MediaFormat, $status: MediaStatus, $seasonYear: Int, $genres: [String], $sort: [MediaSort]) {
    Page(page: $page, perPage: 24) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(
        ${/* dynamic: only set search if provided */''}
        type: ANIME, isAdult: false
        sort: $sort
        format: $format
        status: $status
        seasonYear: $seasonYear
        genre_in: $genres
      ) {
        id idMal title { english romaji } coverImage { large extraLarge }
        averageScore format status episodes seasonYear startDate { year }
        genres description
      }
    }
  }
`;

const SEARCH_QUERY_WITH_TEXT = `
  query ($search: String, $page: Int, $format: MediaFormat, $status: MediaStatus, $seasonYear: Int, $genres: [String], $sort: [MediaSort]) {
    Page(page: $page, perPage: 24) {
      pageInfo { total currentPage lastPage hasNextPage }
      media(
        search: $search
        type: ANIME, isAdult: false
        sort: $sort
        format: $format
        status: $status
        seasonYear: $seasonYear
        genre_in: $genres
      ) {
        id idMal title { english romaji } coverImage { large extraLarge }
        averageScore format status episodes seasonYear startDate { year }
        genres description
      }
    }
  }
`;

const SUGGESTION_QUERY = `
  query ($search: String) {
    Page(page: 1, perPage: 7) {
      media(search: $search, type: ANIME, isAdult: false, sort: POPULARITY_DESC) {
        id idMal title { english romaji } coverImage { large } format seasonYear
      }
    }
  }
`;

const TOP_QUERY = `
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2.5 animate-pulse">
          <div className="w-full aspect-[2/3] rounded-xl bg-gradient-to-b from-[#1a1b2e] to-[#0d0e1f]" />
          <div className="h-3 rounded-full bg-[#1a1b2e] w-4/5" />
          <div className="h-2.5 rounded-full bg-[#1a1b2e] w-2/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Mini Anime Card (Search Result) ─────────────────────────────────────────
let wlCache: unknown[] | null = null;
let wlCachePromise: Promise<unknown[]> | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('auth-change', () => { wlCache = null; wlCachePromise = null; });
}

function AnimeResultCard({ anime, priority = false }: { anime: AnimeMedia; priority?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const title = anime.title?.english || anime.title?.romaji || 'Unknown';
  const linkId = anime.idMal || anime.id;
  const isManga = anime.type === 'MANGA' || anime.format === 'MANGA' || anime.format === 'NOVEL';
  const cover = anime.coverImage?.extraLarge || anime.coverImage?.large || '';
  const desc = (anime.description || '').replace(/<[^>]+>/g, '');
  const year = anime.seasonYear || anime.startDate?.year;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    const checkWL = async () => {
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');
      if (!token || !userId) return;
      try {
        if (!wlCache && !wlCachePromise) {
          wlCachePromise = fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
            headers: { Authorization: 'Bearer ' + token },
          }).then(r => r.ok ? r.json() : []).then(d => { wlCache = d; return d; }).catch(() => []);
        }
        const list = (wlCache || await wlCachePromise) as {mal_id?: number; anime_id?: number}[];
        if (list.some(item => Number(item.mal_id || item.anime_id) === Number(linkId))) setSaved(true);
      } catch { /* ignore */ }
    };
    checkWL();
    return () => cancelAnimationFrame(frame);
  }, [linkId]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    if (!token || !userId) { alert('Please login first!'); router.push('/auth'); return; }
    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        const payload = { mal_id: Number(linkId), title, title_english: title, type: isManga ? 'Manga' : 'Anime', images: { webp: { large_image_url: cover } }, score: anime.averageScore ? anime.averageScore / 10 : null, anime_id: Number(linkId), anime_title: title, anime_image: cover, status: 'PLAN_TO_WATCH' };
        await fetch(`${BACKEND_URL}/api/watchlist`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ anime: payload, userId }) });
        if (wlCache) (wlCache as unknown[]).push(payload);
      } else {
        await fetch(`${BACKEND_URL}/api/watchlist/${userId}/${linkId}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
        if (wlCache) wlCache = (wlCache as {mal_id?: number; anime_id?: number}[]).filter(item => Number(item.mal_id || item.anime_id) !== Number(linkId));
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
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="group relative w-full flex flex-col cursor-pointer"
    >
      <Link href={isManga ? `/manga/${linkId}` : `/series/${linkId}`} prefetch={false} className="block relative">
        {/* Image */}
        <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#0d0e1f] rounded-xl border border-[#ff4dd2]/15 group-hover:border-[#ff4dd2]/40 group-hover:shadow-[0_0_20px_rgba(255,77,210,0.25)] transition-all duration-300">
          {cover && (
            <Image src={cover} alt={title} fill priority={priority} sizes="(max-width:640px)50vw,(max-width:1024px)25vw,15vw" className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
          )}

          {/* Score badge */}
          {anime.averageScore && (
            <div className="absolute top-2 left-2 z-20 flex items-center gap-0.5 bg-black/75 backdrop-blur-sm rounded-md px-1.5 py-0.5 pointer-events-none">
              <Star size={9} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-bold text-white">{(anime.averageScore / 10).toFixed(1)}</span>
            </div>
          )}

          {/* Format badge */}
          {anime.format && (
            <div className={`absolute top-2 right-2 z-20 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider pointer-events-none ${formatBadgeColor(anime.format)}`}>
              {anime.format.replace('_', ' ')}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-[#121326]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2 md:p-3 backdrop-blur-[2px]">
            <div />
            <div className="flex flex-col items-center justify-center flex-1 gap-2">
              <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 border-[#ff4dd2] bg-[#050716]/60 text-[#ff4dd2] group-hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(255,77,210,0.5)]">
                {isManga ? <BookOpen size={22} className="stroke-[2.5px]" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </div>
              <span className="text-[10px] md:text-xs font-bold text-[#ff4dd2] uppercase tracking-wider">{isManga ? 'READ NOW' : 'WATCH NOW'}</span>
            </div>
            {desc && <p className="text-[10px] leading-tight line-clamp-3 text-gray-300">{desc}</p>}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#050716] to-transparent pointer-events-none" />
          </div>

          {/* Watchlist btn */}
          <div className={`absolute top-8 right-2 z-30 transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button onClick={toggleSave} className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors backdrop-blur-md ${saved ? 'bg-[#ff4dd2] text-white' : 'bg-[#050716]/80 hover:bg-[#ff4dd2] text-white border border-[#ff4dd2]/50'}`}>
              {saved ? <Check size={14} /> : <Bookmark size={14} />}
            </button>
          </div>
        </div>

        {/* Text info */}
        <div className="mt-2.5 flex flex-col px-0.5">
          <h3 className="text-white text-[13px] font-semibold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors">{title}</h3>
          <div className="text-[11px] text-[#ff4dd2] mt-1 flex items-center gap-1 font-medium opacity-80 capitalize">
            {anime.format?.toLowerCase().replace('_', ' ')}
            {year && <span className="text-[#a0a0a0]">• {year}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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

  // ── Input & suggestions state ──
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<AnimeMedia[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggLoading, setSuggLoading] = useState(false);
  const [activeSugg, setActiveSugg] = useState(-1);

  // ── Filter state ──
  const [showFilters, setShowFilters] = useState(!!(initialGenres || initialFormat || initialStatus || initialYear));
  const [genres, setGenres] = useState<string[]>(initialGenres ? initialGenres.split(',') : []);
  const [format, setFormat] = useState(initialFormat);
  const [status, setStatus] = useState(initialStatus);
  const [year, setYear] = useState(initialYear);
  const [sort, setSort] = useState(initialSort || 'POPULARITY_DESC');

  // ── Results state ──
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({ total: 0, currentPage: initialPage, lastPage: 1, hasNextPage: false });
  const [loading, setLoading] = useState(true);
  const [isSuggestion, setIsSuggestion] = useState(false);

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Update browser URL silently (no Next.js re-render) ──
  const updateURL = useCallback((q: string, g: string[], f: string, s: string, y: string, so: string, page: number) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (g.length) params.set('genres', g.join(','));
    if (f) params.set('format', f);
    if (s) params.set('status', s);
    if (y) params.set('year', y);
    if (so && so !== 'POPULARITY_DESC') params.set('sort', so);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    window.history.replaceState({}, '', `/search${qs ? '?' + qs : ''}`);
  }, []);

  // ── Core fetch function ──
  const fetchResults = useCallback(async (q: string, g: string[], f: string, s: string, y: string, so: string, page: number) => {
    setLoading(true);
    setShowSuggestions(false);
    try {
      const hasAnyFilter = q.trim() || g.length || f || s || y;
      if (!hasAnyFilter) {
        // Show trending as suggestions
        const data = await fetchAniList(TOP_QUERY, {});
        setResults(data.Page.media || []);
        setPageInfo(data.Page.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false });
        setIsSuggestion(true);
      } else {
        const vars: Record<string, unknown> = {
          page,
          sort: [so],
          format: f || undefined,
          status: s || undefined,
          seasonYear: y ? parseInt(y) : undefined,
          genres: g.length ? g : undefined,
        };
        const gql = q.trim() ? SEARCH_QUERY_WITH_TEXT : SEARCH_QUERY;
        if (q.trim()) vars.search = q.trim();
        const data = await fetchAniList(gql, vars);
        setResults(data.Page.media || []);
        setPageInfo(data.Page.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false });
        setIsSuggestion(false);
      }
    } catch {
      setResults([]);
      setIsSuggestion(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    fetchResults(initialQuery, initialGenres ? initialGenres.split(',') : [], initialFormat, initialStatus, initialYear, initialSort || 'POPULARITY_DESC', initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close suggestion on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false); setActiveSugg(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Live suggestions (debounced 350ms) ──
  const fetchSuggestions = useCallback((q: string) => {
    if (suggDebounce.current) clearTimeout(suggDebounce.current);
    if (!q.trim() || q.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    setSuggLoading(true);
    suggDebounce.current = setTimeout(async () => {
      try {
        const data = await fetchAniList(SUGGESTION_QUERY, { search: q.trim() });
        const items = data.Page.media || [];
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch { setSuggestions([]); } finally { setSuggLoading(false); }
    }, 350);
  }, []);

  // ── Debounced search trigger (750ms) ──
  const triggerSearch = useCallback((q: string, g: string[], f: string, s: string, y: string, so: string, page = 1) => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchResults(q, g, f, s, y, so, page);
      updateURL(q, g, f, s, y, so, page);
    }, 750);
  }, [fetchResults, updateURL]);

  // ── Handlers ──
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setActiveSugg(-1);
    fetchSuggestions(val);
    triggerSearch(val, genres, format, status, year, sort, 1);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]); setShowSuggestions(false);
    fetchResults('', genres, format, status, year, sort, 1);
    updateURL('', genres, format, status, year, sort, 1);
  };

  const handleSuggestionClick = (anime: AnimeMedia) => {
    const t = anime.title?.english || anime.title?.romaji || '';
    setQuery(t);
    setShowSuggestions(false); setActiveSugg(-1);
    fetchResults(t, genres, format, status, year, sort, 1);
    updateURL(t, genres, format, status, year, sort, 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSugg(p => Math.min(p + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSugg(p => Math.max(p - 1, -1)); }
    else if (e.key === 'Enter' && activeSugg >= 0) { e.preventDefault(); handleSuggestionClick(suggestions[activeSugg]); }
    else if (e.key === 'Escape') { setShowSuggestions(false); setActiveSugg(-1); }
  };

  const handleFilterChange = (g: string[], f: string, s: string, y: string, so: string) => {
    setGenres(g); setFormat(f); setStatus(s); setYear(y); setSort(so);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    fetchResults(query, g, f, s, y, so, 1);
    updateURL(query, g, f, s, y, so, 1);
  };

  const toggleGenre = (g: string) => {
    const next = genres.includes(g) ? genres.filter(x => x !== g) : [...genres, g];
    handleFilterChange(next, format, status, year, sort);
  };

  const handlePage = (p: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchResults(query, genres, format, status, year, sort, p);
    updateURL(query, genres, format, status, year, sort, p);
  };

  const clearFilters = () => handleFilterChange([], '', '', '', 'POPULARITY_DESC');

  const activeFilterCount = [genres.length > 0, !!format, !!status, !!year, sort !== 'POPULARITY_DESC'].filter(Boolean).length;

  // ── Pagination helpers ──
  const getPageNums = () => {
    const max = 5;
    let start = Math.max(1, pageInfo.currentPage - 2);
    const end = Math.min(pageInfo.lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-24 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff6400]/5 blur-[160px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[65%] h-[45%] bg-[#ff4dd2]/4 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-[5%] right-[-5%] w-[30%] h-[30%] bg-[#4d79ff]/4 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] relative z-10">

        {/* ── Search Bar ── */}
        <div className="w-full max-w-5xl mx-auto mb-8 relative z-20" ref={containerRef}>
          <form onSubmit={e => { e.preventDefault(); if (searchDebounce.current) clearTimeout(searchDebounce.current); fetchResults(query, genres, format, status, year, sort, 1); updateURL(query, genres, format, status, year, sort, 1); setShowSuggestions(false); }}>
            <div className="flex items-center gap-2">
              {/* Input */}
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                  {loading ? <div className="w-5 h-5 border-2 border-[#ff6400]/40 border-t-[#ff6400] rounded-full animate-spin" /> : <Search size={20} />}
                </span>
                <input
                  ref={inputRef}
                  id="anime-search-input"
                  type="text"
                  autoComplete="off"
                  placeholder="Search anime… e.g. Naruto, Solo Leveling, Attack on Titan"
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-[#121326]/60 backdrop-blur-md border border-[#ff6400]/30 text-white placeholder-gray-500 rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-[#ff6400] focus:shadow-[0_0_30px_rgba(255,100,0,0.2)] transition-all duration-300 text-sm md:text-base"
                />
                {query && (
                  <button type="button" onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff6400] transition-colors p-1 cursor-pointer">
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Search button */}
              <button type="submit" className="hidden sm:flex items-center gap-2 px-5 py-3.5 bg-[#ff6400] hover:bg-[#ff8533] text-white font-extrabold rounded-2xl transition-all duration-300 shadow-[0_4px_15px_rgba(255,100,0,0.35)] hover:shadow-[0_4px_25px_rgba(255,100,0,0.55)] text-sm uppercase tracking-wider whitespace-nowrap cursor-pointer">
                <Search size={16} /> Search
              </button>

              {/* Filter toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(p => !p)}
                className={`relative flex items-center gap-1.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 cursor-pointer border whitespace-nowrap ${showFilters || activeFilterCount > 0 ? 'bg-[#ff4dd2]/20 border-[#ff4dd2]/50 text-[#ff4dd2] shadow-[0_0_15px_rgba(255,77,210,0.2)]' : 'bg-[#121326]/60 border-white/10 text-gray-300 hover:border-[#ff4dd2]/40 hover:text-[#ff4dd2]'}`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-[#ff4dd2] text-white text-[10px] font-bold rounded-full">{activeFilterCount}</span>}
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {/* ── Live Suggestions ── */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0e0f20]/97 backdrop-blur-2xl border border-[#ff6400]/20 rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-50"
                >
                  {suggLoading && !suggestions.length ? (
                    <div className="flex items-center gap-3 px-4 py-4 text-gray-400 text-sm">
                      <div className="w-4 h-4 border-2 border-[#ff6400]/40 border-t-[#ff6400] rounded-full animate-spin" /> Searching…
                    </div>
                  ) : suggestions.map((a, idx) => {
                    const t = a.title?.english || a.title?.romaji || 'Unknown';
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleSuggestionClick(a)}
                        onMouseEnter={() => setActiveSugg(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 cursor-pointer border-l-2 ${activeSugg === idx ? 'bg-[#ff6400]/15 border-[#ff6400]' : 'border-transparent hover:bg-white/5'}`}
                      >
                        <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1b2e]">
                          {a.coverImage?.large && <Image src={a.coverImage.large} alt={t} width={40} height={56} className="object-cover w-full h-full" unoptimized />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{t}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.format && <span className="text-[10px] text-[#ff6400] uppercase font-bold">{a.format.replace('_', ' ')}</span>}
                            {a.seasonYear && <span className="text-[10px] text-gray-500">{a.seasonYear}</span>}
                          </div>
                        </div>
                        <Search size={13} className="text-gray-600 flex-shrink-0" />
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* ── Filter Panel ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 md:p-5 bg-[#0e0f20]/90 backdrop-blur-xl border border-white/8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Format */}
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Format</label>
                      <div className="flex flex-wrap gap-1.5">
                        {FORMATS.map(f => (
                          <button key={f} type="button" onClick={() => handleFilterChange(genres, format === f ? '' : f, status, year, sort)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${format === f ? 'bg-[#ff6400] text-white shadow-[0_0_10px_rgba(255,100,0,0.4)]' : 'bg-[#1a1b2e] text-gray-400 hover:bg-[#ff6400]/20 hover:text-[#ff6400] border border-white/8'}`}>{f}</button>
                        ))}
                      </div>
                    </div>
                    {/* Status */}
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Status</label>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map(s => (
                          <button key={s.value} type="button" onClick={() => handleFilterChange(genres, format, status === s.value ? '' : s.value, year, sort)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${status === s.value ? 'bg-[#ff4dd2] text-white shadow-[0_0_10px_rgba(255,77,210,0.4)]' : 'bg-[#1a1b2e] text-gray-400 hover:bg-[#ff4dd2]/20 hover:text-[#ff4dd2] border border-white/8'}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                    {/* Year */}
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Year</label>
                      <select value={year} onChange={e => handleFilterChange(genres, format, status, e.target.value, sort)} className="w-full bg-[#1a1b2e] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff6400] transition-colors cursor-pointer">
                        <option value="">Any Year</option>
                        {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>
                    {/* Sort */}
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Sort By</label>
                      <select value={sort} onChange={e => handleFilterChange(genres, format, status, year, e.target.value)} className="w-full bg-[#1a1b2e] border border-white/8 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#ff6400] transition-colors cursor-pointer">
                        {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Genres */}
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Genres</label>
                    <div className="flex flex-wrap gap-1.5">
                      {GENRES.map(g => (
                        <button key={g} type="button" onClick={() => toggleGenre(g)} className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${genres.includes(g) ? 'bg-[#ff4dd2] text-white shadow-[0_0_8px_rgba(255,77,210,0.5)]' : 'bg-[#1a1b2e] text-gray-400 hover:bg-[#ff4dd2]/20 hover:text-[#ff4dd2] border border-white/8'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <div className="flex justify-end pt-1">
                      <button type="button" onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ff4dd2] transition-colors cursor-pointer">
                        <X size={12} /> Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Header / Stats ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-5xl font-bebas text-white tracking-widest uppercase">
              {isSuggestion ? 'Trending Now' : query ? 'Search Results' : 'Browse Anime'}
            </h1>
            <p className="text-gray-400 mt-1.5 text-sm font-medium">
              {isSuggestion ? 'Start typing to search, or use filters to explore' : query ? <>Results for <span className="text-[#ff6400] font-bold">"{query}"</span></> : 'Filtered results'}
            </p>
          </div>
          {!isSuggestion && !loading && results.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#121326]/60 border border-white/8 rounded-xl px-4 py-2 self-start sm:self-auto">
              <Tv2 size={15} className="text-[#ff4dd2]" />
              {pageInfo.total ? <><span className="text-white font-bold">{pageInfo.total.toLocaleString()}</span> found</> : <><span className="text-white font-bold">{results.length}</span> results</>}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <SkeletonGrid />
        ) : results.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6 mb-16">
              {results.map((anime, idx) => (
                <AnimeResultCard key={anime.id} anime={anime} priority={idx < 8} />
              ))}
            </div>

            {/* ── Pagination ── */}
            {!isSuggestion && pageInfo.lastPage > 1 && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {pageInfo.currentPage > 4 && <>
                  <button onClick={() => handlePage(1)} className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold bg-[#121326]/80 text-gray-400 hover:bg-[#333] border border-white/5 transition-colors cursor-pointer">1</button>
                  <span className="text-gray-600">…</span>
                </>}
                {pageInfo.currentPage > 1 && (
                  <button onClick={() => handlePage(pageInfo.currentPage - 1)} className="flex items-center gap-1 px-4 py-2.5 bg-[#121326]/80 hover:bg-[#ff6400] text-white rounded-xl font-bold border border-white/5 transition-colors cursor-pointer">
                    <ChevronLeft size={16} /> Prev
                  </button>
                )}
                {getPageNums().map(p => (
                  <button key={p} onClick={() => handlePage(p)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all text-sm cursor-pointer ${pageInfo.currentPage === p ? 'bg-[#ff6400] text-white shadow-[0_0_15px_rgba(255,100,0,0.4)]' : 'bg-[#121326]/80 text-white hover:bg-[#333] border border-white/5'}`}>{p}</button>
                ))}
                {pageInfo.hasNextPage && (
                  <button onClick={() => handlePage(pageInfo.currentPage + 1)} className="flex items-center gap-1 px-4 py-2.5 bg-[#121326]/80 hover:bg-[#ff6400] text-white rounded-xl font-bold border border-white/5 transition-colors cursor-pointer">
                    Next <ChevronRight size={16} />
                  </button>
                )}
                {pageInfo.currentPage < pageInfo.lastPage - 3 && <>
                  <span className="text-gray-600">…</span>
                  <button onClick={() => handlePage(pageInfo.lastPage)} className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold bg-[#121326]/80 text-gray-400 hover:bg-[#333] border border-white/5 transition-colors cursor-pointer">{pageInfo.lastPage}</button>
                </>}
              </div>
            )}
          </>
        ) : (
          /* ── Empty State ── */
          <div className="text-center py-24 px-4 bg-[#0d0e1f]/60 rounded-3xl border border-white/5">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-[#1a1b2e] flex items-center justify-center">
                <SearchX size={36} className="text-gray-600" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bebas text-white tracking-widest uppercase mb-2">No Results Found</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-8">
              {query ? <>No anime matched <span className="text-[#ff6400] font-semibold">"{query}"</span>. Try a different spelling or explore below.</> : 'Try adjusting your filters.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Naruto', 'One Piece', 'Attack on Titan', 'Demon Slayer', 'Solo Leveling', 'Bleach'].map(s => (
                <button key={s} onClick={() => { setQuery(s); fetchResults(s, [], '', '', '', 'POPULARITY_DESC', 1); updateURL(s, [], '', '', '', 'POPULARITY_DESC', 1); }} className="px-4 py-2 bg-[#1a1b2e] border border-white/8 rounded-xl text-sm text-gray-300 hover:border-[#ff6400]/50 hover:text-[#ff6400] transition-all cursor-pointer">{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
