'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface AnimeRecommendationsProps {
  recommendations: any[]; // Already formatted by AnimeDetailsContainer
  relations?: any[]; // Fallback if recommendations is empty
}

export default function AnimeRecommendations({
  recommendations,
  relations = [],
}: AnimeRecommendationsProps) {
  // Determine source: recommendations first, else anime-type relations
  const hasRecs = recommendations && recommendations.length > 0;
  const hasRelations = relations && relations.length > 0;

  if (!hasRecs && !hasRelations) return null;

  let items: any[];
  if (hasRecs) {
    items = recommendations.slice(0, 12);
  } else {
    // Filter relations to anime-type only
    items = relations
      .filter((edge: any) => {
        const type = edge.node?.type || edge.type;
        return type !== 'MANGA';
      })
      .map((edge: any) => edge.node || edge)
      .slice(0, 12);
  }

  if (!items || items.length === 0) return null;

  const getCover = (rec: any) => {
    return (
      rec.coverImage?.extraLarge ||
      rec.coverImage?.large ||
      rec.coverImage?.medium ||
      '/placeholder-poster.png'
    );
  };

  const getTitle = (rec: any) => {
    return (
      rec.title?.english ||
      rec.title?.romaji ||
      rec.title?.native ||
      rec.name ||
      'Unknown'
    );
  };

  const getHref = (rec: any) => {
    const isManga = rec.type === 'MANGA' || rec.format === 'MANGA' || rec.format === 'NOVEL' || rec.format === 'ONE_SHOT';
    const id = rec.idMal || rec.id || rec.mal_id;
    if (isManga) {
      const country = (rec.countryOfOrigin || '').toUpperCase();
      const fmt = (rec.format || '').toUpperCase();
      if (country === 'KR' || fmt === 'MANHWA') return `/read/manhwa/${id}`;
      if (country === 'CN' || fmt === 'MANHUA') return `/read/manhua/${id}`;
      if (fmt === 'NOVEL' || fmt === 'LIGHT NOVEL') return `/read/novels/${id}`;
      return `/read/manga/${id}`;
    }
    return `/series/${id}`;
  };

  const getFormat = (rec: any) => {
    return rec.format || rec.type || '';
  };

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-10 border-t border-white/5">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/25 p-2.5 rounded-2xl">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-black uppercase text-white text-base tracking-wide leading-tight">
            YOU MAY ALSO LIKE
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Curated AniList recommendations for this title
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((rec: any, idx: number) => {
          const title = getTitle(rec);
          const cover = getCover(rec);
          const format = getFormat(rec);
          const score = rec.averageScore;

          return (
            <Link
              key={rec.id ?? rec.idMal ?? idx}
              href={getHref(rec)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0b1a]/80 hover:border-[#ff4dd2]/50 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Poster */}
              <div className="relative w-full aspect-[2/3] bg-white/5">
                <img
                  src={cover}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-poster.png';
                  }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Score Badge */}
                {score && (
                  <span className="absolute top-1.5 right-1.5 bg-amber-500/80 text-black text-[9px] font-black px-1.5 py-0.5 rounded-lg leading-none">
                    * {score}%
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5 flex flex-col gap-0.5">
                <p className="line-clamp-1 text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors leading-tight">
                  {title}
                </p>
                {format && (
                  <span className="text-[10px] text-gray-500 capitalize">
                    {format.toLowerCase()}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}