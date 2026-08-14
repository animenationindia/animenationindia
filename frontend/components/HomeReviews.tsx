/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, MessageCircle, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BACKEND_URL } from '../lib/config';

interface HomeReview {
  mal_id: number;
  url: string;
  type: string;
  reactions: {
    overall: number;
    nice: number;
    love_it: number;
    funny: number;
    confused: number;
    informative: number;
    well_written: number;
    creative: number;
  };
  date: string;
  review: string;
  score: number;
  tags: string[];
  is_spoiler: boolean;
  is_premature: boolean;
  episodes_watched: number | null;
  entry: {
    mal_id: number;
    url: string;
    images: {
      jpg: {
        image_url: string;
        small_image_url: string;
        large_image_url: string;
      };
    };
    title: string;
  };
  user: {
    url: string;
    username: string;
    images: {
      jpg: {
        image_url: string;
      };
    };
  };
}

export default function HomeReviews() {
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/reviews?limit=3`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setReviews(data.data);
            return;
          }
        }

        // Fallback to Jikan public anime reviews if local backend is offline
        const jikanRes = await fetch('https://api.jikan.moe/v4/reviews/anime').catch(() => null);
        if (jikanRes && jikanRes.ok) {
          const jikanData = await jikanRes.json();
          if (jikanData.data && jikanData.data.length > 0) {
            setReviews(jikanData.data.slice(0, 3));
          }
        }
      } catch {
        // Graceful silent fallback
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  if (!loading && reviews.length === 0) return null;

  return (
    <div className="w-full my-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide flex items-center gap-2">
          <MessageCircle className="text-[#ff4dd2]" /> Community Reviews
        </h2>
        <Link href="/reviews" className="text-xs md:text-sm font-bold text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors mb-1 uppercase tracking-wider drop-shadow-md">
          View More
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 border border-white/5 rounded-2xl bg-[#121326]/30">
          <div className="w-8 h-8 border-2 border-[#ff4dd2]/20 border-t-[#ff4dd2] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <motion.div 
              key={`${review.mal_id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col group hover:border-[#ff4dd2]/30 transition-all duration-300"
            >
              {/* Header: User and Score */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                    <img src={review.user?.images?.jpg?.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user?.username}`} alt={review.user?.username || 'User'} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{review.user?.username}</h4>
                    <p className="text-gray-500 text-xs">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#ff4dd2]/10 px-2 py-1 rounded text-[#ff4dd2] font-bold text-xs border border-[#ff4dd2]/20">
                  <Star size={12} className="fill-[#ff4dd2]" />
                  {review.score}/10
                </div>
              </div>

              {/* Anime Info */}
              <div className="flex items-center gap-3 mb-4 bg-white/5 p-2 rounded-lg">
                <div className="relative w-10 h-14 rounded overflow-hidden shadow-md shrink-0">
                  <img src={review.entry?.images?.jpg?.image_url} alt={review.entry?.title || 'Anime'} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Reviewed</p>
                  <h3 className="text-white font-bold text-sm line-clamp-1">{review.entry?.title}</h3>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-300 text-sm line-clamp-4 leading-relaxed mb-4 flex-1">
                {review.review}
              </p>

              {/* Read Full */}
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <Link 
                  href="/reviews"
                  className="text-[#ff4dd2] text-xs font-bold hover:underline"
                >
                  Read full review
                </Link>
                <ThumbsUp size={14} className="text-gray-500 hover:text-white transition-colors cursor-pointer" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
