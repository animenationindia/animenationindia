'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Plus,
  Folder,
  Trash2,
  X,
  Film,
  Tv,
  Sparkles,
  Flame,
  Star,
  Clapperboard,
  Heart,
  FolderPlus,
  BookOpen
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import {
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '@/app/actions/watchlist';
import {
  getUserCatalogs,
  saveUserCatalog,
  removeFromAllCatalogs,
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

interface WatchlistButtonProps {
  item: {
    id: string | number;
    type?: string; // 'anime' | 'manga' | 'manhwa' | 'movie'
    mediaType?: string;
    title: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    rating?: string | number | null;
    year?: string | number | null;
  };
  compact?: boolean;
}

const ICON_MAP: Record<string, any> = {
  Folder,
  Sparkles,
  BookOpen,
  Film,
  Tv,
  Flame,
  Star,
  Heart,
  Clapperboard,
};

export function WatchlistButton({ item, compact = false }: WatchlistButtonProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [catalogs, setCatalogs] = useState<CatalogData[]>(() => mergeWithDefaultCatalogs());
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState<CatalogData['color']>('pink');
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const mediaId = String(item.id);
  const mediaType = item.mediaType || item.type || 'anime';

  // Check authentication status and redirect guests to sign in
  const checkAuthAndPrompt = (): boolean => {
    const isAuthed = Boolean(session?.user || (typeof window !== 'undefined' && localStorage.getItem('user_id')));
    if (!isAuthed) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.push(`/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return false;
    }
    return true;
  };

  // Load catalogs and check watchlist status
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      const isAuthed = Boolean(session?.user || (typeof window !== 'undefined' && localStorage.getItem('user_id')));
      if (isAuthed) {
        try {
          const inList = await isInWatchlist(mediaId, mediaType);
          if (active) setSaved(inList);

          const res = await getUserCatalogs();
          if (active && res && Array.isArray(res.catalogs)) {
            const merged = mergeWithDefaultCatalogs(res.catalogs);
            setCatalogs(merged);
            try {
              localStorage.setItem('animenation_catalogs', JSON.stringify(merged));
            } catch {}
          }
        } catch {}
      } else {
        // Guest mode: no saved items, default folders
        if (active) {
          setSaved(false);
          setCatalogs(mergeWithDefaultCatalogs());
        }
      }
    };

    loadData();

    // Listen for global catalog and watchlist updates
    const handleCatalogsChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setCatalogs(mergeWithDefaultCatalogs(e.detail));
      } else {
        loadData();
      }
    };

    const handleWatchlistChanged = () => {
      loadData();
    };

    window.addEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged);
    window.addEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged);

    return () => {
      active = false;
      window.removeEventListener(CATALOGS_CHANGED_EVENT, handleCatalogsChanged);
      window.removeEventListener(WATCHLIST_CHANGED_EVENT, handleWatchlistChanged);
    };
  }, [session?.user, mediaId, mediaType]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowFolderMenu(false);
        setIsCreatingNew(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Quick toggle main watchlist
  const handleQuickToggle = () => {
    if (!checkAuthAndPrompt()) return;

    startTransition(async () => {
      if (saved) {
        // Remove from watchlist
        await removeFromWatchlist(mediaId, mediaType);
        setSaved(false);
        dispatchWatchlistUpdated();
      } else {
        // Add to main watchlist
        const payload = {
          mediaId,
          mediaType,
          title: item.title,
          posterPath: item.posterPath || null,
          backdropPath: item.backdropPath || null,
          rating: item.rating ? String(item.rating) : null,
          year: item.year ? String(item.year) : null,
        };

        await addToWatchlist(payload);
        setSaved(true);

        // Auto-add to type-specific default folder
        const normType = mediaType.toLowerCase();
        const typeFolderId =
          normType === 'manga'
            ? 'manga_list'
            : normType === 'manhwa'
            ? 'manhwa_vault'
            : ['novel', 'light novel', 'lightnovel'].includes(normType)
            ? 'novel_archive'
            : 'anime_vault';

        const nextCats = catalogs.map((c) => {
          if (c.id === 'watchlist' || c.id === typeFolderId) {
            const itemIds = c.itemIds || [];
            if (!itemIds.map(String).includes(mediaId)) {
              return { ...c, itemIds: [...itemIds, mediaId] };
            }
          }
          return c;
        });
        setCatalogs(nextCats);
        dispatchCatalogsUpdated(nextCats);
        dispatchWatchlistUpdated();
      }
    });
  };

  // Toggle item in specific folder (Add or Remove)
  const handleToggleFolder = async (cat: CatalogData, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkAuthAndPrompt()) return;

    const inThisFolder = cat.id === 'watchlist' ? saved : cat.itemIds?.map(String).includes(mediaId);

    if (cat.id === 'watchlist') {
      handleQuickToggle();
      return;
    }

    const currentIds = Array.isArray(cat.itemIds) ? cat.itemIds.map(String) : [];
    const updatedIds = inThisFolder
      ? currentIds.filter((id) => id !== mediaId)
      : [...currentIds, mediaId];

    const updatedCat: CatalogData = {
      ...cat,
      itemIds: updatedIds,
    };

    const nextList = catalogs.map((c) => (c.id === cat.id ? updatedCat : c));
    setCatalogs(nextList);
    dispatchCatalogsUpdated(nextList);

    await saveUserCatalog(updatedCat);
    if (!saved && !inThisFolder) {
      await addToWatchlist({
        mediaId,
        mediaType,
        title: item.title,
        posterPath: item.posterPath || null,
        backdropPath: item.backdropPath || null,
        rating: item.rating ? String(item.rating) : null,
        year: item.year ? String(item.year) : null,
      });
      setSaved(true);
      dispatchWatchlistUpdated();
    }
  };

  // Remove completely from all folders and main watchlist
  const handleRemoveFromAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!checkAuthAndPrompt()) return;

    startTransition(async () => {
      await removeFromAllCatalogs(mediaId, mediaType);
      await removeFromWatchlist(mediaId, mediaType);
      setSaved(false);

      const nextList = catalogs.map((c) => ({
        ...c,
        itemIds: (c.itemIds || []).filter((id) => String(id) !== mediaId),
      }));
      setCatalogs(nextList);
      dispatchCatalogsUpdated(nextList);
      dispatchWatchlistUpdated();
      setShowFolderMenu(false);
    });
  };

  // Create new folder inline
  const handleCreateNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuthAndPrompt()) return;
    if (!newFolderName.trim()) return;

    const newCat: CatalogData = {
      id: `cat_${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      thumbnail: 'Folder',
      itemIds: [mediaId],
      custom: true,
    };

    const nextList = [...catalogs, newCat];
    setCatalogs(nextList);
    setNewFolderName('');
    setIsCreatingNew(false);
    dispatchCatalogsUpdated(nextList);

    await saveUserCatalog(newCat);
    if (!saved) {
      await addToWatchlist({
        mediaId,
        mediaType,
        title: item.title,
        posterPath: item.posterPath,
      });
      setSaved(true);
      dispatchWatchlistUpdated();
    }
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  const isSavedInAny = saved || (Array.isArray(catalogs) && catalogs.some((c) => c.itemIds?.map(String).includes(mediaId)));

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleQuickToggle}
        disabled={isPending}
        className={`flex h-10 w-10 items-center justify-center rounded-2xl backdrop-blur-md transition-all disabled:opacity-50 touch-manipulation active:scale-90 select-none cursor-pointer ${
          isSavedInAny
            ? 'bg-[#ff4dd2] text-black shadow-[0_0_20px_rgba(255,77,210,0.5)]'
            : 'bg-black/60 text-white hover:bg-[#ff4dd2] hover:text-black border border-white/10'
        }`}
        aria-label={saved ? `Remove ${item.title} from watchlist` : `Add ${item.title} to watchlist`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      {/* Main Quick Action Button */}
      <button
        type="button"
        onClick={handleQuickToggle}
        disabled={isPending}
        className={`flex items-center gap-2 rounded-l-2xl border px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 touch-manipulation active:scale-95 select-none cursor-pointer ${
          isSavedInAny
            ? 'border-[#ff4dd2] bg-[#ff4dd2]/20 text-[#ff4dd2] shadow-[0_0_25px_rgba(255,77,210,0.3)]'
            : 'border-white/15 bg-zinc-900/90 text-white hover:border-[#ff4dd2]/60 hover:bg-zinc-800'
        }`}
      >
        <Icon className={`h-4 w-4 ${isSavedInAny ? 'text-[#ff4dd2]' : ''}`} aria-hidden="true" />
        <span>{isSavedInAny ? 'In List' : 'Add to List'}</span>
      </button>

      {/* Folder Picker Dropdown Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!checkAuthAndPrompt()) return;
          setShowFolderMenu((prev) => !prev);
        }}
        className={`flex items-center justify-center border-y border-r rounded-r-2xl px-3 py-3 text-xs transition-all cursor-pointer ${
          isSavedInAny
            ? 'border-[#ff4dd2] bg-[#ff4dd2]/20 text-[#ff4dd2]'
            : 'border-white/15 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800'
        }`}
        title="Open folders & lists"
      >
        <ChevronDown size={15} className={showFolderMenu ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
      </button>

      {/* EXPANDED FOLDER LIST DROPDOWN */}
      {showFolderMenu && (
        <div
          className="absolute left-0 top-full z-[9999] mt-2.5 w-80 sm:w-96 rounded-3xl border border-white/20 bg-[#0c0d1e]/98 p-4 shadow-2xl shadow-black/95 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-1 pb-3 mb-2.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ff4dd2] animate-pulse" />
              <p className="text-xs font-black uppercase tracking-wider text-white">
                Choose Folder / List
              </p>
            </div>
            <span className="text-[10px] font-bold text-[#ff4dd2] bg-[#ff4dd2]/10 px-2.5 py-0.5 rounded-full border border-[#ff4dd2]/20">
              {catalogs.length} Folders
            </span>
          </div>

          {/* ALL FOLDERS LISTED SEQUENTIALLY */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {catalogs.map((cat) => {
              const inThisFolder = cat.id === 'watchlist' ? saved : cat.itemIds?.map(String).includes(mediaId);
              const IconComp = ICON_MAP[cat.thumbnail || 'Folder'] || Folder;
              const count = cat.id === 'watchlist' ? (saved ? 1 : 0) : (cat.itemIds?.length || 0);

              return (
                <div
                  key={cat.id}
                  onClick={(e) => handleToggleFolder(cat, e)}
                  className={`group flex items-center justify-between rounded-2xl p-2.5 text-xs font-semibold cursor-pointer transition-all border ${
                    inThisFolder
                      ? 'bg-[#ff4dd2]/15 border-[#ff4dd2]/50 text-[#ff4dd2] shadow-sm'
                      : 'bg-zinc-900/80 border-white/5 text-zinc-300 hover:bg-zinc-900 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {/* Left: Icon & Folder Name */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`p-2 rounded-xl border shrink-0 ${
                        inThisFolder
                          ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border-[#ff4dd2]/40'
                          : 'bg-zinc-800 text-zinc-400 border-white/5 group-hover:text-white'
                      }`}
                    >
                      <IconComp size={15} />
                    </span>
                    <div className="truncate">
                      <p className="text-xs font-bold truncate text-white group-hover:text-[#ff4dd2] transition-colors">
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {cat.id === 'watchlist' ? 'Default Collection' : `${count} items`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Direct Action Button */}
                  <div className="shrink-0">
                    {inThisFolder ? (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFolder(cat, e)}
                        className="flex items-center gap-1 rounded-xl bg-[#ff4dd2]/25 hover:bg-rose-500/25 border border-[#ff4dd2]/50 hover:border-rose-500/50 px-2.5 py-1 text-[10px] font-bold text-[#ff4dd2] hover:text-rose-300 transition-all cursor-pointer"
                      >
                        <Check size={12} className="group-hover:hidden" />
                        <X size={12} className="hidden group-hover:inline" />
                        <span className="group-hover:hidden">Added</span>
                        <span className="hidden group-hover:inline">Remove</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFolder(cat, e)}
                        className="flex items-center gap-1 rounded-xl bg-zinc-800 hover:bg-[#ff4dd2] hover:text-black border border-white/10 px-2.5 py-1 text-[10px] font-bold text-zinc-300 transition-all cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Controls: Create New Folder */}
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
            {!isCreatingNew ? (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 border border-white/10 hover:border-[#ff4dd2]/40 px-3 py-2 text-xs font-bold text-[#ff4dd2] hover:bg-zinc-850 transition active:scale-95 shadow-sm cursor-pointer"
              >
                <FolderPlus size={14} />
                <span>Create New Folder</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewFolder} className="space-y-2 rounded-2xl border border-[#ff4dd2]/40 bg-zinc-900/95 p-2.5 animate-in fade-in duration-150 shadow-xl">
                <input
                  type="text"
                  autoFocus
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name (e.g. Solo Leveling Vibes)..."
                  className="w-full rounded-xl border border-[#ff4dd2]/50 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#ff4dd2]"
                />

                <div className="flex items-center justify-between gap-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    {(['pink', 'purple', 'emerald', 'cyan', 'amber', 'rose'] as const).map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewFolderColor(col)}
                        className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                          col === 'pink' ? 'bg-[#ff4dd2]' :
                          col === 'purple' ? 'bg-purple-500' :
                          col === 'emerald' ? 'bg-emerald-500' :
                          col === 'cyan' ? 'bg-cyan-500' :
                          col === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                        } ${newFolderColor === col ? 'ring-2 ring-white scale-125' : 'opacity-60'}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#ff4dd2] hover:bg-[#ff4dd2]/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-sm cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Remove from All */}
            {isSavedInAny && (
              <button
                type="button"
                onClick={handleRemoveFromAll}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 text-[11px] font-bold text-rose-400 transition active:scale-95 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Remove from Watchlist &amp; All Folders</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
