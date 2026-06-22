'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Users, TrendingUp, Clock, PlusCircle, Search, Hash, X, Image as ImageIcon, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const forumCategories = [
  {
    title: 'General Discussion',
    description: 'Talk about anything related to anime, manga, and Japanese culture.',
    icon: <MessageSquare className="text-[#ffd54a]" size={24} />,
    topics: 1245,
    posts: 8432,
    latestPost: { user: 'NarutoFan99', time: '10 mins ago', topic: 'Best anime of Spring 2026?' },
    href: '/forums/general'
  },
  {
    title: 'Anime Recommendations',
    description: 'Looking for something new to watch? Ask the community here.',
    icon: <TrendingUp className="text-[#ff4dd2]" size={24} />,
    topics: 856,
    posts: 5120,
    latestPost: { user: 'OtakuKing', time: '1 hour ago', topic: 'If you liked Solo Leveling...' },
    href: '/forums/recommendations'
  },
  {
    title: 'Manga & Light Novels',
    description: 'Discuss the source materials. Please use spoiler tags!',
    icon: <Hash className="text-[#f47521]" size={24} />,
    topics: 432,
    posts: 2890,
    latestPost: { user: 'MangaReader', time: '3 hours ago', topic: 'Chapter 1044 Discussion (SPOILERS)' },
    href: '/forums/manga-novels'
  },
  {
    title: 'Site Feedback & Support',
    description: 'Report bugs, request features, or get help using Anime Nation India.',
    icon: <Users className="text-green-500" size={24} />,
    topics: 156,
    posts: 420,
    latestPost: { user: 'AdminSystem', time: '1 day ago', topic: 'Welcome to the New ANI Community!' },
    href: '/feedback'
  }
];

const trendingTopics = [
  { 
    id: 1, 
    title: 'What is your all-time favorite Opening song?', 
    author: 'MusicLover',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MusicLover',
    replies: 142, 
    views: '12.4k',
    category: 'General Discussion', 
    trendScore: 98,
    tags: ['Music', 'Openings'],
    image: '',
    details: { title: 'Various', author: 'Various', status: 'N/A', genres: ['Music'] },
    content: 'Openings can sometimes make or break an anime. From Unravel to A Cruel Angel\'s Thesis, what is the one anime OP you never skip?'
  },
  { 
    id: 2, 
    title: 'Wistoria: Wand and Sword Season 2 Episode 9', 
    author: 'MagicFan',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MagicFan',
    replies: 89, 
    views: '8.2k',
    category: 'General Discussion', 
    trendScore: 95,
    tags: ['Wistoria', 'Episode Discussion'],
    image: 'https://cdn.myanimelist.net/images/anime/1093/143527.jpg',
    details: { title: 'Wistoria: Wand and Sword', author: 'Fujino Omori', status: 'Airing', genres: ['Action', 'Fantasy'] },
    content: 'The animation in this episode was insane! The fight choreography really popped off. What did everyone think about that cliffhanger?'
  },
  { 
    id: 3, 
    title: 'Top 10 Isekai that are actually good', 
    author: 'IsekaiTrash',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IsekaiTrash',
    replies: 65, 
    views: '5.1k',
    category: 'Anime Recommendations', 
    trendScore: 92,
    tags: ['Recommendations', 'Isekai'],
    image: '',
    details: { title: 'Various', author: 'Various', status: 'N/A', genres: ['Isekai', 'Fantasy'] },
    content: 'We all know the market is oversaturated with trash Isekai, but which ones genuinely have a good plot and character development? Re:Zero and Mushoku Tensei come to mind.'
  },
  { 
    id: 4, 
    title: 'Any update on the mobile app?', 
    author: 'PhoneUser',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhoneUser',
    replies: 34, 
    views: '2.5k',
    category: 'Site Feedback & Support', 
    trendScore: 88,
    tags: ['Site', 'Mobile'],
    image: '',
    details: { title: 'ANI App', author: 'ANI Team', status: 'In Development', genres: ['Tech'] },
    content: 'I love using the site on my PC, but a dedicated iOS/Android app would be amazing. Is there any roadmap for this?'
  }
];

export default function ForumsPage() {
  const [selectedTopic, setSelectedTopic] = useState<typeof trendingTopics[0] | null>(null);

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#ff4dd2]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ffd54a]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] to-[#ffd54a] mb-2 uppercase tracking-tighter drop-shadow-lg">
              ANI Community
            </h1>
            <p className="text-[#a0a0a0] font-medium">Join the discussion with thousands of other anime fans.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Forum Categories */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10">
                <div className="col-span-7 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</div>
                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Stats</div>
                <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Latest Post</div>
              </div>

              {/* Categories List */}
              <div className="divide-y divide-white/5">
                {forumCategories.map((category, idx) => (
                  <Link key={idx} href={category.href} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 hover:bg-white/5 transition-colors group cursor-pointer block">
                    
                    {/* Category Info */}
                    <div className="col-span-1 md:col-span-7 flex items-start gap-4">
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl group-hover:border-white/20 transition-colors shadow-inner">
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#ffd54a] transition-colors mb-1">{category.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{category.description}</p>
                      </div>
                    </div>

                    {/* Stats (Mobile hidden, visible on md) */}
                    <div className="hidden md:flex col-span-2 flex-col items-center justify-center text-sm">
                      <div className="text-white font-bold">{category.topics.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Topics</div>
                      <div className="text-white font-bold mt-2">{category.posts.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Posts</div>
                    </div>

                    {/* Latest Post */}
                    <div className="col-span-1 md:col-span-3 flex flex-col justify-center md:items-end mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                      <div className="text-sm text-gray-300 truncate w-full md:text-right font-medium mb-1 group-hover:text-white transition-colors">
                        {category.latestPost.topic}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 justify-start md:justify-end w-full">
                        <Clock size={12} />
                        <span>{category.latestPost.time} by <span className="text-[#ff4dd2] font-semibold">{category.latestPost.user}</span></span>
                      </div>
                    </div>

                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Trending Topics Widget */}
            <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f47521]/10 rounded-full blur-[50px] -mr-10 -mt-10 pointer-events-none" />
              
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <TrendingUp className="text-[#f47521]" size={20} />
                Trending Topics
              </h3>
              
              <div className="space-y-4 relative z-10">
                {trendingTopics.map((topic, idx) => (
                  <div key={idx} onClick={() => setSelectedTopic(topic)} className="group cursor-pointer">
                    <h4 className="text-sm font-bold text-gray-300 group-hover:text-[#ffd54a] transition-colors leading-snug mb-1">
                      {topic.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#ff4dd2] font-medium">{topic.category}</span>
                      <span className="text-gray-500 flex items-center gap-1">
                        <MessageSquare size={12} /> {topic.replies}
                      </span>
                    </div>
                    {idx < trendingTopics.length - 1 && <div className="h-px bg-white/5 mt-4" />}
                  </div>
                ))}
              </div>
              
              <Link href="/forums/trending" className="block w-full text-center text-sm font-bold text-gray-400 hover:text-white mt-6 pt-4 border-t border-white/5 transition-colors">
                View All Trending →
              </Link>
            </div>

            {/* Forum Statistics Widget */}
            <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="text-[#ffd54a]" size={20} />
                Forum Statistics
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Members</span>
                  <span className="text-white font-bold">12,485</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Topics</span>
                  <span className="text-white font-bold">2,490</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Total Posts</span>
                  <span className="text-white font-bold">16,862</span>
                </div>
                <div className="h-px bg-white/5" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Online Now</span>
                  <span className="text-green-400 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> 142
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Thread Details Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
              onClick={() => setSelectedTopic(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#121326] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(244,117,33,0.1)] z-10 flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedTopic(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10 z-20"
              >
                <X size={20} />
              </button>

              {/* Left Column: Image & Details */}
              <div className="w-full md:w-1/3 bg-[#12121a] p-6 border-b md:border-b-0 md:border-r border-white/5">
                <div className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg mb-6 bg-white/5 relative">
                  {selectedTopic.image ? (
                    <img src={selectedTopic.image} alt={selectedTopic.details.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <ImageIcon size={48} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-white font-bold text-lg mb-4">{selectedTopic.details.title}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Author/Studio</span>
                    <span className="text-gray-300">{selectedTopic.details.author}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Status</span>
                    <span className="text-[#f47521]">{selectedTopic.details.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs mb-1">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedTopic.details.genres.map(g => (
                        <span key={g} className="bg-white/5 text-gray-300 px-2 py-0.5 rounded text-xs">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Thread Content */}
              <div className="w-full md:w-2/3 p-6 md:p-8 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {selectedTopic.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-transparent"
                    >
                      <Hash size={10} />
                      {tag}
                    </span>
                  ))}
                  <span className="bg-[#ff4dd2]/20 text-[#ff4dd2] text-xs px-2 py-0.5 rounded font-bold">
                    {selectedTopic.category}
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
                  {selectedTopic.title}
                </h2>

                <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <img src={selectedTopic.authorAvatar} alt={selectedTopic.author} className="w-10 h-10 rounded-full bg-white/10" />
                    <div>
                      <div className="text-white font-bold">{selectedTopic.author}</div>
                      <div className="text-xs text-gray-500">Thread Starter</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1"><MessageSquare size={14} className="text-[#ff4dd2]"/> {selectedTopic.replies}</div>
                    <div className="flex items-center gap-1"><Eye size={14} className="text-[#ffd54a]"/> {selectedTopic.views}</div>
                  </div>
                </div>

                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {selectedTopic.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}
