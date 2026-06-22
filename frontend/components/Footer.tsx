'use client';

import Link from 'next/link';
import { Orbitron } from 'next/font/google';
import { Globe, ChevronDown, Send, Code, Mail, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import LanguageSelector from './LanguageSelector';

const orbitron = Orbitron({ subsets: ['latin'], weight: ['800', '900'] });

// Custom SVGs for Social Icons
const FacebookIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const InstagramIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const DiscordIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
  </svg>
);

const footerLinks = [
  {
    title: "Navigation",
    links: [
      { name: "Home", path: "/home" },
      { name: "New Releases", path: "/new" },
      { name: "Manga", path: "/manga" },
      { name: "Popular", path: "/popular" },
      { name: "Simulcast", path: "/simulcast" },
      { name: "Genres", path: "/genres" },
      { name: "Release Schedule", path: "/schedule" },
      { name: "Trailers", path: "/trailers" },
      { name: "News", path: "/news" },
      { name: "Search", path: "/search" },
      { name: "Watchlist", path: "/watchlist" },
      { name: "Login / Sign up", path: "/auth" },
      { name: "Contact", path: "/contact" },
    ]
  },
  {
    title: "Community",
    links: [
      { name: "ANI Community", path: "/forums" },
      { name: "Announcements", path: "/news/announcements" },
      { name: "Discussion", path: "/forums/general" },
      { name: "Recommendations", path: "/forums/recommendations" },
      { name: "Manga Discussion", path: "/forums/manga-novels" },
      { name: "Light Novels Discussion", path: "/forums/manga-novels" },
      { name: "Reviews", path: "/reviews" },
      { name: "Guidelines", path: "/guidelines" },
      { name: "Content Feedback", path: "/feedback" },
    ]
  },
  {
    title: "Account",
    links: [
      { name: "My Watchlist", path: "/watchlist" },
      { name: "Settings", path: "/settings" },
      { name: "Help Center", path: "/help" },
    ]
  },
  {
    title: "Policies",
    links: [
      { name: "Terms of Service", path: "/terms" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Cookie Consent", path: "/cookies" },
      { name: "AdChoices", path: "/adchoices" },
      { name: "Legal Disclaimer", path: "/disclaimer" },
      { name: "FAQ", path: "/faq" },
    ]
  }
];

export default function Footer() {
  return (
    <footer className="w-full relative z-10 mt-auto bg-[#030305] border-t border-white/5 overflow-hidden">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] bg-[#ff4dd2]/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ rotate: -360, scale: [1, 1.5, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[200px] -right-[200px] w-[600px] h-[600px] bg-[#ffd54a]/10 rounded-full blur-[150px]"
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1400px] relative z-10 pt-20 pb-12">
        
        {/* Top Section: Logo & Newsletter */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12 mb-20">
          
          {/* Logo & Intro */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center lg:items-start gap-4 max-w-md text-center lg:text-left"
          >
            <Link href="/" className="flex items-center gap-4 group relative perspective-1000">
              <motion.div 
                whileHover={{ rotateY: 15, rotateX: -10, scale: 1.05 }}
                className="relative w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-black border border-white/10 shadow-[0_0_20px_rgba(255, 77, 210,0.3)] group-hover:shadow-[0_0_30px_rgba(255, 213, 74,0.5)] flex items-center justify-center transform-style-3d transition-all duration-500 shrink-0"
              >
                <img src="/ani-logo.png" alt="Anime Nation India Logo" className="absolute inset-0 w-full h-full object-cover p-1 drop-shadow-2xl translate-z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </motion.div>
              <div className="flex flex-col items-start text-left">
                <span className="text-2xl md:text-3xl text-white font-bold tracking-wide transition-all duration-500 leading-tight">
                  Anime Nation India
                </span>
                <span className="text-[#ffd54a] text-[10px] md:text-xs font-black tracking-widest uppercase mt-1">
                  LIVE CALENDAR • NEWS
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mt-4">
              Your ultimate destination for anime tracking, release schedules, and community discussions. Built for Indian anime fans, by Indian anime fans.
            </p>
            
            {/* Social Icons from 1st Screenshot */}
            <div className="flex gap-4 mt-6">
              <a 
                href="https://discord.gg/pShT9Auspx" 
                target="_blank" 
                rel="noreferrer" 
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10 hover:text-white flex items-center justify-center text-gray-400 transition-all duration-300 hover:scale-110"
                aria-label="Discord"
              >
                <DiscordIcon size={20} />
              </a>
              <a 
                href="https://www.instagram.com/shouvik_das_official" 
                target="_blank" 
                rel="noreferrer" 
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10 hover:text-white flex items-center justify-center text-gray-400 transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <InstagramIcon size={20} />
              </a>
              <a 
                href="https://x.com/shouvikdas155" 
                target="_blank" 
                rel="noreferrer" 
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10 hover:text-white flex items-center justify-center text-gray-400 transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <TwitterIcon size={18} />
              </a>
              <a 
                href="https://www.youtube.com/@shouvikdasvlogss" 
                target="_blank" 
                rel="noreferrer" 
                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4dd2]/50 hover:bg-[#ff4dd2]/10 hover:text-white flex items-center justify-center text-gray-400 transition-all duration-300 hover:scale-110"
                aria-label="YouTube"
              >
                <YoutubeIcon size={20} />
              </a>
            </div>
          </motion.div>

          {/* Right Section: Developer & Newsletter */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-6 w-full max-w-lg"
          >
            {/* Developer Details */}
            <div className="bg-gradient-to-br from-[#12121a]/80 to-[#0a0a0f]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:border-white/10 transition-all duration-500 mb-2 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <Code size={18} className="text-[#ff4dd2]" /> Developer Connect
              </h3>
              <p className="text-gray-400 text-sm mb-5">Crafted with passion by <strong className="text-white">Shouvik Das</strong>. Follow my coding journey.</p>
              
              <div className="flex flex-wrap gap-3 relative z-10">
                <a href="https://www.facebook.com/iamshouvikdas" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-[#1877F2]/20 text-gray-400 hover:text-[#1877F2] rounded-xl transition-all duration-300 border border-transparent hover:border-[#1877F2]/30 hover:scale-110 hover:-translate-y-1">
                  <FacebookIcon size={20} />
                </a>
                <a href="https://www.instagram.com/shouvik_das_official" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-[#E1306C]/20 text-gray-400 hover:text-[#E1306C] rounded-xl transition-all duration-300 border border-transparent hover:border-[#E1306C]/30 hover:scale-110 hover:-translate-y-1">
                  <InstagramIcon size={20} />
                </a>
                <a href="https://x.com/shouvikdas155" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 hover:bg-white/20 text-gray-400 hover:text-white rounded-xl transition-all duration-300 border border-transparent hover:border-white/30 hover:scale-110 hover:-translate-y-1">
                  <TwitterIcon size={20} />
                </a>
                <a href="https://shouvikdas-portfolio.vercel.app/portfolio" target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-white/5 hover:bg-[#ffd54a]/20 text-gray-400 hover:text-[#ffd54a] rounded-xl transition-all duration-300 border border-transparent hover:border-[#ffd54a]/30 hover:scale-105 hover:-translate-y-1 flex items-center gap-2 shadow-lg">
                  <Globe size={20} />
                  <span className="text-sm font-bold uppercase tracking-wider">Portfolio</span>
                </a>
                <a href="mailto:shouvikdaswork@gmail.com" className="p-3 bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-500 rounded-xl transition-all duration-300 border border-transparent hover:border-green-500/30 hover:scale-110 hover:-translate-y-1">
                  <Mail size={20} />
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="w-full bg-gradient-to-br from-[#12121a]/80 to-[#0a0a0f]/80 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-500">
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <Send size={18} className="text-[#ffd54a]" /> Stay Updated
              </h3>
              <p className="text-gray-400 text-sm mb-5">Subscribe to our newsletter for the latest anime releases, news, and exclusive offers.</p>
              <form className="relative flex items-center group" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email..." 
                  className="w-full bg-[#050716]/50 border border-white/10 text-white rounded-xl py-3.5 pl-4 pr-32 focus:outline-none focus:border-[#ffd54a] transition-colors placeholder:text-gray-600 shadow-inner group-hover:border-white/20"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#ffd54a] to-[#ff4dd2] text-white font-bold text-sm px-6 py-2 rounded-lg shadow-[0_0_15px_rgba(255, 213, 74,0.4)] hover:shadow-[0_0_25px_rgba(255, 77, 210,0.6)] transition-all cursor-pointer"
                >
                  Subscribe
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Middle Section: Links Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 py-12 border-t border-white/5"
        >
          {footerLinks.map((section, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col gap-6"
            >
              <h4 className="text-white font-bold text-lg tracking-wide relative w-fit group cursor-default">
                {section.title}
                <span className="absolute -bottom-2 left-0 w-1/2 h-[3px] bg-gradient-to-r from-[#ff4dd2] to-[#ffd54a] rounded-full group-hover:w-full transition-all duration-300" />
              </h4>
              <ul className="flex flex-col gap-3.5">
                {section.links.map((link, linkIdx) => (
                  <li key={linkIdx}>
                    <Link 
                      href={link.path} 
                      className="group flex items-center text-gray-400 hover:text-white text-sm font-medium transition-all duration-300"
                    >
                      <ChevronRight size={14} className="opacity-0 -translate-x-4 w-0 group-hover:w-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:mr-1.5 text-[#ffd54a] transition-all duration-300 overflow-hidden" />
                      <span className="group-hover:translate-x-1 group-hover:text-[#E0E0E0] transition-transform duration-300 drop-shadow-sm">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

      </div>

      {/* Bottom Section */}
      <div className="bg-[#000000] py-6 border-t border-white/5 relative z-20">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1400px] flex flex-col lg:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shrink-0">
            © {new Date().getFullYear()} <a href="/" className="text-[#ff4dd2] hover:text-[#ffd54a] transition-colors cursor-pointer drop-shadow-[0_0_8px_rgba(255, 77, 210,0.5)]">Anime Nation India</a> <span className="text-gray-700">|</span> ALL RIGHTS RESERVED
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="https://www.facebook.com/iamshouvikdas" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#1877F2] text-sm font-bold transition-all duration-300 hover:scale-105">Facebook</a>
            <a href="https://www.instagram.com/shouvik_das_official" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#E1306C] text-sm font-bold transition-all duration-300 hover:scale-105">Instagram</a>
            <a href="https://x.com/shouvikdas155" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-sm font-bold transition-all duration-300 hover:scale-105">X (Twitter)</a>
            <a href="https://shouvikdas-portfolio.vercel.app/portfolio" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#ffd54a] text-sm font-bold transition-all duration-300 hover:scale-105">Portfolio</a>
            <a href="mailto:shouvikdaswork@gmail.com" className="text-gray-500 hover:text-green-500 text-sm font-bold transition-all duration-300 hover:scale-105">Email</a>
          </div>

          <div className="shrink-0 hover:scale-105 transition-transform duration-300">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  );
}