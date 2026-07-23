import { cache } from 'react';
import { getPersonDetailsJikan } from '../../../lib/api';
import { sanitizeDescription } from '../../../lib/sanitize';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Mic, Briefcase, Globe } from 'lucide-react';
import ReadMoreText from '../../../components/ReadMoreText';
import type { Metadata } from 'next';

const getCachedPersonDetails = cache(async (id: string) => {
  return getPersonDetailsJikan(id);
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const person = await getCachedPersonDetails(id);
    if (!person) throw new Error("Person not found");
    
    const name = person.name;
    const rawAbout = person.about || `Learn more about ${name}'s voice acting roles, anime staff positions, and biography.`;
    const cleanDesc = sanitizeDescription(rawAbout).replace(/\s+/g, ' ').slice(0, 160);
    const image = person.images?.jpg?.image_url || '/ani-logo.png';
    
    return {
      title: `${name} - Voice Actor & Staff Profile | Anime Nation India`,
      description: cleanDesc,
      openGraph: {
        title: `${name} - Voice Actor & Staff Profile | Anime Nation India`,
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
      title: 'Voice Actor & Staff Profile - Anime Nation India',
      description: 'Explore popular voice actors (seiyuu), anime staff members, and biographies.',
    };
  }
}

export default async function PersonDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await getCachedPersonDetails(id);

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
  const about = sanitizeDescription(person.about || "No biography available.");
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
            
            <div className="mt-6 flex flex-col gap-3 bg-[#121326]/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Favorites</span>
                <span className="text-[#ff4dd2] font-bold flex items-center gap-1">
                  <Heart size={14} className="fill-[#ff4dd2]" /> {likes}
                </span>
              </div>
              {person.given_name && (
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-400">Given Name</span>
                  <span className="text-gray-300 font-semibold">{person.given_name}</span>
                </div>
              )}
              {person.family_name && (
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-400">Family Name</span>
                  <span className="text-gray-300 font-semibold">{person.family_name}</span>
                </div>
              )}
              {person.birthday && (
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-400">Birthday</span>
                  <span className="text-gray-300 font-semibold">{new Date(person.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {person.website_url && (
                <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-400">Website</span>
                  <a href={person.website_url} target="_blank" rel="noopener noreferrer" className="text-[#ff4dd2] hover:underline text-xs flex items-center gap-1 font-semibold">
                    <Globe size={12} /> Link
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="flex-1 flex flex-col gap-8">
            <div>
              <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-4">{name}</h1>
              <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
                <ReadMoreText text={about} />
              </div>
            </div>

            {/* Voice Roles */}
            {voiceRoles.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Mic size={18} className="text-[#ff4dd2]" /> Voice Acting Roles ({voiceRoles.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {voiceRoles.slice(0, 12).map((item: any, idx: number) => (
                    <div key={idx} className="bg-[#121326]/40 border border-white/5 p-3 rounded-xl flex items-center justify-between hover:border-[#ff4dd2]/30 transition-all group">
                      <Link href={`/character/${item.character.mal_id}`} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/10">
                          <Image src={item.character.images?.jpg?.image_url || ''} alt={item.character.name} fill sizes="48px" className="object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white group-hover:text-[#ff4dd2] line-clamp-1">{item.character.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">{item.role} Role</span>
                        </div>
                      </Link>
                      
                      {item.anime && (
                        <Link href={`/series/${item.anime.mal_id}`} className="text-right text-[10px] text-gray-400 hover:text-white line-clamp-1 max-w-[120px]">
                          {item.anime.title}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anime Staff Positions */}
            {animeStaff.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-[#ff4dd2]" /> Anime Staff Positions ({animeStaff.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {animeStaff.slice(0, 10).map((item: any, idx: number) => (
                    <Link key={idx} href={`/series/${item.anime.mal_id}`} className="bg-[#121326]/40 border border-white/5 p-3 rounded-xl flex items-center gap-3 hover:border-[#ff4dd2]/30 transition-all group">
                      <div className="relative w-12 h-16 rounded overflow-hidden shrink-0">
                        <Image src={item.anime.images?.jpg?.image_url || ''} alt={item.anime.title} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white group-hover:text-[#ff4dd2] line-clamp-1">{item.anime.title}</span>
                        <span className="text-[10px] text-gray-400 font-semibold line-clamp-1">{item.position}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
