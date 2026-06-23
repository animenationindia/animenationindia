'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Mail, MessageCircle, FileText, ExternalLink } from 'lucide-react';

const faqCategories = [
  { id: 'general', name: 'General Information' },
  { id: 'account', name: 'Account & Settings' },
  { id: 'streaming', name: 'Streaming & Playback' },
];

const faqs = [
  // General Information
  {
    category: 'general',
    question: 'What is Anime Nation India?',
    answer: 'Anime Nation India is a premium anime database, news, and discovery platform. We provide comprehensive details on anime, characters, voice actors, release schedules, and official trailers.'
  },
  {
    category: 'general',
    question: 'How do I search for a specific anime?',
    answer: 'You can use the search bar located at the top of the page (or click the search icon). Simply type the name of the anime, character, or voice actor you are looking for, and our advanced search will find the best matches.'
  },
  {
    category: 'general',
    question: 'Where does the anime data come from?',
    answer: 'Our database is powered by robust public APIs like AniList GraphQL and Jikan REST (MyAnimeList), ensuring you get the most accurate and up-to-date anime statistics and schedules.'
  },
  
  // Account & Settings
  {
    category: 'account',
    question: 'How do I create an account?',
    answer: 'Account registration and watchlist features are currently under development. Once released, you will be able to click on the "Login / Register" icon in the top right corner to sign up.'
  },
  {
    category: 'account',
    question: 'How can I change the website language?',
    answer: 'You can use the Language Translator dropdown located in the navigation menu to instantly translate the entire website into your preferred language.'
  },
  
  // Streaming & Playback
  {
    category: 'streaming',
    question: 'Can I watch full anime episodes here?',
    answer: 'No. Anime Nation India is strictly an informational database and discovery platform. To comply with strict copyright laws, we do not host or stream full anime episodes. However, we provide official YouTube trailers for almost every anime.'
  },
  {
    category: 'streaming',
    question: 'Where can I watch the anime I discover here?',
    answer: 'We highly encourage supporting the anime industry! You can watch the anime you discover here on official legal streaming platforms such as Crunchyroll, Netflix, Hulu, HiDive, and Amazon Prime Video.'
  },
  {
    category: 'streaming',
    question: 'Why are some trailers missing or not playing?',
    answer: 'Trailers are pulled directly from official YouTube channels via our API providers. If a studio has not released an official trailer on YouTube, or if the video is region-locked in your country, it may not appear or play on our platform.'
  },
];

export default function HelpCenterPage() {
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = searchQuery ? true : faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#050716] pt-32 pb-20 selection:bg-[#ff4dd2] selection:text-white">
      {/* 3D Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#ff4dd2]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-[#ff4dd2]/10 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 max-w-[1000px] relative z-10">
        
        {/* Header & Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bebas text-white tracking-widest uppercase mb-4 drop-shadow-lg">
            Help Center
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-medium max-w-2xl mx-auto mb-8">
            Need assistance? Search our knowledge base or browse frequently asked questions below.
          </p>

          <div className="relative max-w-xl mx-auto group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#ff4dd2] transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121214]/80 border border-white/10 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-[#ff4dd2] focus:shadow-[0_0_20px_rgba(255, 77, 210,0.2)] transition-all backdrop-blur-md"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <a href="/contact" className="flex flex-col items-center justify-center p-6 bg-[#121214]/50 border border-white/5 rounded-2xl hover:border-[#ff4dd2]/50 hover:bg-white/5 transition-all group">
            <Mail className="text-[#ff4dd2] mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-white font-bold mb-1">Email Support</h3>
            <p className="text-xs text-gray-400 text-center">Get help via email within 24 hours.</p>
          </a>
          <a href="https://shouvikdas-portfolio.vercel.app/portfolio" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-6 bg-[#121214]/50 border border-white/5 rounded-2xl hover:border-[#ff4dd2]/50 hover:bg-white/5 transition-all group">
            <ExternalLink className="text-[#ff4dd2] mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-white font-bold mb-1">Connect with Developer</h3>
            <p className="text-xs text-gray-400 text-center">Visit my portfolio to learn more.</p>
          </a>
          <a href="/terms" className="flex flex-col items-center justify-center p-6 bg-[#121214]/50 border border-white/5 rounded-2xl hover:border-[#f47521]/50 hover:bg-white/5 transition-all group">
            <FileText className="text-[#f47521] mb-3 group-hover:scale-110 transition-transform" size={32} />
            <h3 className="text-white font-bold mb-1">Terms of Service</h3>
            <p className="text-xs text-gray-400 text-center">Read our policies and guidelines.</p>
          </a>
        </div>

        {/* FAQ Section */}
        <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Categories */}
          {!searchQuery && (
            <div className="flex overflow-x-auto custom-scrollbar border-b border-white/10 p-2">
              {faqCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-3 whitespace-nowrap rounded-xl font-bold text-sm transition-all ${
                    activeCategory === cat.id 
                      ? 'bg-[#ff4dd2] text-white shadow-[0_0_15px_rgba(255, 77, 210,0.4)]' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Accordion */}
          <div className="p-4 md:p-6 min-h-[400px]">
            {filteredFaqs.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <div 
                      key={index}
                      className={`border border-white/5 rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white/5 border-white/20' : 'bg-[#121326] hover:border-white/10'}`}
                    >
                      <button 
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-4 md:p-5 text-left text-white font-semibold cursor-pointer"
                      >
                        <span className="pr-4">{faq.question}</span>
                        <ChevronDown 
                          size={20} 
                          className={`text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#ff4dd2]' : ''}`} 
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 md:p-5 pt-0 text-gray-400 text-sm md:text-base leading-relaxed border-t border-white/5 mt-2">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <Search size={48} className="text-gray-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                <p className="text-gray-400 text-sm">We couldn't find any articles matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
