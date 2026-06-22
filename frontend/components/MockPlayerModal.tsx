'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Tv, X, Subtitles, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MockPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeTitle: string;
}

// 🌟 3D Frequency Particle Visualizer to wow the user
function DynamicVisualizer() {
  const ref = useRef<THREE.Points>(null!);
  const count = 120;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.2 + Math.sin(i * 4) * 0.3;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = Math.sin(angle) * radius;
      arr[i * 3 + 2] = (pseudoRandom(i * 12.98) - 0.5) * 0.4;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.rotation.z = time * 0.12;

    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.2 + Math.sin(i * 6 + time * 2.2) * 0.35;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = Math.sin(time * 3 + i * 0.8) * 0.25;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        color="#ff6400" // Glowing Crunchyroll Orange
        size={0.09} 
        sizeAttenuation 
        transparent 
        opacity={0.85} 
      />
    </points>
  );
}

export default function MockPlayerModal({ isOpen, onClose, animeTitle }: MockPlayerModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0); // percentages
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const durationSec = 1440; // 24 mins
  const playerRef = useRef<HTMLDivElement>(null);

  // Auto progression of timeline if playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTimeSec < durationSec) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          const next = prev + 1;
          setProgress((next / durationSec) * 100);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTimeSec]);

  // Click handler on mock timeline bar
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickedPercent = Math.min(Math.max(clickX / width, 0), 1);
    
    setBuffering(true);
    setTimeout(() => {
      setCurrentTimeSec(Math.floor(clickedPercent * durationSec));
      setProgress(clickedPercent * 100);
      setBuffering(false);
    }, 450);
  };

  // Duration formatting (00:00)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      playerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 w-full h-full z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      >
        <div 
          ref={playerRef}
          className={`relative bg-[#070708] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
            isTheaterMode ? 'w-full h-full md:max-w-none md:h-[90vh]' : 'w-full max-w-[950px] aspect-video'
          }`}
        >
          {/* Header Bar */}
          <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between text-white">
            <div>
              <span className="text-[10px] text-[#ff6400] font-black uppercase tracking-widest">Now Streaming</span>
              <h2 className="text-sm md:text-base font-bold line-clamp-1 uppercase tracking-tight">{animeTitle} - Episode 1</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-black/40 hover:bg-red-500 rounded-full cursor-pointer transition-colors"
              title="Close Stream"
            >
              <X size={20} />
            </button>
          </div>

          {/* Screen / Viewport Area */}
          <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden">
            {/* Ambient glowing orb background */}
            <div className="absolute w-[200px] h-[200px] bg-[#ff6400] rounded-full blur-[100px] opacity-15 pointer-events-none -z-10" />
            
            {/* 3D Dynamic Visualizer Canvas */}
            <div className="absolute inset-0 w-full h-full -z-10 opacity-70">
              <Canvas gl={{ antialias: true, alpha: true }}>
                <ambientLight intensity={0.5} />
                <DynamicVisualizer />
              </Canvas>
            </div>

            {/* Cinematic Glitch Screen Content */}
            <div className="text-center p-6 select-none z-10 max-w-[500px]">
              {buffering ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={44} className="text-[#ff6400] animate-spin" />
                  <p className="text-white text-xs font-bold tracking-widest uppercase">Buffering Stream...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-bebas text-white tracking-widest leading-none select-none uppercase animate-glitch">
                    Stream Currently Unavailable
                  </h3>
                  <div className="h-px bg-gradient-to-r from-transparent via-[#ff6400] to-transparent w-full" />
                  <p className="text-xs md:text-sm text-gray-400 font-semibold tracking-wide uppercase">
                    ANI Otaku Media - Official episode server integrations are undergoing maintenance. Full streams will be available soon!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Player Navigation / Control Dashboard */}
          <div className="bg-gradient-to-t from-black/95 via-black/85 to-black/20 p-4 pt-10 z-40 relative flex flex-col gap-3">
            
            {/* Timeline Progress Bar */}
            <div 
              onClick={handleTimelineClick}
              className="w-full h-1.5 bg-white/10 hover:h-2.5 rounded-full overflow-hidden cursor-pointer relative group transition-all"
            >
              <div 
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-[#ff6400] to-[#f9c83c] relative rounded-full"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white scale-0 group-hover:scale-100 transition-transform shadow-lg" />
              </div>
            </div>

            {/* Dashboard Control Buttons */}
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center gap-4">
                {/* Play / Pause Toggle */}
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 hover:text-[#ff6400] transition-colors cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>

                {/* Volume Controls */}
                <div className="flex items-center gap-2 group/vol">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="hover:text-[#ff6400] transition-colors cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(Number(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-0 opacity-0 group-hover/vol:w-16 group-hover/vol:opacity-100 accent-[#ff6400] transition-all h-1 cursor-pointer bg-white/20 rounded-lg appearance-none"
                  />
                </div>

                {/* Time Indicator */}
                <span className="text-xs font-semibold text-gray-300">
                  {formatTime(currentTimeSec)} <span className="opacity-40">/</span> {formatTime(durationSec)}
                </span>
              </div>

              {/* Utility Toggles */}
              <div className="flex items-center gap-4">
                <button className="hover:text-[#ff6400] transition-colors cursor-pointer" title="Subtitles">
                  <Subtitles size={18} />
                </button>
                <button className="hover:text-[#ff6400] transition-colors cursor-pointer" title="Settings">
                  <Settings size={18} />
                </button>
                
                {/* Theater Mode Toggle */}
                <button 
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className={`hover:text-[#ff6400] transition-colors cursor-pointer ${isTheaterMode ? 'text-[#ff6400]' : ''}`} 
                  title="Theater Mode"
                >
                  <Tv size={18} />
                </button>

                {/* Fullscreen Toggle */}
                <button 
                  onClick={toggleFullscreen}
                  className="hover:text-[#ff6400] transition-colors cursor-pointer" 
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
