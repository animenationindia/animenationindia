// WARNING: COMMUNITY DISCUSSION - UI ONLY
// Backend database integration pending.
// Enable by: (1) adding DB integration, (2) removing the {false && ...} wrapper in AnimeDetailsContainer

'use client';

import { useState } from 'react';
import { MessageSquare, AlertTriangle, Send } from 'lucide-react';

interface CommunityDiscussionProps {
  titleId: string;
  mediaType: string;
  titleName?: string;
}

export default function CommunityDiscussion({
  titleId,
  mediaType,
  titleName,
}: CommunityDiscussionProps) {
  const [commentText, setCommentText] = useState('');

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-10 border-t border-white/5">
      <div className="bg-[#0b0c20]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#e50914]/20 text-[#e50914] border border-[#e50914]/30 p-2 rounded-xl">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="font-black text-white text-base tracking-wide leading-tight">
                COMMUNITY DISCUSSION
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Share thoughts, theories, and reviews with fellow viewers.
              </p>
            </div>
          </div>

          {/* Comment Count Badge */}
          <span className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl self-start sm:self-auto">
            0 Comments
          </span>
        </div>

        {/* Comment Form */}
        <form onSubmit={(e) => e.preventDefault()} className="mb-6">
          {/* Textarea */}
          <div className="relative mb-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 1500))}
              placeholder={`Share your review or discussion on ${titleName || 'this title'}...`}
              className="w-full bg-[#070819]/80 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-gray-300 placeholder:text-gray-600 resize-none h-24 focus:outline-none focus:border-[#ff4dd2]/40 transition-colors"
            />
            {/* Character Count */}
            <span className="absolute bottom-3 right-4 text-[10px] text-gray-600 select-none">
              {commentText.length}/1500
            </span>
          </div>

          {/* Spoiler Checkbox + Post Button Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Contains Spoilers */}
            <label className="flex items-center gap-2 cursor-default select-none">
              <div className="w-4 h-4 rounded border border-white/20 bg-white/5 flex-shrink-0" />
              <AlertTriangle size={13} className="text-yellow-500" />
              <span className="text-xs text-gray-400">Contains Spoilers</span>
            </label>

            {/* Post Button */}
            <button
              type="button"
              onClick={() => {}}
              disabled
              className="flex items-center gap-2 bg-[#e50914] hover:bg-[#ff1f2d] text-white font-bold px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider cursor-not-allowed opacity-80 transition-colors"
            >
              <Send size={13} />
              POST COMMENT
            </button>
          </div>
        </form>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <MessageSquare size={48} className="text-gray-700" />
          <p className="text-gray-400 font-bold text-sm">No discussions yet</p>
          <p className="text-xs text-gray-500 text-center max-w-xs">
            Be the first to share your thoughts on this title!
          </p>
        </div>
      </div>
    </section>
  );
}