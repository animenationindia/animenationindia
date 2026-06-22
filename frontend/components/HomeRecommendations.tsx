'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';

interface RecommendationEntry {
  mal_id: number;
  url: string;
  images: { jpg: { image_url: string; }; };
  title: string;
}

interface Recommendation {
  mal_id: string;
  entry: RecommendationEntry[];
  content: string;
  user: { username: string; };
}

export default function HomeRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/recommendations/anime');
        const data = await res.json();
        setRecommendations(data.data ? data.data.slice(0, 6) : []);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (!loading && recommendations.length === 0) return null;

  return (
    <div className="w-full mb-10 group/section relative">
      <div className="flex items-end gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Recommended by users</h2>
        <Link href="/forums/recommendations" className="text-xs md:text-sm font-bold text-[#a0a0a0] hover:text-[#ffd54a] transition-colors mb-1 uppercase tracking-wider drop-shadow-md">
          Explore More
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 border border-white/5 rounded-2xl bg-[#121326]/30">
          <div className="w-8 h-8 border-2 border-[#ffd54a]/20 border-t-[#ffd54a] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => (
            <div 
              key={`${rec.mal_id}-${index}`}
              className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-[#ff4dd2]/30 transition-all duration-300"
            >
              {/* Images */}
              <div className="flex w-full h-40 relative">
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
                      <div className="w-8 h-8 rounded-full bg-[#050716] border border-[#ffd54a]/30 flex items-center justify-center text-white font-bold shadow-lg shadow-black/50">
                        <ArrowRight size={14} className="text-[#ffd54a]" />
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
              <div className="p-4 flex-1 flex flex-col">
                {rec.entry.length === 2 && (
                  <div className="mb-3">
                    <h3 className="text-white font-bold text-sm leading-snug line-clamp-2">
                      If you liked <span className="text-[#ff4dd2]">{rec.entry[0].title}</span>...
                    </h3>
                    <p className="text-gray-300 text-xs mt-1 line-clamp-1">
                      Then you might like <span className="text-[#ffd54a] font-semibold">{rec.entry[1].title}</span>
                    </p>
                  </div>
                )}
                
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Users size={12} className="text-[#f47521]" />
                    By <span className="text-white font-medium truncate max-w-[100px]">{rec.user.username}</span>
                  </div>
                  <Link 
                    href="/forums/recommendations"
                    className="text-[#ffd54a] text-[11px] font-bold hover:underline"
                  >
                    Read full
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
