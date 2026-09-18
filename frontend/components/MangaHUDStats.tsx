'use client';

import { BookOpen, Layers, Sparkles, Building2, Globe, Radio } from 'lucide-react';

interface MangaHUDStatsProps {
  manga: any;
  extraInfo?: any;
}

export default function MangaHUDStats({ manga, extraInfo }: MangaHUDStatsProps) {
  const chapters = manga.chapters || extraInfo?.chapters || null;
  const volumes = manga.volumes || extraInfo?.volumes || null;

  // Format & Country
  const rawCountry = (extraInfo?.countryOfOrigin || manga.countryOfOrigin || (manga.type === 'MANHWA' ? 'KR' : 'JP')).toUpperCase();
  const rawFormat = (extraInfo?.format || manga.format || manga.type || '').toUpperCase();
  const isManhwa = rawCountry === 'KR' || rawFormat === 'MANHWA' || (manga.type && manga.type.toLowerCase().includes('manhwa'));
  const isManhua = rawCountry === 'CN' || rawFormat === 'MANHUA' || (manga.type && manga.type.toLowerCase().includes('manhua'));
  const isNovel = rawFormat === 'NOVEL' || rawFormat === 'LIGHT NOVEL' || (manga.type && manga.type.toLowerCase().includes('novel'));

  let typeName = 'Japanese Manga (Tankobon)';
  let countryCode = 'JP';
  let langText = 'Japanese (Original)';
  if (isManhwa) {
    typeName = 'Korean Manhwa (Webtoon)';
    countryCode = 'KR';
    langText = 'Korean (Hangul)';
  } else if (isManhua) {
    typeName = 'Chinese Manhua (Webcomic)';
    countryCode = 'CN';
    langText = 'Chinese (Mandarin)';
  } else if (isNovel) {
    typeName = 'Light Novel / Lore';
    countryCode = 'LN';
    langText = 'Japanese / Korean (Novel)';
  }

  // Publisher / Serialization
  const rawPublisher =
    manga.serializations?.[0]?.name ||
    manga.serializations?.[0] ||
    manga.serialization?.name ||
    manga.serialization ||
    extraInfo?.studios?.nodes?.[0]?.name;
  const publisher =
    typeof rawPublisher === 'string'
      ? rawPublisher
      : (rawPublisher?.name || (manga.authors?.[0]?.name ? `By ${manga.authors[0].name}` : 'Official Publisher'));

  // Status
  const rawStatus = manga.status || extraInfo?.status || 'Publishing';
  const isPublishing =
    rawStatus.toLowerCase().includes('publishing') ||
    rawStatus.toLowerCase().includes('releasing');

  const stats = [
    {
      label: 'TOTAL CHAPTERS',
      value: chapters ? `${chapters} Chs` : 'Ongoing / Unknown',
      icon: BookOpen,
      color: 'text-[#ff4dd2]',
      border: 'border-[#ff4dd2]/30',
      bg: 'bg-[#ff4dd2]/10',
    },
    {
      label: 'TOTAL VOLUMES',
      value: volumes ? `${volumes} Volumes` : 'Ongoing / N/A',
      icon: Layers,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'FORMAT & MEDIUM',
      value: typeName,
      icon: Sparkles,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'SERIALIZATION',
      value: publisher,
      icon: Building2,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'ORIGIN & LANGUAGE',
      value: `[${countryCode}] ${langText}`,
      icon: Globe,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'PUBLICATION STATE',
      value: isPublishing ? 'RELEASING' : 'COMPLETED',
      icon: Radio,
      color: isPublishing ? 'text-emerald-400' : 'text-blue-400',
      border: isPublishing ? 'border-emerald-500/30' : 'border-blue-500/30',
      bg: isPublishing ? 'bg-emerald-500/10' : 'bg-blue-500/10',
    },
  ];

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl border ${stat.border} ${stat.bg} p-4 backdrop-blur-md flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  {stat.label}
                </span>
                <Icon size={16} className={stat.color} />
              </div>
              <p className="text-sm font-black text-white truncate" title={stat.value}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
