"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide the back button on the Home page, Splash page, or Auth page if desired.
  // We'll hide it on '/' and '/home'.
  if (!mounted || pathname === "/" || pathname === "/home") return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        onClick={() => router.back()}
        className="fixed top-[85px] md:top-[90px] left-4 md:left-8 z-[60] p-2 md:p-2.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 text-white/80 hover:text-white hover:bg-[#f47521]/90 hover:border-[#f47521] hover:scale-110 hover:shadow-[0_0_15px_rgba(244,117,33,0.5)] transition-all group flex items-center justify-center cursor-pointer"
        aria-label="Go Back"
        title="Go Back"
      >
        <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 group-hover:-translate-x-1 transition-transform duration-300" />
      </motion.button>
    </AnimatePresence>
  );
}
