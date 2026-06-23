// app/manga/[id]/page.tsx

import { getMangaFullDetails, getMangaCharacters, getAniListMangaExtraInfo, getMangaRecommendations } from '../../../lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Star, BookOpen } from 'lucide-react';
import AnimeCard from '../../../components/AnimeCard';
import SectionSlider from '../../../components/SectionSlider';
import type { Metadata } from 'next';
import WatchlistDropdown from '../../../components/WatchlistDropdown';

interface Params {
  id: string;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const manga = await getMangaFullDetails(id);
  if (!manga) return { title: 'Manga Not Found - Anime Nation India' };
  
  const title = manga.title_english || manga.title || 'Unknown Title';
  const description = manga.synopsis ? manga.synopsis.substring(0, 160) + '...' : 'View full manga and light novel details on Anime Nation India.';
  
  return {
    title: `${title} - Anime Nation India`,
    description,
    openGraph: {
      title: `${title} - Anime Nation India`,
      description,
      images: [manga.images?.jpg?.large_image_url || ''],
    }
  };
}

interface MangaCharacter {
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
}

export default async function MangaDetails({ params }: { params: Promise<Params> }) {
  
  const { id } = await params;

  // Parallel Fetching for speed
  const [manga, characters, extraInfo, recommendations] = await Promise.all([
    getMangaFullDetails(id),
    getMangaCharacters(id),
    getAniListMangaExtraInfo(Number(id)),
    getMangaRecommendations(id)
  ]);

  if (!manga) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-[#a0a0a0] bg-[#000000] min-h-screen">
        <h1 className="text-3xl font-semibold text-white mb-4">Manga/Novel Not Found</h1>
        <Link href="/" className="text-[#f47521] hover:underline transition-all">Go back home</Link>
      </div>
    );
  }

  const displayTitle = manga.title_english || manga.title;
  const bannerImage = extraInfo?.bannerImage || manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url;

  const sortedRelations = extraInfo?.relations?.edges 
    ? [...extraInfo.relations.edges].sort((a, b) => {
        const getScore = (node: any) => {
          if (!node.startDate) return 0;
          return (node.startDate.year || 0) * 10000 + (node.startDate.month || 0) * 100 + (node.startDate.day || 0);
        };
        return getScore(b.node) - getScore(a.node);
      })
    : [];

  const authors = manga.authors?.map((a: { name: string }) => a.name).join(', ') || 'Unknown';

  return (
    <main className="min-h-screen bg-[#110c22] text-white pb-20 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[65%] h-[45%] bg-[#ff4dd2]/5 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ff4dd2]/8 blur-[130px] rounded-full pointer-events-none z-0"></div>

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
          
          {/* Left Column: Poster */}
          <div className="w-full lg:w-[260px] flex-shrink-0">
            <div className="relative aspect-[2/3] rounded overflow-hidden shadow-lg border border-[#141519] group mb-6">
              <Image 
                src={manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url} 
                alt={manga.title} 
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Right Column: Information Hub */}
          <div className="flex-grow pt-4 min-w-0">
            <h1 className="text-3xl md:text-4xl lg:text-[44px] font-semibold text-white mb-2 leading-tight">
              {displayTitle}
            </h1>

            {/* Genres */}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {manga.genres.map((g: { mal_id: number; name: string }) => (
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
            
            <div className="flex flex-wrap items-center gap-3 text-sm mb-6 text-[#a0a0a0]">
              <span>{manga.title_japanese}</span>
              <span className="h-4 w-px bg-gray-700" />
              <span>{manga.type || 'Manga'}</span>
              <span className="h-4 w-px bg-gray-700" />
              <span>{manga.published?.prop?.from?.year || 'Unknown'}</span>
              <span className="h-4 w-px bg-gray-700" />
              <span className="flex items-center gap-1 text-[#ff4dd2]"><Star size={14} /> {manga.score || 'N/A'}</span>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <a href={manga.url} target="_blank" rel="noopener noreferrer" className="bg-[#ff4dd2] hover:bg-[#ff4dd2]/85 text-[#050716] font-bold py-3.5 px-8 rounded-xl uppercase tracking-wider flex items-center gap-2 shadow-[0_4px_15px_rgba(255, 77, 210,0.3)] hover:shadow-[0_4px_25px_rgba(255, 77, 210,0.5)] transition-all">
                <BookOpen size={20} className="fill-[#050716]/0" />
                Read More on MAL
              </a>
              <div className="w-56">
                <WatchlistDropdown 
                  animeId={id} 
                  title={displayTitle} 
                  image={manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || ''} 
                  type={manga.type || 'Manga'}
                />
              </div>
            </div>

            {/* Synopsis Section */}
            <div className="mb-10 max-w-4xl">
              <p className="text-[#a0a0a0] text-sm md:text-base leading-relaxed">
                {manga.synopsis || "No synopsis available for this title."}
              </p>
            </div>

            {/* 📊 Detailed Specifications Section */}
            <div className="mb-12 relative z-10">
              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider border-l-4 border-[#ff4dd2] pl-3">
                Manga Details & Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Alternative Titles Card */}
                <div className="bg-[#121326]/40 backdrop-blur-md border border-[#ff4dd2]/20 rounded-xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <h4 className="text-[#ff4dd2] font-bold text-base mb-4 uppercase tracking-wide border-b border-white/10 pb-2">Alternative Titles</h4>
                  <div className="space-y-3.5 text-sm">
                    {manga.title_english && (
                      <div>
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">English</span>
                        <p className="text-gray-200 font-medium">{manga.title_english}</p>
                      </div>
                    )}
                    {manga.title_japanese && (
                      <div>
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Japanese</span>
                        <p className="text-gray-200 font-medium font-sans">{manga.title_japanese}</p>
                      </div>
                    )}
                    {manga.title_synonyms && manga.title_synonyms.length > 0 && (
                      <div>
                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block">Synonyms</span>
                        <p className="text-gray-200 font-medium">{manga.title_synonyms.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Information Card */}
                <div className="bg-[#121326]/40 backdrop-blur-md border border-[#ff4dd2]/20 rounded-xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <h4 className="text-[#ff4dd2] font-bold text-base mb-4 uppercase tracking-wide border-b border-white/10 pb-2">Information</h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Type:</span>
                      <span className="text-gray-200 font-semibold">{manga.type || 'Manga'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Volumes:</span>
                      <span className="text-gray-200 font-semibold">{manga.volumes || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Chapters:</span>
                      <span className="text-gray-200 font-semibold">{manga.chapters || 'Ongoing'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Status:</span>
                      <span className="text-gray-200 font-semibold">{manga.status || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Published:</span>
                      <span className="text-gray-200 font-semibold text-right max-w-[70%] line-clamp-1">{manga.published?.string || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Author(s):</span>
                      <span className="text-neon-cyan font-semibold text-right max-w-[70%] line-clamp-1">{authors}</span>
                    </div>
                    {manga.serializations && manga.serializations.length > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-gray-400 font-medium">Serialization:</span>
                        <span className="text-gray-200 font-semibold text-right max-w-[70%] line-clamp-1">{manga.serializations.map((s: any) => s.name).join(', ')}</span>
                      </div>
                    )}
                    {manga.themes && manga.themes.length > 0 && (
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-gray-400 font-medium">Themes:</span>
                        <span className="text-gray-200 font-semibold text-right max-w-[70%] line-clamp-1">{manga.themes.map((t: any) => t.name).join(', ')}</span>
                      </div>
                    )}
                    {manga.demographics && manga.demographics.length > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400 font-medium">Demographic:</span>
                        <span className="text-gray-200 font-semibold text-right max-w-[70%] line-clamp-1">{manga.demographics.map((d: any) => d.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Statistics Card */}
                <div className="bg-[#121326]/40 backdrop-blur-md border border-[#ff4dd2]/20 rounded-xl p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                  <h4 className="text-[#ff4dd2] font-bold text-base mb-4 uppercase tracking-wide border-b border-white/10 pb-2">Statistics</h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Score:</span>
                      <span className="text-[#ff4dd2] font-bold flex items-center gap-1">
                        ★ {manga.score || 'N/A'} <span className="text-gray-500 text-xs font-normal">({manga.scored_by?.toLocaleString()} users)</span>
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Rank:</span>
                      <span className="text-gray-200 font-semibold">{manga.rank ? `#${manga.rank}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Popularity:</span>
                      <span className="text-gray-200 font-semibold">{manga.popularity ? `#${manga.popularity}` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400 font-medium">Members:</span>
                      <span className="text-gray-200 font-semibold">{manga.members?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400 font-medium">Favorites:</span>
                      <span className="text-gray-200 font-semibold">{manga.favorites?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 🎙️ Characters */}
            {characters && characters.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Characters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {characters.slice(0, 12).map((char: MangaCharacter) => (
                    <div key={char.character.mal_id} className="flex bg-[#141519] rounded overflow-hidden p-3 items-center hover:bg-[#1a1b22] transition-colors">
                      <Link href={`/character/${char.character.mal_id}`} className="flex items-center gap-3 w-full hover:opacity-80 transition-opacity">
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
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  title="Recommended For You" 
                  data={recommendations} 
                  type="anime" 
                  viewAllLink="" 
                  isManga={true}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
