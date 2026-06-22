'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecommendationEntry {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  title: string;
}

interface Recommendation {
  mal_id: string;
  entry: RecommendationEntry[];
  content: string;
  user: {
    username: string;
  };
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/recommendations/anime');
        const data = await res.json();
        setRecommendations(data.data || []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ffd54a]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-12">
          <Link href="/forums" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ffd54a] transition-colors mb-6 font-medium text-sm">
            <ArrowLeft size={16} /> Back to ANI Community
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#ff4dd2]/10 border border-[#ff4dd2]/20 rounded-2xl">
              <TrendingUp className="text-[#ff4dd2]" size={32} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] to-[#ffd54a] mb-2 uppercase tracking-tighter drop-shadow-lg">
                Anime Recommendations
              </h1>
              <p className="text-[#a0a0a0] font-medium">Discover what other users are recommending to watch next.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-[#ffd54a]/20 border-t-[#ffd54a] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <motion.div 
                key={`${rec.mal_id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-[#ff4dd2]/30 transition-all duration-300"
              >
                {/* Images */}
                <div className="flex w-full h-48 relative">
                  {rec.entry.length === 2 && (
                    <>
                      <div className="w-1/2 h-full overflow-hidden">
                        <img 
                          src={rec.entry[0].images.jpg.image_url} 
                          alt={rec.entry[0].title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-10 h-10 rounded-full bg-[#050716] border border-[#ffd54a]/30 flex items-center justify-center text-white font-bold shadow-lg shadow-black/50">
                          <ArrowRight size={18} className="text-[#ffd54a]" />
                        </div>
                      </div>
                      <div className="w-1/2 h-full overflow-hidden">
                        <img 
                          src={rec.entry[1].images.jpg.image_url} 
                          alt={rec.entry[1].title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    </>
                  )}
                  {rec.entry.length < 2 && (
                    <div className="w-full h-full bg-[#12121a] flex items-center justify-center text-gray-500">
                      Not enough data
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121326] via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Info */}
                <div className="p-6 flex-1 flex flex-col">
                  {rec.entry.length === 2 && (
                    <div className="mb-4">
                      <h3 className="text-white font-bold text-lg leading-snug line-clamp-2">
                        If you liked <span className="text-[#ff4dd2]">{rec.entry[0].title}</span>...
                      </h3>
                      <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                        Then you might like <span className="text-[#ffd54a] font-semibold">{rec.entry[1].title}</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Users size={14} className="text-[#f47521]" />
                      Recommended by <span className="text-white font-medium">{rec.user.username}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedRec(rec)}
                      className="text-[#ffd54a] text-xs font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Read full
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Full Recommendation */}
      {selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedRec(null)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-[#121326] border border-white/10 p-6 md:p-8 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl z-10"
          >
            <button 
              onClick={() => setSelectedRec(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl md:text-3xl font-black text-white mb-6 pr-8">
              If you liked <span className="text-[#ff4dd2]">{selectedRec.entry[0]?.title}</span>, you might like <span className="text-[#ffd54a]">{selectedRec.entry[1]?.title}</span>
            </h2>
            
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 pb-6 border-b border-white/10">
              <Users size={16} className="text-[#f47521]" />
              Recommended by <span className="text-white font-bold">{selectedRec.user.username}</span>
            </div>
            
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
              {selectedRec.content}
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
