// components/PersonCard.tsx
import Image from 'next/image';
import { Heart } from 'lucide-react';
import Link from 'next/link';

interface PersonData {
  id: number;
  name: {
    full: string;
  };
  favourites: number;
  image?: {
    large: string | null;
  } | null;
}

export default function PersonCard({ person, linkType = 'character' }: { person: PersonData, linkType?: 'character' | 'staff' }) {
  const name = person.name.full;
  const likes = person.favourites > 1000 ? `${(person.favourites / 1000).toFixed(1)}k+` : person.favourites;

  return (
    <Link href={`/${linkType}/${person.id}`} className="block relative group w-full aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-[#121214] border border-white/5">
      {person.image?.large && (
        <Image src={person.image.large} alt={name} fill sizes="150px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
      )}
      
      {/* Top Likes Badge */}
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 z-20">
        <Heart size={12} className="fill-white text-white" />
        <span className="text-white text-[10px] font-bold">{likes}</span>
      </div>

      {/* Bottom Name Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 w-full p-3 z-20 text-center">
        <h4 className="text-white text-sm font-bold truncate group-hover:text-[#ff6400] transition-colors">{name}</h4>
      </div>
    </Link>
  );
}