'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Radio, Sparkles } from 'lucide-react';

interface NextEpisodeCountdownProps {
  nextAiring: {
    episode: number;
    airingAt: number; // Unix timestamp in seconds
    timeUntilAiring?: number;
  };
  variant?: 'card' | 'banner' | 'compact';
}

export default function NextEpisodeCountdown({ nextAiring, variant = 'card' }: NextEpisodeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = nextAiring.airingAt * 1000;
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [nextAiring.airingAt]);

  const releaseDate = new Date(nextAiring.airingAt * 1000).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (timeLeft.isPast) {
    return (
      <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Episode {nextAiring.episode} is now streaming!</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="inline-flex items-center gap-2 bg-[#ff2a5f]/15 border border-[#ff2a5f]/40 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm backdrop-blur-md">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2a5f] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff2a5f]"></span>
        </span>
        <span className="text-white">
          Ep {nextAiring.episode}:{' '}
          <span className="text-[#ff4dd2] font-extrabold font-mono">
            {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
            {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </span>
        <span className="text-gray-400 text-[11px] hidden sm:inline">({releaseDate})</span>
      </div>
    );
  }

  // Default 'card' variant for sidebar widget
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#ff2a5f]/20 via-[#0e0f1d] to-[#090a14] border border-[#ff2a5f]/30 rounded-3xl p-5 shadow-[0_10px_35px_rgba(255,42,95,0.15)] text-white">
      {/* Background Neon Elements */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#ff2a5f]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ff4dd2]">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff2a5f] opacity-80" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff2a5f]" />
          </span>
          <span>Next Episode Airing</span>
        </div>
        <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
          Simulcast
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-3.5">
        <h4 className="text-2xl font-black text-white tracking-tight">
          Episode {nextAiring.episode}
        </h4>
        <span className="text-xs text-slate-300 font-semibold flex items-center gap-1">
          <Calendar size={13} className="text-indigo-400" /> {releaseDate}
        </span>
      </div>

      {/* Live Ticking Countdown Box Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5 shadow-inner">
          <span className="block text-xl sm:text-2xl font-black text-white font-mono leading-none">
            {String(timeLeft.days).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 block">
            Days
          </span>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5 shadow-inner">
          <span className="block text-xl sm:text-2xl font-black text-white font-mono leading-none">
            {String(timeLeft.hours).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 block">
            Hours
          </span>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5 shadow-inner">
          <span className="block text-xl sm:text-2xl font-black text-white font-mono leading-none">
            {String(timeLeft.minutes).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 block">
            Mins
          </span>
        </div>

        <div className="bg-black/50 border border-[#ff2a5f]/40 rounded-2xl p-2.5 shadow-inner">
          <span className="block text-xl sm:text-2xl font-black text-[#ff4dd2] font-mono leading-none animate-pulse">
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#ff4dd2] mt-1 block">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}
