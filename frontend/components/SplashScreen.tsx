"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [show, setShow] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const [isPulse, setIsPulse] = useState<boolean>(false);

  useEffect(() => {
    // Check if splash screen is explicitly disabled in user settings
    const splashEnabled = localStorage.getItem('splashScreenEnabled');
    if (splashEnabled === 'false') {
      setReady(true);
      return;
    }

    setShow(true);
    
    // Step 4: Pulse effect at 3.0s (when loading bar completes)
    const pulseTimer = setTimeout(() => {
      setIsPulse(true);
    }, 3000);

    // Step 5: Start exit fade-out at 3.5s
    const exitTimer = setTimeout(() => {
      setShow(false);
    }, 3500);
    
    setReady(true);
    return () => {
      clearTimeout(pulseTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const handleExitComplete = () => {
    // SessionStorage removed so splash plays on every hard reload
  };

  if (!ready) return null;

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {show && (
        <motion.div
          key="splash-screen"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050716] overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 1.1, 
            filter: "blur(10px)",
            transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } 
          }}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <motion.div 
              className="w-[400px] h-[400px] bg-[#ff4dd2] rounded-full blur-[120px] opacity-20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.2 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </div>

          <div className="flex flex-col items-center justify-center relative z-10 w-full max-w-sm px-8">
            
            {/* Elegant Logo Reveal */}
            <motion.div
              className="relative w-24 h-24 mb-6"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] flex items-center justify-center border border-white/5 p-4">
                <img src="/ani-logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </motion.div>

            {/* Typography Reveal */}
            <div className="overflow-hidden">
              <motion.h1
                className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                Anime Nation India
              </motion.h1>
            </div>

            {/* Sleek Loader Line */}
            <motion.div
              className="mt-8 w-full h-[2px] bg-gray-800/50 rounded-full overflow-hidden relative"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            >
              {/* Sweeping Highlight */}
              <motion.div
                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-[#ff4dd2] to-transparent"
                animate={{ left: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Main Progress Fill */}
              <motion.div
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#ff4dd2] to-[#ff4dd2]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
