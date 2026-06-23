import { Metadata } from 'next';
import { Shield, Lock, Eye, Database, Globe, Share2, Cookie, UserCheck, AlertTriangle, Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Anime Nation India',
  description: 'Privacy Policy explaining how we collect, use, and protect your data.',
};

const privacyData = [
  {
    title: "1. Information We Collect",
    icon: <Database className="text-[#ff4dd2]" size={24} />,
    content: "We collect information to provide better services to our users. This includes: (a) Personal Data provided during registration (like email, username). (b) Usage Data collected automatically (like pages visited, search queries, IP address, and browser type). (c) Interaction Data (anime added to your watchlist, reviews posted, and ratings)."
  },
  {
    title: "2. How We Use Your Information",
    icon: <Eye className="text-[#ff4dd2]" size={24} />,
    content: "Your data helps us improve the Anime Nation India experience. We use it to: provide and maintain the Service, personalize your anime recommendations, manage your account, notify you about changes, provide customer support, and monitor the usage of our platform to detect and address technical issues."
  },
  {
    title: "3. Third-Party APIs & Integrations",
    icon: <Globe className="text-[#f47521]" size={24} />,
    content: "Our platform integrates with third-party services like AniList GraphQL, Jikan REST API (MyAnimeList), and YouTube (for trailers). When you interact with these features, certain non-personal data (such as search queries or video views) may be processed by these third parties according to their own privacy policies."
  },
  {
    title: "4. Cookies and Tracking",
    icon: <Cookie className="text-[#ff4dd2]" size={24} />,
    content: "We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent."
  },
  {
    title: "5. Information Sharing & Disclosure",
    icon: <Share2 className="text-[#ff4dd2]" size={24} />,
    content: "We do not sell or rent your personal information to third parties. We may disclose your data only in the following situations: to comply with a legal obligation, to protect and defend the rights or property of Anime Nation India, to prevent or investigate possible wrongdoing, or to protect the personal safety of users."
  },
  {
    title: "6. Data Security",
    icon: <Lock className="text-green-500" size={24} />,
    content: "The security of your data is extremely important to us. We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, please remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure."
  },
  {
    title: "7. Children's Privacy",
    icon: <AlertTriangle className="text-red-500" size={24} />,
    content: "Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us so we can remove that information."
  },
  {
    title: "8. Your Data Rights",
    icon: <UserCheck className="text-[#f47521]" size={24} />,
    content: "You have the right to access, update, or delete the information we have on you. If you have an account, you can manage your personal data directly within your account settings section. If you wish to permanently delete your account and all associated data, you may contact our support team."
  }
];

export default function PrivacyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-[#ff4dd2]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-[#f47521]/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[900px] relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-[#12131A] rounded-2xl border border-[#2A2B30] mb-6 shadow-2xl">
            <Shield className="text-[#ff4dd2] size-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] via-[#ff6600] to-yellow-400 mb-4 uppercase tracking-tighter">
            Privacy Policy
          </h1>
          <p className="text-[#a0a0a0] text-sm md:text-base font-semibold">
            Last Updated: <span className="text-white">June {currentYear}</span>
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-[#12131A]/80 backdrop-blur-xl border border-[#2A2B30]/40 rounded-3xl p-6 md:p-8 mb-12 shadow-xl">
          <p className="text-[#E0E0E0] leading-relaxed text-base md:text-lg font-medium">
            At <strong className="text-white">Anime Nation India</strong>, your privacy is our priority. This Privacy Policy outlines what information we collect, how we use it, and how we protect your personal data when you use our anime database, forums, and discovery tools.
          </p>
        </div>

        {/* Privacy List */}
        <div className="space-y-8">
          {privacyData.map((policy, index) => (
            <div 
              key={index} 
              className="bg-[#121326]/60 backdrop-blur-xl border border-[#2A2B30]/40 rounded-3xl p-6 md:p-8 hover:border-[#ff4dd2]/30 transition-colors group shadow-lg"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-[#12131A] p-3 rounded-xl border border-[#2A2B30]/50 group-hover:border-[#ff4dd2]/30 transition-colors shadow-lg">
                  {policy.icon}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {policy.title}
                </h2>
              </div>
              <div className="text-[#8A8A93] leading-relaxed text-sm md:text-base pl-0 md:pl-[4.5rem]">
                {policy.content}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-gradient-to-br from-[#12131A] to-[#121326] border border-[#2A2B30]/50 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
          <Mail className="text-[#ff4dd2] size-12 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-wide">9. Contact Privacy Team</h2>
          <p className="text-[#a0a0a0] max-w-2xl mx-auto mb-6 text-sm md:text-base leading-relaxed">
            If you have any questions, concerns, or requests regarding your data and our Privacy Policy, please don't hesitate to reach out to our privacy team.
          </p>
          <Link 
            href="/contact" 
            className="inline-block bg-gradient-to-r from-[#ff4dd2]/20 to-[#f47521]/20 hover:from-[#ff4dd2]/30 hover:to-[#f47521]/30 border border-[#ff4dd2]/40 hover:border-[#ff4dd2]/60 text-white font-extrabold uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Contact Privacy Team
          </Link>
        </div>

        <div className="mt-12 text-center text-[#5A5A63] text-sm">
          <p>© {currentYear} Anime Nation India. All rights reserved.</p>
        </div>

      </div>
    </main>
  );
}
