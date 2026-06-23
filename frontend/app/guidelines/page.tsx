import { Metadata } from 'next';
import { Shield, Users, MessageSquare, AlertTriangle, BookOpen, Ban, Heart, EyeOff, Link as LinkIcon, UserX, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Guidelines | Anime Nation India',
  description: 'Community guidelines and rules for Anime Nation India users.',
};

const guidelinesData = [
  {
    category: "General Etiquette & Conduct",
    icon: <Users className="text-[#ff4dd2]" size={24} />,
    color: "from-[#ff4dd2]/20 to-transparent",
    borderColor: "hover:border-[#ff4dd2]/50",
    rules: [
      { title: "1. Be Respectful", text: "Treat everyone with kindness. Harassment, bullying, and toxic behavior will not be tolerated." },
      { title: "2. Zero Tolerance for Hate Speech", text: "Racism, sexism, homophobia, and xenophobia will result in an instant and permanent ban." },
      { title: "3. No Personal Attacks", text: "Debate the anime, don't attack the person. Constructive criticism is welcome, but insults are not." },
      { title: "4. Use Appropriate Language", text: "Keep swearing to a minimum and avoid extreme profanity in public forums and comments." },
      { title: "5. No Trolling or Baiting", text: "Do not post deliberately provocative content just to anger others or start flame wars." },
      { title: "6. Respect Different Opinions", text: "People have different tastes in anime. It's okay to dislike a popular show, but respect those who enjoy it." },
      { title: "7. No 'Waifu/Husband' Wars", text: "Keep character debates civil. Toxic behavior over fictional characters ruins the fun for everyone." },
      { title: "8. English as Primary Language", text: "Please use English in general public spaces so moderators and the global community can understand." },
    ]
  },
  {
    category: "Content & Posting Rules",
    icon: <MessageSquare className="text-[#ff4dd2]" size={24} />,
    color: "from-[#ff4dd2]/20 to-transparent",
    borderColor: "hover:border-[#ff4dd2]/50",
    rules: [
      { title: "9. Stay On-Topic", text: "Keep discussions relevant. Anime threads are for anime. Avoid derailing conversations." },
      { title: "10. No Political/Religious Debates", text: "Real-world politics and religion are strictly off-limits. We are here to escape reality and enjoy anime." },
      { title: "11. Use Clear Titles", text: "When creating a forum thread, use a descriptive title. 'HELP!' or 'Question' is not helpful to others." },
      { title: "12. No Spamming", text: "Avoid posting the same message repeatedly or flooding the comment sections." },
      { title: "13. No Self-Promotion", text: "Do not advertise your YouTube channel, Discord server, or personal website without explicit staff permission." },
      { title: "14. Credit Original Artists", text: "If you post fan art, you must link and credit the original creator. Art theft is strictly prohibited." },
      { title: "15. Keep Fan-Edits Organized", text: "Post AMVs and fan-edits in their designated channels, not in official episode discussion threads." },
    ]
  },
  {
    category: "Spoilers & Reviews",
    icon: <EyeOff className="text-[#f47521]" size={24} />,
    color: "from-[#f47521]/20 to-transparent",
    borderColor: "hover:border-[#f47521]/50",
    rules: [
      { title: "16. Use Spoiler Tags", text: "Always use spoiler tags for plot twists, character deaths, and endings. Don't ruin the experience for others." },
      { title: "17. Tag Manga Spoilers", text: "Do not spoil anime-only watchers with knowledge from the Manga or Light Novels in anime discussion threads." },
      { title: "18. Write Constructive Reviews", text: "'This anime is trash' is not a valid review. Explain why you disliked it using constructive points." },
      { title: "19. Don't Review Bomb", text: "Do not rate an anime 1/10 just because a rival fanbase is doing it. Rate based on your honest, personal experience." },
      { title: "20. No Fake Leaks", text: "Do not spread misinformation or fake leaks regarding upcoming anime seasons or announcements." },
    ]
  },
  {
    category: "Zero Tolerance Policies",
    icon: <Ban className="text-red-500" size={24} />,
    color: "from-red-500/20 to-transparent",
    borderColor: "hover:border-red-500/50",
    rules: [
      { title: "21. No NSFW or Explicit Content", text: "Sharing explicit, pornographic (Hentai), or highly suggestive NSFW content will result in an immediate ban." },
      { title: "22. No Piracy Links", text: "Do not share or ask for links to illegal downloading or unauthorized streaming sites." },
      { title: "23. No Gore or Real Violence", text: "Avoid posting images or videos of real-world violence. Keep things safe and animated." },
      { title: "24. No Doxxing", text: "Never share private or personally identifiable information about yourself or any other user." },
      { title: "25. No Malware/Phishing", text: "Sharing malicious links or attempting to scam users will result in a permanent IP ban." },
      { title: "26. No Impersonation", text: "Do not pretend to be ANI Media staff, moderators, voice actors, or other users." },
      { title: "27. No Alt Accounts for Evasion", text: "Creating secondary accounts to evade a ban will result in all associated accounts being permanently banned." },
    ]
  },
  {
    category: "Moderation & Safety",
    icon: <Shield className="text-green-500" size={24} />,
    color: "from-green-500/20 to-transparent",
    borderColor: "hover:border-green-500/50",
    rules: [
      { title: "28. Report, Don't Retaliate", text: "If someone breaks a rule, use the Report button. Do not fight back or engage with toxic users." },
      { title: "29. Respect Staff Decisions", text: "Moderation actions (warnings, bans, deleted posts) are final. Do not argue with moderators in public." },
      { title: "30. Don't Beg for Roles", text: "Do not repeatedly ask developers or admins for moderator status or special badges." },
      { title: "31. Respect Voice Actors & Creators", text: "Do not send hate to real-life creators, animators, or voice actors, even if you dislike their work." },
      { title: "32. Read the FAQ", text: "Before asking a platform-related question, please check the FAQ section first." },
    ]
  }
];

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#ff4dd2]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1000px] relative z-10">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] to-[#ff4dd2] mb-4 uppercase tracking-tighter">
            Community Guidelines
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl mx-auto text-lg leading-relaxed">
            Welcome to the <strong>Anime Nation India</strong> community! To maintain a premium, safe, and fun environment for all anime fans, we enforce the following 32 core guidelines.
          </p>
        </div>

        <div className="space-y-12">
          {guidelinesData.map((section, index) => (
            <div 
              key={index} 
              className={`bg-[#121326]/80 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl overflow-hidden transition-colors ${section.borderColor}`}
            >
              <div className={`bg-gradient-to-r ${section.color} p-6 md:p-8 border-b border-[#2A2B30]/40 flex items-center gap-4`}>
                <div className="bg-[#12131A] p-3 rounded-xl border border-[#2A2B30]/50 shadow-xl">
                  {section.icon}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {section.category}
                </h2>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {section.rules.map((rule, ruleIdx) => (
                    <div key={ruleIdx} className="flex flex-col gap-2">
                      <h3 className="text-[#E0E0E0] font-bold text-lg leading-tight flex items-start gap-2">
                        {rule.title}
                      </h3>
                      <p className="text-[#8A8A93] text-sm leading-relaxed pl-1">
                        {rule.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 rounded-2xl p-8 backdrop-blur-md">
          <Shield className="text-[#ff4dd2] size-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Help Us Keep The Community Safe</h3>
          <p className="text-[#a0a0a0] max-w-xl mx-auto">
            By using Anime Nation India, you agree to abide by these guidelines. Repeated violations will result in account suspension or a permanent ban. Thank you for being a great community member!
          </p>
        </div>

      </div>
    </main>
  );
}
