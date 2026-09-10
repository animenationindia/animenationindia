'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, ArrowRight, X, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecommendationPair {
  id: string;
  source: {
    id: number | string;
    title: string;
    image: string;
  };
  recommended: {
    id: number | string;
    title: string;
    image: string;
  };
  reason: string;
  user: {
    username: string;
    avatar: string;
  };
  likes: number;
}

const CURATED_COMMUNITY_RECOMMENDATIONS: RecommendationPair[] = [
  {
    id: 'rec-1',
    source: {
      id: 52991,
      title: 'Frieren: Beyond Journey\'s End',
      image: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg'
    },
    recommended: {
      id: 33352,
      title: 'Violet Evergarden',
      image: 'https://cdn.myanimelist.net/images/anime/1795/95088.jpg'
    },
    reason: 'Both shows explore deep emotional recovery, quiet contemplation of grief, and learning what it truly means to love someone after they are gone.',
    user: {
      username: 'AuraOtaku',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AuraOtaku'
    },
    likes: 128
  },
  {
    id: 'rec-2',
    source: {
      id: 16498,
      title: 'Attack on Titan',
      image: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg'
    },
    recommended: {
      id: 37521,
      title: 'Vinland Saga',
      image: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg'
    },
    reason: 'Dark, brutal historical epics dealing with revenge, war, freedom, and the tragic consequences of hatred across generations with flawless WIT Studio animation.',
    user: {
      username: 'LeviSquad_IN',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeviSquad'
    },
    likes: 95
  },
  {
    id: 'rec-3',
    source: {
      id: 40748,
      title: 'Jujutsu Kaisen',
      image: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg'
    },
    recommended: {
      id: 269,
      title: 'Bleach: Thousand-Year Blood War',
      image: 'https://cdn.myanimelist.net/images/anime/1908/120036.jpg'
    },
    reason: 'Gege Akutami was deeply influenced by Tite Kubo\'s style. Super high-octane cursed energy / spiritual pressure battles, stylish domain expansions, and top-tier urban supernatural vibes.',
    user: {
      username: 'GojoDomain',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GojoDomain'
    },
    likes: 84
  },
  {
    id: 'rec-4',
    source: {
      id: 1535,
      title: 'Death Note',
      image: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg'
    },
    recommended: {
      id: 1575,
      title: 'Code Geass: Lelouch of the Rebellion',
      image: 'https://cdn.myanimelist.net/images/anime/1032/135088.jpg'
    },
    reason: 'The ultimate clash of 200 IQ genius anti-heroes waging psychological warfare against global regimes with supernatural powers and grand chess-master masterminds.',
    user: {
      username: 'KiraVsZero',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=KiraVsZero'
    },
    likes: 142
  },
  {
    id: 'rec-5',
    source: {
      id: 51179,
      title: 'Solo Leveling',
      image: 'https://cdn.myanimelist.net/images/anime/1429/142340.jpg'
    },
    recommended: {
      id: 44511,
      title: 'Chainsaw Man',
      image: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg'
    },
    reason: 'Unapologetic, high-octane monster slaughter with intense dark fantasy elements, blood-pumping original soundtracks, and phenomenal cinematic battle sequences.',
    user: {
      username: 'ShadowSlayer',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowSlayer'
    },
    likes: 76
  },
  {
    id: 'rec-6',
    source: {
      id: 32281,
      title: 'Your Name.',
      image: 'https://cdn.myanimelist.net/images/anime/1935/127974.jpg'
    },
    recommended: {
      id: 38826,
      title: 'Weathering With You',
      image: 'https://cdn.myanimelist.net/images/anime/1880/101146.jpg'
    },
    reason: 'Makoto Shinkai\'s iconic visual romance masterpieces exploring cosmic connections, supernatural weather phenomenon in Tokyo, and unforgettable RADWIMPS soundtracks.',
    user: {
      username: 'ShinkaiVibes',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShinkaiVibes'
    },
    likes: 110
  }
];

export default function RecommendationsPage() {
  const [selectedRec, setSelectedRec] = useState<RecommendationPair | null>(null);

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-[#00f7ff]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-10">
          <Link 
            href="/forums" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff4dd2] transition-colors mb-6 font-medium text-sm"
          >
            <ArrowLeft size={16} /> Back to ANI Community Hub
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-[#ff4dd2]/20 to-[#00f7ff]/20 border border-[#ff4dd2]/30 rounded-2xl shadow-[0_0_20px_rgba(255,77,210,0.3)]">
                <TrendingUp className="text-[#ff4dd2]" size={32} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#00f7ff] mb-1">
                  <Sparkles size={13} />
                  <span>Curated Community Pairings</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_15px_rgba(255,77,210,0.4)]">
                  Anime <span className="text-[#ff4dd2]">Recommendations</span>
                </h1>
                <p className="text-[#a0a0a0] font-medium text-sm md:text-base">
                  Discover what other anime fans recommend watching next if you loved a specific series.
                </p>
              </div>
            </div>

            {/* Custom Recommendation Notice */}
            <div className="flex items-center gap-2 bg-[#0c0e22] border border-[#ff4dd2]/30 px-4 py-2.5 rounded-xl shadow-lg">
              <ShieldCheck size={18} className="text-[#00f7ff]" />
              <span className="text-xs font-semibold text-gray-300">
                User Recommendation Engine <span className="text-[#ff4dd2] font-bold">• In Development</span>
              </span>
            </div>
          </div>
        </div>

        {/* Feature Notice Banner */}
        <div className="mb-10 bg-gradient-to-r from-[#12142e] via-[#1a1b38] to-[#12142e] border border-[#ff4dd2]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff4dd2]/20 text-[#ff4dd2] text-xs font-bold uppercase tracking-wider mb-2 border border-[#ff4dd2]/30">
                <Users size={12} />
                <span>Otaku Recommendation Pairs</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                "If You Liked A, You'll Love B" Community Pairs
              </h3>
              <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
                We are designing an in-house anime pairing submission tool. Registered members will be able to create match-ups, write comparison rationales, and vote on community suggestions!
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link 
                href="/trending"
                className="px-5 py-2.5 rounded-full bg-[#ff4dd2] hover:bg-[#ff2bb5] text-white font-bold text-sm shadow-[0_0_15px_rgba(255,77,210,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Compass size={16} />
                <span>Explore Trending</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CURATED_COMMUNITY_RECOMMENDATIONS.map((rec, index) => (
            <motion.div 
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-[#0e1024]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col group hover:border-[#ff4dd2]/50 hover:shadow-[0_0_25px_rgba(255,77,210,0.25)] transition-all duration-300"
            >
              {/* Anime Image Matchup */}
              <div className="flex w-full h-48 relative bg-black/50">
                <div className="w-1/2 h-full overflow-hidden relative">
                  <img 
                    src={rec.source.image} 
                    alt={rec.source.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/60 to-transparent">
                    <span className="text-[10px] text-gray-300 font-bold line-clamp-1">{rec.source.title}</span>
                  </div>
                </div>

                {/* Arrow Center Badge */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-[#050716] border border-[#ff4dd2] flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(255,77,210,0.5)]">
                    <ArrowRight size={18} className="text-[#ff4dd2]" />
                  </div>
                </div>

                <div className="w-1/2 h-full overflow-hidden relative">
                  <img 
                    src={rec.recommended.image} 
                    alt={rec.recommended.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/60 to-transparent">
                    <span className="text-[10px] text-[#00f7ff] font-bold line-clamp-1">{rec.recommended.title}</span>
                  </div>
                </div>
              </div>

              {/* Information Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-white font-bold text-sm sm:text-base leading-snug line-clamp-2">
                    If you liked <span className="text-[#ff4dd2]">{rec.source.title}</span>...
                  </h3>
                  <p className="text-gray-300 text-xs mt-1.5 line-clamp-2">
                    Try watching <span className="text-[#00f7ff] font-semibold">{rec.recommended.title}</span>
                  </p>
                </div>
                
                <div className="pt-3.5 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <img src={rec.user.avatar} alt={rec.user.username} className="w-5 h-5 rounded-full bg-white/10" />
                    <span className="text-gray-300 font-medium">{rec.user.username}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedRec(rec)}
                    className="text-[#ff4dd2] hover:text-white transition-colors font-bold cursor-pointer bg-transparent border-none p-0 text-xs"
                  >
                    Read rationale →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal for Full Recommendation Details */}
      <AnimatePresence>
        {selectedRec && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
              onClick={() => setSelectedRec(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#0c0e22] border border-[#ff4dd2]/30 p-6 md:p-8 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-[0_0_50px_rgba(255,77,210,0.2)] z-10"
            >
              <button 
                onClick={() => setSelectedRec(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <h2 className="text-xl md:text-2xl font-black text-white mb-4 pr-8">
                If you liked <span className="text-[#ff4dd2]">{selectedRec.source.title}</span>, you will love <span className="text-[#00f7ff]">{selectedRec.recommended.title}</span>
              </h2>
              
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-5 pb-4 border-b border-white/10">
                <img src={selectedRec.user.avatar} alt={selectedRec.user.username} className="w-6 h-6 rounded-full" />
                <span>Pairing submitted by <strong className="text-white">{selectedRec.user.username}</strong></span>
              </div>
              
              <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-6">
                {selectedRec.reason}
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <Link
                  href={`/series/${selectedRec.source.id}`}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/10"
                >
                  View {selectedRec.source.title}
                </Link>
                <Link
                  href={`/series/${selectedRec.recommended.id}`}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-[#ff4dd2]/20 hover:bg-[#ff4dd2] text-[#ff4dd2] hover:text-white transition-colors border border-[#ff4dd2]/30 font-semibold"
                >
                  View {selectedRec.recommended.title}
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

