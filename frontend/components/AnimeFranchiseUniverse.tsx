'use client';

import { Layers } from 'lucide-react';
import Link from 'next/link';

interface AnimeFranchiseUniverseProps {
  relations: any[]; // AniList relations.edges (or Jikan fallback) already passed from page
}

export default function AnimeFranchiseUniverse({ relations }: AnimeFranchiseUniverseProps) {
  if (!relations || relations.length === 0) return null;

  // Sort by release year ascending, nulls last
  const sorted = [...relations].sort((a, b) => {
    const yearA = a.node?.startDate?.year ?? Infinity;
    const yearB = b.node?.startDate?.year ?? Infinity;
    return yearA - yearB;
  });

  const getHref = (edge: any) => {
    const node = edge.node;
    if (node?.type === 'MANGA') {
      const id = node.idMal || node.id;
      const country = (node.countryOfOrigin || '').toUpperCase();
      const fmt = (node.format || '').toUpperCase();
      if (country === 'KR' || fmt === 'MANHWA') return `/read/manhwa/${id}`;
      if (country === 'CN' || fmt === 'MANHUA') return `/read/manhua/${id}`;
      if (fmt === 'NOVEL' || fmt === 'LIGHT NOVEL') return `/read/novels/${id}`;
      return `/read/manga/${id}`;
    }
    return `/series/${node?.idMal || node?.id}`;
  };

  const getCoverImage = (node: any) => {
    return (
      node?.coverImage?.extraLarge ||
      node?.coverImage?.large ||
      node?.coverImage?.medium ||
      null
    );
  };

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-10 border-t border-white/5">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-500/15 text-purple-400 border border-purple-500/25 p-2.5 rounded-2xl">
          <Layers size={20} />
        </div>
        <div>
          <h2 className="font-black uppercase text-white text-base tracking-wide leading-tight">
            FRANCHISE UNIVERSE &amp; CHRONOLOGY
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Prequels, sequels, movies, and spin-offs
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sorted.map((edge: any, idx: number) => {
          const node = edge.node;
          const title =
            node?.title?.english ||
            node?.title?.romaji ||
            node?.title?.native ||
            'Unknown';
          const cover = getCoverImage(node);
          const relationType = edge.relationType || edge.relation || 'RELATED';
          const formattedRelation = relationType.replace(/_/g, ' ');
          const format = node?.format || node?.type || '';
          const year = node?.startDate?.year;

          return (
            <Link
              key={node?.id ?? idx}
              href={getHref(edge)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b1a]/80 hover:border-[#ff4dd2]/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Poster */}
              <div className="relative w-full aspect-[2/3] bg-white/5">
                {cover ? (
                  <img
                    src={cover}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white/10 select-none">
                    {title.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Relation Badge */}
                <span className="absolute top-1.5 left-1.5 bg-[#ff4dd2] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase leading-none">
                  {formattedRelation}
                </span>
              </div>

              {/* Info */}
              <div className="p-2.5 flex flex-col gap-0.5">
                <p className="line-clamp-1 text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors leading-tight">
                  {title}
                </p>
                <p className="text-[10px] text-gray-400 lowercase">
                  {[format, year].filter(Boolean).join(' · ')}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}