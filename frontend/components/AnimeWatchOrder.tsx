'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass, CheckCircle2, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { WatchOrderStep } from '../lib/franchise-order';

interface AnimeWatchOrderProps {
  steps: WatchOrderStep[];
}

export default function AnimeWatchOrder({ steps }: AnimeWatchOrderProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'MAIN'>('ALL');

  if (!steps || steps.length <= 1) return null;

  const mainOnlySteps = steps.filter(s => {
    const fmt = s.format.toUpperCase();
    const isMain = fmt === 'TV' || fmt === 'TV_SHORT' || s.relationType.includes('Season') || s.relationType.includes('Canon');
    return isMain || s.isCurrent;
  });

  const displaySteps = filterMode === 'MAIN' && mainOnlySteps.length > 1 ? mainOnlySteps : steps;

  return (
    <div className="bg-[#0b0c20]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl mb-8">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 flex-shrink-0">
            <Compass size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Franchise Chronological Watch Order
            </h3>
            <p className="text-xs text-gray-400">Complete canonical chronological roadmap of all seasons, movies, and OVAs.</p>
          </div>
        </div>

        {/* Filter Tabs & Count Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-extrabold'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
            }`}
          >
            All (${steps.length})
          </button>
          {mainOnlySteps.length > 1 && mainOnlySteps.length < steps.length && (
            <button
              onClick={() => setFilterMode('MAIN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'MAIN'
                  ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20 font-extrabold'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
              }`}
            >
              Main Story (${mainOnlySteps.length})
            </button>
          )}
        </div>
      </div>

      {/* Timeline Steps Grid */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displaySteps.map((item) => (
            <Link
              key={item.id}
              href={`/series/${item.id}`}
              className={`group relative flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-300 shadow-md ${
                item.isCurrent
                  ? 'bg-[#ff4dd2]/10 border-[#ff4dd2]/70 shadow-[#ff4dd2]/15 ring-1 ring-[#ff4dd2]/40'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Step Number Badge */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                item.isCurrent
                  ? 'bg-[#ff4dd2] text-black shadow-lg shadow-[#ff4dd2]/30'
                  : 'bg-white/10 text-gray-300 group-hover:bg-white/20 group-hover:text-white'
              }`}>
                #{item.step}
              </div>

              {/* Poster Thumbnail */}
              <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-white/10 shadow-sm">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    item.isCurrent
                      ? 'bg-[#ff4dd2]/20 text-[#ff4dd2] border border-[#ff4dd2]/40'
                      : 'bg-white/10 text-gray-300 border border-white/5'
                  }`}>
                    {item.relationType}
                  </span>
                  {item.isCurrent && (
                    <span className="text-[9px] font-extrabold bg-[#ff4dd2] text-black px-1.5 py-0.2 rounded-full">
                      You are here
                    </span>
                  )}
                </div>
                <h4 className={`text-xs font-bold truncate transition-colors ${
                  item.isCurrent ? 'text-white font-extrabold' : 'text-gray-200 group-hover:text-[#ff4dd2]'
                }`}>
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                  <span className="font-semibold text-gray-300">{item.format}</span>
                  {item.year && <span>• {item.year}</span>}
                </div>
              </div>

              {/* Arrow / Check Indicator */}
              <div className="flex-shrink-0 text-gray-500 group-hover:text-white transition-colors">
                {item.isCurrent ? (
                  <CheckCircle2 size={18} className="text-[#ff4dd2]" />
                ) : (
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
