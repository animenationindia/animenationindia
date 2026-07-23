'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipForward, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MockVideoPlayer({ title }: { title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastMoveTime = 0;

    const handleMouseMove = () => {
      const now = Date.now();
      if (now - lastMoveTime < 50) return;
      lastMoveTime = now;

      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      animationFrameId = requestAnimationFrame(() => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (isPlaying) setShowControls(false);
        }, 3000);
      });
    };

    const handleMouseLeave = () => {
      if (isPlaying) setShowControls(false);
    };

    const currentRef = containerRef.current;
    if (currentRef) {
      currentRef.addEventListener('mousemove', handleMouseMove, { passive: true });
      currentRef.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('mousemove', handleMouseMove);
        currentRef.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isPlaying]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col group cursor-pointer"
      onClick={() => setIsPlaying(!isPlaying)}
    >
      {/* Fake Video Screen Content */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none z-10 transition-opacity duration-500 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
        <div className="w-16 h-16 md:w-24 md:h-24 bg-neon-cyan/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <AlertCircle size={40} className="text-neon-cyan" />
        </div>
        <h2 className="text-xl md:text-3xl font-bebas tracking-widest text-white mb-2 uppercase drop-shadow-lg">
          Streaming Unavailable
        </h2>
        <p className="text-gray-300 text-sm md:text-base font-medium max-w-lg drop-shadow-md">
          We currently do not hold the official licenses to stream <span className="text-neon-cyan font-bold">{title}</span>. We will bring streaming services to ANI once we secure the proper rights. In the meantime, please support the creators by watching on official platforms.
        </p>
      </div>

      {/* Background Gradient/Noise for cinematic feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800/20 via-black to-black opacity-80" />
      
      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-black/60 via-transparent to-black/80 z-20 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 md:p-6">
              <h3 className="text-white font-bold text-sm md:text-base line-clamp-1">{title} - Episode 1</h3>
            </div>

            {/* Big Play Button (Center) */}
            {!isPlaying && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="bg-neon-cyan text-white p-5 rounded-full hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255, 77, 210,0.5)] cursor-pointer"
                >
                  <Play size={32} fill="currentColor" className="ml-1" />
                </button>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="p-4 md:p-6 w-full mt-auto">
              {/* Progress Bar (Fake) */}
              <div className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative overflow-hidden group/progress">
                <div className="absolute top-0 left-0 h-full bg-neon-cyan w-[30%]" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[30%] w-3 h-3 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform" />
              </div>

              {/* Controls Grid */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 md:gap-6">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-neon-cyan transition-colors cursor-pointer">
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  <button className="text-white hover:text-neon-cyan transition-colors cursor-pointer hidden sm:block">
                    <SkipForward size={24} fill="currentColor" />
                  </button>
                  <div className="flex items-center gap-2 group/volume">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-neon-cyan transition-colors cursor-pointer">
                      {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                    </button>
                    <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1.5 bg-white/20 rounded-full cursor-pointer relative hidden sm:block">
                      <div className={`absolute top-0 left-0 h-full bg-neon-cyan ${isMuted ? 'w-0' : 'w-[80%]'}`} />
                    </div>
                  </div>
                  <span className="text-gray-300 text-xs font-medium ml-2">07:24 / 24:00</span>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                  <button className="text-white hover:text-neon-cyan transition-colors cursor-pointer">
                    <Settings size={22} />
                  </button>
                  <button onClick={toggleFullscreen} className="text-white hover:text-neon-cyan transition-colors cursor-pointer">
                    <Maximize size={22} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
