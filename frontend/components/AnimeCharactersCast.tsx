'use client';

import { useState } from 'react';
import { Users, Grid3X3, List, Mic2 } from 'lucide-react';

interface AnimeCharactersCastProps {
  characters: any[]; // AniList characters.edges array
}

export default function AnimeCharactersCast({ characters }: AnimeCharactersCastProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'pair'>('grid');
  const [showAll, setShowAll] = useState(false);

  if (!characters || characters.length === 0) return null;

  const displayed = showAll ? characters : characters.slice(0, 12);

  const getSeiyuu = (char: any) => {
    if (!char.voiceActors || char.voiceActors.length === 0) return null;
    return char.voiceActors.find((va: any) => va.language === 'JAPANESE') || null;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'MAIN') {
      return (
        <span className="absolute top-1.5 left-1.5 bg-[#ff4dd2] text-black text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none z-10">
          MAIN
        </span>
      );
    }
    return (
      <span className="absolute top-1.5 left-1.5 bg-white/20 text-gray-200 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none z-10">
        {role === 'SUPPORTING' ? 'SUP' : role}
      </span>
    );
  };

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-10 border-t border-white/5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/25 p-2.5 rounded-2xl">
            <Users size={20} />
          </div>
          <div>
            <h2 className="font-black uppercase text-white text-base tracking-wide leading-tight">
              CHARACTERS &amp; VOICE CAST (SEIYUU)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Official voice actors and lead protagonists
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#ff4dd2]/20 text-[#ff4dd2]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label="Grid view"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              onClick={() => setViewMode('pair')}
              className={`p-2 transition-colors ${
                viewMode === 'pair'
                  ? 'bg-[#ff4dd2]/20 text-[#ff4dd2]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>

          {/* Show All */}
          {characters.length > 12 && (
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="text-xs text-gray-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-colors"
            >
              {showAll ? '- Show Less' : `+ View All (${characters.length})`}
            </button>
          )}
        </div>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayed.map((char: any, idx: number) => {
            const node = char.node;
            const seiyuu = getSeiyuu(char);
            const name = node?.name?.full || node?.name?.native || 'Unknown';
            const image = node?.image?.large || node?.image?.medium;

            return (
              <div
                key={node?.id ?? idx}
                className="rounded-2xl border border-white/10 bg-[#0a0b1a]/80 p-3 hover:border-[#ff4dd2]/50 transition-all group flex flex-col gap-2"
              >
                {/* Poster */}
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white/5">
                  {getRoleBadge(char.role)}
                  {image ? (
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#ff4dd2]/40 select-none">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Character Name */}
                <p className="text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors line-clamp-1 leading-tight">
                  {name}
                </p>

                {/* Seiyuu */}
                {seiyuu && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <Mic2 size={10} className="flex-shrink-0 text-[#ff4dd2]/60" />
                    <span className="text-[10px] line-clamp-1">
                      {seiyuu.name?.full || seiyuu.name?.native}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CAST PAIR VIEW */}
      {viewMode === 'pair' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayed.map((char: any, idx: number) => {
            const node = char.node;
            const seiyuu = getSeiyuu(char);
            const charName = node?.name?.full || node?.name?.native || 'Unknown';
            const charImage = node?.image?.large || node?.image?.medium;
            const vaName = seiyuu?.name?.full || seiyuu?.name?.native;
            const vaImage = seiyuu?.image?.large || seiyuu?.image?.medium;
            const isMain = char.role === 'MAIN';

            return (
              <div
                key={node?.id ?? idx}
                className="bg-[#0a0b1a]/80 border border-white/10 rounded-2xl p-3 hover:border-[#ff4dd2]/30 transition-all flex items-center gap-3"
              >
                {/* Character Side */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    {charImage ? (
                      <img
                        src={charImage}
                        alt={charName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-black text-[#ff4dd2]/40">
                        {charName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white line-clamp-1">{charName}</p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        isMain
                          ? 'text-[#ff4dd2] bg-[#ff4dd2]/10'
                          : 'text-gray-400 bg-white/5'
                      }`}
                    >
                      {char.role === 'SUPPORTING' ? 'SUPPORTING' : char.role}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-[#ff4dd2]/30 flex-shrink-0" />

                {/* Seiyuu Side */}
                {seiyuu ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <div className="min-w-0 text-right">
                      <p className="text-xs font-bold text-white line-clamp-1">{vaName}</p>
                      <span className="text-[9px] font-bold text-[#ff4dd2]">Japanese VA</span>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 border border-[#ff4dd2]/40 flex-shrink-0">
                      {vaImage ? (
                        <img
                          src={vaImage}
                          alt={vaName || 'Voice Actor'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-[#ff4dd2]/40">
                          {vaName ? vaName.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-right">
                    <p className="text-[10px] text-gray-600 italic">No VA listed</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}