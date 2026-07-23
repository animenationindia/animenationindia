import Link from 'next/link';
import { Home, Compass, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#050716] text-white flex items-center justify-center p-6 relative overflow-hidden selection:bg-[#ff4dd2] selection:text-white">
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#ff4dd2]/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#00f0ff]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-lg w-full text-center bg-[#121326]/60 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10">
        
        {/* Animated 404 Badge */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-[#ff4dd2]/20 to-[#00f0ff]/20 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2] shadow-[0_0_20px_rgba(255,77,210,0.3)]">
          <AlertCircle size={40} />
        </div>

        <h1 className="text-6xl md:text-7xl font-black font-bebas tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] via-white to-[#00f0ff] mb-2">
          404
        </h1>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
          Page Not Found
        </h2>

        <p className="text-sm text-gray-300 leading-relaxed mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/home"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-[#9900ff] text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,210,0.4)] cursor-pointer"
          >
            <Home size={18} />
            Back to Home
          </Link>

          <Link
            href="/browse/all"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all font-semibold text-sm cursor-pointer"
          >
            <Compass size={18} />
            Browse Anime
          </Link>
        </div>
      </div>
    </main>
  );
}
