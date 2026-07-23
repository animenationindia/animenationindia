'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReadMoreTextProps {
  text: string;
  maxChars?: number;
  className?: string;
}

export default function ReadMoreText({ text, maxChars = 280, className = '' }: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;
  const shouldTruncate = text.length > maxChars;

  const displayText = isExpanded || !shouldTruncate ? text : text.slice(0, maxChars) + '...';

  return (
    <div className={`relative ${className}`}>
      <motion.div
        layout
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line"
      >
        {displayText}
      </motion.div>

      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-[#ff4dd2] hover:text-white transition-colors cursor-pointer bg-[#ff4dd2]/10 hover:bg-[#ff4dd2]/20 border border-[#ff4dd2]/30 px-3 py-1.5 rounded-full"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp size={14} />
            </>
          ) : (
            <>
              Read More <ChevronDown size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
