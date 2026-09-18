'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Check,
  X,
  FolderPlus,
  ListPlus,
  Loader2,
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { getUserCatalogs, saveUserCatalog } from '@/app/actions/catalogs';
import {
  CatalogData,
  CatalogThumbnail,
  mergeWithDefaultCatalogs,
  dispatchCatalogsUpdated,
  dispatchWatchlistUpdated,
} from '@/lib/catalogs-shared';
import { useWatchlist } from '@/hooks/useWatchlist';

interface CustomListModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: {
    mal_id: number | string;
    title: string;
    image: string;
    format?: string;
    score?: number;
  };
}

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

export default function CustomListModal({ isOpen, onClose, anime }: CustomListModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { watchlist, isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const [catalogs, setCatalogs] = useState<CatalogData[]>(() => mergeWithDefaultCatalogs([]));
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isAuthed = Boolean(
    session?.user?.id ||
    (typeof window !== 'undefined' && localStorage.getItem('user_id')) ||
    isLoggedIn
  );

  const fetchCatalogs = async () => {
    setLoading(true);
    try {
      const res = await getUserCatalogs();
      if (res.authenticated) {
        setIsLoggedIn(true);
        const merged = mergeWithDefaultCatalogs(res.catalogs);
        setCatalogs(merged);
      } else {
        const clientUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
        if (clientUserId) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
        const merged = mergeWithDefaultCatalogs(res.catalogs || []);
        setCatalogs(merged);
      }
    } catch {
      console.error('Failed to fetch Neon DB catalogs');
      const clientUserId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
      setIsLoggedIn(Boolean(clientUserId));
      setCatalogs(mergeWithDefaultCatalogs([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCatalogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const animeIdStr = String(anime.mal_id);

  const toggleItemInCatalog = async (cat: CatalogData) => {
    const isWatchlist = cat.id === 'watchlist';

    if (isWatchlist) {
      const isAlreadyIn = isInWatchlist(anime.mal_id);
      if (isAlreadyIn) {
        await removeFromWatchlist(anime.mal_id, anime.format || 'Anime');
        setMessage('Removed from Main Watchlist');
      } else {
        await addToWatchlist({
          animeId: anime.mal_id,
          title: anime.title,
          image: anime.image,
          status: 'PLAN_TO_WATCH',
          type: anime.format || 'Anime',
          mediaType: anime.format || 'Anime',
          rating: anime.score ? String(anime.score) : undefined,
        });
        setMessage('Added to Main Watchlist!');
      }
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    const isAlreadyInList = cat.itemIds.map(String).includes(animeIdStr);
    const updatedItemIds = isAlreadyInList
      ? cat.itemIds.filter((id) => String(id) !== animeIdStr)
      : [...cat.itemIds, anime.mal_id];

    const updatedCat: CatalogData = {
      ...cat,
      itemIds: updatedItemIds,
    };

    const nextList = catalogs.map((c) => (c.id === cat.id ? updatedCat : c));
    setCatalogs(nextList);

    setMessage(isAlreadyInList ? `Removed from ${cat.name}` : `Added to ${cat.name}!`);
    setTimeout(() => setMessage(null), 2000);

    // Save directly in Neon PostgreSQL
    try {
      await saveUserCatalog(updatedCat);
      dispatchCatalogsUpdated(nextList);

      // ALWAYS ensure title is also registered in Main Watchlist when added to any folder
      if (!isAlreadyInList && !isInWatchlist(anime.mal_id)) {
        await addToWatchlist({
          animeId: anime.mal_id,
          title: anime.title,
          image: anime.image,
          status: 'PLAN_TO_WATCH',
          type: anime.format || 'Anime',
          mediaType: anime.format || 'Anime',
          rating: anime.score ? String(anime.score) : undefined,
        });
        dispatchWatchlistUpdated();
      }
    } catch {
      setMessage('Error saving to Neon DB');
    }
  };

  const handleCreateCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreating(true);
    const newCatalog: CatalogData = {
      id: `cat_${Date.now()}`,
      name: newListName.trim(),
      color: 'pink',
      thumbnail: 'Folder',
      itemIds: [anime.mal_id],
      custom: true,
    };

    try {
      const res = await saveUserCatalog(newCatalog);
      if (res.success) {
        const nextList = [newCatalog, ...catalogs];
        setCatalogs(nextList);
        setNewListName('');
        setShowCreateForm(false);
        dispatchCatalogsUpdated(nextList);

        // ALWAYS ensure it is also saved in Main Watchlist!
        if (!isInWatchlist(anime.mal_id)) {
          await addToWatchlist({
            animeId: anime.mal_id,
            title: anime.title,
            image: anime.image,
            status: 'PLAN_TO_WATCH',
            type: anime.format || 'Anime',
            mediaType: anime.format || 'Anime',
            rating: anime.score ? String(anime.score) : undefined,
          });
          dispatchWatchlistUpdated();
        }

        setMessage(`Created and added to ${newCatalog.name}!`);
        setTimeout(() => setMessage(null), 2500);
      } else {
        setMessage(res.error || 'Failed to create folder in Neon DB');
      }
    } catch {
      setMessage('Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e0f1d] border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2]">
            <ListPlus size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add to Custom Folder</h3>
            <p className="text-xs text-gray-400 truncate max-w-[260px]">{anime.title}</p>
          </div>
        </div>

        {/* Notification Message */}
        {message && (
          <div className="mb-4 text-xs font-bold py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-emerald-400 flex items-center gap-2">
            <Check size={14} />
            {message}
          </div>
        )}

        {/* Loading State - Prevents any login flash */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-[#ff4dd2]" />
            <p className="text-xs text-gray-400 font-medium">Loading your folders...</p>
          </div>
        ) : !isAuthed ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400 mb-4">Please log in to manage your custom folders.</p>
            <button
              onClick={() => {
                const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
                router.push(`/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
              }}
              className="bg-[#ff4dd2] text-black font-extrabold px-6 py-2 rounded-xl text-xs cursor-pointer hover:bg-[#ff7be0] transition-colors"
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Folder Selection List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 mb-4 custom-scrollbar">
              {catalogs.map((cat) => {
                const isWatchlist = cat.id === 'watchlist';
                const isInList = isWatchlist
                  ? isInWatchlist(anime.mal_id)
                  : cat.itemIds.map(String).includes(animeIdStr);
                const itemCount = isWatchlist
                  ? watchlist.length
                  : cat.itemIds.length;

                const IconComp =
                  cat.thumbnail && THUMBNAIL_ICONS[cat.thumbnail]
                    ? THUMBNAIL_ICONS[cat.thumbnail]
                    : Folder;

                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleItemInCatalog(cat)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isInList
                        ? 'bg-[#ff4dd2]/10 border-[#ff4dd2]/50 text-white shadow-md shadow-[#ff4dd2]/10'
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <span
                        className={`p-2 rounded-xl bg-white/5 border border-white/10 ${
                          isInList ? 'text-[#ff4dd2] border-[#ff4dd2]/30' : 'text-gray-400'
                        }`}
                      >
                        <IconComp size={16} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{cat.name}</p>
                        <span className="text-[10px] text-gray-500 mt-0.5 block">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                        isInList
                          ? 'bg-[#ff4dd2] border-[#ff4dd2] text-black'
                          : 'border-white/20 bg-black/40'
                      }`}
                    >
                      {isInList && <Check size={14} className="stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Create New Folder Accordion Form */}
            {showCreateForm ? (
              <form
                onSubmit={handleCreateCatalog}
                className="bg-[#15162c] border border-white/10 rounded-2xl p-4 mb-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FolderPlus size={14} className="text-[#ff4dd2]" /> Create a folder
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Folder name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masterpieces / Favorites"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating || !newListName.trim()}
                    className="w-full bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {creating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    Create and Add
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs font-bold text-[#ff4dd2] hover:text-white transition-all mb-4 cursor-pointer"
              >
                <Plus size={16} /> + New folder
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
