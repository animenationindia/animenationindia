'use client';

import { useState, useEffect } from 'react';
import { BookOpen, ExternalLink, Calendar, Loader2, Search, ArrowUpRight } from 'lucide-react';
import { MangaChapter, getMangaDexChapters } from '../lib/mangadex-api';

interface MangaChapterGuideProps {
  title: string;
  totalChapters?: number | null;
  mangaId: number | string;
}

export default function MangaChapterGuide({
  title,
  totalChapters,
  mangaId,
}: MangaChapterGuideProps) {
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getMangaDexChapters(title, 100)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setChapters(data);
        } else if (totalChapters && totalChapters > 0) {
          // Fallback: Generate chapter guide if MangaDex has no translation yet
          const generated: MangaChapter[] = Array.from(
            { length: Math.min(totalChapters, 60) },
            (_, i) => {
              const num = totalChapters - i;
              return {
                id: `gen-${num}`,
                chapter: String(num),
                title: `Chapter ${num}`,
                publishAt: null,
                readableUrl: `https://mangadex.org/title?q=${encodeURIComponent(title)}`,
              };
            }
          );
          setChapters(generated);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [title, totalChapters]);

  const filteredChapters = chapters.filter((ch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return ch.chapter.toLowerCase().includes(q) || ch.title.toLowerCase().includes(q);
  });

  return (
    <section id="chapters-section" className="container mx-auto max-w-[1500px] px-4 py-8 border-t border-white/5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/25 flex-shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Chapters & Reading Guide</span>
              {chapters.length > 0 && (
                <span className="text-[10px] bg-[#ff4dd2]/20 text-[#ff4dd2] px-2.5 py-0.5 rounded-full font-bold border border-[#ff4dd2]/30">
                  {chapters.length} Available
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Read online directly via MangaDex & official reader feeds
            </p>
          </div>
        </div>

        {/* Search Input */}
        {chapters.length > 10 && (
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search Chapter #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0b1a] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#ff4dd2]" />
          <p className="text-xs">Fetching verified chapters from MangaDex...</p>
        </div>
      ) : filteredChapters.length === 0 ? (
        <div className="bg-[#0a0b1a] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-sm font-bold text-gray-400 mb-2">No chapters found for this title.</p>
          <p className="text-xs text-gray-500 mb-4">Official licensing may restrict public chapter feeds.</p>
          <a
            href={`https://mangadex.org/title?q=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Search on MangaDex <ArrowUpRight size={14} />
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredChapters.map((ch) => (
            <a
              key={ch.id}
              href={ch.readableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-3.5 rounded-2xl border border-white/8 bg-[#0a0b1a]/80 hover:border-[#ff4dd2]/50 hover:bg-[#0e0f22] transition-all"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#ff4dd2] bg-[#ff4dd2]/10 px-2 py-0.5 rounded-md border border-[#ff4dd2]/20">
                    Ch. {ch.chapter}
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-[#ff4dd2] transition-colors truncate">
                    {ch.title}
                  </span>
                </div>
                {ch.publishAt && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={10} />
                    {ch.publishAt}
                  </span>
                )}
              </div>
              <ArrowUpRight size={15} className="text-gray-500 group-hover:text-white transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
