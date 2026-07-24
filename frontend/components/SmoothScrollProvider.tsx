'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

interface SmoothScrollContextType {
  lenis: Lenis | null;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({ lenis: null });

export const useSmoothScroll = () => useContext(SmoothScrollContext);

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const resizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Check if the device is a touch/mobile device
    const isTouchDevice =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches);

    // Mobile/touch devices already have OS-level smooth momentum scroll.
    if (isTouchDevice) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easeOut for buttery feel
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      autoResize: true, // Native Lenis v1.3.x autoResize support
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    function raf(time: number) {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    }

    rafIdRef.current = requestAnimationFrame(raf);

    // 🚀 1. Debounced ResizeObserver on document.body for dynamic height shifts (.cv-auto, Suspense, lazy content)
    const handleResizeDebounced = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        if (lenisRef.current) {
          lenisRef.current.resize();
        }
      }, 150);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window && document.body) {
      resizeObserver = new ResizeObserver(handleResizeDebounced);
      resizeObserver.observe(document.body);
    }

    // 🚀 2. Custom window event listener ('lenis-resize') for explicit component triggers
    const handleCustomResize = () => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
    };
    window.addEventListener('lenis-resize', handleCustomResize);

    // 🚀 3. Event listener for image load completions to adjust height
    const handleImageLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        handleResizeDebounced();
      }
    };
    window.addEventListener('load', handleImageLoad, true);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('lenis-resize', handleCustomResize);
      window.removeEventListener('load', handleImageLoad, true);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, []);

  // 🚀 Route change scroll reset sequence to prevent bottom/footer jump flicker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }

    if (!lenisRef.current) return;

    // 1. Pause Lenis momentum
    lenisRef.current.stop();

    // 2. Force immediate scroll reset to top
    lenisRef.current.scrollTo(0, { immediate: true, force: true });

    // 3. Recalculate layout height after next frame paint & resume Lenis
    const timer = setTimeout(() => {
      if (lenisRef.current) {
        window.scrollTo(0, 0);
        lenisRef.current.scrollTo(0, { immediate: true, force: true });
        lenisRef.current.resize();
        lenisRef.current.start();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisInstance }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}
