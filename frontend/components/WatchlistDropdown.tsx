'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, ChevronDown, Check, Loader2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BACKEND_URL } from '../lib/config'; 

interface WatchlistDropdownProps {
  animeId: number | string;
  title: string;
  image: string;
  variant?: 'default' | 'icon';
  type?: string;
}

export default function WatchlistDropdown({ animeId, title, image, variant = 'default', type = 'Anime' }: WatchlistDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('ADD'); 
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ১. পেজ লোড হওয়ার সময় ইউজার কি এই অ্যানিমেটা আগে থেকেই সেভ করে রেখেছে কি না তা চেক করা
  useEffect(() => {
    const fetchCurrentStatus = async () => {
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');
      if (token && userId) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/watchlist/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          if (response.ok) {
            const data = await response.json();
            const existing = data.find((item: any) => Number(item.mal_id || item.anime_id) === Number(animeId));
            if (existing) setStatus(existing.status || 'PLAN_TO_WATCH');
          }
        } catch {
          // ignore silent fail
        }
      }
    };
    fetchCurrentStatus();
  }, [animeId]);

  // বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হওয়ার লজিক
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚀 আসল REST API লজিক
  const updateStatus = async (newStatus: string) => {
    setIsLoading(true);
    setIsOpen(false);

    try {
      // ২. চেক করা ইউজার লগইন আছে কি না
      const token = localStorage.getItem('user_token');
      const userId = localStorage.getItem('user_id');
      
      if (!token || !userId) {
        alert("Please login first to manage your Watchlist!");
        router.push('/auth');
        return;
      }

      if (newStatus === 'REMOVE') {
        // ৩. ডেটাবেস থেকে রিমুভ করা
        const response = await fetch(`${BACKEND_URL}/api/watchlist/${userId}/${animeId}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (!response.ok) throw new Error('Failed to remove item');
        setStatus('ADD');
      } else {
        // ৪. ডেটাবেসে অ্যাড বা আপডেট করা
        const animePayload = {
          mal_id: Number(animeId),
          title: title,
          title_english: title,
          type: type,
          images: {
            webp: {
              large_image_url: image
            }
          },
          score: null,
          episodes: null,
          anime_id: Number(animeId),
          anime_title: title,
          anime_image: image,
          status: newStatus
        };

        const response = await fetch(`${BACKEND_URL}/api/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ anime: animePayload, userId })
        });

        if (!response.ok) throw new Error('Failed to save item');
        setStatus(newStatus);
      }
      
    } catch (error) {
      console.error('Error updating watchlist:', error);
      if (error instanceof Error) {
        alert("Error: " + error.message);
      } else {
        alert("An unexpected error occurred while updating the watchlist.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isBook = ['manga', 'novel', 'light novel', 'lightnovel', 'manhwa', 'manhua'].includes((type || '').toLowerCase());

  const getStatusLabel = (statusKey: string) => {
    if (statusKey === 'WATCHING') return isBook ? 'Reading' : 'Watching';
    if (statusKey === 'PLAN_TO_WATCH') return isBook ? 'Plan to Read' : 'Plan to Watch';
    if (statusKey === 'COMPLETED') return 'Completed';
    return statusKey.replace(/_/g, ' ');
  };

  const getButtonContent = () => {
    if (variant === 'icon') {
      if (isLoading) return <Loader2 size={18} className="animate-spin text-[#ff4dd2]" />;
      return <Bookmark size={18} className={`md:w-5 md:h-5 ${status !== 'ADD' ? 'fill-current text-[#ff4dd2]' : 'text-[#ff4dd2] group-hover/btn:fill-current'}`} />;
    }

    if (isLoading) return <><Loader2 size={18} className="animate-spin" /> Updating...</>;
    if (status === 'ADD') return <><Plus size={20} /> {isBook ? 'Add to List' : 'Add to Watchlist'}</>;
    return <><Check size={18} /> {getStatusLabel(status)}</>;
  };

  return (
    <div className={`relative ${variant === 'icon' ? 'w-auto' : 'w-full'}`} ref={dropdownRef}>
      {/* 🔴 Main Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={variant === 'icon'
          ? `w-[44px] h-[44px] md:w-[48px] md:h-[48px] flex-shrink-0 flex items-center justify-center border transition-colors group/btn rounded-sm disabled:opacity-70 cursor-pointer ${
              status !== 'ADD'
                ? 'border-[#ff4dd2] bg-[#ff4dd2]/10 text-[#ff4dd2] hover:bg-[#ff4dd2]/20'
                : 'border-[#ff4dd2] hover:bg-[#ff4dd2] hover:text-white'
            }`
          : `w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[15px] transition-all shadow-lg disabled:opacity-70 cursor-pointer ${
              status === 'ADD' 
                ? 'bg-neon-purple hover:bg-neon-purple/80 text-white shadow-neon-purple/20' 
                : 'bg-[#121214] border border-white/10 text-neon-purple hover:bg-[#1a1a1c]'
            }`
        }
      >
        {getButtonContent()}
        {variant !== 'icon' && status !== 'ADD' && <ChevronDown size={16} className={`ml-1 transition-transform ${isOpen ? 'rotate-180' : 'opacity-70'}`} />}
      </motion.button>

      {/* 🔽 Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute ${variant === 'icon' ? 'bottom-full left-0 mb-2 w-48' : 'top-full left-0 mt-2 w-full'} bg-[#121214] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl`}
          >
            <div className="flex flex-col">
              {['WATCHING', 'PLAN_TO_WATCH', 'COMPLETED'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => updateStatus(opt)}
                  className="w-full text-left px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/5 border-b border-white/5 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  {getStatusLabel(opt)}
                  {status === opt && <Check size={16} className={variant === 'icon' ? 'text-[#ff4dd2]' : 'text-neon-purple'} />}
                </button>
              ))}
              
              {/* ❌ Remove Option */}
              {status !== 'ADD' && (
                <button
                  onClick={() => updateStatus('REMOVE')}
                  className="w-full text-left px-5 py-3.5 text-sm font-semibold text-[#ff3b4b] hover:bg-[#ff3b4b]/10 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <X size={16} strokeWidth={3} /> Remove from List
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}