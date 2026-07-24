// app/series/[id]/page.tsx
import { cache, Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAnimeFullDetails, getAnimeCharacters, getAniListExtraInfo, getAnimeRecommendations } from '../../../lib/api';
import { sanitizeDescription } from '../../../lib/sanitize';
import Image from 'next/image';
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

// React cache() wrapper to deduplicate fetch between generateMetadata and AnimeDetails page component
const getCachedAnimeDetails = cache(async (id: string) => {
  return getAnimeFullDetails(id);
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);

  try {
    const [jikanRes, extraInfoRes] = await Promise.allSettled([
      getCachedAnimeDetails(id),
      getAniListExtraInfo(numId)
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
    const cover = jikanAnime?.images?.jpg?.large_image_url || extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || '/ani-logo.png';

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

  // 1. Fetch primary anime details & AniList extra info in parallel (~250ms)
  const [jikanRes, extraInfoRes] = await Promise.allSettled([
    getCachedAnimeDetails(id),
    getAniListExtraInfo(numId)
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
      score: extraInfo.averageScore ? extraInfo.averageScore / 10 : null,
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
    <main className="min-h-screen bg-[#000000] text-white pb-20">
      
      {/* 🎬 1. Cinematic Banner Section */}
      <div className="relative w-full h-[400px] overflow-hidden">
        {bannerImage && (
          <Image 
            src={bannerImage} 
            alt={displayTitle} 
            fill 
            sizes="100vw"
            className="object-cover opacity-40 blur-sm"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1600px] -mt-[250px] relative z-10">
        
        {/* Breadcrumb */}
        <nav className="text-[#a0a0a0] text-xs mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-neon-cyan transition">Home</Link>
          <span>/</span>
          <span className="text-gray-300 line-clamp-1">{displayTitle}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left Column: Poster & Quick Action */}
          <div className="w-full lg:w-[260px] flex-shrink-0">
            <div className="relative aspect-[2/3] rounded overflow-hidden shadow-lg border border-[#141519] group mb-6">
              <Image 
                src={extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url} 
                alt={anime.title} 
                fill
                sizes="(max-width: 1024px) 100vw, 260px"
                className="object-cover"
                priority
              />
            </div>

            {/* Client Interactive Action Buttons */}
            <AnimeDetailActions 
              animeId={anime.mal_id}
              animeTitle={displayTitle}
              animeImage={extraInfo?.coverImage?.extraLarge || extraInfo?.coverImage?.large || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
              trailerUrl={anime.trailer?.embed_url || anime.trailer?.url || null}
            />
          </div>

          {/* Right Column: Information Hub */}
          <div className="flex-grow pt-4 min-w-0">
            <h1 className="text-3xl md:text-4xl lg:text-[44px] font-semibold text-white mb-2 leading-tight">
              {displayTitle}
            </h1>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {anime.genres.map((g: { mal_id: number; name: string }) => (
                  <Link 
                    key={g.mal_id} 
                    href={`/genres?genreId=${g.mal_id}&sort=popular&page=1#results-section`}
                    className="text-xs font-semibold px-3 py-1 bg-[#2A2B30]/50 text-[#d0d0d0] rounded-full border border-[#2A2B30] hover:text-white hover:border-neon-cyan hover:bg-neon-cyan/10 transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Next Episode Badge */}
            {nextEp && (
              <div className="mb-4 inline-flex items-center gap-2 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 px-4 py-2 rounded-lg">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4dd2] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff4dd2]"></span>
                </span>
                <span className="text-sm font-semibold text-white">
                  Episode {nextEp.episode}: <span className="text-[#ff4dd2]">{nextEp.timeString}</span>
                </span>
                <span className="text-xs text-[#a0a0a0] hidden sm:inline">({nextEp.date})</span>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-3 text-sm mb-6 text-[#a0a0a0]">
              <span className="text-white font-semibold flex items-center gap-1">
                <Star size={16} className="text-amber-400 fill-amber-400" /> 
                {anime.score ? anime.score.toFixed(1) : 'N/A'}
              </span>
              <span>•</span>
              <span className="text-[#d0d0d0]">{anime.type || 'TV'}</span>
              {anime.year && (
                <>
                  <span>•</span>
                  <span>{anime.year}</span>
                </>
              )}
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link href={`/watch/${anime.mal_id}`} className="bg-neon-cyan hover:bg-neon-cyan/80 text-[#000000] font-bold py-3 px-8 rounded-sm uppercase tracking-wide flex items-center gap-2 transition-colors">
                <Play size={20} className="fill-[#000000]" />
                Start Watching
              </Link>
            </div>

            {/* Synopsis Section */}
            <div className="mb-8 max-w-4xl">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Synopsis</h3>
              <ReadMoreText text={sanitizeDescription(anime.synopsis || "No synopsis available for this title.")} />
            </div>

            {/* Relations Section */}
            {sortedRelations.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg font-semibold text-white mb-4 border-l-2 border-neon-cyan pl-3">Franchise & Related Seasons</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sortedRelations.map((edge: any, index: number) => {
                    const node = edge.node;
                    const isMangaNode = node.type === 'MANGA';
                    const linkUrl = isMangaNode ? `/manga/${node.idMal || node.id}` : `/series/${node.idMal || node.id}`;
                    
                    return (
                      <Link 
                        key={index} 
                        href={linkUrl}
                        className="bg-[#141519] border border-[#2A2B30]/40 rounded p-2 flex flex-col gap-2 hover:border-neon-cyan transition group"
                      >
                        <div className="relative aspect-[2/3] w-full rounded overflow-hidden">
                          {node.coverImage?.large && (
                            <Image 
                              src={node.coverImage.large} 
                              alt={node.title?.english || node.title?.romaji || ''} 
                              fill 
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 150px"
                              className="object-cover group-hover:scale-105 transition"
                            />
                          )}
                          <span className="absolute top-1 left-1 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded text-neon-cyan uppercase">
                            {edge.relationType ? edge.relationType.replace('_', ' ') : 'RELATION'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white line-clamp-1 group-hover:text-neon-cyan transition">
                            {node.title?.english || node.title?.romaji}
                          </span>
                          <span className="text-[10px] text-[#a0a0a0] capitalize">
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
                  <div className="mb-10">
                    <h3 className="text-lg font-semibold text-white mb-4 border-l-2 border-neon-cyan pl-3">Main Characters</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {characters.slice(0, 6).map((item: CharacterVoiceActor, index: number) => {
                        const japaneseVA = item.voice_actors?.find(va => va.language === 'Japanese');
                        
                        return (
                          <div key={index} className="bg-[#141519] border border-[#2A2B30]/40 rounded p-3 flex items-center justify-between">
                            <Link href={`/character/${item.character.mal_id}`} className="flex items-center gap-3 group">
                              <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-[#2A2B30]">
                                {item.character.images?.jpg?.image_url && (
                                  <Image 
                                    src={item.character.images.jpg.image_url} 
                                    alt={item.character.name} 
                                    fill 
                                    sizes="48px"
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white group-hover:text-neon-cyan transition line-clamp-1">{item.character.name}</p>
                                <p className="text-[10px] text-[#a0a0a0] uppercase">{item.role}</p>
                              </div>
                            </Link>

                            {japaneseVA && (
                              <div className="flex items-center gap-3 text-right">
                                <div>
                                  <p className="text-xs font-semibold text-[#d0d0d0] line-clamp-1">{japaneseVA.person.name}</p>
                                  <p className="text-[10px] text-[#a0a0a0]">Japanese</p>
                                </div>
                                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-[#2A2B30]">
                                  {japaneseVA.person.images?.jpg?.image_url && (
                                    <Image 
                                      src={japaneseVA.person.images.jpg.image_url} 
                                      alt={japaneseVA.person.name} 
                                      fill 
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </Suspense>
            </ErrorBoundary>
            
          </div>
        </div>

        {/* Recommendations Section with ErrorBoundary & Suspense */}
        <ErrorBoundary sectionName="Recommendations">
          <Suspense fallback={<div className="py-6 text-gray-400 text-sm">Loading recommendations...</div>}>
            {recommendations && recommendations.length > 0 && (
              <div className="mt-16">
                <SectionSlider 
                  title="You Might Also Like" 
                  data={recommendations.map((rec: any) => ({
                    id: rec.entry.mal_id,
                    idMal: rec.entry.mal_id,
                    title: { english: rec.entry.title, romaji: rec.entry.title },
                    coverImage: { large: rec.entry.images?.jpg?.large_image_url || '' },
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