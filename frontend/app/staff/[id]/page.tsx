import { getPersonDetailsJikan } from '../../../lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Mic, Briefcase, Globe } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const person = await getPersonDetailsJikan(id);
  if (!person) return { title: 'Person Not Found - Anime Nation India' };
  
  const name = person.name;
  const description = person.about ? person.about.substring(0, 160) + '...' : `Learn more about ${name}'s voice acting roles, anime staff positions, and profile.`;
  
  return {
    title: `${name} - Anime Nation India`,
    description,
    openGraph: {
      title: `${name} - Voice Actor / Staff Details | Anime Nation India`,
      description,
      images: [person.images?.jpg?.image_url || ''],
    }
  };
}

export default async function PersonDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getPersonDetailsJikan(id);

  if (!person) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-[#a0a0a0] bg-[#000000] min-h-screen">
        <h1 className="text-3xl font-semibold text-white mb-4">Person Not Found</h1>
        <Link href="/" className="text-[#ff4dd2] hover:underline transition-all">Go back home</Link>
      </div>
    );
  }

  const name = person.name;
  const image = person.images?.jpg?.image_url;
  const about = person.about || "No biography available.";
  const likes = person.favorites > 1000 ? `${(person.favorites / 1000).toFixed(1)}k+` : person.favorites;

  const animeStaff = person.anime || [];
  const voiceRoles = person.voices || [];

  return (
    <main className="min-h-screen bg-[#050716] text-white pt-32 lg:pt-36 pb-20">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left Column - Profile Image & Quick Info */}
          <div className="w-full lg:w-[300px] shrink-0">
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-[#2A2B30]/50 shadow-[0_0_30px_rgba(0,0,0,0.8)] bg-[#121214] group">
              {image && (
                <Image src={image} alt={name} fill sizes="(max-width: 1024px) 100vw, 300px" className="object-cover group-hover:scale-105 transition-transform duration-700" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-[#121214] to-[#1a1a1f] py-4 rounded-xl border border-white/5 shadow-lg mb-6">
              <Heart size={20} className="fill-[#ff4dd2] text-[#ff4dd2]" />
              <span className="font-bold text-xl tracking-wide">{likes} <span className="text-sm font-medium text-gray-400">Favorites</span></span>
            </div>

            {/* Personal Metadata */}
            <div className="bg-[#121214] p-5 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#a0a0a0] border-b border-white/10 pb-2">Information</h3>
              
              {person.given_name && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Given Name</p>
                  <p className="font-semibold">{person.given_name}</p>
                </div>
              )}
              {person.family_name && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Family Name</p>
                  <p className="font-semibold">{person.family_name}</p>
                </div>
              )}
              {person.birthday && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Birthday</p>
                  <p className="font-semibold">{new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              )}
              {person.website_url && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Website</p>
                  <a href={person.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-[#ff4dd2] hover:text-white transition-colors">
                    <Globe size={14} /> Visit Link
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="w-full lg:flex-1">
            <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{name}</h1>
            
            <div className="bg-gradient-to-br from-[#121214] to-[#0a0a0f] p-6 md:p-8 rounded-2xl border border-white/5 whitespace-pre-line text-[#d0d0d0] leading-relaxed shadow-xl mb-12 text-sm md:text-base">
              {about}
            </div>

            {/* Voice Acting Roles */}
            {voiceRoles.length > 0 && (
              <div className="mb-14">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Mic className="text-[#ff4dd2]" size={24} /> 
                  Voice Acting Roles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {voiceRoles.map((item: any, idx: number) => {
                    const animeTitle = item.anime.title;
                    const animeImage = item.anime.images?.jpg?.large_image_url || item.anime.images?.jpg?.image_url;
                    
                    const charName = item.character.name;
                    const charImage = item.character.images?.jpg?.image_url;

                    return (
                      <div key={idx} className="flex bg-[#121214] rounded-xl overflow-hidden border border-white/5 hover:border-[#ff4dd2]/50 hover:shadow-[0_0_20px_rgba(255, 77, 210,0.15)] transition-all group h-32">
                        {/* Anime Side */}
                        <div className="flex-1 flex items-center gap-3 p-2 border-r border-white/5">
                          <Link href={`/series/${item.anime.mal_id}`} className="shrink-0 relative h-full aspect-[3/4] rounded-md overflow-hidden">
                            {animeImage && <Image src={animeImage} alt={animeTitle} fill sizes="(max-width: 768px) 20vw, 10vw" className="object-cover group-hover:scale-105 transition-transform" />}
                          </Link>
                          <div className="flex flex-col justify-center h-full overflow-hidden">
                            <Link href={`/series/${item.anime.mal_id}`} className="text-sm font-bold line-clamp-2 hover:text-[#ff4dd2] transition-colors">{animeTitle}</Link>
                            <span className="text-[10px] text-gray-500 uppercase font-bold mt-1">Anime</span>
                          </div>
                        </div>

                        {/* Character Side */}
                        <div className="flex-1 flex items-center gap-3 p-2 flex-row-reverse text-right">
                          <Link href={`/character/${item.character.mal_id}`} className="shrink-0 relative h-full aspect-[3/4] rounded-md overflow-hidden">
                            {charImage && <Image src={charImage} alt={charName} fill sizes="(max-width: 768px) 20vw, 10vw" className="object-cover group-hover:scale-105 transition-transform" />}
                          </Link>
                          <div className="flex flex-col justify-center h-full overflow-hidden">
                            <Link href={`/character/${item.character.mal_id}`} className="text-sm font-bold line-clamp-2 hover:text-[#ff4dd2] transition-colors">{charName}</Link>
                            <span className={`text-[10px] uppercase font-black tracking-wider mt-1 w-fit ml-auto px-1.5 py-0.5 rounded ${item.role === 'Main' ? 'bg-[#ff4dd2]/20 text-[#ff4dd2]' : 'bg-white/10 text-gray-400'}`}>
                              {item.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Staff Positions (Anime Crew) */}
            {animeStaff.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Briefcase className="text-[#ff4dd2]" size={24} /> 
                  Anime Staff Positions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {animeStaff.map((item: any, idx: number) => {
                    const animeTitle = item.anime.title;
                    const animeImage = item.anime.images?.jpg?.large_image_url || item.anime.images?.jpg?.image_url;
                    return (
                      <Link href={`/series/${item.anime.mal_id}`} key={idx} className="group relative rounded-xl overflow-hidden bg-[#121214] border border-white/5 shadow-lg hover:border-[#ff4dd2]/50 transition-colors">
                        <div className="relative aspect-[3/4] w-full">
                          {animeImage ? (
                            <Image src={animeImage} alt={animeTitle} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-[#1a1a24] flex items-center justify-center text-xs text-gray-500">No Image</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end h-full text-center">
                            <span className="text-xs font-bold text-[#ff4dd2] mb-1 line-clamp-3 bg-black/60 px-2 py-1 rounded-md backdrop-blur-md border border-white/10">{item.position}</span>
                            <h4 className="text-white font-bold text-sm line-clamp-2 mt-auto">{animeTitle}</h4>
                          </div>
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
