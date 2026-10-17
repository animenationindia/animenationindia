/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { Star, Film } from 'lucide-react';
import { toEnglishTitle } from '../lib/titleCleaner';

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

// ─── Score Theme Utility ──────────────────────────────────────────────────
function getScoreTheme(score?: number | null) {
  if (!score) {
    return {
      border: 'border-white/15',
      badgeBg: 'bg-black/80',
      badgeText: 'text-gray-200',
      starColor: 'text-gray-300 fill-gray-300',
      shadow: 'shadow-[0_10px_25px_rgba(0,0,0,0.6)]',
    };
  }
  const normalized = score > 10 ? score / 10 : score;
  if (normalized >= 9.0) {
    return {
      border: 'border-amber-400/40',
      badgeBg: 'bg-amber-950/90',
      badgeText: 'text-amber-300 font-extrabold',
      starColor: 'text-amber-400 fill-amber-400',
      shadow: 'shadow-[0_10px_25px_rgba(0,0,0,0.6)]',
    };
  }
  if (normalized >= 8.0) {
    return {
      border: 'border-[#ff007f]/40',
      badgeBg: 'bg-[#ff007f]/20',
      badgeText: 'text-pink-300 font-extrabold',
      starColor: 'text-pink-400 fill-pink-400',
      shadow: 'shadow-[0_10px_25px_rgba(0,0,0,0.6)]',
    };
  }
  return {
    border: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-950/80',
    badgeText: 'text-cyan-200 font-bold',
    starColor: 'text-cyan-400 fill-cyan-400',
    shadow: 'shadow-[0_10px_25px_rgba(0,0,0,0.6)]',
  };
}

// ─── Safe Image Component with Fallback ────────────────────────────────────
function SafeCardImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#1a0c28] via-[#0d0515] to-[#250d38] flex flex-col items-center justify-center p-3 text-center">
        <Film className="w-7 h-7 text-[#ff007f]/60 mb-2 animate-pulse" />
        <span className="text-[10px] text-gray-400 font-medium line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      loading="lazy" 
      decoding="async"
      onError={() => setError(true)}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
    />
  );
}

// ─── Counter Component for Animated Numbers ────────────────────────────────
const Counter = ({ from = 0, to, duration = 1.8, suffix = '' }: { from?: number; to: number; duration?: number; suffix?: string }) => {
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

// ─── Balanced 8-Card Positioning (Framing the Hero Space) ─────────────────
interface CardStyle {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  rotate: number;
  scale: number;
  depth: number;
}

const cardStyles: CardStyle[] = [
  // Left 4 cards
  { top: '8%', left: '3%', rotate: -8, scale: 0.9, depth: 20 },
  { top: '38%', left: '1.5%', rotate: 6, scale: 0.86, depth: -15 },
  { top: '68%', left: '3%', rotate: -9, scale: 0.88, depth: 22 },
  { top: '2%', left: '18%', rotate: 4, scale: 0.82, depth: 14 },

  // Right 4 cards
  { top: '10%', right: '3%', rotate: 8, scale: 0.9, depth: -20 },
  { top: '40%', right: '1.5%', rotate: -6, scale: 0.86, depth: 15 },
  { top: '70%', right: '3%', rotate: 10, scale: 0.88, depth: -22 },
  { top: '3%', right: '18%', rotate: -5, scale: 0.82, depth: -14 },
];

// ─── Sub-Component: Parallax Anime Card (Encapsulates Hooks cleanly) ────────
interface ParallaxCardProps {
  anime: AnimeNode;
  styleConfig: CardStyle;
  index: number;
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  disableComplexEffects: boolean;
}

const ParallaxCard = React.memo(function ParallaxCard({
  anime,
  styleConfig,
  index,
  smoothMouseX,
  smoothMouseY,
  disableComplexEffects,
}: ParallaxCardProps) {
  const scoreTheme = getScoreTheme(anime.averageScore);
  const parallaxX = useTransform(smoothMouseX, (val) => val * styleConfig.depth);
  const parallaxY = useTransform(smoothMouseY, (val) => val * styleConfig.depth);
  const titleStr = toEnglishTitle(anime.title.english || anime.title.romaji || 'Anime');

  return (
    <motion.div
      initial={{ opacity: 0, y: 25, rotate: styleConfig.rotate, scale: styleConfig.scale }}
      animate={{ opacity: 1, y: 0, rotate: styleConfig.rotate, scale: styleConfig.scale }}
      transition={{ delay: index * 0.07 + 0.1, duration: 0.6, ease: 'easeOut' }}
      className="absolute pointer-events-auto"
      style={{
        top: styleConfig.top,
        left: styleConfig.left,
        right: styleConfig.right,
        bottom: styleConfig.bottom,
        x: disableComplexEffects ? 0 : parallaxX,
        y: disableComplexEffects ? 0 : parallaxY,
        willChange: 'transform',
      }}
    >
      <div
        className={`relative w-36 h-52 lg:w-40 lg:h-56 rounded-2xl overflow-hidden ${scoreTheme.shadow} border ${scoreTheme.border} group transition-transform duration-300 bg-[#12071f]/95 animate-float-card`}
        style={{
          animationDelay: `${index * 0.4}s`,
          willChange: 'transform',
        }}
      >
        <SafeCardImage src={anime.coverImage.large} alt={titleStr} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent pointer-events-none" />

        {/* Score Badge */}
        {typeof anime.averageScore === 'number' && !isNaN(anime.averageScore) && (
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
            {titleStr}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Main Landing Page Component ───────────────────────────────────────────
export default function LandingPageClient({ initialAnime }: LandingPageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.3 });

  // 🚀 Mobile & Low-end Hardware Detection
  useEffect(() => {
    const checkEnvironment = () => {
      const mobile = 
        typeof window !== 'undefined' && 
        (window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsMobile(mobile);

      if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        if (navigator.hardwareConcurrency < 4) {
          setIsLowEndDevice(true);
        }
      }
    };

    checkEnvironment();
    window.addEventListener('resize', checkEnvironment, { passive: true });
    return () => window.removeEventListener('resize', checkEnvironment);
  }, []);

  const disableComplexEffects = shouldReduceMotion || isLowEndDevice || isMobile;

  // Optimized Mouse Motion Values with lightweight springs (Desktop only)
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const springConfig = { stiffness: 60, damping: 20, mass: 0.5 };
  const smoothMouseX = useSpring(rawMouseX, springConfig);
  const smoothMouseY = useSpring(rawMouseY, springConfig);

  // 🎯 Event-Driven Mouse Handler: ONLY updates when mouse moves (Zero Idle CPU cycles)
  useEffect(() => {
    if (disableComplexEffects) return;
    const element = mainRef.current;
    if (!element) return;

    let rafScheduled = false;

    const onMouseMove = (e: MouseEvent) => {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) - 0.5;
        const normY = ((e.clientY - rect.top) / rect.height) - 0.5;
        rawMouseX.set(normX);
        rawMouseY.set(normY);
        rafScheduled = false;
      });
    };

    const onMouseLeave = () => {
      rawMouseX.set(0);
      rawMouseY.set(0);
    };

    // Pause physics if tab is switched/minimized
    const onVisibilityChange = () => {
      if (document.hidden) {
        rawMouseX.set(0);
        rawMouseY.set(0);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [disableComplexEffects, rawMouseX, rawMouseY]);

  // Animated Title Words
  const titleWords = [
    "Watch", "Anime,", "Live", "Schedule,",
    "Reviews", "&", "Watchlist,",
    "Discover", "&", "Get", "Full", "Details", "of", "Anime"
  ];

  const isLoading = !initialAnime || initialAnime.length === 0;

  return (
    <main
      ref={mainRef}
      className="relative w-full min-h-screen bg-[#0a0510] flex items-center justify-center overflow-hidden selection:bg-[#ff007f] selection:text-white"
    >
      {/* ── 📱 CSS Gradient Backdrop (Zero JS / Zero GPU Overhead) ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0510] via-[#12071f] to-[#050716] pointer-events-none z-0" />

      {/* ── High-Performance Native Radial Gradient Ambient Glows (0% GPU Blur Cost) ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(circle at 10% 15%, rgba(255, 0, 127, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 90% 85%, rgba(255, 0, 127, 0.10) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(18, 7, 31, 0.6) 0%, transparent 70%)
          `,
        }}
      />

      {/* ── Desktop Floating Anime Cards (Hidden on Mobile to eliminate 100% CPU/GPU overhead) ── */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
        {isLoading
          ? /* Skeleton Loading State */
            cardStyles.map((style, index) => (
              <div
                key={`skeleton-${index}`}
                className="absolute"
                style={{
                  top: style.top,
                  left: style.left,
                  right: style.right,
                  bottom: style.bottom,
                  transform: `rotate(${style.rotate}deg) scale(${style.scale})`,
                }}
              >
                <div className="w-36 h-52 lg:w-40 lg:h-56 rounded-2xl overflow-hidden bg-[#150a22]/80 border border-white/10 shadow-lg relative p-3 flex flex-col justify-between">
                  <div className="w-12 h-4 rounded-md bg-white/10 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-3 rounded bg-white/15 animate-pulse" />
                    <div className="w-1/2 h-2.5 rounded bg-white/10 animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          : /* Loaded 8 Balanced Anime Cards */
            initialAnime.slice(0, 8).map((anime, index) => (
              <ParallaxCard
                key={anime.id}
                anime={anime}
                styleConfig={cardStyles[index % cardStyles.length]}
                index={index}
                smoothMouseX={smoothMouseX}
                smoothMouseY={smoothMouseY}
                disableComplexEffects={disableComplexEffects}
              />
            ))}
      </div>

      {/* ── Main Hero Content Overlay (Instant Critical Rendering) ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-12 md:py-16">
        
        {/* Top Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 inline-block px-4 py-1.5 rounded-full border border-[#ff007f]/30 bg-[#ff007f]/10 shadow-[0_0_15px_rgba(255,0,127,0.15)]"
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
              transition: { staggerChildren: 0.03, delayChildren: 0.05 },
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
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-lg md:text-xl text-gray-300/90 mb-8 md:mb-10 max-w-2xl font-medium mx-auto leading-relaxed"
        >
          Your personal anime companion. Manage your watchlist, discover trending series, and connect with fellow fans.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 justify-center w-full sm:w-auto"
        >
          <Link
            href="/home"
            className="group relative px-8 py-3.5 sm:py-4 bg-[#ff007f] hover:bg-[#e60073] text-white font-bold rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(255,0,127,0.3)] hover:shadow-[0_8px_30px_rgba(255,0,127,0.5)] hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center overflow-hidden cursor-pointer"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base">
              Go To Home Page
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer skew-x-12 pointer-events-none" />
          </Link>

          <Link
            href="/browse"
            className="group px-8 py-3.5 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto text-center cursor-pointer text-sm sm:text-base"
          >
            Browse
          </Link>
        </motion.div>

        {/* ── Scroll-Reveal Stats Section ── */}
        <motion.div
          ref={statsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isStatsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-12 md:mt-14 flex flex-wrap justify-center items-center gap-6 sm:gap-8 md:gap-16 pt-8 border-t border-white/10 w-full max-w-3xl mx-auto"
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-extrabold text-white mb-0.5 tracking-tight">
              <Counter to={50} suffix="K+" duration={1.8} />
            </span>
            <span className="text-gray-400 text-[11px] sm:text-sm font-medium">Anime Titles</span>
          </div>

          <div className="hidden sm:block w-px h-10 md:h-12 bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-extrabold text-white mb-0.5 tracking-tight">
              <Counter to={60} suffix="+" duration={1.6} />
            </span>
            <span className="text-gray-400 text-[11px] sm:text-sm font-medium">Genres</span>
          </div>

          <div className="hidden sm:block w-px h-10 md:h-12 bg-white/10" />

          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-extrabold text-white mb-0.5 tracking-tight">
              <Counter to={10} suffix="K+" duration={1.8} />
            </span>
            <span className="text-gray-400 text-[11px] sm:text-sm font-medium">Theme Songs</span>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
