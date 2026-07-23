'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MessageCircle, ThumbsUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  mal_id: number;
  user: {
    username: string;
    images: { jpg: { image_url: string; } };
  };
  entry: {
    mal_id: number;
    title: string;
    images: { jpg: { image_url: string; } };
  };
  review: string;
  score: number;
  date: string;
}

export default function HomeReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/reviews/anime');
        const data = await res.json();
        setReviews(data.data ? data.data.slice(0, 9) : []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (!loading && reviews.length === 0) return null;

  return (
    <div className="w-full mb-10 group/section relative mt-14">
      <div className="flex items-end gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
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
                    <Image 
                      src={review.user.images.jpg.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.username}`} 
                      alt={review.user.username} 
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{review.user.username}</h4>
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
                  <Image 
                    src={review.entry.images.jpg.image_url} 
                    alt={review.entry.title} 
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Reviewed</p>
                  <h3 className="text-white font-bold text-sm line-clamp-1">{review.entry.title}</h3>
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
