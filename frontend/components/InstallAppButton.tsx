"use client";

import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable) return null;

  return (
    <div className="w-full flex justify-center items-center pt-24 pb-2 bg-[#050716] relative z-20">
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff4dd2] to-[#8b5cf6] hover:from-[#ff7be0] hover:to-[#a78bfa] text-white font-bold rounded-full shadow-lg shadow-[#ff4dd2]/30 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer text-sm uppercase tracking-wider"
      >
        <Download size={18} />
        <span>Install App</span>
      </button>
    </div>
  );
}
