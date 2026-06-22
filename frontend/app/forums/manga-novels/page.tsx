'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Hash, Clock, Users, Eye, Search, AlertTriangle, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const threads = [
  {
    id: 1,
    title: 'One Piece Chapter 1098 Discussion (SPOILERS)',
    author: 'MangaReader',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MangaReader',
    replies: 1240,
    views: '89k',
    lastReply: '2 mins ago',
    lastReplyBy: 'JoyBoy',
    tags: ['One Piece', 'Chapter Update', 'SPOILERS'],
    isPinned: true,
    image: 'https://cdn.myanimelist.net/images/manga/2/253146.jpg',
    mangaDetails: {
      title: 'One Piece',
      author: 'Eiichiro Oda',
      status: 'Publishing',
      genres: ['Action', 'Adventure', 'Fantasy']
    },
    content: 'Chapter 1098 is finally out! The lore drop this chapter was absolutely insane. What did you guys think about the revelation regarding Kuma’s past? \n\nI honestly didn’t expect Oda to go this dark. Let’s discuss the implications for the revolutionary army and what this means for Bonney.'
  },
  {
    id: 2,
    title: 'Solo Leveling Ragnarok - Novel translation quality?',
    author: 'LightNovelFan',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LightNovelFan',
    replies: 45,
    views: '2.1k',
    lastReply: '30 mins ago',
    lastReplyBy: 'SungJinWoo',
    tags: ['Solo Leveling', 'Novel'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/3/255479.jpg',
    mangaDetails: {
      title: 'Solo Leveling Ragnarok',
      author: 'Chugong',
      status: 'Publishing',
      genres: ['Action', 'Fantasy']
    },
    content: 'Has anyone been reading the recent chapters of Solo Leveling Ragnarok? I feel like the translation quality has dropped significantly over the last 10 chapters. Some sentences barely make sense. Are there any better fan translations out there or should I wait for the official release to catch up?'
  },
  {
    id: 3,
    title: 'Recommend me some good psychological horror manga',
    author: 'DarkMind',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DarkMind',
    replies: 112,
    views: '5.6k',
    lastReply: '1 hour ago',
    lastReplyBy: 'JohanLiebert',
    tags: ['Recommendations', 'Horror'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/1/157897.jpg',
    mangaDetails: {
      title: 'Various',
      author: 'Multiple',
      status: 'N/A',
      genres: ['Psychological', 'Horror']
    },
    content: 'I recently finished reading Monster and Oyasumi Punpun and I am looking for something that will completely destroy me mentally. Any recommendations? I prefer completed series but ongoing is fine if there is a lot to read already.'
  },
  {
    id: 4,
    title: 'Mushoku Tensei Volume 26 (End) - Overall Review',
    author: 'IsekaiTrash',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=IsekaiTrash',
    replies: 320,
    views: '15k',
    lastReply: '2 hours ago',
    lastReplyBy: 'RoxyFan',
    tags: ['Mushoku Tensei', 'Review', 'SPOILERS'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/3/135939.jpg',
    mangaDetails: {
      title: 'Mushoku Tensei: Jobless Reincarnation',
      author: 'Rifujin na Magonote',
      status: 'Finished',
      genres: ['Drama', 'Fantasy', 'Ecchi']
    },
    content: 'What an incredible journey it has been. I just finished volume 26 and I am in tears. The character development of Rudeus from a scumbag to a respectable family man and hero is arguably the best in the entire isekai genre. \n\nLet’s discuss the final battle and the epilogue. Did it satisfy you? For me it was a 10/10 conclusion.'
  },
  {
    id: 5,
    title: 'Vagabond hiatus... will it ever return?',
    author: 'SamuraiX',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SamuraiX',
    replies: 567,
    views: '22k',
    lastReply: '5 hours ago',
    lastReplyBy: 'Musashi',
    tags: ['Vagabond', 'Discussion'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/1/259070.jpg',
    mangaDetails: {
      title: 'Vagabond',
      author: 'Takehiko Inoue',
      status: 'On Hiatus',
      genres: ['Action', 'Historical', 'Samurai']
    },
    content: 'It has been almost a decade since the last chapter. Do you guys think Inoue will ever finish Vagabond, or is the exhibition ending all we are going to get? I know he has been focused on REAL and the Slam Dunk movie, but it hurts to see such a masterpiece left unfinished.'
  },
  {
    id: 6,
    title: 'Kingdom Chapter 790 Spoilers & Discussion',
    author: 'GreatGeneral',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GreatGeneral',
    replies: 840,
    views: '45k',
    lastReply: '10 mins ago',
    lastReplyBy: 'OukiFan',
    tags: ['Kingdom', 'Chapter Update', 'SPOILERS'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/2/171872.jpg',
    mangaDetails: { title: 'Kingdom', author: 'Yasuhisa Hara', status: 'Publishing', genres: ['Action', 'Historical'] },
    content: 'The battle of Hango continues! Riboku\'s new formation is causing massive trouble for the Qin army. What do you think Shin\'s next move will be?'
  },
  {
    id: 7,
    title: 'Omniscient Reader\'s Viewpoint - Light Novel ending thoughts',
    author: 'Constellation',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Constellation',
    replies: 1256,
    views: '110k',
    lastReply: '20 mins ago',
    lastReplyBy: 'KimDokja',
    tags: ['ORV', 'Novel', 'SPOILERS'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/3/237207.jpg',
    mangaDetails: { title: 'Omniscient Reader\'s Viewpoint', author: 'Sing Shong', status: 'Finished', genres: ['Action', 'Fantasy'] },
    content: 'That ending... I\'m still processing it. The epilogue broke me completely. How did everyone interpret the final train scene? 51% vs 49% still haunts me.'
  },
  {
    id: 8,
    title: 'Berserk - Continuing without Miura',
    author: 'Struggler',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Struggler',
    replies: 3450,
    views: '250k',
    lastReply: '1 hour ago',
    lastReplyBy: 'Guts123',
    tags: ['Berserk', 'Discussion'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/1/157897.jpg',
    mangaDetails: { title: 'Berserk', author: 'Kentarou Miura, Studio Gaga', status: 'Publishing', genres: ['Action', 'Dark Fantasy'] },
    content: 'With Kouji Mori overseeing the continuation, the recent chapters have been emotionally heavy. Do you feel they are capturing Miura\'s original vision? Let\'s discuss the art shift and pacing.'
  },
  {
    id: 9,
    title: 'Best romance manga with actual progression?',
    author: 'RomComLover',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RomComLover',
    replies: 420,
    views: '32k',
    lastReply: '3 hours ago',
    lastReplyBy: 'ShojoFan',
    tags: ['Recommendations', 'Romance'],
    isPinned: false,
    image: '',
    mangaDetails: { title: 'Various', author: 'Multiple', status: 'N/A', genres: ['Romance'] },
    content: 'I\'m tired of 200 chapters of misunderstandings where they only hold hands in the finale. Can you recommend some good romance manga where the couple actually gets together early and we see their relationship develop?'
  },
  {
    id: 10,
    title: 'The Beginning After The End - Arthur\'s return to Dicathen',
    author: 'Grey',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grey',
    replies: 890,
    views: '67k',
    lastReply: '4 hours ago',
    lastReplyBy: 'Sylvie',
    tags: ['TBATE', 'Novel', 'SPOILERS'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/3/255479.jpg',
    mangaDetails: { title: 'The Beginning After The End', author: 'TurtleMe', status: 'Publishing', genres: ['Action', 'Fantasy'] },
    content: 'Arthur\'s return to Dicathen was one of the most hype moments in the novel so far. How do you think the Asuras will react to his new Aether core?'
  },
  {
    id: 11,
    title: 'Vinland Saga - The shift from Action to Pacifism',
    author: 'TrueWarrior',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TrueWarrior',
    replies: 560,
    views: '41k',
    lastReply: '6 hours ago',
    lastReplyBy: 'Thorfinn',
    tags: ['Vinland Saga', 'Discussion'],
    isPinned: false,
    image: 'https://cdn.myanimelist.net/images/manga/2/188925.jpg',
    mangaDetails: { title: 'Vinland Saga', author: 'Makoto Yukimura', status: 'Publishing', genres: ['Historical', 'Drama'] },
    content: 'A lot of people complain about the Farmland arc and beyond lacking action, but I think Thorfinn\'s journey towards pacifism is what makes Vinland Saga a masterpiece. What are your thoughts on this thematic shift?'
  },
  {
    id: 12,
    title: 'Is it worth buying physical manga volumes?',
    author: 'Collector',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Collector',
    replies: 234,
    views: '18k',
    lastReply: '8 hours ago',
    lastReplyBy: 'BrokeOtaku',
    tags: ['General', 'Collection'],
    isPinned: false,
    image: '',
    mangaDetails: { title: 'N/A', author: 'N/A', status: 'N/A', genres: [] },
    content: 'With everything available digitally (often for much cheaper or via subscription), what keeps you guys buying physical volumes? I love the aesthetic on my shelf, but space and money are becoming an issue.'
  }
];

export default function MangaNovelsPage() {
  const [selectedThread, setSelectedThread] = useState<typeof threads[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(threads.length / itemsPerPage);
  
  // Get current threads to display based on page
  const currentThreads = threads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#f47521]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        
        {/* Header Section */}
        <div className="mb-12">
          <Link href="/forums" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#f47521] transition-colors mb-6 font-medium text-sm">
            <ArrowLeft size={16} /> Back to ANI Community
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#f47521]/10 border border-[#f47521]/20 rounded-2xl">
                <Hash className="text-[#f47521]" size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-lg">
                  Manga & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f47521] to-[#ff4dd2]">Light Novels</span>
                </h1>
                <p className="text-[#a0a0a0] font-medium">Discuss the source materials. Please use spoiler tags!</p>
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
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#f47521]" />
                )}

                {/* Topic Info */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    {thread.isPinned && (
                      <span className="bg-[#f47521]/20 text-[#f47521] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Pinned
                      </span>
                    )}
                    {thread.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                          tag === 'SPOILERS' 
                            ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30' 
                            : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {tag === 'SPOILERS' && <AlertTriangle size={10} />}
                        {tag !== 'SPOILERS' && <Hash size={10} />}
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#f47521] transition-colors mb-2 leading-snug">
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
                    <Hash size={14} className="text-[#ff4dd2]" /> {thread.replies}
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
                    <span>by <span className="text-[#f47521] font-semibold">{thread.lastReplyBy}</span></span>
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
                      ? 'bg-[#f47521] border-[#f47521] text-white font-bold' 
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
              className="relative bg-[#121326] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(244,117,33,0.1)] z-10 flex flex-col md:flex-row"
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
                    <img src={selectedThread.image} alt={selectedThread.mangaDetails.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <ImageIcon size={48} />
                    </div>
                  )}
                </div>
                
                <h3 className="text-white font-bold text-lg mb-4">{selectedThread.mangaDetails.title}</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Author</span>
                    <span className="text-gray-300">{selectedThread.mangaDetails.author}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Status</span>
                    <span className="text-[#ffd54a]">{selectedThread.mangaDetails.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs mb-1">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedThread.mangaDetails.genres.map(g => (
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
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                        tag === 'SPOILERS' 
                          ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30' 
                          : 'bg-white/5 text-gray-400 border border-transparent'
                      }`}
                    >
                      {tag === 'SPOILERS' && <AlertTriangle size={10} />}
                      {tag !== 'SPOILERS' && <Hash size={10} />}
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
                    <div className="flex items-center gap-1"><Hash size={14} className="text-[#ff4dd2]"/> {selectedThread.replies}</div>
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
