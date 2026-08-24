'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cleanAnimeSynopsis } from '../lib/sanitize';

interface ReadMoreTextProps {
  text: string;
  maxChars?: number;
  className?: string;
  showSource?: boolean;
}

export default function ReadMoreText({ text, maxChars = 340, className = '', showSource = true }: ReadMoreTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { text: cleanText, sourceAttribution } = useMemo(() => {
    return cleanAnimeSynopsis(text);
  }, [text]);

  if (!cleanText) return null;
  const shouldTruncate = cleanText.length > maxChars;

  const displayText = isExpanded || !shouldTruncate 
    ? cleanText 
    : cleanText.slice(0, maxChars) + '...';

  // Split by double newlines into clean paragraph blocks
  const paragraphs = displayText.split(/\n\n+/).filter(Boolean);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        layout
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="text-gray-300 text-sm md:text-base leading-relaxed"
      >
        {paragraphs.map((p, idx) => (
          <p key={idx} className="mb-3 last:mb-0 leading-relaxed text-gray-300">
            {p}
          </p>
        ))}
      </motion.div>

      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#ff4dd2] hover:text-white transition-colors cursor-pointer bg-[#ff4dd2]/10 hover:bg-[#ff4dd2]/20 border border-[#ff4dd2]/30 px-3.5 py-1.5 rounded-full"
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

      {showSource && sourceAttribution && (
        <div className="mt-3 text-[11px] text-gray-500 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500/60" />
          <span>{sourceAttribution}</span>
        </div>
      )}
    </div>
  );
}

