import Link from 'next/link';
import { getJikanGenres, getFilteredAnimeAniList } from '../lib/api';
import AnimeCard from './AnimeCard';
import Pagination from './Pagination';
import GenreSortDropdown from './GenreSortDropdown';
import ScrollToResults from './ScrollToResults';
import { MousePointer } from 'lucide-react';

const ANILIST_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Hentai', 
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
];

const GENRE_COLORS = [
  // 0: Rose
  {
    active: 'bg-rose-500/10 text-rose-400 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    hover: 'hover:border-rose-500 hover:bg-rose-500/5 hover:text-rose-400',
    badgeActive: 'bg-rose-500/20 text-rose-200 border border-rose-400/30'
  },
  // 1: Cyan
  {
    active: 'bg-cyan-500/10 text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    hover: 'hover:border-cyan-500 hover:bg-cyan-500/5 hover:text-cyan-400',
    badgeActive: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30'
  },
  // 2: Amber
  {
    active: 'bg-amber-500/10 text-amber-400 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    hover: 'hover:border-amber-500 hover:bg-amber-500/5 hover:text-amber-400',
    badgeActive: 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
  },
  // 3: Emerald
  {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    hover: 'hover:border-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-400',
    badgeActive: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
  },
  // 4: Purple
  {
    active: 'bg-purple-500/10 text-purple-400 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    hover: 'hover:border-purple-500 hover:bg-purple-500/5 hover:text-purple-400',
    badgeActive: 'bg-purple-500/20 text-purple-200 border border-purple-400/30'
  },
  // 5: Red
  {
    active: 'bg-red-500/10 text-red-400 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    hover: 'hover:border-red-500 hover:bg-red-500/5 hover:text-red-400',
    badgeActive: 'bg-red-500/20 text-red-200 border border-red-400/30'
  },
  // 6: Orange
  {
    active: 'bg-orange-500/10 text-orange-400 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    hover: 'hover:border-orange-500 hover:bg-orange-500/5 hover:text-orange-400',
    badgeActive: 'bg-orange-500/20 text-orange-200 border border-orange-400/30'
  },
  // 7: Blue
  {
    active: 'bg-blue-500/10 text-blue-400 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    hover: 'hover:border-blue-500 hover:bg-blue-500/5 hover:text-blue-400',
    badgeActive: 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
  },
  // 8: Teal
  {
    active: 'bg-teal-500/10 text-teal-400 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)]',
    hover: 'hover:border-teal-500 hover:bg-teal-500/5 hover:text-teal-400',
    badgeActive: 'bg-teal-500/20 text-teal-200 border border-teal-400/30'
  },
  // 9: Pink
  {
    active: 'bg-pink-500/10 text-pink-400 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
    hover: 'hover:border-pink-500 hover:bg-pink-500/5 hover:text-pink-400',
    badgeActive: 'bg-pink-500/20 text-pink-200 border border-pink-400/30'
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

  // Fetch all genres from Jikan
  const allGenres = await getJikanGenres();
  
  // Find active genre name
  const activeGenreObj = allGenres.find((g: any) => g.mal_id.toString() === activeGenreId);
  const activeGenreName = activeGenreObj ? activeGenreObj.name : '';

  // Fetch results if a genre is selected
  let results = { media: [], pageInfo: { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false } };
  if (activeGenreId && activeGenreName) {
    const mapped = JIKAN_TO_ANILIST_MAP[activeGenreName];
    
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
    };

    // Force isAdult to true for explicit adult categories (Hentai, Erotica)
    if (activeGenreName === 'Hentai' || activeGenreName === 'Erotica') {
      filterParams.isAdult = true;
    }

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

    const aniListData = await getFilteredAnimeAniList(filterParams);
    
    results = {
      media: aniListData.media || [],
      pageInfo: aniListData.pageInfo || { total: 0, currentPage: 1, lastPage: 1, hasNextPage: false }
    };
  }

  // Extract active genre text color for the results title
  const activeGenreColorIndex = activeGenreObj ? ((activeGenreObj.mal_id || 0) % GENRE_COLORS.length) : 0;
  const activeGenreColors = GENRE_COLORS[activeGenreColorIndex];
  const activeGenreTextColor = activeGenreColors ? (activeGenreColors.active.split(' ').find((cls: string) => cls.startsWith('text-')) || 'text-[#ff4dd2]') : 'text-[#ff4dd2]';

  return (
    <div className="w-full relative z-10">
      {/* Genre Tags Cloud */}
      <div className="mb-12">
        <div className="flex flex-wrap gap-3 justify-center">
          {allGenres.map((g: any) => {
            const colorIndex = (g.mal_id || 0) % GENRE_COLORS.length;
            const colors = GENRE_COLORS[colorIndex];
            const isActive = activeGenreId === g.mal_id.toString();
            return (
              <Link
                key={g.mal_id}
                href={`${basePath}?genreId=${g.mal_id}&sort=popular&page=1#results-section`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all group border ${
                  isActive 
                    ? `${colors.active}`
                    : `bg-[#131424]/90 text-[#a0a0a0] border-[#23243a]/80 ${colors.hover}`
                }`}
              >
                <span className={`font-semibold transition-colors ${isActive ? 'text-white' : 'text-[#e0e0e0]/90 group-hover:text-white'}`}>
                  {g.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                  isActive 
                    ? `${colors.badgeActive}`
                    : `bg-[#1b1c30] text-[#a0a0a0] group-hover:bg-[#1b1c30] group-hover:text-white`
                }`}>
                  {g.count.toLocaleString()}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Results Section - ONLY SHOW IF A GENRE IS SELECTED */}
      {activeGenreId && (
        <div id="results-section" className="mt-8 border-t border-[#2A2B30]/50 pt-8 scroll-mt-32">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
              Top <span className={activeGenreTextColor}>{activeGenreName}</span> Anime
              <span className="ml-3 text-sm text-[#a0a0a0] font-normal lowercase tracking-normal">
                Page {currentPage} of {results.pageInfo.lastPage}
              </span>
            </h2>
            
            <div className="flex items-center gap-3">
              <Link 
                href="/genres"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/20 hover:border-[#ff4dd2] hover:text-white hover:bg-[#ff4dd2]/10 text-xs font-semibold text-gray-400 transition-all cursor-pointer"
              >
                <span className="text-sm font-bold leading-none">×</span> Clear Filter
              </Link>
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
                queryParams={{ genreId: activeGenreId, sort: currentSort }}
                hash="results-section"
              />
            </>
          ) : (
            <div className="text-center text-[#a0a0a0] py-20">
              No anime found for this genre.
            </div>
          )}
        </div>
      )}
      
      {/* Placeholder if no genre is selected */}
      {!activeGenreId && (
        <div className="text-center py-24 flex flex-col items-center justify-center relative z-10">
          <MousePointer className="w-16 h-16 text-[#4a4d66] mb-6 transform -rotate-12 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
          <h3 className="text-3xl text-white font-bebas tracking-widest mb-3 uppercase">Select a Genre</h3>
          <p className="text-[#8e8f9e] max-w-md text-sm leading-relaxed">
            Click on any category above to discover top-rated anime in that genre.
          </p>
        </div>
      )}
      <ScrollToResults />
    </div>
  );
}
