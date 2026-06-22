'use client';

import { useState, useEffect } from 'react';
import AnimeCard from '../../components/AnimeCard';
import Pagination from '../../components/Pagination';
import { Loader2, Calendar, ChevronDown, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => 2013 + i).reverse(); // 2027 down to 2013
const SEASONS = ['winter', 'spring', 'summer', 'fall'];

export default function SimulcastClient() {
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [season, setSeason] = useState<string>(getCurrentSeasonName());
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastPage, setLastPage] = useState<number>(1);
  
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);

  function getCurrentSeasonName() {
    const month = new Date().getMonth();
    if (month >= 0 && month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  useEffect(() => {
    const fetchSeasonalAnime = async () => {
      setLoading(true);
      try {
        const query = `
          query ($season: MediaSeason, $seasonYear: Int, $page: Int) {
            Page(page: $page, perPage: 24) {
              pageInfo {
                lastPage
              }
              media(season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
                id
                idMal
                title {
                  romaji
                  english
                }
                coverImage {
                  large
                }
                format
                status
                episodes
                genres
                seasonYear
                description
                averageScore
              }
            }
          }
        `;

        const response = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: {
              season: season.toUpperCase(),
              seasonYear: year,
              page
            }
          })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const json = await response.json();
        
        setData(json.data?.Page?.media || []);
        setLastPage(json.data?.Page?.pageInfo?.lastPage || 1);
      } catch (error) {
        console.error("Failed to fetch seasonal anime from AniList:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    // Add slight delay to avoid rate limiting when quickly clicking
    const delayDebounceFn = setTimeout(() => {
      fetchSeasonalAnime();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [year, season, page]);

  return (
    <div className="bg-[#050716] min-h-screen pt-32 lg:pt-36 lg:pt-36 pb-12">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px]">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
              Simulcast <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">Season</span>
            </h1>
            <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
              Journey through anime history. Explore seasonal releases and discover how the anime landscape has evolved from {YEARS[YEARS.length-1]} to {YEARS[0]}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Dropdown */}
            <div className="relative z-30">
              <button 
                onClick={() => {
                  setIsYearDropdownOpen(!isYearDropdownOpen);
                  setIsSeasonDropdownOpen(false);
                }}
                className="flex items-center gap-2 bg-[#1A1A24] border border-white/10 hover:border-[#ff4dd2]/50 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg min-w-[120px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#ff4dd2]" />
                  {year}
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isYearDropdownOpen ? 'rotate-180 text-[#ff4dd2]' : 'text-gray-400'}`} />
              </button>
              
              <AnimatePresence>
                {isYearDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-full max-h-[300px] overflow-y-auto bg-[#121326] border border-white/10 rounded-lg shadow-xl custom-scrollbar"
                  >
                    {YEARS.map(y => (
                      <button 
                        key={y}
                        onClick={() => { setYear(y); setPage(1); setIsYearDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${year === y ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                      >
                        {y}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Season Dropdown */}
            <div className="relative z-20">
              <button 
                onClick={() => {
                  setIsSeasonDropdownOpen(!isSeasonDropdownOpen);
                  setIsYearDropdownOpen(false);
                }}
                className="flex items-center gap-2 bg-[#1A1A24] border border-white/10 hover:border-[#ffd54a]/50 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg min-w-[130px] justify-between capitalize"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-[#ffd54a]" />
                  {season}
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isSeasonDropdownOpen ? 'rotate-180 text-[#ffd54a]' : 'text-gray-400'}`} />
              </button>
              
              <AnimatePresence>
                {isSeasonDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-full bg-[#121326] border border-white/10 rounded-lg shadow-xl"
                  >
                    {SEASONS.map(s => (
                      <button 
                        key={s}
                        onClick={() => { setSeason(s); setPage(1); setIsSeasonDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm capitalize transition-colors ${season === s ? 'bg-[#ffd54a]/20 text-[#ffd54a] font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Global Click Handler to close dropdowns */}
        {(isYearDropdownOpen || isSeasonDropdownOpen) && (
          <div className="fixed inset-0 z-10" onClick={() => { setIsYearDropdownOpen(false); setIsSeasonDropdownOpen(false); }} />
        )}

        {/* Content Area */}
        <div className="min-h-[50vh] relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050716]/50 backdrop-blur-sm z-10 rounded-xl">
              <Loader2 size={48} className="text-[#ff4dd2] animate-spin mb-4" />
              <p className="text-gray-400 font-medium tracking-wider animate-pulse">Loading Seasonal Data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-[#1A1A24]/30 rounded-2xl border border-white/5">
              <span className="text-6xl mb-4 opacity-50">🍂</span>
              <h3 className="text-2xl text-white font-bold mb-2">No Anime Found</h3>
              <p className="text-gray-400 max-w-md">
                We couldn't find any anime for the {season} {year} season. Try selecting a different time period.
              </p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.5 }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6"
            >
              {data.map((anime: any, index: number) => (
                <AnimeCard 
                  key={`${anime.id}-${index}`} 
                  anime={anime} 
                  priority={index < 12} 
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Pagination using our standard component layout but customized for client-side state */}
        {!loading && data.length > 0 && lastPage > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 mb-8">
            {page > 1 && (
              <button 
                onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-3 py-1 md:px-4 md:py-2 text-sm bg-[#141519] text-[#a0a0a0] rounded hover:bg-[#ff4dd2] hover:text-white transition-colors"
              >
                Prev
              </button>
            )}
            
            <span className="px-4 py-2 text-sm bg-[#ff4dd2] text-white shadow-[0_0_10px_rgba(255, 77, 210,0.5)] rounded">
              Page {page} of {lastPage}
            </span>

            {page < lastPage && (
              <button 
                onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-3 py-1 md:px-4 md:py-2 text-sm bg-[#141519] text-[#a0a0a0] rounded hover:bg-[#ff4dd2] hover:text-white transition-colors"
              >
                Next
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
