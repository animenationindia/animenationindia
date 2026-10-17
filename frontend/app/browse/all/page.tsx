'use client';

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Loader2, SearchX, Layers } from 'lucide-react';
import AnimeCard from '../../../components/AnimeCard';
import ErrorState from '../../../components/ErrorState';
import BrowseFilterBar, { FilterState, DEFAULT_FILTERS } from '../../../components/BrowseFilterBar';

const ANILIST_API_URL = 'https://graphql.anilist.co';

function BrowseAllAnimeContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Initialize Filters from URL Search Params on mount ──
  const [filters, setFilters] = useState<FilterState>(() => ({
    search: searchParams.get('search') || searchParams.get('q') || '',
    genre: searchParams.get('genre') || '',
    year: searchParams.get('year') || '',
    season: searchParams.get('season') || '',
    format: searchParams.get('format') || 'ALL',
    status: searchParams.get('status') || '',
    minScore: searchParams.get('minScore') || '',
    length: searchParams.get('length') || '',
    sort: searchParams.get('sort') || 'POPULARITY_DESC',
  }));

  // Core list state
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFallbackMAL, setIsFallbackMAL] = useState(false);

  // ── Push updated filter state to URL query parameters silently without router reload ──
  const syncUrlParams = useCallback((newFilters: FilterState) => {
    const sp = new URLSearchParams();
    if (newFilters.search.trim()) sp.set('search', newFilters.search.trim());
    if (newFilters.genre) sp.set('genre', newFilters.genre);
    if (newFilters.year) sp.set('year', newFilters.year);
    if (newFilters.season) sp.set('season', newFilters.season);
    if (newFilters.format && newFilters.format !== 'ALL') sp.set('format', newFilters.format);
    if (newFilters.status) sp.set('status', newFilters.status);
    if (newFilters.minScore) sp.set('minScore', newFilters.minScore);
    if (newFilters.length) sp.set('length', newFilters.length);
    if (newFilters.sort && newFilters.sort !== 'POPULARITY_DESC') sp.set('sort', newFilters.sort);

    const queryStr = sp.toString();
    const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', targetUrl);
    }
  }, [pathname]);

  // Sync URL whenever filters change (debounced search already managed by BrowseFilterBar)
  useEffect(() => {
    syncUrlParams(filters);
  }, [filters, syncUrlParams]);

  // Handle browser Back / Forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      setFilters({
        search: sp.get('search') || sp.get('q') || '',
        genre: sp.get('genre') || '',
        year: sp.get('year') || '',
        season: sp.get('season') || '',
        format: sp.get('format') || 'ALL',
        status: sp.get('status') || '',
        minScore: sp.get('minScore') || '',
        length: sp.get('length') || '',
        sort: sp.get('sort') || 'POPULARITY_DESC',
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // ── Infinite Scroll Observer ──
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasNextPage]
  );

  // ── Master Fetch Function: AniList Primary with MAL Backup ──
  const fetchAnime = async (pageNum: number, currentFilters: FilterState, searchTerm: string) => {
    try {
      setHasError(false);
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const query = `
        query (
          $page: Int,
          $perPage: Int,
          $search: String,
          $genre: String,
          $seasonYear: Int,
          $season: MediaSeason,
          $format: MediaFormat,
          $status: MediaStatus,
          $averageScore_greater: Int,
          $episodes_greater: Int,
          $episodes_lesser: Int,
          $sort: [MediaSort]
        ) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              hasNextPage
              total
            }
            media(
              type: ANIME,
              search: $search,
              genre: $genre,
              seasonYear: $seasonYear,
              season: $season,
              format: $format,
              status: $status,
              averageScore_greater: $averageScore_greater,
              episodes_greater: $episodes_greater,
              episodes_lesser: $episodes_lesser,
              sort: $sort,
              isAdult: false
            ) {
              id
              idMal
              title {
                english
                romaji
              }
              coverImage {
                extraLarge
                large
              }
              format
              episodes
              status
              averageScore
              seasonYear
              genres
            }
          }
        }
      `;

      // Build variables matching active filters
      const variables: any = {
        page: pageNum,
        perPage: 24,
      };

      if (searchTerm.trim()) {
        variables.search = searchTerm.trim();
        // If searching and user hasn't explicitly changed sort, use SEARCH_MATCH
        variables.sort = currentFilters.sort === 'POPULARITY_DESC' ? ['SEARCH_MATCH'] : [currentFilters.sort];
      } else {
        variables.sort = [currentFilters.sort];
      }

      if (currentFilters.genre) variables.genre = currentFilters.genre;
      if (currentFilters.year) variables.seasonYear = parseInt(currentFilters.year, 10);
      if (currentFilters.season) variables.season = currentFilters.season;
      if (currentFilters.format && currentFilters.format !== 'ALL') variables.format = currentFilters.format;
      if (currentFilters.status) variables.status = currentFilters.status;
      if (currentFilters.minScore) variables.averageScore_greater = parseInt(currentFilters.minScore, 10);

      if (currentFilters.length === 'short') {
        variables.episodes_lesser = 13;
      } else if (currentFilters.length === 'medium') {
        variables.episodes_greater = 12;
        variables.episodes_lesser = 27;
      } else if (currentFilters.length === 'long') {
        variables.episodes_greater = 26;
      }

      let mediaItems: any[] = [];
      let hasNext = false;
      let usedMAL = false;

      // ── PRIMARY: AniList GraphQL via Proxy or Direct ──
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        let res = await fetch(`${backendUrl}/api/anilist/proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables }),
        }).catch(() => null);

        if (!res || !res.ok) {
          res = await fetch(ANILIST_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Origin: 'https://anilist.co',
              Referer: 'https://anilist.co/',
            },
            body: JSON.stringify({ query, variables }),
          }).catch(() => null);
        }

        if (res && res.ok) {
          const data = await res.json();
          if (data?.data?.Page?.media && Array.isArray(data.data.Page.media)) {
            mediaItems = data.data.Page.media;
            hasNext = Boolean(data.data.Page.pageInfo?.hasNextPage);
          }
        }
      } catch (aniErr) {
        console.warn('AniList query failed, switching to MyAnimeList backup:', aniErr);
      }

      // ── BACKUP: Official MyAnimeList (MAL v2 Proxy) ──
      if (mediaItems.length === 0) {
        try {
          usedMAL = true;
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
          const offset = (pageNum - 1) * 24;

          let malEndpoint = '';
          if (searchTerm.trim()) {
            malEndpoint = `/anime?q=${encodeURIComponent(searchTerm.trim())}&limit=24&offset=${offset}&fields=id,title,main_picture,mean,num_episodes,status,genres`;
          } else {
            const rankingType =
              currentFilters.format === 'MOVIE'
                ? 'movie'
                : currentFilters.format === 'TV'
                ? 'tv'
                : currentFilters.sort === 'SCORE_DESC'
                ? 'all'
                : 'bypopularity';
            malEndpoint = `/anime/ranking?ranking_type=${rankingType}&limit=24&offset=${offset}&fields=id,title,main_picture,mean,num_episodes,status,genres`;
          }

          const malRes = await fetch(`${backendUrl}/api/mal/proxy?endpoint=${encodeURIComponent(malEndpoint)}`);
          if (malRes.ok) {
            const malJson = await malRes.json();
            if (malJson?.data && Array.isArray(malJson.data)) {
              mediaItems = malJson.data.map((item: any) => {
                const node = item.node || item;
                return {
                  id: node.id,
                  idMal: node.id,
                  title: {
                    english: node.title,
                    romaji: node.title,
                  },
                  coverImage: {
                    extraLarge: node.main_picture?.large || node.main_picture?.medium,
                    large: node.main_picture?.large || node.main_picture?.medium,
                  },
                  genres: (node.genres || []).map((g: any) => g.name),
                  averageScore: node.mean ? Math.round(node.mean * 10) : null,
                  episodes: node.num_episodes || null,
                  format: currentFilters.format !== 'ALL' ? currentFilters.format : 'TV',
                  status: node.status === 'currently_airing' ? 'RELEASING' : 'FINISHED',
                };
              });
              hasNext = mediaItems.length >= 24;
            }
          }
        } catch (malErr) {
          console.warn('MAL backup failed:', malErr);
        }
      }

      // ── FALLBACK 3: Backend Curated Cache ──
      if (mediaItems.length === 0 && !searchTerm.trim() && pageNum === 1) {
        try {
          const sectionKey =
            currentFilters.format === 'TV' ? 'top_tv' : currentFilters.format === 'MOVIE' ? 'top_movies' : 'popular';
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
          const curRes = await fetch(`${backendUrl}/api/curated/${sectionKey}`);
          if (curRes.ok) {
            const curData = await curRes.json();
            if (curData.success && Array.isArray(curData.data) && curData.data.length > 0) {
              mediaItems = curData.data;
              hasNext = false;
            }
          }
        } catch {}
      }

      setIsFallbackMAL(usedMAL && mediaItems.length > 0);

      if (mediaItems.length > 0) {
        if (pageNum === 1) {
          setAnimeList(mediaItems);
        } else {
          setAnimeList((prev) => [...prev, ...mediaItems]);
        }
        setHasNextPage(hasNext);
      } else {
        if (pageNum === 1) {
          setAnimeList([]);
          setHasNextPage(false);
        }
      }
    } catch (error) {
      console.error('Error fetching browse anime:', error);
      if (pageNum === 1) setHasError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // ── Trigger fetch when any filter changes or search debounces ──
  useEffect(() => {
    setPage(1);
    setAnimeList([]);
    setHasNextPage(true);
    fetchAnime(1, filters, filters.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.search,
    filters.genre,
    filters.year,
    filters.season,
    filters.format,
    filters.status,
    filters.minScore,
    filters.length,
    filters.sort,
  ]);

  // ── Trigger fetch on page increment (infinite scroll) ──
  useEffect(() => {
    if (page > 1) {
      fetchAnime(page, filters, filters.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="w-full pb-16">
      {/* ── Otaku Insider Inspired Glassmorphic Filter Bar ── */}
      <BrowseFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        totalCount={animeList.length}
        isFallbackMAL={isFallbackMAL}
      />

      {/* ── Results Info Bar ── */}
      <div className="flex items-center justify-between text-xs text-zinc-400 mb-6 px-1">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-[#ff4dd2]" />
          <span>
            Showing <strong className="text-white font-bold">{animeList.length}</strong> anime titles
            {filters.search && (
              <span>
                {' '}
                for &ldquo;<span className="text-[#ff4dd2]">{filters.search}</span>&rdquo;
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── Main Anime Grid ── */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] w-full rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse overflow-hidden p-3 flex flex-col justify-end"
            >
              <div className="w-3/4 h-3.5 rounded bg-white/10 mb-2" />
              <div className="w-1/2 h-2.5 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : hasError ? (
        <div className="max-w-2xl mx-auto py-12">
          <ErrorState
            message="Failed to load anime catalog. AniList and backup servers are currently unreachable."
            onRetry={() => fetchAnime(1, filters, filters.search)}
          />
        </div>
      ) : animeList.length === 0 ? (
        <div className="text-center py-20 px-6 bg-zinc-900/40 rounded-3xl border border-white/10 shadow-2xl max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center mx-auto mb-4 text-[#ff4dd2]">
            <SearchX size={28} />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No Anime Found</h3>
          <p className="text-zinc-400 text-xs sm:text-sm mb-6 max-w-md mx-auto">
            We couldn&apos;t find any anime matching your current search or filter combination.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2.5 bg-[#ff4dd2] text-black font-extrabold text-xs rounded-xl uppercase tracking-wider hover:bg-[#ff7be0] transition-all cursor-pointer shadow-lg shadow-[#ff4dd2]/20 active:scale-95"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {animeList.map((anime, index) => {
              if (index === animeList.length - 1) {
                return (
                  <div ref={lastElementRef} key={`${anime.id}-${index}`}>
                    <AnimeCard anime={anime} />
                  </div>
                );
              }
              return <AnimeCard key={`${anime.id}-${index}`} anime={anime} />;
            })}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#ff4dd2] animate-spin" />
            </div>
          )}

          {!hasNextPage && !loading && animeList.length > 0 && (
            <div className="text-center text-zinc-500 py-10 text-xs font-semibold uppercase tracking-wider">
              ✦ End of results ✦
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BrowseAllAnimePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-10 h-10 text-[#ff4dd2] animate-spin" />
        </div>
      }
    >
      <BrowseAllAnimeContent />
    </Suspense>
  );
}
