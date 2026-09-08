/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Play, X, Search, ArrowRight, Loader2, Sparkles, Film, ExternalLink } from 'lucide-react';

interface TrailerItem {
  id: number | string;
  title: {
    romaji?: string;
    english?: string;
  };
  trailer: {
    id: string;
    site: string;
    thumbnail?: string;
  };
  status?: string;
  coverImage?: {
    large?: string;
    medium?: string;
  };
}

const CURATED_FALLBACK_TRAILERS: TrailerItem[] = [
  {
    id: 38000,
    title: { english: 'Demon Slayer: Kimetsu no Yaiba - Infinity Castle Arc', romaji: 'Kimetsu no Yaiba: Mugen Jou-hen' },
    trailer: { id: 'VQGCKyvzIM4', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/VQGCKyvzIM4/hqdefault.jpg' },
    status: 'NOT_YET_RELEASED'
  },
  {
    id: 52299,
    title: { english: 'Solo Leveling Season 2: -Arise from the Shadow-', romaji: 'Ore dake Level Up na Ken Season 2' },
    trailer: { id: 'gFl_P6d7q5M', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/gFl_P6d7q5M/hqdefault.jpg' },
    status: 'RELEASING'
  },
  {
    id: 40748,
    title: { english: 'Jujutsu Kaisen Season 2 (Shibuya Incident)', romaji: 'Jujutsu Kaisen 2nd Season' },
    trailer: { id: 'O6qVieflwqs', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/O6qVieflwqs/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 41467,
    title: { english: 'Bleach: Thousand-Year Blood War - The Conflict', romaji: 'Bleach: Sennen Kessen-hen' },
    trailer: { id: 'e8YBesRKq_U', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/e8YBesRKq_U/hqdefault.jpg' },
    status: 'RELEASING'
  },
  {
    id: 52991,
    title: { english: "Frieren: Beyond Journey's End", romaji: 'Sousou no Frieren' },
    trailer: { id: 'qgQunxD0qMo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/qgQunxD0qMo/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 52588,
    title: { english: 'Kaiju No. 8', romaji: 'Kaijuu 8-gou' },
    trailer: { id: 'c3ISn_k_bZ8', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/c3ISn_k_bZ8/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 50265,
    title: { english: 'Spy x Family Code: White', romaji: 'Spy x Family Movie' },
    trailer: { id: 'ofXigq9aIpo', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/ofXigq9aIpo/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 44511,
    title: { english: 'Chainsaw Man Movie: Reze Arc', romaji: 'Chainsaw Man: Reze-hen' },
    trailer: { id: 'v4yLeNt-kCU', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/v4yLeNt-kCU/hqdefault.jpg' },
    status: 'NOT_YET_RELEASED'
  },
  {
    id: 56845,
    title: { english: 'Dandadan', romaji: 'Dandadan' },
    trailer: { id: 'oG43m3J5-dM', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/oG43m3J5-dM/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 21,
    title: { english: 'One Piece: Egghead Island Arc', romaji: 'One Piece' },
    trailer: { id: 'm47h2-i27g4', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/m47h2-i27g4/hqdefault.jpg' },
    status: 'RELEASING'
  },
  {
    id: 47778,
    title: { english: 'Blue Lock vs. U-20 Japan', romaji: 'Blue Lock 2nd Season' },
    trailer: { id: 'V7Z5K6i4Xbg', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/V7Z5K6i4Xbg/hqdefault.jpg' },
    status: 'FINISHED'
  },
  {
    id: 49838,
    title: { english: "Hell's Paradise", romaji: 'Jigokuraku' },
    trailer: { id: 'X5iN6zPj5u8', site: 'youtube', thumbnail: 'https://i.ytimg.com/vi/X5iN6zPj5u8/hqdefault.jpg' },
    status: 'FINISHED'
  }
];

export default function TrailersPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'airing' | 'upcoming'>('all');
  
  const [gridTrailers, setGridTrailers] = useState<TrailerItem[]>([]);
  const [dropdownTrailers, setDropdownTrailers] = useState<TrailerItem[]>([]);
  
  const [isGridLoading, setIsGridLoading] = useState(true);
  const [isDropdownLoading, setIsDropdownLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [selectedTrailer, setSelectedTrailer] = useState<TrailerItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [lastPage, setLastPage] = useState(5);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTrailer(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Multi-tier Initial Fetching
  useEffect(() => {
    let isMounted = true;

    const fetchTrailersWithFallbacks = async () => {
      setIsGridLoading(true);

      // Tier 1: AniList GraphQL
      const graphqlQuery = `
        query ($page: Int) {
          Page(page: $page, perPage: 40) {
            pageInfo { hasNextPage lastPage }
            media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
              id
              title { romaji english }
              trailer { id site thumbnail }
              status
              coverImage { large medium }
            }
          }
        }
      `;

      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphqlQuery, variables: { page } }),
        });

        if (res.ok) {
          const json = await res.json();
          const media = json?.data?.Page?.media;
          const pageInfo = json?.data?.Page?.pageInfo;

          if (media && Array.isArray(media)) {
            const animeWithTrailers = media.filter((a: any) => a.trailer && a.trailer.site === 'youtube');
            if (animeWithTrailers.length > 0 && isMounted) {
              setGridTrailers(animeWithTrailers);
              if (pageInfo?.lastPage) setLastPage(Math.min(pageInfo.lastPage, 10));
              setIsGridLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[Trailers] AniList primary fetch failed, falling back to Jikan:', err);
      }

      // Tier 2: Jikan Fallback
      try {
        const jikanRes = await fetch(`https://api.jikan.moe/v4/seasons/now?page=${page}&limit=25`);
        if (jikanRes.ok) {
          const jikanJson = await jikanRes.json();
          const list = jikanJson.data || [];
          const jikanTrailers: TrailerItem[] = list
            .filter((a: any) => a.trailer?.youtube_id)
            .map((a: any) => ({
              id: a.mal_id,
              title: { english: a.title_english || a.title, romaji: a.title },
              trailer: {
                id: a.trailer.youtube_id,
                site: 'youtube',
                thumbnail: a.trailer.images?.maximum_image_url || a.trailer.images?.large_image_url || `https://i.ytimg.com/vi/${a.trailer.youtube_id}/hqdefault.jpg`,
              },
              status: a.status === 'Currently Airing' ? 'RELEASING' : a.status === 'Not yet aired' ? 'NOT_YET_RELEASED' : 'FINISHED',
              coverImage: { large: a.images?.webp?.large_image_url || a.images?.jpg?.large_image_url },
            }));

          if (jikanTrailers.length > 0 && isMounted) {
            setGridTrailers(jikanTrailers);
            setIsGridLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[Trailers] Jikan fallback failed, trying TMDB API:', err);
      }

      // Tier 3: Internal TMDB Route Fallback
      try {
        const tmdbRes = await fetch('/api/trailers?limit=20');
        if (tmdbRes.ok) {
          const tmdbJson = await tmdbRes.json();
          if (tmdbJson.trailers && tmdbJson.trailers.length > 0 && isMounted) {
            setGridTrailers(tmdbJson.trailers);
            setIsGridLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('[Trailers] TMDB fallback failed, falling back to curated list:', err);
      }

      // Tier 4: Hard Fallback Curated HD list
      if (isMounted) {
        setGridTrailers(CURATED_FALLBACK_TRAILERS);
        setIsGridLoading(false);
      }
    };

    fetchTrailersWithFallbacks();

    return () => {
      isMounted = false;
    };
  }, [page]);

  // Live Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setDropdownTrailers([]);
      setIsDropdownLoading(false);
      return;
    }

    let isMounted = true;
    const fetchSearchTrailers = async () => {
      setIsDropdownLoading(true);

      const graphqlQuery = `
        query ($search: String) {
          Page(page: 1, perPage: 25) {
            media(sort: SEARCH_MATCH, type: ANIME, isAdult: false, search: $search) {
              id
              title { romaji english }
              trailer { id site thumbnail }
              status
              coverImage { large }
            }
          }
        }
      `;

      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: graphqlQuery, variables: { search: query } }),
        });

        if (res.ok) {
          const data = await res.json();
          const media = data?.data?.Page?.media;
          if (media && isMounted) {
            const animeWithTrailers = media.filter((a: any) => a.trailer && a.trailer.site === 'youtube');
            if (animeWithTrailers.length > 0) {
              setDropdownTrailers(animeWithTrailers);
              setIsDropdownLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[Trailers] Live search AniList error, searching local cache:', err);
      }

      // Fallback Search in active grid / curated list
      if (isMounted) {
        const q = query.toLowerCase();
        const pool = [...gridTrailers, ...CURATED_FALLBACK_TRAILERS];
        const localMatches = pool.filter((item) => {
          const t = `${item.title?.english || ''} ${item.title?.romaji || ''}`.toLowerCase();
          return t.includes(q);
        });
        setDropdownTrailers(localMatches);
        setIsDropdownLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchTrailers();
    }, 280);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [query, gridTrailers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
  };

  const formatStatus = (status?: string) => {
    if (!status) return 'Official';
    if (status === 'RELEASING') return 'Airing';
    if (status === 'NOT_YET_RELEASED') return 'Upcoming';
    if (status === 'FINISHED') return 'Completed';
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Filtered Grid
  const displayedTrailers = useMemo(() => {
    if (filter === 'all') return gridTrailers;
    if (filter === 'airing') return gridTrailers.filter((t) => t.status === 'RELEASING');
    if (filter === 'upcoming') return gridTrailers.filter((t) => t.status === 'NOT_YET_RELEASED');
    return gridTrailers;
  }, [gridTrailers, filter]);

  return (
    <div className="bg-[#050716] min-h-screen pt-28 lg:pt-32 pb-16 relative">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#ff4dd2]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-96 h-96 bg-[#00f7ff]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Official Anime Trailers & Teasers HD | Anime Nation India',
            description: 'Watch the latest official anime trailers, seasonal teasers, and high-definition preview clips straight from Japan.',
            url: 'https://animenationindia.com/trailers',
            publisher: {
              '@type': 'Organization',
              name: 'Anime Nation India',
              url: 'https://animenationindia.com',
            },
          }),
        }}
      />

      <div className="container mx-auto px-4 lg:px-12 max-w-[1600px] relative z-10">
        {/* Header & Live Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ff4dd2] font-semibold mb-2">
              <Film size={15} />
              <span>Official Video Highlights</span>
              <Sparkles size={14} className="text-[#00f7ff]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bebas text-white tracking-wider uppercase">
              Official Anime <span className="text-[#ff4dd2] drop-shadow-[0_0_15px_rgba(255,77,210,0.6)]">Trailers</span>
            </h1>
            <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base mt-2">
              Watch official HD teasers, seasonal trailers, and sneak peeks straight from Japanese animation studios.
            </p>
          </div>

          {/* Search Input with Cyberpunk styling */}
          <div className="w-full md:w-[500px] relative" ref={dropdownRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-[#0d0f1f]/90 border border-white/10 rounded-full overflow-hidden focus-within:border-[#ff4dd2] focus-within:shadow-[0_0_20px_rgba(255,77,210,0.3)] transition-all shadow-xl"
            >
              <Search className="absolute left-4 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search trailers by anime name..."
                value={query}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-transparent text-white py-3 pl-12 pr-28 focus:outline-none placeholder:text-gray-500 font-medium text-sm md:text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setShowDropdown(false);
                  }}
                  className="absolute right-24 text-gray-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#ff4dd2] hover:bg-[#ff2bb5] text-white font-bold text-xs md:text-sm px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(255,77,210,0.4)] cursor-pointer"
              >
                <span>Search</span>
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Live Search Dropdown */}
            {showDropdown && query.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-[#0c0e1e] border border-[#ff4dd2]/30 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.9)] max-h-[60vh] overflow-y-auto z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                {isDropdownLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ff4dd2]" />
                  </div>
                ) : dropdownTrailers.length > 0 ? (
                  <div className="flex flex-col divide-y divide-white/5">
                    {dropdownTrailers.map((anime) => {
                      const title = anime.title?.english || anime.title?.romaji || 'Anime Trailer';
                      const thumb =
                        anime.trailer?.thumbnail ||
                        anime.coverImage?.large ||
                        `https://i.ytimg.com/vi/${anime.trailer.id}/hqdefault.jpg`;

                      return (
                        <div
                          key={`drop-${anime.id}-${anime.trailer.id}`}
                          className="flex items-center gap-4 p-3.5 hover:bg-[#161a33] cursor-pointer transition-colors group"
                          onClick={() => {
                            setSelectedTrailer(anime);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="relative w-16 h-10 rounded-md overflow-hidden flex-shrink-0 bg-black/50">
                            <img src={thumb} alt={title} loading="lazy" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-[#ff4dd2]/30 transition-colors flex items-center justify-center">
                              <Play size={14} className="text-white fill-white" />
                            </div>
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <h4 className="text-white font-semibold text-sm truncate group-hover:text-[#ff4dd2] transition-colors">
                              {title}
                            </h4>
                            <span className="text-[11px] text-[#a0a0a0] flex items-center gap-2">
                              <span>Status: {formatStatus(anime.status)}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No trailers found for "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.5)]'
                : 'bg-white/5 text-[#a0a0a0] hover:text-white hover:bg-white/10'
            }`}
          >
            All Trailers ({gridTrailers.length})
          </button>
          <button
            onClick={() => setFilter('airing')}
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              filter === 'airing'
                ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.5)]'
                : 'bg-white/5 text-[#a0a0a0] hover:text-white hover:bg-white/10'
            }`}
          >
            Currently Airing
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.5)]'
                : 'bg-white/5 text-[#a0a0a0] hover:text-white hover:bg-white/10'
            }`}
          >
            Upcoming Anticipated
          </button>
        </div>

        {/* Loading State */}
        {isGridLoading && (
          <div className="flex flex-col items-center justify-center py-28">
            <Loader2 className="w-12 h-12 animate-spin text-[#ff4dd2] mb-4" />
            <p className="text-gray-400 font-medium">Fetching high definition official trailers...</p>
          </div>
        )}

        {/* Trailers Grid */}
        {!isGridLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedTrailers.map((anime, idx) => {
              const title = anime.title?.english || anime.title?.romaji || 'Official Anime Trailer';
              const thumbnailUrl =
                anime.trailer?.thumbnail ||
                `https://i.ytimg.com/vi/${anime.trailer?.id}/hqdefault.jpg`;

              return (
                <div
                  key={`grid-${anime.id}-${anime.trailer?.id || idx}`}
                  className="group relative rounded-xl overflow-hidden bg-[#0a0c1a] border border-white/5 hover:border-[#ff4dd2]/60 hover:shadow-[0_0_25px_rgba(255,77,210,0.25)] transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => setSelectedTrailer(anime)}
                >
                  {/* Thumbnail & Overlay */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    <img
                      src={thumbnailUrl}
                      alt={title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-[#ff4dd2] group-hover:border-[#ff4dd2] transition-all shadow-lg">
                        <Play size={20} className="ml-1 fill-white" />
                      </div>
                    </div>

                    {/* Status Badge */}
                    {anime.status && (
                      <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[#00f7ff]">
                        {formatStatus(anime.status)}
                      </span>
                    )}

                    {/* YouTube HD Badge */}
                    <span className="absolute bottom-3 right-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-red-600/90 text-white shadow">
                      HD Trailer
                    </span>
                  </div>

                  {/* Card Bottom Details */}
                  <div className="p-4 flex flex-col flex-1 justify-between bg-gradient-to-b from-[#0a0c1a] to-[#0d1024]">
                    <div>
                      <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 group-hover:text-[#ff4dd2] transition-colors">
                        {title}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-[#a0a0a0]">
                      <span className="group-hover:text-white transition-colors">Click to Watch</span>
                      <span className="text-[#ff4dd2] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Play Video <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty Search / Filter */}
        {!isGridLoading && displayedTrailers.length === 0 && (
          <div className="text-center py-24 bg-white/5 rounded-2xl border border-white/10 mt-6">
            <Film size={40} className="text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Trailers Found</h3>
            <p className="text-[#a0a0a0] text-sm mb-4">Try switching your filter or clearing your search term.</p>
            <button
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
              className="px-5 py-2 bg-[#ff4dd2] text-white font-semibold text-sm rounded-full hover:bg-[#ff2bb5] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {lastPage > 1 && !isGridLoading && (
          <div className="flex justify-center items-center gap-2 mt-14 flex-wrap">
            {page > 1 && (
              <button
                onClick={() => {
                  setPage(page - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 text-sm bg-[#121528] text-[#a0a0a0] rounded-lg hover:bg-[#ff4dd2] hover:text-white transition-colors cursor-pointer"
              >
                Previous
              </button>
            )}

            {Array.from({ length: Math.min(lastPage, 6) }, (_, i) => i + 1).map((p) => (
              <button
                key={`page-${p}`}
                onClick={() => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer font-medium ${
                  p === page
                    ? 'bg-[#ff4dd2] text-white shadow-[0_0_12px_rgba(255,77,210,0.5)]'
                    : 'bg-[#121528] text-[#a0a0a0] hover:bg-white/10 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}

            {page < lastPage && (
              <button
                onClick={() => {
                  setPage(page + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 text-sm bg-[#121528] text-[#a0a0a0] rounded-lg hover:bg-[#ff4dd2] hover:text-white transition-colors cursor-pointer"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>

      {/* Classy Video Modal */}
      {selectedTrailer && selectedTrailer.trailer?.id && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedTrailer(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-[#0a0c18] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(255,77,210,0.25)] border border-[#ff4dd2]/30 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-[#0e1124] border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff4dd2] animate-pulse" />
                <h3 className="text-white font-bold text-base md:text-lg truncate">
                  {selectedTrailer.title?.english || selectedTrailer.title?.romaji || 'Official Anime Trailer'}
                </h3>
              </div>
              <button
                aria-label="Close modal"
                onClick={() => setSelectedTrailer(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-[#ff4dd2] text-white transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Video Player (16:9) */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${selectedTrailer.trailer.id}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedTrailer.title?.english || 'Anime Trailer'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Modal Footer with Direct Series Link */}
            <div className="p-4 bg-[#0a0c18] flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-[#a0a0a0]">
                Official YouTube Embed Player • High Definition 1080p
              </span>
              <Link
                href={`/series/${selectedTrailer.id}`}
                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-[#ff4dd2] hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-[#ff4dd2]/10 hover:bg-[#ff4dd2] border border-[#ff4dd2]/30"
              >
                <span>View Anime Details</span>
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
