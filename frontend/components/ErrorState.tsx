'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  message = 'Failed to load data. Please check your internet connection and try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full py-12 px-6 flex flex-col items-center justify-center text-center bg-[#121326]/60 backdrop-blur-xl border border-rose-500/20 rounded-2xl shadow-xl my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
        <AlertTriangle size={28} />
      </div>

      <h3 className="text-lg md:text-xl font-bold text-white mb-2">
        Something Went Wrong!
      </h3>
      <p className="text-sm text-gray-300 max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-[#ff4dd2] text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,210,0.4)] cursor-pointer"
        >
          <RotateCcw size={16} />
          Try Again
        </button>
      )}
    </motion.div>
  );
}
