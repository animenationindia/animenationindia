'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, ExternalLink } from 'lucide-react';

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId: string | null;
  title: string;
}

export default function TrailerModal({ isOpen, onClose, youtubeId, title }: TrailerModalProps) {
  if (!isOpen || !youtubeId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-[#0b0c1e] border border-[#ff4dd2]/30 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2.5 min-w-0 pr-4">
              <div className="w-8 h-8 rounded-xl bg-[#ff4dd2]/20 flex items-center justify-center text-[#ff4dd2] flex-shrink-0 border border-[#ff4dd2]/30">
                <Film size={16} />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                {title} <span className="text-gray-400 font-medium text-xs">• Official Trailer</span>
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Video Container 16:9 */}
          <div className="relative w-full aspect-video bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={`${title} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 text-xs text-gray-400 bg-white/5 border-t border-white/5">
            <span>Powered by YouTube & TMDB 4K Video Pipeline</span>
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#ff4dd2] hover:underline font-bold"
            >
              <span>Open on YouTube</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
