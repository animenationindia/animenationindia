import { cache } from 'react';
import { getMangaFullDetails, getMangaCharacters, getAniListMangaExtraInfo, getMangaRecommendations } from '../../../lib/api';
import { sanitizeDescription } from '../../../lib/sanitize';
import Link from 'next/link';
import { Star, BookOpen, Layers, CheckCircle2, Globe, Sparkles, Film } from 'lucide-react';
import SectionSlider from '../../../components/SectionSlider';
import ReadMoreText from '../../../components/ReadMoreText';
import MangaDetailActions from '../../../components/MangaDetailActions';
import type { Metadata } from 'next';

interface Params {
  id: string;
}

const getCachedMangaDetails = cache(async (id: string) => {
  return getMangaFullDetails(id);
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const manga = await getCachedMangaDetails(id);
    if (!manga) throw new Error("Manga not found");
    
    const title = manga.title_english || manga.title || 'Unknown Title';
    const rawDesc = manga.synopsis || 'View full manga and light novel details on Anime Nation India.';
    const cleanDesc = sanitizeDescription(rawDesc).replace(/\s+/g, ' ').slice(0, 160);
    const cover = manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || '/ani-logo.png';
    
    return {
      title: `${title} - Read Manga & Novel | Anime Nation India`,
      description: cleanDesc,
      openGraph: {
        title: `${title} - Manga & Light Novel Details | Anime Nation India`,
        description: cleanDesc,
        images: [{ url: cover, alt: title }],
        type: 'book',
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
      title: 'Manga Details - Anime Nation India',
      description: 'Explore popular manga, light novels, and comics on Anime Nation India.',
    };
  }
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
  const numId = Number(id);
  const isNumeric = !isNaN(numId) && numId > 0;

  // Parallel Fetching for speed with cached main detail
  const [manga, characters, extraInfo, recommendations] = await Promise.all([
    getCachedMangaDetails(id),
    isNumeric ? getMangaCharacters(id) : Promise.resolve([]),
    isNumeric ? getAniListMangaExtraInfo(numId) : Promise.resolve(null),
    isNumeric ? getMangaRecommendations(id) : Promise.resolve([])
  ]);

  if (!manga) {
    return (
      <div className="container mx-auto px-4 py-36 text-center text-[#a0a0a0] min-h-[70vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Manga Not Found</h1>
        <p className="text-gray-400 text-sm mb-6 max-w-md">The requested manga, manhwa, or novel could not be found in the database.</p>
        <div className="flex items-center gap-4">
          <Link href="/browse/manga" className="bg-[#ff4dd2] hover:bg-[#ff7be0] text-black font-extrabold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#ff4dd2]/20">
            Browse Manga
          </Link>
          <Link href="/" className="bg-white/10 hover:bg-white/15 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all border border-white/10">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const title = manga.title_english || manga.title || 'Unknown Title';
  
  const coverImage = 
    manga.images?.webp?.large_image_url ||
    manga.images?.jpg?.large_image_url ||
    manga.images?.webp?.image_url ||
    manga.images?.jpg?.image_url ||
    manga.coverImage?.extraLarge ||
    manga.coverImage?.large ||
    extraInfo?.coverImage?.extraLarge ||
    extraInfo?.coverImage?.large ||
    '/placeholder-poster.png';

  const bannerImage = 
    extraInfo?.bannerImage || 
    manga.bannerImage || 
    coverImage;

  const score = manga.score ? (typeof manga.score === 'number' && manga.score <= 10 ? manga.score.toFixed(1) : (manga.score / 10).toFixed(1)) : null;
  const synopsis = sanitizeDescription(manga.synopsis || "No synopsis available for this title.");
  const formatName = manga.type || 'Manga';
  const statusName = manga.status || 'Publishing';
  const isCurrentlyPublishing = statusName.toLowerCase().includes('publishing') || statusName.toLowerCase().includes('releasing');
  const chaptersCount = manga.chapters || null;
  const volumesCount = manga.volumes || null;
  const yearPublished = manga.seasonYear || (manga.published?.prop?.from?.year ? String(manga.published.prop.from.year) : null);

  const safeRecommendations = (recommendations || []).map((rec: any) => ({
    id: rec.entry.mal_id,
    idMal: rec.entry.mal_id,
    title: { english: rec.entry.title, romaji: rec.entry.title },
    coverImage: {
      extraLarge: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url || '/placeholder-poster.png',
      large: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url || '/placeholder-poster.png'
    },
    format: 'MANGA',
    type: 'MANGA',
    averageScore: null
  }));

  const relationsList = (manga.relations || []).length > 0 
    ? manga.relations 
    : (extraInfo?.relations?.edges || []).map((e: any) => ({
        relationType: e.relationType,
        entry: {
          id: e.node.idMal || e.node.id,
          idMal: e.node.idMal || e.node.id,
          anilistId: e.node.id,
          title: e.node.title?.english || e.node.title?.romaji || 'Unknown Title',
          format: e.node.format,
          type: e.node.type,
          images: {
            webp: { large_image_url: e.node.coverImage?.extraLarge || e.node.coverImage?.large || '/placeholder-poster.png' },
            jpg: { large_image_url: e.node.coverImage?.large || '/placeholder-poster.png' }
          }
        }
      }));

  const countryName = manga.countryOfOrigin === 'KR' 
    ? '🇰🇷 South Korea (Manhwa)' 
    : manga.countryOfOrigin === 'CN' 
    ? '🇨🇳 China (Manhua)' 
    : '🇯🇵 Japan (Manga)';

  const genreTargetType = manga.countryOfOrigin === 'KR' || (manga.type || '').toLowerCase() === 'manhwa'
    ? 'manhwa'
    : manga.countryOfOrigin === 'CN' || (manga.type || '').toLowerCase() === 'manhua'
    ? 'manhua'
    : (manga.type || '').toLowerCase().includes('novel')
    ? 'novel'
    : 'manga';

  return (
    <main className="min-h-screen bg-[#050716] text-white pt-24 lg:pt-28 pb-20 relative overflow-hidden">
      
      {/* 🌌 Ambient Blurred Backdrop Banner */}
      {bannerImage && (
        <div className="absolute top-0 left-0 w-full h-[620px] overflow-hidden -z-10 pointer-events-none opacity-35">
          <img 
            src={bannerImage} 
            alt={title} 
            className="w-full h-full object-cover blur-3xl scale-125 transform -translate-y-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050716]/20 via-[#050716]/80 to-[#050716]" />
        </div>
      )}

      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1400px]">
        
        {/* 🌟 Main Hero Section Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-12">
          
          {/* 👈 Left Column: Poster + Actions + Desktop Quick Facts */}
          <div className="w-full lg:w-[300px] xl:w-[320px] flex-shrink-0 flex flex-col items-center lg:items-start">
            
            {/* 🖼️ Floating Poster Card */}
            <div className="relative w-[230px] sm:w-[270px] lg:w-full aspect-[2/3] rounded-3xl overflow-hidden border-2 border-white/20 hover:border-[#ff4dd2]/80 shadow-[0_20px_50px_rgba(0,0,0,0.85)] bg-[#121326] group transition-all duration-500">
              <img 
                src={coverImage} 
                alt={title} 
                loading="eager" 
                fetchPriority="high" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 block" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <span className="absolute top-3 left-3 bg-[#ff4dd2] text-black text-[10px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider z-10">
                {formatName}
              </span>
            </div>

            {/* Interactive Actions (Watchlist/Reading list & Share) */}
            <MangaDetailActions 
              mangaId={manga.id || manga.mal_id || id} 
              mangaTitle={title} 
              mangaImage={coverImage} 
            />

            {/* 📋 Desktop Quick Manga Facts Card */}
            <div className="hidden lg:block mt-6 w-full bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#ff4dd2] rounded-full"></span> Manga Information
              </h4>

              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <span className="text-gray-400">Format</span>
                  <Link 
                    href={`/browse/manga?type=${genreTargetType}`}
                    className="text-white hover:text-[#ff4dd2] font-semibold capitalize transition-colors"
                  >
                    {formatName}
                  </Link>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-semibold flex items-center gap-1.5 ${isCurrentlyPublishing ? 'text-emerald-400' : 'text-gray-200'}`}>
                    <span className={`w-2 h-2 rounded-full ${isCurrentlyPublishing ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`}></span>
                    {statusName}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <span className="text-gray-400">Origin</span>
                  <Link 
                    href={`/browse/manga?type=${genreTargetType}`}
                    className="text-gray-200 hover:text-[#ff4dd2] font-semibold transition-colors"
                  >
                    {countryName}
                  </Link>
                </div>

                {chaptersCount && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <span className="text-gray-400">Chapters</span>
                    <span className="text-white font-semibold">{chaptersCount}</span>
                  </div>
                )}

                {volumesCount && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <span className="text-gray-400">Volumes</span>
                    <span className="text-white font-semibold">{volumesCount}</span>
                  </div>
                )}

                {yearPublished && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                    <span className="text-gray-400">Published</span>
                    <span className="text-gray-300 font-semibold">{yearPublished}</span>
                  </div>
                )}

                {manga.genres && manga.genres.length > 0 && (
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="text-gray-400">Genres</span>
                    <div className="flex flex-wrap gap-1.5">
                      {manga.genres.map((g: any, idx: number) => {
                        const genreName = typeof g === 'string' ? g : g.name;
                        return (
                          <Link 
                            key={idx}
                            href={`/browse/manga?genre=${encodeURIComponent(genreName)}&type=${genreTargetType}`}
                            className="bg-white/5 hover:bg-[#ff4dd2]/20 hover:text-[#ff4dd2] text-[11px] text-gray-300 px-2.5 py-1 rounded-md border border-white/5 transition-all"
                          >
                            {genreName}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 👉 Right Column: Titles, Metadata Badges, Synopsis, Characters, Franchise */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* Title & Native Kanji Subtitle */}
            <div className="mb-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight mb-2">
                {title}
              </h1>
              {manga.title_japanese && (
                <p className="text-sm sm:text-base text-gray-400 font-medium">
                  {manga.title_japanese} {manga.title && manga.title !== title ? `• ${manga.title}` : ''}
                </p>
              )}
            </div>

            {/* Clickable Genres & Themes Pill Bar */}
            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {manga.genres.map((g: any, idx: number) => {
                  const genreName = typeof g === 'string' ? g : g.name;
                  return (
                    <Link 
                      key={idx} 
                      href={`/browse/manga?genre=${encodeURIComponent(genreName)}&type=${genreTargetType}`}
                      className="text-xs font-semibold px-3.5 py-1.5 bg-white/5 text-gray-200 rounded-full border border-white/10 hover:text-[#ff4dd2] hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10 transition-all duration-300 shadow-sm"
                    >
                      {genreName}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Interactive Metadata Badges Bar */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm mb-6 text-gray-400">
              {score && (
                <span className="bg-amber-400/20 text-amber-300 font-bold px-3 py-1 rounded-lg border border-amber-400/30 flex items-center gap-1.5 shadow-sm">
                  <Star size={15} className="text-amber-400 fill-amber-400" /> 
                  {score}
                </span>
              )}
              <span className="bg-white/5 text-white px-3 py-1 rounded-lg border border-white/10 font-bold text-xs">
                {formatName}
              </span>
              <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${isCurrentlyPublishing ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-300 border-white/10'}`}>
                {statusName}
              </span>
              {chaptersCount && (
                <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-lg border border-white/10 font-medium text-xs flex items-center gap-1">
                  <BookOpen size={13} className="text-[#ff4dd2]" /> {chaptersCount} Chapters
                </span>
              )}
              {yearPublished && (
                <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-lg border border-white/10 font-medium text-xs">
                  {yearPublished}
                </span>
              )}
              <span className="bg-white/5 text-gray-300 px-3 py-1 rounded-lg border border-white/10 font-medium text-xs flex items-center gap-1">
                <Globe size={13} className="text-[#ff4dd2]" /> {manga.countryOfOrigin || 'JP'}
              </span>
            </div>

            {/* Synopsis Card */}
            <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 mb-10 max-w-4xl shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full"></span> Synopsis
              </h3>
              <ReadMoreText text={synopsis} />
            </div>

            {/* 👥 Main Characters & Cast Section */}
            {characters && characters.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg md:text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full"></span> Main Characters
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {characters.slice(0, 8).map((item: MangaCharacter, index: number) => (
                    <Link 
                      key={index} 
                      href={`/character/${item.character.mal_id}`} 
                      className="bg-[#0b0c20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-3 flex items-center gap-3 hover:border-[#ff4dd2]/40 hover:shadow-[0_4px_20px_rgba(255,77,210,0.15)] transition-all group"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#121326]">
                        <img 
                          src={item.character.images?.jpg?.image_url || item.character.images?.webp?.image_url || '/placeholder.png'} 
                          alt={item.character.name} 
                          loading="lazy" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform" 
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff4dd2] transition-colors">{item.character.name}</h4>
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{item.role}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 🔗 Franchise & Related Adaptations */}
            {relationsList && relationsList.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg md:text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full"></span> Franchise & Related Media
                </h3>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
                  {relationsList.slice(0, 10).map((rel: any, idx: number) => {
                    const targetHref = rel.entry.type === 'ANIME' ? `/series/${rel.entry.id}` : `/manga/${rel.entry.id}`;
                    return (
                      <Link
                        key={idx}
                        href={targetHref}
                        className="group bg-[#0b0c20]/60 border border-white/5 hover:border-[#ff4dd2]/50 rounded-2xl overflow-hidden p-2.5 transition-all flex flex-col justify-between hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(255,77,210,0.2)]"
                      >
                        <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden mb-2 bg-[#121326]">
                          <img
                            src={rel.entry.images?.webp?.large_image_url || rel.entry.images?.jpg?.large_image_url || '/placeholder-poster.png'}
                            alt={rel.entry.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-1.5 left-1.5 bg-black/70 text-[#ff4dd2] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm border border-white/10">
                            {rel.relationType?.replace(/_/g, ' ') || 'RELATED'}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff4dd2] transition-colors">
                            {rel.entry.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">
                            {rel.entry.type || rel.entry.format || 'Media'}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 📱 Mobile Quick Facts Section */}
        <div className="lg:hidden bg-[#0b0c20]/60 backdrop-blur-md border border-white/5 rounded-2xl p-5 mb-10 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
            <span className="w-1 h-3.5 bg-[#ff4dd2] rounded-full"></span> Manga Information
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px]">Format</span>
              <Link 
                href={`/browse/manga?type=${genreTargetType}`}
                className="text-white hover:text-[#ff4dd2] font-semibold capitalize transition-colors"
              >
                {formatName}
              </Link>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px]">Status</span>
              <span className={`font-semibold capitalize ${isCurrentlyPublishing ? 'text-emerald-400' : 'text-gray-200'}`}>
                {statusName}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px]">Origin</span>
              <Link 
                href={`/browse/manga?type=${genreTargetType}`}
                className="text-gray-200 hover:text-[#ff4dd2] font-semibold transition-colors"
              >
                {countryName}
              </Link>
            </div>
            {chaptersCount && (
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px]">Chapters</span>
                <span className="text-white font-semibold">{chaptersCount}</span>
              </div>
            )}
            {volumesCount && (
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px]">Volumes</span>
                <span className="text-white font-semibold">{volumesCount}</span>
              </div>
            )}
            {yearPublished && (
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px]">Published</span>
                <span className="text-gray-300 font-semibold">{yearPublished}</span>
              </div>
            )}
            {manga.genres && manga.genres.length > 0 && (
              <div className="col-span-2 flex flex-col gap-1.5 pt-2 border-t border-white/5">
                <span className="text-gray-400 text-[10px]">Genres</span>
                <div className="flex flex-wrap gap-1.5">
                  {manga.genres.map((g: any, idx: number) => {
                    const genreName = typeof g === 'string' ? g : g.name;
                    return (
                      <Link 
                        key={idx}
                        href={`/browse/manga?genre=${encodeURIComponent(genreName)}&type=${genreTargetType}`}
                        className="bg-white/5 hover:bg-[#ff4dd2]/20 hover:text-[#ff4dd2] text-[10px] text-gray-300 px-2 py-0.5 rounded-md border border-white/5 transition-all"
                      >
                        {genreName}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🎠 Recommended Manga & Novels Slider */}
        {safeRecommendations.length > 0 && (
          <div className="mt-12">
            <SectionSlider 
              title="Recommended Manga & Novels" 
              data={safeRecommendations as any} 
              type="anime" 
              viewAllLink="" 
              isManga={true} 
            />
          </div>
        )}

      </div>
    </main>
  );
}


