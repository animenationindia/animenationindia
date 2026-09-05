'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' && url.startsWith('/') 
    ? `${window.location.origin}${url}` 
    : url;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const shareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${fullUrl}`)}`;
  const shareTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`;
  const shareTelegram = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`;
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-[#888] uppercase tracking-wider flex items-center gap-1.5 mr-1">
        <Share2 size={13} className="text-[#ff4dd2]" /> Share:
      </span>

      {/* WhatsApp */}
      <a
        href={shareWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] transition-all hover:scale-105"
        title="Share on WhatsApp"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle size={15} />
      </a>

      {/* Twitter / X */}
      <a
        href={shareTwitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-[#2A2B30] text-white transition-all hover:scale-105"
        title="Share on X"
        aria-label="Share on X"
      >
        <span className="font-bold text-xs leading-none">𝕏</span>
      </a>

      {/* Telegram */}
      <a
        href={shareTelegram}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-[#229ED9]/10 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-[#229ED9] transition-all hover:scale-105"
        title="Share on Telegram"
        aria-label="Share on Telegram"
      >
        <Send size={15} />
      </a>

      {/* Facebook */}
      <a
        href={shareFacebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 text-[#1877F2] transition-all hover:scale-105"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <span className="font-bold text-xs leading-none">f</span>
      </a>

      {/* Copy Link Button */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121326] hover:bg-[#1c1e3a] border border-[#2A2B30] hover:border-[#ff4dd2] text-xs font-semibold text-[#c0c0c0] hover:text-white transition-all"
        title="Copy article link"
      >
        {copied ? (
          <>
            <Check size={13} className="text-green-400" />
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <Copy size={13} />
            <span>Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
}
