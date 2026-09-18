'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from '@/lib/auth-client';
import {
  getWatchlist,
  addToWatchlist as dbAddToWatchlist,
  removeFromWatchlist as dbRemoveFromWatchlist,
  updateWatchlistStatus as dbUpdateWatchlistStatus,
  updateWatchlistProgress as dbUpdateWatchlistProgress,
  syncGuestWatchlist,
  type WatchlistItem as DbWatchlistItem,
} from '@/app/actions/watchlist';
import {
  WATCHLIST_CHANGED_EVENT,
  dispatchWatchlistUpdated,
} from '@/lib/catalogs-shared';

export interface WatchlistItem {
  mediaId: string | number;
  anime_id?: number | string;
  mal_id?: number | string;
  id?: number | string;
  title: string;
  anime_title?: string;
  image?: string | null;
  posterPath?: string | null;
  anime_image?: string | null;
  backdropPath?: string | null;
  mediaType?: string;
  type?: string;
  rating?: string | null;
  year?: string | null;
  status?: string;
  progress?: number;
  createdAt?: string;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  error: string | null;
  isInWatchlist: (animeId: number | string) => boolean;
  getItemStatus: (animeId: number | string) => string;
  getItemProgress: (animeId: number | string) => number;
  addToWatchlist: (item: {
    animeId: number | string;
    title: string;
    image?: string | null;
    posterPath?: string | null;
    status?: string;
    type?: string;
    mediaType?: string;
    rating?: string | number | null;
    year?: string | number | null;
    progress?: number;
  }) => Promise<boolean>;
  removeFromWatchlist: (animeId: number | string, mediaType?: string) => Promise<boolean>;
  updateStatus: (animeId: number | string, status: string, mediaType?: string) => Promise<boolean>;
  updateProgress: (animeId: number | string, progress: number, mediaType?: string) => Promise<boolean>;
  toggleWatchlist: (item: { animeId: number | string; title: string; image?: string | null }) => Promise<boolean>;
  refetchWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setIsLoading(true);

    try {
      // 1. Load strictly from Neon PostgreSQL via Server Action for authenticated users
      const res = await getWatchlist();
      if (res?.success && Array.isArray(res.items)) {
        const formatted: WatchlistItem[] = res.items.map((r) => ({
          mediaId: String(r.mediaId),
          id: r.id || r.mediaId,
          anime_id: r.mediaId,
          mal_id: r.mediaId,
          title: r.title,
          anime_title: r.title,
          posterPath: r.posterPath,
          image: r.posterPath,
          anime_image: r.posterPath,
          backdropPath: r.backdropPath,
          mediaType: r.mediaType || 'anime',
          type: r.mediaType || 'anime',
          rating: r.rating,
          year: r.year,
          status: (r.status || 'plan_to_watch').toUpperCase(),
          progress: r.progress || 0,
          createdAt: r.createdAt,
        }));
        setWatchlist(formatted);
        setError(null);
        return;
      }

      // Guest / Unauthenticated: empty list
      setWatchlist([]);
      setError(null);
    } catch (err: any) {
      console.warn('Watchlist fetch notice:', err?.message || err);
      setWatchlist([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and sync on session change
  useEffect(() => {
    fetchWatchlist();

    const handleSync = () => fetchWatchlist();
    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [fetchWatchlist, session?.user?.id]);

  const isInWatchlist = useCallback(
    (animeId: number | string) => {
      const strId = String(animeId);
      return watchlist.some(
        (item) => String(item.mediaId || item.mal_id || item.anime_id || item.id) === strId
      );
    },
    [watchlist]
  );

  const getItemStatus = useCallback(
    (animeId: number | string) => {
      const strId = String(animeId);
      const found = watchlist.find(
        (item) => String(item.mediaId || item.mal_id || item.anime_id || item.id) === strId
      );
      return found?.status ? found.status.toUpperCase() : 'ADD';
    },
    [watchlist]
  );

  const getItemProgress = useCallback(
    (animeId: number | string) => {
      const strId = String(animeId);
      const found = watchlist.find(
        (item) => String(item.mediaId || item.mal_id || item.anime_id || item.id) === strId
      );
      return found?.progress || 0;
    },
    [watchlist]
  );

  const addToWatchlist = useCallback(
    async ({
      animeId,
      title,
      image,
      posterPath,
      status = 'PLAN_TO_WATCH',
      type = 'anime',
      mediaType,
      rating,
      year,
      progress = 0,
    }: {
      animeId: number | string;
      title: string;
      image?: string | null;
      posterPath?: string | null;
      status?: string;
      type?: string;
      mediaType?: string;
      rating?: string | number | null;
      year?: string | number | null;
      progress?: number;
    }) => {
      const strId = String(animeId);
      const mType = (mediaType || type || 'anime').toLowerCase();
      const normStatus = status.toUpperCase();
      const poster = posterPath || image || null;

      try {
        const res = await dbAddToWatchlist({
          mediaId: strId,
          mediaType: mType,
          title,
          posterPath: poster,
          status: normStatus.toLowerCase(),
          rating: rating ? String(rating) : null,
          year: year ? String(year) : null,
          progress,
        });

        if (!res?.success) {
          // Guest mode disabled: Prompt login
          if (typeof window !== 'undefined') {
            window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          }
          return false;
        }

        const newItem: WatchlistItem = {
          mediaId: strId,
          id: strId,
          anime_id: strId,
          mal_id: strId,
          title,
          anime_title: title,
          posterPath: poster,
          image: poster,
          anime_image: poster,
          status: normStatus,
          mediaType: mType,
          type: mType,
          rating: rating ? String(rating) : null,
          year: year ? String(year) : null,
          progress,
        };

        setWatchlist((prev) => {
          const filtered = prev.filter(
            (item) => String(item.mediaId || item.mal_id || item.anime_id || item.id) !== strId
          );
          return [newItem, ...filtered];
        });

        dispatchWatchlistUpdated();
        return true;
      } catch (e) {
        if (typeof window !== 'undefined') {
          window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        }
        return false;
      }
    },
    []
  );

  const removeFromWatchlist = useCallback(
    async (animeId: number | string, mediaType: string = 'anime') => {
      const strId = String(animeId);

      try {
        const res = await dbRemoveFromWatchlist(strId, mediaType.toLowerCase());
        if (!res?.success) {
          if (typeof window !== 'undefined') {
            window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          }
          return false;
        }

        setWatchlist((prev) =>
          prev.filter(
            (item) => String(item.mediaId || item.mal_id || item.anime_id || item.id) !== strId
          )
        );

        dispatchWatchlistUpdated(strId);
        return true;
      } catch (e) {
        return false;
      }
    },
    []
  );

  const updateStatus = useCallback(
    async (animeId: number | string, status: string, mediaType: string = 'anime') => {
      const strId = String(animeId);
      const normStatus = status.toUpperCase();

      try {
        const res = await dbUpdateWatchlistStatus(strId, mediaType.toLowerCase(), normStatus.toLowerCase());
        if (!res?.success) {
          if (typeof window !== 'undefined') {
            window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          }
          return false;
        }

        setWatchlist((prev) =>
          prev.map((item) => {
            if (String(item.mediaId || item.mal_id || item.anime_id || item.id) === strId) {
              return { ...item, status: normStatus };
            }
            return item;
          })
        );

        dispatchWatchlistUpdated();
        return true;
      } catch (e) {
        return false;
      }
    },
    []
  );

  const updateProgress = useCallback(
    async (animeId: number | string, progress: number, mediaType: string = 'anime') => {
      const strId = String(animeId);
      const validProgress = Math.max(0, Math.floor(progress));

      try {
        const res = await dbUpdateWatchlistProgress(strId, mediaType.toLowerCase(), validProgress);
        if (!res?.success) {
          if (typeof window !== 'undefined') {
            window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          }
          return false;
        }

        setWatchlist((prev) =>
          prev.map((item) => {
            if (String(item.mediaId || item.mal_id || item.anime_id || item.id) === strId) {
              return { ...item, progress: validProgress };
            }
            return item;
          })
        );

        dispatchWatchlistUpdated();
        return true;
      } catch (e) {
        return false;
      }
    },
    []
  );

  const toggleWatchlist = useCallback(
    async ({ animeId, title, image }: { animeId: number | string; title: string; image?: string | null }) => {
      if (isInWatchlist(animeId)) {
        return removeFromWatchlist(animeId);
      } else {
        return addToWatchlist({ animeId, title, image, status: 'PLAN_TO_WATCH' });
      }
    },
    [isInWatchlist, removeFromWatchlist, addToWatchlist]
  );

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        error,
        isInWatchlist,
        getItemStatus,
        getItemProgress,
        addToWatchlist,
        removeFromWatchlist,
        updateStatus,
        updateProgress,
        toggleWatchlist,
        refetchWatchlist: fetchWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
