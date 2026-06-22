import { Metadata } from 'next';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata: Metadata = {
  title: 'FAQ | Anime Nation India',
  description: 'Frequently Asked Questions about Anime Nation India.',
};

const faqs = [
  {
    category: "General Information",
    questions: [
      { q: "What is Anime Nation India (ANI)?", a: "Anime Nation India (ANI) is a comprehensive anime database and discovery platform. We provide detailed information, release schedules, trailers, and a personalized watchlist feature for anime fans worldwide." },
      { q: "Is ANI completely free to use?", a: "Yes, our database, browse features, and watchlist tools are 100% free for everyone." },
      { q: "Do you host illegal anime streams?", a: "No. ANI is strictly a database and discovery platform. We do not host or distribute illegal streaming content. We direct users to official platforms to support creators." },
      { q: "Why do I see 'Streaming Unavailable' on video players?", a: "Because we currently do not hold the official licenses to stream those episodes. We display mock players for aesthetic purposes and provide links to official sources where you can legally watch them." },
      { q: "Will ANI ever offer official streaming?", a: "We hope to in the future! If we secure the proper licensing rights, we plan to bring official, legal streaming services directly to our platform." },
      { q: "Where does your anime data come from?", a: "We aggregate our data from highly respected public APIs such as Jikan (MyAnimeList) and AniList to ensure you get the most accurate and up-to-date information." },
      { q: "How often is the anime database updated?", a: "Our data is fetched in real-time or frequently cached directly from our data providers, meaning you get the latest release dates, scores, and episode counts as soon as they are publicly available." },
      { q: "Is there an official ANI mobile app?", a: "Currently, we do not have a native iOS or Android app. However, our website is fully optimized and highly responsive for mobile browsers." },
      { q: "Do you plan to include Manga and Light Novels?", a: "Yes! While our primary focus is currently on Anime, we plan to expand our database to include Manga, Manhwa, and Light Novels in future updates." },
      { q: "Is ANI available in multiple languages?", a: "Currently, our user interface is in English, but the anime titles are available in Romaji, English, and Native Japanese. Multi-language UI support is on our roadmap." }
    ]
  },
  {
    category: "Account & Watchlist",
    questions: [
      { q: "Do I need an account to use the website?", a: "No, you can freely browse anime, check schedules, and watch trailers without an account. However, an account is required to use the Watchlist and save anime." },
      { q: "How do I add an anime to my Watchlist?", a: "Simply navigate to any anime details page or use the quick actions on anime cards, and click the 'Add to Watchlist' or Bookmark icon." },
      { q: "What are the different Watchlist statuses?", a: "You can categorize your anime as 'WATCHING', 'PLAN TO WATCH', or 'COMPLETED' to keep your library organized." },
      { q: "Can I share my Watchlist with friends?", a: "Watchlists are currently private to your account. We are working on a feature that will allow you to make your profile and lists public to share with friends." },
      { q: "How do I change my profile picture or avatar?", a: "Currently, your avatar is pulled from your authentication provider (like Google or Discord). We will be adding custom avatar uploads in the Settings page soon." },
      { q: "How do I reset my password?", a: "If you signed up with an email and password, you can click 'Forgot Password' on the login page to receive a reset link. Social logins do not require password resets through our platform." },
      { q: "Can I delete my account?", a: "Yes. You can permanently delete your account and all associated watchlist data from the 'Account Settings' page." },
      { q: "Why is my email not verifying?", a: "Please check your spam or junk folder. If you still haven't received the verification email, you can request a new one from the login page." },
      { q: "Is there a limit to how many anime I can save?", a: "No! You can add as many anime to your watchlist as you like. There are no limits." },
      { q: "Why did my Watchlist data disappear?", a: "Please ensure you are logged into the correct account. If you were browsing as a guest, your data cannot be saved permanently without an account." }
    ]
  },
  {
    category: "Features & Navigation",
    questions: [
      { q: "What does 'Simulcast' mean?", a: "Simulcast refers to anime episodes that are broadcasted online at the same time (or shortly after) they air on television in Japan." },
      { q: "How does the Release Calendar work?", a: "The Release Calendar automatically detects your local timezone and shows you exactly when new episodes of currently airing anime will be released in your time." },
      { q: "Are the trailers shown official?", a: "Yes, we embed official YouTube trailers provided by the animation studios, publishers, or official distributors." },
      { q: "How do I filter anime by genre?", a: "You can go to the 'Browse' or 'Genres' page, where you will find advanced filtering options to sort anime by specific genres, formats, and scores." },
      { q: "Can I see the voice actors for my favorite characters?", a: "Yes! The anime details page includes a 'Cast & Characters' section where you can see the characters and their respective Voice Actors (Seiyuu)." },
      { q: "Can I leave comments or reviews?", a: "Currently, our comments section is a mock interface for aesthetic purposes. However, a fully functional community discussion and review system is in active development." },
      { q: "Is there a light theme / dark mode toggle?", a: "ANI is designed natively with a 'Deep Space Neon' dark theme to provide a cinematic feel that is easy on the eyes. A light theme is not currently supported." },
      { q: "What happens if an anime is missing from the site?", a: "Since we rely on public APIs like MyAnimeList, if a very obscure or brand new anime isn't listed, it will appear on ANI as soon as it is approved on their databases." },
      { q: "Does ANI provide anime news?", a: "Yes, we have a dedicated News section featuring announcements, trending topics, and features related to the anime industry." },
      { q: "Are there community forums?", a: "We are building a community hub where users can discuss episodes, recommend anime, and talk about manga/light novels." }
    ]
  },
  {
    category: "Technical & Support",
    questions: [
      { q: "Why is the website loading slowly?", a: "Loading times depend on your internet connection and the response times of the external databases (like Jikan API) we fetch data from. We utilize aggressive caching to minimize this." },
      { q: "Who do I contact to report a bug?", a: "You can report any bugs, visual glitches, or data inaccuracies through our 'Contact' page or by emailing support@Anime Nation India.com." },
      { q: "Can I request a new feature?", a: "Absolutely! We love community feedback. Please send your suggestions through the 'Content Feedback' form located in the footer." },
      { q: "Do you offer a premium ad-free subscription?", a: "ANI is currently completely free and does not force intrusive popup ads. We do not have a paid premium tier at this moment." },
      { q: "Why does the site look weird on my old browser?", a: "ANI uses modern web technologies (Next.js, Tailwind CSS) that require updated browsers. Please ensure you are using a modern, updated version of Chrome, Firefox, Safari, or Edge." },
      { q: "Is there an age restriction to use ANI?", a: "While the database contains anime for various demographics, users must be 13 years or older to create an account, as per standard privacy guidelines." },
      { q: "Why are some episode numbers marked as '??'?", a: "For ongoing or upcoming anime, the total episode count is often unannounced by the studio. It will update automatically once officially confirmed." },
      { q: "How is my personal data handled?", a: "We only store essential data (like your email and watchlist) securely using Supabase. We do not sell your personal data to third parties. Read our Privacy Policy for more details." },
      { q: "Does ANI use cookies?", a: "Yes, we use essential cookies to keep you logged in and remember your session. You can manage this via our Cookie Consent page." },
      { q: "How can I support ANI?", a: "The best way to support us right now is to use the platform, share it with your friends, and provide feedback so we can continue improving the experience!" }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="bg-[#050716] min-h-screen pt-32 pb-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#ff4dd2]/10 to-transparent opacity-50 z-0 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 lg:px-8 w-full max-w-[1000px] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 mx-auto bg-[#ff4dd2]/20 rounded-full flex items-center justify-center mb-6">
            <HelpCircle size={32} className="text-[#ff4dd2]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bebas tracking-widest text-white mb-4 uppercase drop-shadow-lg">
            Frequently Asked <span className="text-[#ffd54a]">Questions</span>
          </h1>
          <p className="text-[#a0a0a0] text-base md:text-lg max-w-2xl mx-auto">
            Find answers to the most common questions about Anime Nation India. If you can't find what you're looking for, feel free to contact our support team.
          </p>
        </div>

        {/* FAQs */}
        <div className="space-y-12">
          {faqs.map((section, idx) => (
            <div key={idx} className="bg-[#121326]/80 backdrop-blur-xl border border-[#2A2B30]/50 rounded-2xl p-6 md:p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[#ff4dd2] rounded-full inline-block shadow-[0_0_8px_rgba(255, 77, 210,0.6)]"></span>
                {section.category}
              </h2>
              
              <div className="space-y-4">
                {section.questions.map((item, qIdx) => (
                  <details key={qIdx} className="group bg-[#141519] border border-[#2A2B30]/50 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between cursor-pointer p-5 font-semibold text-gray-200 hover:text-white hover:bg-[#1A1C23] transition-colors select-none">
                      <span className="pr-6">{item.q}</span>
                      <ChevronDown size={20} className="text-[#ffd54a] shrink-0 group-open:rotate-180 transition-transform duration-300" />
                    </summary>
                    <div className="p-5 pt-0 text-[#a0a0a0] text-sm md:text-base leading-relaxed border-t border-[#2A2B30]/30 mt-2 bg-[#141519]">
                      <p className="pt-3">{item.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div className="mt-16 text-center bg-gradient-to-r from-[#ff4dd2]/10 via-[#ffd54a]/10 to-[#ff4dd2]/10 border border-[#2A2B30] rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-gray-400 mb-6">We're here to help you with any issues or inquiries you might have.</p>
          <a href="/contact" className="inline-block px-8 py-3 bg-[#ffd54a] hover:bg-[#0596B2] text-[#000000] font-bold uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(255, 213, 74,0.4)] transition-all">
            Contact Support
          </a>
        </div>

      </div>
    </div>
  );
}
