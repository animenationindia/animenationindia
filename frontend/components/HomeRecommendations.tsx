/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
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

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  {
    mal_id: 'rec-1',
    content: 'Both explore brilliant themes of mortality, legacy, and adventure with top-tier animation.',
    user: { username: 'FrierenFanatic' },
    entry: [
      {
        mal_id: 52991,
        title: "Frieren: Beyond Journey's End",
        url: 'https://myanimelist.net/anime/52991',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg' } }
      },
      {
        mal_id: 39535,
        title: 'Mushoku Tensei: Jobless Reincarnation',
        url: 'https://myanimelist.net/anime/39535',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1530/117776.jpg' } }
      }
    ]
  },
  {
    mal_id: 'rec-2',
    content: 'Sensational modern supernatural battles with exhilarating fights and gorgeous animation.',
    user: { username: 'GojoSensei' },
    entry: [
      {
        mal_id: 38000,
        title: 'Demon Slayer: Kimetsu no Yaiba',
        url: 'https://myanimelist.net/anime/38000',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg' } }
      },
      {
        mal_id: 40748,
        title: 'Jujutsu Kaisen',
        url: 'https://myanimelist.net/anime/40748',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg' } }
      }
    ]
  },
  {
    mal_id: 'rec-3',
    content: 'Intense psychological mind games where tactical genius protagonists battle against the world.',
    user: { username: 'KiraMaster' },
    entry: [
      {
        mal_id: 1535,
        title: 'Death Note',
        url: 'https://myanimelist.net/anime/1535',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/9/9453.jpg' } }
      },
      {
        mal_id: 1575,
        title: 'Code Geass: Lelouch of the Rebellion',
        url: 'https://myanimelist.net/anime/1575',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1032/135088.jpg' } }
      }
    ]
  },
  {
    mal_id: 'rec-4',
    content: 'Unstoppable hunter progression in gaming/dungeon environments filled with high-stakes action.',
    user: { username: 'ShadowMonarch' },
    entry: [
      {
        mal_id: 52299,
        title: 'Solo Leveling',
        url: 'https://myanimelist.net/anime/52299',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1547/140228.jpg' } }
      },
      {
        mal_id: 11757,
        title: 'Sword Art Online',
        url: 'https://myanimelist.net/anime/11757',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/11/39717.jpg' } }
      }
    ]
  },
  {
    mal_id: 'rec-5',
    content: 'Epic generational dark fantasy with jaw-dropping plot twists and relentless battles for freedom.',
    user: { username: 'ErenJaeger' },
    entry: [
      {
        mal_id: 16498,
        title: 'Attack on Titan',
        url: 'https://myanimelist.net/anime/16498',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg' } }
      },
      {
        mal_id: 37521,
        title: 'Vinland Saga',
        url: 'https://myanimelist.net/anime/37521',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1500/103005.jpg' } }
      }
    ]
  },
  {
    mal_id: 'rec-6',
    content: 'Dark, gritty, and visceral monster hunting with raw emotional depth and chaotic action.',
    user: { username: 'PochitaBFF' },
    entry: [
      {
        mal_id: 44511,
        title: 'Chainsaw Man',
        url: 'https://myanimelist.net/anime/44511',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1806/126216.jpg' } }
      },
      {
        mal_id: 46569,
        title: "Hell's Paradise: Jigokuraku",
        url: 'https://myanimelist.net/anime/46569',
        images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/1483/135249.jpg' } }
      }
    ]
  }
];

export default function HomeRecommendations() {
  const [recommendations] = useState<Recommendation[]>(DEFAULT_RECOMMENDATIONS);
  const loading = false;

  if (!loading && recommendations.length === 0) return null;

  return (
    <div className="w-full mb-10 group/section relative">
      <div className="flex items-end gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white tracking-wide drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">Recommended by users</h2>
        <Link href="/forums/recommendations" className="text-xs md:text-sm font-bold text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors mb-1 uppercase tracking-wider drop-shadow-md">
          Explore More
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48 border border-white/5 rounded-2xl bg-[#121326]/30">
          <div className="w-8 h-8 border-2 border-[#ff4dd2]/20 border-t-[#ff4dd2] rounded-full animate-spin"></div>
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
                    <div className="relative w-1/2 h-full overflow-hidden">
                      <img src={rec.entry[0].images.jpg.image_url} alt={rec.entry[0].title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-[#050716] border border-[#ff4dd2]/30 flex items-center justify-center text-white font-bold shadow-lg shadow-black/50">
                        <ArrowRight size={14} className="text-[#ff4dd2]" />
                      </div>
                    </div>
                    <div className="relative w-1/2 h-full overflow-hidden">
                      <img src={rec.entry[1].images.jpg.image_url} alt={rec.entry[1].title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                      Then you might like <span className="text-[#ff4dd2] font-semibold">{rec.entry[1].title}</span>
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
                    className="text-[#ff4dd2] text-[11px] font-bold hover:underline"
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
