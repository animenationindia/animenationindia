'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Film,
  List,
  LayoutGrid,
  Calendar,
  Star,
  CheckCircle,
  Clock,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TMDBEpisode } from '../lib/tmdb-api';
import AnimeWatchOrder from './AnimeWatchOrder';
import { buildFranchiseWatchOrder } from '../lib/franchise-order';

interface AnimeEpisodeGuideProps {
  anime: any;
  extraInfo?: any;
  episodes?: any[];
  tmdbEpisodes?: TMDBEpisode[];
  relations?: any[];
  posterFallback?: string;
}

type ViewMode = 'list' | 'grid';
type ActiveTab = 'episodes' | 'watchorder';

export default function AnimeEpisodeGuide({
  anime,
  extraInfo,
  episodes = [],
  tmdbEpisodes = [],
  relations = [],
  posterFallback = '/placeholder-poster.png',
}: AnimeEpisodeGuideProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('episodes');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [watchedEps, setWatchedEps] = useState<Record<number, boolean>>({});

  const animeId = anime.mal_id || anime.id || extraInfo?.idMal || extraInfo?.id || 0;
  const englishTitle =
    anime.title_english || extraInfo?.title?.english || anime.title || 'Anime';
  const totalEpisodeCount =
    anime.episodes || extraInfo?.episodes || episodes.length || 12;

  // ─── Build episode list ───
  const episodeList = useMemo(() => {
    if (episodes.length > 0) return episodes;
    // Fallback: generate placeholder episodes from TMDB count or AniList count
    return Array.from({ length: totalEpisodeCount }, (_, i) => ({
      mal_id: i + 1,
      title: `Episode ${i + 1}`,
      score: null,
      aired: null,
    }));
  }, [episodes, totalEpisodeCount]);

  // ─── Franchise titles (relations for badge count) ───
  const franchiseCount = relations.filter((r: any) => {
    const fmt = r.node?.format || r.node?.type || '';
    return ['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL'].includes(fmt?.toUpperCase());
  }).length + 1; // +1 for current title

  // ─── Watch order steps ───
  const watchOrderSteps = useMemo(() => {
    return buildFranchiseWatchOrder(anime, relations);
  }, [anime, relations]);

  // ─── Watched episodes: load from localStorage ───
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(`ani_watched_eps_${animeId}`) || '{}'
      );
      setWatchedEps(saved);
    } catch {}
  }, [animeId]);

  const toggleWatchedEp = (epNum: number) => {
    setWatchedEps((prev) => {
      const next = { ...prev, [epNum]: !prev[epNum] };
      try {
        localStorage.setItem(`ani_watched_eps_${animeId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const watchedCount = Object.values(watchedEps).filter(Boolean).length;

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-10 border-t border-white/5">

      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/25 flex-shrink-0">
            <Film size={20} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Franchise Guide & Episodes</span>
              {franchiseCount > 1 && (
                <span className="text-[10px] bg-[#ff4dd2]/20 text-[#ff4dd2] px-2.5 py-0.5 rounded-full font-bold border border-[#ff4dd2]/30">
                  {franchiseCount} Franchise Titles
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {watchedCount > 0
                ? `${watchedCount} / ${episodeList.length} episodes watched`
                : 'Track your watch progress per episode'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#ff4dd2]/20 border-[#ff4dd2]/50 text-[#ff4dd2]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
            title="List View"
          >
            <List size={15} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#ff4dd2]/20 border-[#ff4dd2]/50 text-[#ff4dd2]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={15} />
          </button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('episodes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'episodes'
              ? 'bg-[#ff4dd2] text-black shadow-[#ff4dd2]/20 shadow-md scale-105'
              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
          }`}
        >
          <Film size={13} />
          <span>Episode Guide ({episodeList.length})</span>
        </button>

        {watchOrderSteps.length > 1 && (
          <button
            onClick={() => setActiveTab('watchorder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'watchorder'
                ? 'bg-[#ff4dd2] text-black shadow-[#ff4dd2]/20 shadow-md scale-105'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <Layers size={13} />
            <span>Release & Watch Order ({watchOrderSteps.length})</span>
          </button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB CONTENT                                                 */}
      {/* ════════════════════════════════════════════════════════════ */}

      {activeTab === 'episodes' ? (
        <>
          {/* ── LIST VIEW ── */}
          {viewMode === 'list' ? (
            <div className="flex flex-col gap-3">
              {episodeList.map((ep: any, index: number) => {
                const epNum = ep.mal_id || index + 1;
                const tmdbEp = tmdbEpisodes.find((t) => t.episodeNumber === epNum);
                const epTitle = tmdbEp?.name || ep.title || `Episode ${epNum}`;
                const epOverview = tmdbEp?.overview || ep.synopsis || null;
                const epAirDate = tmdbEp?.airDate || (ep.aired ? new Date(ep.aired).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null);
                const stillImage = tmdbEp?.stillUrl || ep.images?.jpg?.image_url || null;
                const runtime = tmdbEp?.runtime ? `${tmdbEp.runtime}m` : (ep.duration ? `${ep.duration}m` : null);
                const epScore = ep.score ? String(ep.score) : null;
                const watched = watchedEps[epNum] || false;

                return (
                  <div
                    key={epNum}
                    className={`flex gap-3 rounded-2xl border p-3 transition-all duration-300 group ${
                      watched
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-white/8 bg-[#0a0b1a]/80 hover:border-[#ff4dd2]/30 hover:bg-[#0e0f22]'
                    }`}
                  >
                    {/* Thumbnail */}
                    <Link
                      href={`/watch/${animeId}?ep=${epNum}`}
                      className="relative aspect-video w-36 sm:w-44 flex-shrink-0 rounded-xl overflow-hidden bg-[#121326]"
                    >
                      <img
                        src={stillImage || posterFallback}
                        alt={epTitle}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {/* EP badge */}
                      <span className="absolute top-1.5 left-1.5 bg-black/80 text-[#ff4dd2] text-[9px] font-black px-2 py-0.5 rounded-lg border border-[#ff4dd2]/30">
                        EP {epNum}
                      </span>
                      {/* Runtime */}
                      {runtime && (
                        <span className="absolute top-1.5 right-1.5 bg-black/70 text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
                          {runtime}
                        </span>
                      )}
                      {/* Watched overlay */}
                      {watched && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle size={20} className="text-emerald-400" />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <Link
                          href={`/watch/${animeId}?ep=${epNum}`}
                          className="text-sm font-bold text-white hover:text-[#ff4dd2] transition-colors line-clamp-1"
                        >
                          {epTitle}
                        </Link>
                        {epOverview && (
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mt-1">
                            {epOverview}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500 flex-wrap">
                        {epAirDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {epAirDate}
                          </span>
                        )}
                        {epScore && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Star size={11} className="fill-amber-400" />
                            {epScore}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mark Watched Button */}
                    <div className="flex-shrink-0 flex items-center">
                      <button
                        onClick={() => toggleWatchedEp(epNum)}
                        title={watched ? 'Mark as Unwatched' : 'Mark as Watched'}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          watched
                            ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-400'
                            : 'border-white/15 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <CheckCircle size={12} />
                        <span className="hidden sm:inline">{watched ? 'Watched' : 'Mark'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── GRID VIEW ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {episodeList.map((ep: any, index: number) => {
                const epNum = ep.mal_id || index + 1;
                const tmdbEp = tmdbEpisodes.find((t) => t.episodeNumber === epNum);
                const epTitle = tmdbEp?.name || ep.title || `Episode ${epNum}`;
                const stillImage = tmdbEp?.stillUrl || ep.images?.jpg?.image_url || null;
                const runtime = tmdbEp?.runtime ? `${tmdbEp.runtime}m` : null;
                const watched = watchedEps[epNum] || false;

                return (
                  <div key={epNum} className="relative group">
                    <Link
                      href={`/watch/${animeId}?ep=${epNum}`}
                      className={`flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 ${
                        watched
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-white/10 bg-[#0a0b1a] hover:border-[#ff4dd2]/50'
                      }`}
                    >
                      {/* 16:9 Thumbnail */}
                      <div className="relative aspect-video w-full overflow-hidden bg-[#121326]">
                        <img
                          src={stillImage || posterFallback}
                          alt={epTitle}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <span className="absolute top-2 left-2 bg-black/70 text-[#ff4dd2] text-[9px] font-black px-2 py-0.5 rounded-lg border border-[#ff4dd2]/30">
                          EP {epNum}
                        </span>
                        {runtime && (
                          <span className="absolute top-2 right-2 bg-black/70 text-gray-300 text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
                            {runtime}
                          </span>
                        )}
                        {watched && (
                          <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center">
                            <CheckCircle size={22} className="text-emerald-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff4dd2] transition-colors">
                          {epTitle}
                        </p>
                      </div>
                    </Link>

                    {/* Mark button overlaid */}
                    <button
                      onClick={() => toggleWatchedEp(epNum)}
                      className={`absolute top-2 right-2 p-1 rounded-lg transition-all cursor-pointer z-10 opacity-0 group-hover:opacity-100 ${
                        watched
                          ? 'bg-emerald-500 text-black opacity-100'
                          : 'bg-black/70 text-white'
                      }`}
                      title={watched ? 'Unmark' : 'Mark Watched'}
                    >
                      <CheckCircle size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ── WATCH ORDER TAB ── */
        <AnimeWatchOrder steps={watchOrderSteps} />
      )}
    </section>
  );
}
