'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';
import { logError } from '../../../lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SeriesPageError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log explicit error details for production debugging
    console.error('🔥 [SeriesPageError] Unhandled error loading series details:', error);
    logError('SeriesPageError', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#050716] text-white flex items-center justify-center p-6 relative overflow-hidden selection:bg-[#ff4dd2] selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-lg w-full text-center bg-[#121326]/60 backdrop-blur-xl border border-rose-500/20 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10">
        
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <AlertTriangle size={36} />
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          Unable to Load Series Details
        </h1>

        <p className="text-sm text-gray-300 leading-relaxed mb-8">
          We encountered an issue fetching details for this series. Please try refreshing or click below to return to the catalog.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-[#ff4dd2] text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,210,0.4)] cursor-pointer"
          >
            <RotateCcw size={18} />
            Try Again
          </button>

          <Link
            href="/browse/all"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-semibold text-sm cursor-pointer"
          >
            <Home size={18} />
            Browse Anime
          </Link>
        </div>
      </div>
    </main>
  );
}
