'use client';

import { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Activity, Target, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookiesPage() {
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedAnalytics = localStorage.getItem('cookie_analytics');
    const savedMarketing = localStorage.getItem('cookie_marketing');
    
    if (savedAnalytics !== null) setAnalytics(savedAnalytics === 'true');
    if (savedMarketing !== null) setMarketing(savedMarketing === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem('cookie_analytics', analytics.toString());
    localStorage.setItem('cookie_marketing', marketing.toString());
    
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <main className="min-h-screen bg-[#050716] pt-32 lg:pt-36 pb-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-[#f47521]/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[500px] bg-[#ff4dd2]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-[900px] relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-[#12131A] rounded-2xl border border-[#2A2B30] mb-6 shadow-2xl">
            <Cookie className="text-[#f47521] size-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f47521] to-[#ff4dd2] mb-4 uppercase tracking-tighter">
            Cookie Preferences
          </h1>
          <p className="text-[#a0a0a0] text-lg max-w-2xl mx-auto">
            We use cookies to improve your experience, personalize content, and analyze our traffic. You can customize your settings below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Preferences */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="text-[#ff4dd2]" /> Your Preferences
            </h2>

            {/* Essential Cookies */}
            <div className="bg-[#12131A]/80 backdrop-blur-xl border border-[#2A2B30] rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                    <ShieldCheck className="text-green-500 size-5" /> Essential Cookies
                  </h3>
                  <p className="text-[#8A8A93] text-sm leading-relaxed pr-6">
                    These cookies are strictly necessary to provide you with services available through our website (e.g., login sessions, security).
                  </p>
                </div>
                <div className="w-12 h-6 bg-[#25252D] border border-[#2A2B30] rounded-full flex items-center justify-end px-1 opacity-50 cursor-not-allowed shrink-0 mt-1">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2A2B30]/50 text-xs text-gray-500 font-medium uppercase tracking-wider">
                Always Active
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className={`bg-[#12131A]/80 backdrop-blur-xl border ${analytics ? 'border-[#ff4dd2]/50' : 'border-[#2A2B30]'} rounded-2xl p-6 shadow-lg transition-colors duration-300`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                    <Activity className="text-[#ff4dd2] size-5" /> Analytics Cookies
                  </h3>
                  <p className="text-[#8A8A93] text-sm leading-relaxed pr-6">
                    Help us understand how our website is being used so we can improve the platform and user experience.
                  </p>
                </div>
                <button 
                  onClick={() => setAnalytics(!analytics)}
                  className={`w-12 h-6 rounded-full flex items-center px-1 shrink-0 mt-1 transition-colors duration-300 ${analytics ? 'bg-[#ff4dd2]' : 'bg-[#25252D] border border-[#2A2B30]'}`}
                >
                  <motion.div 
                    layout 
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                    initial={false}
                    animate={{ x: analytics ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className={`bg-[#12131A]/80 backdrop-blur-xl border ${marketing ? 'border-[#ff4dd2]/50' : 'border-[#2A2B30]'} rounded-2xl p-6 shadow-lg transition-colors duration-300`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                    <Target className="text-[#ff4dd2] size-5" /> Marketing Cookies
                  </h3>
                  <p className="text-[#8A8A93] text-sm leading-relaxed pr-6">
                    Used to track visitors across websites to display relevant advertisements and track campaign performance.
                  </p>
                </div>
                <button 
                  onClick={() => setMarketing(!marketing)}
                  className={`w-12 h-6 rounded-full flex items-center px-1 shrink-0 mt-1 transition-colors duration-300 ${marketing ? 'bg-[#ff4dd2]' : 'bg-[#25252D] border border-[#2A2B30]'}`}
                >
                  <motion.div 
                    layout 
                    className="w-4 h-4 bg-white rounded-full shadow-md"
                    initial={false}
                    animate={{ x: marketing ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSave}
                className="w-full relative overflow-hidden group bg-gradient-to-r from-[#ff4dd2] to-[#ff4dd2] hover:from-[#ff4dd2] hover:to-[#0891B2] text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255, 77, 210,0.3)] hover:shadow-[0_0_30px_rgba(255, 77, 210,0.5)] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Save size={20} />
                <span>Save Preferences</span>
                
                {/* Save Confirmation Overlay */}
                <AnimatePresence>
                  {showSaved && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-green-500 flex items-center justify-center gap-2 text-white font-bold"
                    >
                      <CheckCircle2 size={20} /> Preferences Saved!
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>

          {/* Right Column: Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Cookie className="text-[#f47521]" /> Cookie Policy
            </h2>
            
            <div className="bg-[#121326]/60 backdrop-blur-xl border border-[#2A2B30]/40 rounded-2xl p-6 md:p-8">
              <h3 className="text-xl font-bold text-white mb-3">What are cookies?</h3>
              <p className="text-[#8A8A93] leading-relaxed mb-6">
                Cookies are small text files that are placed on your computer or mobile device when you browse websites. They are widely used to make websites work efficiently, as well as to provide information to the owners of the site.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">How we use them</h3>
              <p className="text-[#8A8A93] leading-relaxed mb-6">
                At Anime Nation India, we use cookies to remember your theme preferences, keep you logged into your account, and understand how you interact with our anime database so we can improve the UI and speed.
              </p>

              <h3 className="text-xl font-bold text-white mb-3">Third-party cookies</h3>
              <p className="text-[#8A8A93] leading-relaxed">
                We also utilize third-party APIs (like YouTube for trailers and AniList for data). These external services may also place their own cookies on your device when you interact with their embedded content on our platform.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
