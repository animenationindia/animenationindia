import { getCharacterDetailsJikan } from '../../../lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Mic, Tv } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const character = await getCharacterDetailsJikan(id);
  if (!character) return { title: 'Character Not Found - Anime Nation India' };
  
  const name = character.name;
  const description = character.about ? character.about.substring(0, 160) + '...' : `Learn more about ${name}'s voice actors, anime appearances, and profile.`;
  
  return {
    title: `${name} - Anime Nation India`,
    description,
    openGraph: {
      title: `${name} - Character Details | Anime Nation India`,
      description,
      images: [character.images?.jpg?.image_url || ''],
    }
  };
}

export default async function CharacterDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = await getCharacterDetailsJikan(id);

  if (!character) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-[#a0a0a0] bg-[#000000] min-h-screen">
        <h1 className="text-3xl font-semibold text-white mb-4">Character Not Found</h1>
        <Link href="/" className="text-[#ffd54a] hover:underline transition-all">Go back home</Link>
      </div>
    );
  }

  const name = character.name;
  const image = character.images?.jpg?.image_url;
  const about = character.about || "No details available.";
  const likes = character.favorites > 1000 ? `${(character.favorites / 1000).toFixed(1)}k+` : character.favorites;

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
                <Image src={image} alt={name} fill sizes="(max-width: 1024px) 100vw, 300px" className="object-cover group-hover:scale-105 transition-transform duration-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-[#121214] to-[#1a1a1f] py-4 rounded-xl border border-white/5 shadow-lg">
              <Heart size={20} className="fill-[#ff6400] text-[#ff6400]" />
              <span className="font-bold text-xl tracking-wide">{likes} <span className="text-sm font-medium text-gray-400">Favorites</span></span>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="w-full lg:flex-1">
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{name}</h1>
            
            {character.name_kanji && (
              <h2 className="text-2xl text-[#ff4dd2] font-bold mb-4 drop-shadow-[0_0_10px_rgba(255, 77, 210,0.3)]">{character.name_kanji}</h2>
            )}

            {nicknames.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {nicknames.map((nick: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-[#2d2a3d]/40 border border-[#ff4dd2]/20 text-[#a0a0a0] text-sm font-medium rounded-full shadow-inner">
                    {nick}
                  </span>
                ))}
              </div>
            )}
            
            <div className="bg-gradient-to-br from-[#121214] to-[#0a0a0f] p-6 md:p-8 rounded-2xl border border-white/5 whitespace-pre-line text-[#d0d0d0] leading-relaxed shadow-xl mb-12 text-sm md:text-base">
              {about}
            </div>

            {/* Animeography */}
            {animeography.length > 0 && (
              <div className="mb-14">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Tv className="text-[#ffd54a]" size={24} /> 
                  Anime Appearances
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {animeography.map((item: any, idx: number) => {
                    const animeTitle = item.anime.title;
                    const animeImage = item.anime.images?.jpg?.large_image_url || item.anime.images?.jpg?.image_url;
                    return (
                      <Link href={`/series/${item.anime.mal_id}`} key={idx} className="group relative rounded-xl overflow-hidden bg-[#121214] border border-white/5 shadow-lg hover:border-[#ffd54a]/50 transition-colors">
                        <div className="relative aspect-[3/4] w-full">
                          {animeImage ? (
                            <Image src={animeImage} alt={animeTitle} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-[#1a1a24] flex items-center justify-center text-xs text-gray-500">No Image</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end">
                            <span className={`text-[10px] uppercase font-black tracking-wider mb-1 w-fit px-1.5 py-0.5 rounded ${item.role === 'Main' ? 'bg-[#ff4dd2] text-white' : 'bg-white/20 text-gray-300'}`}>
                              {item.role}
                            </span>
                            <h4 className="text-white font-bold text-sm line-clamp-2 leading-tight group-hover:text-[#ffd54a] transition-colors">{animeTitle}</h4>
                          </div>
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
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Mic className="text-[#ff6400]" size={24} /> 
                  Voice Actors
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {voices.map((item: any, idx: number) => {
                    const personName = item.person.name;
                    const personImage = item.person.images?.jpg?.image_url;
                    return (
                      <Link href={`/staff/${item.person.mal_id}`} key={idx} className="flex flex-col gap-2 group bg-gradient-to-b from-[#121214] to-[#0a0a0f] p-3 rounded-xl border border-white/5 hover:border-[#ff6400]/50 transition-all shadow-md">
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#1a1a24]">
                          {personImage ? (
                            <Image src={personImage} alt={personName} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Image</div>
                          )}
                        </div>
                        <div className="flex flex-col mt-1">
                          <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#ff6400] transition-colors">{personName}</h4>
                          <span className="text-gray-400 text-xs font-medium">{item.language}</span>
                        </div>
                      </Link>
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
