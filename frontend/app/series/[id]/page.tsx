/* eslint-disable @next/next/no-img-element */
// app/series/[id]/page.tsx
import { cache, Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAnimeFullDetails, getAnimeCharacters, getAniListExtraInfo, getAnimeRecommendations } from '../../../lib/api';
import { sanitizeDescription } from '../../../lib/sanitize';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import AnimeDetailActions from '../../../components/AnimeDetailActions';
import SectionSlider from '../../../components/SectionSlider';
import ReadMoreText from '../../../components/ReadMoreText';
import ErrorBoundary from '../../../components/ErrorBoundary';
import type { Metadata } from 'next';

interface Params {
  id: string;
}

// React cache() wrappers to deduplicate fetches between generateMetadata and AnimeDetails page component
const getCachedAnimeDetails = cache(async (id: string) => {
  return getAnimeFullDetails(id);
});

const getCachedAniListExtraInfo = cache(async (numId: number) => {
  return getAniListExtraInfo(numId);
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);

  try {
    const [jikanRes, extraInfoRes] = await Promise.allSettled([
      getCachedAnimeDetails(id),
      getCachedAniListExtraInfo(numId)
    ]);
    
    const jikanAnime = jikanRes.status === 'fulfilled' ? jikanRes.value : null;
    const extraInfo = extraInfoRes.status === 'fulfilled' ? extraInfoRes.value : null;

    if (!jikanAnime && !extraInfo) {
      return {
        title: 'Anime Not Found - Anime Nation India',
        description: 'The requested anime series could not be found.',
      };
    }

    const title = jikanAnime?.title_english || jikanAnime?.title || extraInfo?.title?.english || extraInfo?.title?.romaji || 'Anime Details';
    const rawDesc = jikanAnime?.synopsis || extraInfo?.description || 'View full anime details, episodes, and trailers on Anime Nation India.';
    const cleanDesc = sanitizeDescription(rawDesc).replace(/\s+/g, ' ').slice(0, 160);
    const cover = jikanAnime?.images?.jpg?.large_image_url || extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || '/placeholder-poster.png';

    return {
      title: `${title} - Details | Anime Nation India`,
      description: cleanDesc,
      openGraph: {
        title: `${title} - Watch & Full Details | Anime Nation India`,
        description: cleanDesc,
        images: [{ url: cover, alt: title }],
        type: 'video.other',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} - Anime Nation India`,
        description: cleanDesc,
        images: [cover],
      },
    };
  } catch {
    return {
      title: 'Anime Details - Anime Nation India',
      description: 'Explore full anime details, episodes, reviews, and release schedules on Anime Nation India.',
    };
  }
}

interface CharacterVoiceActor {
  role: string;
  character: {
    mal_id: number;
    name: string;
    images: {
      webp?: {
        image_url: string;
      };
      jpg?: {
        image_url: string;
      };
    };
  };
  voice_actors?: Array<{
    language: string;
    person: {
      mal_id: number;
      name: string;
      images: {
        jpg?: {
          image_url: string;
        };
      };
    };
  }>;
}

export default async function AnimeDetails({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const numId = Number(id);

  // 1. Fetch primary anime details & AniList extra info in parallel (~250ms) using deduplicated cache wrappers
  const [jikanRes, extraInfoRes] = await Promise.allSettled([
    getCachedAnimeDetails(id),
    getCachedAniListExtraInfo(numId)
  ]);

  const jikanAnime = jikanRes.status === 'fulfilled' ? jikanRes.value : null;
  const extraInfo = extraInfoRes.status === 'fulfilled' ? extraInfoRes.value : null;
  const resolvedAniListId = extraInfo?.id || numId;

  // 2. Fetch characters and recommendations using multi-tier fallback chain
  const [charactersRes, recommendationsRes] = await Promise.allSettled([
    getAnimeCharacters(numId, resolvedAniListId),
    getAnimeRecommendations(numId, resolvedAniListId)
  ]);

  const characters = charactersRes.status === 'fulfilled' ? charactersRes.value : [];
  const recommendations = recommendationsRes.status === 'fulfilled' ? recommendationsRes.value : [];

  // Primary data resolution: Prefer Jikan, fallback to AniList extraInfo
  let anime = jikanAnime;

  if (!anime && extraInfo) {
    // Construct robust fallback anime object from AniList extraInfo
    anime = {
      mal_id: numId,
      title: extraInfo.title?.romaji || 'Unknown Title',
      title_english: extraInfo.title?.english || extraInfo.title?.romaji || 'Unknown Title',
      title_japanese: extraInfo.title?.native || '',
      synopsis: extraInfo.description || 'No synopsis available for this title.',
      images: {
        webp: { large_image_url: extraInfo.coverImage?.extraLarge || extraInfo.coverImage?.large || '' },
        jpg: { large_image_url: extraInfo.coverImage?.large || '' }
      },
      genres: extraInfo.genres ? extraInfo.genres.map((g, idx) => ({ mal_id: idx, name: g })) : [],
      score: typeof extraInfo.averageScore === 'number' && !isNaN(extraInfo.averageScore) ? extraInfo.averageScore / 10 : null,
      type: extraInfo.format || 'TV',
      season: extraInfo.seasonYear ? String(extraInfo.seasonYear) : '',
      year: extraInfo.seasonYear || null,
      trailer: extraInfo.trailer?.id && extraInfo.trailer?.site === 'youtube'
        ? { embed_url: `https://www.youtube.com/embed/${extraInfo.trailer.id}` }
        : null
    };
  }

  // Call notFound ONLY when neither Jikan nor AniList provides anime data
  if (!anime) {
    notFound();
  }

  const displayTitle = anime.title_english || anime.title;
  const bannerImage = extraInfo?.bannerImage || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;

  const formatNextEpisode = () => {
    if (!extraInfo?.nextAiringEpisode) return null;
    const { episode, airingAt, timeUntilAiring } = extraInfo.nextAiringEpisode;
    const date = new Date(airingAt * 1000).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    
    const days = Math.floor(timeUntilAiring / 86400);
    const hours = Math.floor((timeUntilAiring % 86400) / 3600);
    const timeString = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

    return { episode, date, timeString };
  };
  const nextEp = formatNextEpisode();

  const sortedRelations = extraInfo?.relations?.edges 
    ? [...extraInfo.relations.edges]
        .filter((edge: any) => edge && edge.node)
        .sort((a: any, b: any) => {
          const getScore = (node: any) => {
            if (!node || !node.startDate) return 0;
            return (node.startDate.year || 0) * 10000 + (node.startDate.month || 0) * 100 + (node.startDate.day || 0);
          };
          return getScore(b.node) - getScore(a.node);
        })
    : [];

  return (
    <main className="min-h-screen bg-[#050716] text-white pb-24">
      
      {/* 🎬 1. Cinematic Banner Section */}
      <div className="relative w-full h-[260px] sm:h-[340px] md:h-[420px] lg:h-[460px] overflow-hidden bg-[#0a0510]">
        {bannerImage && (
          <img 
            src={bannerImage} 
            alt={displayTitle} 
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-top opacity-70"
          />
        )}
        {/* Rich multi-stop gradients for seamless dark space blend */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050716] via-[#050716]/80 via-40% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050716]/90 via-[#050716]/40 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 w-full max-w-[1600px] -mt-[140px] sm:-mt-[180px] md:-mt-[220px] lg:-mt-[260px] relative z-10">
        
        {/* Breadcrumb */}
        <nav className="text-gray-400 text-xs mb-4 md:mb-6 flex items-center gap-2 drop-shadow-md">
          <Link href="/" className="hover:text-[#ff4dd2] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/browse" className="hover:text-[#ff4dd2] transition-colors">Anime</Link>
          <span>/</span>
          <span className="text-gray-200 line-clamp-1">{displayTitle}</span>
        </nav>

        {/* 📱 Mobile Layout (< lg): Compact Hero Header with Poster + Title & Quick Info */}
        <div className="lg:hidden flex flex-col gap-5 mb-8">
          {/* Poster + Meta Badges Row */}
          <div className="flex gap-4 sm:gap-6 items-start">
            <div className="w-[120px] sm:w-[150px] aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.8)] border border-white/10 shrink-0 bg-[#121326] relative">
              <img 
                src={extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/placeholder-poster.png'} 
                alt={anime.title} 
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col flex-1 min-w-0 pt-1">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1 drop-shadow-md line-clamp-2">
                {displayTitle}
              </h1>
              {anime.title_japanese && (
                <p className="text-[11px] text-gray-400 font-medium line-clamp-1 mb-2">
                  {anime.title_japanese}
                </p>
              )}

              {/* Rating & Format Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                <span className="bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-400/30 text-[11px]">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  {typeof anime.score === 'number' && !isNaN(anime.score) ? anime.score.toFixed(1) : 'N/A'}
                </span>
                <span className="bg-white/10 text-gray-200 font-semibold px-2 py-0.5 rounded-md border border-white/10 text-[11px]">
                  {anime.type || 'TV'}
                </span>
                {anime.year && (
                  <span className="text-gray-400 text-[11px]">
                    {anime.year}
                  </span>
                )}
              </div>

              {/* Genre Pills */}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {anime.genres.slice(0, 3).map((g: { mal_id: number; name: string }) => (
                    <Link 
                      key={g.mal_id} 
                      href={`/genres?genreId=${g.mal_id}&sort=popular&page=1#results-section`}
                      className="text-[10px] font-semibold px-2 py-0.5 bg-white/5 text-gray-300 rounded-md border border-white/10 hover:text-white hover:border-[#ff4dd2] transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Next Episode Badge (Mobile) */}
          {nextEp && (
            <div className="inline-flex items-center gap-2 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 px-3.5 py-2 rounded-xl text-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4dd2] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4dd2]"></span>
              </span>
              <span className="font-semibold text-white">
                Episode {nextEp.episode}: <span className="text-[#ff4dd2] font-bold">{nextEp.timeString}</span>
              </span>
              <span className="text-gray-400">({nextEp.date})</span>
            </div>
          )}

          {/* Mobile Action Buttons */}
          <AnimeDetailActions 
            animeId={anime.mal_id}
            animeTitle={displayTitle}
            animeImage={extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/placeholder-poster.png'}
            trailerUrl={anime.trailer?.embed_url || anime.trailer?.url || null}
          />
        </div>

        {/* 🖥️ Desktop Layout (lg+): Side-by-side Left Poster Column & Right Info Hub */}
        <div className="hidden lg:flex flex-row gap-10 xl:gap-14">
          
          {/* Left Column: Poster & Action Buttons */}
          <div className="w-[260px] xl:w-[280px] flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 group mb-6 bg-[#121326]">
              <img 
                src={extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/placeholder-poster.png'} 
                alt={anime.title} 
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Client Interactive Action Buttons */}
            <AnimeDetailActions 
              animeId={anime.mal_id}
              animeTitle={displayTitle}
              animeImage={extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || '/placeholder-poster.png'}
              trailerUrl={anime.trailer?.embed_url || anime.trailer?.url || null}
            />
          </div>

          {/* Right Column: Title, Metadata, Genres, Synopsis */}
          <div className="flex-grow pt-4 min-w-0">
            <h1 className="text-3xl xl:text-5xl font-black text-white mb-2 leading-tight tracking-tight drop-shadow-lg">
              {displayTitle}
            </h1>
            {anime.title_japanese && (
              <p className="text-sm text-gray-400 font-medium mb-4">
                {anime.title_japanese}
              </p>
            )}

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {anime.genres.map((g: { mal_id: number; name: string }) => (
                  <Link 
                    key={g.mal_id} 
                    href={`/genres?genreId=${g.mal_id}&sort=popular&page=1#results-section`}
                    className="text-xs font-semibold px-3.5 py-1 bg-white/5 text-gray-200 rounded-full border border-white/10 hover:text-[#ff4dd2] hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10 transition-all duration-300"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Next Episode Badge */}
            {nextEp && (
              <div className="mb-5 inline-flex items-center gap-2.5 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 px-4 py-2 rounded-xl">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4dd2] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff4dd2]"></span>
                </span>
                <span className="text-sm font-semibold text-white">
                  Episode {nextEp.episode}: <span className="text-[#ff4dd2] font-bold">{nextEp.timeString}</span>
                </span>
                <span className="text-xs text-gray-400">({nextEp.date})</span>
              </div>
            )}
            
            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-3 text-sm mb-6 text-gray-400">
              <span className="bg-amber-400/20 text-amber-300 font-bold px-3 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1.5">
                <Star size={15} className="text-amber-400 fill-amber-400" /> 
                {typeof anime.score === 'number' && !isNaN(anime.score) ? anime.score.toFixed(1) : 'N/A'}
              </span>
              <span className="bg-white/5 text-white px-3 py-1 rounded-lg border border-white/10 font-medium">
                {anime.type || 'TV'}
              </span>
              {anime.year && (
                <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-lg border border-white/10 font-medium">
                  {anime.year}
                </span>
              )}
              {anime.season && (
                <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-lg border border-white/10 capitalize font-medium">
                  {anime.season}
                </span>
              )}
            </div>

            {/* Synopsis Card */}
            <div className="bg-[#0b0c20]/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 mb-10 max-w-4xl shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full"></span> Synopsis
              </h3>
              <ReadMoreText text={sanitizeDescription(anime.synopsis || "No synopsis available for this title.")} />
            </div>
          </div>
        </div>

        {/* 📱 Mobile Synopsis Section */}
        <div className="lg:hidden bg-[#0b0c20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 mb-10 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <span className="w-1 h-3.5 bg-[#ff4dd2] rounded-full"></span> Synopsis
          </h3>
          <ReadMoreText text={sanitizeDescription(anime.synopsis || "No synopsis available for this title.")} />
        </div>

        {/* Relations Section */}
        {sortedRelations.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg md:text-xl font-bold text-white mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full"></span> Franchise & Related Seasons
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedRelations.map((edge: any, index: number) => {
                const node = edge.node;
                const isMangaNode = node.type === 'MANGA';
                const linkUrl = isMangaNode ? `/manga/${node.idMal || node.id}` : `/series/${node.idMal || node.id}`;
                
                return (
                  <Link 
                    key={node.idMal || node.id || `rel-${index}`} 
                    href={linkUrl}
                    className="bg-[#0b0c20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-3 flex flex-col gap-2.5 hover:border-[#ff4dd2]/40 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-all group"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121326]">
                      {node.coverImage?.large && (
                        <img 
                          src={node.coverImage.large || '/placeholder-poster.png'} 
                          alt={node.title?.english || node.title?.romaji || ''} 
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <span className="absolute top-1.5 left-1.5 bg-[#ff4dd2] text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                        {edge.relationType ? edge.relationType.replace('_', ' ') : 'RELATION'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff4dd2] transition-colors">
                        {node.title?.english || node.title?.romaji}
                      </span>
                      <span className="text-[11px] text-gray-400 capitalize mt-0.5">
                        {node.format ? node.format.replace('_', ' ') : ''} {node.startDate?.year ? `• ${node.startDate.year}` : ''}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Characters Section with ErrorBoundary & Suspense */}
        <ErrorBoundary sectionName="Characters">
          <Suspense fallback={<div className="py-6 text-gray-400 text-sm">Loading characters...</div>}>
            {characters && characters.length > 0 ? (
              <div className="mb-12">
                <h3 className="text-lg md:text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full"></span> Main Characters & Voice Actors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {characters.slice(0, 6).map((item: CharacterVoiceActor, index: number) => {
                    const japaneseVA = item.voice_actors?.find(va => va.language === 'Japanese');
                    
                    return (
                      <div key={item.character.mal_id || `char-${index}`} className="bg-[#0b0c20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-3.5 flex items-center justify-between hover:border-white/15 transition-all">
                        <Link href={`/character/${item.character.mal_id}`} className="flex items-center gap-3 group min-w-0">
                          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#121326]">
                            {item.character.images?.jpg?.image_url && (
                              <img 
                                src={item.character.images.jpg.image_url} 
                                alt={item.character.name} 
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors line-clamp-1">{item.character.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-medium">{item.role}</p>
                          </div>
                        </Link>

                        {japaneseVA && (
                          <Link 
                            href={`/staff/${japaneseVA.person.mal_id}`} 
                            className="flex items-center gap-2.5 text-right flex-shrink-0 pl-2 group/va cursor-pointer"
                          >
                            <div>
                              <p className="text-xs font-bold text-gray-200 group-hover/va:text-[#ff4dd2] transition-colors line-clamp-1">{japaneseVA.person.name}</p>
                              <p className="text-[10px] text-[#ff4dd2] font-semibold">Japanese VA</p>
                            </div>
                            <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#121326] group-hover/va:border-[#ff4dd2]/50 transition-colors">
                              {japaneseVA.person.images?.jpg?.image_url && (
                                <img 
                                  src={japaneseVA.person.images.jpg.image_url} 
                                  alt={japaneseVA.person.name} 
                                  loading="lazy"
                                  className="absolute inset-0 w-full h-full object-cover group-hover/va:scale-105 transition-transform"
                                />
                              )}
                            </div>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </Suspense>
        </ErrorBoundary>

        {/* Recommendations Section with ErrorBoundary & Suspense */}
        <ErrorBoundary sectionName="Recommendations">
          <Suspense fallback={<div className="py-6 text-gray-400 text-sm">Loading recommendations...</div>}>
            {recommendations && recommendations.length > 0 && (
              <div className="mt-14">
                <SectionSlider 
                  title="You Might Also Like" 
                  data={recommendations.map((rec: any) => ({
                    id: rec.entry.mal_id,
                    idMal: rec.entry.mal_id,
                    title: { english: rec.entry.title, romaji: rec.entry.title },
                    coverImage: { large: rec.entry.images?.jpg?.large_image_url || '/placeholder-poster.png' },
                    format: 'TV',
                    averageScore: null
                  })) as any} 
                  type="anime" 
                  viewAllLink="" 
                />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>

      </div>
    </main>
  );
}