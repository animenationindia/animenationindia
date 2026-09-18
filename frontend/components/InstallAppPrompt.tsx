'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Sparkles, Smartphone, Share2, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    if (isPWA) return;

    // Check dismiss cooldown (7 days)
    const dismissedAt = localStorage.getItem('ani_pwa_dismissed');
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 7) return;
    }

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Delay showing iOS prompt slightly for better UX
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    // Android & Chromium browsers beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ani_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[420px] z-50 pointer-events-auto"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#09090e]/95 backdrop-blur-xl border border-[#ff2a5f]/30 p-5 shadow-[0_10px_40px_rgba(255,42,95,0.2)]">
          {/* Neon Accent Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#ff2a5f]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Dismiss app install prompt"
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff2a5f] to-[#e11d48] p-0.5 shadow-lg shadow-[#ff2a5f]/30 shrink-0">
              <div className="w-full h-full rounded-[10px] bg-[#09090e] flex items-center justify-center overflow-hidden">
                <span className="text-[#ff2a5f] font-black text-xl tracking-tighter">ANI</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-1.5 mb-1">
                <h4 className="text-white font-bold text-sm tracking-wide">
                  Install Anime Nation India
                </h4>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {isIOS
                  ? 'Add to Home Screen for fast, fullscreen anime streaming without browser bars!'
                  : 'Install our ultra-fast web app on your device for instant offline access & full immersion!'}
              </p>

              {/* Action Buttons */}
              {isIOS ? (
                <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-white/5 border border-white/10 rounded-lg p-2.5">
                  <span>Tap</span>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>then select</span>
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <PlusSquare className="w-3 h-3" /> Add to Home Screen
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff2a5f] to-[#d91b4c] text-white font-bold text-xs shadow-md shadow-[#ff2a5f]/25 hover:shadow-lg hover:shadow-[#ff2a5f]/40 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Not Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
