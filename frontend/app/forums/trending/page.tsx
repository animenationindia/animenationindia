'use client';

import Link from 'next/link';
import { ArrowLeft, TrendingUp, MessageSquare, Flame, X, Image as ImageIcon, Hash, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

// Using a slightly larger array of trending topics to simulate daily updates
const allTrendingTopics = [
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
  },
  { 
    id: 5, 
    title: 'Oshi no Ko Manga Ending Discussion', 
    author: 'IdolFan',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IdolFan',
    replies: 210, 
    views: '45k',
    category: 'Manga & Light Novels', 
    trendScore: 85,
    tags: ['Oshi no Ko', 'SPOILERS', 'Ending'],
    image: 'https://cdn.myanimelist.net/images/manga/2/236179.jpg',
    details: { title: 'Oshi no Ko', author: 'Aka Akasaka', status: 'Finished', genres: ['Drama', 'Supernatural'] },
    content: 'That ending was wild. I did not expect Aqua to go that far. Do you guys think it was a satisfying conclusion to the revenge plot?'
  },
  { 
    id: 6, 
    title: 'Is it worth reading the Solo Leveling Light Novel?', 
    author: 'ShadowMonarch',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ShadowMonarch',
    replies: 45, 
    views: '4.2k',
    category: 'Manga & Light Novels', 
    trendScore: 81,
    tags: ['Solo Leveling', 'Novel'],
    image: 'https://cdn.myanimelist.net/images/manga/3/255479.jpg',
    details: { title: 'Solo Leveling', author: 'Chugong', status: 'Finished', genres: ['Action', 'Fantasy'] },
    content: 'I caught up to the Manhwa and absolutely love it. Should I start reading the Light Novel from the beginning, or just pick up where the Manhwa left off?'
  },
  { 
    id: 7, 
    title: 'Anime movies that made you cry', 
    author: 'TearJerker',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TearJerker',
    replies: 120, 
    views: '15k',
    category: 'General Discussion', 
    trendScore: 78,
    tags: ['Movies', 'Emotional'],
    image: 'https://cdn.myanimelist.net/images/anime/1122/96435.jpg',
    details: { title: 'I Want to Eat Your Pancreas', author: 'Yoru Sumino', status: 'Finished', genres: ['Drama', 'Romance'] },
    content: 'Graves of the Fireflies, I Want to Eat Your Pancreas, A Silent Voice... which movie completely destroyed you emotionally?'
  },
  { 
    id: 8, 
    title: 'Next season anime lineup looks stacked', 
    author: 'SeasonalWeeb',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SeasonalWeeb',
    replies: 76, 
    views: '8.9k',
    category: 'General Discussion', 
    trendScore: 75,
    tags: ['Upcoming', 'Seasonal'],
    image: '',
    details: { title: 'Upcoming Season', author: 'Various', status: 'Upcoming', genres: [] },
    content: 'Just looking at the chart for next season and wow... we are getting so many good sequels and promising new adaptations. What are you most hyped for?'
  }
];

export default function TrendingPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<typeof allTrendingTopics[0] | null>(null);

  useEffect(() => {
    // Generate today's date to give the impression of daily updates
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#f47521]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ffd54a]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1000px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-12 text-center">
          <Link href="/forums" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#f47521] transition-colors mb-6 font-medium text-sm">
            <ArrowLeft size={16} /> Back to ANI Community
          </Link>
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 bg-[#f47521]/10 border border-[#f47521]/20 rounded-full mb-4">
              <Flame className="text-[#f47521]" size={40} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-lg">
              Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f47521] to-[#ff4dd2]">Topics</span>
            </h1>
            <p className="text-[#a0a0a0] font-medium max-w-lg mx-auto">
              The hottest discussions across the ANI community right now. Updated dynamically based on user engagement.
            </p>
            {currentDate && (
              <div className="mt-4 inline-block bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm font-bold text-[#ffd54a]">
                Today: {currentDate}
              </div>
            )}
          </div>
        </div>

        {/* Trending List */}
        <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-white/5">
            {allTrendingTopics.map((topic, idx) => (
              <motion.div 
                key={topic.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedTopic(topic)}
                className="p-6 hover:bg-white/5 transition-colors group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className={`text-2xl font-black ${idx < 3 ? 'text-transparent bg-clip-text bg-gradient-to-br from-[#f47521] to-[#ff4dd2]' : 'text-gray-600'}`}>
                    #{idx + 1}
                  </div>
                  
                  {/* Info */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#f47521] transition-colors mb-1">
                      {topic.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="bg-white/5 px-2 py-0.5 rounded text-xs text-[#ff4dd2] font-semibold">
                        {topic.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={14} /> {topic.replies} Replies
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Trend Score */}
                <div className="hidden md:flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[#f47521] font-bold">
                    <TrendingUp size={16} /> {topic.trendScore}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-1">
                    Trend Score
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Thread Details Modal */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
