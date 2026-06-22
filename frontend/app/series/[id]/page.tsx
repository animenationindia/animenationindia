// app/series/[id]/page.tsx

import { getAnimeFullDetails, getAnimeCharacters, getAniListExtraInfo, getAnimeRecommendations } from '../../../lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import AnimeDetailActions from '../../../components/AnimeDetailActions';
import AnimeCard from '../../../components/AnimeCard';
import SectionSlider from '../../../components/SectionSlider';
import type { Metadata } from 'next';

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const anime = await getAnimeFullDetails(id);
  if (!anime) return { title: 'Anime Not Found - Anime Nation India' };
  
  const title = anime.title_english || anime.title || 'Unknown Title';
  const description = anime.synopsis ? anime.synopsis.substring(0, 160) + '...' : 'View full anime details, episodes, and trailers on Anime Nation India.';
  
  return {
    title: `${title} - Anime Nation India`,
    description,
    openGraph: {
      title: `${title} - Anime Nation India`,
      description,
      images: [anime.images?.jpg?.large_image_url || ''],
    }
  };
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
  
  // ১. params-কে await করে id বের করা
  const { id } = await params;

  // ২. সব ডেটা প্যারালাল ফেচ করা (Parallel Fetching for speed)
  const [anime, characters, extraInfo, recommendations] = await Promise.all([
    getAnimeFullDetails(id),
    getAnimeCharacters(id),
    getAniListExtraInfo(Number(id)),
    getAnimeRecommendations(id)
  ]);

  if (!anime) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-[#a0a0a0] bg-[#000000] min-h-screen">
        <h1 className="text-3xl font-semibold text-white mb-4">Anime Not Found</h1>
        <Link href="/" className="text-[#f47521] hover:underline transition-all">Go back home</Link>
      </div>
    );
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
    ? [...extraInfo.relations.edges].sort((a, b) => {
        const getScore = (node: any) => {
          if (!node.startDate) return 0;
          return (node.startDate.year || 0) * 10000 + (node.startDate.month || 0) * 100 + (node.startDate.day || 0);
        };
        return getScore(b.node) - getScore(a.node); // Descending (New to Old)
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
                src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url} 
                alt={anime.title} 
                fill
                className="object-cover"
              />
            </div>

            {/* Client Interactive Action Buttons */}
            <AnimeDetailActions 
              animeId={anime.mal_id}
              animeTitle={displayTitle}
              animeImage={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
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
              <span>{anime.title_japanese}</span>
              <span className="h-4 w-px bg-gray-700" />
              <span>{anime.type}</span>
              <span className="h-4 w-px bg-gray-700" />
              <span>{anime.year || anime.season || 'Unknown'}</span>
              <span className="h-4 w-px bg-gray-700" />
              <span className="flex items-center gap-1 text-yellow-500"><Star size={14} /> {anime.score || 'N/A'}</span>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link href={`/watch/${anime.mal_id}`} className="bg-neon-cyan hover:bg-neon-cyan/80 text-[#000000] font-bold py-3 px-8 rounded-sm uppercase tracking-wide flex items-center gap-2 transition-colors">
                <Play size={20} className="fill-[#000000]" />
                Start Watching
              </Link>
            </div>

            {/* Synopsis Section */}
            <div className="mb-10 max-w-4xl">
              <p className="text-[#a0a0a0] text-sm md:text-base leading-relaxed">
                {anime.synopsis || "No synopsis available for this title."}
              </p>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 bg-[#141519] rounded mb-12">
              <div className="space-y-1">
                <span className="text-[#a0a0a0] text-xs font-semibold uppercase tracking-wider">Status</span>
                <p className="text-gray-200 font-medium text-sm">{anime.status}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#a0a0a0] text-xs font-semibold uppercase tracking-wider">Episodes</span>
                <p className="text-gray-200 font-medium text-sm">{anime.episodes || '??'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[#a0a0a0] text-xs font-semibold uppercase tracking-wider">Studios</span>
                <p className="text-neon-cyan font-medium text-sm">{anime.studios?.map((s: { name: string }) => s.name).join(', ') || 'N/A'}</p>
              </div>
            </div>

            {/* 🎙️ Characters & Voice Actors */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-white mb-6">
                Cast & Characters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {characters?.slice(0, 8).map((char: CharacterVoiceActor) => {
                  const japaneseVA = char.voice_actors?.find(va => va.language === 'Japanese') || char.voice_actors?.[0]; // Fallback to first if Japanese not explicitly tagged, but usually it is.
                  
                  return (
                  <div key={char.character.mal_id} className="flex justify-between bg-[#141519] rounded overflow-hidden p-3 items-center hover:bg-[#1a1b22] transition-colors">
                    {/* 👤 Character Details */}
                    <Link href={`/character/${char.character.mal_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#2A2B30]">
                        {(char.character.images?.webp?.image_url || char.character.images?.jpg?.image_url) ? (
                          <Image src={char.character.images?.webp?.image_url || char.character.images?.jpg?.image_url || ''} alt={char.character.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#2A2B30] flex items-center justify-center text-xs">No Img</div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-200 line-clamp-1">{char.character.name}</p>
                        <p className="text-xs text-[#ff4dd2] font-medium capitalize">{char.role}</p>
                      </div>
                    </Link>
                    
                    {/* 🎙️ Voice Actor Details (Conditional Rendering) */}
                    {japaneseVA ? (
                      <Link href={`/staff/${japaneseVA.person.mal_id}`} className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity">
                        <div>
                          <p className="text-sm font-semibold text-gray-200 line-clamp-1">{japaneseVA.person.name}</p>
                          <p className="text-[10px] uppercase tracking-wider text-[#a0a0a0]">Japanese VA</p>
                        </div>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#2A2B30]">
                          {japaneseVA.person.images?.jpg?.image_url ? (
                            <Image src={japaneseVA.person.images.jpg.image_url || ''} alt={japaneseVA.person.name} fill sizes="48px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#2A2B30] flex items-center justify-center text-xs">No Img</div>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="text-[10px] text-[#555] uppercase tracking-wider pr-2">
                        No VA Data
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>

            {/* 🔗 Relations & Franchise */}
            {sortedRelations.length > 0 && (
              <div className="mb-12">
                <SectionSlider 
                  title="Explore the Universe" 
                  data={sortedRelations.map((edge: any) => ({
                    ...edge.node,
                    badgeText: edge.relationType.replace(/_/g, ' ')
                  }))} 
                  type="anime" 
                  viewAllLink="" 
                />
              </div>
            )}

            {/* 💡 Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="mb-12">
                <SectionSlider 
                  title="Recommended Anime" 
                  data={recommendations} 
                  type="anime" 
                  viewAllLink="" 
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}