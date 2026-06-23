'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Star, ThumbsUp } from 'lucide-react';
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/reviews/anime');
        const data = await res.json();
        setReviews(data.data || []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-12">
          <Link href="/home" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff4dd2] transition-colors mb-6 font-medium text-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#ff4dd2]/10 border border-[#ff4dd2]/20 rounded-2xl">
              <MessageCircle className="text-[#ff4dd2]" size={32} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
                Community <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Reviews</span>
              </h1>
              <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
                Hear from the Otaku community. Raw, unbiased reviews and ratings for currently airing and classic anime.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#ff4dd2]/20 border-t-[#ff4dd2] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <motion.div 
                key={`${review.mal_id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col group hover:border-[#ff4dd2]/30 transition-all duration-300"
              >
                {/* Header: User and Score */}
                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={review.user.images.jpg.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.username}`} 
                      alt={review.user.username} 
                      className="w-12 h-12 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                      <h4 className="text-white font-bold">{review.user.username}</h4>
                      <p className="text-gray-500 text-xs">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#ff4dd2]/10 px-2 py-1 rounded text-[#ff4dd2] font-bold text-sm border border-[#ff4dd2]/20">
                    <Star size={14} className="fill-[#ff4dd2]" />
                    {review.score}/10
                  </div>
                </div>

                {/* Anime Info */}
                <div className="flex items-center gap-4 mb-5 bg-white/5 p-3 rounded-xl border border-white/5 group-hover:border-[#ff4dd2]/20 transition-colors">
                  <img 
                    src={review.entry.images.jpg.image_url} 
                    alt={review.entry.title} 
                    className="w-12 h-16 object-cover rounded shadow-md"
                  />
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Reviewing</p>
                    <h3 className="text-white font-bold text-base line-clamp-2">{review.entry.title}</h3>
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-gray-300 text-sm leading-relaxed mb-6 flex-1 whitespace-pre-wrap">
                  {review.review}
                </p>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-gray-400">
                  <div className="flex items-center gap-1.5 text-xs">
                    <ThumbsUp size={14} /> Helpful
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
