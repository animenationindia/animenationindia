import { Metadata } from 'next';
import GuidelinesClient from './GuidelinesClient';

export const metadata: Metadata = {
  title: 'Community Guidelines | Anime Nation India',
  description: 'Community guidelines and rules for Anime Nation India users.',
};

export default function GuidelinesPage() {
  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-[#ff4dd2]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[1100px] relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff4dd2] via-[#ff6600] to-yellow-400 mb-5 uppercase tracking-tighter drop-shadow-sm">
            Community Guidelines
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium">
            Welcome to the <strong className="text-white">Anime Nation India</strong> community! To maintain a premium, safe, and fun environment for all anime fans, we enforce the following 32 core guidelines.
          </p>
        </div>

        {/* Interactive client guidelines interface */}
        <GuidelinesClient />

      </div>
    </main>
  );
}
