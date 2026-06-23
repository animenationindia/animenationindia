'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', name: 'English (US)' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'es', name: 'Español (España)' }, // Note: Google translate usually just uses 'es'
  { code: 'fr', name: 'Français (France)' },
  { code: 'it', name: 'Italiano' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português (Brasil)' },
  { code: 'pt', name: 'Português (Portugal)' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'th', name: 'ไทย' }
];

export default function LanguageSelector({ direction = 'top' }: { direction?: 'top' | 'bottom' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Google Translate
  useEffect(() => {
    // Add Google Translate script if it doesn't exist
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element'
        );
      };
    }

    // Determine current language from localStorage first for reliable state matching
    const localLangName = localStorage.getItem('preferred_language_name');
    if (localLangName) {
      const found = languages.find(l => l.name === localLangName);
      if (found) {
        setSelectedLang(found);
        return;
      }
    }

    // Fallback: Determine current language from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const transCookie = getCookie('googtrans');
    if (transCookie) {
      const langCode = transCookie.split('/')[2];
      const found = languages.find(l => l.code === langCode);
      if (found) setSelectedLang(found);
    }
  }, []);

  const changeLanguage = (lang: typeof languages[0]) => {
    setSelectedLang(lang);
    setIsOpen(false);
    
    // Save selected language name to localStorage to persist state across reloads
    localStorage.setItem('preferred_language_name', lang.name);
    
    // Set cookie for Google Translate (translates from 'en' to selected lang)
    const cookieString = `/en/${lang.code}`;
    document.cookie = `googtrans=${cookieString}; path=/`;
    document.cookie = `googtrans=${cookieString}; path=/; domain=${window.location.hostname}`;
    
    // Reload page to apply translation
    window.location.reload();
  };

  const dropdownClasses = direction === 'top' 
    ? "absolute bottom-full right-0 mb-2 w-56 bg-[#25252D] border border-black rounded-sm shadow-2xl overflow-hidden z-[100] origin-bottom-right"
    : "absolute top-full right-0 mt-2 w-56 bg-[#25252D] border border-black rounded-sm shadow-2xl overflow-hidden z-[100] origin-top-right";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden container for Google Translate Widget positioned at top of viewport to prevent page jumping to footer on initialization */}
      <div id="google_translate_element" className="absolute top-0 left-0 w-0 h-0 opacity-0 overflow-hidden pointer-events-none"></div>
      
      {/* Main Button */}
      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-[#1B1B22] border border-[#2A2B30] hover:bg-[#25252D] text-gray-200 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer shadow-lg"
      >
        <Globe size={18} className="text-[#ffd54a]" /> 
        {selectedLang.name} 
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: direction === 'top' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === 'top' ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={dropdownClasses}
          >
            <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {languages.map((lang, idx) => (
                <button
                  key={idx}
                  onClick={() => changeLanguage(lang)}
                  className={`w-full text-left px-4 py-3 text-[13px] font-medium transition-colors flex items-center justify-between ${
                    selectedLang.name === lang.name 
                      ? 'bg-[#18181C] text-white' 
                      : 'text-[#A0A0A0] hover:bg-[#353540] hover:text-white'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
            {/* Bottom sticky indicator like Crunchyroll */}
            <div className="bg-[#1B1B22] border-t border-[#303038] px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                 <Globe size={16} /> {selectedLang.name}
              </div>
              <ChevronDown size={16} className="text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
