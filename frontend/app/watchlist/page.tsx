'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, BookmarkX } from 'lucide-react';
import { BACKEND_URL } from '../../lib/config';

interface WatchlistItem {
  id: number;
  user_id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string;
  status: string;
  created_at?: string;
  type?: string;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeType, setActiveType] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');
  
  const router = useRouter();

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const token = localStorage.getItem('user_token');
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('user_name');
        
        if (!token || !userId) {
          router.push('/auth');
          return;
        }
        
        setUser({
          id: userId,
          email: '',
          user_metadata: {
            full_name: username || 'Otaku',
            avatar_url: null
          }
        } as any);

        const response = await fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
          const data = await response.json();
          const mappedList = data.map((item: any) => ({
            id: item.mal_id || item.anime_id,
            user_id: userId,
            anime_id: item.mal_id || item.anime_id,
            anime_title: item.title_english || item.title || item.anime_title || 'Unknown Anime',
            anime_image: item.images?.webp?.large_image_url || item.anime_image || '',
            status: item.status || 'PLAN_TO_WATCH',
            created_at: item.addedAt || item.created_at || new Date().toISOString(),
            type: item.type || 'Anime'
          }));
          setWatchlist(mappedList);
        } else {
          console.error('Failed to fetch watchlist');
        }

      } catch (error) {
        console.error('Error fetching watchlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [router]);

  const handleRemove = async (animeId: number, e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!user) return;

    const token = localStorage.getItem('user_token');
    if (!token) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/watchlist/${user.id}/${animeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      if (!response.ok) throw new Error('Failed to remove item');
      
      setWatchlist(watchlist.filter(item => item.anime_id !== animeId));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const normalizeType = (type: string | undefined) => {
    const t = (type || 'Anime').toLowerCase().replace(/\s+/g, '');
    if (t === 'lightnovel') return 'LIGHT_NOVEL';
    return t.toUpperCase();
  };

  const typeFilteredList = activeType === 'ALL'
    ? watchlist
    : watchlist.filter(item => normalizeType(item.type) === activeType);

  const filteredWatchlist = activeTab === 'ALL'
    ? typeFilteredList
    : typeFilteredList.filter(item => item.status === activeTab);

  const typeTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'ANIME', label: 'Anime' },
    { id: 'MANGA', label: 'Manga' },
    { id: 'MANHWA', label: 'Manhwa' },
    { id: 'LIGHT_NOVEL', label: 'Light Novel' },
    { id: 'NOVEL', label: 'Novel' },
  ];

  const statusTabs = [
    { id: 'ALL', getLabel: (isBook: boolean) => 'ALL' },
    { id: 'WATCHING', getLabel: (isBook: boolean) => isBook ? 'READING' : 'WATCHING' },
    { id: 'PLAN_TO_WATCH', getLabel: (isBook: boolean) => isBook ? 'PLAN TO READ' : 'PLAN TO WATCH' },
    { id: 'COMPLETED', getLabel: (isBook: boolean) => 'COMPLETED' },
  ];

  const getTypeCount = (typeId: string) => {
    if (typeId === 'ALL') return watchlist.length;
    return watchlist.filter(item => normalizeType(item.type) === typeId).length;
  };

  const getStatusCount = (statusId: string) => {
    if (statusId === 'ALL') return typeFilteredList.length;
    return typeFilteredList.filter(item => item.status === statusId).length;
  };

  const getDetailsLink = (item: WatchlistItem) => {
    const isBook = ['manga', 'novel', 'light novel', 'lightnovel', 'manhwa', 'manhua'].includes((item.type || '').toLowerCase());
    return isBook ? `/manga/${item.anime_id}` : `/series/${item.anime_id}`;
  };

  const isBookType = (type: string) => {
    return ['manga', 'novel', 'light novel', 'lightnovel', 'manhwa', 'manhua'].includes((type || '').toLowerCase());
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-[#050716] pt-12 md:pt-32 lg:pt-36 pb-20 px-4 selection:bg-[#ff4dd2] selection:text-white"
    >
      <div className="container mx-auto max-w-[1400px]">
        
        {/* 🏷️ Header Section */}
        <div className="border-b border-[#ff4dd2]/20 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
              My <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Watchlist</span>
            </h1>
            <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
              Your personal collection securely saved in the cloud.
            </p>
          </div>
          <div className="bg-[#121326] border border-white/10 px-5 py-2 rounded-xl text-sm text-white flex items-center gap-1.5 font-bold shadow-lg">
            Total Items: <span className="text-[#ff4dd2] font-black">{watchlist.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col justify-center items-center">
            <svg className="animate-spin h-10 w-10 text-[#ff4dd2] mb-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="3" r="2.2" className="opacity-100" />
              <circle cx="18.36" cy="5.64" r="2.2" className="opacity-85" />
              <circle cx="21" cy="12" r="2.2" className="opacity-70" />
              <circle cx="18.36" cy="18.36" r="2.2" className="opacity-55" />
              <circle cx="12" cy="21" r="2.2" className="opacity-40" />
              <circle cx="5.64" cy="18.36" r="2.2" className="opacity-25" />
              <circle cx="3" cy="12" r="2.2" className="opacity-15" />
              <circle cx="5.64" cy="5.64" r="2.2" className="opacity-10" />
            </svg>
            <p className="text-gray-400 font-medium text-base animate-pulse">Loading your collection...</p>
          </div>
        ) : (
          <>
            {/* 🌟 Type Tabs Section */}
            <div className="flex gap-2.5 mb-5 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {typeTabs.map(tab => {
                const count = getTypeCount(tab.id);
                const isActive = activeType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveType(tab.id);
                      setActiveTab('ALL'); // Reset status tab to ALL on type change
                    }}
                    className={`snap-start px-5 py-2.5 rounded-full font-bold text-xs md:text-sm whitespace-nowrap transition-all uppercase tracking-wider cursor-pointer border ${
                      isActive 
                        ? 'bg-[#ffd54a] text-[#050716] shadow-[0_0_15px_rgba(255,213,74,0.4)] border-[#ffd54a]' 
                        : 'bg-[#121326]/50 text-gray-400 hover:text-white border-white/5 hover:border-[#ffd54a]/30'
                    }`}
                  >
                    {tab.label} <span className="opacity-60 ml-1">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* 🌟 Status Tabs Section */}
            <div className="flex gap-2.5 mb-10 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {statusTabs.map(tab => {
                const count = getStatusCount(tab.id);
                const isActive = activeTab === tab.id;
                const isBook = ['MANGA', 'MANHWA', 'LIGHT_NOVEL', 'NOVEL'].includes(activeType);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`snap-start px-5 py-2.5 rounded-full font-bold text-xs md:text-sm whitespace-nowrap transition-all uppercase tracking-wider cursor-pointer border ${
                      isActive 
                        ? 'bg-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210, 0.5)] border-[#ff4dd2]' 
                        : 'bg-[#121326]/50 text-gray-400 hover:text-white border-[#ff4dd2]/20 hover:border-[#ffd54a]/50 hover:shadow-[0_0_10px_rgba(255, 213, 74, 0.3)]'
                    }`}
                  >
                    {tab.getLabel(isBook)} <span className="opacity-60 ml-1">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* 📭 Empty State */}
            {filteredWatchlist.length === 0 ? (
              <div className="text-center mt-20 p-10 bg-[#121326]/30 backdrop-blur-md rounded-3xl border border-[#ff4dd2]/20 shadow-[0_0_30px_rgba(255, 77, 210, 0.05)] max-w-4xl mx-auto">
                <BookmarkX size={64} className="mx-auto text-[#ffd54a]/50 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2 uppercase">Your list is looking empty</h2>
                <p className="text-gray-400">
                  {activeType === 'ALL' && activeTab === 'ALL' 
                    ? 'Start adding some amazing anime, manga, or novels to your watchlist!' 
                    : `No items found matching the selected filters.`
                  }
                </p>
              </div>
            ) : (
              /* 🎬 Grid Layout */
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
                <AnimatePresence>
                  {filteredWatchlist.map((item) => {
                    const isBook = isBookType(item.type || '');
                    return (
                      <motion.div
                        key={item.anime_id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="group relative bg-[#121326] rounded-xl overflow-hidden border border-[#ff4dd2]/20 shadow-lg flex flex-col transition-all duration-300 hover:border-[#ffd54a]/50 hover:shadow-[0_0_20px_rgba(255, 213, 74, 0.4)]"
                      >
                        {/* 🏷️ Status Badge */}
                        <div className="absolute top-2 left-2 bg-[#050716]/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-black text-[#ffd54a] uppercase tracking-widest z-20 border border-[#ffd54a]/30 shadow-[0_0_10px_rgba(255, 213, 74, 0.3)]">
                          {item.status ? (isBook && item.status === 'WATCHING' ? 'READING' : isBook && item.status === 'PLAN_TO_WATCH' ? 'PLAN TO READ' : item.status.replace(/_/g, ' ')) : 'SAVED'}
                        </div>

                        {/* 🏷️ Type Badge */}
                        {item.type && item.type.toUpperCase() !== 'ANIME' && (
                          <div className="absolute top-9 left-2 bg-[#ff4dd2]/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-widest z-20 border border-[#ff4dd2]/30 shadow-[0_0_10px_rgba(255, 77, 210, 0.3)]">
                            {item.type}
                          </div>
                        )}

                        {/* ❌ Remove Button */}
                        <button
                          onClick={(e) => handleRemove(item.anime_id, e)}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 hover:shadow-[0_0_10px_rgba(239,68,68,0.8)] text-gray-300 hover:text-white p-1.5 rounded-full z-20 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 backdrop-blur-md cursor-pointer border border-transparent hover:border-red-400"
                          title="Remove from list"
                        >
                          <Trash2 size={14} />
                        </button>

                        <Link href={getDetailsLink(item)} className="block relative w-full aspect-[2/3] overflow-hidden cursor-pointer">
                          <Image 
                            src={item.anime_image} 
                            alt={item.anime_title} 
                            fill 
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                        
                        <Link href={getDetailsLink(item)} className="p-3 cursor-pointer z-10 bg-[#121326] flex-grow flex flex-col justify-between">
                          <h3 className="text-white text-xs md:text-sm font-bold line-clamp-2 leading-snug group-hover:text-[#ff4dd2] transition-colors drop-shadow-md">
                            {item.anime_title}
                          </h3>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

      </div>
    </motion.div>
  );
}

