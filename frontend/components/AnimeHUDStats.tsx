'use client';

import { Tv, Clock, BookOpen, Building2, Volume2, Radio } from 'lucide-react';

interface AnimeHUDStatsProps {
  anime: any;
  extraInfo?: any;
}

export default function AnimeHUDStats({ anime, extraInfo }: AnimeHUDStatsProps) {
  const episodes = anime.episodes || extraInfo?.episodes || null;
  const duration = anime.duration
    ? anime.duration.replace('per ep', '').replace('min', 'mins').trim()
    : extraInfo?.duration
    ? `${extraInfo.duration} mins`
    : null;

  const rawSource = anime.source || extraInfo?.source || null;
  const source = rawSource ? rawSource.replace(/_/g, ' ') : 'Original Work';

  const studio =
    anime.studios?.[0]?.name ||
    extraInfo?.studios?.nodes?.[0]?.name ||
    null;

  const rawStatus = extraInfo?.status || anime.status || '';
  const isReleasing =
    rawStatus === 'RELEASING' || rawStatus === 'Currently Airing';
  const broadcastDisplay = isReleasing
    ? 'RELEASING'
    : rawStatus === 'FINISHED' || rawStatus === 'Finished Airing'
    ? 'FINISHED'
    : rawStatus || 'FINISHED';

  const cards = [
    {
      icon: <Tv size={14} />,
      label: 'EPISODES',
      value: episodes ? `${episodes} Episodes` : 'Ongoing Broadcast',
      color: 'pink',
    },
    {
      icon: <Clock size={14} />,
      label: 'DURATION',
      value: duration ? `${duration} / ep` : 'Standard Length',
      color: 'cyan',
    },
    {
      icon: <BookOpen size={14} />,
      label: 'SOURCE',
      value: source,
      color: 'amber',
    },
    {
      icon: <Building2 size={14} />,
      label: 'LEAD STUDIO',
      value: studio || 'Animation Studio',
      color: 'purple',
    },
    {
      icon: <Volume2 size={14} />,
      label: 'ORIGINAL AUDIO',
      value: 'Japanese (JST Master)',
      color: 'emerald',
    },
    {
      icon: <Radio size={14} />,
      label: 'BROADCAST STATE',
      value: broadcastDisplay,
      color: 'emerald',
    },
  ];

  const colorMap: Record<string, { icon: string; hover: string; label: string }> = {
    pink:    { icon: 'text-[#ff4dd2]',  hover: 'hover:border-[#ff4dd2]/50',   label: 'text-[#ff4dd2]' },
    cyan:    { icon: 'text-cyan-400',   hover: 'hover:border-cyan-500/50',    label: 'text-cyan-400' },
    amber:   { icon: 'text-amber-400',  hover: 'hover:border-amber-500/50',   label: 'text-amber-400' },
    purple:  { icon: 'text-purple-400', hover: 'hover:border-purple-500/50',  label: 'text-purple-400' },
    emerald: { icon: 'text-emerald-400',hover: 'hover:border-emerald-500/50', label: 'text-emerald-400' },
  };

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-6 border-b border-white/5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, i) => {
          const c = colorMap[card.color] || colorMap.emerald;
          return (
            <div
              key={i}
              className={`rounded-2xl border border-white/10 bg-[#0a0b1a]/90 p-4 backdrop-blur-xl shadow-lg transition-all duration-300 ${c.hover} group`}
            >
              <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${c.label} mb-1.5`}>
                <span className={c.icon}>{card.icon}</span>
                <span>{card.label}</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white truncate leading-tight">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
