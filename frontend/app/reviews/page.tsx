'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Star, ThumbsUp, Sparkles, Compass, ShieldCheck, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

const PREVIEW_REVIEWS = [
  {
    id: 1,
    animeTitle: 'Frieren: Beyond Journey\'s End',
    animeCover: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
    user: 'Subhasish_Otaku',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Subhasish',
    score: 10,
    date: 'March 2026',
    helpfulCount: 42,
    badge: 'Verified Otaku',
    review: 'A masterclass in storytelling and emotional pacing. The animation by Madhouse is breathtaking, and the character dynamics between Frieren, Fern, and Stark feel genuine and heartwarming.'
  },
  {
    id: 2,
    animeTitle: 'Solo Leveling: Season 2',
    animeCover: 'https://cdn.myanimelist.net/images/anime/1429/142340.jpg',
    user: 'JinWoo_Fan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JinWoo',
    score: 9,
    date: 'February 2026',
    helpfulCount: 38,
    badge: 'Top Reviewer',
    review: 'The shadow monarch awakening arc delivered on all fronts! Hiroyuki Sawano\'s score combined with A-1 Pictures\' insane fight choreography makes every episode an adrenaline rush.'
  },
  {
    id: 3,
    animeTitle: 'Demon Slayer: Infinity Castle',
    animeCover: 'https://cdn.myanimelist.net/images/anime/1908/135431.jpg',
    user: 'Tanjiro_Breathe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanjiro',
    score: 10,
    date: 'January 2026',
    helpfulCount: 55,
    badge: 'Community Critic',
    review: 'Ufotable once again pushes the boundaries of digital animation. The dimensional shifts in the Infinity Castle are visually stunning and set the bar high for modern shonen movies.'
  }
];

export default function ReviewsPage() {
  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-[#00f7ff]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-10">
          <Link 
            href="/home" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff4dd2] transition-colors mb-6 font-medium text-sm"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-[#ff4dd2]/20 to-[#00f7ff]/20 border border-[#ff4dd2]/30 rounded-2xl shadow-[0_0_20px_rgba(255,77,210,0.3)]">
                <MessageCircle className="text-[#ff4dd2]" size={32} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#00f7ff] mb-1">
                  <Sparkles size={13} />
                  <span>ANI Community Hub</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_15px_rgba(255,77,210,0.4)]">
                  Otaku <span className="text-[#ff4dd2]">Reviews</span>
                </h1>
                <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base mt-1">
                  Unfiltered opinions, ratings, and breakdowns by passionate Indian anime fans.
                </p>
              </div>
            </div>

            {/* Custom Review Submission Notice */}
            <div className="flex items-center gap-2 bg-[#0c0e22] border border-[#ff4dd2]/30 px-4 py-2.5 rounded-xl shadow-lg">
              <ShieldCheck size={18} className="text-[#00f7ff]" />
              <span className="text-xs font-semibold text-gray-300">
                Custom Member Reviews <span className="text-[#ff4dd2] font-bold">• In Development</span>
              </span>
            </div>
          </div>
        </div>

        {/* Feature Announcement Banner */}
        <div className="mb-10 bg-gradient-to-r from-[#12142e] via-[#1a1b38] to-[#12142e] border border-[#ff4dd2]/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff4dd2]/20 text-[#ff4dd2] text-xs font-bold uppercase tracking-wider mb-2 border border-[#ff4dd2]/30">
                <PenTool size={12} />
                <span>Upcoming Custom Feature</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Write & Share Your Anime Reviews Directly on ANI
              </h3>
              <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
                We are building our dedicated in-house review and rating system. Registered ANI members will be able to score series, publish spoiler-tagged reviews, and earn community reputation badges!
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link 
                href="/trending"
                className="px-5 py-2.5 rounded-full bg-[#ff4dd2] hover:bg-[#ff2bb5] text-white font-bold text-sm shadow-[0_0_15px_rgba(255,77,210,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Compass size={16} />
                <span>Explore Trending</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Preview Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREVIEW_REVIEWS.map((review, index) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#0e1024]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col group hover:border-[#ff4dd2]/50 hover:shadow-[0_0_25px_rgba(255,77,210,0.2)] transition-all duration-300"
            >
              {/* Header: User and Score */}
              <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={review.avatar} 
                    alt={review.user} 
                    className="w-11 h-11 rounded-full border border-white/10 bg-black/40 object-cover"
                  />
                  <div>
                    <h4 className="text-white font-bold text-sm">{review.user}</h4>
                    <span className="text-[10px] text-[#00f7ff] uppercase font-bold tracking-wider">{review.badge}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#ff4dd2]/10 px-2.5 py-1 rounded-lg text-[#ff4dd2] font-bold text-sm border border-[#ff4dd2]/30 shadow-[0_0_10px_rgba(255,77,210,0.2)]">
                  <Star size={13} className="fill-[#ff4dd2]" />
                  <span>{review.score}/10</span>
                </div>
              </div>

              {/* Anime Info */}
              <div className="flex items-center gap-3.5 mb-4 bg-black/40 p-3 rounded-xl border border-white/5 group-hover:border-[#ff4dd2]/30 transition-colors">
                <img 
                  src={review.animeCover} 
                  alt={review.animeTitle} 
                  className="w-11 h-14 object-cover rounded-md shadow-md flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Reviewed Anime</p>
                  <h3 className="text-white font-bold text-sm truncate group-hover:text-[#ff4dd2] transition-colors">{review.animeTitle}</h3>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-6 flex-1">
                "{review.review}"
              </p>

              {/* Footer */}
              <div className="mt-auto pt-3.5 border-t border-white/5 flex items-center justify-between text-gray-400 text-xs">
                <span>{review.date}</span>
                <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                  <ThumbsUp size={13} className="text-[#00f7ff]" />
                  <span>{review.helpfulCount} found helpful</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </main>
  );
}

