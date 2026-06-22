'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Clock, Users, Eye, TrendingUp, Search, Hash, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const threads = [
  {
    id: 1,
    title: 'Best anime of Spring 2026? Let\'s debate!',
    author: 'NarutoFan99',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NarutoFan99',
    replies: 342,
    views: '12.5k',
    lastReply: '10 mins ago',
    lastReplyBy: 'SasukeUchiha',
    tags: ['Discussion', 'Seasonal'],
    isPinned: true,
    image: 'https://cdn.myanimelist.net/images/anime/1126/141019.jpg',
    details: { title: 'Spring 2026 Anime', author: 'Various', status: 'Airing', genres: ['Multiple'] },
    content: 'Spring 2026 is turning out to be one of the most stacked seasons we’ve had in years! We have the return of Re:Zero, the new Ufotable project, and some amazing hidden gems. What is your Anime of the Season so far and why?'
  },
  {
    id: 2,
    title: 'Unpopular Opinion: Demon Slayer is carried by animation',
    author: 'AnimeCritic101',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnimeCritic101',
    replies: 890,
    views: '45k',
    lastReply: '1 hour ago',
    lastReplyBy: 'ZenitsuLover',
    tags: ['Hot Take', 'Demon Slayer'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
    details: { title: 'Demon Slayer', author: 'Koyoharu Gotouge', status: 'Finished', genres: ['Action', 'Historical', 'Demons'] },
    content: 'I know I’ll probably get a lot of hate for this, but if Ufotable didn’t animate Demon Slayer, it would just be an average, easily forgettable shounen. The story is extremely generic and the characters are one-dimensional. Does anyone else agree?'
  },
  {
    id: 3,
    title: 'What got you into Anime?',
    author: 'OldWeeb',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OldWeeb',
    replies: 156,
    views: '3.2k',
    lastReply: '3 hours ago',
    lastReplyBy: 'NewOtaku',
    tags: ['Nostalgia', 'Community'],
    isPinned: false,
    image: '',
    details: { title: 'N/A', author: 'N/A', status: 'N/A', genres: [] },
    content: 'For me, it was staying up late to watch Toonami and catching dragon ball Z. I remember trying to go super saiyan in my room. What was the very first anime that made you fall in love with the medium?'
  },
  {
    id: 4,
    title: 'Is One Piece finally ending next year?',
    author: 'PirateKing',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PirateKing',
    replies: 502,
    views: '28k',
    lastReply: '5 hours ago',
    lastReplyBy: 'ZoroLost',
    tags: ['One Piece', 'Theory'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
    details: { title: 'One Piece', author: 'Eiichiro Oda', status: 'Airing', genres: ['Action', 'Adventure', 'Fantasy'] },
    content: 'With the Final Saga well underway and Oda\'s recent comments, it feels like the end is truly near. What are your theories on what the One Piece actually is, and do you think 2027 is a realistic end date?'
  },
  {
    id: 5,
    title: 'Favorite OST from a slice of life anime?',
    author: 'MusicLover',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MusicLover',
    replies: 89,
    views: '1.5k',
    lastReply: '1 day ago',
    lastReplyBy: 'PianoMan',
    tags: ['Music', 'Slice of Life'],
    isPinned: false,
    image: '',
    details: { title: 'Various', author: 'Various', status: 'N/A', genres: ['Slice of Life', 'Music'] },
    content: 'Slice of Life anime often have the most relaxing and beautiful soundtracks. Personally, I love the OST from "Your Lie in April" and "Violet Evergarden" (though that\'s more drama). What are your absolute favorite OSTs to listen to while studying or relaxing?'
  },
  {
    id: 6,
    title: 'Is it too late to start Gintama?',
    author: 'ComedyFan',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ComedyFan',
    replies: 420,
    views: '18k',
    lastReply: '2 days ago',
    lastReplyBy: 'SilverSoul',
    tags: ['Gintama', 'Question'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/anime/10/73274.jpg',
    details: { title: 'Gintama', author: 'Hideaki Sorachi', status: 'Finished', genres: ['Action', 'Comedy', 'Sci-Fi'] },
    content: 'I keep hearing that Gintama is the peak of comedy in anime, but there are so many episodes and the first few are apparently slow. Is it worth investing the time now?'
  },
  {
    id: 7,
    title: 'Your Name vs. A Silent Voice - The Ultimate Debate',
    author: 'MovieBuff',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MovieBuff',
    replies: 1205,
    views: '95k',
    lastReply: '5 mins ago',
    lastReplyBy: 'ShouyaIshida',
    tags: ['Movies', 'Debate'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/anime/5/87048.jpg',
    details: { title: 'Anime Movies', author: 'Makoto Shinkai / Naoko Yamada', status: 'Finished', genres: ['Drama', 'Romance'] },
    content: 'Both are modern masterpieces that came out around the same time. Which one do you prefer and why? Let\'s keep it civil!'
  },
  {
    id: 8,
    title: 'Anime that desperately needs a remake?',
    author: 'RetroWatcher',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RetroWatcher',
    replies: 840,
    views: '35k',
    lastReply: '15 mins ago',
    lastReplyBy: 'TokyoGhoulFan',
    tags: ['Discussion', 'Remakes'],
    isPinned: false,
    image: '',
    details: { title: 'Various', author: 'Various', status: 'N/A', genres: [] },
    content: 'For me, it has to be Tokyo Ghoul. The manga is a masterpiece but the anime adaptation completely butchered the story after season 1. What anime do you think deserves the "Fullmetal Alchemist: Brotherhood" treatment?'
  },
  {
    id: 9,
    title: 'How do you track your anime?',
    author: 'ListMaker',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ListMaker',
    replies: 230,
    views: '8k',
    lastReply: '45 mins ago',
    lastReplyBy: 'MALUser',
    tags: ['General', 'Community'],
    isPinned: false,
    image: '',
    details: { title: 'N/A', author: 'N/A', status: 'N/A', genres: [] },
    content: 'Do you use MAL, AniList, Kitsu, or just an Excel spreadsheet? I\'m looking to switch platforms and want to know what everyone considers the best tracker right now.'
  },
  {
    id: 10,
    title: 'Hunter x Hunter - Will it ever return?',
    author: 'HiatusXHiatus',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HiatusXHiatus',
    replies: 950,
    views: '60k',
    lastReply: '2 hours ago',
    lastReplyBy: 'GonFreecs',
    tags: ['HxH', 'Discussion'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/anime/11/33657.jpg',
    details: { title: 'Hunter x Hunter', author: 'Yoshihiro Togashi', status: 'Hiatus', genres: ['Action', 'Adventure', 'Fantasy'] },
    content: 'Togashi has been posting some updates on Twitter recently. Do you think we will finally get the Dark Continent arc animated in our lifetime, or should I just give up hope?'
  },
  {
    id: 11,
    title: 'Most overpowered protagonist in anime?',
    author: 'PowerScaler',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PowerScaler',
    replies: 1560,
    views: '88k',
    lastReply: '3 hours ago',
    lastReplyBy: 'Saitama',
    tags: ['Debate', 'Characters'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/anime/12/76049.jpg',
    details: { title: 'Various', author: 'Various', status: 'N/A', genres: ['Action'] },
    content: 'Is it Saitama? Goku? Giorno with GER? Anos Voldigoad? Let\'s settle this once and for all. State your character and why they stomp everyone else.'
  },
  {
    id: 12,
    title: 'Who is the best anime villain of all time?',
    author: 'AntagonistFan',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AntagonistFan',
    replies: 2100,
    views: '150k',
    lastReply: '6 hours ago',
    lastReplyBy: 'AizenSosuke',
    tags: ['Discussion', 'Characters'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
    details: { title: 'Various', author: 'Various', status: 'N/A', genres: [] },
    content: 'A hero is only as good as their villain. Who is the most compelling, well-written antagonist in anime history? For me, Johan Liebert and Meruem are at the absolute top.'
  }
];

export default function GeneralDiscussionPage() {
  const [selectedThread, setSelectedThread] = useState<typeof threads[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(threads.length / itemsPerPage);
  
  const currentThreads = threads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#ffd54a]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-12">
          <Link href="/forums" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ffd54a] transition-colors mb-6 font-medium text-sm">
            <ArrowLeft size={16} /> Back to ANI Community
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#ffd54a]/10 border border-[#ffd54a]/20 rounded-2xl">
                <MessageSquare className="text-[#ffd54a]" size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-lg">
                  General <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd54a] to-[#ff4dd2]">Discussion</span>
                </h1>
                <p className="text-[#a0a0a0] font-medium">Talk about anything related to anime, manga, and Japanese culture.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Threads List */}
        <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10">
            <div className="col-span-7 text-xs font-bold text-gray-400 uppercase tracking-wider">Topic</div>
            <div className="col-span-2 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Stats</div>
            <div className="col-span-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Latest Activity</div>
          </div>

          <div className="divide-y divide-white/5">
            {currentThreads.map((thread, idx) => (
              <motion.div 
                key={thread.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedThread(thread)}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 hover:bg-white/5 transition-colors group cursor-pointer relative"
              >
                {thread.isPinned && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ff4dd2]" />
                )}

                {/* Topic Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    {thread.isPinned && (
                      <span className="bg-[#ff4dd2]/20 text-[#ff4dd2] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Pinned
                      </span>
                    )}
                    {thread.tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 px-2 py-0.5 rounded">
                        <Hash size={10} /> {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#ffd54a] transition-colors mb-2 leading-snug">
                    {thread.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <img src={thread.authorAvatar} alt={thread.author} className="w-5 h-5 rounded-full bg-white/10" />
                    Started by <span className="font-semibold text-gray-300 hover:text-white">{thread.author}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex col-span-2 flex-col items-center justify-center text-sm">
                  <div className="flex items-center gap-2 text-white font-medium mb-1">
                    <MessageSquare size={14} className="text-[#ff4dd2]" /> {thread.replies}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Eye size={14} /> {thread.views} views
                  </div>
                </div>

                {/* Latest Activity */}
                <div className="col-span-1 md:col-span-3 flex flex-col justify-center md:items-end mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                  <div className="text-sm text-gray-300 font-medium mb-1 group-hover:text-white transition-colors">
                    {thread.lastReply}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 justify-start md:justify-end w-full">
                    <span>by <span className="text-[#ffd54a] font-semibold">{thread.lastReplyBy}</span></span>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
          
          {/* Pagination */}
          <div className="p-6 bg-white/5 flex items-center justify-between border-t border-white/10">
            <span className="text-sm text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, threads.length)} of {threads.length} topics
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded border flex items-center justify-center transition-colors ${
                    currentPage === i + 1 
                      ? 'bg-[#ffd54a] border-[#ffd54a] text-white font-bold' 
                      : 'border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thread Details Modal */}
      <AnimatePresence>
        {selectedThread && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" 
              onClick={() => setSelectedThread(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#121326] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(255, 213, 74,0.1)] z-10 flex flex-col md:flex-row"
            >
              <button 
                onClick={() => setSelectedThread(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full hover:bg-white/10 z-20"
              >
                <X size={20} />
              </button>

              {/* Left Column: Image & Details */}
              <div className="w-full md:w-1/3 bg-[#12121a] p-6 border-b md:border-b-0 md:border-r border-white/5">
                <div className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg mb-6 bg-white/5 relative">
                  {selectedThread.image ? (
                    <img src={selectedThread.image} alt={selectedThread.details.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <ImageIcon size={48} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-white font-bold text-lg mb-4">{selectedThread.details.title}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Author/Studio</span>
                    <span className="text-gray-300">{selectedThread.details.author}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Status</span>
                    <span className="text-[#ffd54a]">{selectedThread.details.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs mb-1">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedThread.details.genres.map(g => (
                        <span key={g} className="bg-white/5 text-gray-300 px-2 py-0.5 rounded text-xs">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Thread Content */}
              <div className="w-full md:w-2/3 p-6 md:p-8 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {selectedThread.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-transparent"
                    >
                      <Hash size={10} />
                      {tag}
                    </span>
                  ))}
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
                  {selectedThread.title}
                </h2>

                <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-3">
                    <img src={selectedThread.authorAvatar} alt={selectedThread.author} className="w-10 h-10 rounded-full bg-white/10" />
                    <div>
                      <div className="text-white font-bold">{selectedThread.author}</div>
                      <div className="text-xs text-gray-500">Thread Starter</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1"><MessageSquare size={14} className="text-[#ff4dd2]"/> {selectedThread.replies}</div>
                    <div className="flex items-center gap-1"><Eye size={14} className="text-[#ffd54a]"/> {selectedThread.views}</div>
                  </div>
                </div>

                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                  {selectedThread.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
