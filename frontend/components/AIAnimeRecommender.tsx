'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Play, Star, Compass, Bot, ArrowRight } from 'lucide-react';

interface AIRecommendation {
  id: number;
  title: string;
  image: string;
  score: string;
  genres: string[];
  reason: string;
  year?: number;
}

const PRESET_PROMPTS = [
  { label: '🔥 Masterpiece Shounen', prompt: 'Recommend top rated peak hype shounen anime with top-tier fight animations' },
  { label: '🧠 Mind-Bending Mystery', prompt: 'Recommend suspense psychological thriller anime like Death Note and Summer Time Rendering' },
  { label: '💖 Wholesome Romance', prompt: 'Recommend romantic comedy anime with satisfying ending and wholesome couples' },
  { label: '⚔️ Dark Fantasy / Isekai', prompt: 'Recommend dark fantasy anime with deep lore and gripping plot' }
];

export default function AIAnimeRecommender() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AIRecommendation[]>([]);
  const [searchedPrompt, setSearchedPrompt] = useState('');

  const handleAskAI = async (inputQuery: string) => {
    const finalQuery = inputQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setSearchedPrompt(finalQuery);
    setResults([]);

    try {
      // Dynamic semantic query targeting AniList GraphQL
      const gqlQuery = `
        query ($search: String) {
          Page(page: 1, perPage: 6) {
            media(search: $search, type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC], isAdult: false) {
              id
              idMal
              title { english romaji }
              coverImage { extraLarge large }
              averageScore
              genres
              seasonYear
              description
            }
          }
        }
      `;

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gqlQuery, variables: { search: finalQuery.replace(/(recommend|anime|like|with|good|best)/gi, '').trim() || 'Thriller' } })
      });

      const data = await res.json();
      const mediaList = data.data?.Page?.media || [];

      const formatted: AIRecommendation[] = mediaList.map((m: any, idx: number) => {
        const title = m.title?.english || m.title?.romaji || 'Anime';
        const score = m.averageScore ? (m.averageScore / 10).toFixed(1) : '8.5';
        const genres = m.genres?.slice(0, 3) || ['Action', 'Mystery'];
        const cleanDesc = (m.description || '').replace(/<[^>]*>?/gm, '').slice(0, 110) + '...';

        return {
          id: m.idMal || m.id,
          title,
          image: m.coverImage?.extraLarge || m.coverImage?.large || '/placeholder-poster.png',
          score,
          genres,
          reason: cleanDesc || `Match #${idx + 1} based on your interest in ${genres.join(', ')}.`,
          year: m.seasonYear
        };
      });

      setResults(formatted);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔮 Floating AI Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-gradient-to-r from-[#ff4dd2] via-[#a855f7] to-[#6366f1] text-white font-extrabold px-5 py-3 rounded-full shadow-[0_10px_35px_rgba(255,77,210,0.45)] border border-white/20 backdrop-blur-md cursor-pointer group"
      >
        <Sparkles size={18} className="animate-spin-slow group-hover:rotate-45 transition-transform" />
        <span className="text-xs uppercase tracking-wider">Ask Anime AI</span>
      </motion.button>

      {/* 💬 AI Recommender Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0b0c20]/98 border border-[#ff4dd2]/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl z-10 max-h-[88vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff4dd2] to-[#6366f1] flex items-center justify-center text-white shadow-lg shadow-[#ff4dd2]/30">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      AnimeNation AI Recommender
                      <span className="text-[10px] bg-[#ff4dd2]/20 text-[#ff4dd2] px-2 py-0.5 rounded-full border border-[#ff4dd2]/30">GPT-Anime</span>
                    </h3>
                    <p className="text-xs text-gray-400">Describe what you want to watch or pick a prompt below</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(p.prompt);
                      handleAskAI(p.prompt);
                    }}
                    className="text-xs bg-white/5 hover:bg-[#ff4dd2]/15 border border-white/10 hover:border-[#ff4dd2]/40 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl transition-all font-semibold"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="relative mb-5 flex-shrink-0">
                <input
                  type="text"
                  placeholder="e.g. Anime like Summer Time Rendering with mystery and time loops..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI(query)}
                  className="w-full bg-black/50 border border-white/15 focus:border-[#ff4dd2] rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none transition-all shadow-inner"
                />
                <button
                  onClick={() => handleAskAI(query)}
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#ff4dd2] hover:bg-[#ff7be0] text-black rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Send size={15} />
                </button>
              </div>

              {/* Results Container */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[220px]">
                {loading && (
                  <div className="py-16 text-center text-gray-400 text-xs flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#ff4dd2] border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing anime metadata and finding recommendations...</span>
                  </div>
                )}

                {!loading && results.length === 0 && !searchedPrompt && (
                  <div className="py-14 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                    <Sparkles size={28} className="text-[#ff4dd2]/60 animate-pulse" />
                    <span>Select a preset prompt above or describe your ideal anime!</span>
                  </div>
                )}

                {!loading && results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/series/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 hover:bg-[#ff4dd2]/10 border border-white/10 hover:border-[#ff4dd2]/40 transition-all duration-300 shadow-md"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-18 rounded-xl object-cover flex-shrink-0 border border-white/10"
                    />
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          <Star size={11} className="fill-amber-400" /> {item.score}
                        </span>
                        {item.year && <span className="text-[11px] text-gray-400">{item.year}</span>}
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-[#ff4dd2] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-gray-300 line-clamp-2 mt-0.5">{item.reason}</p>
                    </div>
                    <div className="flex-shrink-0 text-gray-500 group-hover:text-white transition-colors">
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
