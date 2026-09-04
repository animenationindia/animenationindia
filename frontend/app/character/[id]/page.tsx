export const runtime = 'edge';
/* eslint-disable @next/next/no-img-element */
import { cache } from 'react';
import { getCharacterDetailsJikan } from '../../../lib/api';
import { sanitizeDescription } from '../../../lib/sanitize';
import Link from 'next/link';
import { Heart, Mic, Tv } from 'lucide-react';
import ReadMoreText from '../../../components/ReadMoreText';
import type { Metadata } from 'next';

const getCachedCharacterDetails = cache(async (id: string) => {
  return getCharacterDetailsJikan(id);
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const character = await getCachedCharacterDetails(id);
    if (!character) throw new Error("Character not found");
    
    const name = character.name;
    const rawAbout = character.about || `Learn more about ${name}'s voice actors, anime appearances, and profile.`;
    const cleanDesc = sanitizeDescription(rawAbout).replace(/\s+/g, ' ').slice(0, 160);
    const image = character.images?.jpg?.image_url || '/ani-logo.png';
    
    return {
      title: `${name} - Character Profile | Anime Nation India`,
      description: cleanDesc,
      openGraph: {
        title: `${name} - Character Details | Anime Nation India`,
        description: cleanDesc,
        images: [{ url: image, alt: name }],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} - Anime Nation India`,
        description: cleanDesc,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'Anime Character Profile - Anime Nation India',
      description: 'Explore popular anime character details, voice actors, and appearances.',
    };
  }
}

export default async function CharacterDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = await getCachedCharacterDetails(id);

  if (!character) {
    return (
      <div className="container mx-auto px-4 py-36 text-center text-[#a0a0a0] min-h-[70vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Character Not Found</h1>
        <p className="text-gray-400 text-sm mb-6 max-w-md">The requested character details could not be retrieved. They might not exist in the database yet.</p>
        <div className="flex items-center gap-4">
          <Link href="/characters" className="bg-[#ff4dd2] hover:bg-[#e03cb7] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[#ff4dd2]/20">
            Browse Top Characters
          </Link>
          <Link href="/" className="bg-white/10 hover:bg-white/15 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all border border-white/10">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const name = character.name;
  const image = character.images?.jpg?.image_url || character.images?.webp?.image_url || '/placeholder-poster.png';
  const about = sanitizeDescription(character.about || "No details available.");
  const likes = character.favorites > 1000 ? `${(character.favorites / 1000).toFixed(1)}k+` : (character.favorites || 0);

  const nicknames = character.nicknames || [];
  const animeography = character.anime || [];
  const voices = character.voices || [];

  return (
    <main className="min-h-screen bg-[#050716] text-white pt-32 lg:pt-36 pb-20">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column - Profile */}
          <div className="w-full lg:w-[300px] shrink-0">
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-[#2A2B30]/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-[#121214] group">
              {image && (
                <img src={image} alt={name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>
            
            <div className="mt-6 flex flex-col gap-3 bg-[#121326]/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Favorites</span>
                <span className="text-[#ff4dd2] font-bold flex items-center gap-1">
                  <Heart size={14} className="fill-[#ff4dd2]" /> {likes}
                </span>
              </div>
              {character.name_kanji && (
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-400 font-semibold text-xs">Japanese Name</span>
                  <span className="text-gray-200 font-medium text-xs">{character.name_kanji}</span>
                </div>
              )}
              {nicknames.length > 0 && (
                <div className="flex flex-col gap-1 text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-400 font-semibold text-xs">Nicknames</span>
                  <span className="text-gray-300 text-xs">{nicknames.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 drop-shadow-md">{name}</h1>
              <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-gray-300 text-sm leading-relaxed shadow-xl">
                <ReadMoreText text={about} />
              </div>
            </div>

            {/* Animeography */}
            {animeography.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Tv size={18} className="text-[#ff4dd2]" /> Anime Appearances ({animeography.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {animeography.slice(0, 12).map((item: any, idx: number) => {
                    const animeId = item.anime?.mal_id || item.anime?.id;
                    return (
                      <Link 
                        key={idx} 
                        href={animeId ? `/series/${animeId}` : '#'} 
                        className="bg-[#121326]/40 border border-white/5 p-3 rounded-xl flex items-center gap-3 hover:border-[#ff4dd2]/30 hover:bg-[#121326]/80 transition-all group"
                      >
                        <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[#0a0b16]">
                          <img src={item.anime?.images?.jpg?.image_url || '/placeholder-poster.png'} alt={item.anime?.title || ''} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-[#ff4dd2] line-clamp-1 transition-colors">{item.anime?.title || 'Unknown Anime'}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">{item.role || 'Main'} Role</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Voice Actors */}
            {voices.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Mic size={18} className="text-[#ff4dd2]" /> Voice Actors ({voices.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {voices.slice(0, 10).map((v: any, idx: number) => {
                    const personId = v.person?.mal_id || v.person?.id;
                    const vaLink = personId ? `/staff/${personId}` : null;
                    
                    const innerContent = (
                      <>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10 bg-[#0a0b16]">
                          <img src={v.person?.images?.jpg?.image_url || '/placeholder.png'} alt={v.person?.name || ''} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors line-clamp-1">{v.person?.name || 'Unknown VA'}</span>
                          <span className="text-[10px] text-[#ff4dd2] uppercase font-semibold">{v.language || 'Japanese'}</span>
                        </div>
                      </>
                    );

                    return vaLink ? (
                      <Link key={idx} href={vaLink} className="bg-[#121326]/40 border border-white/5 p-3 rounded-xl flex items-center gap-3 hover:border-[#ff4dd2]/30 hover:bg-[#121326]/80 transition-all group cursor-pointer">
                        {innerContent}
                      </Link>
                    ) : (
                      <div key={idx} className="bg-[#121326]/40 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                        {innerContent}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
