'use client';

import Link from 'next/link';
import { Layers, Film, BookOpen } from 'lucide-react';

interface MangaFranchiseUniverseProps {
  relations: any[];
}

export default function MangaFranchiseUniverse({
  relations = [],
}: MangaFranchiseUniverseProps) {
  if (relations.length === 0) return null;

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-8 border-t border-white/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/25 flex-shrink-0">
          <Layers size={20} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">
            Franchise & Anime Adaptations
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Official anime adaptations, prequels, spin-offs, and side stories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {relations.map((rel: any, idx: number) => {
          const entry = rel.entry?.[0] || rel.node || rel;
          const relType = rel.relationType || rel.relation || 'ADAPTATION';
          const isAnime = relType.toUpperCase().includes('ADAPTATION') || entry.type?.toLowerCase() === 'anime';
          const id = entry.mal_id || entry.id;
          const country = (entry.countryOfOrigin || '').toUpperCase();
          const fmt = (entry.format || '').toUpperCase();
          let readingHref = `/read/manga/${id}`;
          if (country === 'KR' || fmt === 'MANHWA') readingHref = `/read/manhwa/${id}`;
          else if (country === 'CN' || fmt === 'MANHUA') readingHref = `/read/manhua/${id}`;
          else if (fmt === 'NOVEL' || fmt === 'LIGHT NOVEL') readingHref = `/read/novels/${id}`;
          const href = isAnime ? `/series/${id}` : readingHref;
          const title = entry.name || entry.title?.english || entry.title?.romaji || 'Related Title';
          const cover =
            entry.images?.webp?.large_image_url ||
            entry.images?.jpg?.large_image_url ||
            entry.coverImage?.large ||
            `https://api-cdn.myanimelist.net/images/anime/${entry.mal_id || entry.id}.jpg`;

          return (
            <Link
              key={idx}
              href={href}
              className="group flex flex-col rounded-2xl border border-white/8 bg-[#0a0b1a]/80 p-2.5 hover:border-[#ff4dd2]/50 hover:-translate-y-1 transition-all"
            >
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#121326] mb-2.5">
                <img
                  src={cover}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-1.5 left-1.5 bg-[#ff4dd2] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {relType.replace(/_/g, ' ')}
                </span>
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                  {isAnime ? <Film size={10} className="text-[#ff4dd2]" /> : <BookOpen size={10} />}
                  {isAnime ? 'ANIME' : 'MANGA'}
                </span>
              </div>
              <p className="text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors truncate">
                {title}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
