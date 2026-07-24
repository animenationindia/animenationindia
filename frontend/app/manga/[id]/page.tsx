// app/manga/[id]/page.tsx
import { cache } from 'react';
import { getMangaFullDetails, getMangaCharacters, getAniListMangaExtraInfo, getMangaRecommendations } from '../../../lib/api';
import { sanitizeDescription } from '../../../lib/sanitize';
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
    const cover = manga.images?.jpg?.large_image_url || '/ani-logo.png';
    
    return {
      title: `${title} - Read Manga | Anime Nation India`,
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

  // Parallel Fetching for speed with cached main detail
  const [manga, characters, extraInfo, recommendations] = await Promise.all([
    getCachedMangaDetails(id),
    getMangaCharacters(id),
    getAniListMangaExtraInfo(Number(id)),
    getMangaRecommendations(id)
  ]);

  if (!manga) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-[#a0a0a0] bg-[#000000] min-h-screen">
        <h1 className="text-3xl font-semibold text-white mb-4">Manga Not Found</h1>
        <Link href="/" className="text-[#ff4dd2] hover:underline transition-all">Go back home</Link>
      </div>
    );
  }

  const title = manga.title_english || manga.title || 'Unknown Title';
  const coverImage = manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || '';
  const score = manga.score ? (manga.score / 10).toFixed(1) : null;
  const synopsis = sanitizeDescription(manga.synopsis);

  const safeRecommendations = (recommendations || []).map((rec: any) => ({
    id: rec.entry.mal_id,
    idMal: rec.entry.mal_id,
    title: { english: rec.entry.title, romaji: rec.entry.title },
    coverImage: {
      extraLarge: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || '',
      large: rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || ''
    },
    format: 'MANGA',
    type: 'MANGA',
    averageScore: null
  }));

  return (
    <main className="min-h-screen bg-[#050716] text-white pt-32 lg:pt-36 pb-20">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1400px]">
        
        {/* Top Header Card */}
        <div className="flex flex-col md:flex-row gap-8 bg-[#121326]/60 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl mb-12">
          <div className="relative w-full md:w-[260px] aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {coverImage && (
              <Image src={coverImage} alt={title} fill sizes="(max-width: 768px) 100vw, 260px" priority className="object-cover" />
            )}
          </div>

          <div className="flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {manga.type || 'Manga'}
                </span>
                {manga.status && (
                  <span className="bg-white/10 text-gray-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {manga.status}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                {title}
              </h1>

              <div className="flex items-center gap-6 mb-6">
                {score && (
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-lg">
                    <Star className="fill-amber-400" size={20} />
                    <span>{score}</span>
                  </div>
                )}
                {manga.chapters && (
                  <div className="text-gray-400 text-sm font-semibold flex items-center gap-1.5">
                    <BookOpen size={16} className="text-[#ff4dd2]" />
                    <span>{manga.chapters} Chapters</span>
                  </div>
                )}
              </div>

              <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-6 mb-6">
                {synopsis}
              </p>
            </div>

            <div className="w-full max-w-xs">
              <WatchlistDropdown animeId={manga.mal_id} title={title} image={coverImage} type="Manga" />
            </div>
          </div>
        </div>

        {/* Characters Section */}
        {characters && characters.length > 0 && (
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Main Characters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {characters.slice(0, 12).map((item: MangaCharacter, index: number) => (
                <Link key={index} href={`/character/${item.character.mal_id}`} className="bg-[#121326]/40 border border-white/5 p-3 rounded-2xl flex flex-col items-center text-center group hover:border-[#ff4dd2]/30 transition-all">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 border border-white/10">
                    <Image src={item.character.images.jpg?.image_url || ''} alt={item.character.name} fill sizes="80px" className="object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff4dd2]">{item.character.name}</h4>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{item.role}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {safeRecommendations.length > 0 && (
          <SectionSlider title="Recommended Manga" data={safeRecommendations as any} type="anime" viewAllLink="" isManga={true} />
        )}
      </div>
    </main>
  );
}
