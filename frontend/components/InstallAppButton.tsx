"use client";

import React, { useEffect, useState } from "react";
import { Download, Monitor, Smartphone, X, Info, Apple } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"options" | "ios-guide" | "desktop-guide">("options");

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleDesktopInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      setIsModalOpen(false);
    } else {
      setActiveTab("desktop-guide");
    }
  };

  return (
    <>
      <div className="w-full flex justify-center items-center pt-24 pb-2 bg-[#050716] relative z-20">
        <button
          onClick={() => {
            setActiveTab("options");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff4dd2] to-[#8b5cf6] hover:from-[#ff7be0] hover:to-[#a78bfa] text-white font-bold rounded-full shadow-lg shadow-[#ff4dd2]/30 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer text-sm uppercase tracking-wider"
        >
          <Download size={18} />
          <span>Install App</span>
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[500px] bg-[#121326] border border-[#ff4dd2]/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[201]"
            >
              {/* Header */}
              <div className="relative p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-white tracking-wide">
                  {activeTab === "options" && "Install Anime Nation India"}
                  {activeTab === "ios-guide" && "iOS Installation Guide"}
                  {activeTab === "desktop-guide" && "Desktop PWA Guide"}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTab === "options" && "Select your platform to download or install the app."}
                  {activeTab === "ios-guide" && "Follow these simple steps to install on iPhone/iPad."}
                  {activeTab === "desktop-guide" && "How to install the Web App on your PC/Mac."}
                </p>
              </div>

              {/* Body */}
              <div className="p-6">
                {activeTab === "options" && (
                  <div className="flex flex-col gap-4">
                    {/* Option 1: Desktop PWA */}
                    <button
                      onClick={handleDesktopInstall}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#ff4dd2]/30 hover:bg-[#ff4dd2]/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="p-3 rounded-lg bg-white/5 text-[#ff4dd2] group-hover:scale-110 transition-transform">
                        <Monitor size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white">Desktop Application</h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">Install the web app on Windows, macOS, or Linux.</p>
                      </div>
                    </button>

                    {/* Option 2: Android APK */}
                    <a
                      href="https://github.com/animenationindia/animenationindia/raw/main/android-app/app/build/outputs/apk/debug/app-debug.apk"
                      download="AnimeNationIndia.apk"
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="p-3 rounded-lg bg-white/5 text-[#a4c639] group-hover:scale-110 transition-transform flex items-center justify-center">
                        {/* Android Icon SVG */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.523 15.3l1.816 3.146a.545.545 0 0 1-.19.743.543.543 0 0 1-.744-.189l-1.83-3.17a9.78 9.78 0 0 1-9.15 0l-1.83 3.17a.543.543 0 0 1-.743.189.545.545 0 0 1-.19-.743l1.815-3.146C3.967 13.684 2 11.082 2 8h20c0 3.082-1.967 5.684-4.477 7.3zM7 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM15.474 3.771l1.583-2.742a.543.543 0 0 1 .743-.19.545.545 0 0 1 .19.744L16.4 4.331C18.665 5.592 20 7.848 20 10H4c0-2.152 1.335-4.408 3.6-5.669L6.014 1.583a.545.545 0 0 1 .19-.744.543.543 0 0 1 .743.19l1.583 2.742C9.537 3.262 10.741 3 12 3c1.259 0 2.463.262 3.474.771z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white">Android Mobile App</h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">Download the native APK for Android phones and tablets.</p>
                      </div>
                    </a>

                    {/* Option 3: iOS IPA Guide */}
                    <button
                      onClick={() => setActiveTab("ios-guide")}
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#ff4dd2]/30 hover:bg-[#ff4dd2]/5 transition-all text-left group cursor-pointer"
                    >
                      <div className="p-3 rounded-lg bg-white/5 text-white group-hover:scale-110 transition-transform">
                        <Apple size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white">iPhone / iPad (iOS)</h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">Directly download the IPA and view the sideloading guide.</p>
                      </div>
                    </button>
                  </div>
                )}

                {activeTab === "ios-guide" && (
                  <div className="flex flex-col gap-4 text-gray-300 text-sm">
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <p>Click the <strong>Download iOS IPA</strong> button below to download the app installer file.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <p>Open <strong>Sideloadly</strong> or <strong>AltStore</strong> on your Windows PC or Mac.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] flex items-center justify-center font-bold text-xs shrink-0">3</span>
                        <p>Connect your iPhone/iPad, drag the downloaded <code>AnimeNationIndia.ipa</code> file inside, enter your Apple ID, and click <strong>Start</strong> to install.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] flex items-center justify-center font-bold text-xs shrink-0">4</span>
                        <p>On your device, go to <strong>Settings &gt; General &gt; VPN &amp; Device Management</strong> and trust your Apple ID profile to open the app.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <a
                        href="https://github.com/animenationindia/animenationindia/raw/main/ios-app/build-artifact/AnimeNationIndia.ipa"
                        download="AnimeNationIndia.ipa"
                        className="flex-1 py-2.5 bg-[#ff4dd2] hover:bg-[#e03eb7] text-white text-center font-bold rounded-lg text-xs tracking-wider uppercase transition-colors"
                      >
                        Download iOS IPA
                      </a>
                      <button
                        onClick={() => setActiveTab("options")}
                        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white text-center font-bold rounded-lg text-xs tracking-wider uppercase border border-white/10 transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "desktop-guide" && (
                  <div className="flex flex-col gap-4 text-gray-300 text-sm">
                    <div className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/10 items-start">
                      <Info className="text-[#ff4dd2] shrink-0 mt-0.5" size={18} />
                      <p className="text-xs leading-relaxed text-gray-400">
                        PWA installation prompt could not be triggered automatically. This usually happens if you have already installed the app or are using an unsupported browser.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                        <p>Open this website in Google Chrome, Microsoft Edge, or Safari.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                        <p>Look at your browser's address bar for an <strong>Install icon</strong> (monitor with down arrow) and click it.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 text-[#ff4dd2] flex items-center justify-center font-bold text-xs shrink-0">3</span>
                        <p>Alternatively, click your browser menu (three dots or share button) and select <strong>"Save Page as App"</strong> or <strong>"Add to Home Screen"</strong>.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("options")}
                      className="w-full mt-2 py-2.5 bg-white/5 hover:bg-white/10 text-white text-center font-bold rounded-lg text-xs tracking-wider uppercase border border-white/10 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
