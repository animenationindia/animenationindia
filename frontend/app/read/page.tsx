import { Metadata } from 'next';
import Link from 'next/link';
import { searchMangaJikan, getTrendingMangaSpotlight } from '@/lib/api';
import AnimeCard from '@/components/AnimeCard';
import Pagination from '@/components/Pagination';
import MangaSearchFilters from '@/components/MangaSearchFilters';
import MangaSpotlightHero from '@/components/MangaSpotlightHero';
import ReadHubNavigation from '@/components/ReadHubNavigation';
import ErrorState from '@/components/ErrorState';
import { 
  BookOpen, Flame, Sparkles, BookMarked, ArrowRight, 
  Layers, Compass, TrendingUp, Star 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Universal Reading Lounge | Anime Nation India',
  description: 'The ultimate portal for Japanese Manga, Korean Manhwa Webtoons, Chinese Manhua, and Light Novels on Anime Nation India.',
};

const HUB_SECTIONS = [
  {
    id: 'manga',
    href: '/read/manga',
    title: 'Japanese Manga Vault',
    subtitle: 'Classic & Modern Tankobon',
    tag: 'JAPAN',
    countryCode: 'JP',
    badgeClass: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    description: 'Weekly Shonen Jump, Seinen masterpieces, and timeless black-and-white legends.',
    borderHover: 'hover:border-sky-500/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]',
    accentColor: 'text-sky-400',
    icon: BookOpen,
  },
  {
    id: 'manhwa',
    href: '/read/manhwa',
    title: 'Korean Manhwa & Webtoons',
    subtitle: 'Full-Color Vertical Webtoons',
    tag: 'KOREA',
    countryCode: 'KR',
    badgeClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    description: 'High-octane Hunter Dungeons, Murim clans, Regression, and Otome romance fantasy.',
    borderHover: 'hover:border-emerald-500/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]',
    accentColor: 'text-emerald-400',
    icon: Flame,
  },
  {
    id: 'manhua',
    href: '/read/manhua',
    title: 'Chinese Manhua & Cultivation',
    subtitle: 'Xianxia & Mythical Realms',
    tag: 'CHINA',
    countryCode: 'CN',
    badgeClass: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    description: 'Celestial Dao tribulations, ancient dragons, alchemy, and legendary martial arts.',
    borderHover: 'hover:border-amber-500/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]',
    accentColor: 'text-amber-400',
    icon: Sparkles,
  },
  {
    id: 'novels',
    href: '/read/novels',
    title: 'Light Novels & Web Fiction',
    subtitle: 'Official Bunkobon & Lore',
    tag: 'NOVELS',
    countryCode: 'LN',
    badgeClass: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    description: 'Deep psychological worlds, Isekai fantasy, and the original stories behind your favorite anime.',
    borderHover: 'hover:border-purple-500/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(192,132,252,0.2)]',
    accentColor: 'text-purple-400',
    icon: BookMarked,
  },
];

interface ReadHubProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    genre?: string;
    sort?: string;
    status?: string;
    year?: string;
    page?: string;
  }>;
}

export default async function MasterReadHubPage({ searchParams }: ReadHubProps) {
  const resolved = await searchParams;
  const query = resolved.q || '';
  const type = resolved.type || '';
  const genre = resolved.genre || '';
  const sort = resolved.sort || 'popular';
  const status = resolved.status || '';
  const year = resolved.year || '';
  const currentPage = parseInt(resolved.page || '1', 10);

  const isSearchMode = Boolean(query || type || genre || status || year || currentPage > 1);

  // If in search mode: fetch filtered query results
  if (isSearchMode) {
    let media: any[] = [];
    let pageInfo = { hasNextPage: false, lastPage: 1, currentPage: 1, total: 0 };
    let isError = false;

    try {
      const data = await searchMangaJikan(query, currentPage, type, genre, sort, status, year);
      media = data?.media || [];
      pageInfo = data?.pageInfo || { hasNextPage: false, lastPage: 1, currentPage, total: 0 };
    } catch {
      isError = true;
    }

    return (
      <div className="min-h-screen bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white pt-28 lg:pt-20 pb-24">
        <ReadHubNavigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          <MangaSearchFilters
            initialQuery={query}
            initialType={type}
            initialGenre={genre}
            initialSort={sort}
            initialStatus={status}
            initialYear={year}
            customPlaceholder="Search all Manga, Manhwa, Manhua, Light Novels..."
          />

          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-6 bg-[#ff4dd2] rounded-full shadow-[0_0_12px_rgba(255,77,210,0.8)]" />
              <h2 className="text-lg sm:text-xl font-black text-white uppercase">
                {query ? `Search Results for "${query}"` : 'Filtered Titles'}
              </h2>
            </div>
            {pageInfo.total ? (
              <span className="text-xs font-bold text-gray-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl">
                {pageInfo.total.toLocaleString()} Titles Found
              </span>
            ) : null}
          </div>

          {isError ? (
            <div className="max-w-xl mx-auto py-12">
              <ErrorState message="Failed to load search results. Please try again." />
            </div>
          ) : media.length > 0 ? (
            <>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 md:gap-6">
                {media.map((item: any, index: number) => (
                  <AnimeCard
                    key={`${item.id}-${index}`}
                    anime={item}
                    isManga={true}
                    priority={index < 12}
                  />
                ))}
              </div>

              <div className="mt-10">
                <Pagination
                  currentPage={pageInfo.currentPage || currentPage}
                  lastPage={pageInfo.lastPage || 1}
                  basePath="/read"
                  queryParams={{
                    ...(query ? { q: query } : {}),
                    ...(type ? { type } : {}),
                    ...(genre ? { genre } : {}),
                    ...(status ? { status } : {}),
                    ...(year ? { year } : {}),
                    ...(sort && sort !== 'popular' ? { sort } : {}),
                  }}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-[#0c0d20]/50 rounded-3xl border border-white/10 p-8 max-w-lg mx-auto">
              <p className="font-bold text-white mb-2">No matching titles found.</p>
              <Link href="/read" className="text-xs text-[#ff4dd2] font-black uppercase underline">
                Return to Reading Hub
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Showcase Mode: Fetch Top trending for each category
  const [spotlights, topManhwaRes, topMangaRes, topManhuaRes, topNovelsRes] = await Promise.all([
    getTrendingMangaSpotlight().catch(() => []),
    searchMangaJikan('', 1, 'manhwa', '', 'popular').catch(() => ({ media: [] })),
    searchMangaJikan('', 1, 'manga', '', 'popular').catch(() => ({ media: [] })),
    searchMangaJikan('', 1, 'manhua', '', 'popular').catch(() => ({ media: [] })),
    searchMangaJikan('', 1, 'novel', '', 'popular').catch(() => ({ media: [] })),
  ]);

  const topManhwa = (topManhwaRes?.media || []).slice(0, 6);
  const topManga = (topMangaRes?.media || []).slice(0, 6);
  const topManhua = (topManhuaRes?.media || []).slice(0, 6);
  const topNovels = (topNovelsRes?.media || []).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#040405] text-white selection:bg-[#ff4dd2] selection:text-white pt-28 lg:pt-20 pb-28">
      {/* 1. Global Read Sticky Navigation */}
      <ReadHubNavigation />

      {/* 2. Spotlight Hero Carousel */}
      {spotlights && spotlights.length > 0 && (
        <MangaSpotlightHero spotlights={spotlights} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-14">
        {/* 3. Universal Search Omnibar */}
        <MangaSearchFilters
          initialQuery=""
          customPlaceholder="Search all Manga, Manhwa, Manhua, Light Novels... (e.g. Solo Leveling, Berserk)"
        />

        {/* 4. Four Dedicated Hub Selector Cards */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <Compass size={20} className="text-[#ff4dd2]" />
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
                Explore Dedicated Reading Hubs
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-bold hidden sm:inline">
              Choose your favorite storytelling format
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HUB_SECTIONS.map((hub) => {
              const Icon = hub.icon;
              return (
                <Link
                  key={hub.id}
                  href={hub.href}
                  className={`group relative flex flex-col justify-between p-6 rounded-3xl bg-[#090a1e]/80 border border-white/8 backdrop-blur-xl transition-all duration-300 ${hub.borderHover} ${hub.glow} hover:-translate-y-1 cursor-pointer`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 via-transparent to-transparent rounded-tr-3xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`p-2 rounded-xl border ${hub.badgeClass}`}>
                          <hub.icon size={18} />
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black tracking-wider ${hub.badgeClass}`}>
                          {hub.countryCode}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${hub.accentColor}`}>
                        {hub.tag}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#ff4dd2] transition-colors line-clamp-1 mb-1">
                      {hub.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-gray-400 mb-3">
                      {hub.subtitle}
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {hub.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 mt-6 text-xs font-black text-white group-hover:text-[#ff4dd2] transition-all">
                    <span>Enter Hub</span>
                    <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 5. Showcase Shelf: Korean Manhwa & Webtoons */}
        {topManhwa.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  KR
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide flex items-center gap-2">
                    <span>Top Korean Manhwa</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      WEBTOON
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Highest-rated Korean action webtoons and Hunter sagas
                  </p>
                </div>
              </div>

              <Link
                href="/read/manhwa"
                className="flex items-center gap-1.5 text-xs font-black text-emerald-400 hover:text-white transition-colors uppercase tracking-wider group"
              >
                <span>View All Manhwa</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {topManhwa.map((item: any, idx: number) => (
                <AnimeCard key={`manhwa-${item.id}-${idx}`} anime={item} isManga={true} priority={idx < 6} />
              ))}
            </div>
          </section>
        )}

        {/* 6. Showcase Shelf: Japanese Manga Legends */}
        {topManga.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-black text-xs tracking-wider shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  JP
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide flex items-center gap-2">
                    <span>Legendary Japanese Manga</span>
                    <span className="text-[10px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
                      TANKOBON
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Timeless Shonen Jump and Seinen masterpieces
                  </p>
                </div>
              </div>

              <Link
                href="/read/manga"
                className="flex items-center gap-1.5 text-xs font-black text-sky-400 hover:text-white transition-colors uppercase tracking-wider group"
              >
                <span>View All Manga</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {topManga.map((item: any, idx: number) => (
                <AnimeCard key={`manga-${item.id}-${idx}`} anime={item} isManga={true} priority={idx < 6} />
              ))}
            </div>
          </section>
        )}

        {/* 7. Showcase Shelf: Chinese Cultivation Manhua */}
        {topManhua.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-xs tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  CN
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide flex items-center gap-2">
                    <span>Chinese Cultivation Manhua</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      XIANXIA
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Immortality, martial arts, and celestial tribulations
                  </p>
                </div>
              </div>

              <Link
                href="/read/manhua"
                className="flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-white transition-colors uppercase tracking-wider group"
              >
                <span>View All Manhua</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {topManhua.map((item: any, idx: number) => (
                <AnimeCard key={`manhua-${item.id}-${idx}`} anime={item} isManga={true} priority={idx < 6} />
              ))}
            </div>
          </section>
        )}

        {/* 8. Showcase Shelf: Light Novels & Web Fiction */}
        {topNovels.length > 0 && (
          <section>
            <div className="flex items-center justify-between gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-black text-xs tracking-wider shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                  LN
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-wide flex items-center gap-2">
                    <span>Popular Light Novels & Lore</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                      NOVELS
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Original stories and deep lore behind iconic anime
                  </p>
                </div>
              </div>

              <Link
                href="/read/novels"
                className="flex items-center gap-1.5 text-xs font-black text-purple-400 hover:text-white transition-colors uppercase tracking-wider group"
              >
                <span>View All Novels</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {topNovels.map((item: any, idx: number) => (
                <AnimeCard key={`novel-${item.id}-${idx}`} anime={item} isManga={true} priority={idx < 6} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
