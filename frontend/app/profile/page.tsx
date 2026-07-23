'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Bookmark, Clock, Star, PlayCircle, Shield, LogOut, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';
import { BACKEND_URL } from '../../lib/config';

interface WatchlistItem {
  id: number;
  user_id: string;
  anime_id: number;
  anime_title: string;
  anime_image: string;
  status: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
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
        });

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
            created_at: item.addedAt || item.created_at || new Date().toISOString()
          }));
          setWatchlist(mappedList);
        } else {
          console.error('Failed to fetch watchlist');
        }

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  const handleSignOut = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/auth');
  };

  if (loading || !user) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center text-[#ff4dd2] bg-[#050716]">
        <div className="w-12 h-12 border-4 border-[#ff4dd2]/30 border-t-[#ff4dd2] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(255, 77, 210,0.5)]" />
        <h2 className="font-bebas tracking-widest text-xl animate-pulse">Authenticating Profile...</h2>
      </div>
    );
  }

  const completedCount = watchlist.filter(i => i.status === 'COMPLETED').length;
  const watchingCount = watchlist.filter(i => i.status === 'WATCHING').length;
  const totalCount = watchlist.length;

  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Otaku';
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  return (
    <div className="bg-[#050716] min-h-screen pt-24 lg:pt-36 pb-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#ff4dd2]/20 to-transparent opacity-50 z-0"></div>
      
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1200px] relative z-10">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-12">
          <div className="relative group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#12131A] shadow-[0_0_30px_rgba(255, 77, 210,0.3)] bg-[#1A1C23] flex items-center justify-center">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="text-[#ff4dd2] text-5xl font-bebas uppercase">{username.substring(0, 2)}</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 md:bottom-2 md:right-2 w-5 h-5 bg-green-500 border-2 border-[#050716] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-5xl font-bebas tracking-widest text-white mb-2">{username}</h1>
            <p className="text-[#a0a0a0] font-medium flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4dd2]"></span> Member since {memberSince}
            </p>
          </div>

          <div className="flex gap-3 mt-4 md:mt-0">
            <Link href="/settings" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141519] border border-[#2A2B30] hover:border-[#ff4dd2] text-white font-semibold transition-all shadow-lg">
              <Settings size={18} className="text-[#ff4dd2]" />
              <span className="hidden sm:block">Edit Profile</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Links */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Quick Stats */}
            <div className="bg-[#121326]/80 backdrop-blur-xl border border-[#2A2B30]/50 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full inline-block shadow-[0_0_8px_rgba(255, 77, 210,0.6)]"></span>
                Library Stats
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#141519] rounded-xl p-4 border border-[#2A2B30]/30 text-center">
                  <PlayCircle size={24} className="text-[#ff4dd2] mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold text-white">{completedCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#a0a0a0] mt-1">Completed</p>
                </div>
                <div className="bg-[#141519] rounded-xl p-4 border border-[#2A2B30]/30 text-center">
                  <Clock size={24} className="text-[#ff4dd2] mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold text-white">{watchingCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#a0a0a0] mt-1">Watching</p>
                </div>
                <div className="bg-[#141519] rounded-xl p-4 border border-[#2A2B30]/30 text-center col-span-2">
                  <Bookmark size={24} className="text-[#F59E0B] mx-auto mb-2 opacity-80" />
                  <p className="text-2xl font-bold text-white">{totalCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#a0a0a0] mt-1">Total Saved</p>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="bg-[#121326]/80 backdrop-blur-xl border border-[#2A2B30]/50 rounded-2xl p-4 flex flex-col gap-1">
              <Link href="/watchlist" className="flex items-center justify-between p-4 rounded-xl hover:bg-[#1A1C23] text-gray-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-3 font-semibold">
                  <Bookmark size={20} className="text-[#ff4dd2] group-hover:scale-110 transition-transform" />
                  My Watchlist
                </div>
                <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/settings" className="flex items-center justify-between p-4 rounded-xl hover:bg-[#1A1C23] text-gray-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-3 font-semibold">
                  <Settings size={20} className="text-[#ff4dd2] group-hover:scale-110 transition-transform" />
                  Account Settings
                </div>
                <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/help" className="flex items-center justify-between p-4 rounded-xl hover:bg-[#1A1C23] text-gray-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-3 font-semibold">
                  <HelpCircle size={20} className="text-green-500 group-hover:scale-110 transition-transform" />
                  Help Center
                </div>
                <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/guidelines" className="flex items-center justify-between p-4 rounded-xl hover:bg-[#1A1C23] text-gray-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-3 font-semibold">
                  <Shield size={20} className="text-[#ff4dd2] group-hover:scale-110 transition-transform" />
                  Community Guidelines
                </div>
                <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
              
              <div className="h-px w-full bg-[#2A2B30]/50 my-2"></div>
              
              <button onClick={handleSignOut} className="flex items-center gap-3 p-4 rounded-xl hover:bg-red-500/10 text-red-400 font-semibold transition-colors text-left group">
                <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                Sign Out
              </button>
            </div>

          </div>

          {/* Right Column: Activity / Watchlist Preview */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Continue Watching / Recent Activity */}
            <div className="bg-[#121326]/80 backdrop-blur-xl border border-[#2A2B30]/50 rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full inline-block shadow-[0_0_8px_rgba(255, 77, 210,0.6)]"></span>
                  Recent Activity
                </h3>
                <Link href="/watchlist" className="text-sm font-semibold text-[#ff4dd2] hover:text-white transition-colors">
                  View All
                </Link>
              </div>

              {/* Real Activity List */}
              {watchlist.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                  <Bookmark size={40} className="mx-auto text-gray-600 mb-4" />
                  <p>You haven't saved any anime yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {watchlist.slice(0, 5).map((item) => (
                    <Link key={item.anime_id} href={`/series/${item.anime_id}`} className="flex items-center gap-4 bg-[#141519] p-4 rounded-xl border border-[#2A2B30]/30 hover:border-[#ff4dd2]/50 transition-colors group cursor-pointer">
                      <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 relative">
                        <img src={item.anime_image} alt={item.anime_title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-0 right-0 bg-black/80 px-1 py-0.5 text-[8px] font-bold text-[#ff4dd2] rounded-bl-md uppercase">
                          {item.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-base line-clamp-1 group-hover:text-[#ff4dd2] transition-colors">{item.anime_title}</h4>
                        <p className="text-[#a0a0a0] text-xs mt-2">Added on {new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="shrink-0 p-3 bg-white/5 rounded-full group-hover:bg-[#ff4dd2] group-hover:text-white transition-colors text-gray-400">
                        <PlayCircle size={20} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
