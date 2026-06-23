import { Metadata } from 'next';
import { Scale, AlertCircle, FileWarning, Image as ImageIcon, Link as LinkIcon, Info } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Legal Disclaimer | Anime Nation India',
  description: 'Legal disclaimer and copyright information for Anime Nation India.',
};

export default function DisclaimerPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-[#ff4dd2]/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[900px] relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-[#12131A] rounded-2xl border border-[#2A2B30] mb-6 shadow-2xl">
            <Scale className="text-red-500 size-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-[#ff6600] to-yellow-400 mb-4 uppercase tracking-tighter">
            Legal Disclaimer
          </h1>
          <p className="text-[#a0a0a0] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Important legal information regarding the content, copyrights, and usage of <strong className="text-white">Anime Nation India</strong>.
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          
          {/* General Information */}
          <div className="bg-[#12131A]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#ff4dd2]/10 p-3 rounded-xl border border-[#ff4dd2]/20">
                <Info className="text-[#ff4dd2]" size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                General Information Purposes
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-sm md:text-base pl-0 md:pl-[4.5rem]">
              The information provided by Anime Nation India is for general informational and entertainment purposes only. All information on the Site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.
            </p>
          </div>

          {/* Copyright & Fair Use */}
          <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 hover:border-[#ff4dd2]/30 transition-colors group shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#ff4dd2]/10 p-3 rounded-xl border border-[#ff4dd2]/20 group-hover:border-[#ff4dd2]/30 transition-colors">
                <ImageIcon className="text-[#ff4dd2]" size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Copyright & Fair Use
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-sm md:text-base pl-0 md:pl-[4.5rem]">
              Anime Nation India does not claim ownership of any anime artwork, posters, character designs, trailers, or studio logos displayed on this website. All such media and intellectual properties belong to their respective copyright holders, creators, and production studios. 
              <br/><br/>
              The use of low-resolution promotional images, synopses, and trailers on this site qualifies as <strong>\"Fair Use\"</strong> under copyright law, as they are used strictly for informational, educational, and review purposes to help users discover anime.
            </p>
          </div>

          {/* API Usage */}
          <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 hover:border-[#f47521]/30 transition-colors group shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#f47521]/10 p-3 rounded-xl border border-[#f47521]/20 group-hover:border-[#f47521]/30 transition-colors">
                <LinkIcon className="text-[#f47521]" size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Data Sources & Third-Party APIs
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-sm md:text-base pl-0 md:pl-[4.5rem]">
              The anime statistics, release schedules, and descriptions provided on Anime Nation India are fetched dynamically from public APIs, including <strong>AniList GraphQL</strong> and <strong>Jikan (MyAnimeList)</strong>. We are not affiliated with, endorsed by, or sponsored by these API providers. Any inaccuracies in the data are subject to the original source databases.
            </p>
          </div>

          {/* No Piracy */}
          <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 hover:border-red-500/30 transition-colors group shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 group-hover:border-red-500/30 transition-colors">
                <FileWarning className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Strict Anti-Piracy Stance
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-sm md:text-base pl-0 md:pl-[4.5rem]">
              Anime Nation India is strictly a database, news, and discovery platform. <strong>We do not host, upload, or provide links to illegal streaming sites or pirated anime downloads.</strong> Any external links pointing to full episodes are directed exclusively to official, legal streaming platforms (e.g., Crunchyroll, Netflix, Hulu) where available.
            </p>
          </div>

          {/* DMCA Takedown */}
          <div className="bg-[#121326]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 hover:border-[#ff4dd2]/30 transition-colors group shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#ff4dd2]/10 p-3 rounded-xl border border-[#ff4dd2]/20 group-hover:border-[#ff4dd2]/30 transition-colors">
                <AlertCircle className="text-[#ff4dd2]" size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                DMCA & Content Removal
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-sm md:text-base pl-0 md:pl-[4.5rem]">
              If you are a copyright owner or an agent thereof and believe that any content on Anime Nation India infringes upon your copyrights, please submit a formal DMCA takedown notice via our <Link href="/contact" className="text-[#ff4dd2] hover:underline font-bold">Contact page</Link>. Upon receiving a valid request, we will promptly remove the infringing material.
            </p>
          </div>

        </div>

        <div className="mt-12 text-center text-[#5A5A63] text-sm">
          <p>© {currentYear} Anime Nation India. All rights reserved.</p>
        </div>

      </div>
    </main>
  );
}
