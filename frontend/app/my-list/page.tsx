'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  Folder,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
  Clapperboard,
  Search,
  Star,
  X,
  Play,
  Film,
  Tv,
  Sparkles,
  Flame,
  Heart,
  ChevronDown,
  BookOpen,
  Check,
  FolderPlus,
  Layers,
  ArrowRight,
  LayoutGrid,
  List,
  Minus,
  CheckCircle2,
  Clock,
  Ban,
  MoveRight,
  Music2,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import MusicVaultExplorer from '@/components/MusicVaultExplorer';
import { getUserMusicPlaylists } from '@/app/actions/music';
import {
  MusicPlaylistData,
  DEFAULT_MUSIC_PLAYLISTS,
  MUSIC_PLAYLISTS_CHANGED_EVENT,
} from '@/lib/music-shared';
import {
  getWatchlist,
  removeFromWatchlist,
  syncGuestWatchlist,
  updateWatchlistStatus,
  updateWatchlistProgress,
  getCurrentAuthUser,
  type WatchlistItem
} from '@/app/actions/watchlist';
import {
  getUserCatalogs,
  saveUserCatalog,
  deleteUserCatalog,
  getUserReactions,
  toggleUserReaction,
  removeUserReaction,
} from '@/app/actions/catalogs';
import {
  type CatalogData,
  DEFAULT_USER_CATALOGS,
  mergeWithDefaultCatalogs,
  CATALOGS_CHANGED_EVENT,
  WATCHLIST_CHANGED_EVENT,
  dispatchCatalogsUpdated,
  dispatchWatchlistUpdated,
} from '@/lib/catalogs-shared';

export type CatalogColor = 'pink' | 'purple' | 'emerald' | 'cyan' | 'amber' | 'rose';
export type CatalogThumbnail = 'Folder' | 'Sparkles' | 'BookOpen' | 'Film' | 'Tv' | 'Flame' | 'Star' | 'Heart' | 'Clapperboard' | 'Eye' | 'ThumbsUp' | 'ThumbsDown' | 'Ban';

export type MediaTypeFilter = 'all' | 'anime' | 'manga' | 'manhwa' | 'novel';

export const MEDIA_TYPE_TABS: Array<{ key: MediaTypeFilter; label: string }> = [
  { key: 'all', label: 'ALL' },
  { key: 'anime', label: 'ANIME' },
  { key: 'manga', label: 'MANGA' },
  { key: 'manhwa', label: 'MANHWA' },
  { key: 'novel', label: 'LIGHT NOVEL' },
];

export function getMediaBadgeInfo(mediaType?: string) {
  const m = (mediaType || 'anime').toLowerCase();
  if (['novel', 'light novel', 'lightnovel', 'webnovel'].includes(m)) {
    return { label: 'NOVEL', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  }
  if (['manhwa', 'webtoon'].includes(m)) {
    return { label: 'MANHWA', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
  }
  if (['manga', 'manhua', 'doujinshi', 'one shot', 'one_shot'].includes(m)) {
    return { label: 'MANGA', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  }
  if (m === 'movie') {
    return { label: 'MOVIE', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  }
  return { label: 'ANIME', badge: 'bg-[#ff4dd2]/20 text-[#ff4dd2] border-[#ff4dd2]/40' };
}

const PRESET_LIST: Array<{ name: string; color: CatalogColor; thumbnail: CatalogThumbnail }> = [
  { name: 'Anime Vault', color: 'purple', thumbnail: 'Sparkles' },
  { name: 'Manga Reading List', color: 'emerald', thumbnail: 'BookOpen' },
  { name: 'Manhwa & Webtoons', color: 'cyan', thumbnail: 'Flame' },
  { name: 'Light Novel Archive', color: 'amber', thumbnail: 'BookOpen' },
  { name: 'All-Time Masterpieces', color: 'amber', thumbnail: 'Star' },
  { name: 'Top Shounen Picks', color: 'pink', thumbnail: 'Flame' },
  { name: 'Late Night Binge', color: 'rose', thumbnail: 'Film' },
];

const THUMBNAIL_ICONS: Record<CatalogThumbnail, any> = {
  Folder,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  Flame,
  Star,
  Heart,
  Clapperboard,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Ban,
};

export type StatusFilterType = 'all' | 'watching' | 'plan_to_watch' | 'completed' | 'on_hold' | 'dropped';

export const STATUS_CONFIG: Record<
  string,
  { label: string; bookLabel: string; dot: string; color: string; badge: string; bg: string }
> = {
  watching: {
    label: 'Watching',
    bookLabel: 'Reading',
    dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
    bg: 'hover:bg-emerald-500/10',
  },
  plan_to_watch: {
    label: 'Plan to Watch',
    bookLabel: 'Plan to Read',
    dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
    color: 'text-sky-400',
    badge: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
    bg: 'hover:bg-sky-500/10',
  },
  completed: {
    label: 'Completed',
    bookLabel: 'Completed',
    dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]',
    color: 'text-purple-400',
    badge: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
    bg: 'hover:bg-purple-500/10',
  },
  on_hold: {
    label: 'On Hold',
    bookLabel: 'On Hold',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    color: 'text-amber-400',
    badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    bg: 'hover:bg-amber-500/10',
  },
  dropped: {
    label: 'Dropped',
    bookLabel: 'Dropped',
    dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]',
    color: 'text-rose-400',
    badge: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
    bg: 'hover:bg-rose-500/10',
  },
};

export default function MyListPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [authLoaded, setAuthLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeCatalog, setActiveCatalog] = useState<string>('watchlist');
  const [catalogs, setCatalogs] = useState<CatalogData[]>(() => mergeWithDefaultCatalogs());
  const [isEditing, setIsEditing] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<CatalogData | null>(null);

  const handleSelectSpecialFolder = (folderKey: 'watchlist' | 'watched' | 'liked' | 'disliked') => {
    if (!isAuthenticated) {
      router.push(`/signin?callbackUrl=${encodeURIComponent('/my-list')}`);
      return;
    }
    setActiveCatalog(folderKey);
  };

  // Edit Catalog Form State
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<CatalogColor>('pink');
  const [editThumbnail, setEditThumbnail] = useState<CatalogThumbnail>('Folder');
  const [thumbnailDropdownOpen, setThumbnailDropdownOpen] = useState(false);

  // Filters & Views
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [sortFilter, setSortFilter] = useState<'latest' | 'top_rated' | 'unwatched'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Interactive Card Dropdown state
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);

  // Watched / Liked / Disliked state
  const [watchedIds, setWatchedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [dislikedIds, setDislikedIds] = useState<string[]>([]);

  // Music Playlists state (Neon DB sync)
  const [musicPlaylists, setMusicPlaylists] = useState<MusicPlaylistData[]>(DEFAULT_MUSIC_PLAYLISTS);

  const totalMusicTracks = useMemo(() => {
    const ids = new Set<string>();
    musicPlaylists.forEach((p) => p.tracks.forEach((t) => ids.add(String(t.id))));
    return ids.size;
  }, [musicPlaylists]);

  // 🌟 Senior Multi-Tier Auth Resolution (Better-Auth + Neon Server Session Token + Local Storage Fallback)
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      // 1. Better-Auth client hook
      if (session?.user?.id) {
        if (isMounted) {
          setCurrentUser(session.user);
          setAuthLoaded(true);
        }
        return;
      }

      // 2. Direct server verification (Neon DB cookies & session table)
      try {
        const sUser = await getCurrentAuthUser();
        if (sUser && isMounted) {
          setCurrentUser(sUser);
          setAuthLoaded(true);
          return;
        }
      } catch {}

      // 3. Client localStorage check
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('user_id');
        const token = localStorage.getItem('user_token') || localStorage.getItem('token');
        const userName = localStorage.getItem('user_name') || localStorage.getItem('username');
        const userEmail = localStorage.getItem('user_email') || localStorage.getItem('email');
        if (userId && (token || userId.startsWith('usr_'))) {
          if (isMounted) {
            setCurrentUser({
              id: userId,
              name: userName || 'Otaku Member',
              email: userEmail || '',
            });
            setAuthLoaded(true);
          }
          return;
        }
      }

      if (isMounted) {
        setCurrentUser(null);
        setAuthLoaded(true);
      }
    };

    verifyAuth();

    const handleAuthChange = () => verifyAuth();
    window.addEventListener('auth-change', handleAuthChange);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [session?.user]);

  const isAuthenticated = Boolean(currentUser?.id || session?.user?.id);

  // 1. SWR Data from Database
  const { data: watchlistData, mutate: mutateWatchlist } = useSWR(
    isAuthenticated ? 'animenation_watchlist' : null,
    () => getWatchlist()
  );

  const { data: dbCatalogsData, mutate: mutateCatalogs } = useSWR(
    isAuthenticated ? 'animenation_catalogs' : null,
    () => getUserCatalogs()
  );

  const { data: dbReactionsData, mutate: mutateReactions } = useSWR(
    isAuthenticated ? 'animenation_reactions' : null,
    () => getUserReactions()
  );

  // Reload local storage helper
  const reloadLocalStorage = useCallback(() => {
    try {
      const savedCats = localStorage.getItem('animenation_catalogs');
      if (savedCats) {
        setCatalogs(mergeWithDefaultCatalogs(JSON.parse(savedCats)));
      } else {
        setCatalogs(mergeWithDefaultCatalogs());
      }

      const savedWatched = localStorage.getItem('animenation_watched');
      if (savedWatched) setWatchedIds(JSON.parse(savedWatched));
      const savedLiked = localStorage.getItem('animenation_liked');
      if (savedLiked) setLikedIds(JSON.parse(savedLiked));
      const savedDisliked = localStorage.getItem('animenation_disliked');
      if (savedDisliked) setDislikedIds(JSON.parse(savedDisliked));
    } catch {}
  }, []);

  // Sync DB catalogs to local state when authenticated
  useEffect(() => {
    if (dbCatalogsData?.catalogs && dbCatalogsData.catalogs.length > 0) {
      const merged = mergeWithDefaultCatalogs(dbCatalogsData.catalogs);
      setCatalogs(merged);
      try {
        localStorage.setItem('animenation_catalogs', JSON.stringify(merged));
      } catch {}
    } else {
      reloadLocalStorage();
    }
  }, [dbCatalogsData, reloadLocalStorage]);

  // Sync DB reactions
  useEffect(() => {
    if (dbReactionsData?.authenticated) {
      setWatchedIds(dbReactionsData.watchedIds);
      setLikedIds(dbReactionsData.likedIds);
      setDislikedIds(dbReactionsData.dislikedIds);
    } else {
      reloadLocalStorage();
    }
  }, [dbReactionsData, reloadLocalStorage]);

  // Listen to real-time events across the app
  useEffect(() => {
    const handleCatalogsChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCatalogs(mergeWithDefaultCatalogs(e.detail));
      } else {
        reloadLocalStorage();
      }
      if (isAuthenticated) mutateCatalogs();
    };

    const handleWatchlistChanged = (e: any) => {
      const removedId: string | undefined = e?.detail?.removedId;
      if (removedId) {
        // Instant optimistic remove — no refetch needed
        mutateWatchlist(
          (prev: any) => ({
            ...(prev || {}),
            items: (prev?.items || []).filter(
              (item: any) => String(item.mediaId ?? item.id ?? item.anime_id) !== removedId
            ),
            success: true,
          }),
          false
        );
        // Background revalidate to stay in sync with DB
        if (isAuthenticated) setTimeout(() => mutateWatchlist(), 1500);
      } else {
        reloadLocalStorage();
        if (isAuthenticated) mutateWatchlist();
      }
    };

    window.addEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged);
    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged);

    return () => {
      window.removeEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged);
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged);
    };
  }, [isAuthenticated, mutateCatalogs, mutateWatchlist, reloadLocalStorage]);

  // Close card popups on outside click
  useEffect(() => {
    const handleWindowClick = () => {
      setOpenStatusMenuId(null);
      setOpenFolderMenuId(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Sync Music Playlists with Neon DB
  useEffect(() => {
    if (!isAuthenticated) return;
    getUserMusicPlaylists().then((res) => {
      if (res.playlists && res.playlists.length > 0) {
        setMusicPlaylists(res.playlists);
      }
    });

    const handleMusicSync = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setMusicPlaylists(e.detail);
      } else {
        getUserMusicPlaylists().then((res) => {
          if (res.playlists && res.playlists.length > 0) {
            setMusicPlaylists(res.playlists);
          }
        });
      }
    };

    window.addEventListener(MUSIC_PLAYLISTS_CHANGED_EVENT, handleMusicSync);
    return () => window.removeEventListener(MUSIC_PLAYLISTS_CHANGED_EVENT, handleMusicSync);
  }, [isAuthenticated]);

  // Compute Active Items
  const rawItems: WatchlistItem[] = watchlistData?.items ?? [];

  // Filter items according to active catalog or special reaction folder
  const currentCatalogObj: CatalogData = useMemo(() => {
    if (activeCatalog === 'music_hub') {
      return {
        id: 'music_hub',
        name: 'Music Playlists',
        color: 'purple',
        thumbnail: 'Sparkles' as any,
        itemIds: [],
      };
    }
    if (activeCatalog === 'liked') {
      return {
        id: 'liked',
        name: 'Liked Titles',
        color: 'pink',
        thumbnail: 'Heart',
        itemIds: likedIds,
      };
    }
    if (activeCatalog === 'disliked') {
      return {
        id: 'disliked',
        name: 'Disliked Titles',
        color: 'rose',
        thumbnail: 'Ban',
        itemIds: dislikedIds,
      };
    }
    if (activeCatalog === 'watched') {
      return {
        id: 'watched',
        name: 'Watched & Read Titles',
        color: 'emerald',
        thumbnail: 'Eye' as any,
        itemIds: watchedIds,
      };
    }
    return catalogs.find((c) => c.id === activeCatalog) || catalogs[0];
  }, [activeCatalog, catalogs, likedIds, dislikedIds, watchedIds]);

  const baseFolderItems = useMemo(() => {
    if (activeCatalog === 'watchlist') {
      return rawItems;
    }
    if (activeCatalog === 'liked') {
      return rawItems.filter((item) => {
        const id = String(item.mediaId || (item as any).id);
        return likedIds.map(String).includes(id);
      });
    }
    if (activeCatalog === 'disliked') {
      return rawItems.filter((item) => {
        const id = String(item.mediaId || (item as any).id);
        return dislikedIds.map(String).includes(id);
      });
    }
    if (activeCatalog === 'watched') {
      return rawItems.filter((item) => {
        const id = String(item.mediaId || (item as any).id);
        return watchedIds.map(String).includes(id) || (item.status || '').toLowerCase() === 'completed';
      });
    }
    return rawItems.filter((item) => {
      const id = String(item.mediaId || (item as any).id);
      return currentCatalogObj.itemIds?.map(String).includes(id);
    });
  }, [rawItems, activeCatalog, currentCatalogObj, likedIds, dislikedIds, watchedIds]);

  // Compute status counts for the current folder
  const statusCounts = useMemo(() => {
    let counts = {
      all: baseFolderItems.length,
      watching: 0,
      plan_to_watch: 0,
      completed: 0,
      on_hold: 0,
      dropped: 0,
    };

    baseFolderItems.forEach((item) => {
      const st = (item.status || 'plan_to_watch').toLowerCase().replace(/\s+/g, '_');
      if (st === 'watching') counts.watching++;
      else if (st === 'completed') counts.completed++;
      else if (st === 'on_hold') counts.on_hold++;
      else if (st === 'dropped') counts.dropped++;
      else counts.plan_to_watch++;
    });

    return counts;
  }, [baseFolderItems]);

  // Apply secondary filters (mediaType + status + search + sort)
  let catalogItems = baseFolderItems;

  if (typeFilter !== 'all') {
    catalogItems = catalogItems.filter((i) => {
      const m = (i.mediaType || 'anime').toLowerCase();
      if (typeFilter === 'anime') {
        return ['anime', 'tv', 'movie', 'ova', 'ona', 'special'].includes(m);
      }
      if (typeFilter === 'manga') {
        return ['manga', 'manhua', 'doujinshi', 'one shot', 'one_shot'].includes(m);
      }
      if (typeFilter === 'manhwa') {
        return ['manhwa', 'webtoon'].includes(m);
      }
      if (typeFilter === 'novel') {
        return ['novel', 'light novel', 'lightnovel', 'webnovel'].includes(m);
      }
      return m === typeFilter;
    });
  }

  if (statusFilter !== 'all') {
    catalogItems = catalogItems.filter((i) => {
      const st = (i.status || 'plan_to_watch').toLowerCase().replace(/\s+/g, '_');
      return st === statusFilter;
    });
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    catalogItems = catalogItems.filter((i) => (i.title || '').toLowerCase().includes(q));
  }

  if (sortFilter === 'unwatched') {
    catalogItems = catalogItems.filter((i) => !watchedIds.includes(String(i.mediaId || (i as any).id)));
  } else if (sortFilter === 'top_rated') {
    catalogItems = [...catalogItems].sort(
      (a, b) => parseFloat(String(b.rating || '0')) - parseFloat(String(a.rating || '0'))
    );
  }

  // Status Change Handler
  const handleStatusChange = async (item: WatchlistItem, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const mediaId = String(item.mediaId || (item as any).id);
    const mediaType = item.mediaType || 'anime';
    const normStatus = newStatus.toLowerCase();

    if (isAuthenticated) {
      await updateWatchlistStatus(mediaId, mediaType, normStatus);
      mutateWatchlist();
    }

    setOpenStatusMenuId(null);
    dispatchWatchlistUpdated();
  };

  // Progress Change Handler (+ / - episodes or chapters)
  const handleProgressChange = async (item: WatchlistItem, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const mediaId = String(item.mediaId || (item as any).id);
    const mediaType = item.mediaType || 'anime';
    const currentProg = Number(item.progress || 0);
    const nextProg = Math.max(0, currentProg + delta);

    if (isAuthenticated) {
      await updateWatchlistProgress(mediaId, mediaType, nextProg);
      mutateWatchlist();
    }

    dispatchWatchlistUpdated();
  };

  // Watched Reaction Toggle
  const handleToggleWatched = async (mediaId: string | number, mediaType: string = 'anime', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const strId = String(mediaId);
    const isWatched = watchedIds.includes(strId);
    const next = isWatched ? watchedIds.filter((id) => id !== strId) : [...watchedIds, strId];
    setWatchedIds(next);
    try {
      localStorage.setItem('animenation_watched', JSON.stringify(next));
    } catch {}

    if (isAuthenticated) {
      await toggleUserReaction(strId, mediaType, 'watched');
      mutateReactions();
    }
  };

  // Liked Reaction Toggle
  const handleToggleLiked = async (mediaId: string | number, mediaType: string = 'anime', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const strId = String(mediaId);
    const isLiked = likedIds.includes(strId);
    const next = isLiked ? likedIds.filter((id) => id !== strId) : [...likedIds, strId];
    setLikedIds(next);
    try {
      localStorage.setItem('animenation_liked', JSON.stringify(next));
    } catch {}

    if (isAuthenticated) {
      await toggleUserReaction(strId, mediaType, 'liked');
      mutateReactions();
    }
  };

  // Quick Folder Toggle (Add or remove item from a specific folder)
  const handleToggleItemInFolder = async (cat: CatalogData, mediaId: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const strId = String(mediaId);
    const currentIds = (cat.itemIds || []).map(String);
    const isIn = currentIds.includes(strId);
    const updatedIds = isIn ? currentIds.filter((id) => id !== strId) : [...currentIds, strId];

    const updatedCat: CatalogData = { ...cat, itemIds: updatedIds };
    const nextList = catalogs.map((c) => (c.id === cat.id ? updatedCat : c));
    setCatalogs(nextList);
    dispatchCatalogsUpdated(nextList);

    if (isAuthenticated) {
      await saveUserCatalog(updatedCat);
      mutateCatalogs();
    }
  };

  // Remove item handler — optimistic UI update (no refresh needed)
  const handleRemove = async (mediaId: string | number, mediaType: string = 'anime') => {
    const strId = String(mediaId);
    if (activeCatalog === 'watchlist') {
      // Optimistic: remove from SWR cache instantly, then confirm with DB
      mutateWatchlist(
        (prev: any) => ({
          ...(prev || {}),
          items: (prev?.items || []).filter(
            (item: any) => String(item.mediaId ?? item.id ?? item.anime_id) !== strId
          ),
          success: true,
        }),
        false // revalidate=false: don't refetch immediately
      );
      dispatchWatchlistUpdated(strId);
      if (isAuthenticated) {
        await removeFromWatchlist(strId, mediaType);
        // Revalidate after DB confirm to stay in sync
        mutateWatchlist();
      }
    } else if (activeCatalog === 'liked') {
      // Remove from Liked smart folder
      setLikedIds((prev) => prev.filter((id) => String(id) !== strId));
      try {
        const liked1 = JSON.parse(localStorage.getItem('animenation_liked') || '[]');
        localStorage.setItem('animenation_liked', JSON.stringify(liked1.filter((id: any) => String(id) !== strId)));
        const liked2 = JSON.parse(localStorage.getItem('ani_liked_ids') || '[]');
        localStorage.setItem('ani_liked_ids', JSON.stringify(liked2.filter((id: any) => String(id) !== strId)));
        const liked3 = JSON.parse(localStorage.getItem('ani_manga_liked_ids') || '[]');
        localStorage.setItem('ani_manga_liked_ids', JSON.stringify(liked3.filter((id: any) => String(id) !== strId)));
      } catch {}

      if (isAuthenticated) {
        await removeUserReaction(strId, 'liked');
        mutateReactions();
      }
    } else if (activeCatalog === 'watched') {
      // Remove from Watched smart folder
      setWatchedIds((prev) => prev.filter((id) => String(id) !== strId));
      try {
        const w1 = JSON.parse(localStorage.getItem('animenation_watched') || '[]');
        localStorage.setItem('animenation_watched', JSON.stringify(w1.filter((id: any) => String(id) !== strId)));
        const w2 = JSON.parse(localStorage.getItem('ani_watched_ids') || '[]');
        localStorage.setItem('ani_watched_ids', JSON.stringify(w2.filter((id: any) => String(id) !== strId)));
        const w3 = JSON.parse(localStorage.getItem('ani_manga_watched_ids') || '[]');
        localStorage.setItem('ani_manga_watched_ids', JSON.stringify(w3.filter((id: any) => String(id) !== strId)));
      } catch {}

      if (isAuthenticated) {
        await removeUserReaction(strId, 'watched');
        mutateReactions();
      }
    } else if (activeCatalog === 'disliked') {
      // Remove from Disliked smart folder
      setDislikedIds((prev) => prev.filter((id) => String(id) !== strId));
      try {
        const d1 = JSON.parse(localStorage.getItem('animenation_disliked') || '[]');
        localStorage.setItem('animenation_disliked', JSON.stringify(d1.filter((id: any) => String(id) !== strId)));
        const d2 = JSON.parse(localStorage.getItem('ani_disliked_ids') || '[]');
        localStorage.setItem('ani_disliked_ids', JSON.stringify(d2.filter((id: any) => String(id) !== strId)));
        const d3 = JSON.parse(localStorage.getItem('ani_manga_disliked_ids') || '[]');
        localStorage.setItem('ani_manga_disliked_ids', JSON.stringify(d3.filter((id: any) => String(id) !== strId)));
      } catch {}

      if (isAuthenticated) {
        await removeUserReaction(strId, 'disliked');
        mutateReactions();
      }
    } else {
      const updatedIds = (currentCatalogObj.itemIds || []).filter((id) => String(id) !== strId);
      const updatedCat: CatalogData = { ...currentCatalogObj, itemIds: updatedIds };
      const nextList = catalogs.map((c) => (c.id === currentCatalogObj.id ? updatedCat : c));
      setCatalogs(nextList);
      dispatchCatalogsUpdated(nextList);

      if (isAuthenticated) {
        await saveUserCatalog(updatedCat);
        mutateCatalogs();
      }
    }
  };

  const openEditModal = (cat: CatalogData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCatalog(cat);
    setEditName(cat.name);
    setEditColor((cat.color as any) || 'pink');
    setEditThumbnail((cat.thumbnail as any) || 'Folder');
    setThumbnailDropdownOpen(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatalog || !editName.trim()) return;

    const updatedCatalog: CatalogData = {
      ...editingCatalog,
      name: editName.trim(),
      color: editColor,
      thumbnail: editThumbnail,
    };

    const updatedList = catalogs.map((c) => (c.id === editingCatalog.id ? updatedCatalog : c));
    if (!catalogs.some((c) => c.id === editingCatalog.id)) {
      updatedList.push(updatedCatalog);
    }

    setCatalogs(updatedList);
    setEditingCatalog(null);
    dispatchCatalogsUpdated(updatedList);

    if (isAuthenticated) {
      await saveUserCatalog(updatedCatalog);
      mutateCatalogs();
    }
  };

  const handleApplyPreset = (preset: (typeof PRESET_LIST)[number]) => {
    setEditName(preset.name);
    setEditColor(preset.color);
    setEditThumbnail(preset.thumbnail);
  };

  const handleDeleteCatalog = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (id === 'watchlist') return;
    const updated = catalogs.filter((c) => c.id !== id);
    setCatalogs(updated);
    if (activeCatalog === id) {
      setActiveCatalog('watchlist');
    }
    dispatchCatalogsUpdated(updated);

    if (isAuthenticated) {
      await deleteUserCatalog(id);
      mutateCatalogs();
    }
  };

  const colorStyles: Record<
    CatalogColor,
    { border: string; bg: string; iconBg: string; text: string; glow: string; dot: string }
  > = {
    pink: {
      border: 'border-[#ff4dd2]/30 group-hover:border-[#ff4dd2]/60',
      bg: 'from-[#ff4dd2]/20 via-[#0e0f22] to-[#060710]',
      iconBg: 'bg-[#ff4dd2]/15 text-[#ff4dd2] border-[#ff4dd2]/30',
      text: 'text-[#ff4dd2]',
      glow: 'shadow-[0_0_25px_rgba(255,77,210,0.25)]',
      dot: 'bg-[#ff4dd2]',
    },
    purple: {
      border: 'border-purple-500/30 group-hover:border-purple-500/60',
      bg: 'from-purple-950/40 via-[#0e0f22] to-[#060710]',
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.25)]',
      dot: 'bg-purple-500',
    },
    emerald: {
      border: 'border-emerald-500/30 group-hover:border-emerald-500/60',
      bg: 'from-emerald-950/40 via-[#0e0f22] to-[#060710]',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      dot: 'bg-emerald-500',
    },
    cyan: {
      border: 'border-cyan-500/30 group-hover:border-cyan-500/60',
      bg: 'from-cyan-950/40 via-[#0e0f22] to-[#060710]',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.25)]',
      dot: 'bg-cyan-500',
    },
    amber: {
      border: 'border-amber-500/30 group-hover:border-amber-500/60',
      bg: 'from-amber-950/40 via-[#0e0f22] to-[#060710]',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      dot: 'bg-amber-500',
    },
    rose: {
      border: 'border-rose-500/30 group-hover:border-rose-500/60',
      bg: 'from-rose-950/40 via-[#0e0f22] to-[#060710]',
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.25)]',
      dot: 'bg-rose-500',
    },
  };

  const renderIcon = (thumbName?: CatalogThumbnail, size = 22) => {
    const IconComponent = THUMBNAIL_ICONS[thumbName || 'Folder'] || Folder;
    return <IconComponent size={size} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white">
      <main className="flex-1 px-4 md:px-8 lg:px-12 pt-28 pb-20 max-w-[1720px] mx-auto w-full">
        {/* Page Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-orbitron uppercase tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,77,210,0.5)]">
              My List
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
              Organize your saved anime, manga, manhwa, and light novels into custom folders &amp; vaults.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-2xl bg-[#ff4dd2] hover:bg-[#ff4dd2]/90 px-5 py-3 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#ff4dd2]/30 transition-all active:scale-95 cursor-pointer"
            >
              <Search size={15} />
              <span>Search &amp; Add</span>
            </Link>
          </div>
        </header>

        {!authLoaded ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center mb-4 text-[#ff4dd2] shadow-[0_0_30px_rgba(255,77,210,0.3)]">
              <Sparkles size={28} className="animate-spin" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
              Loading Your Library...
            </p>
          </div>
        ) : !isAuthenticated ? (
          /* Sign-In Required Cyberpunk Card */
          <div className="my-8 max-w-3xl mx-auto">
            <div className="relative rounded-3xl border border-[#ff4dd2]/30 bg-gradient-to-b from-[#13152c] via-[#0c0d1e] to-[#060710] p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-center overflow-hidden">
              {/* Neon Ambient Glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#ff4dd2]/15 rounded-full blur-3xl pointer-events-none" />

              {/* Glowing Icon */}
              <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-[#ff4dd2]/15 border border-[#ff4dd2]/40 flex items-center justify-center text-[#ff4dd2] shadow-[0_0_30px_rgba(255,77,210,0.4)]">
                <Bookmark size={36} className="fill-[#ff4dd2]/30 text-[#ff4dd2]" />
              </div>

              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 text-[#ff4dd2] text-xs font-black uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-[#ff4dd2] animate-ping" />
                <span>Cloud Authentication Required</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-orbitron uppercase tracking-tight text-white mb-3 drop-shadow-[0_0_20px_rgba(255,77,210,0.3)]">
                Sign In to View Your List
              </h2>

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto mb-8 leading-relaxed">
                Guest saving has been disabled to ensure 100% cloud permanence. Sign in to your account to securely access your cloud-synced anime, manga, manhwa, light novels, chapter tracker, and custom vaults.
              </p>

              {/* Feature Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8 text-left">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <Film size={18} className="text-[#ff4dd2]" />
                  <span className="text-xs font-bold text-white">Anime &amp; Series</span>
                  <span className="text-[10px] text-gray-400">Episode progress</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <BookOpen size={18} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white">Manga &amp; Manhwa</span>
                  <span className="text-[10px] text-gray-400">Chapter tracker</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <Folder size={18} className="text-cyan-400" />
                  <span className="text-xs font-bold text-white">Custom Vaults</span>
                  <span className="text-[10px] text-gray-400">Color-coded folders</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
                  <Sparkles size={18} className="text-amber-400" />
                  <span className="text-xs font-bold text-white">100% Free Cloud</span>
                  <span className="text-[10px] text-gray-400">Synced everywhere</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={`/signin?callbackUrl=${encodeURIComponent('/my-list')}`}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#ff4dd2] hover:bg-[#ff4dd2]/90 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#ff4dd2]/40 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In to Account</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="/search"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search size={15} />
                  <span>Browse Catalog</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW & REACTIONS SMART HUBS */}
            <section className="mb-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#ff4dd2] mb-3.5 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#ff4dd2] rounded-full" /> Overview &amp; Reactions
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 max-w-5xl">
                {/* 1. Watched (Green) */}
                <div
                  onClick={() => handleSelectSpecialFolder('watched')}
                  className={`group relative cursor-pointer rounded-3xl border p-4 sm:p-5 shadow-lg transition-all duration-300 ${
                    activeCatalog === 'watched'
                      ? 'border-emerald-400 bg-gradient-to-b from-emerald-900/40 via-[#0e0f22] to-[#060710] shadow-[0_0_30px_rgba(16,185,129,0.35)] scale-[1.02] ring-2 ring-emerald-400/80'
                      : 'border-emerald-500/20 bg-gradient-to-b from-emerald-950/30 via-[#0e0f22] to-[#060710] hover:border-emerald-500/50 hover:scale-[1.01]'
                  }`}
                  title="Click to view all completed & watched anime and manga"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      <Eye size={16} />
                    </span>
                    {activeCatalog === 'watched' && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-black px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-orbitron leading-none mb-1">
                    {watchedIds.length}
                  </p>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Watched</h3>
                  <p className="text-[11px] text-gray-400 truncate">Completed titles</p>
                </div>

                {/* 2. Liked (Pink) */}
                <div
                  onClick={() => handleSelectSpecialFolder('liked')}
                  className={`group relative cursor-pointer rounded-3xl border p-4 sm:p-5 shadow-lg transition-all duration-300 ${
                    activeCatalog === 'liked'
                      ? 'border-[#ff4dd2] bg-gradient-to-b from-pink-900/40 via-[#0e0f22] to-[#060710] shadow-[0_0_30px_rgba(255,77,210,0.35)] scale-[1.02] ring-2 ring-[#ff4dd2]/80'
                      : 'border-pink-500/20 bg-gradient-to-b from-pink-950/30 via-[#0e0f22] to-[#060710] hover:border-[#ff4dd2]/50 hover:scale-[1.01]'
                  }`}
                  title="Click to view all liked & recommended titles"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-pink-500/15 text-[#ff4dd2] border border-pink-500/25">
                      <ThumbsUp size={16} />
                    </span>
                    {activeCatalog === 'liked' && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#ff4dd2] text-black px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-orbitron leading-none mb-1">
                    {likedIds.length}
                  </p>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Liked</h3>
                  <p className="text-[11px] text-gray-400 truncate">Loved &amp; Favorites</p>
                </div>

                {/* 3. Disliked (Rose) */}
                <div
                  onClick={() => handleSelectSpecialFolder('disliked')}
                  className={`group relative cursor-pointer rounded-3xl border p-4 sm:p-5 shadow-lg transition-all duration-300 ${
                    activeCatalog === 'disliked'
                      ? 'border-rose-500 bg-gradient-to-b from-rose-900/40 via-[#0e0f22] to-[#060710] shadow-[0_0_30px_rgba(244,63,94,0.35)] scale-[1.02] ring-2 ring-rose-400/80'
                      : 'border-rose-500/20 bg-gradient-to-b from-rose-950/30 via-[#0e0f22] to-[#060710] hover:border-rose-500/50 hover:scale-[1.01]'
                  }`}
                  title="Click to view all disliked titles"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25">
                      <ThumbsDown size={16} />
                    </span>
                    {activeCatalog === 'disliked' && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500 text-black px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-orbitron leading-none mb-1">
                    {dislikedIds.length}
                  </p>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Disliked</h3>
                  <p className="text-[11px] text-gray-400 truncate">Not recommended</p>
                </div>

                {/* 4. Total Saved (Purple / Main Watchlist) */}
                <div
                  onClick={() => handleSelectSpecialFolder('watchlist')}
                  className={`group relative cursor-pointer rounded-3xl border p-4 sm:p-5 shadow-lg transition-all duration-300 ${
                    activeCatalog === 'watchlist'
                      ? 'border-purple-400 bg-gradient-to-b from-purple-900/40 via-[#0e0f22] to-[#060710] shadow-[0_0_30px_rgba(168,85,247,0.35)] scale-[1.02] ring-2 ring-purple-400/80'
                      : 'border-purple-500/20 bg-gradient-to-b from-purple-950/30 via-[#0e0f22] to-[#060710] hover:border-purple-500/50 hover:scale-[1.01]'
                  }`}
                  title="Click to view all saved titles across all folders"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
                      <Folder size={16} />
                    </span>
                    {activeCatalog === 'watchlist' && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-purple-400 text-black px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-orbitron leading-none mb-1">
                    {rawItems.length}
                  </p>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Total Saved</h3>
                  <p className="text-[11px] text-gray-400 truncate">Across all folders</p>
                </div>
              </div>
            </section>

        {/* 2. FOLDERS / CATALOGS CARDS SECTION */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#ff4dd2]">
                Catalogs &amp; Folders
              </p>
              <span className="text-[10px] font-bold text-gray-300 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                {catalogs.length} Folders
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
            >
              {isEditing ? 'Done Managing' : 'Manage Folders'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {catalogs.map((cat) => {
              const isSelected = activeCatalog === cat.id;
              const count =
                cat.id === 'watchlist'
                  ? rawItems.length
                  : rawItems.filter((i) => cat.itemIds?.map(String).includes(String(i.mediaId || (i as any).id))).length;
              const style = colorStyles[cat.color as CatalogColor] || colorStyles.pink;

              return (
                <div
                  key={cat.id}
                  onClick={() => setActiveCatalog(cat.id)}
                  className={`group relative cursor-pointer rounded-3xl border p-5 flex flex-col justify-between min-h-[210px] transition-all duration-200 bg-gradient-to-b ${style.bg} ${
                    isSelected
                      ? `border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-[1.02] ring-2 ring-white/60`
                      : `${style.border} hover:scale-[1.01]`
                  }`}
                >
                  {/* Top Buttons: Edit & Delete */}
                  <div className="flex items-center justify-between h-6">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(cat, e)}
                      className="w-7 h-7 rounded-full bg-[#ff4dd2] text-black flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      title={`Edit ${cat.name}`}
                    >
                      <Pencil size={12} className="text-black font-bold" />
                    </button>

                    {cat.id !== 'watchlist' && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCatalog(cat.id, e)}
                        className={`w-7 h-7 rounded-full bg-black/60 text-gray-400 hover:text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all cursor-pointer ${
                          isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                        title="Delete folder"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  {/* Center Thumbnail Icon */}
                  <div className="flex items-center justify-center my-3">
                    <div
                      className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${style.iconBg} transition-transform group-hover:scale-110 shadow-sm`}
                    >
                      {renderIcon(cat.thumbnail as CatalogThumbnail, 24)}
                    </div>
                  </div>

                  {/* Bottom Folder Title & Count */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ff4dd2] transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{count} titles saved</p>
                  </div>
                </div>
              );
            })}

            {/* 🎧 Music Playlists Hub Folder Card */}
            <div
              onClick={() => {
                if (!isAuthenticated) {
                  router.push(`/signin?callbackUrl=${encodeURIComponent('/my-list')}`);
                  return;
                }
                setActiveCatalog('music_hub');
              }}
              className={`group relative cursor-pointer rounded-3xl border p-5 flex flex-col justify-between min-h-[210px] transition-all duration-200 bg-gradient-to-b from-purple-950/40 via-[#0e0f22] to-[#060710] ${
                activeCatalog === 'music_hub'
                  ? 'border-[#ff4dd2] shadow-[0_0_30px_rgba(255,77,210,0.35)] scale-[1.02] ring-2 ring-[#ff4dd2]/80'
                  : 'border-purple-500/30 hover:border-[#ff4dd2]/50 hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between h-6">
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#ff4dd2] text-black px-2.5 py-0.5 rounded-full">
                  Music Vault
                </span>
                {activeCatalog === 'music_hub' && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center my-3">
                <div className="w-14 h-14 rounded-2xl border border-purple-500/30 bg-purple-500/15 text-purple-300 flex items-center justify-center transition-transform group-hover:scale-110 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                  <Music2 size={24} className="text-[#ff4dd2]" />
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ff4dd2] transition-colors flex items-center gap-1.5">
                  <span>Music Playlists</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {totalMusicTracks} tracks saved
                </p>
              </div>
            </div>

            {/* Create New Folder Button */}
            <div
              onClick={() => {
                setEditingCatalog({
                  id: `catalog_${Date.now()}`,
                  name: '',
                  color: 'pink',
                  thumbnail: 'Folder',
                  itemIds: [],
                  custom: true,
                });
                setEditName('');
                setEditColor('pink');
                setEditThumbnail('Folder');
              }}
              className="group relative cursor-pointer rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#ff4dd2]/40 p-5 flex flex-col justify-center min-h-[210px] transition-all duration-200 items-center text-center shadow-sm hover:scale-[1.01]"
            >
              <div className="w-14 h-14 rounded-2xl border border-[#ff4dd2]/30 bg-[#ff4dd2]/10 flex items-center justify-center text-[#ff4dd2] group-hover:scale-110 transition-transform mb-3 shadow-[0_0_20px_rgba(255,77,210,0.2)]">
                <Plus size={24} />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">New Folder</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Create custom</p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EDIT / CREATE CATALOG MODAL (Screenshot 1 Exact Implementation)           */}
        {/* ========================================================================= */}
        {editingCatalog && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setEditingCatalog(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0d0e22] p-6 md:p-8 shadow-2xl shadow-black/90"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black font-orbitron uppercase tracking-tight text-white">
                    {editingCatalog.name ? 'Edit Folder' : 'Create New Folder'}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Choose a custom tint, icon, and name for this collection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCatalog(null)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Solo Leveling Vibes..."
                    className="w-full rounded-2xl border border-[#ff4dd2]/50 bg-black/50 px-4 py-3 text-sm font-semibold text-white placeholder:text-gray-500 focus:border-[#ff4dd2] focus:outline-none focus:ring-1 focus:ring-[#ff4dd2] shadow-inner"
                  />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-2.5">
                        {(['pink', 'purple', 'emerald', 'cyan', 'amber', 'rose'] as const).map(
                          (col) => {
                            const isChosen = editColor === col;
                            const style = colorStyles[col];
                            return (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setEditColor(col)}
                                className={`w-8 h-8 rounded-full ${style.dot} transition-all duration-200 cursor-pointer ${
                                  isChosen
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110 shadow-lg'
                                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                              />
                            );
                          }
                        )}
                      </div>
                    </div>

                    <div className="relative min-w-[150px]">
                      <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                        Icon
                      </label>
                      <button
                        type="button"
                        onClick={() => setThumbnailDropdownOpen((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs font-bold text-white transition hover:border-[#ff4dd2]/50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {renderIcon(editThumbnail, 15)}
                          <span>{editThumbnail}</span>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                      </button>

                      {thumbnailDropdownOpen && (
                        <div className="absolute right-0 z-30 mt-1.5 w-full rounded-2xl border border-white/15 bg-[#0c0d1e] p-1.5 shadow-2xl backdrop-blur-xl">
                          {(
                            [
                              'Folder',
                              'Sparkles',
                              'BookOpen',
                              'Film',
                              'Tv',
                              'Flame',
                              'Star',
                              'Heart',
                              'Clapperboard',
                            ] as const
                          ).map((tName) => (
                            <button
                              key={tName}
                              type="button"
                              onClick={() => {
                                setEditThumbnail(tName);
                                setThumbnailDropdownOpen(false);
                              }}
                              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                editThumbnail === tName
                                  ? 'bg-[#ff4dd2]/20 text-[#ff4dd2]'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {renderIcon(tName, 14)}
                              <span>{tName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2.5">
                    Fast Presets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LIST.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all touch-manipulation active:scale-95 cursor-pointer ${
                          editName === preset.name
                            ? 'border-[#ff4dd2] bg-[#ff4dd2]/20 text-[#ff4dd2] shadow-sm'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingCatalog(null)}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-[#ff4dd2] hover:bg-[#ff4dd2]/90 px-7 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-all shadow-lg shadow-[#ff4dd2]/25 active:scale-95 cursor-pointer"
                  >
                    Save Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. CONDITIONAL: MUSIC VAULT EXPLORER OR REGULAR WATCHLIST VIEW */}
        {activeCatalog === 'music_hub' ? (
          <MusicVaultExplorer
            playlists={musicPlaylists}
            onPlaylistsUpdate={setMusicPlaylists}
            onBackToWatchlist={() => setActiveCatalog('watchlist')}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <>
            {/* 3. FILTERS, SEARCH & VIEW MODE CONTROLS */}
            <section className="mb-6 space-y-4 border-b border-white/5 pb-5">
              {/* Top Row: Search + View Mode + Sort & Media Types */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Bar within current folder */}
            <div className="relative w-full lg:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${currentCatalogObj.name}...`}
                className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]/60 focus:ring-1 focus:ring-[#ff4dd2]/60 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Right Controls: Media Type Tabs, Sort, and View Mode */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Media Type Tabs (ALL, ANIME, MANGA, MANHWA, LIGHT NOVEL) */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 overflow-x-auto">
                {MEDIA_TYPE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTypeFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      typeFilter === tab.key
                        ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Filter Tabs */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
                {(['latest', 'top_rated', 'unwatched'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSortFilter(s)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      sortFilter === s
                        ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {s === 'latest' ? 'LATEST' : s === 'top_rated' ? 'TOP RATED' : 'UNWATCHED'}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle: Grid vs List */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title="List / Table View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Status Filter Tabs (Watching/Reading, Plan to Watch/Read, Completed, Dropped) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: 'all', label: 'All Titles', count: statusCounts.all, dot: null },
                  {
                    key: 'watching',
                    label: (typeFilter === 'manga' || typeFilter === 'manhwa' || typeFilter === 'novel') ? 'Reading' : 'Watching',
                    count: statusCounts.watching,
                    dot: STATUS_CONFIG.watching.dot,
                  },
                  {
                    key: 'plan_to_watch',
                    label: (typeFilter === 'manga' || typeFilter === 'manhwa' || typeFilter === 'novel') ? 'Plan to Read' : 'Plan to Watch',
                    count: statusCounts.plan_to_watch,
                    dot: STATUS_CONFIG.plan_to_watch.dot,
                  },
                  { key: 'completed', label: 'Completed', count: statusCounts.completed, dot: STATUS_CONFIG.completed.dot },
                  { key: 'on_hold', label: 'On Hold', count: statusCounts.on_hold, dot: STATUS_CONFIG.on_hold.dot },
                  { key: 'dropped', label: 'Dropped', count: statusCounts.dropped, dot: STATUS_CONFIG.dropped.dot },
                ] as const
              ).map((tab) => {
                const isSelected = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border-[#ff4dd2]/50 shadow-[0_0_15px_rgba(255,77,210,0.2)]'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-[#ff4dd2]/30 text-white' : 'bg-white/10 text-gray-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-gray-400 font-semibold">
              Showing <strong className="text-white font-bold">{catalogItems.length}</strong> of{' '}
              <strong className="text-gray-200">{baseFolderItems.length}</strong> in{' '}
              <strong className="text-[#ff4dd2]">{currentCatalogObj.name}</strong>
            </div>
          </div>
        </section>

        {/* Active Folder Banner — shown when not on Main Watchlist */}
        {activeCatalog !== 'watchlist' && (
          <div className="flex items-center justify-between gap-3 mb-5 px-4 py-3 rounded-2xl border border-[#ff4dd2]/30 bg-[#ff4dd2]/5 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[#ff4dd2] shrink-0">
                {renderIcon(currentCatalogObj.thumbnail as CatalogThumbnail, 16)}
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ff4dd2] truncate">
                📌 Now Viewing: {currentCatalogObj.name}
              </span>
              <span className="text-[10px] font-bold text-white bg-[#ff4dd2]/20 px-2 py-0.5 rounded-full border border-[#ff4dd2]/30 shrink-0 ml-1">
                {catalogItems.length} Titles
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveCatalog('watchlist')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors shrink-0 cursor-pointer whitespace-nowrap"
            >
              <span>← Main Watchlist</span>
            </button>
          </div>
        )}

        {/* 4. ITEMS DISPLAY OR EMPTY STATE */}
        {catalogItems.length === 0 ? (
          searchQuery ? (
            /* Empty Search Results */
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto shadow-2xl backdrop-blur-xl">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-gray-400 mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No Matches Found</h3>
              <p className="text-xs text-gray-400 mb-5">
                No titles matching <span className="text-[#ff4dd2] font-bold">"{searchQuery}"</span> in this view.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : activeCatalog === 'liked' ? (
            /* Empty Liked State */
            <div className="rounded-3xl border border-pink-500/20 bg-gradient-to-b from-pink-950/20 via-black/40 to-transparent p-12 sm:p-16 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-2xl backdrop-blur-xl">
              <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-[#ff4dd2] mb-5 shadow-[0_0_35px_rgba(255,77,210,0.25)]">
                <ThumbsUp size={36} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff4dd2] mb-2">
                Favorites &amp; Recommendations
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-orbitron uppercase text-white mb-2">
                No Liked Titles Yet
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
                Tap the Thumbs Up (<span className="text-[#ff4dd2] font-bold">Like 👍</span>) button on any anime or manga details page to save it to your favorites!
              </p>
              <Link
                href="/search"
                className="flex items-center gap-2 rounded-2xl bg-[#ff4dd2] hover:bg-[#ff7be0] px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition-all shadow-lg shadow-[#ff4dd2]/30 active:scale-95 cursor-pointer"
              >
                <Search size={15} />
                <span>Explore Anime &amp; Manga</span>
              </Link>
            </div>
          ) : activeCatalog === 'disliked' ? (
            /* Empty Disliked State */
            <div className="rounded-3xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 via-black/40 to-transparent p-12 sm:p-16 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-2xl backdrop-blur-xl">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-5 shadow-[0_0_35px_rgba(244,63,94,0.25)]">
                <ThumbsDown size={36} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-rose-400 mb-2">
                Not Recommended
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-orbitron uppercase text-white mb-2">
                No Disliked Titles
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
                Titles you dislike with Thumbs Down (👎) will be stored here so you can keep track of titles you decided not to watch.
              </p>
              <Link
                href="/genres"
                className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 cursor-pointer"
              >
                <Film size={15} />
                <span>Browse Genres</span>
              </Link>
            </div>
          ) : activeCatalog === 'watched' ? (
            /* Empty Watched State */
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 via-black/40 to-transparent p-12 sm:p-16 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-2xl backdrop-blur-xl">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 shadow-[0_0_35px_rgba(16,185,129,0.25)]">
                <Eye size={36} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-2">
                Completed Archive
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-orbitron uppercase text-white mb-2">
                No Watched Titles Yet
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
                Click the <span className="text-emerald-400 font-bold">Watched 👁️</span> or <span className="text-emerald-400 font-bold">Mark Read</span> button on any series to mark it as finished and save it here.
              </p>
              <Link
                href="/search"
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition-all shadow-lg shadow-emerald-500/30 active:scale-95 cursor-pointer"
              >
                <Search size={15} />
                <span>Discover Titles</span>
              </Link>
            </div>
          ) : (
            /* Empty Custom Folder State */
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-12 sm:p-16 text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-2xl backdrop-blur-xl">
              <div className="w-20 h-20 rounded-3xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2] mb-5 shadow-[0_0_35px_rgba(255,77,210,0.25)]">
                {renderIcon(currentCatalogObj.thumbnail as CatalogThumbnail, 36)}
              </div>

              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#ff4dd2] mb-2">
                Empty Folder
              </span>

              <h2 className="text-2xl sm:text-3xl font-black font-orbitron uppercase text-white mb-2">
                {currentCatalogObj.name}
              </h2>

              <p className="text-xs sm:text-sm text-gray-400 max-w-md mb-8 leading-relaxed">
                No anime, manga, or manhwa added to this folder yet. Browse our catalog or use search to add titles here.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/genres"
                  className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Film size={15} />
                  <span>Explore Catalog</span>
                </Link>

                <Link
                  href="/search"
                  className="flex items-center gap-2 rounded-2xl bg-[#ff4dd2] hover:bg-[#ff7be0] px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition-all shadow-lg shadow-[#ff4dd2]/30 active:scale-95 cursor-pointer"
                >
                  <Search size={15} />
                  <span>Search &amp; Add</span>
                </Link>
              </div>
            </div>
          )
        ) : viewMode === 'grid' ? (
          /* ========================================================================= */
          /* GRID VIEW (Interactive Cyberpunk Cards with Status, Progress, Reactions)  */
          /* ========================================================================= */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {catalogItems.map((item) => {
              const id = String(item.mediaId || (item as any).id);
              const mType = (item.mediaType || 'anime').toLowerCase();
              const isWatched = watchedIds.includes(id);
              const isLiked = likedIds.includes(id);
              const currentStatus = (item.status || 'plan_to_watch').toLowerCase().replace(/\s+/g, '_');
              const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.plan_to_watch;
              const isBook = ['manga', 'manhwa', 'manhua', 'novel', 'light novel', 'lightnovel', 'webnovel'].includes(mType);
              const statusLabel = isBook ? statusCfg.bookLabel : statusCfg.label;
              const linkUrl = isBook ? `/manga/${id}` : `/series/${id}`;
              const progressVal = Number(item.progress || 0);
              const badgeInfo = getMediaBadgeInfo(mType);

              return (
                <div
                  key={`${id}-${mType}`}
                  className="group relative flex flex-col rounded-3xl border border-white/10 bg-[#0e0f22] overflow-visible hover:border-[#ff4dd2]/50 hover:shadow-[0_0_30px_rgba(255,77,210,0.15)] transition-all duration-300"
                >
                  {/* Poster Image Container */}
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-3xl bg-zinc-900">
                    <Link href={linkUrl} className="block w-full h-full">
                      {item.posterPath ? (
                        <Image
                          src={item.posterPath}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 160px, 240px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 font-bold p-2 text-center">
                          {item.title}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f22] via-transparent to-transparent" />
                    </Link>

                    {/* Format Badge Top Left */}
                    <span className={`absolute top-2.5 left-2.5 rounded-lg backdrop-blur-md px-2 py-0.5 text-[9px] font-black uppercase shadow-md border ${badgeInfo.badge}`}>
                      {badgeInfo.label}
                    </span>

                    {/* Watched Checkmark Top Right */}
                    {isWatched && (
                      <span
                        className="absolute top-2.5 right-2.5 rounded-full bg-emerald-500/90 p-1 text-black shadow-lg"
                        title="Marked as Watched"
                      >
                        <Check size={11} className="font-black" />
                      </span>
                    )}

                    {/* Rating Badge Bottom Left */}
                    {item.rating && (
                      <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-white/10">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {item.rating}
                      </span>
                    )}
                  </div>

                  {/* Card Content & Interactive Controls */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                    {/* Title */}
                    <Link href={linkUrl}>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#ff4dd2] transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                    </Link>

                    {/* Status Pill & Selector Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuId(openStatusMenuId === id ? null : id);
                          setOpenFolderMenuId(null);
                        }}
                        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${statusCfg.badge} hover:brightness-125`}
                        title="Click to change status"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} />
                          <span className="truncate">{statusLabel}</span>
                        </div>
                        <ChevronDown size={12} className="shrink-0 opacity-70" />
                      </button>

                      {/* Dropdown Menu */}
                      {openStatusMenuId === id && (
                        <div
                          className="absolute left-0 top-full mt-1.5 w-44 rounded-2xl border border-white/15 bg-[#0c0d1e] p-1 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped'] as const).map((stKey) => {
                            const cfg = STATUS_CONFIG[stKey];
                            const isCur = currentStatus === stKey;
                            const lbl = isBook ? cfg.bookLabel : cfg.label;
                            return (
                              <button
                                key={stKey}
                                type="button"
                                onClick={(e) => handleStatusChange(item, stKey, e)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                  isCur
                                    ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] font-bold'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <span>{lbl}</span>
                                </div>
                                {isCur && <Check size={12} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Episode / Chapter Progress Tracker */}
                    <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/5 px-2.5 py-1">
                      <span className="text-[11px] font-bold text-gray-400">
                        {isBook ? 'Ch' : 'Ep'} <strong className="text-white">{progressVal}</strong>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleProgressChange(item, -1, e)}
                          disabled={progressVal <= 0}
                          className="w-5 h-5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
                          title="Decrement"
                        >
                          <Minus size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleProgressChange(item, 1, e)}
                          className="w-5 h-5 rounded-lg bg-[#ff4dd2]/20 hover:bg-[#ff4dd2] text-[#ff4dd2] hover:text-black flex items-center justify-center font-bold transition cursor-pointer shadow-sm"
                          title="Watched another episode / read chapter"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Action Row: Reactions + Folder + Trash */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      {/* Left: Watched & Liked Quick Reactions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggleWatched(id, mType, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isWatched
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                          title={isWatched ? 'Completed / Watched' : 'Mark as Watched'}
                        >
                          <Eye size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleToggleLiked(id, mType, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isLiked
                              ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                          title={isLiked ? 'Liked' : 'Like title'}
                        >
                          <Heart size={13} className={isLiked ? 'fill-current' : ''} />
                        </button>

                        {/* Folder Move Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFolderMenuId(openFolderMenuId === id ? null : id);
                              setOpenStatusMenuId(null);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            title="Manage Folders for this title"
                          >
                            <FolderPlus size={13} />
                          </button>

                          {openFolderMenuId === id && (
                            <div
                              className="absolute left-0 bottom-full mb-2 w-52 rounded-2xl border border-white/15 bg-[#0c0d1e] p-2 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 border-b border-white/5 mb-1">
                                Include in Folder:
                              </p>
                              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {catalogs.map((c) => {
                                  const inCat = (c.itemIds || []).map(String).includes(id);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={(e) => handleToggleItemInFolder(c, id, e)}
                                      className={`w-full flex items-center justify-between px-2 py-1 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                                        inCat
                                          ? 'bg-[#ff4dd2]/20 text-[#ff4dd2]'
                                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                      }`}
                                    >
                                      <span className="truncate">{c.name}</span>
                                      {inCat && <Check size={11} />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(id, mType)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Remove title"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ========================================================================= */
          /* LIST / TABLE VIEW (High-Density Modern Rows for Rapid Scanning)            */
          /* ========================================================================= */
          <div className="space-y-2.5">
            {catalogItems.map((item) => {
              const id = String(item.mediaId || (item as any).id);
              const mType = (item.mediaType || 'anime').toLowerCase();
              const isWatched = watchedIds.includes(id);
              const isLiked = likedIds.includes(id);
              const currentStatus = (item.status || 'plan_to_watch').toLowerCase().replace(/\s+/g, '_');
              const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.plan_to_watch;
              const isBook = ['manga', 'manhwa', 'manhua', 'novel', 'light novel', 'lightnovel', 'webnovel'].includes(mType);
              const statusLabel = isBook ? statusCfg.bookLabel : statusCfg.label;
              const linkUrl = isBook ? `/manga/${id}` : `/series/${id}`;
              const progressVal = Number(item.progress || 0);
              const badgeInfo = getMediaBadgeInfo(mType);

              return (
                <div
                  key={`${id}-${mType}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-2xl border border-white/10 bg-[#0e0f22] hover:border-[#ff4dd2]/40 hover:bg-[#12142d] transition-all duration-200"
                >
                  {/* Left: Thumbnail + Title + Metadata */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Link
                      href={linkUrl}
                      className="relative w-12 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10"
                    >
                      {item.posterPath ? (
                        <Image
                          src={item.posterPath}
                          alt={item.title}
                          fill
                          sizes="50px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 font-bold text-center">
                          ANI
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0">
                      <Link href={linkUrl}>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#ff4dd2] transition-colors truncate">
                          {item.title}
                        </h4>
                      </Link>

                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase border ${badgeInfo.badge}`}>
                          {badgeInfo.label}
                        </span>

                        {item.year && <span className="text-[11px] text-gray-400 font-semibold">{item.year}</span>}

                        {item.rating && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                            <Star size={11} className="fill-amber-400" />
                            {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls (Status, Progress, Reactions, Actions) */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Status Pill */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusMenuId(openStatusMenuId === id ? null : id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${statusCfg.badge}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                        <span>{statusLabel}</span>
                        <ChevronDown size={12} className="opacity-70" />
                      </button>

                      {openStatusMenuId === id && (
                        <div
                          className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl border border-white/15 bg-[#0c0d1e] p-1 shadow-2xl z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped'] as const).map((stKey) => {
                            const cfg = STATUS_CONFIG[stKey];
                            const isCur = currentStatus === stKey;
                            const lbl = isBook ? cfg.bookLabel : cfg.label;
                            return (
                              <button
                                key={stKey}
                                type="button"
                                onClick={(e) => handleStatusChange(item, stKey, e)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                  isCur
                                    ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] font-bold'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <span>{lbl}</span>
                                </div>
                                {isCur && <Check size={12} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Progress Counter */}
                    <div className="flex items-center gap-2 rounded-xl bg-black/40 border border-white/5 px-2.5 py-1">
                      <button
                        type="button"
                        onClick={(e) => handleProgressChange(item, -1, e)}
                        disabled={progressVal <= 0}
                        className="w-5 h-5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-bold text-gray-300 min-w-[50px] text-center">
                        {isBook ? 'Ch' : 'Ep'} <strong className="text-white">{progressVal}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleProgressChange(item, 1, e)}
                        className="w-5 h-5 rounded-lg bg-[#ff4dd2]/20 hover:bg-[#ff4dd2] text-[#ff4dd2] hover:text-black flex items-center justify-center font-bold transition cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Reactions: Watched & Liked */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleToggleWatched(id, mType, e)}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          isWatched
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                        title={isWatched ? 'Watched' : 'Mark as Watched'}
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleLiked(id, mType, e)}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          isLiked
                            ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                        title={isLiked ? 'Liked' : 'Like'}
                      >
                        <Heart size={14} className={isLiked ? 'fill-current' : ''} />
                      </button>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={linkUrl}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#ff4dd2] hover:underline flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight size={12} />
                    </Link>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(id, mType)}
                      className="p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
            </>
          )}
          </>
        )}
      </main>
    </div>
  );
}
