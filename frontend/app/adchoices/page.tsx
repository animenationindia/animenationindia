import { Metadata } from 'next';
import { MousePointerClick, EyeOff, Settings, Info, ShieldAlert, MonitorPlay } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AdChoices | Anime Nation India',
  description: 'Learn about your advertising choices on Anime Nation India.',
};

export default function AdChoicesPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-[#ffd54a]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-[#ff4dd2]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[900px] relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-[#12131A] rounded-2xl border border-[#2A2B30] mb-6 shadow-2xl">
            <MonitorPlay className="text-[#ffd54a] size-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffd54a] to-[#ff4dd2] mb-4 uppercase tracking-tighter">
            AdChoices
          </h1>
          <p className="text-[#a0a0a0] text-lg max-w-2xl mx-auto">
            Understanding how ads work on Anime Nation India and how you can control your advertising experience.
          </p>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          
          <div className="bg-[#12131A]/80 backdrop-blur-xl border border-[#2A2B30] rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#ffd54a]/10 p-3 rounded-xl border border-[#ffd54a]/20">
                <Info className="text-[#ffd54a]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Our Advertising Approach
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-base pl-[4.5rem]">
              Anime Nation India provides a free anime database and discovery platform for everyone. To help keep our servers running and our service free, we may display advertisements. We aim to ensure that these ads are relevant, non-intrusive, and safe for our community.
            </p>
          </div>

          <div className="bg-[#121326]/60 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-8 hover:border-[#ff4dd2]/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#ff4dd2]/10 p-3 rounded-xl border border-[#ff4dd2]/20">
                <MousePointerClick className="text-[#ff4dd2]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Personalized Advertising
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-base pl-[4.5rem]">
              We work with third-party advertising partners who may collect information about your visits to our platform and other websites. This data is used to provide advertisements about goods and services that may be of interest to you (known as Interest-Based Advertising).
            </p>
          </div>

          <div className="bg-[#121326]/60 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-8 hover:border-[#f47521]/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-[#f47521]/10 p-3 rounded-xl border border-[#f47521]/20">
                <EyeOff className="text-[#f47521]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Opting Out of Targeted Ads
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-base pl-[4.5rem] mb-4">
              You have the right to control the ads you see. If you prefer not to receive personalized ads, you can opt out through several industry-standard tools:
            </p>
            <ul className="list-disc text-[#8A8A93] pl-[6rem] space-y-2">
              <li>Visit the <a href="https://optout.aboutads.info/" target="_blank" rel="noreferrer" className="text-[#ffd54a] hover:underline">Digital Advertising Alliance (DAA) WebChoices Tool</a>.</li>
              <li>Visit the <a href="https://optout.networkadvertising.org/" target="_blank" rel="noreferrer" className="text-[#ffd54a] hover:underline">Network Advertising Initiative (NAI) Opt-Out Page</a>.</li>
              <li>Adjust your mobile device settings (e.g., "Limit Ad Tracking" on iOS or "Opt out of Ads Personalization" on Android).</li>
            </ul>
            <p className="text-[#8A8A93] leading-relaxed text-base pl-[4.5rem] mt-4">
              <em>Note: Opting out does not mean you will stop seeing ads; it simply means the ads you see will no longer be tailored to your specific interests.</em>
            </p>
          </div>

          <div className="bg-[#121326]/60 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-8 hover:border-green-500/50 transition-colors">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                <ShieldAlert className="text-green-500" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Managing Cookies
              </h2>
            </div>
            <p className="text-[#8A8A93] leading-relaxed text-base pl-[4.5rem]">
              You can further control your ad experience by managing your cookie preferences. Visit our <a href="/cookies" className="text-[#ffd54a] hover:underline">Cookie Preferences</a> page to toggle tracking for marketing and analytics purposes. You can also clear or block cookies directly from your web browser settings.
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
