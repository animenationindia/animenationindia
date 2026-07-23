'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Star, Film } from 'lucide-react';

interface AnimeNode {
  id: number;
  title: {
    romaji: string;
    english?: string | null;
  };
  coverImage: {
    large: string;
  };
  averageScore?: number | null;
}

interface LandingPageProps {
  initialAnime: AnimeNode[];
}

// ─── Optional Dev Mode FPS Counter Component ─────────────────────────────────
/* 
  [DEV NOTICE]: To remove or hide this FPS overlay in development,
  simply comment out <DevFpsOverlay /> in the main return statement.
*/
function DevFpsOverlay() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const calcFps = () => {
      const now = performance.now();
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(calcFps);
    };

    animId = requestAnimationFrame(calcFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed top-4 left-4 z-[9999] bg-black/80 border border-emerald-500/40 text-emerald-400 text-xs font-mono px-3 py-1.5 rounded-md backdrop-blur-md pointer-events-none shadow-lg flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>DEV FPS: <strong className="text-white font-bold">{fps}</strong></span>
    </div>
  );
}

// ─── Score Theme Utility ──────────────────────────────────────────────────
function getScoreTheme(score?: number | null) {
  if (!score) {
    return {
      border: 'border-white/20',
      badgeBg: 'bg-black/70',
      badgeText: 'text-gray-200',
      starColor: 'text-gray-300 fill-gray-300',
      shadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    };
  }
  const normalized = score > 10 ? score / 10 : score;
  if (normalized >= 9.0) {
    return {
      border: 'border-amber-400/50',
      badgeBg: 'bg-amber-950/80 backdrop-blur-md',
      badgeText: 'text-amber-300 font-extrabold',
      starColor: 'text-amber-400 fill-amber-400',
      shadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]',
    };
  }
  if (normalized >= 8.0) {
    return {
      border: 'border-[#ff007f]/50',
      badgeBg: 'bg-[#ff007f]/20 backdrop-blur-md',
      badgeText: 'text-pink-300 font-extrabold',
      starColor: 'text-pink-400 fill-pink-400',
      shadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(255,0,127,0.5)]',
    };
  }
  return {
    border: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-950/70 backdrop-blur-md',
    badgeText: 'text-cyan-200 font-bold',
    starColor: 'text-cyan-400 fill-cyan-400',
    shadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]',
  };
}

// ─── Safe Image Component with Fallback ────────────────────────────────────
function SafeCardImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1a0c28] via-[#0d0515] to-[#250d38] flex flex-col items-center justify-center p-3 text-center">
        <Film className="w-8 h-8 text-[#ff007f]/60 mb-2 animate-pulse" />
        <span className="text-[10px] text-gray-400 font-medium line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover transition-transform duration-700 group-hover:scale-110"
      onError={() => setError(true)}
    />
  );
}

// ─── Counter Component for Animated Numbers ────────────────────────────────
const Counter = ({ from = 0, to, duration = 2, suffix = '' }: { from?: number; to: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (!isInView) {
      setCount(from);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * (to - from) + from));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [from, to, duration, isInView]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// ─── Main Landing Page Component ───────────────────────────────────────────
export default function LandingPageClient({ initialAnime }: LandingPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });

  // Low-end Hardware Check
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency < 4) {
        setIsLowEndDevice(true);
      }
    }
  }, []);

  const disableComplexEffects = shouldReduceMotion || isLowEndDevice;

  // Optimized Mouse Motion Values & Tuned Springs
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);
  const rawCursorX = useMotionValue(0);
  const rawCursorY = useMotionValue(0);

  // Tuned Spring config: stiffness 80, damping 18, mass 0.5 for cheap & ultra-smooth interpolation
  const springConfig = { stiffness: 80, damping: 18, mass: 0.5 };
  const smoothMouseX = useSpring(rawMouseX, springConfig);
  const smoothMouseY = useSpring(rawMouseY, springConfig);
  const smoothCursorX = useSpring(rawCursorX, springConfig);
  const smoothCursorY = useSpring(rawCursorY, springConfig);

  // Throttled mouse tracking with requestAnimationFrame & Passive Listener
  const latestMouseRef = useRef({ x: 0, y: 0, normX: 0, normY: 0, dirty: false });

  useEffect(() => {
    if (disableComplexEffects) return;
    const element = mainRef.current;
    if (!element) return;

    let rAFId: number;

    const onMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const normX = (x / rect.width) - 0.5;
      const normY = (y / rect.height) - 0.5;

      latestMouseRef.current = { x, y, normX, normY, dirty: true };
    };

    const updateLoop = () => {
      if (latestMouseRef.current.dirty) {
        const { x, y, normX, normY } = latestMouseRef.current;
        rawCursorX.set(x);
        rawCursorY.set(y);
        rawMouseX.set(normX);
        rawMouseY.set(normY);
        latestMouseRef.current.dirty = false;
      }
      rAFId = requestAnimationFrame(updateLoop);
    };

    element.addEventListener('mousemove', onMouseMove, { passive: true });
    rAFId = requestAnimationFrame(updateLoop);

    return () => {
      element.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rAFId);
    };
  }, [disableComplexEffects, rawCursorX, rawCursorY, rawMouseX, rawMouseY]);

  // Card Positions & Parallax Depth Factors
  const cardStyles = [
    { top: '10%', left: '4%', rotate: -8, scale: 0.9, depth: 22, showMobile: true },
    { top: '45%', left: '2%', rotate: 6, scale: 0.85, depth: -16, showMobile: false },
    { bottom: '10%', left: '6%', rotate: -12, scale: 0.95, depth: 26, showMobile: true },
    { top: '15%', right: '4%', rotate: 10, scale: 0.9, depth: -22, showMobile: true },
    { top: '50%', right: '2%', rotate: -5, scale: 0.85, depth: 16, showMobile: false },
    { bottom: '15%', right: '6%', rotate: 12, scale: 0.95, depth: -26, showMobile: false },
    { top: '-2%', left: '28%', rotate: 4, scale: 0.8, depth: 14, showMobile: false },
    { bottom: '-2%', right: '28%', rotate: -6, scale: 0.8, depth: -14, showMobile: false },
  ];

  // Animated Title Words
  const titleWords = [
    "Watch", "Anime,", "Live", "Schedule,",
    "Reviews", "&", "Watchlist,",
    "Discover", "&", "Get", "Full", "Details", "of", "Anime"
  ];

  if (process.env.NODE_ENV === 'development') {
    console.log("LandingPageClient received initialAnime:", initialAnime);
  }

  const isLoading = !initialAnime || initialAnime.length === 0;

  return (
    <main
      ref={mainRef}
      className="relative w-full min-h-screen bg-[#0a0510] flex items-center justify-center overflow-hidden selection:bg-[#ff007f] selection:text-white"
    >
      {/* Dev Mode FPS Counter Overlay */}
      {process.env.NODE_ENV === 'development' && <DevFpsOverlay />}

      {/* ── GPU-Accelerated Cursor Glow (Translate3d - No Gradient String Re-parse) ── */}
      {!disableComplexEffects && (
        <motion.div
          className="pointer-events-none absolute w-[450px] h-[450px] rounded-full z-0 opacity-35"
          style={{
            x: smoothCursorX,
            y: smoothCursorY,
            left: -225,
            top: -225,
            background: 'radial-gradient(circle, rgba(255, 0, 127, 0.25) 0%, rgba(255, 0, 127, 0.05) 50%, transparent 70%)',
            mixBlendMode: 'screen',
            willChange: 'transform',
          }}
        />
      )}

      {/* ── Reduced Blur Radius Pink Ambient Glows (blur-80px for Low GPU Load) ── */}
      <motion.div
        animate={disableComplexEffects ? { opacity: 0.08, scale: 1 } : { opacity: [0.08, 0.14, 0.08], scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff007f] blur-[80px] rounded-full pointer-events-none z-0"
        style={{ willChange: 'transform, opacity' }}
      />
      <motion.div
        animate={disableComplexEffects ? { opacity: 0.06, scale: 1 } : { opacity: [0.06, 0.11, 0.06], scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff007f] blur-[80px] rounded-full pointer-events-none z-0"
        style={{ willChange: 'transform, opacity' }}
      />
      <motion.div
        animate={disableComplexEffects ? { opacity: 0.04, scale: 1 } : { opacity: [0.04, 0.07, 0.04], scale: [1, 1.04, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-[#ff007f] blur-[60px] rounded-full pointer-events-none z-0"
        style={{ willChange: 'transform, opacity' }}
      />

      {/* ── Floating Cards Background Section ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {isLoading
          ? /* Skeleton Loading State */
            cardStyles.map((style, index) => (
              <motion.div
                key={`skeleton-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: style.showMobile ? 0.4 : 0.8, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className={`absolute ${style.showMobile ? 'block md:block' : 'hidden md:block'}`}
                style={{
                  top: style.top,
                  left: style.left,
                  right: style.right,
                  bottom: style.bottom,
                  transform: `rotate(${style.rotate}deg) scale(${style.scale})`,
                  willChange: 'transform',
                }}
              >
                <div className="w-28 h-40 sm:w-40 sm:h-56 rounded-2xl overflow-hidden bg-[#150a22]/80 border border-white/10 shadow-lg relative p-3 flex flex-col justify-between">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  <div className="w-12 h-4 rounded-md bg-white/10 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-3 rounded bg-white/15 animate-pulse" />
                    <div className="w-1/2 h-2.5 rounded bg-white/10 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))
          : /* Loaded Anime Cards */
            initialAnime.slice(0, 8).map((anime, index) => {
              const style = cardStyles[index % cardStyles.length];
              const scoreTheme = getScoreTheme(anime.averageScore);

              const parallaxX = useTransform(smoothMouseX, (val) => val * style.depth);
              const parallaxY = useTransform(smoothMouseY, (val) => val * style.depth);

              return (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 30, rotate: style.rotate, scale: style.scale }}
                  animate={{ opacity: 1, y: 0, rotate: style.rotate, scale: style.scale }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: 'easeOut' }}
                  className={`absolute ${style.showMobile ? 'block opacity-40 sm:opacity-100' : 'hidden sm:block'}`}
                  style={{
                    top: style.top,
                    left: style.left,
                    right: style.right,
                    bottom: style.bottom,
                    x: disableComplexEffects ? 0 : parallaxX,
                    y: disableComplexEffects ? 0 : parallaxY,
                    willChange: 'transform',
                  }}
                >
                  {/* Inner Continuous Floating Bob Motion */}
                  <motion.div
                    animate={disableComplexEffects ? { y: 0 } : { y: [0, -14, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: index * 0.4 }}
                    className={`relative w-28 h-40 sm:w-40 sm:h-56 rounded-2xl overflow-hidden ${scoreTheme.shadow} border ${scoreTheme.border} group transition-all duration-300 backdrop-blur-sm`}
                    style={{ willChange: 'transform' }}
                  >
                    <SafeCardImage
                      src={anime.coverImage.large}
                      alt={anime.title.english || anime.title.romaji}
                      sizes="(max-width: 640px) 112px, 160px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

                    {/* Score Badge */}
                    {anime.averageScore && (
                      <div className={`absolute top-2 left-2 ${scoreTheme.badgeBg} px-2 py-0.5 rounded-md flex items-center gap-1 border ${scoreTheme.border} shadow-md`}>
                        <Star size={11} className={scoreTheme.starColor} />
                        <span className={`text-[10px] sm:text-xs ${scoreTheme.badgeText}`}>
                          {(anime.averageScore / 10).toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Title Overlay */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-[10px] sm:text-xs font-semibold line-clamp-2 leading-tight drop-shadow-md">
                        {anime.title.english || anime.title.romaji}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
      </div>

      {/* ── Main Hero Content Overlay ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-16">
        
        {/* Top Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-block px-4 py-1.5 rounded-full border border-[#ff007f]/30 bg-[#ff007f]/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,0,127,0.2)]"
        >
          <span className="text-[#ff007f] text-xs sm:text-sm font-bold tracking-wider uppercase">Your anime journey starts here</span>
        </motion.div>

        {/* Staggered Animated Word Heading */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05, delayChildren: 0.1 },
            },
          }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.25] tracking-tight mb-6 flex flex-wrap justify-center gap-x-2.5 gap-y-1"
        >
          {titleWords.map((word, i) => {
            const isPink = word === "Reviews" || word === "&" || word === "Watchlist,";
            return (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 15, filter: 'blur(4px)' },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5 } },
                }}
                className={isPink ? "text-transparent bg-clip-text bg-gradient-to-r from-[#ff007f] to-[#ff4dd2]" : "text-white"}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="text-base sm:text-lg md:text-xl text-gray-300/90 mb-10 max-w-2xl font-medium mx-auto leading-relaxed"
        >
          Your personal anime companion. Manage your watchlist, discover trending series, and connect with fellow fans.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full sm:w-auto"
        >
          <Link
            href="/home"
            className="group relative px-8 py-4 bg-[#ff007f] hover:bg-[#e60073] text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(255,0,127,0.3)] hover:shadow-[0_8px_30px_rgba(255,0,127,0.5)] hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Go To Home Page
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer skew-x-12 pointer-events-none" />
          </Link>

          <Link
            href="/browse"
            className="group px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white font-bold rounded-2xl transition-all duration-300 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center"
          >
            Browse
          </Link>
        </motion.div>

        {/* ── Scroll-Reveal Stats Section ── */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 30 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mt-14 flex flex-wrap justify-center items-center gap-8 md:gap-16 pt-8 border-t border-white/10 w-full max-w-3xl mx-auto"
        >
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
              <Counter to={50} suffix="K+" duration={2.5} />
            </span>
            <span className="text-gray-400 text-xs sm:text-sm font-medium">Anime Titles</span>
          </div>

          <div className="hidden md:block w-px h-12 bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
              <Counter to={60} suffix="+" duration={2.0} />
            </span>
            <span className="text-gray-400 text-xs sm:text-sm font-medium">Genres</span>
          </div>

          <div className="hidden md:block w-px h-12 bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-white mb-1 tracking-tight">
              <Counter to={10} suffix="K+" duration={2.5} />
            </span>
            <span className="text-gray-400 text-xs sm:text-sm font-medium">Theme Songs</span>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
