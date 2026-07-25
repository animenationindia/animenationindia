'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] bg-[#050716] flex flex-col items-center justify-center overflow-hidden px-4">
      {/* ── 1. Ambient Background Glow (Pulse Effect) ── */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[600px] h-[450px] sm:h-[600px] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none animate-pulse" 
        style={{ animationDuration: '4s' }} 
      />

      {/* ── 2. Subtle Brand Logo & HUD Header ── */}
      <div className="relative z-20 mb-6 flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img 
          src="/ani-logo.png" 
          alt="Anime Nation India" 
          className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(255,77,210,0.6)]" 
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-[10px] font-mono tracking-[0.3em] text-[#ff4dd2]/80 uppercase drop-shadow-[0_0_8px_rgba(255,77,210,0.4)]">
          SYSTEM INITIALIZING...
        </span>
      </div>

      {/* ── 3. Futuristic Sci-fi Skeleton Layout Container ── */}
      <div className="relative z-10 glass-card p-5 sm:p-7 md:p-8 rounded-2xl max-w-3xl w-full relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-[#ff4dd2]/20">
        
        {/* Scanning Line Effect (HUD Radar Sweep) */}
        <div className="hud-scan-line" />

        <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-center sm:items-start">
          
          {/* ── 4. Left Rectangular Poster Placeholder + Corner HUD Brackets ── */}
          <div className="relative w-36 h-52 sm:w-48 sm:h-64 md:w-56 md:h-80 shrink-0 bg-white/5 border border-[#ff4dd2]/20 rounded-xl overflow-hidden skeleton-shimmer shadow-[0_0_20px_rgba(255,77,210,0.1)]">
            
            {/* Viewfinder Corner HUD Brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#ff4dd2] z-20 opacity-80" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#ff4dd2] z-20 opacity-80" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#ff4dd2] z-20 opacity-80" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#ff4dd2] z-20 opacity-80" />
            
            {/* Internal Shimmer Backdrop */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          {/* ── 5. Right Details Block (Title, Pills, Text Lines, Buttons) ── */}
          <div className="flex-1 w-full flex flex-col justify-between py-1">
            
            {/* Title Bar Placeholder */}
            <div>
              <div className="w-3/4 h-8 bg-white/5 border border-[#ff4dd2]/15 rounded-lg skeleton-shimmer mb-5 shadow-[0_0_10px_rgba(255,77,210,0.05)]" />

              {/* Badge Pill Rows (Row 1) */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="w-16 h-6 bg-white/5 border border-[#ff4dd2]/15 rounded-full skeleton-shimmer" />
                <div className="w-20 h-6 bg-white/5 border border-[#ff4dd2]/15 rounded-full skeleton-shimmer" />
                <div className="w-14 h-6 bg-white/5 border border-[#ff4dd2]/15 rounded-full skeleton-shimmer" />
              </div>

              {/* Badge Pill Rows (Row 2) */}
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="w-24 h-6 bg-white/5 border border-[#ff4dd2]/15 rounded-full skeleton-shimmer" />
                <div className="w-18 h-6 bg-white/5 border border-[#ff4dd2]/15 rounded-full skeleton-shimmer" />
              </div>

              {/* Text Line Placeholders (Decreasing Width) */}
              <div className="space-y-2.5 mb-8">
                <div className="w-full h-3.5 bg-white/5 border border-[#ff4dd2]/10 rounded skeleton-shimmer" />
                <div className="w-5/6 h-3.5 bg-white/5 border border-[#ff4dd2]/10 rounded skeleton-shimmer" />
                <div className="w-2/3 h-3.5 bg-white/5 border border-[#ff4dd2]/10 rounded skeleton-shimmer" />
              </div>
            </div>

            {/* Bottom Button Placeholders */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-28 h-10 bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 rounded-xl skeleton-shimmer shadow-[0_0_15px_rgba(255,77,210,0.15)]" />
              <div className="w-32 h-10 bg-white/5 border border-white/10 rounded-xl skeleton-shimmer" />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
