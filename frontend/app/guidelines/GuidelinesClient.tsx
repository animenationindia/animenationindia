'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Users, 
  MessageSquare, 
  EyeOff, 
  Ban, 
  Heart, 
  Search, 
  Info, 
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Rules', count: 32, icon: Sparkles, color: 'text-yellow-400' },
  { id: 'conduct', name: 'Conduct & Etiquette', count: 8, icon: Users, color: 'text-[#ff4dd2]' },
  { id: 'posting', name: 'Posting & Media', count: 7, icon: MessageSquare, color: 'text-blue-400' },
  { id: 'spoilers', name: 'Spoilers & Reviews', count: 5, icon: EyeOff, color: 'text-[#f47521]' },
  { id: 'zero-tolerance', name: 'Zero Tolerance', count: 7, icon: Ban, color: 'text-red-500' },
  { id: 'safety', name: 'Moderation & Safety', count: 5, icon: Shield, color: 'text-green-500' }
];

const guidelinesData = [
  // Conduct
  {
    id: 1,
    category: "conduct",
    title: "1. Be Respectful",
    text: "Treat everyone with kindness. Harassment, bullying, and toxic behavior will not be tolerated.",
    details: "Anime is for everyone. Respect other users in the chat, forums, and comment sections. Personal attacks or targeted harassment will result in moderation action."
  },
  {
    id: 2,
    category: "conduct",
    title: "2. Zero Tolerance for Hate Speech",
    text: "Racism, sexism, homophobia, and xenophobia will result in an instant and permanent ban.",
    details: "We promote a diverse community. Hate speech of any form, including slurs or derogatory statements based on race, sex, sexual orientation, or nationality, carries zero warning before permanent account termination."
  },
  {
    id: 3,
    category: "conduct",
    title: "3. No Personal Attacks",
    text: "Debate the anime, don't attack the person. Constructive criticism is welcome, but insults are not.",
    details: "It's fine to disagree on animation quality, plotlines, or characters. However, keep the discussion focused on the media. Do not call other users names or attack their intelligence."
  },
  {
    id: 4,
    category: "conduct",
    title: "4. Use Appropriate Language",
    text: "Keep swearing to a minimum and avoid extreme profanity in public forums and comments.",
    details: "While occasional mild language happens, constant profanity, slurs, or highly graphic, sexually suggestive discussions in public areas are not permitted."
  },
  {
    id: 5,
    category: "conduct",
    title: "5. No Trolling or Baiting",
    text: "Do not post deliberately provocative content just to anger others or start flame wars.",
    details: "Posting bait, rage-bait reviews, or intentionally triggering arguments with other users just for your amusement is toxic and will result in warnings."
  },
  {
    id: 6,
    category: "conduct",
    title: "6. Respect Different Opinions",
    text: "People have different tastes in anime. It's okay to dislike a popular show, but respect those who enjoy it.",
    details: "Taste in art is subjective. Let people enjoy their favorite shows without calling them trashy or invalid. Disagreements are welcome if handled civilly."
  },
  {
    id: 7,
    category: "conduct",
    title: "7. No 'Waifu/Husband' Wars",
    text: "Keep character debates civil. Toxic behavior over fictional characters ruins the fun for everyone.",
    details: "Character shipping and debate are normal, but taking it to extreme toxic levels, sending death threats, or bullying others over fictional characters is strictly banned."
  },
  {
    id: 8,
    category: "conduct",
    title: "8. English as Primary Language",
    text: "Please use English in general public spaces so moderators and the global community can understand.",
    details: "To ensure that all community members can communicate and our global mod team can effectively review comments, keep main forums and general comments in English."
  },

  // Posting
  {
    id: 9,
    category: "posting",
    title: "9. Stay On-Topic",
    text: "Keep discussions relevant. Anime threads are for anime. Avoid derailing conversations.",
    details: "Keep comment sections under episodes focused on that episode. General threads should remain on the topic designated by the author."
  },
  {
    id: 10,
    category: "posting",
    title: "10. No Political/Religious Debates",
    text: "Real-world politics and religion are strictly off-limits. We are here to escape reality and enjoy anime.",
    details: "Real-world politics and religion quickly divide communities. As an anime platform, we maintain these discussions strictly off-limits to ensure a neutral, welcoming environment."
  },
  {
    id: 11,
    category: "posting",
    title: "11. Use Clear Titles",
    text: "When creating a forum thread, use a descriptive title. 'HELP!' or 'Question' is not helpful to others.",
    details: "Help other users browse and find questions. Create titles that briefly summarize your post, such as 'Looking for Sci-Fi Anime Recommendations like Steins;Gate'."
  },
  {
    id: 12,
    category: "posting",
    title: "12. No Spamming",
    text: "Avoid posting the same message repeatedly or flooding the comment sections.",
    details: "Do not post repetitive comments, links, image dumps, or meaningless text blocks to gain rank or block visibility of genuine discussions."
  },
  {
    id: 13,
    category: "posting",
    title: "13. No Self-Promotion",
    text: "Do not advertise your YouTube channel, Discord server, or personal website without explicit staff permission.",
    details: "Sharing your creative fan art or reviews is great, but posting invite links to external services, selling merchandise, or repeatedly linking your channel is considered spam."
  },
  {
    id: 14,
    category: "posting",
    title: "14. Credit Original Artists",
    text: "If you post fan art, you must link and credit the original creator. Art theft is strictly prohibited.",
    details: "Art theft is a serious offense. If you share drawing edits or fan art that is not your original creation, provide direct attribution and link back to the artist's profile."
  },
  {
    id: 15,
    category: "posting",
    title: "15. Keep Fan-Edits Organized",
    text: "Post AMVs and fan-edits in their designated channels, not in official episode discussion threads.",
    details: "We have dedicated sections for fan creations. Avoid posting your AMVs or edits in the official episode discussion threads to prevent cluttering standard conversation."
  },

  // Spoilers
  {
    id: 16,
    category: "spoilers",
    title: "16. Use Spoiler Tags",
    text: "Always use spoiler tags for plot twists, character deaths, and endings. Don't ruin the experience for others.",
    details: "Always mask spoilers in reviews, comments, and posts. Ruining a critical plot twist for a fellow anime fan will lead to a temporary restriction."
  },
  {
    id: 17,
    category: "spoilers",
    title: "17. Tag Manga Spoilers",
    text: "Do not spoil anime-only watchers with knowledge from the Manga or Light Novels in anime discussion threads.",
    details: "Just because it happened in the manga doesn't mean it has aired in the anime yet. Keep manga details out of anime threads or tag them explicitly as MANGA SPOILERS."
  },
  {
    id: 18,
    category: "spoilers",
    title: "18. Write Constructive Reviews",
    text: "'This anime is trash' is not a valid review. Explain why you disliked it using constructive points.",
    details: "Provide helpful insights. Discuss things like plot structure, characters, sound design, pacing, or art style. Make your critique useful to potential viewers."
  },
  {
    id: 19,
    category: "spoilers",
    title: "19. Don't Review Bomb",
    text: "Do not rate an anime 1/10 just because a rival fanbase is doing it. Rate based on your honest, personal experience.",
    details: "Review bombing manipulates rankings unfairly. Rate shows honestly. Mass rating manipulation campaigns will be detected and discarded by administrators."
  },
  {
    id: 20,
    category: "spoilers",
    title: "20. No Fake Leaks",
    text: "Do not spread misinformation or fake leaks regarding upcoming anime seasons or announcements.",
    details: "Only share leaks from verified reliable sources, and label them clearly as rumors. Creating fake screenshots or edits to fool other fans is prohibited."
  },

  // Zero Tolerance
  {
    id: 21,
    category: "zero-tolerance",
    title: "21. No NSFW or Explicit Content",
    text: "Sharing explicit, pornographic (Hentai), or highly suggestive NSFW content will result in an immediate ban.",
    details: "This is a PG-13 public platform. Uploading, linking, or posting sexually explicit images, videos, profiles, or highly suggestive NSFW media will result in an immediate and irrevocable IP ban."
  },
  {
    id: 22,
    category: "zero-tolerance",
    title: "22. No Piracy Links",
    text: "Do not share or ask for links to illegal downloading or unauthorized streaming sites.",
    details: "To protect the platform legally and support original animators, posting direct links to piracy portals, torrent sites, or unauthorized streaming platforms is strictly forbidden."
  },
  {
    id: 23,
    category: "zero-tolerance",
    title: "23. No Gore or Real Violence",
    text: "Avoid posting images or videos of real-world violence. Keep things safe and animated.",
    details: "Posting real-world gore, animal cruelty, self-harm, or graphic violence is strictly forbidden. Content of this nature will be handed to security teams and accounts deleted."
  },
  {
    id: 24,
    category: "zero-tolerance",
    title: "24. No Doxxing",
    text: "Never share private or personally identifiable information about yourself or any other user.",
    details: "Never post real names, addresses, phone numbers, social media profiles, or email addresses of other users. Privacy is absolute. Breach of this will result in immediate legal reporting."
  },
  {
    id: 25,
    category: "zero-tolerance",
    title: "25. No Malware/Phishing",
    text: "Sharing malicious links or attempting to scam users will result in a permanent IP ban.",
    details: "Posting malicious script links, cryptocurrency scams, phishing sites, or trojan downloads will lead to immediate deletion of all data and permanent IP tracking bans."
  },
  {
    id: 26,
    category: "zero-tolerance",
    title: "26. No Impersonation",
    text: "Do not pretend to be ANI Media staff, moderators, voice actors, or other users.",
    details: "Using official developer badges, mimicking staff usernames, or claiming to represent Anime Nation India team members to threaten or deceive users is a direct path to a permanent ban."
  },
  {
    id: 27,
    category: "zero-tolerance",
    title: "27. No Alt Accounts for Evasion",
    text: "Creating secondary accounts to evade a ban will result in all associated accounts being permanently banned.",
    details: "If you receive a temporary warning or suspension, wait out the timer. Creating alternative accounts to bypass restrictions will result in a permanent ban on all associated accounts."
  },

  // Safety
  {
    id: 28,
    category: "safety",
    title: "28. Report, Don't Retaliate",
    text: "If someone breaks a rule, use the Report button. Do not fight back or engage with toxic users.",
    details: "If someone insults you, do not sink to their level. Use the Report button. Engaging in fights makes you equally liable to moderation action."
  },
  {
    id: 29,
    category: "safety",
    title: "29. Respect Staff Decisions",
    text: "Moderation actions (warnings, bans, deleted posts) are final. Do not argue with moderators in public.",
    details: "Our moderation team works hard to keep this site clean. If you wish to appeal an action, use our official help ticket email. Arguing with staff in public forums will increase the ban duration."
  },
  {
    id: 30,
    category: "safety",
    title: "30. Don't Beg for Roles",
    text: "Do not repeatedly ask developers or admins for moderator status or special badges.",
    details: "Moderator recruitments happen through official application forms. Repeatedly asking admins or messaging staff for roles will get you blacklisted from future hiring campaigns."
  },
  {
    id: 31,
    category: "safety",
    title: "31. Respect Voice Actors & Creators",
    text: "Do not send hate to real-life creators, animators, or voice actors, even if you dislike their work.",
    details: "Do not direct toxic campaigns or death threats against directors, voice actors, or studio animators due to character choices or poor anime adaptation quality. Keep things constructive."
  },
  {
    id: 32,
    category: "safety",
    title: "32. Read the FAQ",
    text: "Before asking a platform-related question, please check the FAQ section first.",
    details: "We maintain a detailed help center and FAQ covering technical questions like playback issues, accounts, list sync, etc. Please review them before creating threads."
  }
];

export default function GuidelinesClient() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRule, setExpandedRule] = useState<number | null>(null);

  // Filter guidelines based on category and search query
  const filteredGuidelines = useMemo(() => {
    return guidelinesData.filter((rule) => {
      const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
      const matchesSearch = 
        rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.details.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'conduct':
        return {
          iconColor: 'text-[#ff4dd2]',
          bgColor: 'bg-[#ff4dd2]/5',
          borderColor: 'border-[#ff4dd2]/20',
          hoverBorder: 'hover:border-[#ff4dd2]/50',
          glowColor: 'shadow-[0_0_15px_rgba(255,77,210,0.15)]',
          badgeText: 'Conduct'
        };
      case 'posting':
        return {
          iconColor: 'text-blue-400',
          bgColor: 'bg-blue-400/5',
          borderColor: 'border-blue-400/20',
          hoverBorder: 'hover:border-blue-400/50',
          glowColor: 'shadow-[0_0_15px_rgba(96,165,250,0.15)]',
          badgeText: 'Posting'
        };
      case 'spoilers':
        return {
          iconColor: 'text-[#f47521]',
          bgColor: 'bg-[#f47521]/5',
          borderColor: 'border-[#f47521]/20',
          hoverBorder: 'hover:border-[#f47521]/50',
          glowColor: 'shadow-[0_0_15px_rgba(244,117,33,0.15)]',
          badgeText: 'Spoilers'
        };
      case 'zero-tolerance':
        return {
          iconColor: 'text-red-500',
          bgColor: 'bg-red-500/5',
          borderColor: 'border-red-500/20',
          hoverBorder: 'hover:border-red-500/50',
          glowColor: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
          badgeText: 'Ban Risk'
        };
      case 'safety':
        return {
          iconColor: 'text-green-500',
          bgColor: 'bg-green-500/5',
          borderColor: 'border-green-500/20',
          hoverBorder: 'hover:border-green-500/50',
          glowColor: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]',
          badgeText: 'Safety'
        };
      default:
        return {
          iconColor: 'text-gray-400',
          bgColor: 'bg-gray-400/5',
          borderColor: 'border-gray-400/20',
          hoverBorder: 'hover:border-gray-400/50',
          glowColor: 'shadow-none',
          badgeText: 'General'
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'conduct': return <Users size={18} />;
      case 'posting': return <MessageSquare size={18} />;
      case 'spoilers': return <EyeOff size={18} />;
      case 'zero-tolerance': return <Ban size={18} />;
      case 'safety': return <Shield size={18} />;
      default: return <Info size={18} />;
    }
  };

  const toggleExpand = (id: number) => {
    if (expandedRule === id) {
      setExpandedRule(null);
    } else {
      setExpandedRule(id);
    }
  };

  return (
    <div className="w-full relative">
      {/* 3D Glowing background elements */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-[#ff4dd2]/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-40 right-10 w-[400px] h-[400px] bg-[#ff6600]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-12">
        {/* Core Pillars Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#121326]/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#ff4dd2]/20 to-transparent blur-xl opacity-50" />
            <div className="w-12 h-12 rounded-xl bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2]">
              <Heart size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                Respectful Discussions
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Be kind and open-minded. Respect different opinions, tastes, and character choices. Trolls and toxic behavior are filtered immediately.
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#121326]/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#f47521]/20 to-transparent blur-xl opacity-50" />
            <div className="w-12 h-12 rounded-xl bg-[#f47521]/10 border border-[#f47521]/30 flex items-center justify-center text-[#f47521]">
              <EyeOff size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                Protect the Experience
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Keep the magic alive for everyone. Use spoiler tags for key anime events, character outcomes, and manga plot points.
              </p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#121326]/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/20 to-transparent blur-xl opacity-50" />
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                Strict Safety Policy
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Zero tolerance for NSFW/Hentai media uploads, links to piracy websites, doxxing personal details, or account evasion.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Filter & Search Bar Row */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-[#0c0d21]/60 backdrop-blur-xl border border-[#2a2b42]/30 p-5 rounded-2xl shadow-xl">
          {/* Categories Horizontal Scrolling */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 -my-1 -mx-2 px-2 max-w-full lg:max-w-[70%]">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 shrink-0 border select-none cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#ff4dd2]/20 to-[#f47521]/20 border-[#ff4dd2]/40 text-white shadow-lg' 
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className={`${cat.color} size-4`} />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-[#ff4dd2]/20 text-white' : 'bg-white/5 text-gray-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex items-center w-full lg:w-[28%] shrink-0">
            <Search className="absolute left-4 text-gray-500 size-4" />
            <input
              type="text"
              placeholder="Search rules (e.g. spoilers)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.02] focus:bg-white/[0.05] border border-white/5 focus:border-[#ff4dd2]/50 text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all duration-300 placeholder:text-gray-600 shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-xs font-bold text-gray-500 hover:text-white transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Guidelines List */}
        <div>
          {filteredGuidelines.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredGuidelines.map((rule) => {
                  const style = getCategoryStyles(rule.category);
                  const isExpanded = expandedRule === rule.id;

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      key={rule.id}
                      onClick={() => toggleExpand(rule.id)}
                      className={`bg-[#0c0d21]/30 backdrop-blur-md border ${style.borderColor} ${style.hoverBorder} ${isExpanded ? style.glowColor + ' border-white/10' : ''} p-5 md:p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between group shadow-md hover:-translate-y-0.5 select-none`}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Card Header (Category Badge + Rule Number) */}
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 ${style.iconColor} flex items-center gap-1.5`}>
                            {getCategoryIcon(rule.category)}
                            {style.badgeText}
                          </span>
                          <span className="text-xs font-bold text-gray-600 group-hover:text-gray-400 transition-colors">
                            Rule #{rule.id}
                          </span>
                        </div>

                        {/* Title & Short description */}
                        <div className="flex flex-col gap-2">
                          <h4 className="text-white font-black text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                            {rule.title}
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            {rule.text}
                          </p>
                        </div>
                      </div>

                      {/* Expandable detailed instruction */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                            onClick={(e) => e.stopPropagation()} // stop toggle collapse on content click
                          >
                            <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Info size={12} className={style.iconColor} /> Detailed Guidance
                              </span>
                              <p className="text-gray-300 text-sm leading-relaxed bg-white/[0.01] border border-white/[0.02] p-3.5 rounded-xl">
                                {rule.details}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Bottom action indicator */}
                      <div className="mt-5 pt-3 border-t border-white/[0.02] flex items-center justify-between text-xs font-bold text-gray-500 group-hover:text-gray-400 transition-colors">
                        <span>Click to {isExpanded ? 'collapse' : 'reveal details'}</span>
                        <ArrowRight size={14} className={`transform transition-transform duration-300 ${
                          isExpanded ? 'rotate-90 text-white' : 'group-hover:translate-x-1'
                        }`} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-16 bg-[#0c0d21]/20 border border-white/5 rounded-2xl backdrop-blur-md">
              <AlertTriangle className="text-yellow-500 size-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No guidelines match your filter</h3>
              <p className="text-gray-500 max-w-sm mx-auto text-sm">
                Try adjusting your search keywords or clearing filters to display all 32 community rules.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-5 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm border border-white/10 cursor-pointer transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Safety Report Warning Box */}
        <div className="mt-8 text-center bg-gradient-to-r from-red-500/10 via-[#ff4dd2]/10 to-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-all rounded-3xl p-8 md:p-10 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2.5s_infinite]" />
          <Shield className="text-red-500 size-14 mx-auto mb-5 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-wide uppercase">Help Us Keep The Community Safe</h3>
          <p className="text-gray-400 max-w-2xl mx-auto text-base leading-relaxed mb-6">
            By accessing or signing up on Anime Nation India, you agree to abide by these guidelines. Repeated violations will result in account suspension or a permanent ban. 
            If you encounter anyone breaking these rules, do not engage. Report the post or comment immediately to our safety team.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a 
              href="mailto:support@animenationindia.online"
              className="px-6 py-3.5 bg-red-500/20 hover:bg-red-500/30 text-white hover:text-white font-extrabold rounded-xl border border-red-500/40 hover:border-red-500/60 shadow-lg tracking-wider text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              Report a Violation
            </a>
            <a 
              href="/faq" 
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold rounded-xl border border-white/5 hover:border-white/10 tracking-wider text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              Browse Technical FAQ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
