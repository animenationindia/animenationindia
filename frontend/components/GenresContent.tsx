import Link from 'next/link';
import { getJikanGenres, getFilteredAnimeAniList } from '../lib/api';
import AnimeCard from './AnimeCard';
import Pagination from './Pagination';
import GenreSortDropdown from './GenreSortDropdown';
import ScrollToResults from './ScrollToResults';
import { Sparkles, Layers, Flame } from 'lucide-react';

const ANILIST_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

const GENRE_COLORS = [
  // 0: Rose
  {
    active: 'bg-rose-500/15 text-rose-300 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] font-bold',
    hover: 'hover:border-rose-500/80 hover:bg-rose-500/10 hover:text-rose-300',
    badgeActive: 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
  },
  // 1: Cyan
  {
    active: 'bg-cyan-500/15 text-cyan-300 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-bold',
    hover: 'hover:border-cyan-500/80 hover:bg-cyan-500/10 hover:text-cyan-300',
    badgeActive: 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
  },
  // 2: Amber
  {
    active: 'bg-amber-500/15 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] font-bold',
    hover: 'hover:border-amber-500/80 hover:bg-amber-500/10 hover:text-amber-300',
    badgeActive: 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
  },
  // 3: Emerald
  {
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold',
    hover: 'hover:border-emerald-500/80 hover:bg-emerald-500/10 hover:text-emerald-300',
    badgeActive: 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
  },
  // 4: Purple
  {
    active: 'bg-purple-500/15 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold',
    hover: 'hover:border-purple-500/80 hover:bg-purple-500/10 hover:text-purple-300',
    badgeActive: 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
  },
  // 5: Red
  {
    active: 'bg-red-500/15 text-red-300 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] font-bold',
    hover: 'hover:border-red-500/80 hover:bg-red-500/10 hover:text-red-300',
    badgeActive: 'bg-red-500/30 text-red-200 border border-red-400/40'
  },
  // 6: Orange
  {
    active: 'bg-orange-500/15 text-orange-300 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] font-bold',
    hover: 'hover:border-orange-500/80 hover:bg-orange-500/10 hover:text-orange-300',
    badgeActive: 'bg-orange-500/30 text-orange-200 border border-orange-400/40'
  },
  // 7: Blue
  {
    active: 'bg-blue-500/15 text-blue-300 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] font-bold',
    hover: 'hover:border-blue-500/80 hover:bg-blue-500/10 hover:text-blue-300',
    badgeActive: 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
  },
  // 8: Teal
  {
    active: 'bg-teal-500/15 text-teal-300 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.4)] font-bold',
    hover: 'hover:border-teal-500/80 hover:bg-teal-500/10 hover:text-teal-300',
    badgeActive: 'bg-teal-500/30 text-teal-200 border border-teal-400/40'
  },
  // 9: Pink
  {
    active: 'bg-pink-500/15 text-pink-300 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)] font-bold',
    hover: 'hover:border-pink-500/80 hover:bg-pink-500/10 hover:text-pink-300',
    badgeActive: 'bg-pink-500/30 text-pink-200 border border-pink-400/40'
  }
];

const JIKAN_TO_ANILIST_MAP: Record<string, { type: 'genre' | 'tag'; value: string | string[] }> = {
  'Boys Love': { type: 'tag', value: "Boys' Love" },
  'Girls Love': { type: 'tag', value: 'Yuri' },
  'Idols (Female)': { type: 'tag', value: 'Idol' },
  'Idols (Male)': { type: 'tag', value: 'Idol' },
  'Love Polygon': { type: 'tag', value: 'Love Triangle' },
  'Magical Sex Shift': { type: 'tag', value: 'Gender Bending' },
  'High Stakes Game': { type: 'tag', value: 'Death Game' },
  'Combat Sports': { type: 'tag', value: 'Martial Arts' },
  'Strategy Game': { type: 'tag', value: 'Board Game' },
  'Suspense': { type: 'genre', value: 'Thriller' },
  'Gag Humor': { type: 'tag', value: 'Surreal Comedy' },
  'Erotica': { type: 'genre', value: 'Ecchi' },
  'Avant Garde': { type: 'genre', value: 'Psychological' },
  'Childcare': { type: 'tag', value: 'Family Life' },
  'Love Status Quo': { type: 'genre', value: 'Romance' },
  'Medical': { type: 'tag', value: 'Medicine' },
  'Performing Arts': { type: 'tag', value: 'Acting' },
  'Pets': { type: 'tag', value: 'Animals' },
  'Racing': { type: 'tag', value: 'Cars' },
  'Reverse Harem': { type: 'tag', value: 'Male Harem' },
  'Showbiz': { type: 'tag', value: 'Acting' },
  'Gourmet': { type: 'tag', value: 'Food' },
  'Anthropomorphic': { type: 'tag', value: 'Anthropomorphism' },
  'CGDCT': { type: 'tag', value: 'Cute Girls Doing Cute Things' },
  'Team Sports': { type: 'genre', value: 'Sports' },
  'Visual Arts': { type: 'tag', value: 'Drawing' },
  'Award Winning': { type: 'genre', value: 'Drama' },
  'Adult Cast': { type: 'tag', value: 'Primarily Adult Cast' },
  'Harem': { type: 'tag', value: ['Female Harem', 'Male Harem', 'Mixed Gender Harem'] },
  'Organized Crime': { type: 'tag', value: ['Mafia', 'Yakuza', 'Gangs'] },
  'Time Travel': { type: 'tag', value: ['Time Loop', 'Time Manipulation'] },
  'Video Game': { type: 'tag', value: 'Video Games' },
  'Workplace': { type: 'tag', value: 'Work' }
};

export default async function GenresContent({ 
  searchParams, 
  basePath = '/genres' 
}: { 
  searchParams: { genreId?: string; sort?: string; page?: string },
  basePath?: string 
}) {
  const activeGenreId = searchParams.genreId || null;
  const currentSort = searchParams.sort || 'popular';
  const currentPage = parseInt(searchParams.page || '1', 10);

  // Fetch all genres from Jikan (with built-in fallback)
  const allGenres = await getJikanGenres();
  
  // Find active genre name if selected
  const activeGenreObj = allGenres.find((g: any) => g.mal_id.toString() === activeGenreId);
  const activeGenreName = activeGenreObj ? activeGenreObj.name : '';

  // Map our URL sort query param to AniList sort enums
  let aniListSort = 'POPULARITY_DESC';
  if (currentSort === 'oldest') {
    aniListSort = 'START_DATE';
  } else if (currentSort === 'newest') {
    aniListSort = 'START_DATE_DESC';
  } else if (currentSort === 'score') {
    aniListSort = 'SCORE_DESC';
  }

  const filterParams: any = {
    page: currentPage,
    sort: aniListSort,
    perPage: 24,
    isAdult: false,
  };

  if (activeGenreId && activeGenreName) {
    const mapped = JIKAN_TO_ANILIST_MAP[activeGenreName];
    if (mapped) {
      if (mapped.type === 'genre') {
        filterParams.genres = Array.isArray(mapped.value) ? mapped.value : [mapped.value];
      } else {
        filterParams.tags = Array.isArray(mapped.value) ? mapped.value : [mapped.value];
      }
    } else {
      const isStandardGenre = ANILIST_GENRES.includes(activeGenreName);
      if (isStandardGenre) {
        filterParams.genres = [activeGenreName];
      } else {
        filterParams.tags = [activeGenreName];
      }
    }
  }

  // Fetch anime data from AniList
  const aniListData = await getFilteredAnimeAniList(filterParams);
  const results = {
    media: aniListData.media || [],
    pageInfo: aniListData.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false }
  };

  // Extract active genre text color
  const activeGenreColorIndex = activeGenreObj ? ((activeGenreObj.mal_id || 0) % GENRE_COLORS.length) : 0;
  const activeGenreColors = GENRE_COLORS[activeGenreColorIndex];
  const activeGenreTextColor = activeGenreColors ? (activeGenreColors.active.split(' ').find((cls: string) => cls.startsWith('text-')) || 'text-[#ff4dd2]') : 'text-[#ff4dd2]';

  return (
    <div className="w-full relative z-10">
      {/* 🌟 Genre Tags Cloud */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Layers size={14} className="text-[#ff4dd2]" /> Select Categories &amp; Themes ({allGenres.length})
          </span>
          {activeGenreId && (
            <Link 
              href={basePath}
              className="text-xs font-semibold text-[#ff4dd2] hover:underline"
            >
              Show All Genres
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center max-h-[260px] overflow-y-auto p-3 rounded-2xl bg-[#0b0c20]/60 border border-white/5 scrollbar-thin">
          {allGenres.map((g: any) => {
            const colorIndex = (g.mal_id || 0) % GENRE_COLORS.length;
            const colors = GENRE_COLORS[colorIndex];
            const isActive = activeGenreId === g.mal_id.toString();
            return (
              <Link
                key={g.mal_id}
                href={`${basePath}?genreId=${g.mal_id}&sort=${currentSort}&page=1#results-section`}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all group border ${
                  isActive 
                    ? `${colors.active}`
                    : `bg-[#131424]/90 text-[#a0a0a0] border-[#23243a]/80 ${colors.hover}`
                }`}
              >
                <span className={`transition-colors ${isActive ? 'text-white' : 'text-[#e0e0e0]/90 group-hover:text-white'}`}>
                  {g.name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full transition-colors ${
                  isActive 
                    ? `${colors.badgeActive}`
                    : `bg-[#1b1c30] text-[#888] group-hover:bg-[#1b1c30] group-hover:text-white`
                }`}>
                  {g.count ? g.count.toLocaleString() : ''}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 🎬 Results Section (Always Loaded) */}
      <div id="results-section" className="mt-8 border-t border-[#2A2B30]/50 pt-8 scroll-mt-32">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
              {activeGenreId ? (
                <>
                  Top <span className={activeGenreTextColor}>{activeGenreName}</span> Anime
                </>
              ) : (
                <>
                  <Flame size={24} className="text-[#ff4dd2]" />
                  Popular Anime Across All Genres
                </>
              )}
            </h2>
            <p className="text-xs text-[#888] mt-1">
              {activeGenreId 
                ? `Showing curated ${activeGenreName} titles • Page ${currentPage} of ${results.pageInfo.lastPage}`
                : `Showing highest ranked titles • Click any genre pill above to filter`
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {activeGenreId && (
              <Link 
                href={basePath}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 hover:border-[#ff4dd2] hover:text-white hover:bg-[#ff4dd2]/10 text-xs font-semibold text-gray-400 transition-all cursor-pointer"
              >
                <span className="text-sm font-bold leading-none">×</span> Clear Filter
              </Link>
            )}
            <GenreSortDropdown />
          </div>
        </div>
        
        {results.media.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4 md:gap-6">
              {results.media.map((anime: any, index: number) => (
                <AnimeCard key={`${anime.id}-${index}`} anime={anime} priority={index < 8} />
              ))}
            </div>

            <Pagination 
              currentPage={currentPage}
              lastPage={results.pageInfo.lastPage}
              basePath={basePath}
              queryParams={activeGenreId ? { genreId: activeGenreId, sort: currentSort } : { sort: currentSort }}
              hash="results-section"
            />
          </>
        ) : (
          <div className="text-center text-[#a0a0a0] py-20 bg-[#121326]/40 rounded-2xl border border-white/5">
            No anime found for this selection. Try choosing another genre.
          </div>
        )}
      </div>

      <ScrollToResults />
    </div>
  );
}
