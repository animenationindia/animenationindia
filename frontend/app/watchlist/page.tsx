/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  BookmarkX, 
  Bookmark, 
  Heart, 
  ListPlus, 
  Plus, 
  X, 
  FolderPlus, 
  Play, 
  Pause,
  Star,
  Film,
  Music,
  Video,
  Volume2
} from 'lucide-react';
import { BACKEND_URL } from '../../lib/config';
import { useWatchlist } from '../../hooks/useWatchlist';

interface WatchlistItem {
  id?: number;
  mal_id?: number;
  user_id?: string;
  anime_id: number;
  anime_title?: string;
  anime_image?: string;
  title?: string;
  image?: string;
  status: string;
  created_at?: string;
  type?: string;
}

interface FavoriteItem {
  mal_id: number;
  title: string;
  title_english?: string;
  images?: any;
  type?: string;
  score?: number;
}

interface CustomList {
  _id: string;
  name: string;
  description: string;
  items: Array<{
    mal_id: number;
    title: string;
    image: string;
    format: string;
    score?: number;
  }>;
  createdAt: string;
}

interface SongPlaylistItem {
  _id: string;
  name: string;
  description: string;
  isFavorites: boolean;
  songs: Array<{
    songId: string;
    type: string;
    sequence: number;
    slug: string;
    songTitle: string;
    artists: string[];
    videoUrl: string;
    audioUrl: string;
    animeId?: number;
    animeTitle?: string;
    animeImage?: string;
    addedAt: string;
  }>;
  createdAt: string;
}

function WatchlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'watchlist';

  const [mainTab, setMainTab] = useState<'watchlist' | 'favorites' | 'custom-lists' | 'playlists'>(
    initialTab === 'favorites' ? 'favorites' : initialTab === 'custom-lists' ? 'custom-lists' : initialTab === 'playlists' ? 'playlists' : 'watchlist'
  );

  const { removeFromWatchlist: contextRemoveFromWatchlist } = useWatchlist();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [songPlaylists, setSongPlaylists] = useState<SongPlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Watchlist sub-filters
  const [activeType, setActiveType] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');

  // Custom List creation form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Song Playlist creation form state
  const [showCreateSongModal, setShowCreateSongModal] = useState(false);
  const [newSongPlaylistName, setNewSongPlaylistName] = useState('');
  const [newSongPlaylistDesc, setNewSongPlaylistDesc] = useState('');
  const [creatingSongPlaylist, setCreatingSongPlaylist] = useState(false);

  // Audio Playback state in Playlists tab
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'favorites') setMainTab('favorites');
    else if (tabParam === 'custom-lists') setMainTab('custom-lists');
    else if (tabParam === 'playlists') setMainTab('playlists');
    else if (tabParam === 'watchlist') setMainTab('watchlist');
  }, [searchParams]);

  useEffect(() => {
    const fetchAllUserData = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('user_token');
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('user_name');

        if (!token || !userId) {
          router.push('/auth');
          return;
        }

        setUser({ id: userId, username });

        // 1. Fetch Watchlist, Favorites, Custom Lists, and Song Playlists in Parallel
        const [wlRes, favRes, listsRes, songsRes] = await Promise.allSettled([
          fetch(`${BACKEND_URL}/api/watchlist/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/favorites/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/lists/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/api/song-playlists/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (wlRes.status === 'fulfilled' && wlRes.value.ok) {
          const wlData = await wlRes.value.json();
          setWatchlist(
            wlData.map((item: any) => ({
              id: item.mal_id || item.anime_id,
              user_id: userId,
              anime_id: item.mal_id || item.anime_id,
              anime_title: item.title_english || item.title || item.anime_title || 'Unknown Anime',
              anime_image: item.images?.webp?.large_image_url || item.anime_image || '',
              status: item.status || 'PLAN_TO_WATCH',
              created_at: item.addedAt || item.created_at || new Date().toISOString(),
              type: item.type || 'Anime',
            }))
          );
        }

        if (favRes.status === 'fulfilled' && favRes.value.ok) {
          const favData = await favRes.value.json();
          setFavorites(favData);
        }

        if (listsRes.status === 'fulfilled' && listsRes.value.ok) {
          const listsData = await listsRes.value.json();
          setCustomLists(listsData);
        }

        if (songsRes.status === 'fulfilled' && songsRes.value.ok) {
          const songsData = await songsRes.value.json();
          if (Array.isArray(songsData)) {
            setSongPlaylists(songsData);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllUserData();
  }, [router]);

  const handlePlaySong = (song: any) => {
    if (playingSongId === song.songId) {
      audioRef.current?.pause();
      setPlayingSongId(null);
    } else {
      setPlayingSongId(song.songId);
      if (audioRef.current) {
        audioRef.current.src = song.audioUrl || song.videoUrl;
        audioRef.current.play().catch(e => console.error('Play error:', e));
      }
    }
  };

  const handleCreateCustomList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    setCreating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDesc.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.list) {
        setCustomLists(prev => [data.list, ...prev]);
        setNewListName('');
        setNewListDesc('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Create list error:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateSongPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongPlaylistName.trim()) return;

    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    setCreatingSongPlaylist(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/song-playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSongPlaylistName.trim(),
          description: newSongPlaylistDesc.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.playlist) {
        setSongPlaylists(prev => [...prev, data.playlist]);
        setNewSongPlaylistName('');
        setNewSongPlaylistDesc('');
        setShowCreateSongModal(false);
      }
    } catch (err) {
      console.error('Create song playlist error:', err);
    } finally {
      setCreatingSongPlaylist(false);
    }
  };

  const handleDeleteSongPlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this song playlist?')) return;
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/song-playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSongPlaylists(prev => prev.filter(p => p._id !== playlistId));
      }
    } catch (err) {
      console.error('Delete song playlist error:', err);
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId: string, songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/song-playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSongPlaylists(prev => prev.map(p => {
          if (p._id === playlistId) {
            return { ...p, songs: p.songs.filter(s => s.songId !== String(songId)) };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Remove song error:', err);
    }
  };

  // Media Type & Status Helpers
  const getItemMediaType = (item: any): string => {
    const t = (item.type || item.format || '').toLowerCase();
    if (t.includes('manhwa') || t.includes('manhua')) return 'MANHWA';
    if (t.includes('novel') || t.includes('lightnovel') || t.includes('light novel')) return 'NOVEL';
    if (t.includes('manga')) return 'MANGA';
    return 'ANIME';
  };

  const getItemLink = (item: any): string => {
    const id = item.anime_id || item.mal_id || item.id;
    const mediaType = getItemMediaType(item);
    if (mediaType === 'MANGA' || mediaType === 'MANHWA' || mediaType === 'NOVEL') {
      return `/manga/${id}`;
    }
    return `/series/${id}`;
  };

  const getStatusDisplayLabel = (statusKey: string, mediaType: string) => {
    const isBook = mediaType === 'MANGA' || mediaType === 'MANHWA' || mediaType === 'NOVEL';
    if (statusKey === 'WATCHING') return isBook ? 'Reading' : 'Watching';
    if (statusKey === 'PLAN_TO_WATCH') return isBook ? 'Plan to Read' : 'Plan to Watch';
    if (statusKey === 'COMPLETED') return 'Completed';
    if (statusKey === 'ON_HOLD') return 'On Hold';
    if (statusKey === 'DROPPED') return 'Dropped';
    return statusKey.replace(/_/g, ' ');
  };

  const getStatusBadgeClass = (statusKey: string) => {
    if (statusKey === 'WATCHING') return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    if (statusKey === 'PLAN_TO_WATCH') return 'bg-sky-500/20 text-sky-300 border border-sky-500/40';
    if (statusKey === 'COMPLETED') return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
    if (statusKey === 'ON_HOLD') return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
    if (statusKey === 'DROPPED') return 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
    return 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40';
  };

  const getTypeBadgeClass = (mediaType: string) => {
    if (mediaType === 'MANGA') return 'bg-purple-600 text-white';
    if (mediaType === 'MANHWA') return 'bg-cyan-500 text-black font-black';
    if (mediaType === 'NOVEL') return 'bg-amber-500 text-black font-black';
    return 'bg-[#ff4dd2] text-black font-black';
  };

  const handleRemoveWatchlistItem = async (itemId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 1. Optimistically update local state on Watchlist page
    setWatchlist(prev => prev.filter(w => Number(w.anime_id || w.mal_id || w.id) !== itemId));

    // 2. Global context sync so navigating back or viewing details page is instantly in sync
    try {
      await contextRemoveFromWatchlist(itemId);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('watchlist-updated', { detail: { animeId: itemId, status: 'ADD' } }));
      }
    } catch (err) {
      console.error('Remove watchlist item error:', err);
    }
  };

  const handleRemoveFavoriteItem = async (favId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    const userId = localStorage.getItem('user_id');
    if (!token || !userId) return;

    setFavorites(prev => prev.filter((f: any) => (f.mal_id || f.id) !== favId));

    try {
      const res = await fetch(`${BACKEND_URL}/api/favorites/${userId}/${favId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('favorites-updated'));
      }
    } catch (err) {
      console.error('Remove favorite item error:', err);
    }
  };

  // Filtered lists
  const filteredWatchlist = watchlist.filter((item: any) => {
    const itemType = getItemMediaType(item);
    const itemStatus = item.status || 'PLAN_TO_WATCH';
    if (activeType !== 'ALL' && itemType !== activeType) return false;
    if (activeTab !== 'ALL' && itemStatus !== activeTab) return false;
    return true;
  });

  const filteredFavorites = favorites.filter((item: any) => {
    const itemType = getItemMediaType(item);
    if (activeType !== 'ALL' && itemType !== activeType) return false;
    return true;
  });

  const mediaTypes = ['ALL', 'ANIME', 'MANGA', 'MANHWA', 'NOVEL'];
  const statusOptions = [
    { key: 'ALL', label: 'All' },
    { key: 'WATCHING', label: 'Watching / Reading' },
    { key: 'PLAN_TO_WATCH', label: 'Plan to Watch / Read' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'ON_HOLD', label: 'On Hold' },
    { key: 'DROPPED', label: 'Dropped' },
  ];

  return (
    <main className="min-h-screen bg-[#050716] text-white pt-24 pb-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-[1500px]">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              My Library & Collections
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">
              Manage your anime watchlist, manga, manhwa, novels, custom lists & theme songs
            </p>
          </div>
        </div>

        {/* 🌟 4 Primary Tabs */}
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setMainTab('watchlist')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
              mainTab === 'watchlist'
                ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 font-black scale-105'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <Bookmark size={16} />
            <span>Watchlist / Library</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              mainTab === 'watchlist' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'
            }`}>
              {watchlist.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('favorites')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
              mainTab === 'favorites'
                ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 font-black scale-105'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <Heart size={16} />
            <span>Favorites</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              mainTab === 'favorites' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'
            }`}>
              {favorites.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('custom-lists')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
              mainTab === 'custom-lists'
                ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 font-black scale-105'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <ListPlus size={16} />
            <span>My Custom Lists</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              mainTab === 'custom-lists' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'
            }`}>
              {customLists.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('playlists')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
              mainTab === 'playlists'
                ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/20 font-black scale-105'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <Music size={16} />
            <span>My Playlists 🎵</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              mainTab === 'playlists' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-300'
            }`}>
              {songPlaylists.length}
            </span>
          </button>
        </div>

        {/* TAB 1: WATCHLIST / LIBRARY */}
        {mainTab === 'watchlist' && (
          <div className="space-y-6">
            {/* 1. Media Type Filter Pills (ALL, ANIME, MANGA, MANHWA, NOVEL) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 mr-1">Type:</span>
              {mediaTypes.map((t) => {
                const count = t === 'ALL'
                  ? watchlist.length
                  : watchlist.filter(item => getItemMediaType(item) === t).length;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeType === t
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                    }`}
                  >
                    <span>{t}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeType === t ? 'bg-black/15 text-black' : 'bg-white/10 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. Status Filter Sub-Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-white/5">
              {statusOptions.map((st) => {
                const count = st.key === 'ALL'
                  ? watchlist.filter(item => activeType === 'ALL' || getItemMediaType(item) === activeType).length
                  : watchlist.filter(item => (activeType === 'ALL' || getItemMediaType(item) === activeType) && (item.status || 'PLAN_TO_WATCH') === st.key).length;

                return (
                  <button
                    key={st.key}
                    onClick={() => setActiveTab(st.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                      activeTab === st.key
                        ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/50 font-extrabold'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-md text-gray-300">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. Items Grid */}
            {filteredWatchlist.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-sm bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                <Bookmark size={36} className="mx-auto text-gray-600 mb-3 opacity-50" />
                <p className="font-semibold text-gray-300">No items found in this section</p>
                <p className="text-xs text-gray-500 mt-1">Try switching filters or explore titles to add to your collection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredWatchlist.map((item) => {
                  const mediaType = getItemMediaType(item);
                  const statusKey = item.status || 'PLAN_TO_WATCH';
                  const link = getItemLink(item);
                  const itemId = Number(item.anime_id || item.mal_id || item.id);

                  return (
                    <Link
                      key={itemId}
                      href={link}
                      className="bg-[#0e0f1d] border border-white/5 rounded-2xl p-3 flex flex-col gap-2.5 hover:border-[#ff4dd2]/40 transition-all group relative"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121326]">
                        <img
                          src={item.anime_image || item.image || '/placeholder-poster.png'}
                          alt={item.anime_title || item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Top Left: Status Badge */}
                        <span className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md shadow-md ${getStatusBadgeClass(statusKey)}`}>
                          {getStatusDisplayLabel(statusKey, mediaType)}
                        </span>

                        {/* Top Right: Type Badge */}
                        <span className={`absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md ${getTypeBadgeClass(mediaType)}`}>
                          {mediaType}
                        </span>

                        {/* Hover Quick Remove Button */}
                        <button
                          onClick={(e) => handleRemoveWatchlistItem(itemId, e)}
                          title="Remove from List"
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-md shadow-md"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-[#ff4dd2] transition-colors">
                          {item.anime_title || item.title}
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {mediaType} • {getStatusDisplayLabel(statusKey, mediaType)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FAVORITES */}
        {mainTab === 'favorites' && (
          <div className="space-y-6">
            {/* Media Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 mr-1">Type:</span>
              {mediaTypes.map((t) => {
                const count = t === 'ALL'
                  ? favorites.length
                  : favorites.filter(item => getItemMediaType(item) === t).length;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeType === t
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                    }`}
                  >
                    <span>{t}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeType === t ? 'bg-black/15 text-black' : 'bg-white/10 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-sm bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                <Heart size={36} className="mx-auto text-rose-500 mb-3 opacity-50" />
                <p className="font-semibold text-gray-300">No favorites found in this category</p>
                <p className="text-xs text-gray-500 mt-1">Click the heart icon on any anime or manga page to favorite it!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredFavorites.map((item: any) => {
                  const id = item.mal_id || item.id;
                  const title = item.title_english || item.title || 'Anime';
                  const img = item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url || item.image || item.anime_image || '/placeholder-poster.png';
                  const mediaType = getItemMediaType(item);
                  const link = getItemLink(item);

                  return (
                    <Link
                      key={id}
                      href={link}
                      className="bg-[#0e0f1d] border border-white/5 rounded-2xl p-3 flex flex-col gap-2.5 hover:border-rose-500/50 transition-all group relative"
                    >
                      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121326]">
                        <img
                          src={img}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md">
                          <Heart size={11} className="fill-white" />
                        </span>
                        <span className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md ${getTypeBadgeClass(mediaType)}`}>
                          {mediaType}
                        </span>

                        {/* Hover Quick Remove Button */}
                        <button
                          onClick={(e) => handleRemoveFavoriteItem(id, e)}
                          title="Remove from Favorites"
                          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600 text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-md shadow-md"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                          {title}
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">{mediaType}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM ANIME LISTS */}
        {mainTab === 'custom-lists' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Your Custom Anime Lists</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all"
              >
                <Plus size={16} /> + New List
              </button>
            </div>

            {customLists.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-sm">
                No custom lists created yet. Click "+ New List" to build your first curated collection!
              </div>
            ) : (
              <div className="space-y-6">
                {customLists.map((list) => (
                  <div key={list._id} className="bg-[#0b0c20]/70 border border-white/5 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white">{list.name}</h3>
                        {list.description && <p className="text-xs text-gray-400 mt-0.5">{list.description}</p>}
                      </div>
                      <span className="text-xs text-[#ff4dd2] font-bold">{list.items?.length || 0} items</span>
                    </div>

                    {list.items && list.items.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {list.items.map((item) => (
                          <Link key={item.mal_id} href={`/series/${item.mal_id}`} className="group block">
                            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-black border border-white/5 group-hover:border-[#ff4dd2]/40">
                              <img src={item.image || '/placeholder-poster.png'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <p className="text-[11px] font-bold text-white truncate mt-1 group-hover:text-[#ff4dd2]">{item.title}</p>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No anime added to this list yet.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY PLAYLISTS (Anime Themes & Music) */}
        {mainTab === 'playlists' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Music size={20} className="text-[#ff4dd2]" /> Anime Song Playlists
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Play and manage all your saved anime opening and ending theme songs
                </p>
              </div>

              <button
                onClick={() => setShowCreateSongModal(true)}
                className="flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all"
              >
                <Plus size={16} /> + New Playlist
              </button>
            </div>

            {songPlaylists.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-sm">
                No theme song playlists yet. Visit any anime details page and click the Heart or Playlist icon on theme songs!
              </div>
            ) : (
              <div className="space-y-6">
                {songPlaylists.map((playlist) => (
                  <div key={playlist._id} className="bg-[#0b0c20]/70 border border-white/5 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${
                          playlist.isFavorites ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {playlist.isFavorites ? <Heart size={20} className="fill-rose-400" /> : <Music size={20} />}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            {playlist.name}
                            {playlist.isFavorites && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30 uppercase font-black">
                                Favorites
                              </span>
                            )}
                          </h3>
                          {playlist.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{playlist.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#ff4dd2]">{playlist.songs?.length || 0} tracks</span>
                        {!playlist.isFavorites && (
                          <button
                            onClick={() => handleDeleteSongPlaylist(playlist._id)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Playlist"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    {playlist.songs && playlist.songs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {playlist.songs.map((song) => {
                          const isPlaying = playingSongId === song.songId;
                          return (
                            <div
                              key={song.songId}
                              onClick={() => handlePlaySong(song)}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                                isPlaying
                                  ? 'bg-[#ff4dd2]/15 border-[#ff4dd2]/60'
                                  : 'bg-white/5 hover:bg-white/10 border-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                <button
                                  type="button"
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    isPlaying ? 'bg-[#ff4dd2] text-black shadow-md' : 'bg-white/10 text-white'
                                  }`}
                                >
                                  {isPlaying ? <Pause size={15} className="fill-current" /> : <Play size={15} className="fill-current ml-0.5" />}
                                </button>

                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{song.songTitle}</p>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {song.artists?.join(', ') || 'Artist'} • <span className="text-[#ff4dd2] font-semibold">{song.slug}</span>
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleRemoveSongFromPlaylist(playlist._id, song.songId, e)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Remove from playlist"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic py-2">No tracks saved in this playlist yet.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingSongId(null)}
      />

      {/* New Anime List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0c20] border border-[#ff4dd2]/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create New Custom List</h3>
            <form onSubmit={handleCreateCustomList} className="space-y-3">
              <input
                type="text"
                placeholder="List Name (e.g. Masterpiece Shonen)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={creating} className="flex-1 py-2 rounded-xl bg-[#ff4dd2] text-black font-extrabold text-xs">
                  Save List
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-2 rounded-xl bg-white/5 text-gray-400 text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Song Playlist Modal */}
      {showCreateSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b0c20] border border-[#ff4dd2]/30 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create Anime Song Playlist</h3>
            <form onSubmit={handleCreateSongPlaylist} className="space-y-3">
              <input
                type="text"
                placeholder="Playlist Name (e.g. Hype Openings)"
                value={newSongPlaylistName}
                onChange={(e) => setNewSongPlaylistName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newSongPlaylistDesc}
                onChange={(e) => setNewSongPlaylistDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
              />
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={creatingSongPlaylist} className="flex-1 py-2 rounded-xl bg-[#ff4dd2] text-black font-extrabold text-xs">
                  Save Playlist
                </button>
                <button type="button" onClick={() => setShowCreateSongModal(false)} className="px-3 py-2 rounded-xl bg-white/5 text-gray-400 text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050716] flex items-center justify-center text-white">
        Loading collections...
      </div>
    }>
      <WatchlistContent />
    </Suspense>
  );
}
