'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BACKEND_URL } from '../lib/config';
import { logError } from '../lib/logger';

export interface WatchlistItem {
  anime_id?: number;
  mal_id?: number;
  anime_title?: string;
  title?: string;
  anime_image?: string;
  images?: any;
  status?: string;
  [key: string]: any;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  error: string | null;
  isInWatchlist: (animeId: number | string) => boolean;
  getItemStatus: (animeId: number | string) => string;
  addToWatchlist: (item: { animeId: number | string; title: string; image: string; status?: string; type?: string }) => Promise<boolean>;
  removeFromWatchlist: (animeId: number | string) => Promise<boolean>;
  toggleWatchlist: (item: { animeId: number | string; title: string; image: string }) => Promise<boolean>;
  refetchWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlist = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');

    if (!token || !userId) {
      setWatchlist([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlist(Array.isArray(data) ? data : []);
        setError(null);
      }
    } catch (err) {
      logError('WatchlistContext.fetchWatchlist', err);
      setError('Failed to load watchlist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();

    const handleAuthChange = () => fetchWatchlist();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [fetchWatchlist]);

  const isInWatchlist = useCallback(
    (animeId: number | string) => {
      const numId = Number(animeId);
      return watchlist.some((item) => Number(item.mal_id || item.anime_id) === numId);
    },
    [watchlist]
  );

  const getItemStatus = useCallback(
    (animeId: number | string) => {
      const numId = Number(animeId);
      const found = watchlist.find((item) => Number(item.mal_id || item.anime_id) === numId);
      return found?.status || 'ADD';
    },
    [watchlist]
  );

  const addToWatchlist = useCallback(
    async ({ animeId, title, image, status = 'PLAN_TO_WATCH', type = 'Anime' }: { animeId: number | string; title: string; image: string; status?: string; type?: string }) => {
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');

      if (!token || !userId) {
        return false;
      }

      const numId = Number(animeId);
      const previousWatchlist = [...watchlist];

      // Optimistic update
      const newItem: WatchlistItem = {
        mal_id: numId,
        anime_id: numId,
        title,
        anime_title: title,
        anime_image: image,
        status,
        type,
      };

      setWatchlist((prev) => {
        const filtered = prev.filter((item) => Number(item.mal_id || item.anime_id) !== numId);
        return [...filtered, newItem];
      });

      try {
        const animePayload = {
          mal_id: numId,
          title,
          title_english: title,
          type,
          images: { webp: { large_image_url: image } },
          anime_id: numId,
          anime_title: title,
          anime_image: image,
          status,
        };

        const res = await fetch(`${BACKEND_URL}/api/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({ anime: animePayload, userId }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to save watchlist item`);
        return true;
      } catch (err) {
        logError('WatchlistContext.addToWatchlist', err);
        // Rollback optimistic update on failure
        setWatchlist(previousWatchlist);
        return false;
      }
    },
    [watchlist]
  );

  const removeFromWatchlist = useCallback(
    async (animeId: number | string) => {
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');

      if (!token || !userId) return false;

      const numId = Number(animeId);
      const previousWatchlist = [...watchlist];

      // Optimistic update
      setWatchlist((prev) => prev.filter((item) => Number(item.mal_id || item.anime_id) !== numId));

      try {
        const res = await fetch(`${BACKEND_URL}/api/watchlist/${userId}/${numId}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + token },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to remove watchlist item`);
        return true;
      } catch (err) {
        logError('WatchlistContext.removeFromWatchlist', err);
        // Rollback optimistic update on failure
        setWatchlist(previousWatchlist);
        return false;
      }
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    async ({ animeId, title, image }: { animeId: number | string; title: string; image: string }) => {
      if (isInWatchlist(animeId)) {
        return removeFromWatchlist(animeId);
      } else {
        return addToWatchlist({ animeId, title, image });
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
        addToWatchlist,
        removeFromWatchlist,
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
