'use client';

import React, { useState } from 'react';
import { useMusicPlayer } from '@/context/MusicPlayerContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  X,
  ChevronDown,
  ChevronUp,
  Disc,
  Music2,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function FloatingCyberPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isLoop,
    isPlayerVisible,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleLoop,
    closePlayer,
  } = useMusicPlayer();

  const [isMinimized, setIsMinimized] = useState(false);

  if (!isPlayerVisible || !currentTrack) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-[68px] md:bottom-4 left-0 right-0 z-[120] px-3 sm:px-6 pointer-events-none"
      >
        <div className="max-w-[1000px] mx-auto pointer-events-auto">
          {/* Cyberpunk Glassmorphic Card */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-[#ff4dd2]/40 bg-[#080918]/95 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(255,77,210,0.15)] overflow-hidden transition-all duration-300">
            {/* Ambient Top Glow Line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff4dd2] to-transparent opacity-80" />

            {/* Seek Bar on Top Edge */}
            <div
              className="relative w-full h-1.5 bg-white/10 cursor-pointer group hover:h-2.5 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                seek(ratio * duration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-[#ff4dd2] to-[#a855f7] relative shadow-[0_0_12px_rgba(255,77,210,0.8)]"
                style={{ width: `${progressPercent}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Minimized Bar */}
            {isMinimized ? (
              <div className="flex items-center justify-between px-4 py-2 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 border border-white/15">
                    {currentTrack.artworkUrl ? (
                      <img
                        src={currentTrack.artworkUrl}
                        alt={currentTrack.title}
                        className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ff4dd2]">
                        <Music2 size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{currentTrack.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">{currentTrack.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-full bg-[#ff4dd2] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={closePlayer}
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/10 transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* Expanded Full Player Bar */
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                {/* 1. Track Info (Left) */}
                <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
                  <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden bg-white/10 flex-shrink-0 border border-[#ff4dd2]/30 shadow-[0_0_15px_rgba(255,77,210,0.25)]">
                    {currentTrack.artworkUrl ? (
                      <img
                        src={currentTrack.artworkUrl}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff4dd2]/20 to-purple-900/40 text-[#ff4dd2]">
                        <Disc size={22} className={isPlaying ? 'animate-spin-slow' : ''} />
                      </div>
                    )}
                    {isPlaying && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-[#ff4dd2] animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-black text-white truncate group hover:text-[#ff4dd2] transition-colors">
                      {currentTrack.title}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 truncate flex items-center gap-1.5">
                      <span>{currentTrack.artist}</span>
                      {currentTrack.animeTitle && (
                        <>
                          <span className="text-gray-600">&bull;</span>
                          <span className="text-[#ff4dd2]/90 truncate">{currentTrack.animeTitle}</span>
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </p>
                  </div>
                </div>

                {/* 2. Playback Controls (Center) */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    onClick={toggleLoop}
                    className={`p-2 rounded-xl text-xs transition cursor-pointer ${
                      isLoop
                        ? 'text-[#ff4dd2] bg-[#ff4dd2]/15 border border-[#ff4dd2]/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={isLoop ? 'Loop Enabled' : 'Loop Disabled'}
                  >
                    <Repeat size={15} />
                  </button>

                  <button
                    onClick={prevTrack}
                    className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer active:scale-95"
                    title="Previous Track"
                  >
                    <SkipBack size={18} />
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#ff4dd2] to-[#c026d3] text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,77,210,0.5)] hover:scale-105 active:scale-95 transition cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>

                  <button
                    onClick={nextTrack}
                    className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer active:scale-95"
                    title="Next Track"
                  >
                    <SkipForward size={18} />
                  </button>
                </div>

                {/* 3. Volume & Window Controls (Right) */}
                <div className="flex items-center justify-end gap-2 w-full sm:w-1/3">
                  {/* Volume Slider */}
                  <div className="hidden sm:flex items-center gap-2 group">
                    <button
                      onClick={toggleMute}
                      className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#ff4dd2]"
                    />
                  </div>

                  {/* External Link if available */}
                  {currentTrack.externalUrl && (
                    <a
                      href={currentTrack.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                      title="Open in Apple Music / Source"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}

                  {/* Minimize button */}
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                    title="Minimize Player"
                  >
                    <ChevronDown size={16} />
                  </button>

                  {/* Close button */}
                  <button
                    onClick={closePlayer}
                    className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Close Player"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
