'use client';

import { Users, PenTool, Sparkles } from 'lucide-react';

interface MangaCharactersCastProps {
  characters: any[];
  authors?: any[];
}

export default function MangaCharactersCast({
  characters = [],
  authors = [],
}: MangaCharactersCastProps) {
  if (characters.length === 0 && authors.length === 0) return null;

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-8 border-t border-white/5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/25 flex-shrink-0">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">
            Characters & Creators
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Key protagonists, story writers, and lead illustrators
          </p>
        </div>
      </div>

      {/* Authors & Artists Row (if available) */}
      {authors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3 flex items-center gap-1.5">
            <PenTool size={13} className="text-[#ff4dd2]" /> Creators & Staff
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {authors.map((author: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a0b1a]/80 border border-white/8"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                  {author.name?.[0] || 'C'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{author.name}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{author.role || 'Creator'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters Grid */}
      {characters.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {characters.slice(0, 12).map((char: any, i: number) => {
            const charName = char.character?.name || char.name?.full || char.node?.name?.full || 'Character';
            const charRole = char.role || 'MAIN';
            const charImage =
              char.character?.images?.webp?.image_url ||
              char.character?.images?.jpg?.image_url ||
              char.image?.large ||
              char.node?.image?.large ||
              '/placeholder-poster.png';

            const isMain = charRole.toUpperCase() === 'MAIN';

            return (
              <div
                key={i}
                className="group flex flex-col rounded-2xl border border-white/8 bg-[#0a0b1a]/80 p-2.5 hover:border-[#ff4dd2]/40 transition-all"
              >
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-[#121326] mb-2">
                  <img
                    src={charImage}
                    alt={charName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span
                    className={`absolute top-1.5 left-1.5 text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isMain
                        ? 'bg-[#ff4dd2] text-black'
                        : 'bg-black/70 text-gray-300 border border-white/10'
                    }`}
                  >
                    {charRole}
                  </span>
                </div>
                <p className="text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors truncate">
                  {charName}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
